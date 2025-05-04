
-- Function to ensure a user profile exists, even if there's an issue with the automatic creation
CREATE OR REPLACE FUNCTION public.ensure_profile_exists(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert profile if it doesn't exist
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    p_user_id,
    p_email,
    COALESCE(p_full_name, split_part(p_email, '@', 1)),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = now();
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error ensuring profile exists: %', SQLERRM;
  RETURN FALSE;
END;
$$;

-- Create a simpler function for creating user profiles
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  email TEXT,
  full_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert profile if it doesn't exist
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    user_id,
    email,
    COALESCE(full_name, split_part(email, '@', 1)),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = now();
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating user profile: %', SQLERRM;
  RETURN FALSE;
END;
$$;

-- Make sure the profiles table's foreign key constraint is deferred
-- This helps with race conditions during user creation
DO $$
BEGIN
  -- Drop the existing constraint if it exists
  BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
  EXCEPTION
    WHEN undefined_object THEN
      NULL;
  END;

  -- Add a new deferred constraint
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id)
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED;
    
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error modifying profiles table constraint: %', SQLERRM;
END
$$;

-- Update the handle_new_user trigger function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = now();
    
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't prevent the user from being created
  RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$;
