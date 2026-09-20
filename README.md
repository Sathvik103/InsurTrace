# VeriSure

> **Insurance Intelligence & Verification**  
> Deterministic financial decision modeling, multi-party cryptographic audit trails on Hyperledger Fabric, and automated claim adjudication grounded in IRDAI regulatory guidelines and the Digital Personal Data Protection (DPDP) Act, 2023.

---

## Executive Overview

**VeriSure** is an enterprise InsurTech platform engineered to eliminate information asymmetry, fraudulent claims, and predatory repair estimates in the Indian automotive market.

By integrating **deterministic financial modeling**, **document intelligence**, **PostgreSQL Row-Level Security (RLS)**, and a dual-peer **Hyperledger Fabric distributed ledger**, VeriSure provides:

1. **Claim vs Self-Pay Decision Terminal**: Instant mathematical evaluation of repair costs vs. depreciation by part material, compulsory/voluntary deductibles, and 3-year projected No-Claim Bonus (NCB) loss.
2. **Document Intelligence & Provenance Audit**: Transparent extraction of policy schedules and workshop repair estimates with provenance markers (`EXTRACTED`, `MANUAL_CORRECTION`, `CONFIRMED`).
3. **Vehicle Intelligence Dossier**: A cryptographically verifiable vehicle lifecycle passport tracing policy issuance, workshop estimates, loss surveys, and settlements.
4. **Consortium Ledger Verification**: Dual-peer Hyperledger Fabric blockchain with Raft consensus, certifying state integrity and detecting database tampering instantly.
5. **DPDP 2023 Consent Controls**: Granular data sharing governance allowing policyholders to inspect, grant, and revoke workshop and insurer access privileges in real-time.

---

## System Architecture

```
+---------------------------------------------------------------------------------+
|                                Next.js 14 Web UI                                |
|  - Public Showcase (/, /about, /technology, /security, /contact)               |
|  - Financial Decision Engine (/decision)  - Document Extraction (/extract)     |
|  - Vehicle Dossier (/vehicles/:id)        - Ledger Verification (/verification)|
|  - Role Portals: Insurer (/insurer), Surveyor (/surveyor), Garage (/garage)    |
+----------------------------------------+----------------------------------------+
                                         | HTTP / REST
+----------------------------------------v----------------------------------------+
|                               FastAPI Backend (Python)                          |
|  - Financial Engine (IRDAI Rules)      - Document Parser (pdfplumber, regex)    |
|  - Multi-Tenant Auth & RBAC            - Canonical SHA-256 State Hashing        |
|  - Blockchain Service Bridge           - DPDP Consent Enforcement               |
+--------------------+-----------------------------------+------------------------+
                     |                                   | HTTP / gRPC
+--------------------v-------------------+       +-------v------------------------+
|      PostgreSQL / Supabase (RLS)       |       |  Node.js Fabric REST Gateway   |
|  - 16 Relational Tables with RLS       |       |  (Port 3001)                   |
|  - Automatic Profile Auth Trigger      |       +---------------+----------------+
|  - Storage Buckets (Policies/Photos)   |                       |
|  - Audit Logs & Ledger References      |       +---------------v----------------+
+----------------------------------------+       |   Hyperledger Fabric Network   |
                                                 |  - Raft Orderer (7050)         |
                                                 |  - Peer0 Org1 (7051)           |
                                                 |  - Peer0 Org2 (9051)           |
                                                 |  - Chaincode: VehicleHistory   |
                                                 +--------------------------------+
```

---

## Role Workspaces & RBAC Personas

VeriSure enforces strict tenant isolation and role-based access control across 5 distinct operational workspaces:

| Role | Default Demo Identity | Workspace Route | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Policyholder** | Rahul Sharma (`demo-policyholder@insuretrace.in`) | `/decision` | Claim financial analysis, document upload, consent management, timeline view |
| **Insurer** | Underwriting Officer (`demo-insurer@insuretrace.in`) | `/dashboards/insurer` | Claims queue audit, loss ratio analysis, fraud detection, settlement review |
| **Surveyor** | Motor Loss Assessor (`demo-surveyor@insuretrace.in`) | `/dashboards/surveyor` | Physical inspection reports, parts admissibility verification, photo hash sealing |
| **Garage** | Auto Workshop (`demo-garage@insuretrace.in`) | `/dashboards/garage` | Itemized repair estimates, labor operations, parts depreciation, GST 18% |
| **Admin & Auditor** | System Security Auditor (`demo-admin@insuretrace.in`) | `/verification` | Fabric network health, consensus monitoring, ledger tamper audit |

---

## Quick Start Guide

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+
- Docker Desktop with WSL 2 (for Hyperledger Fabric)

### 1. Clone & Configure Environment
```bash
git clone https://github.com/Sathvik103/InsurTrace.git
cd InsurTrace

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
# source venv/bin/activate  # Linux/macOS
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

## Verification & Automated Testing

### Backend Test Suite
```bash
cd backend
.\venv\Scripts\pytest
# Result: 25 passed in ~34s
```

### Frontend Type Safety & Production Build
```bash
cd frontend
npx tsc --noEmit
npm run build
# Result: Compiled successfully; 20 static/dynamic routes optimized
```

---

## Maintainer & Contact

- **Lead Engineer**: Sathvik Kandukuri
- **Contact Email**: [sathvikkandukuri202@gmail.com](mailto:sathvikkandukuri202@gmail.com)
- **Repository**: [https://github.com/Sathvik103/InsurTrace](https://github.com/Sathvik103/InsurTrace)
