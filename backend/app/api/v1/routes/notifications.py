from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/me", response_model=List[NotificationOut])
def my_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.read = True
    db.commit()
    db.refresh(n)
    return n


@router.post("/me/read-all", status_code=204)
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False,
    ).update({"read": True})
    db.commit()
