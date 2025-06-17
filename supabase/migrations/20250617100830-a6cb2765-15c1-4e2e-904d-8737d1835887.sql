
-- Add indexes and constraints to medical_test_results table for better performance
CREATE INDEX IF NOT EXISTS idx_medical_test_results_examination_id ON medical_test_results(examination_id);
CREATE INDEX IF NOT EXISTS idx_medical_test_results_test_type ON medical_test_results(test_type);
CREATE INDEX IF NOT EXISTS idx_medical_test_results_test_done ON medical_test_results(test_done);

-- Add a function to extract and store medical test results from examination data
CREATE OR REPLACE FUNCTION extract_medical_test_results(
  p_examination_id UUID,
  p_extracted_data JSONB
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  test_count INTEGER := 0;
  vision_data JSONB;
  hearing_data JSONB;
  lung_data JSONB;
  other_tests JSONB;
BEGIN
  -- Clear existing test results for this examination
  DELETE FROM medical_test_results WHERE examination_id = p_examination_id;
  
  -- Extract Vision Tests
  vision_data := p_extracted_data->'visionTests';
  IF vision_data IS NOT NULL THEN
    -- Visual Acuity
    IF vision_data->>'visualAcuity' IS NOT NULL THEN
      INSERT INTO medical_test_results (examination_id, test_type, test_done, test_result, notes)
      VALUES (p_examination_id, 'visual_acuity', true, vision_data->>'visualAcuity', vision_data->>'visualAcuityNotes');
      test_count := test_count + 1;
    END IF;
    
    -- Color Vision
    IF vision_data->>'colorVision' IS NOT NULL THEN
      INSERT INTO medical_test_results (examination_id, test_type, test_done, test_result, notes)
      VALUES (p_examination_id, 'color_vision', true, vision_data->>'colorVision', vision_data->>'colorVisionNotes');
      test_count := test_count + 1;
    END IF;
    
    -- Peripheral Vision
    IF vision_data->>'peripheralVision' IS NOT NULL THEN
      INSERT INTO medical_test_results (examination_id, test_type, test_done, test_result, notes)
      VALUES (p_examination_id, 'peripheral_vision', true, vision_data->>'peripheralVision', vision_data->>'peripheralVisionNotes');
      test_count := test_count + 1;
    END IF;
  END IF;
  
  -- Extract Hearing Tests
  hearing_data := p_extracted_data->'hearingTests';
  IF hearing_data IS NOT NULL THEN
    -- Audiometry
    IF hearing_data->>'audiometry' IS NOT NULL THEN
      INSERT INTO medical_test_results (examination_id, test_type, test_done, test_result, notes)
      VALUES (p_examination_id, 'audiometry', true, hearing_data->>'audiometry', hearing_data->>'audiometryNotes');
      test_count := test_count + 1;
    END IF;
    
    -- Whisper Test
    IF hearing_data->>'whisperTest' IS NOT NULL THEN
      INSERT INTO medical_test_results (examination_id, test_type, test_done, test_result, notes)
      VALUES (p_examination_id, 'whisper_test', true, hearing_data->>'whisperTest', hearing_data->>'whisperTestNotes');
      test_count := test_count + 1;
    END IF;
  END IF;
  
  -- Extract Lung Function Tests
  lung_data := p_extracted_data->'lungFunctionTests';
  IF lung_data IS NOT NULL THEN
    -- Spirometry
    IF lung_data->>'spirometry' IS NOT NULL THEN
      INSERT INTO medical_test_results (examination_id, test_type, test_done, test_result, notes)
      VALUES (p_examination_id, 'spirometry', true, lung_data->>'spirometry', lung_data->>'spirometryNotes');
      test_count := test_count + 1;
    END IF;
    
    -- Chest X-Ray
    IF lung_data->>'chestXray' IS NOT NULL THEN
      INSERT INTO medical_test_results (examination_id, test_type, test_done, test_result, notes)
      VALUES (p_examination_id, 'chest_xray', true, lung_data->>'chestXray', lung_data->>'chestXrayNotes');
      test_count := test_count + 1;
    END IF;
  END IF;
  
  -- Extract Other Medical Tests
  other_tests := p_extracted_data->'medicalTests';
  IF other_tests IS NOT NULL THEN
    -- Blood Pressure
    IF other_tests->>'bloodPressure' IS NOT NULL THEN
      INSERT INTO medical_test_results (examination_id, test_type, test_done, test_result, notes)
      VALUES (p_examination_id, 'blood_pressure', true, other_tests->>'bloodPressure', other_tests->>'bloodPressureNotes');
      test_count := test_count + 1;
    END IF;
    
    -- Heart Rate
    IF other_tests->>'heartRate' IS NOT NULL THEN
      INSERT INTO medical_test_results (examination_id, test_type, test_done, test_result, notes)
      VALUES (p_examination_id, 'heart_rate', true, other_tests->>'heartRate', other_tests->>'heartRateNotes');
      test_count := test_count + 1;
    END IF;
    
    -- BMI
    IF other_tests->>'bmi' IS NOT NULL THEN
      INSERT INTO medical_test_results (examination_id, test_type, test_done, test_result, notes)
      VALUES (p_examination_id, 'bmi', true, other_tests->>'bmi', other_tests->>'bmiNotes');
      test_count := test_count + 1;
    END IF;
    
    -- Urine Test
    IF other_tests->>'urinalysis' IS NOT NULL THEN
      INSERT INTO medical_test_results (examination_id, test_type, test_done, test_result, notes)
      VALUES (p_examination_id, 'urinalysis', true, other_tests->>'urinalysis', other_tests->>'urinalysisNotes');
      test_count := test_count + 1;
    END IF;
  END IF;
  
  RETURN test_count;
END;
$$;

-- Function to backfill medical test results from existing examinations
CREATE OR REPLACE FUNCTION backfill_medical_test_results()
RETURNS TABLE(examination_id UUID, tests_extracted INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  exam_record RECORD;
  test_count INTEGER;
BEGIN
  -- Loop through all medical examinations that have associated documents with extracted_data
  FOR exam_record IN 
    SELECT me.id as exam_id, d.extracted_data
    FROM medical_examinations me
    JOIN documents d ON me.document_id = d.id
    WHERE d.extracted_data IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM medical_test_results mtr 
      WHERE mtr.examination_id = me.id
    )
  LOOP
    -- Extract test results for this examination
    SELECT extract_medical_test_results(exam_record.exam_id, exam_record.extracted_data) INTO test_count;
    
    -- Return the result
    examination_id := exam_record.exam_id;
    tests_extracted := test_count;
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;
