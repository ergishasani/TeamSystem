from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    message: str
    type: str
    read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
