# The ledger

## What it does, and what it doesn't

When a claim check is saved, the API stores it in Postgres and computes a SHA-256 fingerprint of
the record. That fingerprint (never the record, never personal details) is written to a
Hyperledger Fabric ledger. Verifying a record later recomputes the fingerprint and compares it with
the ledger: a match means the record has not been edited since it was saved.

It does **not** prove that what the record describes happened, and it is not connected to any
insurer.

## Record states

| State | Meaning |
|---|---|
| `COMMITTED` | Fingerprint on the ledger, with a transaction ID |
| `PENDING` | Ledger unreachable; retry later with `POST /api/v1/claims/{id}/ledger/retry` |
| `FAILED` | Ledger rejected the transaction; can be retried the same way |
| `MOCK` network | Sample data in the demo sandbox; never shown as anchored |

Retrying is safe: a committed record is never anchored twice, and a record that changed since it
was saved is not anchored at all.

## How the API reaches the ledger

`backend/services/fabric_adapter.py` picks a mode from `FABRIC_MODE`:

- `gateway`: HTTPS calls to `backend/blockchain/gateway` (Node.js, Express, fabric-network),
  authenticated with `GATEWAY_API_KEY`
- `local_wsl`: the Fabric `peer` command line inside WSL, for development on Windows
- `disabled`: ledger off; records stay `PENDING`
- `auto`: gateway if configured, otherwise the local network if it answers, otherwise disabled

Chaincode (`backend/blockchain/chaincode/VehicleHistory.js`, JavaScript): `RecordEvent`,
`GetVehicleHistory`, `VerifyEvent`.

## Running the test network locally (WSL with Docker)

```bash
cd backend/blockchain
./install-fabric.sh        # downloads the Fabric binaries and samples (not committed)
./run_network.sh           # two peers, a Raft orderer and CAs, channel "mychannel"
./deploy_chaincode.sh      # installs the VehicleHistory chaincode as "vehicle"
./test_tx.sh               # one test transaction
```

Then run the API with `FABRIC_MODE=auto` and save a claim check: it should come back `COMMITTED`.
Live ledger tests: `FABRIC_TESTS=1 python -m pytest -m fabric`.

After WSL has been idle, the orderer needs a few seconds to elect a leader; the client retries,
and if it still can't write, the record is left `PENDING` for a later retry.

## Connecting a ledger to production

The hosted API can't reach a network inside your own machine. Run the peers and the gateway on a
server the API can reach (for example a small Linux VM, with the gateway behind HTTPS), then set
`GATEWAY_URL` (https only) and `GATEWAY_API_KEY` on Render. Keep wallets, certificates and keys
out of git; `.gitignore` already excludes them.
