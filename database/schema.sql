-- InsureTrace India - Database Schema with Full RLS
-- Focus: Multi-tenant Organizations, RBAC, Vehicle History, Data Provenance

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('POLICYHOLDER', 'INSURER', 'SURVEYOR', 'GARAGE', 'FLEET_OPERATOR', 'ADMIN');
CREATE TYPE data_source AS ENUM ('USER_INPUT', 'EXTRACTED_AI', 'COMPUTED_RULE', 'ML_PREDICTED', 'BLOCKCHAIN_SYNC');
CREATE TYPE claim_status AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SETTLED');

-- 2. ORGANIZATIONS & USERS
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    org_type user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- Maps to auth.users (Supabase Auth)
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    role user_role NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Helper functions for RLS (Security Definer to bypass RLS internally to prevent circular queries)
CREATE OR REPLACE FUNCTION public.get_user_org_id() RETURNS UUID 
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION public.get_user_role() RETURNS public.user_role 
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql;

-- 3. VEHICLES & OWNERSHIP
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    vin VARCHAR(100) UNIQUE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    manufacture_year INT NOT NULL,
    fuel_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ownership_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    owner_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. POLICIES
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_number VARCHAR(100) UNIQUE NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    insurer_org_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    policyholder_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    idv_amount NUMERIC(15, 2) NOT NULL,
    deductible_amount NUMERIC(10, 2) NOT NULL,
    ncb_percentage INT DEFAULT 0,
    rule_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE policy_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
    addon_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ACCIDENTS & CLAIMS
