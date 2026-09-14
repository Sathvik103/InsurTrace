# InsureTrace India

An AI-powered, blockchain-backed motor-insurance intelligence and claim decision platform for India.

## Architecture

*   **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
*   **Backend:** FastAPI (Python), PyJWT
*   **Database:** Supabase (PostgreSQL)
*   **Blockchain:** Hyperledger Fabric (Local test-network for dev)

## Project Structure

*   `/frontend` - Next.js application
*   `/backend` - FastAPI application
*   `/database` - PostgreSQL schema and migrations

## Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd InsureTraceIndia
    ```

2.  **Environment Variables:**
    Copy `.env.example` to `.env` and fill in your Supabase credentials.

3.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Backend Setup:**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # Or .\venv\Scripts\activate on Windows
    pip install -r requirements.txt
    uvicorn main:app --reload
    ```
