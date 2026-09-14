-- InsureTrace India - Initial Database Schema
-- Focus: Multi-tenant Organizations, RBAC, Vehicle History, and Data Provenance

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
    rule_version VARCHAR(50), -- e.g. 'MOTOR_PRIVATE_CAR_2026_V1'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE policy_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
    addon_type VARCHAR(100) NOT NULL, -- e.g. 'ZERO_DEPRECIATION', 'ENGINE_PROTECT'
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
    -- Financial fields with provenance
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
    entity_id UUID NOT NULL, -- Polymorphic reference (Claim, Policy, etc.)
    entity_type VARCHAR(50) NOT NULL,
    document_type VARCHAR(100) NOT NULL, -- 'POLICY_PDF', 'RC', 'DAMAGE_PHOTO', 'ESTIMATE'
    storage_url TEXT NOT NULL,
    file_hash VARCHAR(256) NOT NULL, -- SHA-256 for blockchain reference
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. ML PREDICTIONS & DECISION INTELLIGENCE
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    model_version VARCHAR(100) NOT NULL,
    prediction_type VARCHAR(100) NOT NULL, -- 'ADMISSIBILITY', 'ANOMALY_RISK', 'SEVERITY'
    score NUMERIC(5, 4) NOT NULL, -- e.g., 0.8200 (82%)
    risk_level VARCHAR(20), -- 'LOW', 'MEDIUM', 'HIGH'
    explanation_json JSONB, -- SHAP values or feature attributions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. CONSENT & AUDIT
CREATE TABLE consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    requesting_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    granted_scopes JSONB NOT NULL, -- e.g., ["claims_history", "service_history"]
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
    event_type VARCHAR(100) NOT NULL, -- 'CLAIM_CREATED', 'SERVICE_LOGGED'
    entity_id UUID NOT NULL, -- Refers to the Claim/Service record
    entity_table VARCHAR(50) NOT NULL,
    local_data_hash VARCHAR(256) NOT NULL, -- The SHA-256 we sent to the chain
    blockchain_tx_id VARCHAR(256) NOT NULL, -- Fabric Transaction ID
    org_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all operational tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_events ENABLE ROW LEVEL SECURITY;

-- Minimum secure RLS foundation (Profiles can read their own organization data)
-- In a real Supabase setup, auth.uid() maps to profiles.id
CREATE POLICY \"Users can view their own profile\" ON profiles FOR SELECT USING (auth.uid() = id);

-- Organization data isolation: Users can only see data belonging to their organization
CREATE POLICY \"Users can view their organization\" ON organizations FOR SELECT USING (
    id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Policies: Only visible to the policyholder or the insurer organization
CREATE POLICY \"Policyholders can view own policies\" ON policies FOR SELECT USING (
    policyholder_id = auth.uid() OR
    insurer_org_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Claims: Visible to policyholder, the insurer, or surveyor assigned (simplified to org level for foundation)
CREATE POLICY \"Claim visibility isolation\" ON claims FOR SELECT USING (
    policy_id IN (
        SELECT id FROM policies WHERE policyholder_id = auth.uid() OR insurer_org_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    )
);

-- Service Events: Visible to the garage that created it, and the vehicle owner (via policies)
CREATE POLICY \"Service event visibility\" ON service_events FOR SELECT USING (
    garage_org_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) OR
    vehicle_id IN (
        SELECT vehicle_id FROM policies WHERE policyholder_id = auth.uid()
    )
);
