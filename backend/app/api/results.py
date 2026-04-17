import csv
import io
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.db.models import ResultRecord, User, UserRole
from app.db.session import get_db
from app.schemas.results import ImportSummary, ResultLookupResponse

router = APIRouter(prefix="/results", tags=["results"])


@router.post("/import", response_model=ImportSummary)
def import_results(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.super_admin)),
    db: Session = Depends(get_db),
):
    """
    Admin uploads CSV with columns:
    roll_number, semester, course_code, course_name, credit_hours, grade, grade_points
    """
    content = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))

    imported = 0
    skipped = 0
    skipped_reasons = []

    for i, row in enumerate(reader, start=2):
        roll_number = row.get("roll_number", "").strip()
        semester = row.get("semester", "").strip()
        course_code = row.get("course_code", "").strip()
        course_name = row.get("course_name", "").strip()

        if not roll_number or not semester or not course_code or not course_name:
            skipped += 1
            skipped_reasons.append(f"Row {i}: missing required fields")
            continue

        try:
            credit_hours = int(row.get("credit_hours", 3) or 3)
        except ValueError:
            credit_hours = 3

        try:
            grade_points = float(row.get("grade_points", 0) or 0)
        except ValueError:
            grade_points = 0.0

        grade = row.get("grade", "").strip() or "N/A"

        record = ResultRecord(
            id=uuid.uuid4(),
            tenant_id=current_user.tenant_id,
            roll_number=roll_number,
            semester=semester,
            course_code=course_code,
            course_name=course_name,
            credit_hours=credit_hours,
            grade=grade,
            grade_points=grade_points,
        )
        db.add(record)
        imported += 1

    db.commit()
    return ImportSummary(imported=imported, skipped=skipped, skipped_reasons=skipped_reasons)


@router.get("/my", response_model=list[ResultLookupResponse])
def get_my_results(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all results for the currently logged-in student, grouped by semester."""
    if not current_user.roll_number:
        return []
    records = (
        db.query(ResultRecord)
        .filter(
            ResultRecord.tenant_id == current_user.tenant_id,
            ResultRecord.roll_number == current_user.roll_number,
        )
        .order_by(ResultRecord.semester)
        .all()
    )
    # Group by semester
    semesters: dict = {}
    for r in records:
        semesters.setdefault(r.semester, []).append(r)

    result = []
    for semester, courses in semesters.items():
        total_points = sum(float(c.grade_points) * c.credit_hours for c in courses)
        total_hours = sum(c.credit_hours for c in courses)
        gpa = round(total_points / total_hours, 2) if total_hours > 0 else 0.0
        result.append(ResultLookupResponse(
            roll_number=current_user.roll_number,
            semester=semester,
            courses=courses,
            gpa=gpa,
        ))
    return result


@router.get("/lookup", response_model=ResultLookupResponse)
def lookup_results(
    roll_number: str,
    semester: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Look up all course results for a roll number + semester.
    Also calculates weighted GPA.
    """
    records = db.query(ResultRecord).filter(
        ResultRecord.tenant_id == current_user.tenant_id,
        ResultRecord.roll_number == roll_number,
        ResultRecord.semester == semester,
    ).all()

    if not records:
        raise HTTPException(
            status_code=404,
            detail=f"No results found for roll number '{roll_number}' in semester '{semester}'"
        )

    # Weighted GPA = sum(grade_points * credit_hours) / sum(credit_hours)
    total_points = sum(float(r.grade_points) * r.credit_hours for r in records)
    total_hours = sum(r.credit_hours for r in records)
    gpa = round(total_points / total_hours, 2) if total_hours > 0 else 0.0

    return ResultLookupResponse(
        roll_number=roll_number,
        semester=semester,
        courses=records,
        gpa=gpa,
    )