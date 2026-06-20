from pydantic import BaseModel
from typing import Optional


class ChallengeWithProgressOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    type: str
    goal: Optional[float] = None
    reward: int
    progress: float = 0.0
    completed: bool = False

    model_config = {"from_attributes": True}
