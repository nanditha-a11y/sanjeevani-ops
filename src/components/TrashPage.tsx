import { ArchiveRestore, Trash2 } from 'lucide-react';
import { useOpsStore } from '../store/useOpsStore';

export function TrashPage() {
  const records = useOpsStore((state) => state.trashRecords);
  const isAdmin = useOpsStore((state) => state.currentUser?.role === 'hospital_admin');
  const restoreFromTrash = useOpsStore((state) => state.restoreFromTrash);
  const permanentlyDelete = useOpsStore((state) => state.permanentlyDelete);

  return (
    <main className="mx-auto max-w-[1400px] space-y-5">
      <header className="glass-panel p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Page 7 · Administrative archive</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Trash &amp; Archives</h1>
        <p className="mt-2 text-sm text-slate-600">Soft-deleted operational records remain recoverable until explicitly and permanently removed.</p>
      </header>

      <section className="glass-panel overflow-hidden" aria-label="Archived records">
        <div className="hidden grid-cols-[1fr_2fr_1.2fr_2fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
          <span>Record Type</span><span>Item Name / ID</span><span>Deleted Date</span><span>Reason</span><span>Actions</span>
        </div>
        <div className="divide-y divide-slate-100">
          {records.map((record) => (
            <article key={record.id} className="grid gap-3 p-5 md:grid-cols-[1fr_2fr_1.2fr_2fr_auto] md:items-center md:gap-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:hidden">Record type · </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{record.recordType}</span>
              </div>
              <p className="font-semibold text-slate-900">{record.itemName} <span className="font-mono text-xs text-slate-500">· {record.id}</span></p>
              <time className="text-sm text-slate-600" dateTime={record.deletedAt}>{new Date(record.deletedAt).toLocaleString()}</time>
              <p className="text-sm text-slate-600">{record.reason}</p>
              <div className="flex gap-2">
                <button type="button" disabled={!isAdmin} title={!isAdmin ? 'Sign in as a Hospital Admin to restore records.' : undefined} onClick={() => restoreFromTrash(record.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-40">
                  <ArchiveRestore aria-hidden="true" className="h-4 w-4" /> Restore Record
                </button>
                <button type="button" disabled={!isAdmin} title={!isAdmin ? 'Sign in as a Hospital Admin to permanently delete records.' : undefined} onClick={() => {
                  if (window.confirm(`Permanently delete ${record.itemName}? This cannot be undone.`)) permanentlyDelete(record.id);
                }} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40">
                  <Trash2 aria-hidden="true" className="h-4 w-4" /> Permanently Delete
                </button>
              </div>
            </article>
          ))}
          {records.length === 0 && <p className="p-8 text-center text-sm text-slate-600">Trash is empty. Soft-deleted records will appear here for restoration or permanent removal.</p>}
        </div>
      </section>
    </main>
  );
}
