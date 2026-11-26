import { useState } from 'react';
import { Heart, Lock } from 'lucide-react';

export default function LoginPage({ onLogin, loading, error }) {
  const [password, setPassword] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    await onLogin(password);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5 py-10">
      <div className="card w-full max-w-sm overflow-hidden">
        <div className="border-b border-line bg-gradient-to-br from-surface to-white px-7 py-8 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FDE9DC] text-accent-deep">
            <Heart size={22} />
          </span>
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Dinesh &amp; Suthesi</p>
          <h1 className="mb-0 mt-1 font-display text-3xl text-accent-deep">Wedding Expense Tracker</h1>
        </div>
        <form onSubmit={submit} className="p-7">
          <label className="field-label" htmlFor="password">Administrator password</label>
          <div className="relative mt-1.5">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="field-input !pl-10"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error && <p className="field-error mt-2">{error}</p>}
          <button type="submit" className="btn-primary mt-5 w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
