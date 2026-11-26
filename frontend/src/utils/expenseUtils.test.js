import { describe, expect, it } from 'vitest';
import { amountForSide, calculateKPIs, filterExpenses, groupByDate, nextExpenseId } from './expenseUtils';

const expenses = [
  { id: 'EXP001', date: '2026-11-22', name: 'SAREE', side: 'bride', amount: 22500 },
  { id: 'EXP002', date: '2026-11-22', name: 'SHARED CAB', side: 'both', amount: 1000 },
  { id: 'EXP003', date: '2026-11-22', name: 'PETROL', side: 'groom', amount: 500 }
];

describe('business rules', () => {
  it('counts shared expenses once in overall totals', () => {
    expect(calculateKPIs(expenses, 100000)).toEqual({
      totalBudget: 100000,
      totalExpenses: 24000,
      balance: 76000,
      totalTransactions: 3
    });
  });

  it('splits shared expenses equally for side reporting', () => {
    expect(amountForSide(expenses[1], 'groom')).toBe(500);
    const groom = groupByDate(filterExpenses(expenses, { side: 'groom' }), 'groom');
    const bride = groupByDate(filterExpenses(expenses, { side: 'bride' }), 'bride');
    expect(groom[0].subtotal).toBe(1000);
    expect(bride[0].subtotal).toBe(23000);
    expect(groom[0].subtotal + bride[0].subtotal).toBe(24000);
  });

  it('combines search, date and side filters', () => {
    const result = filterExpenses(expenses, { search: 'cab', fromDate: '2026-11-22', toDate: '2026-11-22', side: 'groom' });
    expect(result.map((expense) => expense.id)).toEqual(['EXP002']);
  });

  it('generates the next sequential id', () => {
    expect(nextExpenseId(expenses)).toBe('EXP004');
  });
});
