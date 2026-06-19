from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_employer_admin
from app.models.request import BenefitRequest
from app.models.payment import Payment
from app.models.user import User
from app.schemas.request import BenefitRequestOut, ApprovalAction
from app.services.approval_service import approve_request, reject_request

router = APIRouter(prefix="/employer", tags=["employer"])


@router.get("/dashboard")
def employer_dashboard(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    total_requests = db.query(BenefitRequest).filter(BenefitRequest.company_id == current_user.company_id).count()
    pending = db.query(BenefitRequest).filter(
        BenefitRequest.company_id == current_user.company_id,
        BenefitRequest.status == "pending",
    ).count()
    approved = db.query(BenefitRequest).filter(
        BenefitRequest.company_id == current_user.company_id,
        BenefitRequest.status == "approved",
    ).count()
    return {"total_requests": total_requests, "pending": pending, "approved": approved}


@router.get("/approvals", response_model=List[BenefitRequestOut])
def list_approvals(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    return (
        db.query(BenefitRequest)
        .filter(BenefitRequest.company_id == current_user.company_id, BenefitRequest.status == "pending")
        .order_by(BenefitRequest.submitted_at.desc())
        .all()
    )


@router.post("/approvals/{request_id}/approve", response_model=BenefitRequestOut)
def approve(request_id: int, current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    return approve_request(db, request_id, current_user.company_id)


@router.post("/approvals/{request_id}/reject", response_model=BenefitRequestOut)
def reject(request_id: int, data: ApprovalAction, current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    return reject_request(db, request_id, current_user.company_id, data.rejection_reason)


@router.get("/payments")
def employer_payments(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    requests = db.query(BenefitRequest).filter(BenefitRequest.company_id == current_user.company_id).all()
    request_ids = [r.id for r in requests]
    payments = db.query(Payment).filter(Payment.request_id.in_(request_ids)).all() if request_ids else []
    return payments


@router.get("/employees")
def employer_employees(current_user=Depends(get_employer_admin), db: Session = Depends(get_db)):
    return (
        db.query(User)
        .filter(User.company_id == current_user.company_id, User.role == "employee")
        .all()
    )
