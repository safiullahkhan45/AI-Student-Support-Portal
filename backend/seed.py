"""
Seed script — creates predictable test data.
Run: python seed.py
Re-running resets all seed data cleanly.
"""
import uuid
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import SessionLocal
from app.db.models import Institution, User, UserRole
from app.core.security import hash_password

# Fixed UUIDs so seed data is always predictable
INSTITUTION_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
SUPER_ADMIN_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
ADMIN_ID       = uuid.UUID("00000000-0000-0000-0000-000000000003")
STUDENT_ID     = uuid.UUID("00000000-0000-0000-0000-000000000004")


def seed():
    db = SessionLocal()
    try:
        # --- Delete ALL users belonging to the seed institution first ---
        db.query(User).filter(User.tenant_id == INSTITUTION_ID).delete()
        db.flush()

        # --- Institution ---
        institution = db.get(Institution, INSTITUTION_ID)
        if institution:
            db.delete(institution)
            db.flush()

        institution = Institution(
            id=INSTITUTION_ID,
            name="Riphah International University",
            subdomain="riphah",
            contact_email="admin@riphah.edu.pk",
        )
        db.add(institution)
        db.flush()

        # --- Super Admin (no tenant — platform level) ---
        # Super admin belongs to the seed institution for simplicity
        for uid in [SUPER_ADMIN_ID, ADMIN_ID, STUDENT_ID]:
            user = db.get(User, uid)
            if user:
                db.delete(user)
        db.flush()

        super_admin = User(
            id=SUPER_ADMIN_ID,
            tenant_id=INSTITUTION_ID,
            role=UserRole.super_admin,
            full_name="Super Admin",
            email="superadmin@portal.com",
            password_hash=hash_password("superadmin123"),
        )

        admin = User(
            id=ADMIN_ID,
            tenant_id=INSTITUTION_ID,
            role=UserRole.admin,
            full_name="Test Admin",
            email="admin@riphah.edu.pk",
            password_hash=hash_password("admin123"),
        )

        student = User(
            id=STUDENT_ID,
            tenant_id=INSTITUTION_ID,
            role=UserRole.student,
            full_name="Test Student",
            email="student@riphah.edu.pk",
            password_hash=hash_password("student123"),
            roll_number="RIPHAH-001",
        )

        db.add_all([super_admin, admin, student])
        db.commit()

        print("Seed complete!")
        print(f"  Institution ID : {INSTITUTION_ID}")
        print(f"  Super Admin    : superadmin@portal.com / superadmin123")
        print(f"  Admin          : admin@riphah.edu.pk  / admin123")
        print(f"  Student        : student@riphah.edu.pk / student123")

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
