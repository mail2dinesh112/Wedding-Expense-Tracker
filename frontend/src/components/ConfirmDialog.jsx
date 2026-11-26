export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-cocoa/45 p-5 backdrop-blur-sm" onClick={onCancel}>
      <div className="card w-full max-w-sm p-6" role="alertdialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2 className="m-0 font-display text-2xl text-accent-deep">Delete expense</h2>
        <p className="my-4 text-sm text-muted">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn-primary" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}
