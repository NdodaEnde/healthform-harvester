
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the API key
    const authHeader = req.headers.get('Authorization') || '';
    const apiKey = authHeader.replace('Bearer ', '');
    
    if (apiKey !== Deno.env.get('SDK_MICROSERVICE_API_KEY')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get the callback data
    const callbackData = await req.json();
    const { documentId, status, extractedData, processingError } = callbackData;
    
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'Missing documentId parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Update the document record with the provided data
    const updateData: any = {
      status: status || 'processed',
      processed_at: new Date().toISOString()
    };
    
    // Add extracted data if provided
    if (extractedData) {
      updateData.extracted_data = extractedData;
    }
    
    // Add error message if provided
    if (processingError) {
      updateData.processing_error = processingError;
      updateData.status = 'failed';
    }

    // Update the document record
    const { data, error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .select();

    if (error) {
      console.error('Error updating document:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update document', details: error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // If patient data was included, create or update patient record
    if (extractedData?.structured_data?.patient && status === 'processed') {
      try {
        // Get document to retrieve organization context
        const { data: documentData } = await supabase
          .from('documents')
          .select('organization_id, client_organization_id, document_type')
          .eq('id', documentId)
          .single();
          
        if (documentData) {
          // Call the existing document processor logic to create/update patient
          await createOrUpdatePatientFromDocument(
            extractedData.structured_data, 
            documentData.document_type,
            { id: documentId, ...documentData, processed_at: new Date().toISOString() },
            supabase
          );
        }
      } catch (patientError) {
        console.error('Error processing patient data:', patientError);
        // Don't fail the request, just log the error
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Document update successful', 
        documentId,
        status: updateData.status
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to create or update patient from document data
// Simplified version of the function in document-processor.ts
async function createOrUpdatePatientFromDocument(structuredData: any, documentType: string, documentData: any, supabase: any) {
  try {
    console.log('Creating or updating patient from document data');
    
    // Extract patient information based on document type
    let patientInfo;
    if (documentType === 'medical-questionnaire') {
      patientInfo = extractPatientInfo(structuredData, 'questionnaire');
    } else {
      patientInfo = extractPatientInfo(structuredData, 'certificate');
    }
    
    if (!patientInfo || !patientInfo.firstName || !patientInfo.lastName) {
      console.log('WARNING: Insufficient patient information to create a record');
      return;
    }

    // Check if patient already exists with the same name and organization
    const { data: existingPatients, error: searchError } = await supabase
      .from('patients')
      .select('*')
      .eq('first_name', patientInfo.firstName)
      .eq('last_name', patientInfo.lastName)
      .eq('organization_id', documentData.organization_id);
      
    if (searchError) {
      console.error('Error searching for existing patients:', searchError);
      return;
    }
    
    // Prepare medical history data if available
    const medicalHistory = documentType === 'medical-questionnaire' 
      ? structuredData.medical_history 
      : {};
    
    if (existingPatients && existingPatients.length > 0) {
      console.log('Updating existing patient record:', existingPatients[0].id);
      
      // Update existing patient
      await supabase
        .from('patients')
        .update({
          gender: patientInfo.gender || existingPatients[0].gender || 'unknown',
          medical_history: {
            ...existingPatients[0].medical_history,
            ...medicalHistory,
            documents: [
              ...(existingPatients[0].medical_history?.documents || []),
              { 
                document_id: documentData.id,
                document_type: documentType,
                processed_at: documentData.processed_at
              }
            ]
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPatients[0].id);
      
    } else {
      console.log('Creating new patient record');
      
      // Create new patient record
      await supabase
        .from('patients')
        .insert({
          first_name: patientInfo.firstName,
          last_name: patientInfo.lastName,
          gender: patientInfo.gender || 'unknown',
          date_of_birth: patientInfo.dateOfBirth || new Date().toISOString().split('T')[0],
          medical_history: {
            ...medicalHistory,
            documents: [{
              document_id: documentData.id,
              document_type: documentType,
              processed_at: documentData.processed_at
            }]
          },
          organization_id: documentData.organization_id,
          client_organization_id: documentData.client_organization_id
        });
    }
    
  } catch (error) {
    console.error('Error creating/updating patient from document:', error);
  }
}

// Helper function to extract patient info from document data
function extractPatientInfo(data: any, type: 'questionnaire' | 'certificate') {
  if (!data || !data.patient) return null;
  
  const patientData = data.patient;
  const names = patientData.name ? patientData.name.split(' ') : ['Unknown', 'Patient'];
  
  return {
    firstName: names[0] || 'Unknown',
    lastName: names.length > 1 ? names.slice(1).join(' ') : 'Patient',
    dateOfBirth: patientData.date_of_birth || null,
    gender: patientData.gender || 'unknown',
    employeeId: patientData.employee_id || patientData.id_number || null,
  };
}
