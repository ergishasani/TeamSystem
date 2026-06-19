from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.provider import Provider
from app.schemas.offer import ProviderOut

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("", response_model=List[ProviderOut])
def list_providers(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(Provider).filter(Provider.status == "active").all()


@router.get("/{provider_id}", response_model=ProviderOut)
def get_provider(provider_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider
