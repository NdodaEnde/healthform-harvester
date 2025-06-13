
-- Add validated_by field to track who validated the document
ALTER TABLE documents 
ADD COLUMN validated_by uuid REFERENCES auth.users(id);

-- Add index for performance
CREATE INDEX idx_documents_validated_by ON documents(validated_by);
