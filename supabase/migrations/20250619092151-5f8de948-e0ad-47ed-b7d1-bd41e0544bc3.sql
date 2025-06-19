
-- Drop existing views first to avoid column name conflicts
DROP VIEW IF EXISTS v_test_results_summary CASCADE;
DROP VIEW IF EXISTS v_company_health_benchmarks CASCADE;
DROP VIEW IF EXISTS v_risk_assessment_matrix_refined CASCADE;
DROP VIEW IF EXISTS v_monthly_test_trends CASCADE;
DROP VIEW IF EXISTS v_executive_summary_refined CASCADE;
DROP VIEW IF EXISTS v_patient_test_history CASCADE;

-- ===============================================
-- ENHANCED OCCUPATIONAL HEALTH ANALYTICS VIEWS
-- ===============================================

-- View 1: Comprehensive Test Results Summary
CREATE VIEW v_test_results_summary AS
SELECT 
  mtr.test_type,
  COUNT(*) as total_tests,
  COUNT(CASE WHEN mtr.test_done = true THEN 1 END) as completed_tests,
  ROUND(COUNT(CASE WHEN mtr.test_done = true THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as completion_rate,
  COUNT(CASE WHEN mtr.test_result ~* '(abnormal|fail|unfit|poor|inadequate|below|impaired)' 
             AND mtr.test_done = true THEN 1 END) as abnormal_count,
  ROUND(COUNT(CASE WHEN mtr.test_result ~* '(abnormal|fail|unfit|poor|inadequate|below|impaired)' 
                   AND mtr.test_done = true THEN 1 END) * 100.0 / 
        NULLIF(COUNT(CASE WHEN mtr.test_done = true THEN 1 END), 0), 2) as abnormal_rate,
  MIN(me.examination_date) as earliest_test_date,
  MAX(me.examination_date) as latest_test_date,
  COUNT(DISTINCT me.patient_id) as unique_patients,
  me.organization_id,
  me.client_organization_id
FROM medical_test_results mtr
JOIN medical_examinations me ON mtr.examination_id = me.id
GROUP BY mtr.test_type, me.organization_id, me.client_organization_id;

-- View 2: Company Health Benchmarks
CREATE VIEW v_company_health_benchmarks AS
SELECT 
  COALESCE(me.company_name, 'Unknown Company') as company_name,
  me.client_organization_id,
  me.organization_id,
  COUNT(DISTINCT me.patient_id) as total_employees,
  COUNT(me.id) as total_examinations,
  COUNT(CASE WHEN me.fitness_status ~* '(fit|pass)' AND me.fitness_status !~* '(unfit|fail)' THEN 1 END) as fit_count,
  COUNT(CASE WHEN me.fitness_status ~* '(restriction|condition)' THEN 1 END) as fit_with_restrictions_count,
  COUNT(CASE WHEN me.fitness_status ~* '(unfit|fail)' THEN 1 END) as unfit_count,
  ROUND(COUNT(CASE WHEN me.fitness_status ~* '(fit|pass)' AND me.fitness_status !~* '(unfit|fail)' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(me.id), 0), 2) as fitness_rate,
  ROUND(AVG(CASE 
    WHEN me.expiry_date IS NOT NULL AND me.examination_date IS NOT NULL 
    THEN me.expiry_date - me.examination_date 
    ELSE NULL 
  END), 0) as avg_cert_duration_days,
  COUNT(CASE WHEN me.expiry_date <= CURRENT_DATE THEN 1 END) as expired_count,
  COUNT(CASE WHEN me.expiry_date <= CURRENT_DATE + INTERVAL '30 days' 
             AND me.expiry_date > CURRENT_DATE THEN 1 END) as expiring_soon_count,
  (SELECT COUNT(*) FROM medical_test_results mtr2 
   JOIN medical_examinations me2 ON mtr2.examination_id = me2.id 
   WHERE me2.company_name = me.company_name 
   AND me2.client_organization_id = me.client_organization_id
   AND mtr2.test_done = true) as total_completed_tests,
  (SELECT COUNT(*) FROM medical_test_results mtr2 
   JOIN medical_examinations me2 ON mtr2.examination_id = me2.id 
   WHERE me2.company_name = me.company_name 
   AND me2.client_organization_id = me.client_organization_id) as total_tests_ordered
FROM medical_examinations me
WHERE me.examination_date >= CURRENT_DATE - INTERVAL '24 months'
GROUP BY me.company_name, me.client_organization_id, me.organization_id
HAVING COUNT(me.id) > 0
ORDER BY fitness_rate DESC;

-- View 3: Advanced Risk Assessment Matrix (Fixed with subquery approach)
CREATE VIEW v_risk_assessment_matrix_refined AS
SELECT 
  test_type,
  company_name,
  job_title,
  test_result,
  risk_level,
  risk_explanation,
  test_count,
  organization_id,
  client_organization_id
FROM (
  SELECT 
    mtr.test_type,
    COALESCE(me.company_name, 'Unknown Company') as company_name,
    COALESCE(me.job_title, 'General Worker') as job_title,
    mtr.test_result,
    CASE 
      WHEN mtr.test_type IN ('far_near_vision', 'visual_acuity', 'night_vision') 
           AND mtr.test_result ~* '(20/40|20/50|6/12|6/15|inadequate|poor|fail)' THEN 'high'
      WHEN mtr.test_type IN ('color_vision', 'peripheral_vision') 
           AND mtr.test_result ~* '(abnormal|fail|inadequate)' THEN 'medium'
      WHEN mtr.test_type IN ('hearing', 'audiometry') 
           AND mtr.test_result ~* '(loss|impaired|inadequate|>25|>30)' THEN 'high'
      WHEN mtr.test_type = 'whisper_test' 
           AND mtr.test_result ~* '(fail|inadequate|poor)' THEN 'medium'
      WHEN mtr.test_type IN ('lung_function', 'spirometry') 
           AND mtr.test_result ~* '(abnormal|impaired|<80|poor|inadequate)' THEN 'high'
      WHEN mtr.test_type = 'chest_xray' 
           AND mtr.test_result ~* '(abnormal|shadow|opacity|nodule)' THEN 'high'
      WHEN mtr.test_type = 'drug_screen' 
           AND mtr.test_result !~* '(negative|normal|clear|pass)' THEN 'high'
      WHEN mtr.test_type IN ('heights', 'working_at_heights') 
           AND mtr.test_result ~* '(unfit|fail|inadequate|restriction)' THEN 'high'
      WHEN mtr.test_type IN ('bloods', 'blood_pressure') 
           AND mtr.test_result ~* '(high|elevated|abnormal|>140|>90)' THEN 'medium'
      WHEN mtr.test_result ~* '(abnormal|fail|unfit|poor|inadequate|impaired)' THEN 'high'
      WHEN mtr.test_result ~* '(borderline|marginal|caution)' THEN 'medium'
      ELSE 'low'
    END as risk_level,
    CASE 
      WHEN mtr.test_type IN ('far_near_vision', 'visual_acuity') 
           AND mtr.test_result ~* '(20/40|20/50)' THEN 'May require corrective lenses for certain tasks'
      WHEN mtr.test_type IN ('hearing', 'audiometry') 
           AND mtr.test_result ~* '(loss|impaired)' THEN 'Hearing protection mandatory in noisy environments'
      WHEN mtr.test_type = 'drug_screen' 
           AND mtr.test_result !~* '(negative|normal)' THEN 'Immediate review and policy enforcement required'
      WHEN mtr.test_type IN ('heights', 'working_at_heights') 
           AND mtr.test_result ~* '(unfit|fail)' THEN 'Not suitable for work at heights'
      WHEN mtr.test_type IN ('lung_function', 'spirometry') 
           AND mtr.test_result ~* '(abnormal|impaired)' THEN 'Avoid dust exposure, regular monitoring required'
      ELSE 'Standard occupational health guidelines apply'
    END as risk_explanation,
    COUNT(*) as test_count,
    me.organization_id,
    me.client_organization_id
  FROM medical_test_results mtr
  JOIN medical_examinations me ON mtr.examination_id = me.id
  WHERE mtr.test_done = true 
    AND me.examination_date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY mtr.test_type, me.company_name, me.job_title, mtr.test_result, me.organization_id, me.client_organization_id
) AS subquery
ORDER BY 
  CASE risk_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
  test_count DESC;

-- View 4: Monthly Test Trends
CREATE VIEW v_monthly_test_trends AS
SELECT 
  DATE_TRUNC('month', me.examination_date) as test_month,
  mtr.test_type,
  COUNT(*) as test_count,
  COUNT(CASE WHEN mtr.test_done = true THEN 1 END) as completed_count,
  ROUND(COUNT(CASE WHEN mtr.test_done = true THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as completion_rate,
  COUNT(CASE WHEN mtr.test_result ~* '(abnormal|fail|unfit|poor|inadequate|below|impaired)' 
             AND mtr.test_done = true THEN 1 END) as abnormal_count,
  ROUND(COUNT(CASE WHEN mtr.test_result ~* '(abnormal|fail|unfit|poor|inadequate|below|impaired)' 
                   AND mtr.test_done = true THEN 1 END) * 100.0 / 
        NULLIF(COUNT(CASE WHEN mtr.test_done = true THEN 1 END), 0), 2) as abnormal_rate,
  COUNT(DISTINCT me.patient_id) as unique_patients_tested,
  COUNT(DISTINCT me.company_name) as unique_companies,
  me.organization_id,
  me.client_organization_id
FROM medical_test_results mtr
JOIN medical_examinations me ON mtr.examination_id = me.id
WHERE me.examination_date >= CURRENT_DATE - INTERVAL '24 months'
GROUP BY DATE_TRUNC('month', me.examination_date), mtr.test_type, me.organization_id, me.client_organization_id
ORDER BY test_month DESC, mtr.test_type;

-- View 5: Executive Summary Dashboard
CREATE VIEW v_executive_summary_refined AS
SELECT 
  me.organization_id,
  me.client_organization_id,
  COUNT(DISTINCT me.patient_id) as total_patients,
  COUNT(DISTINCT me.company_name) as total_companies,
  COUNT(me.id) as total_examinations,
  MIN(me.examination_date) as earliest_examination,
  MAX(me.examination_date) as latest_examination,
  COUNT(CASE WHEN mtr.test_done = true THEN 1 END) as total_tests_completed,
  COUNT(mtr.id) as total_tests_conducted,
  ROUND(COUNT(CASE WHEN mtr.test_done = true THEN 1 END) * 100.0 / NULLIF(COUNT(mtr.id), 0), 2) as overall_completion_rate,
  COUNT(CASE WHEN mtr.test_type IN ('far_near_vision', 'visual_acuity', 'color_vision', 'peripheral_vision', 'night_vision') 
             AND mtr.test_done = true THEN 1 END) as vision_tests,
  COUNT(CASE WHEN mtr.test_type IN ('hearing', 'audiometry', 'whisper_test') 
             AND mtr.test_done = true THEN 1 END) as hearing_tests,
  COUNT(CASE WHEN mtr.test_type IN ('lung_function', 'spirometry', 'chest_xray') 
             AND mtr.test_done = true THEN 1 END) as lung_function_tests,
  COUNT(CASE WHEN mtr.test_type IN ('heights', 'working_at_heights') 
             AND mtr.test_done = true THEN 1 END) as heights_tests,
  COUNT(CASE WHEN mtr.test_type = 'drug_screen' 
             AND mtr.test_done = true THEN 1 END) as drug_screen_tests,
  COUNT(CASE WHEN mtr.test_result ~* '(abnormal|fail|unfit|poor|inadequate|below|impaired)' 
             AND mtr.test_done = true THEN 1 END) as high_risk_results,
  COUNT(CASE WHEN mtr.test_result ~* '(borderline|marginal|caution|mild)' 
             AND mtr.test_done = true THEN 1 END) as medium_risk_results,
  COUNT(CASE WHEN mtr.test_result ~* '(normal|pass|fit|adequate|good|excellent)' 
             AND mtr.test_done = true THEN 1 END) as low_risk_results,
  COUNT(CASE WHEN mtr.test_type IN ('far_near_vision', 'visual_acuity') 
             AND mtr.test_result ~* '(20/40|20/50|6/12|6/15|glasses|spectacles)' 
             AND mtr.test_done = true THEN 1 END) as workers_may_need_vision_correction,
  COUNT(CASE WHEN mtr.test_type IN ('hearing', 'audiometry') 
             AND mtr.test_result ~* '(loss|impaired|protection)' 
             AND mtr.test_done = true THEN 1 END) as workers_need_hearing_protection,
  COUNT(CASE WHEN mtr.test_type = 'drug_screen' 
             AND mtr.test_result !~* '(negative|normal|clear|pass)' 
             AND mtr.test_done = true THEN 1 END) as policy_violations,
  COUNT(CASE WHEN me.fitness_status ~* '(fit|pass)' AND me.fitness_status !~* '(unfit|fail)' THEN 1 END) as total_fit,
  CASE 
    WHEN COUNT(mtr.id) = 0 THEN 0
    ELSE GREATEST(0, LEAST(100, 
      100 - (COUNT(CASE WHEN mtr.test_result ~* '(abnormal|fail|unfit|poor|inadequate|below|impaired)' 
                        AND mtr.test_done = true THEN 1 END) * 100.0 / NULLIF(COUNT(CASE WHEN mtr.test_done = true THEN 1 END), 0))
    ))
  END::INTEGER as health_score
FROM medical_examinations me
LEFT JOIN medical_test_results mtr ON me.id = mtr.examination_id
WHERE me.examination_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY me.organization_id, me.client_organization_id;

-- View 6: Patient Test History for Detailed Analysis
CREATE VIEW v_patient_test_history AS
SELECT 
  p.id as patient_id,
  p.first_name || ' ' || p.last_name as patient_name,
  p.id_number,
  me.company_name,
  me.job_title,
  me.examination_date,
  me.expiry_date,
  me.fitness_status,
  CASE 
    WHEN me.expiry_date <= CURRENT_DATE THEN true
    ELSE false
  END as expired,
  CASE 
    WHEN me.expiry_date <= CURRENT_DATE + INTERVAL '30 days' 
         AND me.expiry_date > CURRENT_DATE THEN true
    ELSE false
  END as expiring_soon,
  mtr.test_type,
  mtr.test_done,
  mtr.test_result,
  mtr.notes,
  me.organization_id,
  me.client_organization_id
FROM patients p
JOIN medical_examinations me ON p.id = me.patient_id
LEFT JOIN medical_test_results mtr ON me.id = mtr.examination_id
WHERE me.examination_date >= CURRENT_DATE - INTERVAL '24 months'
ORDER BY p.last_name, p.first_name, me.examination_date DESC;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_medical_examinations_company_date ON medical_examinations(company_name, examination_date);
CREATE INDEX IF NOT EXISTS idx_medical_examinations_fitness_status ON medical_examinations(fitness_status);
CREATE INDEX IF NOT EXISTS idx_medical_examinations_expiry_date ON medical_examinations(expiry_date);
CREATE INDEX IF NOT EXISTS idx_medical_test_results_test_result ON medical_test_results(test_result);
