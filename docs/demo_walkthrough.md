# InsureTrace India - End-to-End Platform Demonstration Walkthrough

This guide details how to execute and verify the complete **InsureTrace India** multi-role platform, from AI document ingestion and deterministic financial adjudication to genuine Hyperledger Fabric distributed ledger verification.

---

## 1. System Architecture & Live Services

| Component | Port | Technology | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | `3000` | Next.js 16 (Turbopack, Tailwind CSS) | Active |
| **Backend API** | `8000` | FastAPI, Python 3.13, Uvicorn | Active |
| **Blockchain REST Gateway** | `3001` | Node.js Express + Fabric CLI | Active |
| **Hyperledger Fabric Network** | `7050`, `7051`, `9051` | Fabric 2.5 (2 Peers, Raft Orderer, 3 CAs) | Active in Docker/WSL |
| **Smart Contract (Chaincode)** | N/A | `vehicle_1.0` (Node.js Contract API) | Committed on `mychannel` |
| **Database & Multi-Tenant Store** | N/A | PostgreSQL 15 / Supabase with RLS | Active |

---

## 2. Quick Start: Launching Services

### Terminal 1: Hyperledger Fabric Network (WSL 2 / Linux)
```bash
# In WSL 2 Ubuntu:
cd /mnt/c/Users/kansa/Documents/Personal/Projects/ClaimSure/backend/blockchain
./start_and_verify.sh
```
Verify peer and orderer containers:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Terminal 2: Node.js Fabric Gateway
```bash
cd backend/blockchain/gateway
npm start
# Gateway listens on http://localhost:3001
```

### Terminal 3: FastAPI Backend
```bash
cd backend
.\venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 4: Next.js Frontend
```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

---

## 3. End-to-End Walkthrough Flow

### Phase 1: Identity & Multi-Tenant Authentication (`/login`)
1. Open `http://localhost:3000/login`.
2. Inspect the **Role Selector Grid** featuring the 5 system personas:
   - **Policyholder** (Rahul Sharma - `user@example.com`)
   - **Insurer Underwriter** (Priya Patel - `claims@digit.com`)
   - **Independent Surveyor** (Amit Verma - `surveyor@irda-lic.in`)
   - **Authorized Garage** (Rajesh Auto Care - `garage@repair.com`)
   - **System Admin & Auditor** (System Administrator - `admin@insuretrace.in`)
3. Click **"Switch"** on **Policyholder**. The UI stores the authorized token and routes into the workspace.

---

### Phase 2: Claim vs Self-Pay Financial Engine (`/decision`)
1. In the Decision Engine, adjust:
   - **Estimated Repair Cost**: e.g., ₹45,000
   - **Zero Depreciation Add-on**: Enabled
   - **Current NCB**: 20% (or 35%)
2. Observe the deterministic breakdown:
   - Depreciation deductions by part material (Metal 10%, Rubber/Plastic 50%, Glass 0%)
   - Compulsory & voluntary deductibles applied
   - 3-Year Future NCB Loss calculated dynamically
   - Final recommendation: **FILE CLAIM** or **SELF-PAY** with transparent financial explanation.

---

### Phase 3: AI Document Extraction & Human Review (`/decision/extract`)
1. Navigate to `/decision/extract`.
2. Select a sample Indian motor policy PDF or garage estimate invoice.
3. The extraction engine executes open-source text/coordinate parsing (`pdfplumber` + regex pattern matching).
4. Review extracted fields with confidence scores and provenance bounds:
   - Policy Number, Insurer Name, IDV, Deductibles, Active Add-ons.
5. Edit any field to simulate human-in-the-loop verification, then click **"Approve & Save Policy"**.

---

### Phase 4: Vehicle Timeline & Provenance (`/vehicles/V-REAL-101`)
1. Navigate to `/vehicles/V-REAL-101`.
2. View the complete lifecycle history of the vehicle:
   - Registration & Initial Purchase
   - Active Insurance Policies
   - Accident Reports
   - Garage Invoices & Part Replacements
   - Blockchain Anchor Badges with transaction IDs.

---

### Phase 5: Privacy & DPDP Consent Management (`/decision/consent`)
1. Navigate to `/decision/consent`.
2. Review granted third-party access permissions (Insurer, Surveyor, Workshop).
3. Toggle consent states (Active vs Revoked).
4. Verify that revoked consent immediately restricts data visibility through RLS tenant isolation.

---

### Phase 6: Hyperledger Fabric Blockchain Verification & Tamper Audit (`/verification`)
This demonstrates cryptographic tamper-proofing across the distributed ledger.

1. Navigate to `http://localhost:3000/verification`.
2. Enter Claim ID: `CLM-999`.
3. Notice the **Network Mode**: Displays **`REAL_FABRIC`** (backed by the live Fabric peer network).
4. Click **"Verify Ledger Record"**:
   - The backend computes the canonical SHA-256 hash of the claim record.
   - The Node Gateway queries the Hyperledger Fabric chaincode (`VerifyEvent`).
   - The ledger state matches the database: Displays green **VERIFIED** badge with the genuine 64-character Fabric Transaction ID.
5. Click **"[DEMO] Maliciously Alter Database Cost"**:
   - The development admin endpoint simulates an internal database breach, modifying `estimated_repair_cost` from ₹45,000 to ₹999,999.
6. The system re-verifies against the blockchain:
   - The database hash has changed.
   - The blockchain ledger remains unaltered.
   - Displays red **INTEGRITY VERIFICATION FAILED** alert showing the exact hash mismatch.
7. Click **"Restore Database Record"**:
   - Reverts the database record back to ₹45,000.
   - Re-verification returns to green **VERIFIED**.

---

## 4. CLI Verification Commands

To independently confirm the real Fabric ledger without the UI:

### Query Chaincode State Directly in WSL:
```bash
cd /mnt/c/Users/kansa/Documents/Personal/Projects/ClaimSure/backend/blockchain/fabric-samples/test-network
export PATH="/mnt/c/Users/kansa/Documents/Personal/Projects/ClaimSure/backend/blockchain/bin:$PATH"
export FABRIC_CFG_PATH="/mnt/c/Users/kansa/Documents/Personal/Projects/ClaimSure/backend/blockchain/config"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

peer chaincode query -C mychannel -n vehicle -c '\''{"function":"VerifyEvent","Args":["V-REAL-101","2026-09-18T18:20:00Z","CLM-999"]}'\''
```

### Run Backend Automated Verification Tests:
```powershell
cd backend
.\venv\Scripts\pytest
# Output: 22 passed in ~8s
```
