from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="InsureTrace India API",
    description="Backend API for InsureTrace India - Motor Insurance Intelligence Platform",
    version="1.0.0"
)

# CORS setup for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to InsureTrace India API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Placeholder for Supabase Auth dependency
async def verify_user_token(token: str = "Bearer placeholder"):
    # TODO: Implement Supabase JWT validation using PyJWT and Supabase public key
    pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
