-- Fix critical security issues for production launch

-- Step 1: Create missing helper functions first
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

-- Step 2: Enable RLS on all tables that don't have it
ALTER TABLE work_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessment_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orphaned_document_cleanup_log ENABLE ROW LEVEL SECURITY;

-- Step 3: Add basic RLS policies for tables missing them

-- Work queue policies
CREATE POLICY "Users can view work queue items in their organization" ON work_queue
  FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Admins can manage work queue items" ON work_queue
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Subscription tiers policies (read-only for all authenticated users)
CREATE POLICY "All users can view subscription tiers" ON subscription_tiers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Risk assessment matrix policies
CREATE POLICY "Users can view risk assessments in their organization" ON risk_assessment_matrix
  FOR SELECT USING (organization_id IN (SELECT get_user_organizations()));

CREATE POLICY "Admins can manage risk assessments" ON risk_assessment_matrix
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Organization settings policies
CREATE POLICY "Admins can manage organization settings" ON organization_settings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Orphaned document cleanup log policies (superadmin only)
CREATE POLICY "Superadmins can view cleanup logs" ON orphaned_document_cleanup_log
  FOR SELECT USING (is_superadmin());