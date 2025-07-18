-- Comprehensive Security Fix Migration - Part 3: Remaining Functions and Views

-- Fix remaining functions that need search_path
CREATE OR REPLACE FUNCTION public.create_first_organization(org_name text, org_type text, org_email text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  current_user_id uuid;
  existing_org_id uuid;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();

  -- Check if the user already has an organization
  SELECT organization_id INTO existing_org_id
  FROM public.organization_users
  WHERE user_id = current_user_id
  LIMIT 1;

  -- If the user is already associated with an organization, return that organization's ID
  IF existing_org_id IS NOT NULL THEN
    RETURN existing_org_id;
  END IF;

  -- Create a new organization
  INSERT INTO public.organizations (name, organization_type, contact_email)
  VALUES (org_name, org_type, org_email)
  RETURNING id INTO new_org_id;

  -- Associate the current user with the new organization with admin role
  -- Using ON CONFLICT DO NOTHING to handle possible race conditions
  INSERT INTO public.organization_users (organization_id, user_id, role)
  VALUES (new_org_id, current_user_id, 'admin')
  ON CONFLICT ON CONSTRAINT organization_users_organization_id_user_id_key
  DO NOTHING;

  -- Return the ID of the newly created organization
  RETURN new_org_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_user_to_organization(user_id uuid, org_id uuid, user_role text DEFAULT 'staff'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_id uuid;
BEGIN
  -- Ensure user exists in profiles table
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_id) THEN
    -- Get user details from auth.users
    INSERT INTO public.users (id, full_name)
    SELECT 
      u.id, 
      COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
    FROM 
      auth.users u
    WHERE 
      u.id = user_id
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Add to organization
  INSERT INTO public.organization_users (organization_id, user_id, role)
  VALUES (org_id, user_id, user_role)
  ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET role = user_role
  RETURNING id INTO inserted_id;
  
  RETURN inserted_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if a profile already exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    -- Insert a new profile record
    INSERT INTO public.users (id, full_name, avatar_url)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data->>'avatar_url'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_feature_enabled(flag_name text, org_id uuid DEFAULT NULL::uuid, user_id_param uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check user-specific flag first
  IF user_id_param IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.feature_flags 
      WHERE feature_flags.flag_name = is_feature_enabled.flag_name 
      AND feature_flags.user_id = user_id_param 
      AND is_enabled = true
    ) THEN
      RETURN true;
    END IF;
  END IF;
  
  -- Check organization-specific flag
  IF org_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.feature_flags 
      WHERE feature_flags.flag_name = is_feature_enabled.flag_name 
      AND feature_flags.organization_id = org_id 
      AND is_enabled = true
    ) THEN
      RETURN true;
    END IF;
  END IF;
  
  -- Check global flag
  RETURN COALESCE(
    (SELECT is_enabled FROM public.feature_flags 
     WHERE feature_flags.flag_name = is_feature_enabled.flag_name 
     AND organization_id IS NULL 
     AND user_id IS NULL),
    false
  );
END;
$$;

-- Fix task generation functions
CREATE OR REPLACE FUNCTION public.generate_compliance_tasks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_count integer := 0;
  compliance_record RECORD;
BEGIN
  -- Generate tasks for certificates expiring in 30 days
  FOR compliance_record IN 
    SELECT cc.*, p.first_name, p.last_name, o.name as org_name
    FROM certificate_compliance cc
    JOIN patients p ON cc.patient_id = p.id
    JOIN organizations o ON cc.organization_id = o.id
    WHERE cc.days_until_expiry BETWEEN 1 AND 30
    AND cc.is_compliant = false
    AND NOT EXISTS (
      SELECT 1 FROM work_queue wq 
      WHERE wq.related_entity_id = cc.patient_id 
      AND wq.type = 'certificate_renewal'
      AND wq.status = 'pending'
    )
  LOOP
    INSERT INTO work_queue (
      title,
      description,
      type,
      priority,
      organization_id,
      related_entity_id,
      related_entity_type,
      due_date,
      generated_from_analytics,
      risk_score,
      compliance_deadline
    ) VALUES (
      'Certificate Renewal Required: ' || compliance_record.first_name || ' ' || compliance_record.last_name,
      'Patient certificate expires in ' || compliance_record.days_until_expiry || ' days. Immediate action required.',
      'certificate_renewal',
      CASE 
        WHEN compliance_record.days_until_expiry <= 7 THEN 'urgent'
        WHEN compliance_record.days_until_expiry <= 14 THEN 'high'
        ELSE 'medium'
      END,
      compliance_record.organization_id,
      compliance_record.patient_id,
      'patient',
      compliance_record.current_expiry_date,
      true,
      CASE 
        WHEN compliance_record.days_until_expiry <= 7 THEN 'high'
        WHEN compliance_record.days_until_expiry <= 14 THEN 'medium'
        ELSE 'low'
      END,
      compliance_record.current_expiry_date
    );
    
    task_count := task_count + 1;
  END LOOP;
  
  RETURN task_count;
END;
$$;