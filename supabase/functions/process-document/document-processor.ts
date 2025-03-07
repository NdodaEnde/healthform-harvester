
import { apiClient } from "./api-client.ts";
import { processMedicalQuestionnaireData } from "./processors/medical-questionnaire.ts";
import { processCertificateOfFitnessData } from "./processors/certificate-of-fitness.ts";

// Process document with Landing AI API
export async function processDocumentWithLandingAI(file: File, documentType: string, documentId: string, supabase: any) {
  try {
    console.log(`Starting document processing with Landing AI for document ID: ${documentId}`);
    
    // Call Landing AI API
    const result = await apiClient.callLandingAI(file);
    console.log(`Landing AI API response received for document ID: ${documentId}`);
    console.log(`Raw API result:`, JSON.stringify(result));
    
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
          extracted_data: structuredData, // Store directly without nesting
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
        
        // Immediately create a certificate record with the extracted data
        if (documentType === 'certificate-of-fitness') {
          try {
            console.log('Creating certificate record from processed document...');
            
            // Format the data correctly for the certificates table
            const certificateData = {
              document_id: documentId,
              patient_info: structuredData.patient || {},
              fitness_declaration: structuredData.certification || {},
              restrictions: Array.isArray(structuredData.restrictions) 
                ? structuredData.restrictions 
                : Object.keys(structuredData.restrictions || {}).filter(key => structuredData.restrictions[key]),
              medical_tests: structuredData.examination_results?.test_results || {},
              vision_tests: {
                far_near_vision: structuredData.examination_results?.test_results?.far_near_vision_results || null,
                side_depth: structuredData.examination_results?.test_results?.side_depth_results || null,
                night_vision: structuredData.examination_results?.test_results?.night_vision_results || null
              },
              company_info: {
                name: structuredData.patient?.company || ''
              }
            };
            
            console.log('Certificate data being saved:', JSON.stringify(certificateData));
            
            const { data: certData, error: certError } = await supabase
              .from('certificates')
              .insert(certificateData)
              .select();
              
            if (certError) {
              console.error('Error creating certificate record:', certError);
            } else {
              console.log('Certificate record created successfully:', certData);
            }
          } catch (certCreateError) {
            console.error('Error in certificate creation process:', certCreateError);
          }
        }
        
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
        console.log(`Verified extracted data:`, JSON.stringify(verifyData.extracted_data));
        
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
