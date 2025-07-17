-- Fix critical security issues for production launch (existing tables only)

-- Step 1: Create missing helper functions first (these are critical for existing policies)
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

-- Step 2: Enable RLS on existing tables that need it
-- Check which tables exist first and enable RLS only on existing ones

-- Enable RLS on profiles table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    -- Add basic profile policies
    CREATE POLICY "Users can view their own profile" ON profiles
      FOR SELECT USING (auth.uid() = id);
      
    CREATE POLICY "Users can update their own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Enable RLS on users table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    
    -- Add basic users policies
    CREATE POLICY "Users can view their own user record" ON users
      FOR SELECT USING (auth.uid() = id);
      
    CREATE POLICY "Users can update their own user record" ON users
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;