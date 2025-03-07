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
      
      // Extract Patient Information using more specific patterns
      structuredData = extractPatientInfoFromMarkdown(markdown, structuredData);
      
      // Extract Examination Type
      structuredData.examination_results.type = extractExaminationTypeFromMarkdown(markdown);
      
      console.log('Examination types:', structuredData.examination_results.type);
      
      // Extract Medical Test Results - improved to better extract test results
      structuredData.examination_results.test_results = extractTestResultsFromMarkdown(markdown);
      
      console.log('Test results:', structuredData.examination_results.test_results);
      
      // Extract Fitness Status
      structuredData.certification = extractFitnessStatusFromMarkdown(markdown, structuredData.certification);
      
      console.log('Certification status:', {
        fit: structuredData.certification.fit,
        with_restrictions: structuredData.certification.fit_with_restrictions,
        with_condition: structuredData.certification.fit_with_condition,
        temp_unfit: structuredData.certification.temporarily_unfit,
        unfit: structuredData.certification.unfit
      });
      
      // Extract Restrictions
      structuredData.restrictions = extractRestrictionsFromMarkdown(markdown);
      
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

// Helper function to extract patient information from markdown
function extractPatientInfoFromMarkdown(markdown, structuredData) {
  // Name extraction
  const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i);
  if (nameMatch && nameMatch[1]) {
    structuredData.patient.name = cleanValue(nameMatch[1].trim());
    console.log('Extracted name:', structuredData.patient.name);
  }
  
  // ID extraction
  const idMatch = markdown.match(/\*\*ID No\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i);
  if (idMatch && idMatch[1]) {
    structuredData.patient.employee_id = cleanValue(idMatch[1].trim());
    console.log('Extracted ID:', structuredData.patient.employee_id);
  }
  
  // Company extraction
  const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i);
  if (companyMatch && companyMatch[1]) {
    structuredData.patient.company = cleanValue(companyMatch[1].trim());
    console.log('Extracted company:', structuredData.patient.company);
  }
  
  // Exam date extraction
  const examDateMatch = markdown.match(/\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i);
  if (examDateMatch && examDateMatch[1]) {
    structuredData.examination_results.date = cleanValue(examDateMatch[1].trim());
    console.log('Extracted exam date:', structuredData.examination_results.date);
  }
  
  // Expiry date extraction
  const expiryDateMatch = markdown.match(/\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i);
  if (expiryDateMatch && expiryDateMatch[1]) {
    structuredData.certification.valid_until = cleanValue(expiryDateMatch[1].trim());
    console.log('Extracted expiry date:', structuredData.certification.valid_until);
  }
  
  // Job Title extraction - try multiple patterns
  const jobTitlePatterns = [
    /\*\*Job Title\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i,
    /Job Title:\s*(.*?)(?=\n|\r|$|<!--)/i,
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
  
  return structuredData;
}

// Helper function to extract examination type from markdown
function extractExaminationTypeFromMarkdown(markdown) {
  // Look for examination type markers in the markdown
  const preEmploymentMatch = directlyExtractCheckedBox(markdown, "Pre-Employment");
  const periodicalMatch = directlyExtractCheckedBox(markdown, "Periodical");
  const exitMatch = directlyExtractCheckedBox(markdown, "Exit");
  
  console.log('Examination types found:', {
    preEmploymentMatch,
    periodicalMatch,
    exitMatch
  });
  
  return {
    pre_employment: preEmploymentMatch,
    periodical: periodicalMatch,
    exit: exitMatch
  };
}

// Helper function to directly extract if a checkbox is checked from markdown
function directlyExtractCheckedBox(markdown, label) {
  // First, find the section containing the label
  const lines = markdown.split('\n');
  let labelLine = '';
  
  for (const line of lines) {
    if (line.includes(label)) {
      labelLine = line;
      break;
    }
  }
  
  if (!labelLine) return false;
  
  // Check if this line contains a checked box
  return labelLine.includes('[x]') || labelLine.includes('[X]');
}

