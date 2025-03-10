
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
    
    // Ensure the raw_response data is preserved for validation
    const extractedData = {
      structured_data: structuredData,
      raw_response: result
    };
    
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
    });
  }
}
