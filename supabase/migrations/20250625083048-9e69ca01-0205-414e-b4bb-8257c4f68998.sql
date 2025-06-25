
-- Create RPC function for optimized analytics (used in BasicOverviewTab)
CREATE OR REPLACE FUNCTION get_optimized_analytics(org_id UUID)
RETURNS TABLE(
  total_patients BIGINT,
  total_companies BIGINT,
  total_examinations BIGINT,
  total_fit BIGINT,
  overall_completion_rate NUMERIC,
  health_score NUMERIC,
  low_risk_results BIGINT,
  medium_risk_results BIGINT,
  high_risk_results BIGINT,
  latest_examination DATE,
  earliest_examination DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH examination_data AS (
    SELECT me.*, p.id as patient_id
    FROM medical_examinations me
    INNER JOIN patients p ON me.patient_id = p.id
    WHERE p.organization_id = org_id OR p.client_organization_id = org_id
  ),
  patient_data AS (
    SELECT COUNT(DISTINCT p.id) as total_patients_count
    FROM patients p
    WHERE p.organization_id = org_id OR p.client_organization_id = org_id
  ),
  company_data AS (
    SELECT COUNT(DISTINCT COALESCE(p.organization_id, p.client_organization_id)) as total_companies_count
    FROM patients p
    WHERE p.organization_id = org_id OR p.client_organization_id = org_id
  ),
  risk_analysis AS (
    SELECT 
      ed.*,
      CASE 
        WHEN ed.fitness_status ILIKE '%unfit%' 
             OR EXISTS (SELECT 1 FROM medical_test_results mtr 
                       WHERE mtr.examination_id = ed.id 
                       AND (mtr.test_result ILIKE '%abnormal%' 
                            OR mtr.test_result ILIKE '%fail%' 
                            OR mtr.test_result ILIKE '%positive%')) THEN 'high'
        WHEN ed.fitness_status ILIKE '%restriction%' 
             OR ed.fitness_status ILIKE '%condition%' THEN 'medium'
        ELSE 'low'
      END as risk_level
    FROM examination_data ed
  )
  SELECT 
    -- Basic counts
    (SELECT total_patients_count FROM patient_data) as total_patients,
    (SELECT total_companies_count FROM company_data) as total_companies,
    COUNT(ed.id) as total_examinations,
    COUNT(CASE WHEN ed.fitness_status = 'fit' THEN 1 END) as total_fit,
    
    -- Completion rate
    CASE 
      WHEN (SELECT total_patients_count FROM patient_data) > 0 
      THEN (COUNT(ed.id)::NUMERIC / (SELECT total_patients_count FROM patient_data)::NUMERIC) * 100 
      ELSE 0 
    END as overall_completion_rate,
    
    -- Health score (based on fit percentage)
    CASE 
      WHEN COUNT(ed.id) > 0 
      THEN (COUNT(CASE WHEN ed.fitness_status = 'fit' THEN 1 END)::NUMERIC / COUNT(ed.id)::NUMERIC) * 100 
      ELSE 0 
    END as health_score,
    
    -- Risk levels
    COUNT(CASE WHEN ra.risk_level = 'low' THEN 1 END) as low_risk_results,
    COUNT(CASE WHEN ra.risk_level = 'medium' THEN 1 END) as medium_risk_results,
    COUNT(CASE WHEN ra.risk_level = 'high' THEN 1 END) as high_risk_results,
    
    -- Date ranges
    MAX(ed.examination_date) as latest_examination,
    MIN(ed.examination_date) as earliest_examination
    
  FROM examination_data ed
  CROSS JOIN patient_data
  CROSS JOIN company_data
  LEFT JOIN risk_analysis ra ON ed.id = ra.id;
END;
$$;

-- Create RPC function for dashboard metrics
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
  )
  SELECT 
    -- Total active employees
    (SELECT total_patients_count FROM patient_data) as total_active_employees,
    
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
    GREATEST(0, (SELECT total_patients_count FROM patient_data) - cd.total_records) as missing_records
    
  FROM examination_data ed
  CROSS JOIN compliance_data cd
  CROSS JOIN document_data dd;
END;
$$;

-- Create RPC function for premium dashboard metrics
CREATE OR REPLACE FUNCTION get_premium_dashboard_metrics(org_id UUID)
RETURNS TABLE(
  health_intelligence_score INTEGER,
  active_risk_alerts BIGINT,
  departments_tracked BIGINT,
  prediction_accuracy INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH compliance_data AS (
    SELECT 
      COUNT(*) as total_compliance,
      COUNT(CASE WHEN cc.is_compliant = true THEN 1 END) as compliant_count
    FROM certificate_compliance cc
    WHERE cc.organization_id = org_id OR cc.client_organization_id = org_id
  ),
  test_results AS (
    SELECT 
      COUNT(*) as total_tests,
      COUNT(CASE WHEN mtr.test_result ILIKE '%abnormal%' 
                  OR mtr.test_result ILIKE '%fail%' THEN 1 END) as abnormal_tests
    FROM medical_test_results mtr
    INNER JOIN medical_examinations me ON mtr.examination_id = me.id
    INNER JOIN patients p ON me.patient_id = p.id
    WHERE p.organization_id = org_id OR p.client_organization_id = org_id
  ),
  risk_alerts AS (
    SELECT 
      COUNT(CASE WHEN cc.current_expiry_date < CURRENT_DATE THEN 1 END) as expired_certs,
      COUNT(CASE WHEN mtr.test_result ILIKE '%abnormal%' 
                  OR mtr.test_result ILIKE '%high risk%' THEN 1 END) as abnormal_recent_tests
    FROM certificate_compliance cc
    FULL OUTER JOIN medical_examinations me ON cc.patient_id = me.patient_id
    LEFT JOIN medical_test_results mtr ON me.id = mtr.examination_id
    WHERE (cc.organization_id = org_id OR cc.client_organization_id = org_id)
       OR (me.organization_id = org_id OR me.client_organization_id = org_id)
  ),
  departments AS (
    SELECT COUNT(DISTINCT me.job_title) as unique_job_titles
    FROM medical_examinations me
    INNER JOIN patients p ON me.patient_id = p.id
    WHERE (p.organization_id = org_id OR p.client_organization_id = org_id)
      AND me.job_title IS NOT NULL
  )
  SELECT 
    -- Health Intelligence Score (0-100 based on compliance and test health)
    LEAST(100, GREATEST(0, 
      ROUND(
        (CASE WHEN cd.total_compliance > 0 
         THEN (cd.compliant_count::NUMERIC / cd.total_compliance::NUMERIC) * 40 
         ELSE 40 END) +
        (CASE WHEN tr.total_tests > 0 
         THEN ((tr.total_tests - tr.abnormal_tests)::NUMERIC / tr.total_tests::NUMERIC) * 40 
         ELSE 40 END) +
        20 -- Base system health
      )::INTEGER
    )) as health_intelligence_score,
    
    -- Active Risk Alerts
    COALESCE(ra.expired_certs, 0) + COALESCE(ra.abnormal_recent_tests, 0) as active_risk_alerts,
    
    -- Departments Tracked
    COALESCE(d.unique_job_titles, 0) as departments_tracked,
    
    -- Prediction Accuracy (placeholder - to be implemented with ML)
    0 as prediction_accuracy
    
  FROM compliance_data cd
  CROSS JOIN test_results tr
  CROSS JOIN risk_alerts ra
  CROSS JOIN departments d;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_optimized_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_premium_dashboard_metrics(UUID) TO authenticated;
