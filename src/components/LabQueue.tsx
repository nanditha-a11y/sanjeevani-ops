import { motion } from 'framer-motion';
import { CheckCircle2, Clock3, FlaskConical } from 'lucide-react';
import { useOpsStore } from '../store/useOpsStore';
import { PatientLink } from './PatientLink';

export function LabQueue() {
  const labTests = useOpsStore((state) => state.labTests);
  const beds = useOpsStore((state) => state.beds);
  const completeLabTest = useOpsStore((state) => state.completeLabTest);
  const priorityTests = labTests
    .filter((test) => test.isDischargeBlocker && test.status !== 'completed')
    .sort((first, second) => second.requestedTimeMinutesAgo - first.requestedTimeMinutesAgo);
  const otherTests = labTests.filter((test) => !test.isDischargeBlocker || test.status === 'completed');

  const renderTest = (test: (typeof labTests)[number]) => {
    const isHoldingDischarge = test.isDischargeBlocker && test.status !== 'completed';
    const linkedBed = beds.find((bed) => bed.blockedByTaskId === test.id);
    return (
      <article key={test.id} className={`rounded-xl border bg-white p-4 ${isHoldingDischarge ? 'border-rose-200' : 'border-slate-200'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className={`rounded-lg p-2 ${isHoldingDischarge ? 'bg-rose-50 text-rose-700' : 'bg-teal-50 text-teal-700'}`}>
              <FlaskConical aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900">Lab Test #{test.id.slice(1)}</h3>
                {isHoldingDischarge && (
                  <motion.span
                    className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700"
                    animate={{ opacity: [1, 0.55, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  >
                    Holding {linkedBed?.ward ?? 'Ward'} Discharge
                  </motion.span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-700">{test.testName}</p>
              <p className="mt-1 text-xs text-slate-500">
                <PatientLink patientId={test.patientId} patientName={test.patientName} /> · {test.status} · requested {test.requestedTimeMinutesAgo} min ago
              </p>
            </div>
          </div>
          {test.status === 'completed' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" /> Completed
            </span>
          ) : (
            <button
              type="button"
              onClick={() => completeLabTest(test.id)}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Mark Completed
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <section aria-labelledby="lab-queue-title" className="space-y-5">
      <div className="glass-panel p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-xl bg-rose-50 p-2.5 text-rose-700">
            <Clock3 aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">Priority lane</p>
            <h2 id="lab-queue-title" className="text-lg font-bold text-slate-900">Discharge-Blocking Tests (High Priority)</h2>
          </div>
        </div>
        <div className="space-y-3">
          {priorityTests.length > 0
            ? priorityTests.map(renderTest)
            : <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">No pending discharge-blocking tests.</p>}
        </div>
      </div>

      <div className="glass-panel p-5 sm:p-6">
        <h2 className="mb-4 text-base font-bold text-slate-900">Other Diagnostics</h2>
        <div className="space-y-3">
          {otherTests.length > 0
            ? otherTests.map(renderTest)
            : <p className="text-sm text-slate-500">No additional diagnostic tests.</p>}
        </div>
      </div>
    </section>
  );
}
