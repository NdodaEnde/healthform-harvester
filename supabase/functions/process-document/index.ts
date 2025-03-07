
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
      
      // 2. Extract Examination Type - IMPROVED to better detect checkboxes
      const preEmploymentMatch = markdown.includes('Pre-Employment') && checkboxIsMarked(markdown, 'Pre-Employment');
      const periodicalMatch = markdown.includes('Periodical') && checkboxIsMarked(markdown, 'Periodical');
      const exitMatch = markdown.includes('Exit') && checkboxIsMarked(markdown, 'Exit');
      
      structuredData.examination_results.type = {
        pre_employment: preEmploymentMatch,
        periodical: periodicalMatch,
        exit: exitMatch
      };
      
      console.log('Examination types:', structuredData.examination_results.type);
      
      // 3. Extract Medical Test Results - IMPROVED to better detect checked boxes and results
      structuredData.examination_results.test_results = extractTestResults(markdown);
      
      console.log('Test results:', structuredData.examination_results.test_results);
      
      // 4. Extract Fitness Status - IMPROVED to detect crossed out status
      const fitStatusCrossedOut = markdown.includes('FIT') && 
                                 (markdown.includes('crossed out') || 
                                  markdown.includes('drawn over') || 
                                  markdown.includes('large "X"') ||
                                  markdown.toLowerCase().includes('crossing it out'));
      
      structuredData.certification = {
        fit: markdown.includes('FIT') && !fitStatusCrossedOut,
        fit_with_restrictions: checkboxIsMarked(markdown, 'Fit with Restriction'),
        fit_with_condition: checkboxIsMarked(markdown, 'Fit with Condition'),
        temporarily_unfit: checkboxIsMarked(markdown, 'Temporary Unfit'),
        unfit: checkboxIsMarked(markdown, 'UNFIT') || fitStatusCrossedOut,
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
      
      // 5. Extract Restrictions - IMPROVED to better detect restrictions
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

// NEW IMPROVED function to check if a checkbox is marked with improved detection
function checkboxIsMarked(markdown: string, fieldName: string): boolean {
  if (!markdown || !fieldName) return false;
  
  // Find the line or context containing the field name
  const lines = markdown.split('\n');
  let fieldLine = '';
  let windowStart = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(fieldName)) {
      fieldLine = lines[i];
      windowStart = Math.max(0, i - 2);
      break;
    }
  }
  
  if (!fieldLine) return false;
  
  // Check the line containing the field and a few lines after for checkbox markers
  const contextWindow = lines.slice(windowStart, windowStart + 5).join('\n');
  
  // Look for checkbox markers near the field name
  const markerPatterns = [
    new RegExp(`${fieldName}.*?\\[x\\]`, 'i'),
    new RegExp(`${fieldName}.*?\\[X\\]`, 'i'),
    new RegExp(`\\[x\\].*?${fieldName}`, 'i'),
    new RegExp(`\\[X\\].*?${fieldName}`, 'i'),
    new RegExp(`${fieldName}.*?✓`, 'i'),
    new RegExp(`${fieldName}.*?✔`, 'i'),
    new RegExp(`${fieldName}.*?checked`, 'i'),
    new RegExp(`${fieldName}.*?marked`, 'i'),
    new RegExp(`${fieldName}.*?selected`, 'i')
  ];
  
  for (const pattern of markerPatterns) {
    if (pattern.test(contextWindow)) {
      console.log(`Field '${fieldName}' is marked (pattern match)`);
      return true;
    }
  }
  
  // If the field appears in a table row with [x] anywhere in that row
  if (fieldLine.includes('<td>') && (
    contextWindow.includes('[x]') || 
    contextWindow.includes('[X]') || 
    contextWindow.includes('✓') || 
    contextWindow.includes('✔')
  )) {
    console.log(`Field '${fieldName}' is marked (table row with checkbox)`);
    return true;
  }
  
  // Special handling for exam type checkboxes which might be in a list style
  if (fieldName === 'Pre-Employment' || fieldName === 'Periodical' || fieldName === 'Exit') {
    const examTypeContext = markdown.substring(
      markdown.indexOf('Examination Type') - 10, 
      markdown.indexOf('Examination Type') + 150
    );
    
    const specificPattern = new RegExp(`\\*\\*${fieldName}\\*\\*:\\s*\\[(x|X)\\]`, 'i');
    if (specificPattern.test(examTypeContext)) {
      console.log(`Exam type '${fieldName}' is marked (specific match)`);
      return true;
    }
  }
  
  console.log(`Field '${fieldName}' is NOT marked`);
  return false;
}

// IMPROVED helper function to extract test results more accurately
function extractTestResults(markdown: string): any {
  const testResults: any = {};
  
  // Define tests to look for
  const tests = [
    { name: 'Bloods', key: 'bloods' },
    { name: 'Far, Near Vision', key: 'far_near_vision' },
    { name: 'Side & Depth', key: 'side_depth' },
    { name: 'Night Vision', key: 'night_vision' },
    { name: 'Hearing', key: 'hearing' },
    { name: 'Working at Heights', key: 'heights' },
    { name: 'Lung Function', key: 'lung_function' },
    { name: 'X-Ray', key: 'x_ray' },
    { name: 'Drug Screen', key: 'drug_screen' }
  ];
  
  // Check if there are tables in the markdown
  const hasTables = markdown.includes('<table>');
  
  tests.forEach(test => {
    // First check if the test is mentioned anywhere
    if (markdown.includes(test.name)) {
      // Look for checkbox markers in context of the test name
      const isDone = isTestChecked(markdown, test.name, hasTables);
      testResults[`${test.key}_done`] = isDone;
      
      // Attempt to extract test results if the test was done
      if (isDone) {
        let resultValue = extractTestResult(markdown, test.name, hasTables);
        if (resultValue) {
          testResults[`${test.key}_results`] = resultValue;
        }
      }
    } else {
      // Test not found in document
      testResults[`${test.key}_done`] = false;
    }
  });
  
  return testResults;
}

