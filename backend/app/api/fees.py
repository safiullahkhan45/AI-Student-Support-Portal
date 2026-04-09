import csv
import io
import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.models import FeeRecord, User, UserRole
from app.db.session import get_db
from app.schemas.fees import FeeRecordResponse, ImportSummary

router = APIRouter(prefix="/fees", tags=["fees"])


@router.post("/import", response_model=ImportSummary)
def import_fees(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.super_admin)),
    db: Session = Depends(get_db),
):
    """
    Admin uploads a CSV file with columns:
    roll_number, semester, amount_due, amount_paid, due_date, challan_url

    - Skips rows missing roll_number or semester
    - Returns count of imported vs skipped rows
    """
    content = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))

    imported = 0
    skipped = 0
    skipped_reasons = []

    for i, row in enumerate(reader, start=2):  # start=2 because row 1 is header
        roll_number = row.get("roll_number", "").strip()
        semester = row.get("semester", "").strip()

        # Validate required fields
        if not roll_number or not semester:
            skipped += 1
            skipped_reasons.append(f"Row {i}: missing roll_number or semester")
            continue

        # Parse optional fields safely
        try:
            amount_due = float(row.get("amount_due", 0) or 0)
        except ValueError:
            amount_due = 0.0

        try:
            amount_paid = float(row.get("amount_paid", 0) or 0)
        except ValueError:
            amount_paid = 0.0

        due_date = None
        raw_date = row.get("due_date", "").strip()
        if raw_date:
            try:
                due_date = date.fromisoformat(raw_date)
            except ValueError:
                pass

        challan_url = row.get("challan_url", "").strip() or None

        fee = FeeRecord(
            id=uuid.uuid4(),
            tenant_id=current_user.tenant_id,
            roll_number=roll_number,
            semester=semester,
            amount_due=amount_due,
            amount_paid=amount_paid,
            due_date=due_date,
            challan_url=challan_url,
        )
        db.add(fee)
        imported += 1

    db.commit()

    return ImportSummary(imported=imported, skipped=skipped, skipped_reasons=skipped_reasons)


@router.get("/lookup", response_model=FeeRecordResponse)
def lookup_fee(
    roll_number: str,
    semester: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Look up fee record by roll_number + semester for the current tenant.
    Returns 404 if not found.
    """
    record = db.query(FeeRecord).filter(
        FeeRecord.tenant_id == current_user.tenant_id,
        FeeRecord.roll_number == roll_number,
        FeeRecord.semester == semester,
    ).first()

    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"No fee record found for roll number '{roll_number}' in semester '{semester}'"
        )

    return record
