from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/supply-alerts", tags=["supply-alerts"])


@router.get("", response_model=List[schemas.SupplyAlert])
def get_supply_alerts(
    supply_id: Optional[int] = Query(None),
    is_resolved: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.SupplyAlert)
    
    if supply_id is not None:
        query = query.filter(models.SupplyAlert.supply_id == supply_id)
    
    if is_resolved is not None:
        query = query.filter(models.SupplyAlert.is_resolved == is_resolved)
    
    return query.order_by(models.SupplyAlert.created_at.desc()).all()


@router.post("", response_model=schemas.SupplyAlert)
def create_supply_alert(
    alert_data: schemas.SupplyAlertCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    alert = models.SupplyAlert(**alert_data.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.put("/{alert_id}/resolve", response_model=schemas.SupplyAlert)
def resolve_supply_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    alert = db.query(models.SupplyAlert).filter(models.SupplyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Supply alert not found")
    
    alert.is_resolved = True
    alert.resolved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(alert)
    return alert

