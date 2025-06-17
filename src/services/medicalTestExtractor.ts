
import { supabase } from '@/integrations/supabase/client';

export interface MedicalTestData {
  visionTests?: {
    visualAcuity?: string;
    visualAcuityNotes?: string;
    colorVision?: string;
    colorVisionNotes?: string;
    peripheralVision?: string;
    peripheralVisionNotes?: string;
  };
  hearingTests?: {
    audiometry?: string;
    audiometryNotes?: string;
    whisperTest?: string;
    whisperTestNotes?: string;
  };
  lungFunctionTests?: {
    spirometry?: string;
    spirometryNotes?: string;
    chestXray?: string;
    chestXrayNotes?: string;
  };
  medicalTests?: {
    bloodPressure?: string;
    bloodPressureNotes?: string;
    heartRate?: string;
    heartRateNotes?: string;
    bmi?: string;
    bmiNotes?: string;
    urinalysis?: string;
    urinalysisNotes?: string;
  };
}

export const extractMedicalTestResults = async (
  examinationId: string,
  extractedData: any
): Promise<number> => {
  try {
    console.log('Extracting medical test results for examination:', examinationId);
    
    const { data, error } = await supabase.rpc('extract_medical_test_results', {
      p_examination_id: examinationId,
      p_extracted_data: extractedData
    });

    if (error) {
      console.error('Error extracting medical test results:', error);
      throw error;
    }

    console.log(`Successfully extracted ${data} medical test results`);
    return data || 0;
  } catch (error) {
    console.error('Error in extractMedicalTestResults:', error);
    throw error;
  }
};

export const backfillHistoricalTestResults = async (): Promise<any[]> => {
  try {
    console.log('Starting backfill of historical medical test results...');
    
    const { data, error } = await supabase.rpc('backfill_medical_test_results');

    if (error) {
      console.error('Error during backfill:', error);
      throw error;
    }

    console.log(`Backfill completed. Processed ${data?.length || 0} examinations`);
    return data || [];
  } catch (error) {
    console.error('Error in backfillHistoricalTestResults:', error);
    throw error;
  }
};

export const getMedicalTestResultsByExamination = async (examinationId: string) => {
  try {
    const { data, error } = await supabase
      .from('medical_test_results')
      .select('*')
      .eq('examination_id', examinationId)
      .order('test_type');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching medical test results:', error);
    throw error;
  }
};
