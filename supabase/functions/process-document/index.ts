
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

// Enhanced certificate extraction function
function extractCertificateInfo(rawContent: string): any {
  if (!rawContent) return {};
  
  console.log("=== ENHANCED CERTIFICATE EXTRACTION ===");
  console.log("Raw content preview (first 500 chars):");
  console.log(rawContent.substring(0, 500));
  
  const certificateInfo: any = {};
  
  // Enhanced pattern matching with multiple variations
  const extractField = (patterns: RegExp[], fieldName: string) => {
    for (const pattern of patterns) {
      const match = rawContent.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        const value = match[1].trim();
        console.log(`✓ Found ${fieldName}:`, value);
        return value;
      }
    }
    console.log(`✗ ${fieldName} not found`);
    return null;
  };
  
  // Employee name patterns
  const namePatterns = [
    /Initials\s*&?\s*Surname:\s*([^\n\r]+)/i,
    /Employee\s*Name:\s*([^\n\r]+)/i,
    /Name:\s*([^\n\r]+)/i,
    /Initials\s*&\s*Surname:\s*([^\n\r]+)/i
  ];
  const employeeName = extractField(namePatterns, 'employee_name');
  if (employeeName) certificateInfo.employee_name = employeeName;
  
  // ID number patterns
  const idPatterns = [
    /ID\s*No:?\s*([^\n\r]+)/i,
    /ID\s*Number:?\s*([^\n\r]+)/i,
    /Identity\s*Number:?\s*([^\n\r]+)/i
  ];
  const idNumber = extractField(idPatterns, 'id_number');
  if (idNumber) certificateInfo.id_number = idNumber;
  
  // Company name patterns
  const companyPatterns = [
    /Company\s*Name:\s*([^\n\r]+)/i,
    /Employer:\s*([^\n\r]+)/i,
    /Organization:\s*([^\n\r]+)/i
  ];
  const companyName = extractField(companyPatterns, 'company_name');
  if (companyName) certificateInfo.company_name = companyName;
  
  // Job title patterns
  const jobPatterns = [
    /Job\s*Title:\s*([^\n\r]+)/i,
    /Position:\s*([^\n\r]+)/i,
    /Occupation:\s*([^\n\r]+)/i
  ];
  const jobTitle = extractField(jobPatterns, 'job_title');
  if (jobTitle) certificateInfo.job_title = jobTitle;
  
  // Date patterns
  const examDatePatterns = [
    /Date\s*of\s*Examination:\s*([^\n\r]+)/i,
    /Examination\s*Date:\s*([^\n\r]+)/i,
    /Date\s*Examined:\s*([^\n\r]+)/i
  ];
  const examDate = extractField(examDatePatterns, 'examination_date');
  if (examDate) certificateInfo.examination_date = examDate;
  
  const expiryPatterns = [
    /Expiry\s*Date:\s*([^\n\r]+)/i,
    /Valid\s*Until:\s*([^\n\r]+)/i,
    /Expires:\s*([^\n\r]+)/i
  ];
  const expiryDate = extractField(expiryPatterns, 'expiry_date');
  if (expiryDate) certificateInfo.expiry_date = expiryDate;
  
  // Check examination type with enhanced patterns
  certificateInfo.pre_employment_checked = 
    /PRE-?EMPLOYMENT[^[\]]*\[\s*[xX✓]\s*\]/i.test(rawContent) ||
    /PRE-?EMPLOYMENT[^:]*:\s*[xX✓]/i.test(rawContent);
    
  certificateInfo.periodical_checked = 
    /PERIODICAL[^[\]]*\[\s*[xX✓]\s*\]/i.test(rawContent) ||
    /PERIODICAL[^:]*:\s*[xX✓]/i.test(rawContent);
    
  certificateInfo.exit_checked = 
    /EXIT[^[\]]*\[\s*[xX✓]\s*\]/i.test(rawContent) ||
    /EXIT[^:]*:\s*[xX✓]/i.test(rawContent);
  
  console.log("Examination types:", {
    pre_employment: certificateInfo.pre_employment_checked,
    periodical: certificateInfo.periodical_checked,
    exit: certificateInfo.exit_checked
  });
  
  // Extract medical tests with enhanced parsing for the specific table format
  const medicalTests: any = {};
  
  // First, extract the entire medical tests table
  const medicalTableMatch = rawContent.match(/<table><tbody><tr><td colspan="4">MEDICAL EXAMINATION CONDUCTED INCLUDES THE FOLLOWING TESTS<\/td><\/tr>(.*?)<\/tbody><\/table>/s);
  
  if (medicalTableMatch) {
    console.log("Processing medical tests table...");
    const tableContent = medicalTableMatch[1];
    
    // Parse the specific structure of this table
    const rows = tableContent.match(/<tr>(.*?)<\/tr>/g);
    if (rows) {
      // Process each row
      rows.forEach((row, index) => {
        const cells = row.match(/<td[^>]*>(.*?)<\/td>/g);
        if (cells) {
          const cellContents = cells.map(cell => cell.replace(/<\/?td[^>]*>/g, '').trim());
          
          // Handle different row patterns
          if (index === 1) {
            // Row with BLOODS and Hearing results
            if (cellContents.length >= 6) {
              medicalTests.bloods_done = cellContents[1] === '✓';
              medicalTests.bloods_results = cellContents[2] || 'N/A';
              medicalTests.hearing_done = cellContents[4] === '✓';
              medicalTests.hearing_results = cellContents[5] || 'N/A';
            }
          } else if (index >= 2 && index <= 4) {
            // Rows with paired tests
            if (cellContents.length >= 6) {
              // Left side test
              const leftTest = cellContents[0];
              const leftDone = cellContents[1] === '✓';
              const leftResults = cellContents[2] || 'N/A';
              
              // Right side test  
              const rightTest = cellContents[3];
              const rightDone = cellContents[4] === '✓';
              const rightResults = cellContents[5] || 'N/A';
              
              // Map test names to keys
              const testMapping = {
                'FAR, NEAR VISION': 'far_near_vision',
                'SIDE & DEPTH': 'side_depth', 
                'NIGHT VISION': 'night_vision',
                'Working at Heights': 'heights',
                'Lung Function': 'lung_function',
                'X-Ray': 'x_ray'
              };
              
              if (leftTest && testMapping[leftTest]) {
                medicalTests[`${testMapping[leftTest]}_done`] = leftDone;
                medicalTests[`${testMapping[leftTest]}_results`] = leftResults;
                console.log(`✓ Found ${leftTest}: done=${leftDone}, results=${leftResults}`);
              }
              
              if (rightTest && testMapping[rightTest]) {
                medicalTests[`${testMapping[rightTest]}_done`] = rightDone;
                medicalTests[`${testMapping[rightTest]}_results`] = rightResults;
                console.log(`✓ Found ${rightTest}: done=${rightDone}, results=${rightResults}`);
              }
            }
          } else if (index === 5) {
            // Drug Screen row
            if (cellContents.length >= 5) {
              const drugTest = cellContents[3]; // Should be "Drug Screen"
              const drugDone = cellContents[4] === '✓';
              const drugResults = cellContents[5] || 'N/A';
              
              if (drugTest === 'Drug Screen') {
                medicalTests.drug_screen_done = drugDone;
                medicalTests.drug_screen_results = drugResults;
                console.log(`✓ Found Drug Screen: done=${drugDone}, results=${drugResults}`);
              }
            }
          }
        }
      });
    }
  }
  
  console.log("Extracted medical tests:", medicalTests);
  
  if (Object.keys(medicalTests).length > 0) {
    certificateInfo.medical_tests = medicalTests;
  }
  
  // Extract fitness status with enhanced parsing for the specific table format
  const fitnessStatus: any = {};
  const fitnessTableMatch = rawContent.match(/<table><tbody><tr><th colspan="5">Medical Fitness Declaration<\/th><\/tr>(.*?)<\/tbody><\/table>/s);
  
  if (fitnessTableMatch) {
    console.log("Processing fitness declaration table...");
    const tableContent = fitnessTableMatch[1];
    
    // Look for visual indicators in the raw content or make reasonable assumptions
    const fitnessOptions = ['FIT', 'Fit with Restriction', 'Fit with Condition', 'Temporary Unfit', 'UNFIT'];
    
    // Check for any explicit selection markers
    let selectedOption = null;
    
    fitnessOptions.forEach(option => {
      const patterns = [
        new RegExp(`<td[^>]*class="[^"]*selected[^"]*"[^>]*>${option}</td>`, 'i'),
        new RegExp(`<td[^>]*style="[^"]*background[^"]*"[^>]*>${option}</td>`, 'i'),
        new RegExp(`${option}.*?\\[.*?[xX✓].*?\\]`, 'i')
      ];
      
      patterns.forEach(pattern => {
        if (rawContent.match(pattern)) {
          selectedOption = option;
          console.log(`✓ Found selected fitness option: ${option}`);
        }
      });
    });
    
    // If no explicit selection found, check the context
    if (!selectedOption) {
      // Look for any restrictions or conditions mentioned
      const hasRestrictions = rawContent.toLowerCase().includes('restriction') && 
                            !rawContent.toLowerCase().includes('no restriction');
      const hasConditions = rawContent.toLowerCase().includes('condition') && 
                          !rawContent.toLowerCase().includes('no condition');
      const isUnfit = rawContent.toLowerCase().includes('unfit') && 
                     !rawContent.toLowerCase().includes('not unfit');
      
      if (isUnfit) {
        selectedOption = 'UNFIT';
      } else if (hasRestrictions) {
        selectedOption = 'Fit with Restriction'; 
      } else if (hasConditions) {
        selectedOption = 'Fit with Condition';
      } else {
        // Default to FIT if no negative indicators
        selectedOption = 'FIT';
      }
      
      console.log(`✓ Inferred fitness status: ${selectedOption}`);
    }
    
    // Map the selected option to our structure
    const fitnessMapping = {
      'FIT': 'fit',
      'Fit with Restriction': 'fit_with_restrictions', 
      'Fit with Condition': 'fit_with_condition',
      'Temporary Unfit': 'temporarily_unfit',
      'UNFIT': 'unfit'
    };
    
    if (selectedOption && fitnessMapping[selectedOption]) {
      fitnessStatus[fitnessMapping[selectedOption]] = true;
      console.log(`✓ Set fitness status: ${fitnessMapping[selectedOption]} = true`);
    }
  }
  
  if (Object.keys(fitnessStatus).length > 0) {
    certificateInfo.fitness_status = fitnessStatus;
  }
  
  // Extract restrictions with enhanced visual detection
  const extractedRestrictions: any = {};
  const restrictionsTableMatch = rawContent.match(/<table><tbody><tr><td colspan="4">Restrictions:<\/td><\/tr>(.*?)<\/tbody><\/table>/s);
  
  if (restrictionsTableMatch) {
    console.log("Processing restrictions table...");
    const tableContent = restrictionsTableMatch[1];
    
    const restrictionsList = [
      'Heights', 'Dust Exposure', 'Motorized Equipment', 'Wear Hearing Protection',
      'Confined Spaces', 'Chemical Exposure', 'Wear Spectacles', 
      'Remain on Treatment for Chronic Conditions'
    ];
    
    // Check each restriction for selection indicators
    restrictionsList.forEach(restriction => {
      let isSelected = false;
      
      // Look for visual selection indicators
      const patterns = [
        new RegExp(`<td[^>]*(?:class="[^"]*(?:selected|highlighted)[^"]*"|style="[^"]*background[^"]*yellow[^"]*")[^>]*>${restriction}[^<]*</td>`, 'i'),
        new RegExp(`<td[^>]*>${restriction}[^<]*✓[^<]*</td>`, 'i'),
        new RegExp(`<td[^>]*>${restriction}[^<]*<[^>]*✓[^>]*>[^<]*</td>`, 'i'),
        new RegExp(`${restriction}[^<\n]{0,50}[✓]`, 'i'),
        new RegExp(`${restriction}.*?\\[.*?[xX✓].*?\\]`, 'i')
      ];
      
      patterns.forEach(pattern => {
        if (rawContent.match(pattern)) {
          isSelected = true;
          console.log(`✓ Found selected restriction: ${restriction}`);
        }
      });
      
      // Map restriction names to keys
      const restrictionMapping = {
        'Heights': 'heights',
        'Dust Exposure': 'dust_exposure', 
        'Motorized Equipment': 'motorized_equipment',
        'Wear Hearing Protection': 'wear_hearing_protection',
        'Confined Spaces': 'confined_spaces',
        'Chemical Exposure': 'chemical_exposure',
        'Wear Spectacles': 'wear_spectacles',
        'Remain on Treatment for Chronic Conditions': 'remain_on_treatment_for_chronic_conditions'
      };
      
      if (restrictionMapping[restriction]) {
        extractedRestrictions[restrictionMapping[restriction]] = isSelected;
      }
    });
    
    // Additional check: if we see any mention of restrictions in the fitness assessment
    const hasRestrictionsContext = rawContent.toLowerCase().includes('restriction') && 
                                  !rawContent.toLowerCase().includes('no restriction');
    
    if (hasRestrictionsContext) {
      console.log("⚠️ Document mentions restrictions - may need manual review");
    }
  }
  
  console.log("Extracted restrictions:", extractedRestrictions);
  if (Object.keys(extractedRestrictions).length > 0) {
    certificateInfo.restrictions = extractedRestrictions;
  }
  
  // Extract additional fields
  const followUpMatch = rawContent.match(/Referred\s+or\s+follow\s+up\s+actions:\s*([^\n\r]+)/i);
  if (followUpMatch && followUpMatch[1]) {
    certificateInfo.follow_up = followUpMatch[1].trim();
  }

  const reviewDateMatch = rawContent.match(/Review\s+Date:\s*([^\n\r]+)/i);
  if (reviewDateMatch && reviewDateMatch[1]) {
    certificateInfo.review_date = reviewDateMatch[1].trim();
  }

  const commentsMatch = rawContent.match(/Comments:\s*([^<\n\r]+)/i);
  if (commentsMatch && commentsMatch[1]) {
    let comments = commentsMatch[1].trim();
    certificateInfo.comments = comments === "N/A" ? "N/A" : comments;
  }
  
  console.log("=== FINAL CERTIFICATE INFO ===");
  console.log("Certificate info keys:", Object.keys(certificateInfo));
  console.log("Certificate info:", JSON.stringify(certificateInfo, null, 2));
  
  return certificateInfo;
}

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
    const filePath = formData.get('filePath') || '';
    const patientId = formData.get('patientId');

    if (!file || !(file instanceof File)) {
      throw new Error('No file provided');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log(`Processing document of type: ${documentType}`);
    console.log(`File name: ${file.name}, size: ${file.size} bytes`);
    console.log(`Using file path: ${filePath}`);
    if (patientId) {
      console.log(`Linking to patient ID: ${patientId}`);
    }

    // Create a new form data to send to the microservice
    const forwardFormData = new FormData();
    forwardFormData.append('files', file);
    
    console.log("Sending document to microservice for processing...");
    console.log("Using microservice URL:", microserviceUrl);
    
    let documentResult = null;
    let rawContent = "";
    let chunks = [];
    
    try {
      // Step 1: Send the file to the microservice
      const initialResponse = await fetch(`${microserviceUrl}/process-documents`, {
        method: 'POST',
        body: forwardFormData
      });

      if (!initialResponse.ok) {
        const errorText = await initialResponse.text();
        console.error("Microservice error:", errorText);
        throw new Error(`Microservice unavailable (${initialResponse.status}). Processing document locally.`);
      }

      const initialResult = await initialResponse.json();
      console.log("Initial processing complete. Batch ID:", initialResult.batch_id);
      
      // Step 2: Retrieve the processed data using the batch ID
      const dataResponse = await fetch(`${microserviceUrl}/get-document-data/${initialResult.batch_id}`);
      
      if (!dataResponse.ok) {
        const errorText = await dataResponse.text();
        console.error("Error retrieving document data:", errorText);
        throw new Error(`Data retrieval failed (${dataResponse.status}). Processing document locally.`);
      }

      const documentData = await dataResponse.json();
      console.log("Document data retrieved successfully");
      
      // Extract the first document result
      documentResult = documentData.result && documentData.result.length > 0 
        ? documentData.result[0] 
        : null;
        
      if (!documentResult) {
        throw new Error("No document processing results returned from microservice");
      }

      rawContent = documentResult.markdown || "";
      chunks = documentResult.chunks || [];
      
      // Cleanup on the microservice side (in background)
      fetch(`${microserviceUrl}/cleanup/${initialResult.batch_id}`, {
        method: 'DELETE'
      }).catch(error => {
        console.error("Error cleaning up temporary files:", error);
      });
      
    } catch (microserviceError) {
      console.error("Microservice processing failed:", microserviceError);
      console.log("Falling back to local processing - creating basic document record");
      
      // Fallback: Create a basic document record without processing
      rawContent = `Document uploaded: ${file.name}`;
      chunks = [];
      documentResult = {
        markdown: rawContent,
        chunks: chunks,
        metadata: {
          fallback: true,
          error: microserviceError.message,
          filename: file.name,
          size: file.size,
          type: file.type
        }
      };
    }
    
    // Store file in Storage - UPDATED to always use medical-documents bucket
    const storagePath = filePath.toString() || `${userId}/${new Date().getTime()}_${documentType}.${file.name.split('.').pop()}`;
    
    console.log(`Uploading file to storage: ${storagePath}`);
    
    let uploadData = null;
    let publicUrl = null;
    
    try {
      // Create a blob copy of the file to ensure it's properly formatted for storage
      const fileBuffer = await file.arrayBuffer();
      const fileBlob = new Blob([fileBuffer], { type: file.type });
      
      // Attempt to upload to storage with proper content type
      const { data: storageData, error: uploadError } = await supabase.storage
        .from('medical-documents')
        .upload(storagePath, fileBlob, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false // Don't overwrite existing files
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }
      
      uploadData = storageData;
      
      // Get public URL if upload successful
      const { data: urlData } = await supabase.storage
        .from('medical-documents')
        .getPublicUrl(storagePath);
      
      if (urlData) {
        publicUrl = urlData.publicUrl;
        // Validate the URL is working by making a HEAD request
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
      uploadData = null;
      publicUrl = null;
    }
    
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
      
      const certificateInfo = extractCertificateInfo(rawContent);
      
      if (Object.keys(certificateInfo).length > 0) {
        structuredData.certificate_info = certificateInfo;
        console.log("✓ Added certificate_info to structured data");
      } else {
        console.log("✗ No certificate info extracted");
      }
    } else {
      console.log("Document type does not match certificate patterns");
    }
    
    console.log("=== FINAL STRUCTURED DATA ===");
    console.log("Structured data keys:", Object.keys(structuredData));
    console.log("Structured data:", JSON.stringify(structuredData, null, 2).substring(0, 1000));
    
    // Determine document status based on extracted data
    const hasStructuredData = Object.keys(structuredData).length > 0;
    const hasValidContent = rawContent && rawContent.length > 50;
    const hasChunks = chunks && chunks.length > 0;
    const isFallback = documentResult?.metadata?.fallback;
    
    let documentStatus = 'pending';
    
    if (isFallback) {
      documentStatus = 'uploaded'; // New status for fallback documents
      console.log("Document uploaded without processing due to microservice unavailability");
    } else if (hasStructuredData && hasValidContent) {
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
      file_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      document_type: documentType,
      status: documentStatus,
      public_url: publicUrl,
      owner_id: patientId || null,
      extracted_data: {
        raw_content: rawContent,
        structured_data: structuredData,
        chunks: chunks,
        metadata: documentResult?.metadata || {},
        processing_info: {
          processing_time: 0,
          chunk_count: chunks.length,
          fallback: isFallback || false
        }
      }
    };
    
    console.log(`Creating document record in database with status '${documentStatus}'`);
    if (patientId) {
      console.log(`Document will be linked to patient ${patientId}`);
    }
    
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
    
    // Return the expected JSON format with documentId at the top level
    return new Response(
      JSON.stringify({
        success: true,
        documentId: insertedDoc.id,
        document: {
          id: insertedDoc.id,
          status: documentStatus,
          file_name: file.name,
          file_size: file.size,
          document_type: documentType,
          public_url: publicUrl,
          owner_id: patientId || null,
          extracted_data: {
            markdown: rawContent,
            chunks: chunks,
            structured_data: structuredData
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
  } catch (error: any) {
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
