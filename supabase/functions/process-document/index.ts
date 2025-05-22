
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Use environment variable for API endpoint with the correct name
const microserviceUrl = Deno.env.get('SDK_MICROSERVICE_URL') || 'https://document-processing-service.onrender.com';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Parse the request body
    const formData = await req.formData();
    const file = formData.get('file');
    const documentType = formData.get('documentType') || 'unknown';
    const userId = formData.get('userId');

    if (!file || !(file instanceof File)) {
      throw new Error('No file provided');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log(`Processing document of type: ${documentType}`);
    console.log(`File name: ${file.name}, size: ${file.size} bytes`);

    // Create a new form data to send to the microservice
    const forwardFormData = new FormData();
    forwardFormData.append('files', file);
    
    console.log("Sending document to microservice for processing...");
    console.log("Using microservice URL:", microserviceUrl);
    
    // Step 1: Send the file to the microservice
    const initialResponse = await fetch(`${microserviceUrl}/process-documents`, {
      method: 'POST',
      body: forwardFormData
    });

    if (!initialResponse.ok) {
      const errorText = await initialResponse.text();
      console.error("Microservice error:", errorText);
      throw new Error(`Microservice error: ${initialResponse.status} - ${errorText}`);
    }

    const initialResult = await initialResponse.json();
    console.log("Initial processing complete. Batch ID:", initialResult.batch_id);
    
    // Step 2: Retrieve the processed data using the batch ID
    const dataResponse = await fetch(`${microserviceUrl}/get-document-data/${initialResult.batch_id}`);
    
    if (!dataResponse.ok) {
      const errorText = await dataResponse.text();
      console.error("Error retrieving document data:", errorText);
      throw new Error(`Data retrieval error: ${dataResponse.status} - ${errorText}`);
    }

    const documentData = await dataResponse.json();
    console.log("Document data retrieved successfully");
    
    // Extract the first document result (assuming single file upload)
    const documentResult = documentData.result && documentData.result.length > 0 
      ? documentData.result[0] 
      : null;
      
    if (!documentResult) {
      throw new Error("No document processing results returned");
    }
    
    // Store file in Storage
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${timestamp}_${documentType}.${fileExt}`;
    
    console.log(`Uploading file to storage: ${filePath}`);
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Storage error: ${uploadError.message}`);
    }
    
    // Get public URL for the file
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
      
    // Create document record in database
    const documentRecord = {
      user_id: userId,
      organization_id: null, // Will be updated after insertion
      file_path: filePath,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      public_url: publicUrl,
      document_type: documentType,
      status: 'processing',
      extracted_data: {
        raw_content: documentResult.markdown,
        structured_data: documentResult.data,
        metadata: documentResult.metadata,
      }
    };
    
    console.log("Creating document record in database");
    const { data: insertedDoc, error: insertError } = await supabase
      .from('documents')
      .insert(documentRecord)
      .select()
      .single();
      
    if (insertError) {
      console.error("Database insert error:", insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }
    
    console.log("Document processed and stored successfully:", insertedDoc.id);
    
    // Cleanup on the microservice side (in background)
    fetch(`${microserviceUrl}/cleanup/${initialResult.batch_id}`, {
      method: 'DELETE'
    }).catch(error => {
      console.error("Error cleaning up temporary files:", error);
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        documentId: insertedDoc.id,
        message: "Document processed successfully",
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error("Error processing document:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
});
