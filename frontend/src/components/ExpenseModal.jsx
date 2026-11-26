import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DateDropdown, SIDE_OPTIONS, SideDropdown } from './Dropdown';
import { validateExpenseInput } from '../utils/validators';
import { todayISO } from '../utils/formatters';
import { Users } from 'lucide-react';

const EMPTY = { date: todayISO(), name: '', side: '', amount: '' };

export default function ExpenseModal({ expense, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(expense
      ? { date: expense.date, name: expense.name, side: expense.side, amount: String(expense.amount) }
      : EMPTY);
    setErrors({});
    setSubmitting(false);
  }, [expense]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const validation = validateExpenseInput(form);
    setErrors(validation.errors);
    if (!validation.valid) return;
    setSubmitting(true);
    const ok = await onSave(form);
    if (ok) onClose();
    else setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-cocoa/45 p-5 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-[480px]" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 rounded-t-[20px] border-b border-line bg-gradient-to-br from-surface to-white px-6 py-5">
          <div>
            <p className="m-0 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted">Wedding Expense</p>
            <h2 id="expense-modal-title" className="m-0 font-display text-2xl text-accent-deep">{expense ? 'Edit Expense' : 'Add Expense'}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={14} /></button>
        </div>

        <form onSubmit={submit} noValidate>
          <div className="grid gap-4 p-6">
            <div className="field">
              <label className="field-label" htmlFor="expense-name">Expense Name *</label>
              <input
                id="expense-name"
                className={`field-input ${errors.name ? 'invalid' : ''}`}
                placeholder="e.g. Petrol, Saree, Photography Advance"
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
                maxLength={80}
              />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>

            <div className="field">
              <span className="field-label">Expense Date *</span>
              <DateDropdown
                label="Expense date"
                value={form.date}
                onChange={(value) => setField('date', value)}
                placeholder={{ title: 'Select date', sub: 'Expense date' }}
              />
              {errors.date && <p className="field-error">{errors.date}</p>}
            </div>

            <div className="field">
              <span className="field-label">Expense Side *</span>
              <SideDropdown
                label="Expense side"
                value={form.side}
                onChange={(value) => setField('side', value)}
                options={SIDE_OPTIONS}
                triggerIcon={Users}
                placeholder={{ title: 'Select side', sub: 'Groom, bride or both sides' }}
              />
              {errors.side && <p className="field-error">{errors.side}</p>}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="expense-amount">Amount (INR) *</label>
              <div className="flex items-center gap-1.5 rounded-[10px] border border-line bg-white px-3 focus-within:border-accent focus-within:ring-[3px] focus-within:ring-[#DF6656]/20">
                <span className="font-ui font-semibold text-muted">₹</span>
                <input
                  id="expense-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  className={`w-full border-0 bg-transparent py-2.5 font-display text-lg text-accent-deep outline-none ${errors.amount ? 'invalid' : ''}`}
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(event) => setField('amount', event.target.value)}
                />
              </div>
              {errors.amount && <p className="field-error">{errors.amount}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-line px-6 py-5">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {expense ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
