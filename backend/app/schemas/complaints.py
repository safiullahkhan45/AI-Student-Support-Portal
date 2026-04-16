import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.db.models import ComplaintStatus


class ComplaintCreate(BaseModel):
    category: str
    description: str


class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    admin_note: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    student_id: uuid.UUID
    student_name: str = ""
    category: str
    description: str
    reference_number: str
    status: ComplaintStatus
    admin_note: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ComplaintTrackResponse(BaseModel):
    reference_number: str
    category: str
    status: ComplaintStatus
    admin_note: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
