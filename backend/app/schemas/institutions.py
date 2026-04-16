import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


class InstitutionCreate(BaseModel):
    name: str
    subdomain: str
    contact_email: EmailStr
    logo_url: str | None = None


class InstitutionUpdate(BaseModel):
    name: str | None = None
    contact_email: EmailStr | None = None
    logo_url: str | None = None
    is_active: bool | None = None


class InstitutionResponse(BaseModel):
    id: uuid.UUID
    name: str
    subdomain: str
    contact_email: str
    logo_url: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
