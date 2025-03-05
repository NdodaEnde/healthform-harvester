
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

    // 3. Start document processing in the background
    const documentId = documentData.id;
    
    // Start background task for document processing
    const processingPromise = processDocumentWithLandingAI(file, documentType, documentId, supabase);
    // @ts-ignore - Deno specific API
    EdgeRuntime.waitUntil(processingPromise);

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

// Process document with Landing AI API
async function processDocumentWithLandingAI(file: File, documentType: string, documentId: string, supabase: any) {
  try {
    console.log(`Starting document processing with Landing AI for document ID: ${documentId}`);
    
    // Get API key
    const landingAiApiKey = Deno.env.get('LANDING_AI_API_KEY') || 'bHQ2cjl2b2l2Nmx2Nm4xemsxMHJhOk5QVXh1cjR2TngxMHJCZ2dtNWl2dEh5emk5cXMxNVM5';
    
    if (!landingAiApiKey) {
      throw new Error('Landing AI API key is not configured');
    }
    
    console.log(`Calling Landing AI API for document type: ${documentType}`);
    
    // API endpoint
    const apiUrl = 'https://api.va.landing.ai/v1/tools/agentic-document-analysis';
    
    // Create form data for API request
    const apiFormData = new FormData();
    
    // Determine if we should use 'image' or 'pdf' based on file type
    const isPdf = file.type.includes('pdf');
    
    // Instead of downloading from storage, use the original file
    if (isPdf) {
      console.log('Adding PDF file to request');
      apiFormData.append('pdf', file, file.name);
    } else {
      console.log('Adding image file to request');
      apiFormData.append('image', file, file.name);
    }
    
    // Call Landing AI API with Basic Auth
    console.log(`Making request to Landing AI API with ${isPdf ? 'PDF' : 'image'} file`);
    console.log(`File name: ${file.name}, File type: ${file.type}, File size: ${file.size} bytes`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${landingAiApiKey}`
      },
      body: apiFormData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: Status ${response.status}, Body: ${errorText}`);
      throw new Error(`Landing AI API error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`Landing AI API response received for document ID: ${documentId}`);
    console.log(`Response: ${JSON.stringify(result)}`);
    
    // Process and structure the data based on document type
    let structuredData;
    if (documentType === 'medical-questionnaire') {
      structuredData = processMedicalQuestionnaireData(result);
    } else {
      structuredData = processCertificateOfFitnessData(result);
    }
    
    console.log('Structured data extracted:', JSON.stringify(structuredData));
    
    // Try to update the document record multiple times if needed
    let updateSuccess = false;
    let attempts = 0;
    
    while (!updateSuccess && attempts < 3) {
      attempts++;
      
      // Update the document record with the extracted data
      const { data: updateData, error: updateError } = await supabase
        .from('documents')
        .update({
          extracted_data: {
            structured_data: structuredData,
            raw_response: result
          },
          status: 'processed',
          processed_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select();
      
      if (updateError) {
        console.error(`Failed to update document with extracted data (attempt ${attempts}):`, updateError);
        if (attempts < 3) {
          console.log(`Retrying document update in 1 second...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw updateError;
        }
      } else {
        updateSuccess = true;
        console.log(`Document processing completed for document ID: ${documentId}`);
        console.log('Updated document record:', updateData);
        
        // Force another update to ensure the status is set to processed
        await supabase
          .from('documents')
          .update({ status: 'processed' })
          .eq('id', documentId);
      }
    }
    
    // Additional verification step: explicitly verify the document is marked as processed
    for (let i = 0; i < 3; i++) {
      const { data: verifyData, error: verifyError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();
        
      if (verifyError) {
        console.error('Error verifying document update:', verifyError);
      } else {
        console.log(`Verified document status is now: ${verifyData.status}`);
        
        if (verifyData.status !== 'processed') {
          console.log(`Document status is not 'processed', forcing update one more time...`);
          await supabase
            .from('documents')
            .update({ 
              status: 'processed',
              processed_at: new Date().toISOString()
            })
            .eq('id', documentId);
        } else {
          break;
        }
      }
      
      // Wait before retrying verification
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('Document processing error:', error);
    
    // Update document status to failed with error message
    try {
      const { data, error: updateError } = await supabase
        .from('documents')
        .update({
          status: 'failed',
          processing_error: error.message
        })
        .eq('id', documentId)
        .select();
        
      if (updateError) {
        console.error('Error updating document status to failed:', updateError);
      } else {
        console.log('Updated document status to failed:', data);
      }
    } catch (updateError) {
      console.error('Error updating document status after processing failure:', updateError);
    }
  }
}

