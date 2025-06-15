
import { supabase } from '@/integrations/supabase/client';

export interface PromotionData {
  patientName: string;
  patientId: string;
  companyName: string;
  occupation: string;
  fitnessStatus: string;
  restrictionsText: string;
  examinationDate: string;
  expiryDate?: string;
  examinationType: string;
  comments?: string;
  followUpActions?: string;
}

export const checkForDuplicates = async (
  patientIdNumber: string,
  examinationDate: string,
  organizationId: string
) => {
  try {
    const { data: existingExaminations, error } = await supabase
      .from('medical_examinations')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`patient_id.in.(select id from patients where id_number = '${patientIdNumber}')`)
      .eq('examination_date', examinationDate);

    if (error) throw error;

    return {
      hasDuplicates: (existingExaminations?.length || 0) > 0,
      duplicates: existingExaminations || []
    };
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return { hasDuplicates: false, duplicates: [] };
  }
};

export const promoteToPatientRecord = async (
  documentId: string,
  promotionData: PromotionData,
  organizationId: string,
  clientOrganizationId?: string
) => {
  try {
    console.log('🚀 Starting patient record promotion for document:', documentId);
    console.log('📋 Promotion data:', promotionData);

    // Step 1: Check if patient already exists by ID number
    let patientRecord = null;
    if (promotionData.patientId && promotionData.patientId !== 'Unknown') {
      const { data: existingPatients, error: searchError } = await supabase
        .from('patients')
        .select('*')
        .eq('id_number', promotionData.patientId)
        .eq('organization_id', organizationId);

      if (searchError) {
        console.error('Error searching for existing patient:', searchError);
      } else if (existingPatients && existingPatients.length > 0) {
        patientRecord = existingPatients[0];
        console.log('📌 Found existing patient:', patientRecord.id);
      }
    }

    // Step 2: Create new patient if doesn't exist
    if (!patientRecord) {
      console.log('👤 Creating new patient record...');
      
      const patientData = {
        first_name: promotionData.patientName.split(' ')[0] || 'Unknown',
        last_name: promotionData.patientName.split(' ').slice(1).join(' ') || 'Unknown',
        id_number: promotionData.patientId !== 'Unknown' ? promotionData.patientId : null,
        organization_id: organizationId,
        client_organization_id: clientOrganizationId,
        date_of_birth: new Date().toISOString().split('T')[0], // Default date
        contact_info: {
          company: promotionData.companyName,
          occupation: promotionData.occupation
        }
      };

      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();

      if (patientError) {
        console.error('Error creating patient:', patientError);
        throw new Error(`Failed to create patient: ${patientError.message}`);
      }

      patientRecord = newPatient;
      console.log('✅ Created new patient with ID:', patientRecord.id);
    }

    // Step 3: Update the document to link it to the patient
    console.log('🔗 Linking document to patient...');
    const { error: documentUpdateError } = await supabase
      .from('documents')
      .update({ 
        owner_id: patientRecord.id,
        status: 'completed' // Mark as completed since it's now processed and linked
      })
      .eq('id', documentId);

    if (documentUpdateError) {
      console.error('Error linking document to patient:', documentUpdateError);
      throw new Error(`Failed to link document to patient: ${documentUpdateError.message}`);
    }

    console.log('✅ Document successfully linked to patient');

    // Step 4: Create medical examination record
    console.log('🏥 Creating medical examination record...');
    
    const examinationData = {
      patient_id: patientRecord.id,
      document_id: documentId,
      organization_id: organizationId,
      client_organization_id: clientOrganizationId,
      examination_date: promotionData.examinationDate,
      examination_type: promotionData.examinationType,
      fitness_status: promotionData.fitnessStatus,
      company_name: promotionData.companyName,
      job_title: promotionData.occupation,
      expiry_date: promotionData.expiryDate || null,
      restrictions: promotionData.restrictionsText && promotionData.restrictionsText !== 'None' 
        ? [promotionData.restrictionsText] 
        : [],
      comments: promotionData.comments || '',
      follow_up_actions: promotionData.followUpActions || ''
    };

    const { data: examination, error: examinationError } = await supabase
      .from('medical_examinations')
      .insert([examinationData])
      .select()
      .single();

    if (examinationError) {
      console.error('Error creating medical examination:', examinationError);
      throw new Error(`Failed to create medical examination: ${examinationError.message}`);
    }

    console.log('✅ Medical examination created with ID:', examination.id);

    // Step 5: Return success result
    return {
      success: true,
      patientId: patientRecord.id,
      examinationId: examination.id,
      message: 'Patient record and medical examination created successfully'
    };

  } catch (error) {
    console.error('❌ Error in promoteToPatientRecord:', error);
    throw error;
  }
};
