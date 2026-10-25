# Architecture

The interactive version of this page lives at **/system** on the website (diagram, request
walkthroughs, working diagrams, trade-offs). This file is the code map that goes with it.

## The parts

| Part | Runs on | Code |
|---|---|---|
| Web app (Next.js 16, React 19) | Visitor's browser, served by Vercel | `frontend/src/app`, `frontend/src/components` |
| Claim engine (TypeScript) | Visitor's browser | `frontend/src/lib/engine.ts` |
| Assistant (guide search, no LLM) | Visitor's browser | `frontend/src/lib/assistantEngine.ts`, `frontend/src/content/assistantKnowledge.ts` |
| API (FastAPI, Python 3.12) | Render, Docker, Singapore | `backend/main.py`, `backend/routers` |
| Claim engine (Python, reference copy) | API | `backend/services/financial_engine` |
| Document reader (pdfplumber + Tesseract OCR) | API | `backend/services/document_processing` |
| Database and sign-in | Supabase (Postgres, Auth) | `database/schema.sql`, `database/migrations` |
| Ledger gateway (Node.js, optional) | Any host the API can reach | `backend/blockchain/gateway` |
| Ledger (Hyperledger Fabric 2.5) | Local test network today | `backend/blockchain/chaincode` |

## Frontend map (`frontend/src`)

```
app/                     one folder per route (Next.js App Router)
  page.tsx               homepage
  decision/              claim check, document reading, sharing
  vehicles/              My cars and a vehicle's history
  org/                   fleet, workshop and review workspaces
  system/                the "How it works inside" page
  learn/                 the guide (generated from content/assistantKnowledge.ts)
components/
  claim-check/           the claim check flow, 3D car, result, repair-or-sell
  documents/             policy upload that fills forms in
  vehicle/               vehicle drawings, number plate, add-car flow
  system/                sections and diagrams of the System page
  home/, public/         homepage and public-page building blocks
  layout/, org/          app shell and organisation shell
content/                 text and facts shown on pages (guide, system page)
context/                 auth and vehicle state shared across pages
lib/
  engine.ts              the claim engine (kept identical to the Python one)
  claimCheck.ts          plain-language verdicts built on the engine
  repairOrSell.ts        repair vs sell vs total-loss comparison
  triage.ts, fleet.ts    fleet claim planning
  xray.ts                per-line repair-quote split
  bodyType.ts            body style from make/model, for the drawings
  api.ts                 the one way the app talks to the API
  storage.ts             every browser storage key in one place
```

## Backend map (`backend`)

```
main.py                  app setup: middleware, security headers, routers
config.py                all settings, checked at start-up
dependencies.py          who is calling: token checks, profile cache
routers/                 one file per API area (claims, vehicles, documents, ...)
services/
  access.py              who may see which vehicle or claim
  financial_engine/      the reference claim engine
  document_processing/   PDF text, OCR, and the field-finding rules
  fabric_*.py, blockchain_service.py   talking to the ledger
database/mock_store.py   in-memory demo data used when Supabase isn't configured
tests/                   pytest suite (ledger tests are opt-in: FABRIC_TESTS=1)
scripts/                 generators for the engine test cases and sample PDFs
```

## Rules the code keeps

- **ClearClaim never decides claims.** Results are estimates; the insurer and surveyor decide.
- **No invented data.** Sample data is labelled as sample; ledger states are never faked
  (development rows are marked `MOCK`); no AI scores are produced.
- **Access is checked on the server** for every request (`services/access.py`). Other people's
  records return "not found".
- **The two engines must agree.** `npm run test:engine` compares the TypeScript engine with 305
  cases generated from the Python engine (`backend/scripts/make_engine_golden.py`).