// Process medical questionnaire data from Landing AI response
function processMedicalQuestionnaireData(apiResponse: any) {
  try {
    // Extract fields from AI response
    const extractedData = apiResponse.result || {};
    
    // Build structured data object from API response
    return {
      patient: {
        name: cleanValue(extractPath(extractedData, 'patient.name')) || 'Unknown',
        date_of_birth: cleanValue(extractPath(extractedData, 'patient.date_of_birth')) || '',
        employee_id: cleanValue(extractPath(extractedData, 'patient.id')) || '',
        gender: cleanValue(extractPath(extractedData, 'patient.gender')) || ''
      },
      medical_history: {
        has_hypertension: checkCondition(extractedData, 'medical_history.conditions', 'hypertension'),
        has_diabetes: checkCondition(extractedData, 'medical_history.conditions', 'diabetes'),
        has_heart_disease: checkCondition(extractedData, 'medical_history.conditions', 'heart disease'),
        has_allergies: extractPath(extractedData, 'medical_history.allergies')?.length > 0,
        allergies: extractPath(extractedData, 'medical_history.allergies') || []
      },
      current_medications: extractPath(extractedData, 'medications') || [],
      questionnaire_date: cleanValue(extractPath(extractedData, 'date')) || new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Error processing medical questionnaire data:', error);
    // Return basic structure with default values on error
    return {
      patient: {
        name: "Unknown",
        employee_id: "Unknown"
      },
      medical_history: {},
      questionnaire_date: new Date().toISOString().split('T')[0]
    };
  }
}

// Process certificate of fitness data from Landing AI response
function processCertificateOfFitnessData(apiResponse: any) {
  try {
    // Extract fields from AI response
    const extractedData = apiResponse.result || {};
    const markdown = apiResponse.data?.markdown || '';

    console.log('Processing certificate of fitness data from API response');
    console.log('Markdown present:', Boolean(markdown));
    
    // Build structured data object from API response and markdown
    let structuredData = {
      patient: {
        name: cleanValue(extractPath(extractedData, 'patient.name')) || 
              cleanValue(extractPath(extractedData, 'employee.name')) || 'Unknown',
        date_of_birth: cleanValue(extractPath(extractedData, 'patient.date_of_birth')) || 
                      cleanValue(extractPath(extractedData, 'patient.dob')) || '',
        employee_id: cleanValue(extractPath(extractedData, 'patient.id')) || 
                    cleanValue(extractPath(extractedData, 'patient.id_number')) || 
                    cleanValue(extractPath(extractedData, 'employee.id')) || '',
        company: cleanValue(extractPath(extractedData, 'company')) || 
                cleanValue(extractPath(extractedData, 'employer')) || 
                cleanValue(extractPath(extractedData, 'patient.company')) || '',
        occupation: cleanValue(extractPath(extractedData, 'patient.occupation')) || 
                  cleanValue(extractPath(extractedData, 'patient.job_title')) || 
                  cleanValue(extractPath(extractedData, 'occupation')) || '',
        gender: cleanValue(extractPath(extractedData, 'patient.gender')) || ''
      },
      examination_results: {
        date: cleanValue(extractPath(extractedData, 'examination.date')) || 
              cleanValue(extractPath(extractedData, 'date')) || 
              new Date().toISOString().split('T')[0],
        physician: cleanValue(extractPath(extractedData, 'examination.physician')) || 
                  cleanValue(extractPath(extractedData, 'physician')) || '',
        fitness_status: cleanValue(extractPath(extractedData, 'examination.fitness_status')) || 
                       cleanValue(extractPath(extractedData, 'fitness_status')) || 'Unknown',
        restrictions: cleanValue(extractPath(extractedData, 'examination.restrictions')) || 
                     cleanValue(extractPath(extractedData, 'restrictions')) || 'None',
        next_examination_date: cleanValue(extractPath(extractedData, 'examination.next_date')) || 
                             cleanValue(extractPath(extractedData, 'valid_until')) || 
                             cleanValue(extractPath(extractedData, 'expiry_date')) || '',
        type: {
          pre_employment: false,
          periodical: false,
          exit: false
        },
        test_results: {}
      },
      certification: {
        fit: false,
        fit_with_restrictions: false,
        fit_with_condition: false,
        temporarily_unfit: false,
        unfit: false,
        follow_up: '',
        review_date: '',
        comments: '',
        valid_until: cleanValue(extractPath(extractedData, 'examination.next_date')) || 
                    cleanValue(extractPath(extractedData, 'valid_until')) || 
                    cleanValue(extractPath(extractedData, 'expiry_date')) || ''
      },
      restrictions: {},
      raw_content: markdown || null
    };
    
    // If we have markdown, extract more detailed data
    if (markdown) {
      console.log('Extracting detailed data from markdown');
      
      // 1. Extract Patient Information using more specific patterns
      const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i);
      if (nameMatch && nameMatch[1]) {
        structuredData.patient.name = cleanValue(nameMatch[1].trim());
        console.log('Extracted name:', structuredData.patient.name);
      }
      
      const idMatch = markdown.match(/\*\*ID NO\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i);
      if (idMatch && idMatch[1]) {
        structuredData.patient.employee_id = cleanValue(idMatch[1].trim());
        console.log('Extracted ID:', structuredData.patient.employee_id);
      }
      
      const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i);
      if (companyMatch && companyMatch[1]) {
        structuredData.patient.company = cleanValue(companyMatch[1].trim());
        console.log('Extracted company:', structuredData.patient.company);
      }
      
      const examDateMatch = markdown.match(/\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i);
      if (examDateMatch && examDateMatch[1]) {
        structuredData.examination_results.date = cleanValue(examDateMatch[1].trim());
        console.log('Extracted exam date:', structuredData.examination_results.date);
      }
      
      const expiryDateMatch = markdown.match(/\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i);
      if (expiryDateMatch && expiryDateMatch[1]) {
        structuredData.certification.valid_until = cleanValue(expiryDateMatch[1].trim());
        console.log('Extracted expiry date:', structuredData.certification.valid_until);
      }
      
      // Job Title extraction - try multiple patterns
      const jobTitlePatterns = [
        /Job Title:\s*(.*?)(?=\n|\r|$|<!--)/i,
        /\*\*Job Title\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i,
        /Job\s*Title\s*[:\-]\s*(.*?)(?=\n|\r|$|<)/i
      ];
      
      for (const pattern of jobTitlePatterns) {
        const match = markdown.match(pattern);
        if (match && match[1]) {
          structuredData.patient.occupation = cleanValue(match[1].trim());
          console.log('Extracted job title:', structuredData.patient.occupation);
          break;
        }
      }
      
      // 2. Extract Examination Type with multiple checkbox styles
      structuredData.examination_results.type = {
        pre_employment: isCheckboxMarked(markdown, 'PRE-EMPLOYMENT'),
        periodical: isCheckboxMarked(markdown, 'PERIODICAL'),
        exit: isCheckboxMarked(markdown, 'EXIT')
      };
      
      console.log('Examination types:', structuredData.examination_results.type);
      
      // 3. Extract Medical Test Results with multiple marking styles
      structuredData.examination_results.test_results = extractTestResults(markdown);
      
      console.log('Test results:', structuredData.examination_results.test_results);
      
      // 4. Extract Fitness Status
      structuredData.certification = {
        fit: isCheckboxMarked(markdown, 'FIT') && !markdown.includes('crossed out'),
        fit_with_restrictions: isCheckboxMarked(markdown, 'Fit with Restriction'),
        fit_with_condition: isCheckboxMarked(markdown, 'Fit with Condition'),
        temporarily_unfit: isCheckboxMarked(markdown, 'Temporary Unfit'),
        unfit: isCheckboxMarked(markdown, 'UNFIT'),
        follow_up: cleanValue(extractFollowUp(markdown)),
        review_date: cleanValue(extractReviewDate(markdown)),
        comments: cleanValue(extractComments(markdown)),
        valid_until: structuredData.certification.valid_until
      };
      
      console.log('Certification status:', {
        fit: structuredData.certification.fit,
        with_restrictions: structuredData.certification.fit_with_restrictions,
        with_condition: structuredData.certification.fit_with_condition,
        temp_unfit: structuredData.certification.temporarily_unfit,
        unfit: structuredData.certification.unfit
      });
      
      // 5. Extract Restrictions
      structuredData.restrictions = extractRestrictions(markdown);
      
      console.log('Restrictions:', structuredData.restrictions);
    }
    
    return structuredData;
    
  } catch (error) {
    console.error('Error processing certificate of fitness data:', error);
    // Return basic structure with default values on error
    return {
      patient: {
        name: "Unknown",
        employee_id: "Unknown"
      },
      examination_results: {
        date: new Date().toISOString().split('T')[0],
        fitness_status: "Unknown",
        type: {},
        test_results: {}
      },
      certification: {},
      restrictions: {}
    };
  }
}

