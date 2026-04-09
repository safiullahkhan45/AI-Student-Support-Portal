import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import Institution, User
from app.db.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    # 1. Check institution exists
    institution = db.get(Institution, body.tenant_id)
    if not institution or not institution.is_active:
        raise HTTPException(status_code=404, detail="Institution not found")

    # 2. Check email uniqueness within tenant
    existing = db.query(User).filter(
        and_(User.email == body.email, User.tenant_id == body.tenant_id)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered for this institution")

    # 3. Hash password and create user
    user = User(
        id=uuid.uuid4(),
        tenant_id=body.tenant_id,
        full_name=body.full_name,
        email=body.email,
        password_hash=hash_password(body.password),
        roll_number=body.roll_number,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    # 1. Find user by email + tenant
    user = db.query(User).filter(
        and_(User.email == body.email, User.tenant_id == body.tenant_id)
    ).first()

    # 2. Verify password
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    # 3. Issue JWT with tenant_id + role baked in
    token = create_access_token({
        "sub": str(user.id),
        "tenant_id": str(user.tenant_id),
        "role": user.role.value,
    })
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
