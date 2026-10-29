# Deployment

| Part | Host | Deploys from |
|---|---|---|
| Website (`frontend/`) | Vercel, https://insur-trace.vercel.app | every push to `main` |
| API (`backend/`) | Render, Docker, Singapore, https://verisure-api-ucca.onrender.com | every push to `main` |
| Database and sign-in | Supabase | SQL in `database/` |
| Ledger | Not connected in production (records wait as *pending*) | see [ledger.md](ledger.md) |

## API on Render

The service is described in `render.yaml` (Docker, health check `/health`). The image installs
Tesseract so scanned PDFs and photos can be read.

Settings (Render → Environment). Secrets are never committed.

| Variable | Purpose |
|---|---|
| `ENVIRONMENT=production` | Turns on the strict start-up checks below |
| `ALLOWED_ORIGINS` | Exactly the website origin(s), comma-separated. `*` is refused in production |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | The Supabase project. Leave both empty to run the in-memory demo sandbox |
| `ENABLE_DEMO_AUTH` | Allows the demo accounts. Demo tokens are always refused once a real Supabase project is connected in production |
| `FABRIC_MODE` | `auto` (default), `gateway`, `local_wsl` or `disabled` |
| `GATEWAY_URL`, `GATEWAY_API_KEY` | A reachable ledger gateway over `https://`. Leave empty until there is one |

If a push to `main` doesn't start a deploy (Render's link to the GitHub repository can stop firing),
use **Manual Deploy** on the service in the Render dashboard, or reconnect the repository in the
service's settings. Don't assume the API is current just because Vercel is: after a push, confirm it
with the checks below.

Checks after a deploy:

- `GET /health` returns `{"status":"healthy"}`
- `GET /ready` shows the data mode and ledger mode
- `GET /api/v1/system/status` shows every part honestly, including what is not connected

The free plan sleeps after about 15 idle minutes; the first request then takes 30 to 60 seconds,
and the website shows a waking-up message meanwhile. Demo-sandbox data lives in memory and resets
on restart.

## Website on Vercel

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | The API's URL, no trailing slash |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For real sign-in |
| `NEXT_PUBLIC_SITE_URL` | Optional; defaults to https://insur-trace.vercel.app (used for SEO links) |

`NEXT_PUBLIC_*` values are built into the site, so change them and then redeploy.

## Database on Supabase

Run `database/schema.sql`, then the files in `database/migrations` in order. All three are applied
to the live project:

1. `001_secure_signup_role.sql`: sign-up can never choose an insurer, surveyor or admin role
2. `002_align_schema_with_api.sql`: columns the API uses; demo organisations
3. `003_org_signup_and_premium.sql`: fleet and workshop sign-up; renewal premium per vehicle

## Running locally

```bash
# API (http://localhost:8000), demo sandbox, no ledger
cd backend
python -m venv venv && venv/Scripts/pip install -r requirements-dev.txt   # Windows
venv/Scripts/uvicorn main:app --reload

# Website (http://localhost:3000)
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `frontend/.env.local`. Reading photos needs
Tesseract on your machine; without it the API explains that only PDFs can be read.

## Tests

```bash
cd backend && venv/Scripts/python -m pytest          # API tests (ledger tests skipped)
cd frontend && npm run test:unit                     # engine parity, triage, body types, repair-or-sell
cd frontend && npm run lint && npx tsc --noEmit      # lint and types
```

To check the production image: `docker build -t clearclaim-api backend`.
