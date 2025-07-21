
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Use environment variable for API endpoint with the correct name
const microserviceUrl = Deno.env.get('SDK_MICROSERVICE_URL') || 'https://document-processing-service.onrender.com';

/**
 * Analyzes LandingAI chunks to detect signature and stamp presence
 */
function detectSignatureAndStamp(result: any): { signature: boolean; stamp: boolean } {
  console.log('=== SIGNATURE/STAMP DETECTION FROM LANDINGAI ===');
  
  const signatureDetection = {
    signature: false,
    stamp: false
  };

  try {
    // Check if we have chunks array
    const chunks = result?.chunks || result?.data?.chunks || [];
    console.log('Analyzing chunks for signature/stamp detection:', chunks.length);

    if (Array.isArray(chunks)) {
      chunks.forEach((chunk: any, index: number) => {
        const chunkText = (chunk.text || '').toLowerCase();
        const chunkType = chunk.chunk_type || '';
        
        console.log(`Chunk ${index}:`, {
          type: chunkType,
          textSample: chunkText.substring(0, 100),
          hasSignatureKeywords: chunkText.includes('signature'),
          hasStampKeywords: chunkText.includes('stamp')
        });

        // Detect signature
        if (chunkType === 'figure' && (
          chunkText.includes('signature') ||
          chunkText.includes('scanned') ||
          chunkText.includes('digital signature') ||
          chunkText.includes('handwriting') ||
          chunkText.includes('pen strokes')
        )) {
          signatureDetection.signature = true;
          console.log('✅ SIGNATURE detected in figure chunk:', chunk.chunk_id);
        }

        // Detect stamp
        if ((chunkType === 'text' || chunkType === 'figure') && (
          chunkText.includes('stamp') ||
          chunkText.includes('practice no') ||
          chunkText.includes('practice number')
        )) {
          signatureDetection.stamp = true;
          console.log('✅ STAMP detected in chunk:', chunk.chunk_id);
        }
      });
    }

    // Also check markdown content as fallback
    const markdown = result?.markdown || result?.data?.markdown || '';
    if (typeof markdown === 'string') {
      const markdownLower = markdown.toLowerCase();
      
      if (!signatureDetection.signature && (
        markdownLower.includes('signature') ||
        markdownLower.includes('scanned or digital signature') ||
        markdownLower.includes('handwriting features')
      )) {
        signatureDetection.signature = true;
        console.log('✅ SIGNATURE detected in markdown content');
      }

      if (!signatureDetection.stamp && (
        markdownLower.includes('stamp') ||
        markdownLower.includes('practice no')
      )) {
        signatureDetection.stamp = true;
        console.log('✅ STAMP detected in markdown content');
      }
    }

  } catch (error) {
    console.error('Error in signature/stamp detection:', error);
  }

  console.log('Final detection results:', signatureDetection);
  console.log('=== END SIGNATURE/STAMP DETECTION ===');
  
  return signatureDetection;
}

/**
 * Fixed certificate extraction function that properly handles microservice response
 * Replace the existing extractCertificateInfo function in your index.ts with this
 */
