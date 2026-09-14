from fastapi import FastAPI, Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import jwt
import os

app = FastAPI(
    title="InsureTrace India API",
    description="Backend API for InsureTrace India - Motor Insurance Intelligence Platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    jwt_secret = os.getenv("JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long")
    try:
        # Supabase signs JWTs with the project JWT secret
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"], options={"verify_aud": False})
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(allowed_roles: list[str]):
    def role_checker(user: dict = Depends(get_current_user)):
        # We will map Supabase auth.users to our profiles table to get org/role
        # For now, we enforce role presence logically
        user_role = user.get("user_metadata", {}).get("role") 
        if user_role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return user
    return role_checker

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/secure-data", dependencies=[Depends(require_role(["INSURER"]))])
async def secure_endpoint():
    return {"data": "This is protected insurer data"}
