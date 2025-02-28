
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

    // 3. Get file URL for API call
    const { data: fileUrlData } = await supabase
      .storage
      .from('medical-documents')
      .createSignedUrl(filePath, 60); // 60 seconds expiry

    if (!fileUrlData?.signedUrl) {
      return new Response(
        JSON.stringify({ error: 'Failed to create signed URL for file' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // 4. Simulate document processing
    // In a real implementation, you would call an external API for document processing
    // For now, we'll simulate it with a mock extracted data response
    const documentId = documentData.id;
    
    // Start background task for document processing
    const processingPromise = simulateDocumentProcessing(file, documentType, documentId, supabase);
    // @ts-ignore - Deno specific API
    EdgeRuntime.waitUntil(processingPromise);

    // 5. Return immediate success response with document ID
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

// Simulate document processing with mock data
async function simulateDocumentProcessing(file: File, documentType: string, documentId: string, supabase: any) {
  try {
    console.log(`Starting document processing simulation for document ID: ${documentId}`);
    
    // Wait a few seconds to simulate processing time
    await new Promise(resolve => setTimeout(resolve, 5000));
    
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
  }
}
