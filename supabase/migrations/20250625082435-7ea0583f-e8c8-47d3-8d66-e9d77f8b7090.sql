
-- Create RPC function for examination analytics
CREATE OR REPLACE FUNCTION get_examination_analytics(org_id UUID)
RETURNS TABLE(
  pre_employment_count BIGINT,
  periodical_count BIGINT,
  exit_count BIGINT,
  fit_count BIGINT,
  fit_with_restriction_count BIGINT,
  fit_with_condition_count BIGINT,
  temporary_unfit_count BIGINT,
  unfit_count BIGINT,
  total_examinations BIGINT,
  this_month_examinations BIGINT,
  expiring_certificates BIGINT,
  total_patients BIGINT
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
  )
  SELECT 
    -- Examination types
    COUNT(CASE WHEN ed.examination_type ILIKE '%pre-employment%' 
               OR ed.examination_type ILIKE '%preemployment%' 
               OR ed.examination_type ILIKE '%pre employment%' THEN 1 END) as pre_employment_count,
    COUNT(CASE WHEN ed.examination_type ILIKE '%periodical%' 
               OR ed.examination_type ILIKE '%periodic%' 
               OR ed.examination_type ILIKE '%annual%' THEN 1 END) as periodical_count,
    COUNT(CASE WHEN ed.examination_type ILIKE '%exit%' 
               OR ed.examination_type ILIKE '%termination%' THEN 1 END) as exit_count,
    
    -- Fitness status
    COUNT(CASE WHEN ed.fitness_status = 'fit' 
               AND ed.fitness_status NOT ILIKE '%restriction%'
               AND ed.fitness_status NOT ILIKE '%condition%' THEN 1 END) as fit_count,
    COUNT(CASE WHEN ed.fitness_status ILIKE '%restriction%' THEN 1 END) as fit_with_restriction_count,
    COUNT(CASE WHEN ed.fitness_status ILIKE '%condition%' THEN 1 END) as fit_with_condition_count,
    COUNT(CASE WHEN ed.fitness_status ILIKE '%temporary%' 
               AND ed.fitness_status ILIKE '%unfit%' THEN 1 END) as temporary_unfit_count,
    COUNT(CASE WHEN ed.fitness_status = 'unfit' 
               AND ed.fitness_status NOT ILIKE '%temporary%' THEN 1 END) as unfit_count,
    
    -- Total examinations
    COUNT(ed.id) as total_examinations,
    
    -- This month examinations
    COUNT(CASE WHEN ed.examination_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month_examinations,
    
    -- Expiring certificates (next 30 days)
    COUNT(CASE WHEN ed.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_certificates,
    
    -- Total patients
    (SELECT total_patients_count FROM patient_data) as total_patients
    
  FROM examination_data ed, patient_data;
END;
$$;

-- Create RPC function for risk compliance analytics
CREATE OR REPLACE FUNCTION get_risk_compliance_analytics(org_id UUID)
RETURNS TABLE(
  high_risk_count BIGINT,
  medium_risk_count BIGINT,
  low_risk_count BIGINT,
  compliant_count BIGINT,
  non_compliant_count BIGINT,
  overdue_count BIGINT,
  expiring_in_30_days_count BIGINT,
  total_examinations BIGINT,
  total_with_restrictions BIGINT,
  restriction_types JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH examination_data AS (
    SELECT me.*, mtr.test_result
    FROM medical_examinations me
    INNER JOIN patients p ON me.patient_id = p.id
    LEFT JOIN medical_test_results mtr ON me.id = mtr.examination_id
    WHERE p.organization_id = org_id OR p.client_organization_id = org_id
  ),
  risk_analysis AS (
    SELECT 
      ed.*,
      CASE 
        WHEN ed.fitness_status ILIKE '%unfit%' 
             OR EXISTS (SELECT 1 FROM medical_test_results mtr2 
                       WHERE mtr2.examination_id = ed.id 
                       AND (mtr2.test_result ILIKE '%abnormal%' 
                            OR mtr2.test_result ILIKE '%fail%' 
                            OR mtr2.test_result ILIKE '%positive%')) THEN 'high'
        WHEN ed.fitness_status ILIKE '%restriction%' 
             OR ed.fitness_status ILIKE '%condition%' THEN 'medium'
        ELSE 'low'
      END as risk_level,
      CASE 
        WHEN ed.expiry_date IS NOT NULL AND ed.expiry_date > CURRENT_DATE THEN true
        ELSE false
      END as is_compliant
    FROM examination_data ed
  ),
  restriction_summary AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', unnested_restriction,
        'count', restriction_count
      )
    ) as restriction_types_json
    FROM (
      SELECT 
        INITCAP(TRIM(unnested_restriction)) as unnested_restriction,
        COUNT(*) as restriction_count
      FROM examination_data ed,
      unnest(ed.restrictions) as unnested_restriction
      WHERE ed.restrictions IS NOT NULL AND array_length(ed.restrictions, 1) > 0
      GROUP BY INITCAP(TRIM(unnested_restriction))
      ORDER BY COUNT(*) DESC
      LIMIT 5
    ) restriction_counts
  )
  SELECT 
    -- Risk levels
    COUNT(CASE WHEN ra.risk_level = 'high' THEN 1 END) as high_risk_count,
    COUNT(CASE WHEN ra.risk_level = 'medium' THEN 1 END) as medium_risk_count,
    COUNT(CASE WHEN ra.risk_level = 'low' THEN 1 END) as low_risk_count,
    
    -- Compliance
    COUNT(CASE WHEN ra.is_compliant = true THEN 1 END) as compliant_count,
    COUNT(CASE WHEN ra.is_compliant = false THEN 1 END) as non_compliant_count,
    COUNT(CASE WHEN ra.expiry_date IS NOT NULL AND ra.expiry_date < CURRENT_DATE THEN 1 END) as overdue_count,
    COUNT(CASE WHEN ra.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_in_30_days_count,
    
    -- Total examinations
    COUNT(DISTINCT ra.id) as total_examinations,
    
    -- Restrictions
    COUNT(CASE WHEN ra.restrictions IS NOT NULL AND array_length(ra.restrictions, 1) > 0 THEN 1 END) as total_with_restrictions,
    COALESCE((SELECT restriction_types_json FROM restriction_summary), '[]'::jsonb) as restriction_types
    
  FROM risk_analysis ra;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_examination_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_risk_compliance_analytics(UUID) TO authenticated;
