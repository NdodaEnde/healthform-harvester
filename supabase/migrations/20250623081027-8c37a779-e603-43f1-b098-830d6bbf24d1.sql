
-- ============================================================================
-- RPC FUNCTIONS FOR BASIC ANALYTICS DATABASE SETUP
-- These functions can be called safely without transaction block issues
-- ============================================================================

-- 1. RPC Function to Create Basic Analytics View
CREATE OR REPLACE FUNCTION create_basic_analytics_view()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Drop existing view if it exists
  DROP VIEW IF EXISTS v_basic_analytics_summary;
  
  -- Create the optimized view for basic analytics
  CREATE VIEW v_basic_analytics_summary AS
  SELECT DISTINCT
    org_data.organization_id,
    org_data.client_organization_id,
    
    -- Core Metrics
    COUNT(DISTINCT p.id) as total_patients,
    COUNT(DISTINCT COALESCE(p.client_organization_id, p.organization_id)) as total_companies,
    COUNT(DISTINCT me.id) as total_examinations,
    COUNT(DISTINCT CASE WHEN me.fitness_status = 'fit' THEN p.id END) as total_fit,
    
    -- Completion Rate
    CASE 
      WHEN COUNT(DISTINCT p.id) > 0 
      THEN (COUNT(DISTINCT me.id)::float / COUNT(DISTINCT p.id)::float) * 100 
      ELSE 0 
    END as overall_completion_rate,
    
    -- Current Month Tests
    COUNT(DISTINCT CASE 
      WHEN me.examination_date >= date_trunc('month', CURRENT_DATE) 
      THEN me.id 
    END) as current_month_tests,
    
    -- Expiring Certificates (next 30 days)
    COUNT(DISTINCT CASE 
      WHEN me.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' 
      THEN me.id 
    END) as expiring_certificates,
    
    -- Additional useful metrics
    COUNT(DISTINCT CASE 
      WHEN me.examination_date >= CURRENT_DATE - INTERVAL '7 days' 
      THEN me.id 
    END) as recent_activity_count,
    
    -- Restricted workers
    COUNT(DISTINCT p.id) - COUNT(DISTINCT CASE WHEN me.fitness_status = 'fit' THEN p.id END) as total_restricted
    
  FROM (
    SELECT DISTINCT 
      organization_id,
      client_organization_id
    FROM patients 
    WHERE organization_id IS NOT NULL OR client_organization_id IS NOT NULL
  ) org_data
  LEFT JOIN patients p ON (
    p.organization_id = org_data.organization_id OR 
    p.client_organization_id = org_data.client_organization_id
  )
  LEFT JOIN medical_examinations me ON me.patient_id = p.id
  GROUP BY org_data.organization_id, org_data.client_organization_id;

  RETURN 'Basic analytics view created successfully';
END;
$$;

-- 2. RPC Function to Create Performance Indexes
CREATE OR REPLACE FUNCTION create_analytics_indexes()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  index_exists boolean;
BEGIN
  -- Check and create index on patients table
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_patients_org_ids'
  ) INTO index_exists;
  
  IF NOT index_exists THEN
    CREATE INDEX idx_patients_org_ids ON patients(organization_id, client_organization_id);
  END IF;

  -- Check and create index on medical_examinations for patient and date
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_medical_examinations_patient_date'
  ) INTO index_exists;
  
  IF NOT index_exists THEN
    CREATE INDEX idx_medical_examinations_patient_date ON medical_examinations(patient_id, examination_date);
  END IF;

  -- Check and create index on medical_examinations for patient and expiry
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_medical_examinations_patient_expiry'
  ) INTO index_exists;
  
  IF NOT index_exists THEN
    CREATE INDEX idx_medical_examinations_patient_expiry ON medical_examinations(patient_id, expiry_date);
  END IF;

  -- Check and create composite index for fitness status
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_medical_examinations_fitness_status'
  ) INTO index_exists;
  
  IF NOT index_exists THEN
    CREATE INDEX idx_medical_examinations_fitness_status ON medical_examinations(patient_id, fitness_status, expiry_date);
  END IF;

  RETURN 'Analytics indexes created successfully';
END;
$$;

