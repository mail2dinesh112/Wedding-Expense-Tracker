import { calculateKPIs } from '../utils/expenseUtils';
import { formatINR } from '../utils/formatters';
import BudgetEditor from './BudgetEditor';

function Card({ label, value, note, children, over }) {
  return (
    <article className={`kpi-card ${over ? 'over' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="kpi-label">{label}</span>
        {children}
      </div>
      <p className="kpi-value">{value}</p>
      <p className="kpi-note">{note}</p>
    </article>
  );
}

export default function KPICards({ wedding, expenses, onBudgetSave }) {
  const kpis = calculateKPIs(expenses, wedding?.total_budget || 0);

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Expense summary">
      <Card label="Total Budget" value={formatINR(kpis.totalBudget)} note="Planned for the big day">
        <BudgetEditor value={kpis.totalBudget} onSave={onBudgetSave} />
      </Card>
      <Card label="Total Expenses" value={formatINR(kpis.totalExpenses)} note="Across both sides" />
      <Card
        label="Balance Amount"
        value={formatINR(kpis.balance)}
        note={kpis.balance < 0 ? 'Over the planned budget' : 'Budget remaining'}
        over={kpis.balance < 0}
      />
      <Card label="Total Transactions" value={String(kpis.totalTransactions)} note="Expenses recorded" />
    </section>
  );
}