// Helper function to extract test results from markdown
function extractTestResultsFromMarkdown(markdown) {
  const testResults = {};
  
  // Define common tests to look for
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
  
  // Look for a table section with test results
  const tablePattern = /<table>[\s\S]*?<\/table>/g;
  const tables = markdown.match(tablePattern) || [];
  
  console.log(`Found ${tables.length} tables in the markdown`);
  
  if (tables.length > 0) {
    // Process each test directly from the table
    for (const test of tests) {
      // Normalize test name for case-insensitive matching
      const testNameVariants = [
        test.name,
        test.name.toUpperCase(),
        test.name.toLowerCase(),
        test.name.replace(/\s/g, '')
      ];
      
      let isDone = false;
      let result = null;
      
      // Check each table for the test
      for (const table of tables) {
        for (const variant of testNameVariants) {
          // Create a pattern to match the row containing this test
          const rowPattern = new RegExp(`<tr>\\s*<td>[^<]*${variant}[^<]*</td>\\s*<td>\\[(x|X|)\\]</td>\\s*<td>([^<]*)</td>`, 'i');
          const match = table.match(rowPattern);
          
          if (match) {
            // Check if the checkbox is marked
            isDone = match[1] === 'x' || match[1] === 'X';
            result = match[2].trim();
            if (result === 'N/A') result = null;
            
            console.log(`Found test ${test.name}: done=${isDone}, result=${result}`);
            break;
          }
        }
        
        if (isDone || result) break;
      }
      
      // Regular expression fallback for non-table formats
      if (!isDone && !result) {
        // Look for alternative formats like lists
        for (const variant of testNameVariants) {
          const listPattern = new RegExp(`\\| ${variant}\\s*\\| \\[(x|X|)\\]\\s*\\| ([^\\|]*)\\|`, 'i');
          const match = markdown.match(listPattern);
          
          if (match) {
            isDone = match[1] === 'x' || match[1] === 'X';
            result = match[2].trim();
            if (result === 'N/A') result = null;
            
            console.log(`Found test in list format ${test.name}: done=${isDone}, result=${result}`);
            break;
          }
        }
      }
      
      // Set the test status and result in our return object
      testResults[`${test.key}_done`] = isDone;
      if (result) {
        testResults[`${test.key}_results`] = result;
      }
    }
  } else {
    // If no tables, try to extract from other formats (lists, paragraphs)
    for (const test of tests) {
      const isDone = directlyExtractCheckedBox(markdown, test.name);
      testResults[`${test.key}_done`] = isDone;
      
      // Try to extract results if the test is done
      if (isDone) {
        const resultPattern = new RegExp(`${test.name}[^\\n]*?:\\s*([^\\n,]*?)(?:\\n|,|$)`, 'i');
        const match = markdown.match(resultPattern);
        if (match && match[1] && match[1].trim() !== 'N/A') {
          testResults[`${test.key}_results`] = match[1].trim();
        }
      }
    }
  }
  
  return testResults;
}

// Helper function to extract fitness status from markdown
function extractFitnessStatusFromMarkdown(markdown, certification) {
  // Look for fitness declaration section
  const fitnessSection = extractSection(markdown, 'Medical Fitness Declaration', 'Comments');
  
  if (fitnessSection) {
    certification.fit = directlyExtractCheckedBox(fitnessSection, 'FIT');
    certification.fit_with_restrictions = directlyExtractCheckedBox(fitnessSection, 'Fit with Restriction');
    certification.fit_with_condition = directlyExtractCheckedBox(fitnessSection, 'Fit with Condition');
    certification.temporarily_unfit = directlyExtractCheckedBox(fitnessSection, 'Temporary Unfit');
    certification.unfit = directlyExtractCheckedBox(fitnessSection, 'UNFIT');
    
    // Special case: Check if FIT is crossed out
    const fitCrossedOut = fitnessSection.includes('crossing it out') || 
                         fitnessSection.includes('crossed out') || 
                         fitnessSection.includes('large "X"') ||
                         markdown.includes('crossing out of the word "FIT"');
                         
    if (fitCrossedOut) {
      certification.fit = false;
      certification.unfit = true;
    }
  } else {
    // Fallback: check whole document
    certification.fit = directlyExtractCheckedBox(markdown, 'FIT') && 
                      !markdown.includes('crossing it out') && 
                      !markdown.includes('crossed out');
    certification.fit_with_restrictions = directlyExtractCheckedBox(markdown, 'Fit with Restriction');
    certification.fit_with_condition = directlyExtractCheckedBox(markdown, 'Fit with Condition');
    certification.temporarily_unfit = directlyExtractCheckedBox(markdown, 'Temporary Unfit');
    certification.unfit = directlyExtractCheckedBox(markdown, 'UNFIT') || 
                         markdown.includes('crossing it out') || 
                         markdown.includes('crossed out');
  }
  
  // Extract follow-up actions if available
  const followUpMatch = markdown.match(/Referred or follow up actions:\s*(.*?)(?=\n\n|\r\n\r\n|$|Review Date)/is);
  if (followUpMatch && followUpMatch[1] && followUpMatch[1].trim() !== '') {
    certification.follow_up = cleanValue(followUpMatch[1].trim());
  }
  
  // Extract review date if available
  const reviewDateMatch = markdown.match(/Review Date:\s*(.*?)(?=\n|\r|$|<)/i);
  if (reviewDateMatch && reviewDateMatch[1] && reviewDateMatch[1].trim() !== '') {
    certification.review_date = cleanValue(reviewDateMatch[1].trim());
  }
  
  // Extract comments if available
  const commentsMatch = markdown.match(/Comments:\s*(.*?)(?=\n\n|\r\n\r\n|$|<)/is);
  if (commentsMatch && commentsMatch[1]) {
    let comments = commentsMatch[1].trim();
    if (comments !== 'N/A' && comments !== '') {
      certification.comments = cleanValue(comments);
    }
  }
  
  return certification;
}

