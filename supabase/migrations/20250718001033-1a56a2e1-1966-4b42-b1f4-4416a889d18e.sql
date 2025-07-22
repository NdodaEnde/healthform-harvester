-- Create function to backfill validation status for documents linked to patients/examinations
CREATE OR REPLACE FUNCTION backfill_document_validation_status()
RETURNS TABLE(document_id uuid, updated_status text) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update documents that have linked medical examinations (indicating validation)
  UPDATE documents 
  SET validation_status = 'validated',
      updated_at = NOW()
  WHERE id IN (
    SELECT DISTINCT d.id 
    FROM documents d
    INNER JOIN medical_examinations me ON d.id = me.document_id
    WHERE d.validation_status = 'pending'
  );
  
  -- Update documents that have owner_id (linked to patients, indicating validation)
  UPDATE documents 
  SET validation_status = 'validated',
      updated_at = NOW()
  WHERE owner_id IS NOT NULL 
    AND validation_status = 'pending'
    AND document_type = 'certificate-fitness';
  
  -- Return updated documents
  RETURN QUERY
  SELECT d.id, d.validation_status
  FROM documents d
  WHERE d.validation_status = 'validated'
    AND d.updated_at >= NOW() - INTERVAL '5 minutes';
END;
$$;

-- Create function to check validation status consistency
CREATE OR REPLACE FUNCTION check_validation_consistency()
RETURNS TABLE(
  total_documents bigint,
  pending_documents bigint, 
  validated_documents bigint,
  documents_with_patients bigint,
  documents_with_examinations bigint,
  inconsistent_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM documents)::bigint as total_documents,
    (SELECT COUNT(*) FROM documents WHERE validation_status = 'pending')::bigint as pending_documents,
    (SELECT COUNT(*) FROM documents WHERE validation_status = 'validated')::bigint as validated_documents,
    (SELECT COUNT(*) FROM documents WHERE owner_id IS NOT NULL)::bigint as documents_with_patients,
    (SELECT COUNT(DISTINCT d.id) FROM documents d INNER JOIN medical_examinations me ON d.id = me.document_id)::bigint as documents_with_examinations,
    (SELECT COUNT(*) FROM documents d WHERE d.owner_id IS NOT NULL AND d.validation_status = 'pending')::bigint as inconsistent_count;
END;
$$;