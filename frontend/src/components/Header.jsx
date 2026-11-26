import { Heart, LogOut } from 'lucide-react';
import { formatLongDate } from '../utils/formatters';

const overlay = 'linear-gradient(90deg, rgba(255,250,245,0.74) 0%, rgba(255,250,245,0.5) 38%, rgba(255,250,245,0.04) 68%)';

export default function Header({ wedding, onLogout }) {
  const base = import.meta.env.BASE_URL;

  return (
    <>
      <button type="button" className="btn-ghost fixed right-4 top-4 z-[60] !py-1.5 !text-xs" onClick={onLogout}>
        <LogOut size={14} /> Sign out
      </button>

      <header
      className="relative overflow-hidden px-6 pb-16 pt-5 text-cocoa"
      style={{ backgroundColor: '#F7D9A8', backgroundImage: `${overlay}, url('${base}assets/images/hero-background.webp')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="relative z-10 mx-auto max-w-[1160px]">
        <img
          src={`${base}assets/images/couple.webp`}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[100px] right-[-126px] z-0 w-[clamp(240px,25vw,330px)] drop-shadow-[0_14px_22px_rgba(74,42,35,0.18)] max-sm:right-1/2 max-sm:bottom-[-80px] max-sm:w-[210px] max-sm:translate-x-1/2"
        />

        <div className="relative z-[1] mx-auto mt-2 max-w-[660px] -translate-x-25 text-center max-sm:translate-x-0 max-sm:mx-0 max-sm:pb-[190px]">
          <div className="mb-3 text-2xl text-accent-deep opacity-80">✦</div>
          <p className="mb-2.5 text-xs font-medium uppercase tracking-[0.3em] text-cocoa/80">Together with their families</p>
          <h1 className="hero-title m-0 text-[clamp(32px,6vw,56px)] leading-[1.15] text-cocoa">
            <span className="hero-name">{wedding?.groom || 'Dinesh'}</span>
            {' '}
            <span className="hero-heart mx-2">♥</span>
            {' '}
            <span className="hero-name">{wedding?.bride || 'Suthesi'}</span>
          </h1>
          <p className="mt-3 font-ui text-sm font-medium uppercase tracking-[0.2em]">Wedding Expense Tracker</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-cocoa/30 bg-white/25 px-4 py-1.5 font-ui text-[13px] font-medium tracking-wider">
            {formatLongDate(wedding?.wedding_date || '2026-12-14')}
          </p>
        </div>
      </div>
      </header>
    </>
  );
}
