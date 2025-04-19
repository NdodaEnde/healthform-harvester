-- Add ID number related fields to the patients table
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS id_number_valid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS birthdate_from_id DATE,
ADD COLUMN IF NOT EXISTS gender_from_id TEXT CHECK (gender_from_id IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS citizenship_status TEXT CHECK (citizenship_status IN ('citizen', 'permanent_resident'));

-- Create index on id_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_patients_id_number ON patients(id_number);

-- Add function to update patient demographic info from ID number
CREATE OR REPLACE FUNCTION update_patient_from_id_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process valid ID numbers
  IF NEW.id_number_valid = TRUE THEN
    -- Update date of birth if not already set
    IF NEW.date_of_birth IS NULL AND NEW.birthdate_from_id IS NOT NULL THEN
      NEW.date_of_birth := NEW.birthdate_from_id;
    END IF;
    
    -- Update gender if not already set
    IF NEW.gender IS NULL AND NEW.gender_from_id IS NOT NULL THEN
      NEW.gender := NEW.gender_from_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update patient info when ID number is validated
DROP TRIGGER IF EXISTS on_valid_id_number ON patients;
CREATE TRIGGER on_valid_id_number
BEFORE INSERT OR UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION update_patient_from_id_number();