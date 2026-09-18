# Supabase Production Setup & Hardening Guide

This document specifies the exact procedure for configuring the production database and authentication layer for **InsureTrace India** on Supabase.

---

## 1. Schema Migration Deployment

1. Log in to the [Supabase Management Console](https://app.supabase.com) and create a project in the target region (`ap-south-1` Mumbai recommended for Indian regulatory data sovereignty).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run the schema migration script located at `database/schema.sql`.
4. Verify table creation:
   - `organizations`
   - `profiles`
   - `vehicles`
   - `ownership_history`
   - `policies`
   - `policy_addons`
   - `accidents`
   - `claims`
   - `service_events`
   - `repairs`
   - `repair_items`
   - `documents`
   - `ml_predictions`
   - `consents`
   - `audit_logs`
   - `ledger_references`

---

## 2. Row Level Security (RLS) Verification

Every table in InsureTrace has Row Level Security enabled. **Do NOT disable RLS under any circumstances in production.**

### Verification Queries
Run the following query in the SQL Editor to ensure all public tables have RLS enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```
Every row must display `rowsecurity = true`.

### Tenant Isolation Architecture
- **Policyholders**: Access only records matching `policyholder_id = auth.uid()` or vehicle ownership via `consents`.
- **Insurers**: Access records where `insurer_org_id = get_user_org_id()`.
- **Garages**: Access repairs and service events matching `garage_org_id = get_user_org_id()`.
- **Admins**: Access all records across organizations via `get_user_role() = 'ADMIN'`.

---

## 3. Auth Trigger & Profile Auto-Creation

When a user signs up via Supabase Auth (`auth.users`), the `handle_new_user()` trigger automatically provisions their profile in `public.profiles`:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'POLICYHOLDER'::user_role)
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Key Security & Secret Hygiene

### Secret Separation
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Client-side safe. Used by the Next.js frontend to initiate user sign-in and pass user session tokens. Enforces RLS strictly.
- **`SUPABASE_SERVICE_KEY`**: Highly privileged backend-only key. **NEVER** expose to the frontend repository, client bundle, or public Docker images.
- **`SUPABASE_JWT_SECRET`**: Used exclusively by the FastAPI backend to verify incoming JWT signatures.

---

## 5. Storage Bucket Configuration

Create the following storage buckets in Supabase Storage:
1. **`policy-documents`** (Private)
   - Permitted MIME types: `application/pdf`, `image/jpeg`, `image/png`
   - Max file size: 10 MB
   - RLS Policy: Only authenticated policyholders can upload; authorized insurers/surveyors can read if consent granted.
2. **`repair-estimates`** (Private)
   - Permitted MIME types: `application/pdf`, `image/jpeg`, `image/png`
   - Max file size: 15 MB
   - RLS Policy: Policyholders and authorized garages can upload.

---

## 6. Connection Pooling & Production Scaling

For high-concurrency production deployments (e.g., FastAPI running across multiple containers):
1. Use the **Transaction Pooler** (Port `6543`) provided by Supabase PgBouncer rather than direct session connections (`5432`).
2. Set `DATABASE_POOL_SIZE=20` and `DATABASE_MAX_OVERFLOW=10` in backend environment variables.
