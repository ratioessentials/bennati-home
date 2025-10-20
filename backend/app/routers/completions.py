from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/completions", tags=["completions"])


@router.get("", response_model=List[schemas.ChecklistCompletion])
def get_completions(
    checklist_item_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.ChecklistCompletion)
    
    if checklist_item_id is not None:
        query = query.filter(models.ChecklistCompletion.checklist_item_id == checklist_item_id)
    
    if user_id is not None:
        query = query.filter(models.ChecklistCompletion.user_id == user_id)
    
    return query.order_by(models.ChecklistCompletion.completed_at.desc()).all()


@router.post("", response_model=schemas.ChecklistCompletion)
def create_completion(
    completion_data: schemas.ChecklistCompletionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    completion = models.ChecklistCompletion(**completion_data.model_dump())
    db.add(completion)
    db.commit()
    db.refresh(completion)
    return completion


@router.delete("/{completion_id}")
def delete_completion(
    completion_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    completion = db.query(models.ChecklistCompletion).filter(
        models.ChecklistCompletion.id == completion_id
    ).first()
    if not completion:
        raise HTTPException(status_code=404, detail="Completion not found")
    
    db.delete(completion)
    db.commit()
    return {"message": "Completion deleted successfully"}

