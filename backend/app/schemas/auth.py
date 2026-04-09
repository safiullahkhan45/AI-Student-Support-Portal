import uuid
from pydantic import BaseModel, EmailStr
from app.db.models import UserRole


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    tenant_id: uuid.UUID
    roll_number: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    tenant_id: uuid.UUID


class UserResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    email: str
    full_name: str
    role: UserRole
    roll_number: str | None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