// Helper function to extract a section from markdown
function extractSection(markdown, startMarker, endMarker) {
  const startIndex = markdown.indexOf(startMarker);
  if (startIndex === -1) return null;
  
  const endIndex = endMarker ? markdown.indexOf(endMarker, startIndex) : markdown.length;
  if (endIndex === -1) return markdown.substring(startIndex);
  
  return markdown.substring(startIndex, endIndex);
}

// Helper function to extract restrictions from markdown
function extractRestrictionsFromMarkdown(markdown) {
  const restrictions = {
    heights: false,
    dust_exposure: false,
    motorized_equipment: false,
    wear_hearing_protection: false,
    confined_spaces: false,
    chemical_exposure: false,
    wear_spectacles: false,
    remain_on_treatment_for_chronic_conditions: false
  };
  
  // Find the restrictions section if it exists
  const restrictionsSection = extractSection(markdown, 'Restrictions', 'Medical Fitness Declaration');
  
  if (restrictionsSection) {
    // Check each restriction directly
    restrictions.heights = directlyExtractCheckedBox(restrictionsSection, 'Heights');
    restrictions.dust_exposure = directlyExtractCheckedBox(restrictionsSection, 'Dust Exposure');
    restrictions.motorized_equipment = directlyExtractCheckedBox(restrictionsSection, 'Motorized Equipment');
    restrictions.wear_hearing_protection = directlyExtractCheckedBox(restrictionsSection, 'Wear Hearing Protection');
    restrictions.confined_spaces = directlyExtractCheckedBox(restrictionsSection, 'Confined Spaces');
    restrictions.chemical_exposure = directlyExtractCheckedBox(restrictionsSection, 'Chemical Exposure');
    restrictions.wear_spectacles = directlyExtractCheckedBox(restrictionsSection, 'Wear Spectacles');
    restrictions.remain_on_treatment_for_chronic_conditions = directlyExtractCheckedBox(restrictionsSection, 'Remain on Treatment');
  } else {
    // Fallback: check the whole document
    restrictions.heights = directlyExtractCheckedBox(markdown, 'Heights');
    restrictions.dust_exposure = directlyExtractCheckedBox(markdown, 'Dust Exposure');
    restrictions.motorized_equipment = directlyExtractCheckedBox(markdown, 'Motorized Equipment');
    restrictions.wear_hearing_protection = directlyExtractCheckedBox(markdown, 'Wear Hearing Protection');
    restrictions.confined_spaces = directlyExtractCheckedBox(markdown, 'Confined Spaces');
    restrictions.chemical_exposure = directlyExtractCheckedBox(markdown, 'Chemical Exposure');
    restrictions.wear_spectacles = directlyExtractCheckedBox(markdown, 'Wear Spectacles');
    restrictions.remain_on_treatment_for_chronic_conditions = directlyExtractCheckedBox(markdown, 'Remain on Treatment');
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