function extractCertificateInfo(rawContent: string): any {
  console.log("=== FIXED CERTIFICATE EXTRACTION ===");
  console.log("Raw content preview (first 500 chars):");
  console.log(rawContent.substring(0, 500));

  const certificateInfo: any = {};
  
  // Clean the raw content first - remove HTML comments and normalize
  let cleanContent = rawContent;
  
  // Remove HTML comments like <!-- table, from page 0... -->
  cleanContent = cleanContent.replace(/<!--[^>]*-->/g, '');
  
  // Replace HTML table elements with spaces to prevent concatenation
  cleanContent = cleanContent.replace(/<\/td>/g, ' ');
  cleanContent = cleanContent.replace(/<td[^>]*>/g, ' ');
  cleanContent = cleanContent.replace(/<\/tr>/g, '\n');
  cleanContent = cleanContent.replace(/<tr[^>]*>/g, '');
  cleanContent = cleanContent.replace(/<\/table>/g, '\n');
  cleanContent = cleanContent.replace(/<table[^>]*>/g, '');
  cleanContent = cleanContent.replace(/<\/tbody>/g, '');
  cleanContent = cleanContent.replace(/<tbody[^>]*>/g, '');
  cleanContent = cleanContent.replace(/<th[^>]*>.*?<\/th>/g, '');
  
  // Clean up extra whitespace
  cleanContent = cleanContent.replace(/\s+/g, ' ').trim();
  
  console.log("Cleaned content preview (first 500 chars):");
  console.log(cleanContent.substring(0, 500));

  // Enhanced field extraction with multiple patterns
  const extractField = (patterns: RegExp[], fieldName: string) => {
    for (const pattern of patterns) {
      const match = cleanContent.match(pattern);
      if (match && match[1] && match[1].trim() !== '') {
        const value = match[1].trim();
        // Skip if value looks like HTML remnants
        if (!value.includes('<') && !value.includes('td>') && value.length < 100) {
          console.log(`✓ Found ${fieldName}:`, value);
          return value;
        }
      }
    }
    console.log(`✗ ${fieldName} not found`);
    return null;
  };
  
  // Employee name patterns - enhanced to handle the actual content structure
  const namePatterns = [
    /Initials\s*&?\s*Surname:\s*([^\n\r]+?)(?:\s+ID\s+NO|$)/i,
    /Employee.*?:\s*([A-Z][A-Z\.\s]+[A-Z])/i,
    /PA\.\s+([A-Z][a-z]+)/i, // Based on your example "PA. Mahlong"
    /Initials.*?Surname.*?:\s*([^\n]+)/i
  ];
  const employeeName = extractField(namePatterns, 'employee_name');
  if (employeeName) certificateInfo.employee_name = employeeName;
  
  // ID number patterns - enhanced for SA ID format
  const idPatterns = [
    /ID\s*NO:\s*([0-9\s]+[0-9])/i,
    /ID\s*Number:\s*([0-9\s]+[0-9])/i,
    /(\d{6}\s*\d{4}\s*\d{3})/i, // SA ID format: YYMMDD NNNN CCC
    /(\d{13})/i // 13-digit ID number
  ];
  const idNumber = extractField(idPatterns, 'id_number');
  if (idNumber) certificateInfo.id_number = idNumber.replace(/\s+/g, ' ').trim();
  
  // Company name patterns
  const companyPatterns = [
    /Company\s*Name:\s*([A-Z][A-Z\s]+?)(?:\s+Date|$)/i,
    /(APE\s+Pumps?)/i, // Based on your example
    /Company.*?:\s*([A-Z][A-Za-z\s&]+)/i
  ];
  const companyName = extractField(companyPatterns, 'company_name');
  if (companyName) certificateInfo.company_name = companyName;
  
  // Job title patterns
  const jobPatterns = [
    /Job\s*Title:\s*([A-Z][A-Za-z\s]+?)(?:\s+PRE-|$)/i,
    /(Artisan)/i, // Based on your example
    /Position:\s*([A-Z][A-Za-z\s]+)/i
  ];
  const jobTitle = extractField(jobPatterns, 'job_title');
  if (jobTitle) certificateInfo.job_title = jobTitle;
  
  // Date patterns - enhanced for the DD.MM.YYYY format
  const examDatePatterns = [
    /Date\s*of\s*Examination:\s*(\d{1,2}\.?\d{1,2}\.?\d{4})/i,
    /Examination.*?Date:\s*(\d{1,2}\.?\d{1,2}\.?\d{4})/i,
    /(\d{2}\.\d{2}\.\d{4})/g // DD.MM.YYYY format
  ];
  const examDate = extractField(examDatePatterns, 'examination_date');
  if (examDate) certificateInfo.examination_date = examDate;
  
  const expiryPatterns = [
    /Expiry\s*Date:\s*(\d{1,2}\.?\d{1,2}\.?\d{4})/i,
    /Valid\s*Until:\s*(\d{1,2}\.?\d{1,2}\.?\d{4})/i,
    /Expires?:\s*(\d{1,2}\.?\d{1,2}\.?\d{4})/i
  ];
  const expiryDate = extractField(expiryPatterns, 'expiry_date');
  if (expiryDate) certificateInfo.expiry_date = expiryDate;
  
  // Enhanced examination type detection
  console.log("Checking examination types...");
  
  // Look for checkmarks or indicators near examination types
  certificateInfo.pre_employment_checked = 
    /PRE-?EMPLOYMENT\s*[✓x]/i.test(cleanContent) ||
    /PRE-?EMPLOYMENT.*?checked/i.test(cleanContent);
    
  certificateInfo.periodical_checked = 
    /PERIODICAL\s*[✓x]/i.test(cleanContent) ||
    /PERIODICAL.*?checked/i.test(cleanContent);
    
  certificateInfo.exit_checked = 
    /EXIT\s*[✓x]/i.test(cleanContent) ||
    /EXIT.*?checked/i.test(cleanContent);
  
  console.log("Examination types detected:", {
    pre_employment: certificateInfo.pre_employment_checked,
    periodical: certificateInfo.periodical_checked,
    exit: certificateInfo.exit_checked
  });
  
  // Extract medical tests - simplified approach
  const medicalTests: any = {};
  const testNames = ['BLOODS', 'FAR, NEAR VISION', 'SIDE & DEPTH', 'NIGHT VISION', 'Hearing', 'Working at Heights', 'Lung Function', 'X-Ray', 'Drug Screen'];
  
  testNames.forEach(testName => {
    const testKey = testName.toLowerCase().replace(/[^a-z]+/g, '_');
    
    // Look for test name followed by results
    const testPattern = new RegExp(`${testName}.*?([0-9\/]+|Normal|N\\/A|NEGATIVE|Positive)`, 'i');
    const testMatch = cleanContent.match(testPattern);
    
    if (testMatch) {
      medicalTests[`${testKey}_done`] = true;
      medicalTests[`${testKey}_results`] = testMatch[1];
      console.log(`✓ Found medical test ${testName}: ${testMatch[1]}`);
    } else {
      medicalTests[`${testKey}_done`] = false;
      medicalTests[`${testKey}_results`] = 'N/A';
    }
  });
  
  if (Object.keys(medicalTests).length > 0) {
    certificateInfo.medical_tests = medicalTests;
  }
  
  // Enhanced fitness status detection
  const fitnessStatus: any = {};
  
  // Look for fitness declarations
  fitnessStatus.fit = /FIT:\s*\[[x✓]\]/i.test(cleanContent) || /\bFIT\b.*?checked/i.test(cleanContent);
  fitnessStatus.fit_with_restrictions = /Fit with Restriction.*?\[[x✓]\]/i.test(cleanContent);
  fitnessStatus.fit_with_condition = /Fit with Condition.*?\[[x✓]\]/i.test(cleanContent);
  fitnessStatus.temporarily_unfit = /Temporary.*?Unfit.*?\[[x✓]\]/i.test(cleanContent);
  fitnessStatus.unfit = /UNFIT.*?\[[x✓]\]/i.test(cleanContent);
  
  console.log("Fitness status detected:", fitnessStatus);
  
  if (Object.keys(fitnessStatus).some(key => fitnessStatus[key])) {
    certificateInfo.fitness_status = fitnessStatus;
  }
  
  // Extract additional fields
  const followUpMatch = cleanContent.match(/Referred.*?follow.*?actions?:\s*([^\n\r]+)/i);
  if (followUpMatch && followUpMatch[1] && followUpMatch[1].trim() !== '') {
    certificateInfo.follow_up = followUpMatch[1].trim();
  }

  const reviewDateMatch = cleanContent.match(/Review\s*Date:\s*(\d{1,2}\.?\d{1,2}\.?\d{4})/i);
  if (reviewDateMatch && reviewDateMatch[1]) {
    certificateInfo.review_date = reviewDateMatch[1];
  }

  const commentsMatch = cleanContent.match(/Comments:\s*([^<\n\r]+)/i);
  if (commentsMatch && commentsMatch[1] && commentsMatch[1].trim() !== '') {
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
    
    // CRITICAL FIX: Check if microservice returned structured data directly at root level
    console.log("=== CHECKING MICROSERVICE STRUCTURED DATA ===");
    if (documentResult && typeof documentResult === 'object') {
      console.log("Document result keys:", Object.keys(documentResult));
      console.log("Document result sample:", JSON.stringify(documentResult, null, 2).substring(0, 1000));
      
      // FIXED: Check for microservice data at root level, not in nested structured_data
      if (documentResult.employee_info || documentResult.medical_examination || documentResult.document_classification) {
        console.log("✅ Found microservice structured data at root level");
        
        // Map microservice data to direct fields that frontend expects
        const microData = documentResult; // Use root level data, not nested
        
        if (microData.employee_info) {
          structuredData.patientName = microData.employee_info.full_name;
          structuredData.patientId = microData.employee_info.id_number;
          structuredData.companyName = microData.employee_info.company_name;
          structuredData.occupation = microData.employee_info.job_title;
          console.log("✅ Mapped employee_info to direct fields:", {
            name: microData.employee_info.full_name,
            id: microData.employee_info.id_number,
            company: microData.employee_info.company_name,
            job: microData.employee_info.job_title
          });
        }
        
        if (microData.medical_examination) {
          structuredData.examinationDate = microData.medical_examination.examination_date;
          structuredData.expiryDate = microData.medical_examination.expiry_date;
          structuredData.examinationType = microData.medical_examination.examination_type?.toLowerCase();
          structuredData.fitnessStatus = microData.medical_examination.fitness_status?.toLowerCase();
          structuredData.comments = microData.medical_examination.comments;
          structuredData.followUpActions = microData.medical_examination.follow_up_actions;
          
          // Map restrictions
          if (microData.medical_examination.restrictions?.length > 0) {
            structuredData.restrictionsText = microData.medical_examination.restrictions.join(', ');
          } else {
            structuredData.restrictionsText = 'None';
          }
          console.log("✅ Mapped medical_examination to direct fields:", {
            examDate: microData.medical_examination.examination_date,
            expiry: microData.medical_examination.expiry_date,
            type: microData.medical_examination.examination_type,
            fitness: microData.medical_examination.fitness_status
          });
        }
        
        // Copy the entire microservice response as structured_data
        Object.assign(structuredData, microData);
        
        console.log("✅ Structured data keys after microservice mapping:", Object.keys(structuredData));
      } else {
        console.log("⚠️ No microservice structured data found at root level, falling back to extraction");
      }
    }
    
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
    
    // For certificate documents, extract specific fields as fallback
    console.log("Checking if document type matches certificate patterns...");
    if (documentType === 'certificate-fitness' || documentType === 'certificate' || rawContent.toLowerCase().includes('certificate')) {
      console.log("Processing as certificate document");
      
      // Only do fallback extraction if we don't have microservice data
      if (!structuredData.patientName && !structuredData.employee_info) {
        console.log("No microservice data found, doing fallback extraction");
        const certificateInfo = extractCertificateInfo(rawContent);
        
        if (Object.keys(certificateInfo).length > 0) {
          structuredData.certificate_info = certificateInfo;
          console.log("✓ Added certificate_info to structured data");
        } else {
          console.log("✗ No certificate info extracted");
        }
      } else {
        console.log("✓ Microservice data already available, skipping fallback extraction");
      }
    }
    
    console.log("=== FINAL STRUCTURED DATA ===");
    console.log("Structured data keys:", Object.keys(structuredData));
    console.log("Structured data sample:", JSON.stringify(structuredData, null, 2).substring(0, 1000));
    
    // Determine document status based on extracted data
    const hasStructuredData = Object.keys(structuredData).length > 0;
    const hasValidContent = rawContent && rawContent.length > 50;
    const hasChunks = chunks && chunks.length > 0;
    const isFallback = documentResult?.metadata?.fallback;
    const hasMicroserviceData = structuredData.employee_info || structuredData.medical_examination || structuredData.patientName;
    
    let documentStatus = 'pending';
    
    if (isFallback) {
      documentStatus = 'uploaded'; // New status for fallback documents
      console.log("Document uploaded without processing due to microservice unavailability");
    } else if (hasMicroserviceData) {
      documentStatus = 'processed';
      console.log("Document has microservice structured data, marking as 'processed'");
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
          fallback: isFallback || false,
          microservice_data_found: hasMicroserviceData
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
    
    // Ensure CORS headers are always included in error responses
    const errorResponse = {
      success: false,
      error: error.message || "Unknown error occurred",
      details: error.stack ? error.stack.split('\n').slice(0, 3) : undefined
    };
    
    return new Response(
      JSON.stringify(errorResponse),
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
