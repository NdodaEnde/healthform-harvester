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

    // Normalize the patient ID and dates
    const normalizedPatientId = normalizePatientId(validatedData.patientId);
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

      // Create a basic patient info object for processing
      const basicPatientInfo = {
        first_name: firstName,
        last_name: lastName,
        id_number: normalizedPatientId,
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
        id_number: normalizedPatientId,
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
      console.log('Created new patient with SA ID data:', patientId);
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
    
    // Use the custom RPC function that handles the upsert logic server-side
    const { data: examination, error: rpcError } = await supabase.rpc('upsert_medical_examination', {
      p_patient_id: patientId,
      p_document_id: documentId,
      p_organization_id: organizationId,
      p_examination_date: normalizedExamDate,
      p_examination_type: validatedData.examinationType,
      p_fitness_status: validatedData.fitnessStatus,
      p_company_name: validatedData.companyName,
      p_job_title: validatedData.occupation,
      p_client_organization_id: clientOrganizationId,
      p_expiry_date: normalizedExpiryDate,
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
      const { data: currentUser } = await supabase.auth.getUser();

      const examinationData = {
        patient_id: patientId,
        document_id: documentId,
        organization_id: organizationId,
        client_organization_id: clientOrganizationId || null,
        examination_date: normalizedExamDate,
        examination_type: validatedData.examinationType,
        expiry_date: normalizedExpiryDate,
        fitness_status: validatedData.fitnessStatus,
        company_name: validatedData.companyName,
        job_title: validatedData.occupation,
        restrictions: validatedData.restrictionsText !== 'None' ? [validatedData.restrictionsText] : [],
        follow_up_actions: validatedData.followUpActions,
        comments: validatedData.comments,
        validated_by: currentUser.user?.id || null
      };

      console.log('Creating fresh examination with data:', examinationData);

      const { data: newExam, error: createError } = await supabase
        .from('medical_examinations')
        .insert(examinationData)
        .select('id')
        .single();

      if (createError) {
        console.error('Final fallback failed:', createError);
        throw new Error(`Failed to create medical examination record: ${createError.message}`);
      }

      console.log('Created new examination via fallback:', newExam.id);
      return { patientId, examinationId: newExam.id };
    } else {
      console.log('RPC function succeeded:', examination);
      return { patientId, examinationId: examination[0]?.id };
    }

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