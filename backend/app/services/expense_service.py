from datetime import date

from app.schemas.expense import ExpenseCreate, ExpenseOut, ExpenseUpdate
from app.schemas.wedding import DataFile
from app.services.storage import StorageService


class NotFoundError(Exception):
    pass


def next_expense_id(expenses: list[ExpenseOut]) -> str:
    used = {expense.id for expense in expenses}
    maximum = 0
    for expense in expenses:
        if expense.id.startswith("EXP") and expense.id[3:].isdigit():
            maximum = max(maximum, int(expense.id[3:]))
    candidate = maximum + 1
    while f"EXP{candidate:03d}" in used:
        candidate += 1
    return f"EXP{candidate:03d}"


class ExpenseService:
    def __init__(self, storage: StorageService):
        self.storage = storage

    def list(
        self,
        search: str = "",
        from_date: date | None = None,
        to_date: date | None = None,
        side: str = "all",
    ) -> list[ExpenseOut]:
        data = self.storage.read()
        needle = search.strip().lower()
        results = []
        for expense in data.expenses:
            if needle and needle not in expense.name.lower():
                continue
            if from_date and expense.date < from_date:
                continue
            if to_date and expense.date > to_date:
                continue
            if side != "all" and expense.side != side and expense.side != "both":
                continue
            results.append(expense)
        return results

    def create(self, payload: ExpenseCreate) -> ExpenseOut:
        def apply(data):
            expense = ExpenseOut(
                id=next_expense_id(data.expenses),
                date=payload.date,
                name=payload.name.upper(),
                side=payload.side,
                amount=round(payload.amount, 2),
            )
            data.expenses.append(expense)
            return expense

        return self.storage.mutate(apply)

    def update(self, expense_id: str, payload: ExpenseUpdate) -> ExpenseOut:
        def apply(data):
            for index, expense in enumerate(data.expenses):
                if expense.id == expense_id:
                    updated = ExpenseOut(
                        id=expense_id,
                        date=payload.date,
                        name=payload.name.upper(),
                        side=payload.side,
                        amount=round(payload.amount, 2),
                    )
                    data.expenses[index] = updated
                    return updated
            raise NotFoundError("Expense not found.")

        return self.storage.mutate(apply)

    def delete(self, expense_id: str) -> None:
        def apply(data):
            remaining = [expense for expense in data.expenses if expense.id != expense_id]
            if len(remaining) == len(data.expenses):
                raise NotFoundError("Expense not found.")
            data.expenses = remaining

        self.storage.mutate(apply)
