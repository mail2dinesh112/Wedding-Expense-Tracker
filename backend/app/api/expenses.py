from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies.auth import get_current_admin
from app.dependencies.services import get_expense_service
from app.schemas.expense import ExpenseCreate, ExpenseOut, ExpenseUpdate
from app.services.expense_service import ExpenseService, NotFoundError

router = APIRouter(
    prefix="/expenses",
    tags=["expenses"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    search: str = "",
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    side: Literal["all", "groom", "bride", "both"] = "all",
    service: ExpenseService = Depends(get_expense_service),
) -> list[ExpenseOut]:
    if from_date and to_date and from_date > to_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="from_date must be before to_date.")
    return service.list(search, from_date, to_date, side)


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    service: ExpenseService = Depends(get_expense_service),
) -> ExpenseOut:
    return service.create(payload)


@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: str,
    payload: ExpenseUpdate,
    service: ExpenseService = Depends(get_expense_service),
) -> ExpenseOut:
    try:
        return service.update(expense_id, payload)
    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: str,
    service: ExpenseService = Depends(get_expense_service),
) -> None:
    try:
        service.delete(expense_id)
    except NotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
