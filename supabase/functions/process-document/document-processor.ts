
import { apiClient } from "./api-client.ts";
import { processMedicalQuestionnaireData } from "./processors/medical-questionnaire.ts";
import { processCertificateOfFitnessData } from "./processors/certificate-of-fitness.ts";
import { deepMergeObjects } from "./utils.ts";

// Process document with Landing AI API
export async function processDocumentWithLandingAI(file: File, documentType: string, documentId: string, supabase: any) {
  try {
    console.log(`Starting document processing with Landing AI for document ID: ${documentId}`);
    
    // Call Landing AI API
    const result = await apiClient.callLandingAI(file);
    console.log(`Landing AI API response received for document ID: ${documentId}`);
    
    // Process and structure the data based on document type
    let structuredData;
    if (documentType === 'medical-questionnaire') {
      structuredData = processMedicalQuestionnaireData(result);
    } else {
      structuredData = processCertificateOfFitnessData(result);
    }
    
    console.log('Structured data extracted:', JSON.stringify(structuredData));
    
    // Clean any problematic data in the structuredData
    cleanStructuredData(structuredData);
    
    // Ensure data is present in all expected locations to maximize compatibility
    ensureDataAvailability(structuredData);
    
    // Ensure the raw_response data is preserved for validation
    const extractedData = {
      structured_data: structuredData,
      raw_response: result
    };
    
    console.log('Final extracted_data structure:', JSON.stringify(extractedData.structured_data.patient, null, 2));
    
    // Try to update the document record multiple times if needed
    let updateSuccess = false;
    let attempts = 0;
    
    while (!updateSuccess && attempts < 3) {
      attempts++;
      
      // Update the document record with the extracted data
      const { data: updateData, error: updateError } = await supabase
        .from('documents')
        .update({
          extracted_data: extractedData,
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

// Helper function to ensure data is available in all expected locations
function ensureDataAvailability(data: any) {
  if (!data) return;
  
  // Ensure structured_data exists 
  data.structured_data = data.structured_data || {};
  
  // Make sure patient data is in both places
  if (data.patient && !data.structured_data.patient) {
    data.structured_data.patient = {...data.patient};
  } else if (!data.patient && data.structured_data.patient) {
    data.patient = {...data.structured_data.patient};
  } else if (!data.patient && !data.structured_data.patient) {
    data.patient = {};
    data.structured_data.patient = {};
  }
  
  // Same for examination results
  if (data.examination_results && !data.structured_data.examination_results) {
    data.structured_data.examination_results = {...data.examination_results};
  } else if (!data.examination_results && data.structured_data.examination_results) {
    data.examination_results = {...data.structured_data.examination_results};
  } else if (!data.examination_results && !data.structured_data.examination_results) {
    data.examination_results = { test_results: {} };
    data.structured_data.examination_results = { test_results: {} };
  }
  
  // Ensure test results are accessible both ways
  if (data.examination_results && data.examination_results.test_results) {
    if (!data.structured_data.examination_results) {
      data.structured_data.examination_results = {};
    }
    if (!data.structured_data.examination_results.test_results) {
      data.structured_data.examination_results.test_results = {};
    }
    
    // Copy test results to structured_data
    Object.keys(data.examination_results.test_results).forEach(key => {
      data.structured_data.examination_results.test_results[key] = 
        data.examination_results.test_results[key];
    });
  }
  
  // Ensure certification data is available in both places
  if (data.certification && !data.structured_data.certification) {
    data.structured_data.certification = {...data.certification};
  } else if (!data.certification && data.structured_data.certification) {
    data.certification = {...data.structured_data.certification};
  } else if (!data.certification && !data.structured_data.certification) {
    data.certification = {};
    data.structured_data.certification = {};
  }
  
  // Ensure restrictions data is available in both places
  if (data.restrictions && !data.structured_data.restrictions) {
    data.structured_data.restrictions = {...data.restrictions};
  } else if (!data.restrictions && data.structured_data.restrictions) {
    data.restrictions = {...data.structured_data.restrictions};
  } else if (!data.restrictions && !data.structured_data.restrictions) {
    data.restrictions = {};
    data.structured_data.restrictions = {};
  }
}

// Helper function to clean any problematic data in the structured data
function cleanStructuredData(data: any) {
  if (!data || typeof data !== 'object') return;
  
  // Process each key in the object
  Object.keys(data).forEach(key => {
    // If it's an object, recursively clean it
    if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
      cleanStructuredData(data[key]);
    } 
    // If it's an array, clean each item in the array
    else if (Array.isArray(data[key])) {
      data[key].forEach((item: any, index: number) => {
        if (typeof item === 'object') {
          cleanStructuredData(item);
        } else if (typeof item === 'string') {
          // Clean HTML table cells from array items
          if (item.includes('<td>[ ]</td>') || item === '[ ]' || item === '[]') {
            data[key][index] = 'N/A';
          }
        }
      });
    }
    // If it's a string, clean HTML table cells
    else if (typeof data[key] === 'string') {
      if (data[key].includes('<td>[ ]</td>') || data[key] === '[ ]' || data[key] === '[]') {
        data[key] = 'N/A';
      }
    }
    // Convert boolean-like strings to actual booleans
    else if (typeof data[key] === 'string' && (data[key].toLowerCase() === 'true' || data[key].toLowerCase() === 'false')) {
      data[key] = data[key].toLowerCase() === 'true';
    }
  });
  
  // Process examination_results.test_results specifically for certificate of fitness
  if (data.examination_results && data.examination_results.test_results) {
    const testResults = data.examination_results.test_results;
    
    Object.keys(testResults).forEach(key => {
      if (key.endsWith('_results')) {
        if (!testResults[key] || 
            testResults[key] === '' || 
            testResults[key].includes('<td>[ ]</td>') || 
            testResults[key] === '[ ]' || 
            testResults[key] === '[]') {
          testResults[key] = 'N/A';
        }
      }
      // Convert test_done fields to boolean
      else if (key.endsWith('_done')) {
        if (typeof testResults[key] === 'string') {
          testResults[key] = testResults[key].toLowerCase() === 'true';
        } else if (testResults[key] === undefined || testResults[key] === null) {
          testResults[key] = false;
        }
      }
    });
  }
  
  // Process restrictions to ensure they're all boolean values
  if (data.restrictions) {
    Object.keys(data.restrictions).forEach(key => {
      if (typeof data.restrictions[key] === 'string') {
        data.restrictions[key] = data.restrictions[key].toLowerCase() === 'true';
      } else if (data.restrictions[key] === undefined || data.restrictions[key] === null) {
        data.restrictions[key] = false;
      }
    });
  }
  
  // Process certification to ensure fitness status fields are boolean values
  if (data.certification) {
    const certificationFields = ['fit', 'fit_with_restrictions', 'fit_with_condition', 'temporarily_unfit', 'unfit'];
    certificationFields.forEach(field => {
      if (typeof data.certification[field] === 'string') {
        data.certification[field] = data.certification[field].toLowerCase() === 'true';
      } else if (data.certification[field] === undefined || data.certification[field] === null) {
        data.certification[field] = false;
      }
    });
  }
}
