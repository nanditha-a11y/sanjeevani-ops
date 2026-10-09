import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Building2, HeartHandshake, Hospital, Pencil, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { useOpsStore } from '../store/useOpsStore';
import type { AboutUsContent } from '../types';

const textSections: Array<{ key: Exclude<keyof AboutUsContent, 'bedCapacity'>; label: string }> = [
  { key: 'mission', label: 'Mission' },
  { key: 'history', label: 'Institutional History' },
  { key: 'specialtyCenters', label: 'Specialty Centers' },
  { key: 'ownership', label: 'Ownership & Academic Status' },
  { key: 'accreditations', label: 'Accreditations' },
  { key: 'safetyRating', label: 'Safety Rating' },
  { key: 'nationalRanking', label: 'National Ranking' },
  { key: 'performanceMetrics', label: 'Key Performance Metrics' },
  { key: 'leadership', label: 'Leadership & Board' },
  { key: 'affiliations', label: 'Research & University Affiliations' },
  { key: 'communityOutreach', label: 'Community Outreach' },
];

export function AboutPage() {
  const content = useOpsStore((state) => state.aboutUsContent);
  const isAdmin = useOpsStore((state) => state.currentUser?.role === 'hospital_admin');
  const updateContent = useOpsStore((state) => state.updateAboutUsContent);
  const resetSection = useOpsStore((state) => state.resetAboutUsSection);
  const clearSection = useOpsStore((state) => state.clearAboutUsSection);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(content);

  const openEditor = () => {
    setDraft(content);
    setEditOpen(true);
  };

  const saveChanges = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!Number.isInteger(draft.bedCapacity) || draft.bedCapacity < 0) return;
    updateContent(draft);
    setEditOpen(false);
  };

  return (
    <main className="mx-auto max-w-[1400px] space-y-5">
      <header className="glass-panel flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Institutional profile</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">About Sanjeevani Hospital</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">Institutional overview, clinical capabilities, leadership, and community programs.</p>
        </div>
        <button type="button" disabled={!isAdmin} title={!isAdmin ? 'Sign in as a Hospital Admin to edit this page.' : undefined} onClick={openEditor} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">
          <Pencil aria-hidden="true" className="mr-2 inline h-4 w-4" /> Edit About Us Info
        </button>
      </header>

      <div role="note" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        This is demonstration profile content. Verify institutional details, certifications, ratings, and rankings before publishing.
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <article className="glass-panel p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-teal-50 p-2.5 text-teal-700"><HeartHandshake aria-hidden="true" className="h-5 w-5" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Our purpose</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Clinical Overview &amp; Credibility</h2>
            </div>
          </div>
          <SectionText label="Mission" value={content.mission} onClear={() => clearSection('mission')} onReset={() => resetSection('mission')} />
          <SectionText label="Institutional History" value={content.history} onClear={() => clearSection('history')} onReset={() => resetSection('history')} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricCard icon={Hospital} label="Bed Capacity" value={content.bedCapacity ? `${content.bedCapacity} beds` : ''} onClear={() => clearSection('bedCapacity')} onReset={() => resetSection('bedCapacity')} />
            <MetricCard icon={Building2} label="Ownership & Academic Status" value={content.ownership} onClear={() => clearSection('ownership')} onReset={() => resetSection('ownership')} />
          </div>
          <SectionText label="Specialty Centers" value={content.specialtyCenters} onClear={() => clearSection('specialtyCenters')} onReset={() => resetSection('specialtyCenters')} />
        </article>

        <article className="glass-panel p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-amber-50 p-2.5 text-amber-700"><Award aria-hidden="true" className="h-5 w-5" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Quality &amp; outcomes</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Accreditations &amp; Metrics</h2>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Accreditation status badges, verification required">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">JCI · Verify status</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">NABH · Verify status</span>
          </div>
          <SectionText label="Accreditations" value={content.accreditations} onClear={() => clearSection('accreditations')} onReset={() => resetSection('accreditations')} />
          <SectionText label="Safety Rating" value={content.safetyRating} onClear={() => clearSection('safetyRating')} onReset={() => resetSection('safetyRating')} />
          <SectionText label="National Ranking" value={content.nationalRanking} onClear={() => clearSection('nationalRanking')} onReset={() => resetSection('nationalRanking')} />
          <SectionText label="Performance Metrics" value={content.performanceMetrics} onClear={() => clearSection('performanceMetrics')} onReset={() => resetSection('performanceMetrics')} />
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard icon={HeartHandshake} label="Leadership & Centers of Excellence" value={content.leadership} onClear={() => clearSection('leadership')} onReset={() => resetSection('leadership')} />
        <InfoCard icon={Building2} label="Research & University Affiliations" value={content.affiliations} onClear={() => clearSection('affiliations')} onReset={() => resetSection('affiliations')} />
        <InfoCard icon={ShieldCheck} label="Community Outreach" value={content.communityOutreach} onClear={() => clearSection('communityOutreach')} onReset={() => resetSection('communityOutreach')} />
      </section>

      <AnimatePresence>
        {editOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setEditOpen(false); }}>
            <motion.form role="dialog" aria-modal="true" aria-labelledby="about-edit-title" onSubmit={saveChanges} className="glass-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white p-5 sm:p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Administrative controls</p>
                  <h2 id="about-edit-title" className="mt-1 text-xl font-bold text-slate-900">Edit About Us Information</h2>
                </div>
                <button type="button" aria-label="Close About editor" onClick={() => setEditOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X aria-hidden="true" className="h-5 w-5" /></button>
              </div>
              <label className="mb-4 block text-sm font-medium text-slate-700">Bed Capacity
                <input type="number" min="0" step="1" value={draft.bedCapacity} onChange={(event) => setDraft({ ...draft, bedCapacity: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
              </label>
              <div className="space-y-3">
                {textSections.map(({ key, label }) => (
                  <label key={key} className="block text-sm font-medium text-slate-700">{label}
                    <textarea rows={2} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
                  </label>
                ))}
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setEditOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">Save Changes</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function SectionText({ label, value, onClear, onReset }: { label: string; value: string; onClear: () => void; onReset: () => void }) {
  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">{label}</h3>
        <SectionControls onClear={onClear} onReset={onReset} />
      </div>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{value || <span className="italic text-slate-400">Section cleared.</span>}</p>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, onClear, onReset }: { icon: typeof Hospital; label: string; value: string; onClear: () => void; onReset: () => void }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-teal-700"><Icon aria-hidden="true" className="h-4 w-4" /><h3 className="text-xs font-semibold text-slate-700">{label}</h3></div>
        <SectionControls onClear={onClear} onReset={onReset} />
      </div>
      <p className="mt-3 text-sm font-medium text-slate-800">{value || <span className="italic text-slate-400">Section cleared.</span>}</p>
    </section>
  );
}

function InfoCard({ icon: Icon, label, value, onClear, onReset }: { icon: typeof HeartHandshake; label: string; value: string; onClear: () => void; onReset: () => void }) {
  return (
    <article className="glass-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2"><Icon aria-hidden="true" className="h-5 w-5 text-teal-700" /><h2 className="font-semibold text-slate-900">{label}</h2></div>
        <SectionControls onClear={onClear} onReset={onReset} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{value || <span className="italic text-slate-400">Section cleared.</span>}</p>
    </article>
  );
}

function SectionControls({ onClear, onReset }: { onClear: () => void; onReset: () => void }) {
  const isAdmin = useOpsStore((state) => state.currentUser?.role === 'hospital_admin');
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" disabled={!isAdmin} title={!isAdmin ? 'Sign in as a Hospital Admin to edit this section.' : undefined} onClick={onClear} className="rounded-md px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-400">Clear section</button>
      <button type="button" disabled={!isAdmin} aria-label="Reset section to demo defaults" title={!isAdmin ? 'Sign in as a Hospital Admin to edit this section.' : undefined} onClick={onReset} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"><RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /></button>
    </div>
  );
}