// Helper function to check if a checkbox is marked with various styles
function isCheckboxMarked(markdown: string, fieldName: string): boolean {
  if (!markdown || !fieldName) return false;
  
  // Get the context around the field name
  const index = markdown.indexOf(fieldName);
  if (index === -1) return false;
  
  const contextStart = Math.max(0, index - 50);
  const contextEnd = Math.min(markdown.length, index + fieldName.length + 100);
  const context = markdown.substring(contextStart, contextEnd);
  
  console.log(`Checking for '${fieldName}' marking:`, context.substring(0, 100));
  
  // Look for various checkbox marking patterns
  const isMarked = (
    context.includes('[x]') || 
    context.includes('[X]') || 
    context.includes('✓') || 
    context.includes('✔') || 
    context.includes('checked') || 
    context.includes('marked') || 
    context.includes('selected') || 
    context.includes('ticked')
  );
  
  const isCrossedOut = context.includes('crossed out') || context.includes('X drawn over');
  
  // Special case for "FIT" - check if it's crossed out
  if (fieldName === 'FIT' && isCrossedOut) {
    console.log('FIT is crossed out');
    return false;
  }
  
  console.log(`Field '${fieldName}' is marked:`, isMarked);
  return isMarked;
}

// Helper function to extract test results with multiple marking styles
function extractTestResults(markdown: string): any {
  const testResults: any = {};
  
  // Define tests to look for
  const tests = [
    { name: 'BLOODS', key: 'bloods' },
    { name: 'FAR, NEAR VISION', key: 'far_near_vision' },
    { name: 'SIDE & DEPTH', key: 'side_depth' },
    { name: 'NIGHT VISION', key: 'night_vision' },
    { name: 'Hearing', key: 'hearing' },
    { name: 'Working at Heights', key: 'heights' },
    { name: 'Lung Function', key: 'lung_function' },
    { name: 'X-Ray', key: 'x_ray' },
    { name: 'Drug Screen', key: 'drug_screen' }
  ];
  
  tests.forEach(test => {
    // Check if test is done using multiple detection methods
    const isDone = isCheckboxMarked(markdown, test.name);
    testResults[`${test.key}_done`] = isDone;
    
    // Try to extract test results
    if (isDone) {
      const resultPatterns = [
        // Result after checkbox in table format
        new RegExp(`${test.name}.*?(?:\\[(?:x|X|✓|✔)\\]|✓|✔).*?<td>(.*?)</td>`, 'i'),
        // Result in description format
        new RegExp(`\\*\\*${test.name}\\*\\*:.*?(?:Done|Completed).*?result\\s+is\\s+(.*?)(?=\\.|\\n|<)`, 'i'),
        // General pattern to find results
        new RegExp(`${test.name}.*?(\\d+\\/\\d+|Normal|\\d+\\.\\d+|Mild|Moderate|Severe|Restriction|Pass|Fail)`, 'i')
      ];
      
      for (const pattern of resultPatterns) {
        const match = markdown.match(pattern);
        if (match && match.length > 1) {
          // Use last capturing group as the result
          const resultIndex = match.length > 2 ? 2 : 1;
          testResults[`${test.key}_results`] = cleanValue(match[resultIndex].trim());
          break;
        }
      }
    }
  });
  
  return testResults;
}

