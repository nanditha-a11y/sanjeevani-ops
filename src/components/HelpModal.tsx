import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { appPages, type AppPage } from './Navigation';

const guides: Record<AppPage, { purpose: string; reason: string; actions: Array<{ key: string; label: string }> }> = {
  executive: {
    purpose: 'Shows the hospital-wide AI briefing, health score, causal bottleneck path, and urgent operational actions.',
    reason: 'A shared executive view helps teams see the highest-impact constraint and dispatch a response quickly.',
    actions: [{ key: 'dispatch', label: 'Approve & dispatch an alert' }],
  },
  isolation: {
    purpose: 'Monitors isolation-room pressure, HEPA filter health, decontamination lockouts, and technician safety checks.',
    reason: 'Isolation Wards use negative pressure to stop viral spread and protect patients and staff during bed turnover.',
    actions: [{ key: 'decon', label: 'Complete decontamination and unlock' }],
  },
  wards: {
    purpose: 'Shows live occupied and vacant beds, nurse-to-patient ratios, patient assignments, and discharge readiness for each ward type.',
    reason: 'Ward-specific rosters help staff spot bottlenecks and fast-track eligible discharges without searching multiple lists.',
    actions: [{ key: 'ward-fasttrack', label: 'Fast-track a ward discharge' }],
  },
  campaigns: {
    purpose: 'Tracks blood-bank reserves, donor arrivals, check-ins, and today’s collection goal.',
    reason: 'Blood Drives help ED staff know whether emergency blood supply is available for surgery.',
    actions: [
      { key: 'sms', label: 'Broadcast an emergency donor SMS' },
      { key: 'checkin', label: 'Check a donor in' },
      { key: 'donation-unit', label: 'Log a donation unit' },
    ],
  },
  discharge: {
    purpose: 'Shows each patient’s itemized account, clearance status, discharge milestones, and bed-release eligibility.',
    reason: 'Real-time billing transparency helps patients leave promptly after treatment and safely releases beds.',
    actions: [
      { key: 'bill', label: 'Clear a billing item' },
      { key: 'release-bed', label: 'Release an eligible bed' },
    ],
  },
  insurance: {
    purpose: 'Prioritizes TPA claims by patient urgency and deadline, with pre-filled clinical summaries and emergency overrides.',
    reason: 'Pre-clearance and timed escalation reduce paperwork delays; worsening vitals can bypass routine approval wait.',
    actions: [
      { key: 'preapprove', label: 'Pre-approve a claim' },
      { key: 'override', label: 'Use an emergency TPA override' },
    ],
  },
  trash: {
    purpose: 'Reviews archived patient, ward, isolation, blood-drive, and insurance records.',
    reason: 'Soft deletion preserves recoverability and gives administrators a review window before permanent removal.',
    actions: [],
  },
  about: {
    purpose: 'Provides an editable institutional profile with clinical overview, capacity, quality metrics, leadership, and community programs.',
    reason: 'Administrators can maintain approved About Us information in one place. Accreditation, ranking, and safety claims should be verified before publication.',
    actions: [],
  },
  agent: {
    purpose: 'Answers operational questions from current dashboard state and can expose safe one-click follow-up actions.',
    reason: 'A contextual assistant gives staff a faster way to find bottlenecks, discharge readiness, isolation alerts, blood reserves, and TPA deadlines.',
    actions: [],
  },
};

interface HelpModalProps {
  currentPage: AppPage;
}

export function HelpModal({ currentPage }: HelpModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const guide = guides[currentPage];

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const highlight = (key: string, label: string) => {
    const target = document.querySelector<HTMLElement>(`[data-help-action="${key}"]`);
    if (!target) {
      setMessage('This action is not available right now.');
      return;
    }
    document.querySelectorAll('.help-highlight').forEach((element) => element.classList.remove('help-highlight'));
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('help-highlight');
    setMessage(`Highlighted: ${label}`);
    setIsOpen(false);
    window.setTimeout(() => {
      target.classList.remove('help-highlight');
      setMessage('');
    }, 3500);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation assistant"
        aria-haspopup="dialog"
        onClick={() => { setMessage(''); setIsOpen(true); }}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-teal-600 text-xl font-bold text-white shadow-xl shadow-teal-700/25 transition hover:scale-105 hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200"
      >
        ?
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35 p-3 backdrop-blur-sm sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsOpen(false);
            }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="help-title"
              className="glass-panel max-h-[90vh] w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-6"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Navigation assistant</p>
                  <h2 id="help-title" className="mt-1 text-xl font-bold text-slate-900">How this page helps</h2>
                </div>
                <button
                  type="button"
                  aria-label="Close help"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                  {appPages.find((page) => page.id === currentPage)?.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{guide.purpose}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{guide.reason}</p>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Quick Update buttons change the shared operations data immediately. This avoids delayed manual entry and makes updates visible across the other pages.
              </p>
              <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm leading-relaxed text-slate-700">
                Click any Category Pill at the top of a page to inspect live vacancy rates, sensor readings, patient rosters, or billing status specific to that unit.
              </p>
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-900">Highlight an action on this page</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {guide.actions.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() => highlight(action.key, action.label)}
                      className="rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
      {!isOpen && message && (
        <div role="status" className="fixed bottom-5 left-5 z-40 max-w-xs rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm font-medium text-teal-800 shadow-lg">
          {message}
        </div>
      )}
    </>
  );
}
