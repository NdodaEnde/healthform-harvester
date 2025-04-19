-- Add new columns to the patients table for South African ID number data
ALTER TABLE patients ADD COLUMN id_number text;
ALTER TABLE patients ADD COLUMN birthdate_from_id date;
ALTER TABLE patients ADD COLUMN gender_from_id text;
ALTER TABLE patients ADD COLUMN citizenship_status text;
ALTER TABLE patients ADD COLUMN id_number_valid boolean;

-- Add comment descriptions to the columns
COMMENT ON COLUMN patients.id_number IS 'South African ID number (13 digits)';
COMMENT ON COLUMN patients.birthdate_from_id IS 'Birth date extracted from ID number';
COMMENT ON COLUMN patients.gender_from_id IS 'Gender extracted from ID number (male/female)';
COMMENT ON COLUMN patients.citizenship_status IS 'Citizenship status from ID number (SA citizen or permanent resident)';
COMMENT ON COLUMN patients.id_number_valid IS 'Whether the ID number passes validation check';