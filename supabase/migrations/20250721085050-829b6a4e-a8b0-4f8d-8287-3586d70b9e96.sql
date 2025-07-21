
-- Step 1: Fix Critical RLS Issues
-- Enable RLS on tables that have policies but disabled RLS

-- Check and enable RLS on documents table (critical for Edge Function)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Check and enable RLS on medical_examinations table
ALTER TABLE public.medical_examinations ENABLE ROW LEVEL SECURITY;

-- Check and enable RLS on patients table
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Check and enable RLS on certificates table
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Step 2: Create a service role policy for Edge Functions
-- This allows the Edge Function to operate with elevated privileges when needed

-- Create a function to check if the current user is the service role
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT current_setting('role') = 'service_role';
$$;

-- Add service role policies to critical tables
CREATE POLICY "Service role can manage documents" 
ON public.documents 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role can manage medical_examinations" 
ON public.medical_examinations 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role can manage patients" 
ON public.patients 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role can manage certificates" 
ON public.certificates 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Step 3: Temporarily disable JWT verification for document processing
-- This will be configured in the Edge Function config
-- (The JWT verification will be handled in the lov-code block)
