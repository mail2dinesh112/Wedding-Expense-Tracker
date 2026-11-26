from app.schemas.wedding import DataFile, WeddingOut, WeddingUpdate
from app.services.storage import StorageService


class WeddingService:
    def __init__(self, storage: StorageService):
        self.storage = storage

    def get(self) -> WeddingOut:
        return self.storage.read().wedding

    def update(self, payload: WeddingUpdate) -> WeddingOut:
        changes = payload.model_dump(exclude_unset=True)

        def apply(data: DataFile) -> WeddingOut:
            merged = data.wedding.model_dump()
            merged.update(changes)
            if "total_budget" in merged:
                merged["total_budget"] = round(float(merged["total_budget"]), 2)
            updated = WeddingOut.model_validate(merged)
            data.wedding = updated
            return updated

        return self.storage.mutate(apply)
