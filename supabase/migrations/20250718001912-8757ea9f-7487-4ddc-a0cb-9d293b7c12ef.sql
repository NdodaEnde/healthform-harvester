-- Comprehensive Security Fix Migration - Part 2: Function Search Paths and Security Definer Views

-- Step 1: Fix all function search paths (62 warnings)
-- Update all existing functions to have proper search_path = public

-- Fix helper functions search paths
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id 
  FROM organization_users 
  WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_users 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_users 
    WHERE user_id = auth.uid() 
    AND role = 'superadmin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('admin', 'superadmin')
  );
END;
$$;

-- Fix analytics functions search paths
CREATE OR REPLACE FUNCTION public.get_basic_analytics(org_id text)
RETURNS TABLE(total_patients bigint, total_companies bigint, total_examinations bigint, total_fit bigint, overall_completion_rate numeric, current_month_tests bigint, expiring_certificates bigint, total_restricted bigint, recent_activity_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix other critical functions
CREATE OR REPLACE FUNCTION public.execute_secure_query(query_sql text, max_results integer DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  query_result record;
  results jsonb[] := '{}';
  row_count integer := 0;
BEGIN
  -- Validate that the query is a SELECT statement
  IF NOT (query_sql ILIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Prevent certain dangerous operations
  IF query_sql ILIKE '%DROP%' OR query_sql ILIKE '%DELETE%' OR query_sql ILIKE '%UPDATE%' OR query_sql ILIKE '%INSERT%' THEN
    RAISE EXCEPTION 'Destructive operations are not allowed';
  END IF;
  
  -- Add LIMIT clause if not present
  IF NOT (query_sql ILIKE '%LIMIT%') THEN
    query_sql := query_sql || ' LIMIT ' || max_results::text;
  END IF;
  
  -- Execute the query dynamically
  FOR query_result IN EXECUTE query_sql LOOP
    results := array_append(results, to_jsonb(query_result));
    row_count := row_count + 1;
    
    -- Safety check to prevent runaway queries
    IF row_count >= max_results THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- Return results as JSON
  result := jsonb_build_object(
    'data', array_to_json(results),
    'row_count', row_count,
    'query_executed', query_sql
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Return error information
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'query_attempted', query_sql,
    'row_count', 0
  );
END;
$$;