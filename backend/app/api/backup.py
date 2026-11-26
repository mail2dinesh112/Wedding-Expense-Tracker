from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.dependencies.auth import get_current_admin
from app.dependencies.services import get_storage
from app.services.storage import StorageService

router = APIRouter(
    prefix="/backup",
    tags=["backup"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("")
def export_backup(storage: StorageService = Depends(get_storage)) -> JSONResponse:
    data = storage.read()
    return JSONResponse(
        content=data.model_dump(mode="json"),
        headers={"Content-Disposition": 'attachment; filename="wedding.json"'},
    )
