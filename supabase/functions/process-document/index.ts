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
    
    // Extract data properly from the microservice response
    const rawContent = documentResult.markdown || "";
    const chunks = documentResult.chunks || [];
    const extractedText = documentResult.markdown || "";
    
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
    
    // Extract specific information based on chunk types
    if (chunksByType.form) {
      structuredData.forms = chunksByType.form;
    }
    
    if (chunksByType.table) {
      structuredData.tables = chunksByType.table;
    }
    
    if (chunksByType.figure) {
      structuredData.figures = chunksByType.figure;
    }
    
    // For certificate documents, extract specific fields
    if (documentType === 'certificate-fitness' || documentType === 'certificate') {
      // Try to extract structured information from the text
      const certificateInfo: any = {};
      
      console.log("Extracting certificate info from text...");
      console.log("Raw content preview:", rawContent.substring(0, 500));
      
      // Extract employee info - more flexible patterns
      const nameMatch = rawContent.match(/Initials\s*&?\s*Surname:\s*([^\n\r]+)/i);
      if (nameMatch) {
        certificateInfo.employee_name = nameMatch[1].trim();
        console.log("Found employee name:", certificateInfo.employee_name);
      }
      
      const idMatch = rawContent.match(/ID\s*No:?\s*([^\n\r]+)/i);
      if (idMatch) {
        certificateInfo.id_number = idMatch[1].trim();
        console.log("Found ID number:", certificateInfo.id_number);
      }
      
      const companyMatch = rawContent.match(/Company\s*Name:\s*([^\n\r]+)/i);
      if (companyMatch) {
        certificateInfo.company_name = companyMatch[1].trim();
        console.log("Found company name:", certificateInfo.company_name);
      }
      
      const jobMatch = rawContent.match(/Job\s*Title:\s*([^\n\r]+)/i);
      if (jobMatch) {
        certificateInfo.job_title = jobMatch[1].trim();
        console.log("Found job title:", certificateInfo.job_title);
      }
      
      const examDateMatch = rawContent.match(/Date\s*of\s*Examination:\s*([^\n\r]+)/i);
      if (examDateMatch) {
        certificateInfo.examination_date = examDateMatch[1].trim();
        console.log("Found examination date:", certificateInfo.examination_date);
      }
      
      const expiryMatch = rawContent.match(/Expiry\s*Date:\s*([^\n\r]+)/i);
      if (expiryMatch) {
        certificateInfo.expiry_date = expiryMatch[1].trim();
        console.log("Found expiry date:", certificateInfo.expiry_date);
      }
      
      // Try to extract doctor/practitioner info
      const doctorMatch = rawContent.match(/Dr\.?\s*([^\/\n\r]+)/i);
      if (doctorMatch) {
        certificateInfo.doctor_name = doctorMatch[1].trim();
        console.log("Found doctor name:", certificateInfo.doctor_name);
      }
      
      // Extract practice number
      const practiceMatch = rawContent.match(/Practice\s*No:?\s*([^\n\r\/]+)/i);
      if (practiceMatch) {
        certificateInfo.practice_number = practiceMatch[1].trim();
        console.log("Found practice number:", certificateInfo.practice_number);
      }
      
      // Extract examination type (PRE-EMPLOYMENT, PERIODICAL, EXIT)
      if (rawContent.includes('PRE-EMPLOYMENT: [x]') || rawContent.includes('PRE-EMPLOYMENT: ✓')) {
        certificateInfo.examination_type = 'PRE-EMPLOYMENT';
      } else if (rawContent.includes('PERIODICAL: [x]') || rawContent.includes('PERIODICAL: ✓')) {
        certificateInfo.examination_type = 'PERIODICAL';
      } else if (rawContent.includes('EXIT: [x]') || rawContent.includes('EXIT: ✓')) {
        certificateInfo.examination_type = 'EXIT';
      }
      
      // Extract medical test results from tables
      const medicalTests: any = {};
      
      // Vision tests
      if (rawContent.includes('FAR, NEAR VISION')) {
        const visionMatch = rawContent.match(/FAR,\s*NEAR\s*VISION[^✓]*✓[^0-9]*([0-9\/]+)/i);
        if (visionMatch) {
          medicalTests.vision = visionMatch[1].trim();
        }
      }
      
      // Hearing test
      if (rawContent.includes('Hearing')) {
        const hearingMatch = rawContent.match(/Hearing[^✓]*✓[^0-9]*([0-9\.]+)/i);
        if (hearingMatch) {
          medicalTests.hearing = hearingMatch[1].trim();
        }
      }
      
      // Lung function
      if (rawContent.includes('Lung Function')) {
        const lungMatch = rawContent.match(/Lung\s*Function[^✓]*✓[^A-Za-z]*([A-Za-z\s]+)/i);
        if (lungMatch) {
          medicalTests.lung_function = lungMatch[1].trim();
        }
      }
      
      if (Object.keys(medicalTests).length > 0) {
        certificateInfo.medical_tests = medicalTests;
      }
      
      console.log("Final certificate info extracted:", certificateInfo);
      console.log("Certificate info keys:", Object.keys(certificateInfo));
      
      if (Object.keys(certificateInfo).length > 0) {
        structuredData.certificate_info = certificateInfo;
      }
    }
    
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
      file_path: filePath,
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
    
    // Return the expected JSON format
    return new Response(
      JSON.stringify({
        success: true,
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
