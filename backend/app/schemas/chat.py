import uuid
from datetime import datetime
from pydantic import BaseModel


class SessionResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionSummaryResponse(BaseModel):
    id: uuid.UUID
    title: str
    created_at: datetime


class SendMessageRequest(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
