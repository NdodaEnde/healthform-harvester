import { supabase } from '@/integrations/supabase/client';
import { extractCertificateData, formatCertificateData } from '@/lib/utils';
import { toast } from 'sonner';

// Import your existing SA ID parser functions
import { parseSouthAfricanIDNumber, normalizeIDNumber } from '@/utils/sa-id-parser';
import { processIDNumberForPatient } from '@/utils/id-number-processor';

export interface PromotionData {
  patientName: string;
  patientId: string;
  companyName: string;
  occupation: string;
  fitnessStatus: string;
  restrictionsText: string;
  examinationDate: string;
  expiryDate?: string;
  examinationType: 'pre-employment' | 'periodical' | 'exit';
  comments?: string;
  followUpActions?: string;
}

// Helper function to normalize date formats
const normalizeDate = (dateString: string): string => {
  if (!dateString) return new Date().toISOString().split('T')[0];
  
  // Handle various date formats
  const cleanDate = dateString.trim();
  
  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    return cleanDate;
  }
  
  // Handle DD.MM.YYYY or DD. MM. YYYY format
  const ddmmyyyyMatch = cleanDate.match(/^(\d{1,2})\.?\s*(\d{1,2})\.?\s*(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Handle DD/MM/YYYY format
  const slashMatch = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try to parse as Date and format
  try {
    const parsed = new Date(cleanDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch (error) {
    console.warn('Could not parse date:', cleanDate);
  }
  
  // Fallback to current date
  console.warn('Using current date as fallback for:', cleanDate);
  return new Date().toISOString().split('T')[0];
};

// Helper function to normalize patient ID (using your existing function)
const normalizePatientId = (patientId: string): string => {
  const normalized = normalizeIDNumber(patientId);
  return normalized || patientId.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
};

export const promoteToPatientRecord = async (
  documentId: string,
  validatedData: PromotionData,
  organizationId: string,
  clientOrganizationId?: string
) => {
  try {
    console.log('Starting promotion to patient record:', { documentId, validatedData });

    // Validate the data structure
    if (!validatedData || typeof validatedData !== 'object') {
      throw new Error('Invalid validated data provided');
    }

    if (!validatedData.patientName || !validatedData.patientId) {
      console.error('Missing required patient data:', validatedData);
      throw new Error('Patient name and ID are required');
    }

    // Normalize the patient ID and process SA ID data using your existing utilities
    const normalizedPatientId = normalizeIDNumber(validatedData.patientId);
    const normalizedExamDate = normalizeDate(validatedData.examinationDate);
    const normalizedExpiryDate = validatedData.expiryDate ? normalizeDate(validatedData.expiryDate) : null;

    // Parse South African ID number using your existing parser
    const saIdData = parseSouthAfricanIDNumber(normalizedPatientId || validatedData.patientId);
    console.log('SA ID parsing result:', saIdData);

    console.log('Normalized data:', {
      originalPatientId: validatedData.patientId,
      normalizedPatientId,
      originalExamDate: validatedData.examinationDate,
      normalizedExamDate,
      originalExpiryDate: validatedData.expiryDate,
      normalizedExpiryDate,
      saIdValid: saIdData.isValid,
      extractedDOB: saIdData.birthDate,
      extractedGender: saIdData.gender,
      citizenshipStatus: saIdData.citizenshipStatus
    });

    // Step 1: Find or create patient
    const { data: existingPatient, error: patientSearchError } = await supabase
      .from('patients')
      .select('id')
      .eq('id_number', normalizedPatientId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (patientSearchError) {
      console.error('Error searching for patient:', patientSearchError);
      throw new Error('Failed to search for existing patient');
    }

    let patientId = existingPatient?.id;

    // Create patient if doesn't exist
    if (!patientId) {
      const nameParts = validatedData.patientName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create a basic patient info object
      const basicPatientInfo = {
        first_name: firstName,
        last_name: lastName,
        id_number: normalizedPatientId || validatedData.patientId,
        date_of_birth: new Date().toISOString().split('T')[0], // Default fallback
        gender: 'unknown'
      };

      // Use your existing ID processor to enhance patient data with SA ID info
      const processedPatientInfo = processIDNumberForPatient(
        basicPatientInfo as any, 
        validatedData.patientId
      );

      // Prepare the final patient data for database insertion
      const patientData = {
        first_name: firstName,
        last_name: lastName,
        id_number: normalizedPatientId || validatedData.patientId,
        organization_id: organizationId,
        client_organization_id: clientOrganizationId,
        date_of_birth: processedPatientInfo.date_of_birth || basicPatientInfo.date_of_birth,
        gender: processedPatientInfo.gender || basicPatientInfo.gender,
        // Add SA ID specific fields if available
        ...(processedPatientInfo.id_number_valid && {
          id_number_valid: processedPatientInfo.id_number_valid,
          birthdate_from_id: processedPatientInfo.birthdate_from_id,
          gender_from_id: processedPatientInfo.gender_from_id,
          citizenship_status: processedPatientInfo.citizenship_status
        })
      };

      console.log('Creating patient with processed SA ID data:', patientData);

      const { data: newPatient, error: createPatientError } = await supabase
        .from('patients')
        .insert(patientData)
        .select('id')
        .single();

      if (createPatientError) {
        console.error('Error creating patient:', createPatientError);
        throw new Error('Failed to create patient record');
      }

      patientId = newPatient.id;
      console.log('Created new patient with processed SA ID data:', patientId);
    } else {
      console.log('Using existing patient:', patientId);
      
      // If patient exists, optionally update it with SA ID data if needed
      if (saIdData.isValid) {
        const { data: existingPatientData } = await supabase
          .from('patients')
          .select('date_of_birth, gender, id_number_valid')
          .eq('id', patientId)
          .single();
          
        if (existingPatientData && !existingPatientData.id_number_valid) {
          // Process the existing patient data with SA ID info
          const processedUpdate = processIDNumberForPatient(
            existingPatientData as any,
            validatedData.patientId
          );
          
          const updateData = {
            date_of_birth: processedUpdate.date_of_birth,
            gender: processedUpdate.gender,
            id_number_valid: processedUpdate.id_number_valid,
            birthdate_from_id: processedUpdate.birthdate_from_id,
            gender_from_id: processedUpdate.gender_from_id,
            citizenship_status: processedUpdate.citizenship_status
          };
          
          console.log('Updating existing patient with SA ID data:', updateData);
          
          const { error: updateError } = await supabase
            .from('patients')
            .update(updateData)
            .eq('id', patientId);
            
          if (updateError) {
            console.error('Error updating patient with SA ID data:', updateError);
          } else {
            console.log('Successfully updated patient with SA ID data');
          }
        }
      }
    }

    // Step 2: Handle medical examination using RPC function to avoid ON CONFLICT issues
    console.log('Creating/updating medical examination via RPC function');
    
    // Use a custom RPC function that handles the upsert logic server-side
    const { data: examination, error: rpcError } = await supabase.rpc('upsert_medical_examination', {
      p_patient_id: patientId,
      p_document_id: documentId,
      p_organization_id: organizationId,
      p_client_organization_id: clientOrganizationId,
      p_examination_date: normalizedExamDate,
      p_examination_type: validatedData.examinationType,
      p_expiry_date: normalizedExpiryDate,
      p_fitness_status: validatedData.fitnessStatus,
      p_company_name: validatedData.companyName,
      p_job_title: validatedData.occupation,
      p_restrictions: validatedData.restrictionsText !== 'None' ? [validatedData.restrictionsText] : [],
      p_follow_up_actions: validatedData.followUpActions || null,
      p_comments: validatedData.comments || null
    });

    if (rpcError) {
      console.error('RPC function failed, falling back to manual approach:', rpcError);
      
      // Fallback: Delete any existing examination for this document, then create new one
      console.log('Attempting fallback: delete then insert');
      
      // First, delete any existing examination for this document
      const { error: deleteError } = await supabase
        .from('medical_examinations')
        .delete()
        .eq('document_id', documentId);

      if (deleteError) {
        console.warn('Could not delete existing examination (may not exist):', deleteError);
      } else {
        console.log('Deleted existing examination for document');
      }

      // Now create a fresh examination record
      const baseExaminationData = {
        patient_id: patientId,
        document_id: documentId,
        organization_id: organizationId,
        examination_date: normalizedExamDate,
        examination_type: validatedData.examinationType,
        fitness_status: validatedData.fitnessStatus,
        company_name: validatedData.companyName,
        job_title: validatedData.occupation,
        restrictions: validatedData.restrictionsText !== 'None' ? [validatedData.restrictionsText] : []
      };

      // Only add non-null optional fields
      const optionalFields: any = {};
      if (clientOrganizationId) optionalFields.client_organization_id = clientOrganizationId;
      if (normalizedExpiryDate) optionalFields.expiry_date = normalizedExpiryDate;
      if (validatedData.followUpActions) optionalFields.follow_up_actions = validatedData.followUpActions;
      if (validatedData.comments) optionalFields.comments = validatedData.comments;

      const finalExaminationData = { ...baseExaminationData, ...optionalFields };

      // Now create a fresh examination record using direct SQL query
      console.log('Attempting direct SQL insert to bypass Supabase ORM');
      
      const examId = crypto.randomUUID();
      const currentTimestamp = new Date().toISOString();
      
      // Prepare values for SQL insertion
      const restrictionsArray = validatedData.restrictionsText !== 'None' ? [validatedData.restrictionsText] : [];
      
      const sqlQuery = `
        INSERT INTO medical_examinations (
          id, patient_id, document_id, organization_id, client_organization_id,
          examination_date, examination_type, expiry_date, fitness_status,
          company_name, job_title, restrictions, follow_up_actions, comments,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING id;
      `;

      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        query: sqlQuery,
        params: [
          examId,
          patientId,
          documentId,
          organizationId,
          clientOrganizationId,
          normalizedExamDate,
          validatedData.examinationType,
          normalizedExpiryDate,
          validatedData.fitnessStatus,
          validatedData.companyName,
          validatedData.occupation,
          JSON.stringify(restrictionsArray),
          validatedData.followUpActions,
          validatedData.comments,
          currentTimestamp,
          currentTimestamp
        ]
      });

      if (sqlError) {
        console.error('Direct SQL approach failed, trying absolute minimal insert:', sqlError);
        
        // Absolute last resort: insert with only required fields and no restrictions/arrays
        const absoluteMinimal = {
          patient_id: patientId,
          document_id: documentId,
          organization_id: organizationId,
          examination_date: normalizedExamDate,
          examination_type: validatedData.examinationType || 'pre-employment',
          fitness_status: validatedData.fitnessStatus || 'unknown',
          company_name: validatedData.companyName || 'N/A',
          job_title: validatedData.occupation || 'N/A'
        };

        console.log('Absolute minimal insert attempt:', absoluteMinimal);

        try {
          // Try without .select() to avoid any additional queries
          const { error: finalError } = await supabase
            .from('medical_examinations')
            .insert(absoluteMinimal);

          if (finalError) {
            throw new Error(`Final minimal insert failed: ${finalError.message} (${finalError.code})`);
          }

          // If insert succeeded, get the record ID
          const { data: insertedRecord, error: selectError } = await supabase
            .from('medical_examinations')
            .select('id')
            .eq('document_id', documentId)
            .single();

          if (selectError) {
            // Even if we can't get the ID, the insert worked
            examination = { id: 'unknown-but-created' };
          } else {
            examination = insertedRecord;
          }

          console.log('Absolute minimal insert succeeded');
        } catch (finalError) {
          console.error('All approaches exhausted:', finalError);
          throw new Error(`Cannot create medical examination: ${finalError.message}. This may be a database configuration issue.`);
        }
      } else {
        examination = { id: examId };
        console.log('Direct SQL insert succeeded:', examination.id);
      }
    } else {
      console.log('RPC function succeeded:', examination);
    }

    // Step 3: Create test results from document data (optional)
    try {
      const { data: document } = await supabase
        .from('documents')
        .select('extracted_data')
        .eq('id', documentId)
        .single();

      if (document?.extracted_data) {
        const extractedData = document.extracted_data as any;
        const structuredData = extractedData?.structured_data;
        
        if (structuredData?.certificate_info?.medical_tests) {
          const medicalTests = structuredData.certificate_info.medical_tests;
          const testResults = [];

          for (const [testKey, testData] of Object.entries(medicalTests)) {
            if (testKey.endsWith('_done') && testData === true) {
              const testType = testKey.replace('_done', '');
              const resultKey = `${testType}_results`;
              const result = medicalTests[resultKey];

              testResults.push({
                examination_id: examination.id,
                test_type: testType.replace(/_/g, ' '),
                test_done: true,
                test_result: result || 'N/A'
              });
            }
          }

          if (testResults.length > 0) {
            const { error: testError } = await supabase
              .from('medical_test_results')
              .insert(testResults);

            if (testError) {
              console.error('Error creating test results:', testError);
              // Don't fail the whole process for test results
            } else {
              console.log('Created test results:', testResults.length);
            }
          }
        }
      }
    } catch (testError) {
      console.warn('Error processing test results (non-critical):', testError);
      // Continue without test results
    }

    // Step 4: Update document status (optional)
    try {
      const { error: statusError } = await supabase
        .from('documents')
        .update({ 
          validation_status: 'promoted_to_patient',
          processed_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (statusError) {
        console.error('Error updating document status:', statusError);
        // Don't fail the process for status update
      }
    } catch (statusError) {
      console.warn('Error updating document status (non-critical):', statusError);
      // Continue without status update
    }

    console.log('Successfully promoted certificate to patient record');
    return { patientId, examinationId: examination.id };

  } catch (error) {
    console.error('Error in promoteToPatientRecord:', error);
    throw error;
  }
};

export const checkForDuplicates = async (
  patientId: string,
  examinationDate: string,
  organizationId: string
) => {
  try {
    // Normalize the inputs
    const normalizedPatientId = normalizePatientId(patientId);
    const normalizedExamDate = normalizeDate(examinationDate);

    console.log('Checking duplicates with normalized data:', {
      originalPatientId: patientId,
      normalizedPatientId,
      originalExamDate: examinationDate,
      normalizedExamDate,
      organizationId
    });

    // First, find the patient by ID number instead of using patient ID as UUID
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id_number', normalizedPatientId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (patientError) {
      console.error('Error finding patient for duplicate check:', patientError);
      return { hasDuplicates: false, duplicates: [] };
    }

    if (!patient) {
      // Patient doesn't exist, so no duplicates
      return { hasDuplicates: false, duplicates: [] };
    }

    // Now check for duplicates using the actual patient UUID
    const { data: duplicates, error } = await supabase
      .from('medical_examinations')
      .select('id, examination_date, fitness_status')
      .eq('patient_id', patient.id)
      .eq('examination_date', normalizedExamDate)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error checking for duplicates:', error);
      return { hasDuplicates: false, duplicates: [] };
    }

    return { 
      hasDuplicates: duplicates.length > 0, 
      duplicates: duplicates || [] 
    };
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return { hasDuplicates: false, duplicates: [] };
  }
};