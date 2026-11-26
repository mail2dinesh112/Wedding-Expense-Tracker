from fastapi import Depends

from app.core.config import get_settings
from app.services.expense_service import ExpenseService
from app.services.storage import GitHubStorage, LocalJSONStorage, StorageService
from app.services.wedding_service import WeddingService


def get_storage() -> StorageService:
    settings = get_settings()
    if settings.storage_backend == "github":
        return GitHubStorage(settings)
    return LocalJSONStorage()


def get_expense_service(storage: StorageService = Depends(get_storage)) -> ExpenseService:
    return ExpenseService(storage)


def get_wedding_service(storage: StorageService = Depends(get_storage)) -> WeddingService:
    return WeddingService(storage)
