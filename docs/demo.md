# InsureTrace India - Demonstration Guide

This guide details how to demonstrate the End-to-End InsureTrace workflow, particularly focusing on the **Blockchain Integrity Verification** module.

## ⚠️ Current Blockchain Status: PARTIALLY IMPLEMENTED
Due to Windows WSL2/Docker integration constraints inside the development environment, the raw bash scripts required to start the official Hyperledger Fabric `test-network` cannot complete natively without manual Docker Desktop configuration. 

**What is actually running:**
- The Application (Next.js + FastAPI)
- The Database (Supabase PostgreSQL)
- The deterministic Financial Engine
- A dedicated **Fabric Node.js REST Gateway** (`backend/blockchain/gateway/server.js`) that safely isolates the gRPC dependencies. This gateway simulates the exact cryptographic state ledger that a real Fabric peer would hold, providing an identical developer API.
- The `VehicleHistory.js` smart contract source code is fully written and resides in `backend/blockchain/chaincode/`, ready for deployment to a raw Linux/Fabric cluster.

---

## 1. Starting the Application
You will need three terminal windows:

**Terminal 1: Frontend**
```bash
cd frontend
npm run dev
```

**Terminal 2: FastAPI Backend**
```bash
cd backend
.\venv\Scripts\activate
# Make sure .env variables are set
uvicorn main:app --reload
```

**Terminal 3: Blockchain Gateway (The Mocked Fabric Network)**
```bash
cd backend/blockchain/gateway
npm install
node server.js
```

---

## 2. End-to-End Demonstration Flow

### Step A: View the Vehicle Lifecycle
1. Open the UI at `http://localhost:3000/vehicles/V-10293` (Demo ID)
2. Observe the Chronological Timeline (Purchase -> Policy -> Accident -> Claim). Notice the green "Ledger Verified" badges indicating database events are matched to immutable hashes.

### Step B: Create a Claim & Commit to Blockchain
*Note: In the full frontend, this happens when submitting a claim. To test via API:*
1. Send a POST request to `http://localhost:8000/api/v1/claims/` with dummy claim data.
2. The FastAPI backend hashes the data strictly using `get_canonical_hash()` (sorted keys, no spaces).
3. The DB creates a `ledger_references` row with `sync_status = PENDING`.
4. It calls the Blockchain Gateway, which simulates the `putState` commit.
5. The DB updates `sync_status = COMMITTED`.

### Step C: The Tamper-Detection Demo
This proves the database cannot be silently altered.
1. Navigate to `http://localhost:3000/verification` in the browser.
2. Enter the Claim ID.
3. Click **"Verify Ledger"**. 
   - *Expected:* Green **VERIFIED** badge. Local Database Hash perfectly matches the Gateway's Immutable Hash.
4. Click **"[DEMO] Maliciously Tamper Database Record"**.
   - This hits an Admin-only endpoint (`/api/v1/admin/tamper-claim`) that alters the PostgreSQL `estimated_repair_cost` to `999999.99`.
5. The UI automatically re-verifies.
   - *Expected:* Red **INTEGRITY VERIFICATION FAILED** badge. The UI explicitly reveals the mismatch between the altered Database Hash and the protected Ledger Hash.
6. (Optional API) Hit `/api/v1/admin/restore-claim/{claim_id}` with the original cost to fix the database, then Verify again to see it return to **VERIFIED**.

---

## Technical Notes
- **Canonical Hashing:** We use Python's `json.dumps(..., separators=(',', ':'), sort_keys=True)` excluding transient fields like `updated_at`. This guarantees stable cross-language hashing.
- **Security:** The Tamper endpoint requires the `ADMIN` role embedded in the Supabase JWT. It is completely inaccessible to normal policyholders or garages.
