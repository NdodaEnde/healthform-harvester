
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { processDocumentWithLandingAI } from "./document-processor.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
}

serve(async (req) => {
  console.log("Function called: process-document");

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    console.log("Processing document request");
    const formData = await req.formData();
    const file = formData.get('file');
    const documentType = formData.get('documentType');
    const userId = formData.get('userId');
    const templateName = formData.get('templateName');
    const category = formData.get('category');

    console.log(`Received request: file=${file ? (file as File).name : 'none'}, type=${documentType}, userId=${userId}, templateName=${templateName}, category=${category}`);

    if (!file) {
      console.error("No file uploaded");
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { headers: corsHeaders, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Upload file to Supabase Storage - organize by user ID for security
    const fileName = (file as File).name;
    const fileExt = fileName.split('.').pop();
    
    // Generate a folder structure based on userID
    const userFolder = userId ? `${userId}` : 'anonymous';
    const filePath = `${userFolder}/documents/${crypto.randomUUID()}.${fileExt}`;
    
    console.log(`Uploading file to ${filePath}`);
    
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('medical-documents')
      .upload(filePath, file, {
        contentType: (file as File).type,
        upsert: false
      });

    if (storageError) {
      console.error('Storage error:', storageError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file to storage', details: storageError }),
        { headers: corsHeaders, status: 500 }
      );
    }

    // 2. Create document record in the database
    console.log("Creating document record");
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        file_name: fileName,
        file_path: filePath,
        document_type: documentType,
        mime_type: (file as File).type,
        status: 'processing'
      })
      .select()
      .single();

    if (documentError) {
      console.error('Document insert error:', documentError);
      return new Response(
        JSON.stringify({ error: 'Failed to create document record', details: documentError }),
        { headers: corsHeaders, status: 500 }
      );
    }

    // 3. Start document processing in the background
    const documentId = documentData.id;
    console.log(`Starting background processing for document ID: ${documentId}`);
    
    // Start background task for document processing with the new parameters
    const processingPromise = processDocumentWithLandingAI(
      file as File, 
      documentType as string, 
      documentId, 
      supabase,
      templateName as string,
      category as string
    );
    
    try {
      // @ts-ignore - Deno specific API
      EdgeRuntime.waitUntil(processingPromise);
    } catch (waitError) {
      console.error("Error in EdgeRuntime.waitUntil:", waitError);
      // Continue processing even if waitUntil fails
    }

    // 4. Return immediate success response with document ID
    console.log("Returning success response");
    const response = {
      message: 'Document upload started', 
      documentId: documentId,
      status: 'processing'
    };
    
    console.log("Response payload:", JSON.stringify(response));
    
    return new Response(
      JSON.stringify(response),
      { 
        headers: corsHeaders, 
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
