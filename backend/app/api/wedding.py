from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_admin
from app.dependencies.services import get_wedding_service
from app.schemas.wedding import WeddingOut, WeddingUpdate
from app.services.wedding_service import WeddingService

router = APIRouter(
    prefix="/wedding",
    tags=["wedding"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("", response_model=WeddingOut)
def get_wedding(service: WeddingService = Depends(get_wedding_service)) -> WeddingOut:
    return service.get()


@router.put("", response_model=WeddingOut)
def update_wedding(
    payload: WeddingUpdate,
    service: WeddingService = Depends(get_wedding_service),
) -> WeddingOut:
    return service.update(payload)
