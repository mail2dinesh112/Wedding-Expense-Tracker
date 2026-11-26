import { isValidISO } from './formatters';

const round = (value) => Math.round(Number(value) * 100) / 100;

export function amountForSide(expense, side) {
  if (expense.side === 'both' && (side === 'groom' || side === 'bride')) {
    return round(Number(expense.amount) / 2);
  }
  return Number(expense.amount);
}

export function filterExpenses(expenses, filters = {}) {
  const search = (filters.search || '').trim().toLowerCase();
  const from = filters.fromDate || '';
  const to = filters.toDate || '';
  const side = filters.side || 'all';

  return expenses.filter((expense) => {
    if (search && !expense.name.toLowerCase().includes(search)) return false;
    if (from && expense.date < from) return false;
    if (to && expense.date > to) return false;
    if (side !== 'all' && expense.side !== side && expense.side !== 'both') return false;
    return true;
  });
}

export function groupByDate(expenses, side = 'all') {
  const sorted = [...expenses].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return 0;
  });

  return sorted.reduce((groups, expense) => {
    let group = groups[groups.length - 1];
    if (!group || group.date !== expense.date) {
      group = { date: expense.date, items: [], subtotal: 0, groom: 0, bride: 0, both: 0 };
      groups.push(group);
    }
    const shown = amountForSide(expense, side);
    group.items.push({ ...expense, displayAmount: shown });
    group.subtotal = round(group.subtotal + shown);
    if (expense.side === 'groom' || (expense.side === 'both' && side === 'groom')) group.groom += shown;
    else if (expense.side === 'bride' || (expense.side === 'both' && side === 'bride')) group.bride += shown;
    else group.both += shown;
    return groups;
  }, []);
}

export function calculateKPIs(expenses, budget) {
  const totalExpenses = round(expenses.reduce((sum, expense) => sum + Number(expense.amount), 0));
  const totalBudget = Number(budget) || 0;
  return {
    totalBudget,
    totalExpenses,
    balance: round(totalBudget - totalExpenses),
    totalTransactions: expenses.length
  };
}

export function nextExpenseId(expenses) {
  let max = 0;
  const used = new Set();
  expenses.forEach((expense) => {
    used.add(expense.id);
    const match = /^EXP0*(\d+)$/i.exec(expense.id || '');
    if (match) max = Math.max(max, Number(match[1]));
  });
  let next = max + 1;
  while (used.has(`EXP${String(next).padStart(3, '0')}`)) next += 1;
  return `EXP${String(next).padStart(3, '0')}`;
}

const CATEGORIES = [
  { pattern: /tea|coffee|snack|water|juice/i, label: 'Refreshments', icon: 'coffee' },
  { pattern: /lunch|dinner|tiffin|food|breakfast|meal/i, label: 'Food', icon: 'food' },
  { pattern: /petrol|diesel|fuel/i, label: 'Fuel', icon: 'fuel' },
  { pattern: /toll|travel|cab|auto|bus|train|fare/i, label: 'Travel', icon: 'travel' },
  { pattern: /flower|decor|garland/i, label: 'Decoration', icon: 'decoration' },
  { pattern: /photo|video|camera/i, label: 'Photography', icon: 'photography' },
  { pattern: /mehendi|makeup|beauty|saree|vesti/i, label: 'Attire & Beauty', icon: 'beauty' }
];

export function categoryFor(name) {
  return CATEGORIES.find((category) => category.pattern.test(name)) ||
    { label: 'General', icon: 'general' };
}
