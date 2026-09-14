# Phase 3 Implementation Plan: InsureTrace End-to-End Platform

## 1. Data Model & API Expansion
*   **Vehicles & Claims:** Expand API endpoints to natively support the vehicle lifecycle (create, fetch with history), claim workflow state transitions, and structured repair estimates.
*   **Document Management:** Build a lightweight Supabase storage abstraction in FastAPI to track metadata and checksums.
*   **Demo Seeder:** Create a deterministic Python script to populate the DB with realistic cross-organizational histories.

## 2. Hyperledger Fabric Network & Chaincode
*   **Network:** Utilize the official Fabric `test-network` (or a lightweight Docker-compose equivalent) modeling Insurer A, Insurer B, and Garage Org.
*   **Chaincode:** Write a `VehicleHistory` smart contract supporting transactions like `RecordPolicyIssued`, `RecordAccident`, `RecordClaimCreated`, and `RecordRepairCompleted`.
*   **FastAPI Integration:** Implement a `blockchain` service using the `fabric-gateway` Python SDK to submit/evaluate transactions dynamically on domain events.
*   **Tamper Demonstration:** Create an admin endpoint that intentionally alters a database hash, proving the `verify` route successfully detects the discrepancy against the immutable ledger.

## 3. Frontend Platform Polish
*   **Role Dashboards:** Build conditional dashboard views for Policyholder, Insurer, Garage, and Surveyor reusing shadcn components.
*   **Detail Pages:** Create `/vehicles/[id]` with a Framer Motion chronological lifecycle timeline and `/claims/[id]` mapping to the financial engine.
*   **Verification UI:** Build a `/verification` page demonstrating the cryptographically verified ledger state and tamper-evident mechanics.

## Execution Strategy
The work will be executed via subagents across Database/API, Blockchain, and Frontend tracks to maximize parallel development.
