
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
    console.log("Document data content:", JSON.stringify(documentData).substring(0, 500) + "...");
    
    // Extract the first document result (assuming single file upload)
    const documentResult = documentData.result && documentData.result.length > 0 
      ? documentData.result[0] 
      : null;
      
    if (!documentResult) {
      throw new Error("No document processing results returned");
    }
    
    // Store file in Storage - IMPROVED ERROR HANDLING HERE
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${timestamp}_${documentType}.${fileExt}`;
    
    console.log(`Uploading file to storage: ${filePath}`);
    
    // FIX: Use try/catch specifically for storage operations - IMPROVED WITH BETTER FILE HANDLING
    let uploadData = null;
    let publicUrl = null;
    
    try {
      // Create a blob copy of the file to ensure it's properly formatted for storage
      const fileBuffer = await file.arrayBuffer();
      const fileBlob = new Blob([fileBuffer], { type: file.type });
      
      // Attempt to upload to storage with proper content type
      const { data: storageData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, fileBlob, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false // Don't overwrite existing files
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }
      
      uploadData = storageData;
      
      // Get public URL if upload successful - IMPROVED URL GENERATION
      const { data: urlData } = await supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      if (urlData) {
        publicUrl = urlData.publicUrl;
        // Validate the URL is working by making a HEAD request - this can help detect issues
        try {
          const urlCheck = await fetch(publicUrl, { method: 'HEAD' });
          if (!urlCheck.ok) {
            console.warn(`Generated URL verification failed with status: ${urlCheck.status}`);
          } else {
            console.log("Generated public URL verified:", publicUrl);
          }
        } catch (urlCheckError) {
          console.warn("Could not verify URL:", urlCheckError);
        }
      }
    } catch (storageError) {
      console.error("Failed to upload to storage, proceeding without file storage:", storageError);
      // Set default values but continue processing - don't terminate completely
      uploadData = null;
      publicUrl = null;
      // Continue with document processing even if storage fails
    }
    
    // Extract data properly from the microservice response
    const rawContent = documentResult.markdown || "";
    const chunks = documentResult.chunks || [];
    const extractedText = documentResult.markdown || "";
    
    console.log("=== DEBUGGING DATA EXTRACTION ===");
    console.log("Raw content length:", rawContent.length);
    console.log("Raw content first 200 chars:", rawContent.substring(0, 200));
    console.log("Document type:", documentType);
    console.log("Chunks count:", chunks.length);
    
    // Process chunks to create structured data
    const structuredData: any = {};
    
    // Group chunks by type for easier access
    const chunksByType = chunks.reduce((acc: any, chunk: any) => {
      const type = chunk.chunk_type || chunk.type || 'unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push({
        text: chunk.text || chunk.content || '',
        chunk_id: chunk.chunk_id || '',
        grounding: chunk.grounding || []
      });
      return acc;
    }, {});
    
    console.log("Chunks by type:", Object.keys(chunksByType));
    
    // Extract specific information based on chunk types
    if (chunksByType.form) {
      structuredData.forms = chunksByType.form;
      console.log("Added forms to structured data, count:", chunksByType.form.length);
    }
    
    if (chunksByType.table) {
      structuredData.tables = chunksByType.table;
      console.log("Added tables to structured data, count:", chunksByType.table.length);
    }
    
    if (chunksByType.figure) {
      structuredData.figures = chunksByType.figure;
      console.log("Added figures to structured data, count:", chunksByType.figure.length);
    }
    
    // NEW: Handle the consolidated chunk types from agentic-doc v0.2.1
    if (chunksByType.text) {
      structuredData.text_chunks = chunksByType.text;
      console.log("Added text chunks to structured data, count:", chunksByType.text.length);
    }
    
    if (chunksByType.marginalia) {
      structuredData.marginalia = chunksByType.marginalia;
      console.log("Added marginalia to structured data, count:", chunksByType.marginalia.length);
    }
    
    // For certificate documents, extract specific fields
    console.log("Checking if document type matches certificate patterns...");
    if (documentType === 'certificate-fitness' || documentType === 'certificate' || rawContent.toLowerCase().includes('certificate')) {
      console.log("Processing as certificate document");
      
      // Try to extract structured information from the text
      const certificateInfo: any = {};
      
      console.log("=== CERTIFICATE EXTRACTION DEBUG ===");
      console.log("Raw content preview (first 500 chars):");
      console.log(rawContent.substring(0, 500));
      
      // Simple test extraction first
      if (rawContent.includes('NKOSI')) {
        certificateInfo.test_field = 'Found NKOSI in document';
        console.log("✓ Test extraction successful: Found NKOSI");
      }
      
      // Extract employee info - more flexible patterns
      const namePattern = /Initials\s*&?\s*Surname:\s*([^\n\r]+)/i;
      const nameMatch = rawContent.match(namePattern);
      if (nameMatch) {
        certificateInfo.employee_name = nameMatch[1].trim();
        console.log("✓ Found employee name:", certificateInfo.employee_name);
      } else {
        console.log("✗ Employee name pattern not found");
        console.log("Looking for 'Initials' in text:", rawContent.includes('Initials'));
        console.log("Looking for 'Surname' in text:", rawContent.includes('Surname'));
      }
      
      const idPattern = /ID\s*No:?\s*([^\n\r]+)/i;
      const idMatch = rawContent.match(idPattern);
      if (idMatch) {
        certificateInfo.id_number = idMatch[1].trim();
        console.log("✓ Found ID number:", certificateInfo.id_number);
      } else {
        console.log("✗ ID number pattern not found");
        console.log("Looking for 'ID No' in text:", rawContent.includes('ID No'));
      }
      
      const companyPattern = /Company\s*Name:\s*([^\n\r]+)/i;
      const companyMatch = rawContent.match(companyPattern);
      if (companyMatch) {
        certificateInfo.company_name = companyMatch[1].trim();
        console.log("✓ Found company name:", certificateInfo.company_name);
      } else {
        console.log("✗ Company name pattern not found");
        console.log("Looking for 'Company Name' in text:", rawContent.includes('Company Name'));
      }
      
      console.log("Final certificate info keys:", Object.keys(certificateInfo));
      
      if (Object.keys(certificateInfo).length > 0) {
        structuredData.certificate_info = certificateInfo;
        console.log("✓ Added certificate_info to structured data");
      } else {
        console.log("✗ No certificate info extracted");
      }
    } else {
      console.log("Document type does not match certificate patterns");
      console.log("Document type:", documentType);
      console.log("Contains 'certificate':", rawContent.toLowerCase().includes('certificate'));
    }
    
    console.log("=== FINAL STRUCTURED DATA ===");
    console.log("Structured data keys:", Object.keys(structuredData));
    console.log("Structured data:", JSON.stringify(structuredData, null, 2).substring(0, 1000));
    
    // Determine document status based on extracted data
    const hasStructuredData = Object.keys(structuredData).length > 0;
    const hasValidContent = rawContent && rawContent.length > 50; // Minimum threshold
    const hasChunks = chunks && chunks.length > 0;
    
    let documentStatus = 'pending';
    
    if (hasStructuredData && hasValidContent) {
      documentStatus = 'processed';
      console.log("Document has structured data and content, marking as 'processed'");
    } else if (hasValidContent && hasChunks) {
      documentStatus = 'extracted';
      console.log("Document has content and chunks but limited structured data, marking as 'extracted'");
    } else if (hasValidContent) {
      documentStatus = 'extracted';
      console.log("Document has basic content, marking as 'extracted'");
    } else {
      documentStatus = 'failed';
      console.log("Document has insufficient data, marking as 'failed'");
    }
    
    // Create document record in database
    const documentRecord = {
      user_id: userId,
      file_path: uploadData ? filePath : null,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      document_type: documentType,
      status: documentStatus,
      public_url: publicUrl,
      extracted_data: {
        raw_content: rawContent,
        structured_data: structuredData,
        chunks: chunks,
        metadata: documentResult.metadata || {},
        processing_info: {
          batch_id: initialResult.batch_id,
          processing_time: initialResult.processing_time_seconds || 0,
          chunk_count: chunks.length
        }
      }
    };
    
    console.log(`Creating document record in database with status '${documentStatus}'`);
    console.log("Extracted data preview:", {
      raw_content_length: rawContent.length,
      structured_data_keys: Object.keys(structuredData),
      chunk_count: chunks.length,
      has_structured_data: hasStructuredData
    });
    
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
    
    // FIXED: Return the expected JSON format with documentId at the top level
    return new Response(
      JSON.stringify({
        success: true,
        documentId: insertedDoc.id, // Ensure documentId is included at the top level
        document: {
          id: insertedDoc.id,
          status: documentStatus,
          file_name: file.name,
          file_size: file.size,
          document_type: documentType,
          public_url: publicUrl,
          extracted_data: {
            markdown: rawContent,
            chunks: chunks,
            structured_data: structuredData
          },
          processing_info: {
            batch_id: initialResult.batch_id,
            processing_time_seconds: initialResult.processing_time_seconds || 0,
            chunk_count: chunks.length,
            has_structured_data: hasStructuredData
          }
        },
        message: `Document ${documentStatus} successfully`
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
