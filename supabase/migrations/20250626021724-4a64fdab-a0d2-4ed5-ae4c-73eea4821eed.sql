
-- Create a secure query execution function for natural language queries
CREATE OR REPLACE FUNCTION execute_secure_query(
  query_sql text,
  max_results integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_secure_query(text, integer) TO authenticated;
