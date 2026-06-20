from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_role(*roles: str):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return checker


def get_employee(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "employee":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employee access required")
    return current_user


def get_employer_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "employer_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employer admin access required")
    return current_user


def get_provider_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "provider_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Provider admin access required")
    return current_user


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("employer_admin", "platform_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
