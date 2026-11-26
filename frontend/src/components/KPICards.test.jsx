import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import KPICards from './KPICards';

const expenses = [
  { id: 'EXP001', date: '2026-11-22', name: 'SAREE', side: 'bride', amount: 22500 },
  { id: 'EXP002', date: '2026-11-22', name: 'SHARED CAB', side: 'both', amount: 1000 },
  { id: 'EXP003', date: '2026-11-22', name: 'PETROL', side: 'groom', amount: 500 }
];

describe('KPICards', () => {
  it('renders budget, total, balance and transaction count', () => {
    render(<KPICards wedding={{ total_budget: 100000 }} expenses={expenses} onBudgetSave={vi.fn()} />);
    expect(screen.getByText('₹1,00,000')).toBeInTheDocument();
    expect(screen.getByText('₹24,000')).toBeInTheDocument();
    expect(screen.getByText('₹76,000')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
