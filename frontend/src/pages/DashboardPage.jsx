import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import KPICards from '../components/KPICards';
import ExpenseToolbar from '../components/ExpenseToolbar';
import ExpenseList from '../components/ExpenseList';
import ExpenseModal from '../components/ExpenseModal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingScreen from '../components/LoadingScreen';
import { useExpenses } from '../hooks/useExpenses';
import { filterExpenses } from '../utils/expenseUtils';
import { formatINR, formatLongDate } from '../utils/formatters';

const EMPTY_FILTERS = { search: '', fromDate: '', toDate: '', side: 'all' };

export default function DashboardPage({ onLogout }) {
  const { wedding, expenses, loading, error, refresh, addExpense, editExpense, removeExpense, updateBudget } = useExpenses();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const visible = useMemo(() => filterExpenses(expenses, filters), [expenses, filters]);

  const setFilter = (patch) => setFilters((current) => ({ ...current, ...patch }));

  const saveExpense = async (form) => {
    const payload = {
      date: form.date,
      name: form.name.trim().toUpperCase(),
      side: form.side,
      amount: Number(form.amount)
    };
    const ok = editing
      ? await editExpense(editing.id, payload)
      : await addExpense(payload);
    setToast(ok ? (editing ? 'Expense updated.' : 'Expense added.') : 'Unable to save expense.');
    return ok;
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const ok = await removeExpense(deleting.id);
    setToast(ok ? 'Expense deleted.' : 'Unable to delete expense.');
    setDeleting(null);
  };

  const saveBudget = async (amount) => {
    const ok = await updateBudget({ total_budget: amount });
    setToast(ok ? 'Budget updated.' : 'Unable to update budget.');
    return ok;
  };

  if (!wedding && loading) {
    return <LoadingScreen />;
  }

  if (!wedding && error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <p className="font-display text-2xl text-accent-deep">Unable to load wedding data</p>
        <p className="text-sm text-muted">{error}</p>
        <button type="button" className="btn-primary" onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {loading && wedding && <div className="api-progress" aria-hidden="true" />}
      <Header wedding={wedding} onLogout={onLogout} />

      <main className="relative z-10 mx-auto -mt-8 max-w-[1160px] px-6 pb-10">
        <KPICards wedding={wedding} expenses={expenses} onBudgetSave={saveBudget} />

        {error && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-[10px] border border-[#D98F78] bg-white px-4 py-3 text-sm text-accent-deep">
            <span>{error}</span>
            <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={refresh}>Retry</button>
          </div>
        )}

        <section className="card mt-7 overflow-visible">
          <ExpenseToolbar
            filters={filters}
            onFilterChange={setFilter}
            onClear={() => setFilters(EMPTY_FILTERS)}
            onAdd={() => { setEditing(null); setModalOpen(true); }}
          />
          <div className="border-t border-line px-4 py-4">
            <ExpenseList
              expenses={visible}
              side={filters.side}
              visible={visible.length}
              total={expenses.length}
              onEdit={(expense) => { setEditing(expense); setModalOpen(true); }}
              onDelete={setDeleting}
            />
          </div>
        </section>
      </main>

      <footer className="pb-8 text-center text-[12.5px] text-muted">
        Made with <span className="text-accent">♥</span> for {wedding?.groom} &amp; {wedding?.bride} · {formatLongDate(wedding?.wedding_date)}
      </footer>

      {modalOpen && (
        <ExpenseModal
          expense={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={saveExpense}
        />
      )}

      {deleting && (
        <ConfirmDialog
          message={`Delete "${deleting.name}" (${formatINR(deleting.amount)})? This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>
    </div>
  );
}
