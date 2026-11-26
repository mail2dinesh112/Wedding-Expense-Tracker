from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

Side = Literal["groom", "bride", "both"]


class ExpenseBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: date
    name: str = Field(min_length=1, max_length=80)
    side: Side
    amount: float = Field(gt=0)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Expense name cannot be empty.")
        return cleaned


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(ExpenseBase):
    pass


class ExpenseOut(ExpenseBase):
    id: str
