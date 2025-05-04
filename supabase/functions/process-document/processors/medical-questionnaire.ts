
import { extractPath, cleanValue, checkCondition } from "../utils.ts";

// Process medical questionnaire data from Landing AI response
export function processMedicalQuestionnaireData(apiResponse: any) {
  try {
    // Extract fields from AI response
    const extractedData = apiResponse.result || {};
    const markdown = apiResponse.data?.markdown || '';
    
    // Build structured data object from API response
    return {
      patient: {
        name: cleanValue(extractPath(extractedData, 'patient.name')) || 'Unknown',
        date_of_birth: cleanValue(extractPath(extractedData, 'patient.date_of_birth')) || '',
        employee_id: cleanValue(extractPath(extractedData, 'patient.id')) || '',
        gender: cleanValue(extractPath(extractedData, 'patient.gender')) || ''
      },
      medical_history: {
        has_hypertension: checkCondition(extractedData, 'medical_history.conditions', 'hypertension'),
        has_diabetes: checkCondition(extractedData, 'medical_history.conditions', 'diabetes'),
        has_heart_disease: checkCondition(extractedData, 'medical_history.conditions', 'heart disease'),
        has_allergies: extractPath(extractedData, 'medical_history.allergies')?.length > 0,
        allergies: extractPath(extractedData, 'medical_history.allergies') || []
      },
      current_medications: extractPath(extractedData, 'medications') || [],
      questionnaire_date: cleanValue(extractPath(extractedData, 'date')) || new Date().toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Error processing medical questionnaire data:', error);
    // Return basic structure with default values on error
    return {
      patient: {
        name: "Unknown",
        employee_id: "Unknown"
      },
      medical_history: {},
      questionnaire_date: new Date().toISOString().split('T')[0]
    };
  }
}
