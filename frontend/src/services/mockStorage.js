import { filterExpenses, nextExpenseId } from '../utils/expenseUtils';
import { isValidISO } from '../utils/formatters';

const KEYS = { wedding: 'wet.wedding', expenses: 'wet.expenses' };
const DEFAULT_WEDDING = {
  groom: 'Dinesh',
  bride: 'Suthesi',
  wedding_date: '2026-12-14',
  total_budget: 100000
};

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function cleanExpense(input) {
  return {
    id: input.id || nextExpenseId(read(KEYS.expenses, [])),
    date: input.date,
    name: String(input.name).trim().toUpperCase(),
    side: input.side,
    amount: Math.round(Number(input.amount) * 100) / 100
  };
}

function seedIfNeeded() {
  if (localStorage.getItem(KEYS.expenses) === null) write(KEYS.expenses, []);
  if (localStorage.getItem(KEYS.wedding) === null) write(KEYS.wedding, DEFAULT_WEDDING);
}

export async function getWedding() {
  seedIfNeeded();
  return { ...DEFAULT_WEDDING, ...read(KEYS.wedding, DEFAULT_WEDDING) };
}

export async function updateWedding(payload) {
  const current = await getWedding();
  const next = { ...current, ...payload };
  if (!Number.isFinite(Number(next.total_budget)) || Number(next.total_budget) < 0) {
    throw new Error('Budget must be zero or more.');
  }
  if (!isValidISO(next.wedding_date)) throw new Error('Invalid wedding date.');
  next.total_budget = Math.round(Number(next.total_budget) * 100) / 100;
  write(KEYS.wedding, next);
  return next;
}

export async function getExpenses(filters = {}) {
  seedIfNeeded();
  const expenses = read(KEYS.expenses, []).filter(
    (expense) => isValidISO(expense.date) && Number(expense.amount) > 0
  );
  return filterExpenses(expenses, {
    search: filters.search || '',
    fromDate: filters.from_date || filters.fromDate || '',
    toDate: filters.to_date || filters.toDate || '',
    side: filters.side || 'all'
  });
}

export async function createExpense(input) {
  const expenses = await getExpenses();
  const expense = cleanExpense(input);
  write(KEYS.expenses, [...expenses, expense]);
  return expense;
}

export async function updateExpense(id, input) {
  const expenses = await getExpenses();
  if (!expenses.some((expense) => expense.id === id)) throw new Error('Expense not found.');
  const updated = expenses.map((expense) =>
    expense.id === id ? { ...cleanExpense(input), id } : expense
  );
  write(KEYS.expenses, updated);
  return updated.find((expense) => expense.id === id);
}

export async function deleteExpense(id) {
  const expenses = await getExpenses();
  if (!expenses.some((expense) => expense.id === id)) throw new Error('Expense not found.');
  write(KEYS.expenses, expenses.filter((expense) => expense.id !== id));
  return { id };
}
