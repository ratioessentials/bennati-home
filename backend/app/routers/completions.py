from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/completions", tags=["completions"])


@router.get("")
def get_completions(
    checklist_item_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    apartment_id: Optional[int] = Query(None),
    limit: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.ChecklistCompletion).join(models.ChecklistItem)
    
    if checklist_item_id is not None:
        query = query.filter(models.ChecklistCompletion.checklist_item_id == checklist_item_id)
    
    if user_id is not None:
        query = query.filter(models.ChecklistCompletion.user_id == user_id)
    
    if apartment_id is not None:
        query = query.filter(models.ChecklistItem.apartment_id == apartment_id)
    
    completions = query.order_by(models.ChecklistCompletion.completed_at.desc())
    
    if limit is not None:
        completions = completions.limit(limit)
    
    # Restituisci i dati con apartment_id e work_session_id
    results = []
    for completion in completions.all():
        results.append({
            "id": completion.id,
            "checklist_item_id": completion.checklist_item_id,
            "user_id": completion.user_id,
            "work_session_id": completion.work_session_id,  # AGGIUNTO!
            "completed_at": completion.completed_at.isoformat() if completion.completed_at else None,
            "notes": completion.notes,
            "apartment_id": completion.checklist_item.apartment_id if completion.checklist_item else None,
            "checklist_item_title": completion.checklist_item.title if completion.checklist_item else None
        })
    
    return results


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

