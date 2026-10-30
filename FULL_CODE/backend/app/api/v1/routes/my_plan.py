from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.security import SessionUser, current_user
from app.services.storage import storage_service

router = APIRouter(prefix="/my-plan", tags=["my plan"])


class MyPlanPayload(BaseModel):
    assessment: Optional[Dict[str, Any]] = Field(None, description="Summary of the cover-need result")
    plan: Optional[Dict[str, Any]] = Field(None, description="The product basket or plan the customer chose")


@router.put("")
def save(payload: MyPlanPayload, user: SessionUser = Depends(current_user)):
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    return storage_service.save_my_plan(user.email, data)


@router.get("")
def read(user: SessionUser = Depends(current_user)):
    return storage_service.get_my_plan(user.email) or {}


@router.delete("/choice")
def clear_choice(user: SessionUser = Depends(current_user)):
    storage_service.delete_my_plan_choice(user.email)
    return {"cleared": True}
