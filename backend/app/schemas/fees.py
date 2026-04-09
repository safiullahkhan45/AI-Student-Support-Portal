import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class FeeRecordResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    roll_number: str
    semester: str
    amount_due: Decimal
    amount_paid: Decimal
    due_date: Optional[date]
    challan_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ImportSummary(BaseModel):
    imported: int
    skipped: int
    skipped_reasons: list[str] = []
