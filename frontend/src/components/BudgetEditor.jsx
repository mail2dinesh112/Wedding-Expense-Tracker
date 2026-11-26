import { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { validateBudget } from '../utils/validators';

export default function BudgetEditor({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');

  const start = () => {
    setDraft(String(value));
    setError('');
    setEditing(true);
  };

  const save = async () => {
    const message = validateBudget(draft);
    if (message) { setError(message); return; }
    await onSave(Number(draft));
    setEditing(false);
  };

  if (!editing) {
    return (
      <button type="button" className="icon-button" aria-label="Edit budget" title="Edit budget" onClick={start}>
        <Pencil size={14} />
      </button>
    );
  }

  return (
    <div className="mt-1 w-full">
      <div className="flex items-center gap-1.5">
        <span className="rounded-[10px] border border-line bg-white px-2 py-2 font-ui text-lg text-muted">₹</span>
        <input
          autoFocus
          className="field-input !py-2 font-display text-lg"
          value={draft}
          onChange={(event) => { setDraft(event.target.value); setError(''); }}
          onKeyDown={(event) => { if (event.key === 'Enter') save(); if (event.key === 'Escape') setEditing(false); }}
          aria-label="Total budget"
        />
        <button type="button" className="icon-button confirm" aria-label="Save budget" onClick={save}><Check size={14} /></button>
        <button type="button" className="icon-button" aria-label="Cancel" onClick={() => setEditing(false)}><X size={14} /></button>
      </div>
      {error && <p className="field-error mt-1">{error}</p>}
    </div>
  );
}
