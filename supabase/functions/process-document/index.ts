
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const documentType = formData.get('documentType');

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Upload file to Supabase Storage
    const fileName = file.name;
    const fileExt = fileName.split('.').pop();
    const filePath = `documents/${crypto.randomUUID()}.${fileExt}`;
    
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('medical-documents')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (storageError) {
      console.error('Storage error:', storageError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file to storage', details: storageError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // 2. Create document record in the database
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        file_name: fileName,
        file_path: filePath,
        document_type: documentType,
        mime_type: file.type,
        status: 'processing'
      })
      .select()
      .single();

    if (documentError) {
      console.error('Document insert error:', documentError);
      return new Response(
        JSON.stringify({ error: 'Failed to create document record', details: documentError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const documentId = documentData.id;
    
    // Important: Complete the document processing immediately instead of in background
    // This makes sure the processing happens before the function times out
    await processDocument(file, documentType, documentId, supabase);

    // Return success response with document ID
    return new Response(
      JSON.stringify({ 
        message: 'Document processed successfully', 
        documentId: documentId,
        status: 'processed'
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

// Process document with mock data immediately instead of in background
async function processDocument(file: File, documentType: string, documentId: string, supabase: any) {
  try {
    console.log(`Starting document processing for document ID: ${documentId}`);
    
    // Generate mock extracted data based on document type
    let extractedData;
    
    if (documentType === 'medical-questionnaire') {
      extractedData = {
        structured_data: {
          patient: {
            name: "John Smith",
            date_of_birth: "1982-05-15",
            employee_id: "EMP123456",
            gender: "Male"
          },
          medical_history: {
            has_hypertension: true,
            has_diabetes: false,
            has_heart_disease: false,
            has_allergies: true,
            allergies: ["Penicillin", "Peanuts"]
          },
          current_medications: [
            "Lisinopril 10mg daily",
            "Cetirizine 10mg as needed"
          ],
          questionnaire_date: new Date().toISOString().split('T')[0]
        },
        raw_text: "Mock extraction of medical questionnaire content"
      };
    } else {
      // Certificate of fitness
      extractedData = {
        structured_data: {
          patient: {
            name: "Jane Doe",
            date_of_birth: "1990-08-22",
            employee_id: "EMP789012",
            gender: "Female"
          },
          examination: {
            date: new Date().toISOString().split('T')[0],
            physician: "Dr. Robert Williams",
            fitness_status: "Fit for duty",
            restrictions: "None",
            next_examination_date: "2025-02-28"
          }
        },
        raw_text: "Mock extraction of certificate of fitness content"
      };
    }
    
    // Simulate API call time
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Received API response for document ID: ${documentId}`);
    
    // Update the document record with the extracted data
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extracted_data: extractedData,
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId);
    
    if (updateError) {
      console.error('Failed to update document with extracted data:', updateError);
      throw updateError;
    }
    
    console.log(`Document processing completed for document ID: ${documentId}`);
    return true;
    
  } catch (error) {
    console.error('Document processing error:', error);
    
    // Update document status to failed
    await supabase
      .from('documents')
      .update({
        status: 'failed',
        processing_error: error.message
      })
      .eq('id', documentId);
      
    return false;
  }
}
