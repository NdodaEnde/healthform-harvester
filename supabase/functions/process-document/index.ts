
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
    console.log("Document data content:", JSON.stringify(documentData).substring(0, 200) + "...");
    
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
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Storage error: ${uploadError.message}`);
    }
    
    // Generate public URL if needed
    let publicUrl = null;
    try {
      const { data: urlData } = await supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      if (urlData) {
        publicUrl = urlData.publicUrl;
        console.log("Generated public URL:", publicUrl);
      }
    } catch (urlError) {
      console.warn("Could not generate public URL:", urlError);
      // Continue without public URL
    }
    
    // Determine document status based on extracted data
    // Check if we have meaningful structured data
    const rawContent = typeof documentResult.markdown === 'string' ? documentResult.markdown : 
                      (documentResult.data && typeof documentResult.data.markdown === 'string' ? 
                        documentResult.data.markdown : "");
    
    // Build structured data object carefully
    let structuredData = documentResult.data || documentResult.structured_data || {};
    
    // Convert to proper object if it's a string
    if (typeof structuredData === 'string') {
      try {
        structuredData = JSON.parse(structuredData);
      } catch (e) {
        console.warn("Failed to parse structured data string:", e);
        structuredData = {};
      }
    }
    
    // Final check to ensure structuredData is an object
    if (typeof structuredData !== 'object' || structuredData === null) {
      structuredData = {};
    }
    
    const hasStructuredData = Object.keys(structuredData).length > 0;
    
    // Set status based on data quality
    let documentStatus = 'pending';
    
    if (hasStructuredData) {
      documentStatus = 'processed';
      console.log("Document has structured data, marking as 'processed'");
    } else if (rawContent && rawContent.length > 0) {
      documentStatus = 'extracted';
      console.log("Document has raw content but no structured data, marking as 'extracted'");
    } else {
      documentStatus = 'failed';
      console.log("Document has no meaningful data, marking as 'failed'");
    }
    
    // Create document record in database
    const documentRecord = {
      user_id: userId,
      owner_id: userId, // Also set owner_id for backward compatibility
      organization_id: null, // Will be updated after insertion
      file_path: filePath,
      file_name: file.name,
      mime_type: file.type,
      document_type: documentType,
      status: documentStatus, // Set status based on data quality
      public_url: publicUrl, // Add the public URL if available
      extracted_data: {
        raw_content: rawContent,
        structured_data: structuredData,
        metadata: documentResult.metadata || {}
      }
    };
    
    console.log(`Creating document record in database with status '${documentStatus}'`);
    console.log("Extracted data preview:", 
      JSON.stringify({
        raw_content_length: documentRecord.extracted_data.raw_content?.length || 0,
        structured_data_keys: Object.keys(documentRecord.extracted_data.structured_data || {})
      })
    );
    
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
    console.log("Document status:", insertedDoc.status);
    console.log("Extracted data present:", !!insertedDoc.extracted_data);
    
    // Verification step to ensure the document status is correct
    const { data: verifyData, error: verifyError } = await supabase
      .from('documents')
      .select('status, extracted_data')
      .eq('id', insertedDoc.id)
      .single();
      
    if (verifyError) {
      console.error("Verification error:", verifyError);
    } else {
      console.log("Final document status:", verifyData.status);
      console.log("Final extracted data present:", !!verifyData.extracted_data);
    }
    
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
        status: documentStatus,
        message: `Document ${documentStatus}`,
        hasStructuredData: hasStructuredData,
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
