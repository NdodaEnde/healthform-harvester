
-- Add INSERT policy for feature_flags table
-- Allow users to create organization-specific flags if they're admin of that organization
CREATE POLICY "Users can create organization-specific feature flags" 
  ON public.feature_flags 
  FOR INSERT 
  WITH CHECK (
    organization_id IS NOT NULL 
    AND organization_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Add UPDATE policy for feature_flags table
-- Allow users to update organization-specific flags they have admin access to
CREATE POLICY "Users can update organization-specific feature flags" 
  ON public.feature_flags 
  FOR UPDATE 
  USING (
    organization_id IS NOT NULL 
    AND organization_id IN (
      SELECT organization_id 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'superadmin')
    )
  );

-- Add policy to allow superadmins to manage global flags
CREATE POLICY "Superadmins can manage global feature flags" 
  ON public.feature_flags 
  FOR ALL 
  USING (
    organization_id IS NULL 
    AND EXISTS (
      SELECT 1 
      FROM public.organization_users 
      WHERE user_id = auth.uid() 
      AND role = 'superadmin'
    )
  );
