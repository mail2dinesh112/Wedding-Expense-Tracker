import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown, Flower2, Heart, UserRound } from 'lucide-react';
import { formatLongDate } from '../utils/formatters';

function useDropdownState() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  return { open, setOpen, ref };
}

export function SideDropdown({ value, onChange, options, placeholder, triggerIcon: TriggerIcon, label }) {
  const { open, setOpen, ref } = useDropdownState();
  const selected = options.find((option) => option.value === value);
  const Trigger = selected?.icon || TriggerIcon;

  return (
    <div className={`dd ${open ? 'open' : ''}`} ref={ref}>
      <button
        type="button"
        className="dd-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`dd-tile ${selected?.tone || 'both'}`}>
          <Trigger size={16} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="dd-title">{selected?.label || placeholder.title}</span>
          <span className="dd-sub">{selected?.description || placeholder.sub}</span>
        </span>
        <ChevronDown size={15} className={`shrink-0 text-accent-deep transition ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className="dd-panel" role="listbox" aria-label={label}>
        {options.map((option) => {
          const Icon = option.icon;
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={active}
              className={`dd-option ${active ? 'selected' : ''}`}
              onClick={() => { onChange(option.value); setOpen(false); }}
            >
              <span className={`dd-tile ${option.tone}`}><Icon size={16} /></span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="dd-title">{option.label}</span>
                <span className="dd-sub">{option.description}</span>
              </span>
              <Check size={15} className="dd-check" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function DateDropdown({ value, onChange, placeholder, label }) {
  const { open, setOpen, ref } = useDropdownState();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [view, setView] = useState(() => {
    const base = value ? new Date(`${value}T00:00:00`) : today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const monthLabel = view.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const start = new Date(view);
  start.setDate(1 - start.getDay());
  const days = Array.from({ length: 42 }, (_, index) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
  );

  const pick = (day) => {
    onChange(day ? toISO(day) : '');
    if (day) setView(new Date(day.getFullYear(), day.getMonth(), 1));
    setOpen(false);
  };

  const quick = (offset) => {
    if (offset === null) return pick(null);
    const day = new Date(today);
    day.setDate(day.getDate() + offset);
    pick(day);
  };

  return (
    <div className={`dd dd-date ${open ? 'open' : ''}`} ref={ref}>
      <button
        type="button"
        className="dd-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="dd-tile both"><CalendarDays size={16} /></span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="dd-title">{value ? formatLongDate(value) : placeholder.title}</span>
          <span className="dd-sub">{placeholder.sub}</span>
        </span>
        <ChevronDown size={15} className={`shrink-0 text-accent-deep transition ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className="dd-panel" role="dialog" aria-label={label}>
        <div className="px-1 pb-2 pt-1">
          <div className="mb-2 flex items-center justify-between px-1">
            <button type="button" className="icon-button" aria-label="Previous month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>
              <ChevronDown size={15} className="rotate-90" />
            </button>
            <span className="font-display text-[19px] font-semibold text-accent-deep">{monthLabel}</span>
            <button type="button" className="icon-button" aria-label="Next month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>
              <ChevronDown size={15} className="-rotate-90" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day} className="py-1">{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-0.5 text-center">
            {days.map((day) => {
              const iso = toISO(day);
              return (
                <button
                  key={iso}
                  type="button"
                  className={`calendar-day ${day.getMonth() !== view.getMonth() ? 'out' : ''} ${iso === toISO(today) ? 'today' : ''} ${iso === value ? 'selected' : ''}`}
                  onClick={() => pick(day)}
                  aria-label={day.toDateString()}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mx-1 border-t border-divider" />
        <div className="flex flex-wrap gap-1.5 p-2">
          {[['Today', 0], ['Tomorrow', 1], ['Next week', 7]].map(([text, offset]) => (
            <button key={text} type="button" className="rounded-full border border-line bg-white px-3 py-1.5 text-[11.5px] font-semibold text-accent-deep hover:border-accent hover:bg-surface" onClick={() => quick(offset)}>
              {text}
            </button>
          ))}
          <button type="button" className="rounded-full border border-line bg-white px-3 py-1.5 text-[11.5px] font-semibold text-accent-deep hover:border-accent hover:bg-surface" onClick={() => quick(null)}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export const SIDE_OPTIONS = [
  {
    value: 'groom',
    label: 'Groom Side',
    description: 'Family & friends of the groom',
    tone: 'groom',
    icon: UserRound
  },
  {
    value: 'bride',
    label: 'Bride Side',
    description: 'Family & friends of the bride',
    tone: 'bride',
    icon: Flower2
  },
  {
    value: 'both',
    label: 'Both Sides',
    description: 'Shared expense of the couple',
    tone: 'both',
    icon: Heart
  }
];
