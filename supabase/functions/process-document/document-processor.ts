
import { apiClient } from "./api-client.ts";
import { processMedicalQuestionnaireData } from "./processors/medical-questionnaire.ts";
import { processCertificateOfFitnessData } from "./processors/certificate-of-fitness.ts";
// Importing types and functions from SA ID parser
import type { ParsedSAID } from "./sa-id-parser.ts";
import { parseSouthAfricanIDNumber, normalizeIDNumber } from "./sa-id-parser.ts";

// Process document with Landing AI API
export async function processDocumentWithLandingAI(file: File, documentType: string, documentId: string, supabase: any) {
  console.log(`=== STARTING DOCUMENT PROCESSING ===`);
  console.log(`Document ID: ${documentId}`);
  console.log(`Document Type: ${documentType}`);
  console.log(`File Name: ${file.name}`);
  console.log(`File Size: ${file.size} bytes`);
  console.log(`File Type: ${file.type}`);
  console.log(`Processing Start Time: ${new Date().toISOString()}`);
  
  try {
    // Check if SDK Service URL is configured
    const sdkServiceUrl = Deno.env.get('LANDING_AI_SDK_SERVICE_URL');
    console.log(`SDK Service URL Configured: ${sdkServiceUrl ? 'Yes' : 'No'}`);
    
    // Check if API Key is configured
    const apiKey = Deno.env.get('LANDING_AI_API_KEY');
    console.log(`API Key Configured: ${apiKey ? 'Yes' : 'No'}`);
    
    console.log(`Calling Landing AI API for document ID: ${documentId}`);
    
    // Call Landing AI API
    const startTime = Date.now();
    const result = await apiClient.callLandingAI(file);
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;
    
    console.log(`Landing AI API response received for document ID: ${documentId}`);
    console.log(`Processing time: ${processingTime.toFixed(2)} seconds`);
    
    // Log the full API response structure (not content) for debugging
    console.log('API Response Structure:', Object.keys(result));
    if (result.document_analysis) {
      console.log('Document analysis fields:', Object.keys(result.document_analysis));
    }
    
    // Process and structure the data based on document type
    console.log(`Processing document type: ${documentType}`);
    let structuredData;
    if (documentType === 'medical-questionnaire') {
      console.log('Using medical questionnaire processor');
      structuredData = processMedicalQuestionnaireData(result);
    } else {
      console.log('Using certificate of fitness processor');
      structuredData = processCertificateOfFitnessData(result);
    }
    
    console.log('Structured data extracted with keys:', Object.keys(structuredData || {}));
    
    // Clean any problematic data in the structuredData
    cleanStructuredData(structuredData);
    console.log('Data cleaned successfully');
    
    // Ensure certificate dates are properly processed
    if (documentType.includes('fitness') || documentType.includes('certificate')) {
      ensureCertificateDates(structuredData);
      console.log('Certificate dates processed successfully');
    }
    
    // Try to update the document record multiple times if needed
    let updateSuccess = false;
    let attempts = 0;
    
    while (!updateSuccess && attempts < 3) {
      attempts++;
      console.log(`Updating document record (attempt ${attempts})`);
      
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
      console.log(`Verifying document status (check ${i+1})`);
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
    
    console.log(`=== DOCUMENT PROCESSING COMPLETED SUCCESSFULLY ===`);
    
  } catch (error) {
    console.error('=== DOCUMENT PROCESSING ERROR ===');
    console.error(`Error processing document ID: ${documentId}`);
    console.error(`Error type: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
    
    // Update document status to failed with error message
    try {
      console.log('Updating document status to failed');
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
        console.log('Updated document status to failed');
      }
    } catch (updateError) {
      console.error('Error updating document status after processing failure:', updateError);
    }
    
    console.error(`=== END OF ERROR REPORT ===`);
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
    
    // Process South African ID number if available
    const idNumber = patientInfo.employeeId || null;
    let idNumberData = null;
    
    try {
      if (idNumber) {
        const normalizedID = normalizeIDNumber(idNumber);
        if (normalizedID) {
          console.log('Found potential South African ID number:', normalizedID);
          idNumberData = parseSouthAfricanIDNumber(normalizedID);
          console.log('Parsed ID number data:', idNumberData);
        }
      }
    } catch (idParsingError) {
      console.error('Error parsing South African ID number:', idParsingError);
      // Continue with processing even if ID parsing fails
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
      
      // Prepare update data
      const updateData: any = {
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
        contact_info: patientInfo.contactInfo || existingPatients[0].contact_info,
        organization_id: documentData.organization_id,
        client_organization_id: documentData.client_organization_id,
        updated_at: new Date().toISOString()
      };
      
      // Add ID number data if available
      try {
        if (idNumberData && idNumberData.isValid) {
          updateData.id_number = idNumberData.original;
          updateData.birthdate_from_id = idNumberData.birthdate;
          updateData.gender_from_id = idNumberData.gender;
          updateData.citizenship_status = idNumberData.citizenshipStatus;
          updateData.id_number_valid = true;
          
          // Update date of birth and gender from ID number if applicable
          if (idNumberData.birthdate && (!patientInfo.dateOfBirth || patientInfo.dateOfBirth === '')) {
            updateData.date_of_birth = idNumberData.birthdate;
            console.log('Using birthdate from ID number:', idNumberData.birthdate);
          }
          
          if (idNumberData.gender && (patientInfo.gender === 'unknown' || patientInfo.gender === '')) {
            updateData.gender = idNumberData.gender;
            console.log('Using gender from ID number:', idNumberData.gender);
          }
        } else if (idNumber) {
          // Store the ID even if invalid, but mark it as invalid
          const normalizedID = normalizeIDNumber(idNumber);
          if (normalizedID) {
            updateData.id_number = normalizedID;
            updateData.id_number_valid = false;
          }
        }
      } catch (idUpdateError) {
        console.error('Error applying ID number data to patient update:', idUpdateError);
        // Continue with update even if ID processing fails
      }
      
      // Update existing patient record
      const { error: updateError } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', existingPatients[0].id);
        
      if (updateError) {
        console.error('Error updating patient record:', updateError);
      } else {
        console.log('Patient record updated successfully');
      }
    } else {
      console.log('Creating new patient record');
      
      // Prepare insert data
      const insertData: any = {
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
        contact_info: patientInfo.contactInfo || null,
        organization_id: documentData.organization_id,
        client_organization_id: documentData.client_organization_id
      };
      
      // Add ID number data if available
      try {
        if (idNumberData && idNumberData.isValid) {
          insertData.id_number = idNumberData.original;
          insertData.birthdate_from_id = idNumberData.birthdate;
          insertData.gender_from_id = idNumberData.gender;
          insertData.citizenship_status = idNumberData.citizenshipStatus;
          insertData.id_number_valid = true;
          
          // Use date of birth and gender from ID number if applicable
          if (idNumberData.birthdate && (!patientInfo.dateOfBirth || patientInfo.dateOfBirth === '')) {
            insertData.date_of_birth = idNumberData.birthdate;
            console.log('Using birthdate from ID number:', idNumberData.birthdate);
          }
          
          if (idNumberData.gender && (patientInfo.gender === 'unknown' || patientInfo.gender === '')) {
            insertData.gender = idNumberData.gender;
            console.log('Using gender from ID number:', idNumberData.gender);
          }
        } else if (idNumber) {
          // Store the ID even if invalid, but mark it as invalid
          const normalizedID = normalizeIDNumber(idNumber);
          if (normalizedID) {
            insertData.id_number = normalizedID;
            insertData.id_number_valid = false;
          }
        }
      } catch (idInsertError) {
        console.error('Error applying ID number data to patient insert:', idInsertError);
        // Continue with insert even if ID processing fails
      }
      
      // Create new patient record
      const { data: newPatient, error: insertError } = await supabase
        .from('patients')
        .insert(insertData)
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
  
  // Always default to 'unknown' if gender is still not determined
  if (!gender) {
    gender = 'unknown';
  }
  
  return {
    firstName: names[0] || 'Unknown',
    lastName: names.length > 1 ? names.slice(1).join(' ') : 'Patient',
    dateOfBirth: patientData.date_of_birth || null,
    gender: gender,
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
