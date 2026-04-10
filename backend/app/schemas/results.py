import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class ResultRecordResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    roll_number: str
    semester: str
    course_code: str
    course_name: str
    credit_hours: int
    grade: str
    grade_points: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class ResultLookupResponse(BaseModel):
    roll_number: str
    semester: str
    courses: list[ResultRecordResponse]
    gpa: float


class ImportSummary(BaseModel):
    imported: int
    skipped: int
    skipped_reasons: list[str] = []