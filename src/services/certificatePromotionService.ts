
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

export const promoteToPatientRecord = async (
  documentId: string,
  validatedData: PromotionData,
  organizationId: string,
  clientOrganizationId?: string
) => {
  try {
    console.log('Starting promotion to patient record:', { documentId, validatedData });

    // Step 1: Find or create patient
    const { data: existingPatient, error: patientSearchError } = await supabase
      .from('patients')
      .select('id')
      .eq('id_number', validatedData.patientId)
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
          id_number: validatedData.patientId,
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
    const { data: examination, error: examError } = await supabase
      .from('medical_examinations')
      .insert({
        patient_id: patientId,
        document_id: documentId,
        organization_id: organizationId,
        client_organization_id: clientOrganizationId,
        examination_date: validatedData.examinationDate,
        examination_type: validatedData.examinationType,
        expiry_date: validatedData.expiryDate || null,
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

    if (examError) {
      console.error('Error creating medical examination:', examError);
      throw new Error('Failed to create medical examination record');
    }

    console.log('Created medical examination:', examination.id);

    // Step 3: Create test results from document data
    const { data: document } = await supabase
      .from('documents')
      .select('extracted_data')
      .eq('id', documentId)
      .single();

    if (document?.extracted_data?.structured_data?.certificate_info?.medical_tests) {
      const medicalTests = document.extracted_data.structured_data.certificate_info.medical_tests;
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
  const { data: duplicates, error } = await supabase
    .from('medical_examinations')
    .select('id, examination_date, fitness_status')
    .eq('patient_id', patientId)
    .eq('examination_date', examinationDate)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error checking for duplicates:', error);
    return { hasDuplicates: false, duplicates: [] };
  }

  return { 
    hasDuplicates: duplicates.length > 0, 
    duplicates: duplicates || [] 
  };
};
