"""Creates in-app notifications. Add push delivery (Expo/FCM) here later."""
from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(db: Session, user_id: int, message: str, type: str = "info") -> Notification:
    notification = Notification(user_id=user_id, message=message, type=type)
    db.add(notification)
    return notification
