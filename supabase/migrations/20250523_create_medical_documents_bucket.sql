
-- Check if the bucket already exists
DO $$
BEGIN
  -- Create medical-documents storage bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'medical-documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('medical-documents', 'medical-documents', true);
    
    -- Create a policy to allow authenticated users to upload files
    INSERT INTO storage.policies (name, definition, bucket_id)
    VALUES (
      'Authenticated users can upload documents',
      '(auth.role() = ''authenticated'')',
      'medical-documents'
    );
    
    -- Create a policy to allow anyone to download public files
    INSERT INTO storage.policies (name, definition, bucket_id)
    VALUES (
      'Documents are publicly accessible',
      '(bucket_id = ''medical-documents'')',
      'medical-documents'
    );
  END IF;
END $$;