-- 3. Main RPC Function to Get Basic Analytics Data
CREATE OR REPLACE FUNCTION get_basic_analytics(org_id TEXT)
RETURNS TABLE(
  total_patients BIGINT,
  total_companies BIGINT,
  total_examinations BIGINT,
  total_fit BIGINT,
  overall_completion_rate NUMERIC,
  current_month_tests BIGINT,
  expiring_certificates BIGINT,
  total_restricted BIGINT,
  recent_activity_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to use the view first, fallback to direct queries if view doesn't exist
  BEGIN
    RETURN QUERY 
    SELECT 
      v.total_patients,
      v.total_companies,
      v.total_examinations,
      v.total_fit,
      v.overall_completion_rate,
      v.current_month_tests,
      v.expiring_certificates,
      v.total_restricted,
      v.recent_activity_count
    FROM v_basic_analytics_summary v
    WHERE v.organization_id = org_id::uuid 
       OR v.client_organization_id = org_id::uuid;
    
  EXCEPTION WHEN undefined_table THEN
    -- Fallback to direct query if view doesn't exist
    RETURN QUERY
    SELECT 
      get_basic_analytics_fallback.total_patients,
      get_basic_analytics_fallback.total_companies,
      get_basic_analytics_fallback.total_examinations,
      get_basic_analytics_fallback.total_fit,
      get_basic_analytics_fallback.overall_completion_rate,
      get_basic_analytics_fallback.current_month_tests,
      get_basic_analytics_fallback.expiring_certificates,
      get_basic_analytics_fallback.total_restricted,
      get_basic_analytics_fallback.recent_activity_count
    FROM get_basic_analytics_fallback(org_id);
  END;
END;
$$;

-- 4. Fallback RPC Function for Direct Queries
CREATE OR REPLACE FUNCTION get_basic_analytics_fallback(org_id TEXT)
RETURNS TABLE(
  total_patients BIGINT,
  total_companies BIGINT,
  total_examinations BIGINT,
  total_fit BIGINT,
  overall_completion_rate NUMERIC,
  current_month_tests BIGINT,
  expiring_certificates BIGINT,
  total_restricted BIGINT,
  recent_activity_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  patient_count BIGINT;
  company_count BIGINT;
  exam_count BIGINT;
  fit_count BIGINT;
  completion_rate NUMERIC;
  monthly_tests BIGINT;
  expiring_certs BIGINT;
  restricted_count BIGINT;
  recent_activity BIGINT;
BEGIN
  -- Get total patients for organization
  SELECT COUNT(DISTINCT p.id)
  INTO patient_count
  FROM patients p
  WHERE p.organization_id = org_id::uuid 
     OR p.client_organization_id = org_id::uuid;

  -- Get unique companies count
  SELECT COUNT(DISTINCT COALESCE(p.organization_id, p.client_organization_id))
  INTO company_count
  FROM patients p
  WHERE p.organization_id = org_id::uuid 
     OR p.client_organization_id = org_id::uuid;

  -- Get total examinations
  SELECT COUNT(me.id)
  INTO exam_count
  FROM medical_examinations me
  INNER JOIN patients p ON me.patient_id = p.id
  WHERE p.organization_id = org_id::uuid 
     OR p.client_organization_id = org_id::uuid;

  -- Get fit workers count
  SELECT COUNT(DISTINCT me.patient_id)
  INTO fit_count
  FROM medical_examinations me
  INNER JOIN patients p ON me.patient_id = p.id
  WHERE (p.organization_id = org_id::uuid OR p.client_organization_id = org_id::uuid)
    AND me.fitness_status = 'fit'
    AND (me.expiry_date IS NULL OR me.expiry_date >= CURRENT_DATE);

  -- Calculate completion rate
  SELECT CASE 
    WHEN patient_count > 0 THEN (exam_count::NUMERIC / patient_count::NUMERIC) * 100 
    ELSE 0 
  END
  INTO completion_rate;

  -- Get current month tests
  SELECT COUNT(me.id)
  INTO monthly_tests
  FROM medical_examinations me
  INNER JOIN patients p ON me.patient_id = p.id
  WHERE (p.organization_id = org_id::uuid OR p.client_organization_id = org_id::uuid)
    AND me.examination_date >= DATE_TRUNC('month', CURRENT_DATE);

  -- Get expiring certificates (next 30 days)
  SELECT COUNT(me.id)
  INTO expiring_certs
  FROM medical_examinations me
  INNER JOIN patients p ON me.patient_id = p.id
  WHERE (p.organization_id = org_id::uuid OR p.client_organization_id = org_id::uuid)
    AND me.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';

  -- Calculate restricted workers
  restricted_count := patient_count - fit_count;

  -- Get recent activity (last 7 days)
  SELECT COUNT(me.id)
  INTO recent_activity
  FROM medical_examinations me
  INNER JOIN patients p ON me.patient_id = p.id
  WHERE (p.organization_id = org_id::uuid OR p.client_organization_id = org_id::uuid)
    AND me.examination_date >= CURRENT_DATE - INTERVAL '7 days';

  -- Return the results
  RETURN QUERY SELECT 
    patient_count,
    company_count,
    exam_count,
    fit_count,
    completion_rate,
    monthly_tests,
    expiring_certs,
    restricted_count,
    recent_activity;
END;
$$;

-- 5. RPC Function to Setup Complete Basic Analytics Infrastructure
CREATE OR REPLACE FUNCTION setup_basic_analytics()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  view_result text;
  index_result text;
BEGIN
  -- Create the analytics view
  SELECT create_basic_analytics_view() INTO view_result;
  
  -- Create the performance indexes
  SELECT create_analytics_indexes() INTO index_result;
  
  RETURN 'Basic analytics setup completed: ' || view_result || '; ' || index_result;
END;
$$;

-- 6. RPC Function to Check Analytics Health
CREATE OR REPLACE FUNCTION check_analytics_health()
RETURNS TABLE(
  component text,
  status text,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if view exists
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'v_basic_analytics_summary') THEN
    RETURN QUERY SELECT 'view'::text, 'healthy'::text, 'v_basic_analytics_summary exists'::text;
  ELSE
    RETURN QUERY SELECT 'view'::text, 'missing'::text, 'v_basic_analytics_summary not found'::text;
  END IF;
  
  -- Check indexes
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_patients_org_ids') THEN
    RETURN QUERY SELECT 'index_patients'::text, 'healthy'::text, 'Patient organization index exists'::text;
  ELSE
    RETURN QUERY SELECT 'index_patients'::text, 'missing'::text, 'Patient organization index missing'::text;
  END IF;
  
  -- Check if functions exist
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_basic_analytics') THEN
    RETURN QUERY SELECT 'function'::text, 'healthy'::text, 'get_basic_analytics function exists'::text;
  ELSE
    RETURN QUERY SELECT 'function'::text, 'missing'::text, 'get_basic_analytics function missing'::text;
  END IF;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION setup_basic_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_basic_analytics(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_analytics_health() TO authenticated;
GRANT EXECUTE ON FUNCTION create_basic_analytics_view() TO authenticated;
GRANT EXECUTE ON FUNCTION create_analytics_indexes() TO authenticated;

-- Grant select permissions on the view (will be created by the functions)
-- GRANT SELECT ON v_basic_analytics_summary TO authenticated;
