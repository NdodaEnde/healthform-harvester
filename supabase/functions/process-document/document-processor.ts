import { apiClient } from "./api-client.ts";
import { processMedicalQuestionnaireData } from "./processors/medical-questionnaire.ts";
import { processCertificateOfFitnessData } from "./processors/certificate-of-fitness.ts";

// Process document with Landing AI API
export async function processDocumentWithLandingAI(
  file: File,
  documentType: string | null,
  documentId: string,
  supabase: any
): Promise<void> {
  console.log(`Starting document processing for ${documentType}, ID: ${documentId}`);
  
  try {
    // Call LandingAI to process the document
    const result = await apiClient.callLandingAI(file);
    console.log("LandingAI processing completed");
    
    // Process the result based on document type
    let extractedData = null;
    
    if (documentType === 'template') {
      extractedData = processTemplateDocument(result);
    } else if (documentType === 'certificate-of-fitness') {
      extractedData = processCertificateOfFitnessData(result);
    } else if (documentType === 'medical-questionnaire') {
      extractedData = processMedicalQuestionnaireData(result);
    } else {
      // Generic document processing
      extractedData = {
        raw: result,
        text: result.text || result.document_text || ''
      };
    }
    
    // Update the document record with the extracted data
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        extracted_data: extractedData
      })
      .eq('id', documentId);
    
    if (updateError) {
      throw updateError;
    }
    
    console.log(`Document processed successfully: ${documentId}`);
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    
    // Update the document status to error
    try {
      await supabase
        .from('documents')
        .update({
          status: 'error',
          processing_error: error.message || 'Unknown error during processing',
          processed_at: new Date().toISOString()
        })
        .eq('id', documentId);
    } catch (updateError) {
      console.error('Error updating document status:', updateError);
    }
  }
}

// Add the new processor function for templates
function processTemplateDocument(result: any): any {
  console.log("Processing template document");
  
  const formFields = [];
  
  // Extract form fields from the AI result
  // This will depend on the format returned by LandingAI for form documents
  try {
    const content = result.text || result.document_text || '';
    const sections = result.sections || [];
    const entityMentions = result.entity_mentions || [];
    
    // Process form fields from detected entities
    entityMentions.forEach((entity: any, index: number) => {
      if (entity.type === 'FORM_FIELD' || entity.label === 'FORM_FIELD') {
        const fieldText = entity.text || '';
        const isRequired = fieldText.includes('*') || false;
        
        // Try to determine field type based on context
        let fieldType = 'text'; // Default type
        
        if (fieldText.toLowerCase().includes('email')) {
          fieldType = 'email';
        } else if (fieldText.toLowerCase().includes('phone') || fieldText.toLowerCase().includes('tel')) {
          fieldType = 'tel';
        } else if (fieldText.toLowerCase().includes('date') || fieldText.toLowerCase().includes('dob')) {
          fieldType = 'date';
        } else if (fieldText.toLowerCase().includes('number') || fieldText.toLowerCase().includes('age')) {
          fieldType = 'number';
        } else if (fieldText.toLowerCase().includes('checkbox') || fieldText.toLowerCase().includes('check box')) {
          fieldType = 'checkbox';
        } else if (fieldText.toLowerCase().includes('radio') || fieldText.toLowerCase().includes('select one')) {
          fieldType = 'radio';
        } else if (fieldText.toLowerCase().includes('dropdown') || fieldText.toLowerCase().includes('select')) {
          fieldType = 'select';
        } else if (fieldText.toLowerCase().includes('comment') || fieldText.toLowerCase().includes('description')) {
          fieldType = 'textarea';
        }
        
        // Create a field with ID generated from the index
        formFields.push({
          id: `field-${index}`,
          type: fieldType,
          label: fieldText.replace('*', '').trim(),
          placeholder: `Enter ${fieldText.replace('*', '').trim().toLowerCase()}`,
          required: isRequired
        });
      }
    });
    
    // If no fields were detected but we have sections, try to create fields from sections
    if (formFields.length === 0 && sections.length > 0) {
      sections.forEach((section: any, index: number) => {
        const sectionTitle = section.title || '';
        const sectionText = section.text || '';
        
        if (sectionTitle && !sectionTitle.toLowerCase().includes('header') && 
            !sectionTitle.toLowerCase().includes('footer')) {
          formFields.push({
            id: `section-${index}`,
            type: 'text',
            label: sectionTitle.trim(),
            placeholder: `Enter ${sectionTitle.trim().toLowerCase()}`,
            required: false
          });
        }
      });
    }
    
    // If still no fields, create a few basic fields based on document content
    if (formFields.length === 0) {
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      
      lines.slice(0, 10).forEach((line, index) => {
        if (line.length > 3 && line.length < 50 && 
            !line.toLowerCase().includes('header') && 
            !line.toLowerCase().includes('footer')) {
          formFields.push({
            id: `line-${index}`,
            type: 'text',
            label: line.trim(),
            placeholder: `Enter ${line.trim().toLowerCase()}`,
            required: false
          });
        }
      });
    }
  } catch (error) {
    console.error('Error parsing template fields:', error);
  }
  
  return {
    formFields,
    rawResult: result
  };
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
          contact_info: patientInfo.contactInfo || existingPatients[0].contact_info,
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
          contact_info: patientInfo.contactInfo || null,
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
