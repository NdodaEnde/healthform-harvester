
-- Production Data Cleanup - Delete all test data while preserving structure
-- This will clean up all test data to prepare for production use

-- Delete in correct order to respect foreign key constraints

-- Delete medical test results first
DELETE FROM public.medical_test_results 
WHERE examination_id IN (
  SELECT id FROM public.medical_examinations 
  WHERE id != '00000000-0000-0000-0000-000000000000'
);

-- Delete certificate compliance records
DELETE FROM public.certificate_compliance 
WHERE id != '00000000-0000-0000-0000-000000000000';

-- Delete certificate expirations
DELETE FROM public.certificate_expirations 
WHERE id != '00000000-0000-0000-0000-000000000000';

-- Delete work queue items
DELETE FROM public.work_queue 
WHERE id != '00000000-0000-0000-0000-000000000000';

-- Delete notifications
DELETE FROM public.notifications 
WHERE id != '00000000-0000-0000-0000-000000000000';

-- Delete certificates
DELETE FROM public.certificates 
WHERE id != '00000000-0000-0000-0000-000000000000';

-- Delete medical examinations
DELETE FROM public.medical_examinations 
WHERE id != '00000000-0000-0000-0000-000000000000';

-- Delete documents
DELETE FROM public.documents 
WHERE id != '00000000-0000-0000-0000-000000000000';

-- Delete patients
DELETE FROM public.patients 
WHERE id != '00000000-0000-0000-0000-000000000000';

-- Delete audit logs
DELETE FROM public.audit_logs 
WHERE id != '00000000-0000-0000-0000-000000000000';

-- Delete processing documents
DELETE FROM public.processing_documents 
WHERE id != '00000000-0000-0000-0000-000000000000';
