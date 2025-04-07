import { apiClient } from "./api-client.ts";
import { processMedicalQuestionnaireData } from "./processors/medical-questionnaire.ts";
import { processCertificateOfFitnessData } from "./processors/certificate-of-fitness.ts";
import { extractInfoFromSAID } from "./utils.ts";

// Process document with Landing AI API
export async function processDocumentWithLandingAI(file: File, documentType: string, documentId: string, supabase: any) {
  try {
    console.log(`Starting document processing with Landing AI for document ID: ${documentId}`);
    
    // Call Landing AI API
    const result = await apiClient.callLandingAI(file);
    console.log(`Landing AI API response received for document ID: ${documentId}`);
    
    // Log the full API response for debugging
    console.log('Raw API Response:', JSON.stringify(result, null, 2));
    
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
    
    // Ensure certificate dates are properly processed
    if (documentType.includes('fitness') || documentType.includes('certificate')) {
      ensureCertificateDates(structuredData);
    }
    
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
          
        // Create or update patient record from the extracted data
        await createOrUpdatePatientFromDocument(structuredData, documentType, updateData[0], supabase);
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

// Create or update patient record from document data
async function createOrUpdatePatientFromDocument(structuredData: any, documentType: string, documentData: any, supabase: any) {
  try {
    console.log('Creating or updating patient from document data');
    
    // Extract patient information based on document type
    let patientInfo;
    if (documentType === 'medical-questionnaire') {
      patientInfo = extractPatientInfoFromMedicalQuestionnaire(structuredData);
    } else {
      patientInfo = extractPatientInfoFromCertificate(structuredData);
    }
    
    console.log('Extracted patient info:', JSON.stringify(patientInfo, null, 2));
    
    if (!patientInfo || !patientInfo.firstName || !patientInfo.lastName) {
      console.log('WARNING: Insufficient patient information to create a record', patientInfo);
      
      // Fallback to generic patient information if name extraction failed
      if (!patientInfo) {
        patientInfo = {
          firstName: 'Unknown',
          lastName: documentData.file_name || 'Patient',
          gender: 'unknown'
        };
      } else if (!patientInfo.firstName) {
        patientInfo.firstName = 'Unknown';
      } else if (!patientInfo.lastName) {
        patientInfo.lastName = documentData.file_name || 'Patient';
      }
      
      console.log('Using fallback patient information:', patientInfo);
    }
    
    // Always make sure gender field exists and has a valid default
    if (!patientInfo.gender || patientInfo.gender === '') {
      patientInfo.gender = 'unknown';
      console.log('Setting default gender to "unknown"');
    }
    
    // Check if patient already exists with the same name and organization
    const { data: existingPatients, error: searchError } = await supabase
      .from('patients')
      .select('*')
      .eq('first_name', patientInfo.firstName)
      .eq('last_name', patientInfo.lastName)
      .eq('organization_id', documentData.organization_id);
      
    if (searchError) {
      console.error('Error searching for existing patients:', searchError);
      return;
    }
    
    console.log('Found existing patients:', existingPatients?.length || 0);
    
    // Prepare medical history data if available
    const medicalHistory = documentType === 'medical-questionnaire' 
      ? structuredData.medical_history 
      : {};
    
    if (existingPatients && existingPatients.length > 0) {
      console.log('Updating existing patient record:', existingPatients[0].id);
      
      // Update existing patient record
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          gender: patientInfo.gender || existingPatients[0].gender || 'unknown',
          date_of_birth: patientInfo.dateOfBirth || existingPatients[0].date_of_birth || new Date().toISOString().split('T')[0],
          medical_history: {
            ...existingPatients[0].medical_history,
            ...medicalHistory,
            documents: [
              ...(existingPatients[0].medical_history?.documents || []),
              { 
                document_id: documentData.id,
                document_type: documentType,
                processed_at: documentData.processed_at
              }
            ]
          },
          contact_info: {
            ...existingPatients[0].contact_info,
            ...patientInfo.contactInfo,
            employee_id: patientInfo.employeeId || existingPatients[0].contact_info?.employee_id,
            citizenship: patientInfo.citizenship || existingPatients[0].contact_info?.citizenship
          },
          organization_id: documentData.organization_id,
          client_organization_id: documentData.client_organization_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPatients[0].id);
        
      if (updateError) {
        console.error('Error updating patient record:', updateError);
      } else {
        console.log('Patient record updated successfully');
      }
    } else {
      console.log('Creating new patient record');
      
      // Create new patient record
      const { data: newPatient, error: insertError } = await supabase
        .from('patients')
        .insert({
          first_name: patientInfo.firstName,
          last_name: patientInfo.lastName,
          gender: patientInfo.gender || 'unknown',
          date_of_birth: patientInfo.dateOfBirth || new Date().toISOString().split('T')[0],
          medical_history: {
            ...medicalHistory,
            documents: [{
              document_id: documentData.id,
              document_type: documentType,
              processed_at: documentData.processed_at
            }]
          },
          contact_info: {
            ...patientInfo.contactInfo,
            employee_id: patientInfo.employeeId,
            citizenship: patientInfo.citizenship
          },
          organization_id: documentData.organization_id,
          client_organization_id: documentData.client_organization_id
        })
        .select();
        
      if (insertError) {
        console.error('Error creating patient record:', insertError);
      } else {
        console.log('New patient record created:', newPatient[0]?.id);
      }
    }
    
    // Verify patient was created successfully
    const { data: verifyPatients, error: verifyError } = await supabase
      .from('patients')
      .select('*')
      .eq('first_name', patientInfo.firstName)
      .eq('last_name', patientInfo.lastName)
      .eq('organization_id', documentData.organization_id);
      
    if (verifyError) {
      console.error('Error verifying patient creation:', verifyError);
    } else {
      console.log(`Verification found ${verifyPatients?.length || 0} matching patients`);
      if (verifyPatients && verifyPatients.length > 0) {
        console.log('Patient verification succeeded - patient record exists:', verifyPatients[0].id);
      } else {
        console.error('Patient verification failed - no matching patient found after creation attempt');
      }
    }
    
  } catch (error) {
    console.error('Error creating/updating patient from document:', error);
  }
}

// Extract patient info from medical questionnaire
function extractPatientInfoFromMedicalQuestionnaire(data: any) {
  if (!data || !data.patient) return null;
  
  const patientData = data.patient;
  const names = patientData.name ? patientData.name.split(' ') : ['Unknown', 'Patient'];
  
  return {
    firstName: names[0] || 'Unknown',
    lastName: names.length > 1 ? names.slice(1).join(' ') : 'Patient',
    dateOfBirth: patientData.date_of_birth || null,
    gender: patientData.gender || 'unknown',
    employeeId: patientData.employee_id || null,
    contactInfo: {
      email: null,
      phone: null,
      address: null
    }
  };
}

// Extract patient info from certificate of fitness
function extractPatientInfoFromCertificate(data: any) {
  if (!data || !data.patient) return null;
  
  const patientData = data.patient;
  const names = patientData.name ? patientData.name.split(' ') : ['Unknown', 'Patient'];
  
  // Extract gender with more reliable methods
  let gender = patientData.gender || null;
  
  // If gender wasn't found, try to infer it from other fields
  if (!gender && typeof data.raw_content === 'string') {
    const genderMatches = data.raw_content.match(/gender:\s*(male|female|other)/i) || 
                        data.raw_content.match(/sex:\s*(m|male|f|female)/i);
    
    if (genderMatches && genderMatches[1]) {
      const genderValue = genderMatches[1].toLowerCase();
      if (genderValue === 'm' || genderValue.includes('male')) {
        gender = 'male';
      } else if (genderValue === 'f' || genderValue.includes('female')) {
        gender = 'female';
      } else {
        gender = 'other';
      }
    }
  }
  
  // Try to extract information from SA ID if available
  let dateOfBirth = patientData.date_of_birth || null;
  let citizenship = null;
  
  if (patientData.employee_id && 
      patientData.employee_id.length === 13 && 
      /^\d+$/.test(patientData.employee_id)) {
    
    const idInfo = extractInfoFromSAID(patientData.employee_id);
    
    // Only use extracted date_of_birth if not already available
    if (!dateOfBirth && idInfo.dateOfBirth) {
      dateOfBirth = idInfo.dateOfBirth;
    }
    
    // Only use extracted gender if not already available
    if (!gender && idInfo.gender) {
      gender = idInfo.gender;
    }
    
    // Set citizenship information
    citizenship = idInfo.citizenship;
  }
  
  // Always default to 'unknown' if gender is still not determined
  if (!gender) {
    gender = 'unknown';
  }
  
  return {
    firstName: names[0] || 'Unknown',
    lastName: names.length > 1 ? names.slice(1).join(' ') : 'Patient',
    dateOfBirth: dateOfBirth,
    gender: gender,
    citizenship: citizenship,
    employeeId: patientData.employee_id || patientData.id_number || null,
    contactInfo: {
      email: null,
      phone: null,
      company: patientData.company || null,
      occupation: patientData.occupation || null
    }
  };
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

// Helper function to ensure certificate dates are properly set
function ensureCertificateDates(structuredData: any) {
  if (!structuredData) return;
  
  try {
    // If we have a certification section
    if (structuredData.certification) {
      // If we have valid_until but no examination_date, calculate it based on valid_until (typically one year before)
      if (structuredData.certification.valid_until && 
          (!structuredData.certification.examination_date && 
           !structuredData.examination_results?.date)) {
        
        const expiryDate = new Date(structuredData.certification.valid_until);
        if (!isNaN(expiryDate.getTime())) {
          const examDate = new Date(expiryDate);
          examDate.setFullYear(examDate.getFullYear() - 1);
          const formattedExamDate = examDate.toISOString().split('T')[0];
          
          // Set examination date in multiple places to ensure it's captured
          structuredData.certification.examination_date = formattedExamDate;
          
          if (!structuredData.examination_results) {
            structuredData.examination_results = { date: formattedExamDate };
          } else {
            structuredData.examination_results.date = formattedExamDate;
          }
          
          console.log('Derived examination date from expiry date:', formattedExamDate);
        }
      }
      
      // If we have examination_date but no valid_until, calculate it based on examination_date (typically one year after)
      if (!structuredData.certification.valid_until && 
          (structuredData.certification.examination_date || 
           structuredData.examination_results?.date)) {
        
        const examDate = new Date(
          structuredData.certification.examination_date || 
          structuredData.examination_results.date
        );
        
        if (!isNaN(examDate.getTime())) {
          const expiryDate = new Date(examDate);
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          const formattedExpiryDate = expiryDate.toISOString().split('T')[0];
          
          structuredData.certification.valid_until = formattedExpiryDate;
          console.log('Derived expiry date from examination date:', formattedExpiryDate);
        }
      }
    }
  } catch (e) {
    console.error('Error ensuring certificate dates:', e);
  }
}
