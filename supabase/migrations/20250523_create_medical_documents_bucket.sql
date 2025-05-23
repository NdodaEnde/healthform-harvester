
-- Clean up old documents bucket if it exists
DO $$
BEGIN
  -- Drop the old documents bucket if it exists
  IF EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'documents'
  ) THEN
    DELETE FROM storage.objects WHERE bucket_id = 'documents';
    DELETE FROM storage.buckets WHERE name = 'documents';
  END IF;
  
  -- Create or update medical-documents storage bucket
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'medical-documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('medical-documents', 'medical-documents', true);
    
    -- Create a policy to allow authenticated users to upload files
    INSERT INTO storage.policies (name, definition, bucket_id, operation)
    VALUES (
      'Authenticated users can upload documents',
      '(auth.role() = ''authenticated'')',
      'medical-documents',
      'INSERT'
    );
    
    -- Create a policy to allow authenticated users to update files they uploaded
    INSERT INTO storage.policies (name, definition, bucket_id, operation)
    VALUES (
      'Authenticated users can update their documents',
      '(auth.role() = ''authenticated'')',
      'medical-documents',
      'UPDATE'
    );
    
    -- Create a policy to allow anyone to download files
    INSERT INTO storage.policies (name, definition, bucket_id, operation)
    VALUES (
      'Documents are publicly accessible',
      'true',
      'medical-documents',
      'SELECT'
    );
  END IF;
END $$;
