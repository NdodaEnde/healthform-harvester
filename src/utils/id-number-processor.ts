import { PatientInfo } from '@/types/patient';
import { parseSouthAfricanIDNumber, normalizeIDNumber } from './sa-id-parser';

/**
 * Processes a South African ID number and updates patient information accordingly
 * Returns a new patient object with updated information based on ID number
 */
export const processIDNumberForPatient = (
  patient: PatientInfo,
  idNumber: string
): PatientInfo => {
  // Skip if ID number is empty
  if (!idNumber) {
    return patient;
  }

  // Normalize the ID number first
  const normalizedID = normalizeIDNumber(idNumber);
  
  // Parse the ID number to extract information
  const idData = parseSouthAfricanIDNumber(normalizedID);
  
  // Create a new patient object with the ID information
  const updatedPatient: PatientInfo = {
    ...patient,
    id_number: normalizedID,
    id_number_valid: idData.isValid
  };
  
  // Only update additional fields if the ID is valid
  if (idData.isValid) {
    // Format the birth date to ISO string (YYYY-MM-DD)
    const birthDateISO = idData.birthDate?.toISOString().split('T')[0];
    
    // Update patient information with data from ID
    updatedPatient.birthdate_from_id = birthDateISO;
    updatedPatient.gender_from_id = idData.gender || null;
    updatedPatient.citizenship_status = idData.citizenshipStatus === 'citizen' 
      ? 'citizen' 
      : 'permanent_resident';
    
    // If the patient doesn't have a date of birth or gender, use the one from ID
    if (!patient.date_of_birth && birthDateISO) {
      updatedPatient.date_of_birth = birthDateISO;
    }
    
    if (!patient.gender && idData.gender) {
      updatedPatient.gender = idData.gender;
    }
  }
  
  return updatedPatient;
};

/**
 * Checks if a patient's existing ID number is different from a new one
 * and needs to be processed
 */
export const doesIDNumberNeedProcessing = (
  patient: PatientInfo,
  newIDNumber: string
): boolean => {
  // Skip if new ID number is empty
  if (!newIDNumber) {
    return false;
  }
  
  // Normalize both ID numbers for comparison
  const normalizedNewID = normalizeIDNumber(newIDNumber);
  const normalizedExistingID = patient.id_number 
    ? normalizeIDNumber(patient.id_number) 
    : '';
  
  // ID needs processing if:
  // 1. Patient doesn't have an ID number yet
  // 2. The new ID number is different from the existing one
  return !normalizedExistingID || normalizedExistingID !== normalizedNewID;
};