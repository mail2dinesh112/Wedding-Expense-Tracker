from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.expense import ExpenseOut


class WeddingOut(BaseModel):
    groom: str
    bride: str
    wedding_date: date
    total_budget: float = Field(ge=0)


class WeddingUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    groom: str | None = Field(default=None, min_length=1, max_length=80)
    bride: str | None = Field(default=None, min_length=1, max_length=80)
    wedding_date: date | None = None
    total_budget: float | None = Field(default=None, ge=0)


class DataFile(BaseModel):
    wedding: WeddingOut
    expenses: list[ExpenseOut]
