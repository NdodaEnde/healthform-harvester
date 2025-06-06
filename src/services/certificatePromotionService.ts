import { supabase } from '@/integrations/supabase/client';
import { extractCertificateData, formatCertificateData } from '@/lib/utils';
import { toast } from 'sonner';

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

// Helper function to normalize patient ID
const normalizePatientId = (patientId: string): string => {
  if (!patientId) return '';
  
  // Remove spaces and special characters, keep only alphanumeric
  return patientId.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
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

    // Normalize the patient ID and dates
    const normalizedPatientId = normalizePatientId(validatedData.patientId);
    const normalizedExamDate = normalizeDate(validatedData.examinationDate);
    const normalizedExpiryDate = validatedData.expiryDate ? normalizeDate(validatedData.expiryDate) : null;

    console.log('Normalized data:', {
      originalPatientId: validatedData.patientId,
      normalizedPatientId,
      originalExamDate: validatedData.examinationDate,
      normalizedExamDate,
      originalExpiryDate: validatedData.expiryDate,
      normalizedExpiryDate
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

      const { data: newPatient, error: createPatientError } = await supabase
        .from('patients')
        .insert({
          first_name: firstName,
          last_name: lastName,
          id_number: normalizedPatientId,
          organization_id: organizationId,
          client_organization_id: clientOrganizationId,
          date_of_birth: new Date().toISOString().split('T')[0] // Will be updated from ID processing
        })
        .select('id')
        .single();

      if (createPatientError) {
        console.error('Error creating patient:', createPatientError);
        throw new Error('Failed to create patient record');
      }

      patientId = newPatient.id;
      console.log('Created new patient:', patientId);
    } else {
      console.log('Using existing patient:', patientId);
    }

    // Step 2: Create medical examination record
    // First check if examination already exists for this document
    const { data: existingExam } = await supabase
      .from('medical_examinations')
      .select('id')
      .eq('document_id', documentId)
      .maybeSingle();

    let examination;
    
    if (existingExam) {
      // Update existing examination
      const { data: updatedExam, error: updateError } = await supabase
        .from('medical_examinations')
        .update({
          patient_id: patientId,
          organization_id: organizationId,
          client_organization_id: clientOrganizationId,
          examination_date: normalizedExamDate,
          examination_type: validatedData.examinationType,
          expiry_date: normalizedExpiryDate,
          fitness_status: validatedData.fitnessStatus,
          company_name: validatedData.companyName,
          job_title: validatedData.occupation,
          restrictions: validatedData.restrictionsText !== 'None' ? [validatedData.restrictionsText] : [],
          follow_up_actions: validatedData.followUpActions,
          comments: validatedData.comments,
          validated_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingExam.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('Error updating medical examination:', updateError);
        throw new Error('Failed to update medical examination record');
      }
      
      examination = updatedExam;
      console.log('Updated existing medical examination:', examination.id);
    } else {
      // Create new examination
      const { data: newExam, error: createError } = await supabase
        .from('medical_examinations')
        .insert({
          patient_id: patientId,
          document_id: documentId,
          organization_id: organizationId,
          client_organization_id: clientOrganizationId,
          examination_date: normalizedExamDate,
          examination_type: validatedData.examinationType,
          expiry_date: normalizedExpiryDate,
          fitness_status: validatedData.fitnessStatus,
          company_name: validatedData.companyName,
          job_title: validatedData.occupation,
          restrictions: validatedData.restrictionsText !== 'None' ? [validatedData.restrictionsText] : [],
          follow_up_actions: validatedData.followUpActions,
          comments: validatedData.comments,
          validated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating medical examination:', createError);
        throw new Error('Failed to create medical examination record');
      }
      
      examination = newExam;
      console.log('Created new medical examination:', examination.id);
    }

    console.log('Created medical examination:', examination.id);

    // Step 3: Create test results from document data
    const { data: document } = await supabase
      .from('documents')
      .select('extracted_data')
      .eq('id', documentId)
      .single();

    if (document?.extracted_data) {
      // Type assertion for the extracted_data
      const extractedData = document.extracted_data as any;
      const structuredData = extractedData?.structured_data;
      
      if (structuredData?.certificate_info?.medical_tests) {
        const medicalTests = structuredData.certificate_info.medical_tests;
        const testResults = [];

        // Convert medical tests to test results
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

    // Step 4: Update document status
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