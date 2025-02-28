
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

    // 3. Start document processing in the background
    const documentId = documentData.id;
    
    // Start background task for document processing
    const processingPromise = processDocumentWithLandingAI(file, documentType, documentId, supabase);
    // @ts-ignore - Deno specific API
    EdgeRuntime.waitUntil(processingPromise);

    // 4. Return immediate success response with document ID
    return new Response(
      JSON.stringify({ 
        message: 'Document upload started', 
        documentId: documentId,
        status: 'processing'
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

// Process document with Landing AI API
async function processDocumentWithLandingAI(file: File, documentType: string, documentId: string, supabase: any) {
  try {
    console.log(`Starting document processing with Landing AI for document ID: ${documentId}`);
    
    // Get API key
    const landingAiApiKey = Deno.env.get('LANDING_AI_API_KEY') || 'bHQ2cjl2b2l2Nmx2Nm4xemsxMHJhOk5QVXh1cjR2TngxMHJCZ2dtNWl2dEh5emk5cXMxNVM5';
    
    if (!landingAiApiKey) {
      throw new Error('Landing AI API key is not configured');
    }
    
    console.log(`Calling Landing AI API for document type: ${documentType}`);
    
    // API endpoint
    const apiUrl = 'https://api.va.landing.ai/v1/tools/agentic-document-analysis';
    
    // Create form data for API request
    const apiFormData = new FormData();
    
    // Determine if we should use 'image' or 'pdf' based on file type
    const isPdf = file.type.includes('pdf');
    
    // Instead of downloading from storage, use the original file
    if (isPdf) {
      console.log('Adding PDF file to request');
      apiFormData.append('pdf', file, file.name);
    } else {
      console.log('Adding image file to request');
      apiFormData.append('image', file, file.name);
    }
    
    // Call Landing AI API with Basic Auth
    console.log(`Making request to Landing AI API with ${isPdf ? 'PDF' : 'image'} file`);
    console.log(`File name: ${file.name}, File type: ${file.type}, File size: ${file.size} bytes`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${landingAiApiKey}`
      },
      body: apiFormData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: Status ${response.status}, Body: ${errorText}`);
      throw new Error(`Landing AI API error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`Landing AI API response received for document ID: ${documentId}`);
    console.log(`Response: ${JSON.stringify(result)}`);
    
    // Process and structure the data based on document type
    let structuredData;
    if (documentType === 'medical-questionnaire') {
      structuredData = processMedicalQuestionnaireData(result);
    } else {
      structuredData = processCertificateOfFitnessData(result);
    }
    
    // Update the document record with the extracted data
    const { data: updateData, error: updateError } = await supabase
      .from('documents')
      .update({
        extracted_data: {
          structured_data: structuredData,
          raw_response: result
        },
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select();
    
    if (updateError) {
      console.error('Failed to update document with extracted data:', updateError);
      throw updateError;
    }
    
    console.log(`Document processing completed for document ID: ${documentId}`);
    console.log('Updated document record:', updateData);
    
    // Verify the document was updated
    const { data: verifyData, error: verifyError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();
      
    if (verifyError) {
      console.error('Error verifying document update:', verifyError);
    } else {
      console.log(`Verified document status is now: ${verifyData.status}`);
    }
    
  } catch (error) {
    console.error('Document processing error:', error);
    
    // Update document status to failed with error message
    try {
      const { data, error: updateError } = await supabase
        .from('documents')
        .update({
          status: 'failed',
          processing_error: error.message
        })
        .eq('id', documentId)
        .select();
        
      if (updateError) {
        console.error('Error updating document status to failed:', updateError);
      } else {
        console.log('Updated document status to failed:', data);
      }
    } catch (updateError) {
      console.error('Error updating document status after processing failure:', updateError);
    }
  }
}

// Process medical questionnaire data from Landing AI response
function processMedicalQuestionnaireData(apiResponse: any) {
  try {
    // Extract fields from AI response
    const extractedData = apiResponse.result || {};
    
    // Build structured data object from API response
    return {
      patient: {
        name: extractPath(extractedData, 'patient.name') || 'Unknown',
        date_of_birth: extractPath(extractedData, 'patient.date_of_birth') || '',
        employee_id: extractPath(extractedData, 'patient.id') || '',
        gender: extractPath(extractedData, 'patient.gender') || ''
      },
      medical_history: {
        has_hypertension: checkCondition(extractedData, 'medical_history.conditions', 'hypertension'),
        has_diabetes: checkCondition(extractedData, 'medical_history.conditions', 'diabetes'),
        has_heart_disease: checkCondition(extractedData, 'medical_history.conditions', 'heart disease'),
        has_allergies: extractPath(extractedData, 'medical_history.allergies')?.length > 0,
        allergies: extractPath(extractedData, 'medical_history.allergies') || []
      },
      current_medications: extractPath(extractedData, 'medications') || [],
      questionnaire_date: extractPath(extractedData, 'date') || new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Error processing medical questionnaire data:', error);
    // Return basic structure with default values on error
    return {
      patient: {
        name: "Unknown",
        employee_id: "Unknown"
      },
      medical_history: {},
      questionnaire_date: new Date().toISOString().split('T')[0]
    };
  }
}

// Process certificate of fitness data from Landing AI response
function processCertificateOfFitnessData(apiResponse: any) {
  try {
    // Extract fields from AI response
    const extractedData = apiResponse.result || {};
    
    // Build structured data object from API response
    return {
      patient: {
        name: extractPath(extractedData, 'patient.name') || 'Unknown',
        date_of_birth: extractPath(extractedData, 'patient.date_of_birth') || '',
        employee_id: extractPath(extractedData, 'patient.id') || '',
        gender: extractPath(extractedData, 'patient.gender') || ''
      },
      examination: {
        date: extractPath(extractedData, 'examination.date') || new Date().toISOString().split('T')[0],
        physician: extractPath(extractedData, 'examination.physician') || '',
        fitness_status: extractPath(extractedData, 'examination.fitness_status') || 'Unknown',
        restrictions: extractPath(extractedData, 'examination.restrictions') || 'None',
        next_examination_date: extractPath(extractedData, 'examination.next_date') || ''
      }
    };
  } catch (error) {
    console.error('Error processing certificate of fitness data:', error);
    // Return basic structure with default values on error
    return {
      patient: {
        name: "Unknown",
        employee_id: "Unknown"
      },
      examination: {
        date: new Date().toISOString().split('T')[0],
        fitness_status: "Unknown"
      }
    };
  }
}

// Helper function to safely extract nested properties from an object
function extractPath(obj: any, path: string): any {
  if (!obj) return undefined;
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

// Helper function to check if a condition exists in an array of conditions
function checkCondition(data: any, path: string, condition: string): boolean {
  const conditions = extractPath(data, path);
  if (!Array.isArray(conditions)) return false;
  
  return conditions.some((item: string) => 
    typeof item === 'string' && item.toLowerCase().includes(condition.toLowerCase())
  );
}
