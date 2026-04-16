import random
import string
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user, require_role
from app.db.models import Complaint, ComplaintStatus, Institution, User, UserRole
from app.db.session import get_db
from app.schemas.complaints import ComplaintCreate, ComplaintResponse, ComplaintTrackResponse, ComplaintUpdate

router = APIRouter(prefix="/complaints", tags=["complaints"])


def generate_reference_number(subdomain: str) -> str:
    """
    Generate unique reference number.
    Format: COMP-{first 4 chars of subdomain uppercase}-{6 random digits}
    Example: COMP-RIPH-847291
    """
    prefix = subdomain[:4].upper()
    digits = ''.join(random.choices(string.digits, k=6))
    return f"COMP-{prefix}-{digits}"


@router.post("", response_model=ComplaintResponse, status_code=201)
def create_complaint(
    body: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Get institution subdomain for reference number
    institution = db.get(Institution, current_user.tenant_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    # Generate unique reference number (retry if collision)
    for _ in range(5):
        ref = generate_reference_number(institution.subdomain)
        exists = db.query(Complaint).filter(Complaint.reference_number == ref).first()
        if not exists:
            break

    complaint = Complaint(
        id=uuid.uuid4(),
        tenant_id=current_user.tenant_id,
        student_id=current_user.id,
        category=body.category,
        description=body.description,
        reference_number=ref,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("/my", response_model=list[ComplaintResponse])
def my_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns all complaints submitted by the logged-in student."""
    return (
        db.query(Complaint)
        .filter(Complaint.student_id == current_user.id)
        .order_by(Complaint.created_at.desc())
        .all()
    )


@router.get("/track/{reference_number}", response_model=ComplaintTrackResponse)
def track_complaint(
    reference_number: str,
    db: Session = Depends(get_db),
):
    """Public endpoint — no auth required. Anyone with the reference number can track."""
    complaint = db.query(Complaint).filter(
        Complaint.reference_number == reference_number
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail=f"No complaint found with reference number '{reference_number}'"
        )
    return complaint


@router.get("", response_model=list[ComplaintResponse])
def list_complaints(
    status: Optional[ComplaintStatus] = None,
    category: Optional[str] = None,
    current_user: User = Depends(require_role(UserRole.admin, UserRole.super_admin)),
    db: Session = Depends(get_db),
):
    """Admin only — list all complaints for tenant with optional filters."""
    query = db.query(Complaint).options(joinedload(Complaint.student)).filter(
        Complaint.tenant_id == current_user.tenant_id
    )

    if status:
        query = query.filter(Complaint.status == status)
    if category:
        query = query.filter(Complaint.category == category)

    return query.order_by(Complaint.created_at.desc()).all()


@router.patch("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: uuid.UUID,
    body: ComplaintUpdate,
    current_user: User = Depends(require_role(UserRole.admin, UserRole.super_admin)),
    db: Session = Depends(get_db),
):
    """Admin updates complaint status and/or adds a note."""
    complaint = db.query(Complaint).options(joinedload(Complaint.student)).filter(
        Complaint.id == complaint_id,
        Complaint.tenant_id == current_user.tenant_id,
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if body.status is not None:
        complaint.status = body.status
    if body.admin_note is not None:
        complaint.admin_note = body.admin_note

    db.commit()
    db.refresh(complaint)
    return complaint
