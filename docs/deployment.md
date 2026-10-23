# Deploying VeriSure

VeriSure has three runtime parts. Each one is deployed separately.

| Part | Where it runs | Status |
|---|---|---|
| Next.js frontend | Vercel (`frontend/`) | Deployed at https://insur-trace.vercel.app |
| FastAPI backend | Render, from `render.yaml` (Docker, `backend/`) | You need to create it (steps below) |
| Hyperledger Fabric | Only on your machine (WSL2 + Docker) | A hosted API cannot reach it |
| Supabase (Postgres, Auth, Storage) | Managed | The project in `frontend/.env.local` does not currently resolve in DNS |

```
Browser ──HTTPS──▶ Vercel (Next.js)
   │
   └──HTTPS (NEXT_PUBLIC_API_URL)──▶ Render (FastAPI)
                                         ├──▶ Supabase (optional; otherwise demo sandbox)
                                         └──HTTPS + X-Gateway-Key──▶ Fabric gateway ──▶ peers / orderer
                                             (optional; otherwise ledger "not configured")
```

## What failed before

Before this change, saving a claim on the live site showed *"Failed to commit claim to ledger"*. Four things were wrong at once:

1. **The API URL was never set at build time.** `NEXT_PUBLIC_API_URL` was empty when Vercel built the app, so the build silently fell back to `http://localhost:8000`, which points at each visitor's own computer.
2. **The backend wasn't hosted anywhere.**
3. **The page sent a fixed demo token,** `dev-policyholder`. A production backend rejects it.
4. **The claim insert didn't match the database schema,** and the error came back without CORS headers. The browser therefore reported a generic network error instead of the real problem.

What happens now:

- If a production build has no API URL, the app shows **"Backend not configured"** instead of calling localhost.
- A claim is saved **independently** of the ledger. Its fingerprint shows one of these states:

  | State | Meaning |
  |---|---|
  | `COMMITTED` | Anchored on the ledger, with its transaction ID |
  | `PENDING` | The ledger can't be reached; the record can be retried later |
  | `FAILED` | The ledger rejected the record |

- **Retry anchoring** (`POST /api/v1/claims/{id}/ledger/retry`) can be repeated safely. It only resubmits the original fingerprint, and only if the record has not changed since then.

## 1. Backend on Render

1. In Render, choose **New → Blueprint** and select this repository. Render reads `render.yaml`, which defines the `verisure-api` service.
2. Set the secret environment variables in the dashboard. The blueprint marks them `sync: false`, so they are never committed:

   | Variable | Value |
   |---|---|
   | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET` | Leave all three **empty** to run the demo sandbox. Set all three to use a real Supabase project (see step 4). |
   | `GATEWAY_URL`, `GATEWAY_API_KEY` | Leave empty until a Fabric gateway is reachable over HTTPS (see step 3). |

3. Check that `ALLOWED_ORIGINS` contains exactly the frontend origin, `https://insur-trace.vercel.app`, and add any custom domain. The API refuses to start in production if this is `*` or empty.
4. Deploy. Then check:
   - `GET https://<service>.onrender.com/health` returns `{"status":"healthy"}`.
   - `GET /ready` reports `data_mode` and the ledger mode.
   - `GET /api/v1/system/status` gives the full honest status.

Things to know about the free plan:

- **The service sleeps after about 15 minutes idle.** The first request afterwards can take 30–60 seconds. The frontend waits up to 30–60 seconds and then explains that the server may be waking up.
- **Demo-sandbox data lives in memory** and resets when the service restarts or sleeps.

## 2. Frontend on Vercel

1. Go to **Project → Settings → Environment Variables** and set `NEXT_PUBLIC_API_URL=https://<service>.onrender.com` for the Production environment. Do not add a trailing slash.
2. **Redeploy.** `NEXT_PUBLIC_*` values are baked in at build time, so changing the variable does nothing until the next build.
3. Open the site:
   - The homepage badge should read *Integrity ledger offline* (expected until step 3) rather than *System status unavailable*.
   - On **Claim Decision**, the calculation should load, and **Save claim record** should report the claim as saved with anchoring *pending*.

## 3. Connecting a ledger (optional)

A hosted API cannot reach Fabric on `localhost` inside your WSL machine. To connect a ledger, run the peers **and** `backend/blockchain/gateway` on a host the API can reach over HTTPS. Either of these works:

- A small Linux VM (for example Oracle Cloud's free ARM tier) running the Fabric test network, with the gateway behind a TLS reverse proxy.
- For demos only: your PC, exposed with a tunnel (for example Cloudflare Tunnel) pointing at the gateway port. It only works while your PC, WSL and Docker are running.

Set up the gateway:

- On the gateway host, set `GATEWAY_API_KEY`, which you can generate with `openssl rand -hex 32`.
- Set `FABRIC_RUNNER=native` (or `wsl` on Windows).
- Set `FABRIC_BASE_DIR`.

Then on Render, set:

- `GATEWAY_URL=https://<gateway-host>` (production requires `https://`)
- `GATEWAY_API_KEY=<same secret>`

The status page will then report the ledger as `gateway` / `CONNECTED`. Pending claims can be anchored with **Retry anchoring**.

Never commit wallets, crypto material, connection profiles or the gateway key. `.gitignore` already excludes `*.pem`, `*.key`, `wallet/`, `crypto-config/` and `connection-profile.json`.

## 4. Supabase (optional, for real accounts)

The Supabase URL configured in `frontend/.env.local` (`mwcpavdontwsjvmeeexw.supabase.co`) currently **does not resolve in DNS**. The project is probably paused or deleted, so real sign-in cannot work until it is restored or replaced.

To set it up:

1. Restore the project, or create a new one, in the Supabase dashboard.
2. Apply `database/schema.sql`. **Known gap:** the API currently uses a richer data model than `schema.sql`. For example, it uses `claims.vehicle_id`, `policies.idv` and the `PENDING_SURVEY` status. Reconciling the schema with the API is tracked as follow-up work. Until it's done, keep Render on the demo sandbox.
3. Set `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` and `SUPABASE_JWT_SECRET` on Render. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` on Vercel, then redeploy.

When the API is connected to a real Supabase project in production, it **rejects demo tokens**, so demo personas cannot reach real user data.

## Local development

- **Backend:** run `uvicorn main:app --reload` in `backend/`. It uses the demo sandbox. With `FABRIC_MODE=auto` it uses the local Fabric network through the peer CLI.
- **WSL idling:** WSL shuts down when idle, and the Fabric containers restart on the next `wsl` call. Right after such a restart the orderer needs a few seconds to elect a Raft leader. The client retries for this, and if the leader is still missing the claim is left `PENDING` so it can be retried.
- **Tests:**
  - `python -m pytest` runs the suite with the ledger disabled.
  - `FABRIC_TESTS=1 python -m pytest -m fabric` runs the live ledger tests.
- **Docker image check:** `docker build -t verisure-api backend && docker run -e ENVIRONMENT=production -e ALLOWED_ORIGINS=http://localhost:3000 -p 8000:8000 verisure-api`
