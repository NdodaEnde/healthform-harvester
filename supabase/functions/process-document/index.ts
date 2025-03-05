
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
    console.log('Markdown content:', markdown);
    
    // Extract data from markdown if present
    let markdownData: any = {
      patient: {},
      examination: {}
    };
    
    if (markdown) {
      // Extract document information from markdown bullet points
      const docInfoMatch = markdown.match(/## Document Information\s*\n\s*-\s*\*\*Initials & Surname\*\*:([^\n]*)\s*\n\s*-\s*\*\*ID NO\*\*:([^\n]*)\s*\n\s*-\s*\*\*Company Name\*\*:([^\n]*)\s*\n\s*-\s*\*\*Date of Examination\*\*:([^\n]*)\s*\n\s*-\s*\*\*Expiry Date\*\*:([^\n]*)/i);
      
      if (docInfoMatch) {
        markdownData.patient.name = cleanValue(docInfoMatch[1].trim());
        markdownData.patient.id_number = cleanValue(docInfoMatch[2].trim());
        markdownData.patient.company = cleanValue(docInfoMatch[3].trim());
        markdownData.examination.date = cleanValue(docInfoMatch[4].trim());
        markdownData.examination.next_examination_date = cleanValue(docInfoMatch[5].trim());
        
        console.log("Extracted from document info section:", {
          name: markdownData.patient.name,
          id: markdownData.patient.id_number,
          company: markdownData.patient.company,
          exam_date: markdownData.examination.date,
          expiry_date: markdownData.examination.next_examination_date
        });
      } else {
        // Fallback to individual field extraction
        // Common fields
        const nameMatch = markdown.match(/\*\*Initials & Surname\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i);
        const idMatch = markdown.match(/\*\*ID NO\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i);
        const companyMatch = markdown.match(/\*\*Company Name\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i);
        const examDateMatch = markdown.match(/\*\*Date of Examination\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i) || 
                             markdown.match(/Date of Examination:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                             markdown.match(/Examination Date:\s*(.*?)(?=\n|\r|$|\*\*)/i);
        
        // Certificate details
        const expiryDateMatch = markdown.match(/\*\*Expiry Date\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i) || 
                               markdown.match(/Expiry Date:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                               markdown.match(/valid until:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                               markdown.match(/Next Examination Date:\s*(.*?)(?=\n|\r|$|\*\*)/i);
        
        // Set patient data if matches found
        if (nameMatch && nameMatch[1]) markdownData.patient.name = cleanValue(nameMatch[1].trim());
        if (idMatch && idMatch[1]) markdownData.patient.id_number = cleanValue(idMatch[1].trim());
        if (companyMatch && companyMatch[1]) markdownData.patient.company = cleanValue(companyMatch[1].trim());
        if (examDateMatch && examDateMatch[1]) markdownData.examination.date = cleanValue(examDateMatch[1].trim());
        if (expiryDateMatch && expiryDateMatch[1]) markdownData.examination.next_examination_date = cleanValue(expiryDateMatch[1].trim());
      }
      
      // Extract Job Title (with more specific pattern)
      const jobTitleMatch = markdown.match(/Job Title:\s*(.*?)(?=\n|\r|$|\*\*|<!--)/i) || 
                           markdown.match(/\*\*Job Title\*\*:\s*(.*?)(?=\n|\r|$|\*\*|<!--)/i) ||
                           markdown.match(/Occupation:\s*(.*?)(?=\n|\r|$|\*\*|<!--)/i);
                           
      if (jobTitleMatch && jobTitleMatch[1]) {
        markdownData.patient.occupation = cleanValue(jobTitleMatch[1].trim());
        console.log("Extracted job title:", markdownData.patient.occupation);
      }
      
      // Extract Examination Type
      if (markdown.includes('PRE-EMPLOYMENT') && 
         (markdown.includes('PRE-EMPLOYMENT.*?\\[x\\]') || markdown.includes('<td>PRE-EMPLOYMENT</td>.*?<td>\\[x\\]</td>'))) {
        markdownData.examination.type = { pre_employment: true, periodical: false, exit: false };
      } else if (markdown.includes('PERIODICAL') && 
                (markdown.includes('PERIODICAL.*?\\[x\\]') || markdown.includes('<td>PERIODICAL</td>.*?<td>\\[x\\]</td>'))) {
        markdownData.examination.type = { pre_employment: false, periodical: true, exit: false };
      } else if (markdown.includes('EXIT') && 
                (markdown.includes('EXIT.*?\\[x\\]') || markdown.includes('<td>EXIT</td>.*?<td>\\[x\\]</td>'))) {
        markdownData.examination.type = { pre_employment: false, periodical: false, exit: true };
      }
      
      // Extract physician
      const physicianMatch = markdown.match(/\*\*Medical Examiner\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                            markdown.match(/Medical Examiner:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                            markdown.match(/Physician:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                            markdown.match(/Doctor:\s*(.*?)(?=\n|\r|$|\*\*)/i);
      
      if (physicianMatch && physicianMatch[1]) markdownData.examination.physician = cleanValue(physicianMatch[1].trim());
      
      // Extract fitness status
      const fitnessStatusMatch = markdown.match(/\*\*Fitness Status\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                                markdown.match(/Fitness Status:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                                markdown.match(/Certification:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                                markdown.match(/is certified as:\s*(.*?)(?=\n|\r|$|\*\*)/i);
      
      if (fitnessStatusMatch && fitnessStatusMatch[1]) markdownData.examination.fitness_status = cleanValue(fitnessStatusMatch[1].trim());
      
      // Extract restrictions
      const restrictionsMatch = markdown.match(/\*\*Restrictions\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                               markdown.match(/Restrictions:\s*(.*?)(?=\n|\r|$|\*\*)/i) ||
                               markdown.match(/Limitations:\s*(.*?)(?=\n|\r|$|\*\*)/i);
      
      if (restrictionsMatch && restrictionsMatch[1]) markdownData.examination.restrictions = cleanValue(restrictionsMatch[1].trim());
      
      // Get additional fields from any two-column format
      const allFields = markdown.match(/\*\*(.*?)\*\*:\s*(.*?)(?=\n|\r|$|\*\*)/g) || [];
      
      allFields.forEach(field => {
        const parts = field.split('**:');
        if (parts.length === 2) {
          const key = parts[0].replace(/\*\*/g, '').trim().toLowerCase();
          const value = cleanValue(parts[1].trim());
          
          // Add any additional fields we haven't explicitly captured
          if (!['initials & surname', 'id no', 'company name', 'date of examination', 'expiry date', 
                'occupation', 'medical examiner', 'fitness status', 'restrictions'].includes(key)) {
            if (key.includes('date') || key.includes('examination')) {
              markdownData.examination[key.replace(/\s+/g, '_')] = value;
            } else {
              markdownData.patient[key.replace(/\s+/g, '_')] = value;
            }
          }
        }
      });
      
      console.log('Extracted markdown data:', JSON.stringify(markdownData, null, 2));
    }
    
    // Extract data for more advanced fields

    // 1. Extract Examination Type (Pre-employment, Periodical, Exit)
    const examinationType = {
      pre_employment: false,
      periodical: false,
      exit: false
    };

    if (markdown) {
      // Check various patterns for examination type
      if (markdown.match(/pre.?employment.*?\[\s*x\s*\]/is) || 
          markdown.match(/<td>pre.?employment<\/td>.*?<td>\[\s*x\s*\]<\/td>/is)) {
        examinationType.pre_employment = true;
      }
      
      if (markdown.match(/periodical.*?\[\s*x\s*\]/is) || 
          markdown.match(/<td>periodical<\/td>.*?<td>\[\s*x\s*\]<\/td>/is)) {
        examinationType.periodical = true;
      }
      
      if (markdown.match(/exit.*?\[\s*x\s*\]/is) || 
          markdown.match(/<td>exit<\/td>.*?<td>\[\s*x\s*\]<\/td>/is)) {
        examinationType.exit = true;
      }
    }

    // 2. Extract Medical Test Results
    const testResults: any = {};
    const testsMap = [
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
    
    if (markdown) {
      testsMap.forEach(test => {
        // Check multiple formats for test results
        
        // 1. Check table format with pipe separators
        const tableRegex = new RegExp(`\\| ${test.name}\\s*\\| \\[(x| )\\]\\s*\\| (.*?)\\|`, 'is');
        const tableMatch = markdown.match(tableRegex);
        
        // 2. Check list format with test name and result
        const listRegex = new RegExp(`${test.name}.*?\\[(x| )\\].*?(\\d+\\/\\d+|Normal|N\\/A|\\d+-\\d+)`, 'is');
        const listMatch = markdown.match(listRegex);
        
        // 3. Check HTML table format
        const htmlTableRegex = new RegExp(`<td>${test.name}</td>\\s*<td>\\[(x| )\\]</td>\\s*<td>(.*?)</td>`, 'is');
        const htmlTableMatch = markdown.match(htmlTableRegex);
        
        // 4. Check description format
        const descRegex = new RegExp(`\\*\\*${test.name}\\*\\*:\\s*(Done|Not done)(?:,\\s*result is\\s*(.*?))?(?=\\n|\\r|$|\\*\\*)`, 'is');
        const descMatch = markdown.match(descRegex);
        
        let isDone = false;
        let results = '';
        
        if (tableMatch) {
          isDone = tableMatch[1].trim() === 'x';
          results = tableMatch[2] ? cleanValue(tableMatch[2].trim()) : '';
        } else if (listMatch) {
          isDone = listMatch[1].trim() === 'x';
          results = listMatch[2] ? cleanValue(listMatch[2].trim()) : '';
        } else if (htmlTableMatch) {
          isDone = htmlTableMatch[1].trim() === 'x';
          results = htmlTableMatch[2] ? cleanValue(htmlTableMatch[2].trim()) : '';
        } else if (descMatch) {
          isDone = descMatch[1].toLowerCase() === 'done';
          results = descMatch[2] ? cleanValue(descMatch[2].trim()) : '';
        }
        
        if (isDone || results) {
          testResults[`${test.key}_done`] = isDone;
          testResults[`${test.key}_results`] = results;
        }
      });
    }

    // 3. Extract Fitness Status
    const fitnessStatus: any = {
      fit: false,
      fit_with_restrictions: false,
      fit_with_condition: false,
      temporarily_unfit: false,
      unfit: false
    };
    
    if (markdown) {
      const fitnessOptions = [
        { name: 'FIT', key: 'fit' },
        { name: 'Fit with Restriction', key: 'fit_with_restrictions' },
        { name: 'Fit with Condition', key: 'fit_with_condition' },
        { name: 'Temporary Unfit', key: 'temporarily_unfit' },
        { name: 'UNFIT', key: 'unfit' }
      ];
      
      fitnessOptions.forEach(option => {
        // Check multiple formats
        const patterns = [
          new RegExp(`\\*\\*${option.name}\\*\\*: \\[(x| )\\]`, 'is'),
          new RegExp(`<th>${option.name}</th>[\\s\\S]*?<td>\\[(x| )\\]</td>`, 'is'),
          new RegExp(`\\| ${option.name}\\s*\\| \\[(x| )\\]`, 'is')
        ];
        
        // Check all patterns
        let isSelected = false;
        for (const pattern of patterns) {
          const match = markdown.match(pattern);
          if (match && match[0].includes('[x]')) {
            isSelected = true;
            break;
          }
        }
        
        fitnessStatus[option.key] = isSelected;
      });
    }

    // 4. Extract Restrictions
    const restrictions: any = {};
    
    if (markdown) {
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
        // Check multiple formats
        const patterns = [
          new RegExp(`\\*\\*${restriction.name}\\*\\*: \\[(x| )\\]`, 'is'),
          new RegExp(`<td>${restriction.name}</td>\\s*<td>\\[(x| )\\]</td>`, 'is'),
          new RegExp(`\\| ${restriction.name}\\s*\\| \\[(x| )\\]`, 'is')
        ];
        
        // Check all patterns
        let isSelected = false;
        for (const pattern of patterns) {
          const match = markdown.match(pattern);
          if (match && match[0].includes('[x]')) {
            isSelected = true;
            break;
          }
        }
        
        restrictions[restriction.key] = isSelected;
      });
    }

    // 5. Extract Follow-up and Comments
    let followUp = '';
    let reviewDate = '';
    let comments = '';
    
    if (markdown) {
      const followUpMatch = markdown.match(/Referred or follow up actions:(.*?)(?=\n|\r|$|<|Review Date)/i);
      if (followUpMatch && followUpMatch[1]) followUp = cleanValue(followUpMatch[1].trim());
      
      const reviewDateMatch = markdown.match(/Review Date:(.*?)(?=\n|\r|$|<)/i);
      if (reviewDateMatch && reviewDateMatch[1]) reviewDate = cleanValue(reviewDateMatch[1].trim());
      
      const commentsMatch = markdown.match(/Comments:(.*?)(?=\n\n|\r\n\r\n|$|<)/is);
      if (commentsMatch && commentsMatch[1]) {
        comments = cleanValue(commentsMatch[1].trim());
        // If it's just "N/A" or empty after HTML tags are removed
        if (comments.replace(/<\/?[^>]+(>|$)/g, "").trim() === "N/A" || 
            comments.replace(/<\/?[^>]+(>|$)/g, "").trim() === "") {
          comments = "N/A";
        }
      }
    }
    
    // Merge data from both markdown and extracted JSON
    const structuredData = {
      patient: {
        name: markdownData.patient.name || 
              cleanValue(extractPath(extractedData, 'patient.name')) || 
              cleanValue(extractPath(extractedData, 'employee.name')) || 'Unknown',
        date_of_birth: markdownData.patient.date_of_birth || 
                      cleanValue(extractPath(extractedData, 'patient.date_of_birth')) || 
                      cleanValue(extractPath(extractedData, 'patient.dob')) || '',
        employee_id: markdownData.patient.id_number || 
                    cleanValue(extractPath(extractedData, 'patient.id')) || 
                    cleanValue(extractPath(extractedData, 'patient.id_number')) || 
                    cleanValue(extractPath(extractedData, 'employee.id')) || '',
        company: markdownData.patient.company || 
                cleanValue(extractPath(extractedData, 'company')) || 
                cleanValue(extractPath(extractedData, 'employer')) || 
                cleanValue(extractPath(extractedData, 'patient.company')) || '',
        occupation: markdownData.patient.occupation || 
                  cleanValue(extractPath(extractedData, 'patient.occupation')) || 
                  cleanValue(extractPath(extractedData, 'patient.job_title')) || 
                  cleanValue(extractPath(extractedData, 'occupation')) || '',
        gender: markdownData.patient.gender || 
               cleanValue(extractPath(extractedData, 'patient.gender')) || ''
      },
      examination_results: {
        date: markdownData.examination.date || 
              cleanValue(extractPath(extractedData, 'examination.date')) || 
              cleanValue(extractPath(extractedData, 'date')) || 
              new Date().toISOString().split('T')[0],
        physician: markdownData.examination.physician || 
                  cleanValue(extractPath(extractedData, 'examination.physician')) || 
                  cleanValue(extractPath(extractedData, 'physician')) || '',
        fitness_status: markdownData.examination.fitness_status || 
                       cleanValue(extractPath(extractedData, 'examination.fitness_status')) || 
                       cleanValue(extractPath(extractedData, 'fitness_status')) || 'Unknown',
        restrictions: markdownData.examination.restrictions || 
                     cleanValue(extractPath(extractedData, 'examination.restrictions')) || 
                     cleanValue(extractPath(extractedData, 'restrictions')) || 'None',
        next_examination_date: markdownData.examination.next_examination_date || 
                             cleanValue(extractPath(extractedData, 'examination.next_date')) || 
                             cleanValue(extractPath(extractedData, 'valid_until')) || 
                             cleanValue(extractPath(extractedData, 'expiry_date')) || '',
        type: examinationType,
        test_results: testResults
      },
      certification: {
        ...fitnessStatus,
        follow_up: cleanValue(followUp),
        review_date: cleanValue(reviewDate),
        comments: cleanValue(comments),
        valid_until: markdownData.examination.next_examination_date || 
                    cleanValue(extractPath(extractedData, 'examination.next_date')) || 
                    cleanValue(extractPath(extractedData, 'valid_until')) || 
                    cleanValue(extractPath(extractedData, 'expiry_date')) || ''
      },
      restrictions: restrictions,
      raw_content: markdown || null
    };
    
    console.log('Final structured data:', JSON.stringify(structuredData, null, 2));
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

// Helper function to clean HTML comments from extracted values
function cleanValue(value: string | null | undefined): string {
  if (!value) return '';
  
  // Remove HTML comments: <!-- ... -->
  let cleaned = value.replace(/<!--.*?-->/g, '').trim();
  
  // Also remove form bounding box coordinates and IDs
  cleaned = cleaned.replace(/<!\-\- \w+, from page \d+ \(.*?\), with ID .*? \-\->/g, '').trim();
  
  // Remove coordinates directly in text (l=0.064,t=0.188,r=0.936,b=0.284)
  cleaned = cleaned.replace(/\(l=[\d\.]+,t=[\d\.]+,r=[\d\.]+,b=[\d\.]+\)/g, '').trim();
  
  // Remove IDs in text - with ID 5d5dece1-814c-40b8-ac21-2d9877814985
  cleaned = cleaned.replace(/with ID [a-f0-9\-]+/g, '').trim();
  
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