// NEW helper function to check if a medical test is checked/done
function isTestChecked(markdown: string, testName: string, hasTables: boolean): boolean {
  if (hasTables) {
    // For table format, look for a row with test name and a checked box
    const tablePattern = new RegExp(`<tr>[\\s\\S]*?<td>${testName}</td>[\\s\\S]*?<td>\\[(x|X)\\]</td>`, 'i');
    const tableMarked = tablePattern.test(markdown);
    
    if (tableMarked) {
      console.log(`Test '${testName}' is marked in table`);
      return true;
    }
  }
  
  // General context check for checkbox markers near test name
  const testNameIndex = markdown.indexOf(testName);
  if (testNameIndex === -1) return false;
  
  const contextStart = Math.max(0, testNameIndex - 30);
  const contextEnd = Math.min(markdown.length, testNameIndex + testName.length + 50);
  const context = markdown.substring(contextStart, contextEnd);
  
  // Look for checkbox markers in context
  const isMarked = (
    context.includes('[x]') || 
    context.includes('[X]') || 
    context.includes('✓') || 
    context.includes('✔') || 
    context.includes('Done') ||
    context.includes('Completed') ||
    context.includes('checked') || 
    context.includes('marked')
  );
  
  console.log(`Test '${testName}' is marked: ${isMarked} (context check)`);
  return isMarked;
}

// NEW helper function to extract test result values
function extractTestResult(markdown: string, testName: string, hasTables: boolean): string | null {
  let result = null;
  
  if (hasTables) {
    // For table format, extract result from the third column
    const tableRowPattern = new RegExp(`<tr>[\\s\\S]*?<td>${testName}</td>[\\s\\S]*?<td>\\[(x|X)\\]</td>[\\s\\S]*?<td>(.*?)</td>`, 'i');
    const tableMatch = markdown.match(tableRowPattern);
    
    if (tableMatch && tableMatch[2]) {
      result = tableMatch[2].trim();
      if (result === 'N/A' || result === '') return null;
      console.log(`Extracted table result for ${testName}: ${result}`);
      return result;
    }
  }
  
  // Try other common patterns for results
  const patterns = [
    // Test followed by result
    new RegExp(`${testName}[\\s\\S]*?(\\d+\\.\\d+|\\d+\\/\\d+|Normal|Mild|Moderate|Severe|Restriction|Pass|Fail)`, 'i'),
    // Result in nearby text
    new RegExp(`${testName}[\\s\\S]{1,50}result[\\s:\\s]+(\\d+\\.\\d+|\\d+\\/\\d+|Normal|Mild|Moderate|Severe|Restriction|Pass|Fail)`, 'i'),
    // Vision test format
    new RegExp(`${testName}[\\s\\S]{1,50}(20\\/\\d+)`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      result = match[1].trim();
      console.log(`Extracted pattern result for ${testName}: ${result}`);
      return result;
    }
  }
  
  return null;
}

// IMPROVED helper function to extract restrictions
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
  
  // Check if there's a restrictions section
  const restrictionsSection = markdown.indexOf('Restrictions') > -1 ? 
    markdown.substring(markdown.indexOf('Restrictions'), 
                     markdown.indexOf('Restrictions') + 500) : 
    '';
  
  if (restrictionsSection) {
    restrictionTypes.forEach(restriction => {
      // Check if the restriction is specifically marked
      restrictions[restriction.key] = restrictionsSection.includes(restriction.name) && 
                                    (restrictionsSection.includes(`${restriction.name}.*?\\[x\\]`) || 
                                     restrictionsSection.includes(`${restriction.name}.*?\\[X\\]`) ||
                                     restrictionsSection.includes(`${restriction.name}.*?✓`) ||
                                     restrictionsSection.includes(`${restriction.name}.*?✔`) ||
                                     restrictionsSection.includes(`${restriction.name}.*?checked`) ||
                                     restrictionsSection.includes(`${restriction.name}.*?Marked`));
      
      // As a fallback, check if the restriction is in the highlighted or emphasized section
      if (!restrictions[restriction.key]) {
        restrictions[restriction.key] = restrictionsSection.includes(restriction.name) && 
                                      (restrictionsSection.includes(`<strong>${restriction.name}</strong>`) ||
                                       restrictionsSection.includes(`<b>${restriction.name}</b>`) ||
                                       restrictionsSection.includes(`<em>${restriction.name}</em>`) ||
                                       restrictionsSection.includes(`<i>${restriction.name}</i>`) ||
                                       restrictionsSection.includes(`**${restriction.name}**`));
      }
    });
  } else {
    // If no restrictions section found, check the entire document for each restriction
    restrictionTypes.forEach(restriction => {
      restrictions[restriction.key] = checkboxIsMarked(markdown, restriction.name);
    });
  }
  
  return restrictions;
}

// Helper function to check if a condition exists in an array of conditions
function checkCondition(data: any, path: string, condition: string): boolean {
  const conditions = extractPath(data, path);
  if (!Array.isArray(conditions)) return false;
  
  return conditions.some((item: string) => 
    typeof item === 'string' && item.toLowerCase().includes(condition.toLowerCase())
  );
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

// Legacy helper function kept for backward compatibility
function isCheckboxMarked(markdown: string, fieldName: string): boolean {
  return checkboxIsMarked(markdown, fieldName);
}
