
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

  -- Ensure the 'documents' bucket also exists and is public
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('documents', 'documents', true);
    
    -- Create a policy to allow authenticated users to upload files
    INSERT INTO storage.policies (name, definition, bucket_id)
    VALUES (
      'Authenticated users can upload documents',
      '(auth.role() = ''authenticated'')',
      'documents'
    );
    
    -- Create a policy to allow anyone to download public files
    INSERT INTO storage.policies (name, definition, bucket_id)
    VALUES (
      'Documents are publicly accessible',
      '(bucket_id = ''documents'')',
      'documents'
    );
  ELSE
    -- If the documents bucket exists, make sure it's public
    UPDATE storage.buckets
    SET public = true
    WHERE name = 'documents' AND public = false;
  END IF;
  
  -- Also ensure the medical-documents bucket is public if it already exists
  UPDATE storage.buckets
  SET public = true
  WHERE name = 'medical-documents' AND public = false;
END $$;
