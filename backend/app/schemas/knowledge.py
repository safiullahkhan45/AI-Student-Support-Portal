import uuid
from datetime import datetime
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    filename: str
    mime_type: str
    chunk_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
