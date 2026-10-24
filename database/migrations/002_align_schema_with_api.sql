-- 002: align the Postgres schema with the data model the VeriSure API uses.
-- Idempotent: safe to run more than once. Apply after schema.sql.

-- Claim lifecycle status used by the API
ALTER TYPE claim_status ADD VALUE IF NOT EXISTS 'PENDING_SURVEY';

-- Organisations: the API reads `type`. (A generated column can't be used here:
-- enum-to-text casts are not immutable, so a trigger keeps it in sync.)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS type text;
UPDATE organizations SET type = org_type::text WHERE type IS DISTINCT FROM org_type::text;
CREATE OR REPLACE FUNCTION public.sync_organization_type() RETURNS trigger
SET search_path = public
AS $$
BEGIN
  NEW.type := NEW.org_type::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS organizations_sync_type ON organizations;
CREATE TRIGGER organizations_sync_type BEFORE INSERT OR UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION public.sync_organization_type();

-- Vehicles: owner-entered details and policy summary
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS variant varchar(100),
  ADD COLUMN IF NOT EXISTS usage_type varchar(50) DEFAULT 'PERSONAL',
  ADD COLUMN IF NOT EXISTS permit_info varchar(200),
  ADD COLUMN IF NOT EXISTS fitness_valid_until varchar(20),
  ADD COLUMN IF NOT EXISTS downtime_cost_per_day numeric(12,2),
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS idv numeric(15,2),
  ADD COLUMN IF NOT EXISTS ncb_percentage int,
  ADD COLUMN IF NOT EXISTS has_zero_dep boolean,
  ADD COLUMN IF NOT EXISTS policy_number varchar(100),
  ADD COLUMN IF NOT EXISTS policy_expiry varchar(20);

-- Policies: the API names the insurer FK `organization_id` and uses these fields
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policies' AND column_name = 'insurer_org_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'policies' AND column_name = 'organization_id') THEN
    ALTER TABLE policies RENAME COLUMN insurer_org_id TO organization_id;
  END IF;
END $$;
ALTER TABLE policies
  ADD COLUMN IF NOT EXISTS idv numeric(15,2),
  ADD COLUMN IF NOT EXISTS compulsory_deductible numeric(10,2),
  ADD COLUMN IF NOT EXISTS policy_type varchar(50) DEFAULT 'COMPREHENSIVE',
  ADD COLUMN IF NOT EXISTS zero_depreciation_addon boolean DEFAULT false;
ALTER TABLE policies ALTER COLUMN idv_amount DROP NOT NULL;
ALTER TABLE policies ALTER COLUMN deductible_amount DROP NOT NULL;

-- Claims: direct vehicle link, decision snapshot, author
ALTER TABLE claims
  ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES vehicles(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS recommendation varchar(20),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_claims_vehicle ON claims(vehicle_id);

-- Ledger references: sync diagnostics
ALTER TABLE ledger_references
  ADD COLUMN IF NOT EXISTS sync_status varchar(50) DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS network_mode varchar(30),
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_ledger_entity ON ledger_references(entity_id);

-- Documents: metadata the upload endpoint records
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS entity_table varchar(50),
  ADD COLUMN IF NOT EXISTS file_path text,
  ADD COLUMN IF NOT EXISTS original_filename varchar(120),
  ADD COLUMN IF NOT EXISTS mime_type varchar(100),
  ADD COLUMN IF NOT EXISTS file_size int,
  ADD COLUMN IF NOT EXISTS uploaded_by_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS extraction_status varchar(50),
  ADD COLUMN IF NOT EXISTS storage_status varchar(30);
ALTER TABLE documents ALTER COLUMN entity_type DROP NOT NULL;
ALTER TABLE documents ALTER COLUMN storage_url DROP NOT NULL;

-- Audit log: fields the API writes
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS entity_type varchar(100),
  ADD COLUMN IF NOT EXISTS entity_id text,
  ADD COLUMN IF NOT EXISTS performed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS details jsonb;
ALTER TABLE audit_logs ALTER COLUMN resource_type DROP NOT NULL;
ALTER TABLE audit_logs ALTER COLUMN resource_id DROP NOT NULL;

-- Consents: default scope = read the vehicle's history
ALTER TABLE consents ALTER COLUMN granted_scopes SET DEFAULT '["history:read"]'::jsonb;

-- ML predictions: no score is stored while models are data-limited
ALTER TABLE ml_predictions ALTER COLUMN score DROP NOT NULL;

-- Fictional demo organisations offered on the Data & privacy page
INSERT INTO organizations (id, name, org_type) VALUES
  ('00000000-0000-0000-0000-000000000003', 'Quality Auto Care Workshop (demo)', 'GARAGE'),
  ('00000000-0000-0000-0000-000000000004', 'Demo General Insurance Ltd', 'INSURER'),
  ('00000000-0000-0000-0000-000000000005', 'Demo Independent Assessors Guild', 'SURVEYOR')
ON CONFLICT (id) DO NOTHING;
