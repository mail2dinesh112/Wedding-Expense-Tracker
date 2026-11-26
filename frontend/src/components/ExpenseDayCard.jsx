import { useRef, useState } from 'react';
import {
  ArrowDown, Camera, ChevronDown, Coffee, Flower2, Fuel, Heart,
  Pencil, ReceiptText, Route, Sparkles, Trash2, UserRound, UtensilsCrossed
} from 'lucide-react';
import { categoryFor } from '../utils/expenseUtils';
import { formatINR, formatLongDate, formatMonth } from '../utils/formatters';

const CATEGORY_ICONS = {
  coffee: Coffee,
  food: UtensilsCrossed,
  fuel: Fuel,
  travel: Route,
  decoration: Flower2,
  photography: Camera,
  beauty: Sparkles,
  general: ReceiptText
};

const SIDE_ICONS = { groom: UserRound, bride: Flower2, both: Heart };

export default function ExpenseDayCard({ group, side, open, onToggle, onEdit, onDelete }) {
  const [more, setMore] = useState(group.items.length > 6);
  const [atEnd, setAtEnd] = useState(false);
  const scrollRef = useRef(null);

  const total = group.subtotal || 1;
  const segments = [
    { key: 'g', value: group.groom, color: 'var(--color-accent-deep)' },
    { key: 'b', value: group.bride, color: 'var(--color-amber)' },
    { key: 'x', value: group.both, color: 'var(--gradient-brand)' }
  ];

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const end = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    setAtEnd(end);
    setMore(!end && el.scrollHeight > el.clientHeight);
  };

  const scrollMore = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: atEnd ? 0 : el.scrollTop + el.clientHeight - 42, behavior: 'smooth' });
  };

  const uniqueIcons = [...new Set(group.items.map((item) => categoryFor(item.name).icon))].slice(0, 4);

  return (
    <article className={`day-card ${open ? 'open' : ''}`}>
      <button type="button" className="day-head" aria-expanded={open} onClick={onToggle}>
        <span className="date-tile">
          <b>{group.date.slice(8, 10)}</b>
          <small>{formatMonth(group.date)}</small>
        </span>
        <span className="min-w-0">
          <span className="day-title block font-display text-[22px] font-semibold leading-tight text-accent-deep">
            {formatLongDate(group.date)}
          </span>
          <span className="mt-1 flex items-center gap-2 text-[12.5px] text-muted">
            <span className="flex">
              {uniqueIcons.map((key) => {
                const Icon = CATEGORY_ICONS[key];
                return (
                  <span key={key} className="-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-surface text-accent-deep first:ml-0">
                    <Icon size={12} />
                  </span>
                );
              })}
            </span>
            {group.items.length} {group.items.length === 1 ? 'expense' : 'expenses'}
          </span>
        </span>
        <span className="ml-auto flex items-center gap-5 max-sm:gap-2.5">
          <span className="hidden w-[180px] flex-col gap-1.5 md:flex" aria-label={`Groom ${formatINR(group.groom)}, Bride ${formatINR(group.bride)}`}>
            <span className="flex h-1.5 overflow-hidden rounded-full bg-divider">
              {segments.map((segment) => (
                <span key={segment.key} style={{ width: `${segment.value / total * 100}%`, background: segment.color }} />
              ))}
            </span>
            <span className="flex justify-between gap-2 text-[11px] font-semibold">
              <span className="text-accent-deep">G {formatINR(group.groom)}</span>
              <span className="text-[#8A5A32]">B {formatINR(group.bride)}</span>
              {group.both > 0 && <span className="text-accent">Both {formatINR(group.both)}</span>}
            </span>
          </span>
          <span className="text-right">
            <span className="day-total-label block text-[10.5px] font-bold uppercase tracking-wider text-muted">Day total</span>
            <b className="day-total-value whitespace-nowrap font-serif text-[22px] text-accent-deep">{formatINR(group.subtotal)}</b>
          </span>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-accent-deep transition">
            <ChevronDown size={18} className={`transition ${open ? 'rotate-180' : ''}`} />
          </span>
        </span>
      </button>

      <div className="day-body" {...(open ? {} : { inert: '' })}>
        <div className="day-inner">
          <div className="relative">
            <div ref={scrollRef} className="scroll-area" onScroll={onScroll} tabIndex={group.items.length > 6 ? 0 : undefined}>
              <table className="grid-table">
                <thead>
                  <tr>
                    <th className="!w-11 max-md:hidden">#</th>
                    <th>Expense</th>
                    <th className="!w-[90px]">Side</th>
                    <th className="!w-[130px] text-right">Amount</th>
                    <th className="!w-[96px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item, index) => {
                    const CategoryIcon = CATEGORY_ICONS[categoryFor(item.name).icon];
                    const SideIcon = SIDE_ICONS[item.side];
                    const shared = item.side === 'both' && (side === 'groom' || side === 'bride');
                    return (
                      <tr key={item.id}>
                        <td className="font-ui text-[11.5px] text-muted max-md:hidden">{String(index + 1).padStart(2, '0')}</td>
                        <td>
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-surface text-accent-deep max-sm:hidden">
                              <CategoryIcon size={14} />
                            </span>
                            <span className="flex min-w-0 items-baseline gap-2.5">
                              <span className="truncate font-semibold text-cocoa">{item.name}</span>
                              <span className="whitespace-nowrap text-[11.5px] text-muted max-sm:hidden">{categoryFor(item.name).label}</span>
                              {shared && <span className="share-tag" title="Half share of a both-side expense">½ shared</span>}
                            </span>
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`side-icon ${item.side}`} title={item.side === 'groom' ? 'Groom Side' : item.side === 'bride' ? 'Bride Side' : 'Both Sides'}>
                            <SideIcon size={14} />
                          </span>
                        </td>
                        <td className="text-right"><span className="whitespace-nowrap font-serif text-[15px] font-bold text-accent-deep">{formatINR(item.displayAmount)}</span></td>
                        <td className="text-right">
                          <span className="grid-actions">
                            <button type="button" className="icon-button" aria-label={`Edit ${item.name}`} title="Edit expense" onClick={() => onEdit(item)}><Pencil size={14} /></button>
                            <button type="button" className="icon-button danger" aria-label={`Delete ${item.name}`} title="Delete expense" onClick={() => onDelete(item)}><Trash2 size={14} /></button>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-11 bg-gradient-to-b from-transparent to-white transition ${more ? 'opacity-100' : 'opacity-0'}`} />
          </div>
          {group.items.length > 6 && (
            <div className="flex items-center justify-between gap-3 border-t border-line bg-surface px-4 py-2 text-xs text-muted">
              <span>Showing 6 of {group.items.length}, scroll to see more</span>
              <button type="button" className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-line bg-white px-3 font-semibold text-accent-deep hover:border-accent" onClick={scrollMore}>
                {atEnd ? 'Back to top' : 'Scroll down'}
                <ArrowDown size={14} className={atEnd ? 'rotate-180' : ''} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
