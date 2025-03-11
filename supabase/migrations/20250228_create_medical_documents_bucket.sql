
-- Check if the bucket already exists
DO $$
BEGIN
  -- Create medical-documents storage bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'medical-documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('medical-documents', 'medical-documents', false);
  END IF;
END $$;

