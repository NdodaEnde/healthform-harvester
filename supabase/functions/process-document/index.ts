
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { processDocumentWithLandingAI } from "./document-processor.ts"

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
    const formData = await req.formData();
    const file = formData.get('file');
    const documentType = formData.get('documentType');
    const userId = formData.get('userId');

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

    // 1. Upload file to Supabase Storage - organize by user ID for security
    const fileName = file.name;
    const fileExt = fileName.split('.').pop();
    
    // Generate a folder structure based on userID
    const userFolder = userId ? `${userId}` : 'anonymous';
    const filePath = `${userFolder}/documents/${crypto.randomUUID()}.${fileExt}`;
    
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
    
    try {
      // Create a copy of the file for processing to avoid streaming issues
      // This is crucial because the formData entries can only be read once
      const fileArrayBuffer = await file.arrayBuffer();
      const fileBlob = new Blob([fileArrayBuffer], { type: file.type });
      const fileCopy = new File([fileBlob], file.name, { type: file.type });
      
      // Start background task for document processing with the copy of the file
      console.log(`Starting background processing for document ${documentId} (${fileName})`);
      const processingPromise = processDocumentWithLandingAI(fileCopy, documentType, documentId, supabase);
      
      // Use EdgeRuntime.waitUntil to ensure the processing continues even after response is sent
      // @ts-ignore - Deno specific API
      EdgeRuntime.waitUntil(processingPromise.catch(error => {
        console.error(`Error in background processing for document ${documentId}:`, error);
        // Try to update document status to failed if there's an error
        return supabase
          .from('documents')
          .update({
            status: 'failed',
            processing_error: error.message || 'Unknown error during processing'
          })
          .eq('id', documentId)
          .then(() => {
            console.error(`Updated document ${documentId} status to failed due to background processing error`);
          })
          .catch(updateError => {
            console.error(`Failed to update document ${documentId} status after processing error:`, updateError);
          });
      }));
    } catch (processingSetupError) {
      console.error(`Error setting up document processing for ${documentId}:`, processingSetupError);
      // Don't fail the request, but log the error
    }

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
