import { isValidISO } from './formatters';

export const SIDES = ['groom', 'bride', 'both'];

export function validateExpenseInput(input = {}) {
  const errors = { date: '', name: '', side: '', amount: '' };

  if (!input.date) errors.date = 'Please select an expense date.';
  else if (!isValidISO(input.date)) errors.date = 'Enter a valid date in YYYY-MM-DD format.';

  if (!String(input.name || '').trim()) errors.name = 'Please enter an expense name.';

  if (!SIDES.includes(input.side)) errors.side = 'Please select Groom, Bride, or Both.';

  const amount = Number(input.amount);
  if (input.amount === '' || input.amount === null || input.amount === undefined || !Number.isFinite(amount)) {
    errors.amount = 'Please enter an amount.';
  } else if (amount <= 0) {
    errors.amount = 'Amount must be greater than zero.';
  }

  return { valid: !Object.values(errors).some(Boolean), errors };
}

export function validateBudget(value) {
  const amount = Number(value);
  if (value === '' || value === null || value === undefined || !Number.isFinite(amount) || amount < 0) {
    return 'Enter a budget of zero or more.';
  }
  return '';
}
