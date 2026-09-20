# InsureTrace India

> **Enterprise Motor Insurance Intelligence & Distributed Ledger Verification Platform**  
> Built for the Indian motor insurance ecosystem in compliance with IRDAI regulatory guidelines and the Digital Personal Data Protection (DPDP) Act.

---

## 📌 Executive Overview

InsureTrace India is an end-to-end insurance intelligence platform designed to eliminate information asymmetry, fraudulent claims, and predatory repair estimates in the Indian automotive market.

By integrating **deterministic financial modeling**, **AI-assisted document parsing**, **multi-tenant Row Level Security (RLS)**, and an immutable **Hyperledger Fabric distributed ledger**, InsureTrace provides:
1. **Intelligent Claim vs Self-Pay Decision Engine**: Instant mathematical evaluation of repair costs vs. depreciation by part material, compulsory deductibles, and 3-year projected No Claim Bonus (NCB) loss.
2. **AI Document Ingestion with Human Review**: Transparent extraction of policy schedules and workshop repair estimates with bounding boxes and field-level confidence scores.
3. **Consortium Ledger Verification**: Dual-peer Hyperledger Fabric blockchain with Raft consensus, securing vehicle accident and claim history against unauthorized internal or external alterations.
4. **Regulatory Consent Architecture**: DPDP-compliant consent controls giving policyholders granular authority over data shared with workshops, insurers, and independent surveyors.

---

## 🏛️ System Architecture

```
+---------------------------------------------------------------------------------+
|                                Next.js 16 Web UI                                |
|  - Role Selector (/login)              - Financial Decision Engine (/decision)  |
|  - Document Extraction Review          - Vehicle Provenance (/vehicles/:id)     |
|  - Multi-Tenant Portals                - Ledger Verification (/verification)    |
+----------------------------------------+----------------------------------------+
                                         | HTTP / JSON REST
+----------------------------------------v----------------------------------------+
|                               FastAPI Backend (Python)                          |
|  - Financial Engine (IRDAI Rules)      - Document Parser (pdfplumber, regex)    |
|  - Multi-Tenant Auth & RBAC            - Canonical SHA-256 State Hashing        |
|  - Blockchain Service Bridge           - DPDP Consent Enforcement               |
+--------------------+-----------------------------------+------------------------+
                     |                                   | HTTP / gRPC
+--------------------v-------------------+       +-------v------------------------+
|      PostgreSQL / Supabase (RLS)       |       |  Node.js Fabric REST Gateway   |
|  - Multi-tenant tenant isolation       |       |  (Port 3001)                   |
|  - Automatic Profile Auth Trigger      |       +---------------+----------------+
|  - Storage Buckets (Policies/Photos)   |                       |
|  - Audit Logs & Ledger References      |       +---------------v----------------+
+----------------------------------------+       |   Hyperledger Fabric Network   |
                                                 |  - Raft Orderer (7050)         |
                                                 |  - Peer0 Org1 (7051)           |
                                                 |  - Peer0 Org2 (9051)           |
                                                 |  - Chaincode: vehicle_1.0      |
                                                 +--------------------------------+
```

---

## 👥 Multi-Tenant Portals & RBAC Personas

InsureTrace enforces strict tenant isolation and role-based access control across 5 personas:

| Role | Default Demo Identity | Workspace Route | Capabilities |
| :--- | :--- | :--- | :--- |
| **Policyholder** | Rahul Sharma (Demo) (`demo-policyholder@insuretrace.in`) | `/decision` | Claim financial analysis, document upload, consent management, timeline view |
| **Insurer** | Demo Insurer Officer (`demo-insurer@insuretrace.in`) | `/dashboards/insurer` | Claims portfolio audit, loss ratio analysis, fraud detection, settlement review |
| **Surveyor** | Demo Motor Loss Assessor (`demo-surveyor@insuretrace.in`) | `/dashboards/surveyor` | Physical inspection reports, parts admissibility verification, survey signing |
| **Garage** | Demo Auto Workshop (`demo-garage@insuretrace.in`) | `/dashboards/garage` | Itemized repair estimates, labor rates, parts invoice uploads |
| **Admin & Auditor** | Demo System Admin (`demo-admin@insuretrace.in`) | `/verification` | Hyperledger Fabric network health, consensus monitoring, ledger tamper audit |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+
- Docker Desktop with WSL 2 (for Hyperledger Fabric)

### 1. Clone & Configure Environment
```bash
git clone <repository-url>
cd InsureTraceIndia

# Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Start Hyperledger Fabric Network (WSL 2)
```bash
cd backend/blockchain
./start_and_verify.sh
```

### 3. Start Blockchain REST Gateway
```bash
cd backend/blockchain/gateway
npm install
npm start
# Listens on http://localhost:3001
```

### 4. Start FastAPI Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/macOS
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Start Next.js Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000 in your browser
```

---

## 🧪 Verification & Automated Testing

### Backend Test Suite
The backend features an automated test suite verifying financial math, OCR extraction, RBAC access policies, and Fabric ledger queries:
```bash
cd backend
.\venv\Scripts\pytest
# Result: 22 passed in ~8s
```

### Frontend Type Safety & Production Build
```bash
cd frontend
npx tsc --noEmit
npm run build
# Result: Compiled successfully; 12 static/dynamic routes optimized
```

---

## 📚 Technical Documentation Index

- [Supabase Production Setup & Hardening Guide](docs/supabase_production_setup.md)
- [Fabric Deployment, Persistence & Disaster Recovery](docs/fabric_deployment_and_persistence.md)
- [Real-World Data Readiness & Source Matrix](docs/data_readiness_report.md)
- [End-to-End Demonstration Walkthrough](docs/demo_walkthrough.md)
