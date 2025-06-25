
-- Fix the get_dashboard_metrics RPC function
CREATE OR REPLACE FUNCTION get_dashboard_metrics(org_id UUID)
RETURNS TABLE(
  total_active_employees BIGINT,
  compliance_rate NUMERIC,
  certificates_expiring BIGINT,
  tests_this_month BIGINT,
  tests_last_month BIGINT,
  pending_reviews BIGINT,
  system_health NUMERIC,
  missing_records BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH patient_data AS (
    SELECT COUNT(DISTINCT p.id) as total_patients_count
    FROM patients p
    WHERE p.organization_id = org_id OR p.client_organization_id = org_id
  ),
  examination_data AS (
    SELECT me.*
    FROM medical_examinations me
    INNER JOIN patients p ON me.patient_id = p.id
    WHERE p.organization_id = org_id OR p.client_organization_id = org_id
  ),
  compliance_data AS (
    SELECT 
      COUNT(*) as total_records,
      COUNT(CASE WHEN ed.expiry_date IS NULL OR ed.expiry_date >= CURRENT_DATE THEN 1 END) as compliant_count
    FROM examination_data ed
  ),
  document_data AS (
    SELECT 
      COUNT(*) as total_docs,
      COUNT(CASE WHEN d.status = 'processed' THEN 1 END) as processed_docs,
      COUNT(CASE WHEN d.status = 'uploaded' THEN 1 END) as pending_docs
    FROM documents d
    WHERE d.organization_id = org_id OR d.client_organization_id = org_id
  ),
  metrics AS (
    SELECT 
      -- Total active employees
      pd.total_patients_count as total_active_employees,
      
      -- Compliance rate
      CASE 
        WHEN cd.total_records > 0 
        THEN (cd.compliant_count::NUMERIC / cd.total_records::NUMERIC) * 100 
        ELSE 100 
      END as compliance_rate,
      
      -- Certificates expiring in 30 days
      COUNT(CASE WHEN ed.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as certificates_expiring,
      
      -- Tests this month
      COUNT(CASE WHEN ed.examination_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as tests_this_month,
      
      -- Tests last month
      COUNT(CASE WHEN ed.examination_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' 
                   AND ed.examination_date < DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as tests_last_month,
      
      -- Pending reviews
      COALESCE(dd.pending_docs, 0) as pending_reviews,
      
      -- System health
      CASE 
        WHEN dd.total_docs > 0 
        THEN (dd.processed_docs::NUMERIC / dd.total_docs::NUMERIC) * 100 
        ELSE 100 
      END as system_health,
      
      -- Missing records
      GREATEST(0, pd.total_patients_count - cd.total_records) as missing_records
      
    FROM patient_data pd
    CROSS JOIN compliance_data cd
    CROSS JOIN document_data dd
    LEFT JOIN examination_data ed ON true
    GROUP BY pd.total_patients_count, cd.total_records, cd.compliant_count, dd.total_docs, dd.processed_docs, dd.pending_docs
  )
  SELECT * FROM metrics;
END;
$$;