// Helper function to extract restrictions with multiple marking styles
function extractRestrictions(markdown: string): any {
  const restrictions: any = {};
  
  const restrictionTypes = [
    { name: 'Heights', key: 'heights' },
    { name: 'Dust Exposure', key: 'dust_exposure' },
    { name: 'Motorized Equipment', key: 'motorized_equipment' },
    { name: 'Wear Hearing Protection', key: 'wear_hearing_protection' },
    { name: 'Confined Spaces', key: 'confined_spaces' },
    { name: 'Chemical Exposure', key: 'chemical_exposure' },
    { name: 'Wear Spectacles', key: 'wear_spectacles' },
    { name: 'Remain on Treatment for Chronic Conditions', key: 'remain_on_treatment_for_chronic_conditions' }
  ];
  
  restrictionTypes.forEach(restriction => {
    restrictions[restriction.key] = isCheckboxMarked(markdown, restriction.name);
  });
  
  return restrictions;
}

// Helper functions to extract specific fields
function extractFollowUp(markdown: string): string {
  const followUpMatch = markdown.match(/Referred or follow up actions:(.*?)(?=\n|\r|$|<|Review Date)/i);
  return followUpMatch && followUpMatch[1] ? followUpMatch[1].trim() : '';
}

function extractReviewDate(markdown: string): string {
  const reviewDateMatch = markdown.match(/Review Date:(.*?)(?=\n|\r|$|<)/i);
  return reviewDateMatch && reviewDateMatch[1] ? reviewDateMatch[1].trim() : '';
}

