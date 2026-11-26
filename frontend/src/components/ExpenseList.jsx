import { useEffect, useMemo, useState } from 'react';
import { ChevronsUpDown, Flower2, Heart, UserRound } from 'lucide-react';
import { groupByDate } from '../utils/expenseUtils';
import ExpenseDayCard from './ExpenseDayCard';

const LEGEND = [
  { label: 'Groom Side', icon: UserRound, tone: 'groom' },
  { label: 'Bride Side', icon: Flower2, tone: 'bride' },
  { label: 'Both Sides', icon: Heart, tone: 'both' }
];

export default function ExpenseList({ expenses, side, visible, total, onEdit, onDelete }) {
  const [openDays, setOpenDays] = useState(() => new Set());
  const groups = useMemo(() => groupByDate(expenses, side), [expenses, side]);

  useEffect(() => {
    if (!groups.length) return;
    setOpenDays((current) => {
      const next = new Set(current);
      const hasVisibleOpen = groups.some((group) => next.has(group.date));
      if (!hasVisibleOpen) next.add(groups[0].date);
      return next;
    });
  }, [groups]);

  const allOpen = groups.length > 0 && groups.every((group) => openDays.has(group.date));

  const toggleDay = (date) => {
    setOpenDays((current) => {
      const next = new Set(current);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const toggleAll = () => {
    setOpenDays(allOpen ? new Set() : new Set(groups.map((group) => group.date)));
  };

  const suffix = total === 1 ? 'transaction' : 'transactions';
  const countText = visible === total ? `Showing ${visible} ${suffix}` : `Showing ${visible} of ${total} ${suffix}`;

  return (
    <div className="rounded-2xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-6 py-3.5">
        <p className="m-0 text-[12.5px] text-muted">{countText}</p>
        <div className="flex flex-wrap gap-4 text-[12.5px] text-muted max-sm:w-full max-sm:order-3">
          {LEGEND.map(({ label, icon: Icon, tone }) => (
            <span key={label} className="inline-flex items-center gap-2">
              <span className={`side-icon !h-[22px] !w-[22px] ${tone}`}><Icon size={12} /></span>
              {label}
            </span>
          ))}
        </div>
        <button type="button" className="btn-ghost !py-2 !text-xs" onClick={toggleAll}>
          <ChevronsUpDown size={14} /> {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <div className="p-4">
        {groups.length === 0 ? (
          <div className="border border-dashed border-line bg-white px-6 py-12 text-center text-muted">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface text-accent">✦</div>
            <p className="font-display text-xl text-accent-deep">{total === 0 ? 'No expenses yet' : 'No matching expenses'}</p>
            <p className="mx-auto mt-1 max-w-sm text-[13.5px]">
              {total === 0 ? 'Add your first expense to start tracking the wedding budget.' : 'Try a different search or clear the filters to see all records.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <ExpenseDayCard
                key={group.date}
                group={group}
                side={side}
                open={openDays.has(group.date)}
                onToggle={() => toggleDay(group.date)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
