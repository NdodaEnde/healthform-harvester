
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

    // 4. Call the LandingAI API for document extraction
    // Use background task to avoid timing out the response
    const documentId = documentData.id;
    
    // Start background task
    const processingPromise = processDocumentWithAPI(file, documentId, supabase);
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

// Background task to process document with the API
async function processDocumentWithAPI(file: File, documentId: string, supabase: any) {
  try {
    console.log(`Starting document processing for document ID: ${documentId}`);
    
    // Create a new FormData for the API request
    const apiFormData = new FormData();
    
    // Append the file with the correct key based on type
    if (file.type.includes('pdf')) {
      apiFormData.append('pdf', file);
    } else {
      apiFormData.append('image', file);
    }
    
    // Call the Landing AI API
    const response = await fetch('https://api.va.landing.ai/v1/tools/agentic-document-analysis', {
      method: 'POST',
      body: apiFormData,
      headers: {
        'Authorization': 'Basic bHQ2cjl2b2l2Nmx2Nm4xemsxMHJhOk5QVXh1cjR2TngxMHJCZ2dtNWl2dEh5emk5cXMxNVM5',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const extractedData = await response.json();
    console.log(`Received API response for document ID: ${documentId}`);
    
    // Update the document record with the extracted data
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extracted_data: extractedData,
        status: 'processed'
      })
      .eq('id', documentId);
    
    if (updateError) {
      console.error('Failed to update document with extracted data:', updateError);
      return;
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
