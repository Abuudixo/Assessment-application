from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
import hashlib
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Read secrets from environment in production. Change this before deploying.
SECRET_KEY = os.environ.get("MH_SECRET_KEY") or "dev-secret-change-me"
ALGORITHM = os.environ.get("MH_JWT_ALGORITHM", "HS256")
# Default access token lifetime: 60 minutes (short-lived)
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("MH_ACCESS_TOKEN_MINUTES", 60))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ.get("MH_REFRESH_TOKEN_DAYS", 7))


def get_password_hash(password: str) -> str:
    # bcrypt has a 72-byte input limit; truncate safely to avoid runtime errors
    if isinstance(password, str):
        pw_bytes = password.encode('utf-8')[:72]
        password = pw_bytes.decode('utf-8', errors='ignore')
    try:
        return pwd_context.hash(password)
    except Exception:
        # Fallback to SHA256-based hash for environments where bcrypt backend misbehaves
        digest = hashlib.sha256(password.encode('utf-8')).hexdigest()
        return f"sha256${digest}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if isinstance(plain_password, str):
        pw_bytes = plain_password.encode('utf-8')[:72]
        plain_password = pw_bytes.decode('utf-8', errors='ignore')
    try:
        if isinstance(hashed_password, str) and hashed_password.startswith("sha256$"):
            digest = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
            return hashed_password.split("$", 1)[1] == digest
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # As a last resort, if passlib fails, check sha256 fallback
        if isinstance(hashed_password, str) and hashed_password.startswith("sha256$"):
            digest = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
            return hashed_password.split("$", 1)[1] == digest
        return False


def create_access_token(data: dict, expires_delta: int | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + timedelta(minutes=expires_delta)
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
