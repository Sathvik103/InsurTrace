-- 001: never trust client-supplied roles on sign-up.
-- Previously handle_new_user() read NEW.raw_user_meta_data->>'role', so any
-- visitor could register with {"role": "ADMIN"}. Apply in the Supabase SQL editor.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Self-service sign-ups are always policyholders. The role is never taken
  -- from client-supplied metadata (that would let anyone sign up as ADMIN);
  -- staff roles are assigned by an administrator.
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
    'POLICYHOLDER'::public.user_role
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Review accounts created before this fix:
-- SELECT id, email, role, created_at FROM public.profiles WHERE role <> 'POLICYHOLDER' ORDER BY created_at;