CREATE TABLE accidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE RESTRICT,
    accident_date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_number VARCHAR(100) UNIQUE NOT NULL,
    policy_id UUID REFERENCES policies(id) ON DELETE RESTRICT,
    accident_id UUID REFERENCES accidents(id) ON DELETE SET NULL,
    status claim_status DEFAULT 'DRAFT',
    estimated_repair_cost NUMERIC(15, 2),
    repair_cost_source data_source,
    calculated_payout NUMERIC(15, 2),
    payout_source data_source,
    calculation_rule_version VARCHAR(50),
    immediate_out_of_pocket NUMERIC(15, 2),
    future_ncb_impact NUMERIC(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. SERVICE & REPAIRS
CREATE TABLE service_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    garage_org_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    service_date DATE NOT NULL,
    odometer_reading INT NOT NULL,
    service_type VARCHAR(100),
    total_cost NUMERIC(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE repairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    garage_org_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    repair_start_date DATE,
    repair_end_date DATE,
    total_labor_cost NUMERIC(15, 2),
    total_parts_cost NUMERIC(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE repair_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_id UUID REFERENCES repairs(id) ON DELETE CASCADE,
    part_name VARCHAR(255) NOT NULL,
    part_category VARCHAR(100),
    quantity INT DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    is_replacement BOOLEAN DEFAULT true
);

-- 7. DOCUMENTS & AI EXTRACTION
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    storage_url TEXT NOT NULL,
    file_hash VARCHAR(256) NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. ML PREDICTIONS & DECISION INTELLIGENCE
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    model_version VARCHAR(100) NOT NULL,
    prediction_type VARCHAR(100) NOT NULL,
    score NUMERIC(5, 4) NOT NULL,
    risk_level VARCHAR(20),
    explanation_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. CONSENT & AUDIT
CREATE TABLE consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    requesting_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    granted_scopes JSONB NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. BLOCKCHAIN / LEDGER REFERENCES
CREATE TABLE ledger_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    entity_table VARCHAR(50) NOT NULL,
    local_data_hash VARCHAR(256) NOT NULL,
    blockchain_tx_id VARCHAR(256),
    org_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    sync_status VARCHAR(50) DEFAULT 'PENDING',
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ownership_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE accidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_references ENABLE ROW LEVEL SECURITY;

-- Admins get full access to everything
-- Helper macro conceptually: get_user_role() = 'ADMIN'

-- ORGANIZATIONS
CREATE POLICY "org_select" ON organizations FOR SELECT USING (id = get_user_org_id() OR get_user_role() = 'ADMIN');
CREATE POLICY "org_admin" ON organizations FOR ALL USING (get_user_role() = 'ADMIN');

-- PROFILES
CREATE POLICY "profile_select_self" ON profiles FOR SELECT USING (id = auth.uid() OR organization_id = get_user_org_id() OR get_user_role() = 'ADMIN');
CREATE POLICY "profile_update_self" ON profiles FOR UPDATE USING (id = auth.uid() OR get_user_role() = 'ADMIN');

-- VEHICLES
CREATE POLICY "vehicle_select" ON vehicles FOR SELECT USING (
    get_user_role() = 'ADMIN' OR
    id IN (SELECT vehicle_id FROM ownership_history WHERE owner_profile_id = auth.uid()) OR
    id IN (SELECT vehicle_id FROM policies WHERE policyholder_id = auth.uid() OR insurer_org_id = get_user_org_id()) OR
    id IN (SELECT vehicle_id FROM consents WHERE requesting_org_id = get_user_org_id() AND valid_until > CURRENT_TIMESTAMP)
);

-- OWNERSHIP HISTORY
CREATE POLICY "ownership_select" ON ownership_history FOR SELECT USING (
    owner_profile_id = auth.uid() OR get_user_role() = 'ADMIN'
);

-- POLICIES
CREATE POLICY "policy_select" ON policies FOR SELECT USING (
    policyholder_id = auth.uid() OR insurer_org_id = get_user_org_id() OR get_user_role() = 'ADMIN'
);
CREATE POLICY "policy_insert" ON policies FOR INSERT WITH CHECK (
    insurer_org_id = get_user_org_id() AND get_user_role() = 'INSURER'
);

-- POLICY ADDONS
CREATE POLICY "policy_addon_select" ON policy_addons FOR SELECT USING (
    policy_id IN (SELECT id FROM policies WHERE policyholder_id = auth.uid() OR insurer_org_id = get_user_org_id()) OR get_user_role() = 'ADMIN'
);

-- ACCIDENTS
CREATE POLICY "accident_select" ON accidents FOR SELECT USING (
    vehicle_id IN (SELECT vehicle_id FROM policies WHERE policyholder_id = auth.uid() OR insurer_org_id = get_user_org_id()) OR get_user_role() = 'ADMIN'
);

-- CLAIMS
CREATE POLICY "claim_select" ON claims FOR SELECT USING (
    policy_id IN (SELECT id FROM policies WHERE policyholder_id = auth.uid() OR insurer_org_id = get_user_org_id()) OR get_user_role() = 'ADMIN'
);
CREATE POLICY "claim_insert" ON claims FOR INSERT WITH CHECK (
    policy_id IN (SELECT id FROM policies WHERE policyholder_id = auth.uid() OR insurer_org_id = get_user_org_id())
);
CREATE POLICY "claim_update" ON claims FOR UPDATE USING (
    policy_id IN (SELECT id FROM policies WHERE policyholder_id = auth.uid() OR insurer_org_id = get_user_org_id())
);

-- SERVICE EVENTS
CREATE POLICY "service_select" ON service_events FOR SELECT USING (
    garage_org_id = get_user_org_id() OR
    vehicle_id IN (SELECT vehicle_id FROM policies WHERE policyholder_id = auth.uid()) OR
    get_user_role() = 'ADMIN'
);

-- REPAIRS & ITEMS
CREATE POLICY "repair_select" ON repairs FOR SELECT USING (
    garage_org_id = get_user_org_id() OR
    claim_id IN (SELECT id FROM claims WHERE policy_id IN (SELECT id FROM policies WHERE policyholder_id = auth.uid() OR insurer_org_id = get_user_org_id())) OR
    get_user_role() = 'ADMIN'
);
CREATE POLICY "repair_item_select" ON repair_items FOR SELECT USING (
    repair_id IN (SELECT id FROM repairs WHERE garage_org_id = get_user_org_id() OR claim_id IN (SELECT id FROM claims WHERE policy_id IN (SELECT id FROM policies WHERE policyholder_id = auth.uid() OR insurer_org_id = get_user_org_id()))) OR get_user_role() = 'ADMIN'
);

-- DOCUMENTS
CREATE POLICY "doc_select" ON documents FOR SELECT USING (
    uploaded_by = auth.uid() OR 
    (entity_type = 'CLAIM' AND entity_id IN (SELECT id FROM claims WHERE policy_id IN (SELECT id FROM policies WHERE policyholder_id = auth.uid() OR insurer_org_id = get_user_org_id()))) OR
    get_user_role() = 'ADMIN'
);

-- ML PREDICTIONS (Insurer only + Admin)
CREATE POLICY "ml_select" ON ml_predictions FOR SELECT USING (
    claim_id IN (SELECT id FROM claims WHERE policy_id IN (SELECT id FROM policies WHERE insurer_org_id = get_user_org_id())) OR get_user_role() = 'ADMIN'
);

-- CONSENTS
CREATE POLICY "consent_select" ON consents FOR SELECT USING (
    owner_profile_id = auth.uid() OR requesting_org_id = get_user_org_id() OR get_user_role() = 'ADMIN'
);

-- AUDIT LOGS
CREATE POLICY "audit_select" ON audit_logs FOR SELECT USING (
    org_id = get_user_org_id() OR get_user_role() = 'ADMIN'
);

-- LEDGER REFERENCES
CREATE POLICY "ledger_select" ON ledger_references FOR SELECT USING (
    org_id = get_user_org_id() OR get_user_role() = 'ADMIN'
);

-- ============================================================================
-- 12. PERFORMANCE INDEXES FOR PRODUCTION
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_claims_policy ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_policies_vehicle ON policies(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_policies_holder ON policies(policyholder_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_reg ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_ledger_entity ON ledger_references(entity_id);
CREATE INDEX IF NOT EXISTS idx_consents_vehicle ON consents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_consents_owner ON consents(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);

-- ============================================================================
-- 13. AUTH TRIGGER FOR AUTOMATIC PROFILE CREATION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  parsed_role public.user_role := 'POLICYHOLDER'::public.user_role;
  raw_role text;
BEGIN
  raw_role := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'POLICYHOLDER'));
  BEGIN
    parsed_role := raw_role::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    parsed_role := 'POLICYHOLDER'::public.user_role;
  END;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    parsed_role
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute on Supabase auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
