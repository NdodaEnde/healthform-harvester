
-- Add processing_metadata column to documents table for structured extraction tracking
ALTER TABLE documents 
ADD COLUMN processing_metadata jsonb DEFAULT '{}'::jsonb;

-- Add index for performance on processing_metadata queries
CREATE INDEX idx_documents_processing_metadata ON documents USING gin(processing_metadata);

-- Add comment explaining the column
COMMENT ON COLUMN documents.processing_metadata IS 'Metadata about document processing including extraction method, confidence scores, and processing timestamps';
