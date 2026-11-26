export default function LoadingScreen({ label = 'Loading wedding data…' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-bg px-6">
      <div className="loader-ring" role="status" aria-label="Loading" />
      <p className="font-ui text-xs font-semibold uppercase tracking-[0.22em] text-muted">{label}</p>
    </div>
  );
}