function extractComments(markdown: string): string {
  const commentsMatch = markdown.match(/Comments:(.*?)(?=\n\n|\r\n\r\n|$|<)/is);
  if (commentsMatch && commentsMatch[1]) {
    let comments = commentsMatch[1].trim();
    // If it's just "N/A" or empty after HTML tags are removed
    if (comments.replace(/<\/?[^>]+(>|$)/g, "").trim() === "N/A" || 
        comments.replace(/<\/?[^>]+(>|$)/g, "").trim() === "") {
      return "N/A";
    }
    return comments;
  }
  return '';
}

// Helper function to clean HTML comments from extracted values
function cleanValue(value: string | null | undefined): string {
  if (!value) return '';
  
  // Remove HTML comments: <!-- ... -->
  let cleaned = value.replace(/\s*<!--.*?-->\s*/g, ' ').trim();
  
  // Also remove form bounding box coordinates and IDs
  cleaned = cleaned.replace(/\s*<!\-\- \w+, from page \d+ \(.*?\), with ID .*? \-\->\s*/g, ' ').trim();
  
  // Remove coordinates directly in text (l=0.064,t=0.188,r=0.936,b=0.284)
  cleaned = cleaned.replace(/\s*\(l=[\d\.]+,t=[\d\.]+,r=[\d\.]+,b=[\d\.]+\)\s*/g, ' ').trim();
  
  // Remove IDs in text - with ID 5d5dece1-814c-40b8-ac21-2d9877814985
  cleaned = cleaned.replace(/\s*with ID [a-f0-9\-]+\s*/g, ' ').trim();
  
  // Clean up any remaining <!-- or --> fragments
  cleaned = cleaned.replace(/<!--|-->/g, '').trim();
  
  return cleaned;
}

// Helper function to safely extract nested properties from an object
function extractPath(obj: any, path: string): any {
  if (!obj) return undefined;
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

// Helper function to check if a condition exists in an array of conditions
function checkCondition(data: any, path: string, condition: string): boolean {
  const conditions = extractPath(data, path);
  if (!Array.isArray(conditions)) return false;
  
  return conditions.some((item: string) => 
    typeof item === 'string' && item.toLowerCase().includes(condition.toLowerCase())
  );
}
