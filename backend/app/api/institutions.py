import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_role
from app.db.models import Institution, UserRole
from app.db.session import get_db
from app.schemas.institutions import InstitutionCreate, InstitutionResponse

router = APIRouter(prefix="/institutions", tags=["institutions"])


@router.post("", response_model=InstitutionResponse, status_code=status.HTTP_201_CREATED)
def create_institution(
    body: InstitutionCreate,
    db: Session = Depends(get_db),
    _=Depends(require_role(UserRole.super_admin)),
):
    existing = db.query(Institution).filter(Institution.subdomain == body.subdomain).first()
    if existing:
        raise HTTPException(status_code=409, detail="Subdomain already taken")

    institution = Institution(
        id=uuid.uuid4(),
        name=body.name,
        subdomain=body.subdomain,
        contact_email=body.contact_email,
        logo_url=body.logo_url,
    )
    db.add(institution)
    db.commit()
    db.refresh(institution)
    return institution


@router.get("", response_model=list[InstitutionResponse])
def list_institutions(
    db: Session = Depends(get_db),
    _=Depends(require_role(UserRole.super_admin)),
):
    return db.query(Institution).all()


@router.get("/{institution_id}", response_model=InstitutionResponse)
def get_institution(
    institution_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_role(UserRole.super_admin)),
):
    institution = db.get(Institution, institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    return institution
