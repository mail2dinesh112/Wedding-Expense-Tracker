import { Plus, Search, Users, X } from 'lucide-react';
import { DateDropdown, SIDE_OPTIONS, SideDropdown } from './Dropdown';

export default function ExpenseToolbar({ filters, onFilterChange, onClear, onAdd }) {
  const active = Boolean(
    filters.search.trim() || filters.fromDate || filters.toDate || filters.side !== 'all'
  );

  const sideOptions = [
    {
      value: 'all',
      label: 'All Sides',
      description: 'Groom and bride expenses',
      tone: 'both',
      icon: Users
    },
    ...SIDE_OPTIONS
  ];

  return (
    <div className="flex flex-wrap items-end gap-3 px-6 py-5">
      <div className="relative min-w-[180px] flex-1 sm:max-w-[300px]">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-accent" />
        <input
          type="search"
          className="field-input !rounded-full !py-2.5 !pl-10"
          placeholder="Search expenses by name..."
          aria-label="Search expenses by name"
          value={filters.search}
          onChange={(event) => onFilterChange({ search: event.target.value })}
        />
      </div>

      <div className="min-w-[150px] flex-1 sm:max-w-[190px]">
        <label className="field-label">From Date</label>
        <DateDropdown
          label="Filter from date"
          value={filters.fromDate}
          onChange={(value) => onFilterChange({ fromDate: value })}
          placeholder={{ title: 'Any date', sub: 'From date' }}
        />
      </div>

      <div className="min-w-[150px] flex-1 sm:max-w-[190px]">
        <label className="field-label">To Date</label>
        <DateDropdown
          label="Filter to date"
          value={filters.toDate}
          onChange={(value) => onFilterChange({ toDate: value })}
          placeholder={{ title: 'Any date', sub: 'To date' }}
        />
      </div>

      <div className="min-w-[150px] flex-1 sm:max-w-[190px]">
        <label className="field-label">Expense Side</label>
        <SideDropdown
          label="Filter by side"
          value={filters.side}
          onChange={(value) => onFilterChange({ side: value })}
          options={sideOptions}
          triggerIcon={Users}
          placeholder={{ title: 'All Sides', sub: 'Groom and bride expenses' }}
        />
      </div>

      {active && (
        <button type="button" className="icon-button !h-10 !w-10 !rounded-[10px]" aria-label="Clear filters" title="Clear filters" onClick={onClear}>
          <X size={16} />
        </button>
      )}

      <button type="button" className="btn-primary ml-auto" onClick={onAdd}>
        <Plus size={16} /> Add Expense
      </button>
    </div>
  );
}
