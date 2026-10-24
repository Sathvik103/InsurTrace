-- 003: self-service organisation accounts (fleets, workshops) and per-vehicle
-- renewal premium. Idempotent. Apply after 002.
--
-- Security model: sign-up metadata may only choose between three low-privilege
-- account types. FLEET_OPERATOR and GARAGE accounts can see only vehicles they
-- register themselves or that an owner explicitly shares with them by consent,
-- so self-selecting them grants no access to anyone else's data. INSURER,
-- SURVEYOR and ADMIN are never self-assigned.

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS od_premium numeric(12,2);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  account_type text := upper(coalesce(NEW.raw_user_meta_data->>'account_type', 'POLICYHOLDER'));
  chosen public.user_role := 'POLICYHOLDER';
  org_id uuid := NULL;
  org_name text := nullif(trim(NEW.raw_user_meta_data->>'organization_name'), '');
BEGIN
  IF account_type IN ('FLEET_OPERATOR', 'GARAGE') THEN
    chosen := account_type::public.user_role;
    INSERT INTO public.organizations (name, org_type)
    VALUES (coalesce(org_name, split_part(NEW.email, '@', 1)), chosen)
    RETURNING id INTO org_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(nullif(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1)),
    chosen,
    org_id
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
