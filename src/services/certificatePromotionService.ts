
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

    // Step 1: Verify document exists and get its current state
    console.log('🔍 Verifying document exists...');
    const { data: document, error: docFetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docFetchError || !document) {
      console.error('❌ Document not found:', docFetchError);
      throw new Error(`Document not found: ${docFetchError?.message || 'Unknown error'}`);
    }

    console.log('📄 Document found:', {
      id: document.id,
      file_name: document.file_name,
      current_owner_id: document.owner_id,
      status: document.status
    });

    // Step 2: Check if patient already exists by ID number
    let patientRecord = null;
    if (promotionData.patientId && promotionData.patientId !== 'Unknown') {
      console.log('🔍 Searching for existing patient with ID:', promotionData.patientId);
      const { data: existingPatients, error: searchError } = await supabase
        .from('patients')
        .select('*')
        .eq('id_number', promotionData.patientId)
        .eq('organization_id', organizationId);

      if (searchError) {
        console.error('Error searching for existing patient:', searchError);
      } else if (existingPatients && existingPatients.length > 0) {
        patientRecord = existingPatients[0];
        console.log('📌 Found existing patient:', {
          id: patientRecord.id,
          name: `${patientRecord.first_name} ${patientRecord.last_name}`,
          id_number: patientRecord.id_number
        });
      }
    }

    // Step 3: Create new patient if doesn't exist
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
        console.error('❌ Error creating patient:', patientError);
        throw new Error(`Failed to create patient: ${patientError.message}`);
      }

      patientRecord = newPatient;
      console.log('✅ Created new patient:', {
        id: patientRecord.id,
        name: `${patientRecord.first_name} ${patientRecord.last_name}`,
        id_number: patientRecord.id_number
      });
    }

    // Step 4: CRITICAL - Link the document to the patient
    console.log('🔗 Linking document to patient...');
    console.log('📋 Update parameters:', {
      documentId,
      newOwnerId: patientRecord.id,
      newStatus: 'completed'
    });

    const { data: updatedDocument, error: documentUpdateError } = await supabase
      .from('documents')
      .update({ 
        owner_id: patientRecord.id,
        status: 'completed' // Mark as completed since it's now processed and linked
      })
      .eq('id', documentId)
      .select(); // Add select to return the updated data

    if (documentUpdateError) {
      console.error('❌ Error linking document to patient:', documentUpdateError);
      throw new Error(`Failed to link document to patient: ${documentUpdateError.message}`);
    }

    console.log('✅ Document update result:', updatedDocument);

    // Verify the update worked
    const { data: verifyDocument, error: verifyError } = await supabase
      .from('documents')
      .select('owner_id, status')
      .eq('id', documentId)
      .single();

    if (verifyError) {
      console.warn('⚠️ Could not verify document update:', verifyError);
    } else {
      console.log('🔍 Document verification:', {
        owner_id: verifyDocument.owner_id,
        status: verifyDocument.status,
        expectedOwnerId: patientRecord.id
      });

      if (verifyDocument.owner_id !== patientRecord.id) {
        console.error('❌ Document linking failed - owner_id mismatch!');
        throw new Error('Document was not properly linked to patient');
      }
    }

    console.log('✅ Document successfully linked to patient');

    // Step 5: Create medical examination record
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

    console.log('📋 Examination data:', examinationData);

    const { data: examination, error: examinationError } = await supabase
      .from('medical_examinations')
      .insert([examinationData])
      .select()
      .single();

    if (examinationError) {
      console.error('❌ Error creating medical examination:', examinationError);
      throw new Error(`Failed to create medical examination: ${examinationError.message}`);
    }

    console.log('✅ Medical examination created:', {
      id: examination.id,
      patient_id: examination.patient_id,
      document_id: examination.document_id
    });

    // Step 6: Return success result
    const result = {
      success: true,
      patientId: patientRecord.id,
      examinationId: examination.id,
      documentId: documentId,
      message: 'Patient record and medical examination created successfully'
    };

    console.log('🎉 Promotion completed successfully:', result);
    return result;

  } catch (error) {
    console.error('❌ Error in promoteToPatientRecord:', error);
    throw error;
  }
};
