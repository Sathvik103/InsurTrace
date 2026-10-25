# ClearClaim

**Know if a car insurance claim is worth it.** ClearClaim shows Indian car owners, fleets and
workshops what an insurer is likely to pay on a repair, what they will pay, and whether claiming
or paying directly costs less once the No-Claim Bonus is counted.

- Live site: https://insur-trace.vercel.app
- How it is built (interactive): https://insur-trace.vercel.app/system

ClearClaim is independent: it is not an insurer, it never files or decides claims, and every
figure it shows is an estimate from standard motor-insurance rules.

## What it does

| Feature | Where |
|---|---|
| Claim check: insurer's share, your cost, bonus loss and a verdict, with the working shown | `/decision` |
| Repair or sell: compares repairing, selling as it is, and a total-loss settlement | inside the claim result |
| 3D car to mark the damaged parts | claim check, damage step |
| Read a policy or estimate from a PDF or a photo (OCR), then check the values | `/decision/extract`, policy steps |
| Repair-quote X-ray: each line split into insurer and owner share | `/xray` |
| Fleet triage: the claim-or-pay plan with the lowest total cost across vehicles | `/org/fleet` |
| Workshop estimates customers can understand | `/org/workshop` |
| Sharing records with a workshop or insurer, time-limited and revocable | `/decision/consent` |
| Tamper-evident records: fingerprints on a Hyperledger Fabric ledger | `/verification` |
| Guide and assistant (no language model) | `/learn`, the Ask button |

## Repository

```
frontend/   Next.js 16 website and app (deployed on Vercel)
backend/    FastAPI API (deployed on Render), document reader, ledger client
  blockchain/   Fabric chaincode, gateway and local network scripts
database/   schema.sql and numbered migrations for Supabase
docs/       architecture.md, deployment.md, ledger.md
render.yaml Render blueprint for the API
```

Start with [docs/architecture.md](docs/architecture.md) for a map of the code.

## Run it locally

```bash
# API on http://localhost:8000 (in-memory demo data, no ledger)
cd backend
python -m venv venv
venv/Scripts/pip install -r requirements-dev.txt     # macOS/Linux: venv/bin/pip
venv/Scripts/uvicorn main:app --reload

# Website on http://localhost:3000
cd frontend
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
npm run dev
```

On the sign-in page choose **Explore with sample data** to try it without an account. Reading
photos needs [Tesseract](https://github.com/tesseract-ocr/tesseract) installed; PDFs work without it.
To run the ledger locally, see [docs/ledger.md](docs/ledger.md).

## Tests

```bash
cd backend && venv/Scripts/python -m pytest      # API: access rules, ledger states, uploads, OCR handling
cd frontend && npm run test:unit                 # engine parity (305 cases), triage, body types, repair-or-sell
cd frontend && npm run lint && npx tsc --noEmit
```

## Contact

Sathvik Kandukuri, [sathvikkandukuri202@gmail.com](mailto:sathvikkandukuri202@gmail.com)
