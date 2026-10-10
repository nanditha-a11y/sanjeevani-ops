import { BedDouble, CheckCircle2, FlaskConical } from 'lucide-react';
import { useOpsStore } from '../store/useOpsStore';

export function WardHub() {
  const beds = useOpsStore((state) => state.beds);
  const patients = useOpsStore((state) => state.patients);
  const labTests = useOpsStore((state) => state.labTests);
  const completeLabTest = useOpsStore((state) => state.completeLabTest);
  const clearBillingItem = useOpsStore((state) => state.clearBillingItem);
  const sortedBeds = [...beds].sort((first, second) => second.dischargeReadiness - first.dischargeReadiness);
  const primaryBlocker = [...labTests]
    .filter((test) => test.isDischargeBlocker && test.status !== 'completed')
    .sort((first, second) => second.requestedTimeMinutesAgo - first.requestedTimeMinutesAgo)[0];

  return (
    <section aria-labelledby="ward-hub-title" className="glass-panel p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Reverse triage</p>
          <h2 id="ward-hub-title" className="mt-1 text-lg font-bold text-slate-900">Ward Discharge Hub</h2>
          <p className="mt-1 text-sm text-slate-600">Beds sorted by discharge readiness, highest first.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
          {beds.length} beds monitored
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {sortedBeds.map((bed) => {
          const blockingTest = bed.blockedByTaskId === primaryBlocker?.id ? primaryBlocker : undefined;
          const blockingPatient = blockingTest && patients.find((patient) => patient.id === blockingTest.patientId);
          const hasRecoveryOpportunity = bed.dischargeReadiness >= 80;
          return (
            <article
              key={bed.id}
              className={`rounded-xl border bg-white p-4 ${
                blockingTest ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-teal-50 p-2 text-teal-700">
                    <BedDouble aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900">Bed {bed.bedNumber}</h3>
                    <p className="text-xs text-slate-500">{bed.ward} · {bed.occupancyStatus.replace('_', ' ')}</p>
                  </div>
                </div>
                <span className="font-mono text-lg font-bold text-teal-700">{bed.dischargeReadiness}%</span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-500"
                  style={{ width: `${bed.dischargeReadiness}%` }}
                />
              </div>

              {hasRecoveryOpportunity && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                  Instant Bed Recovery Opportunity
                </div>
              )}

              <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-700">Itemized billing</h4>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                    bed.billingStatus === 'fully_paid'
                      ? 'bg-emerald-50 text-emerald-700'
                      : bed.billingStatus === 'tpa_preauthorized'
                        ? 'bg-sky-50 text-sky-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}>
                    {bed.billingStatus.replace('_', ' ')}
                  </span>
                </div>
                <ul className="mt-2 space-y-2">
                  {bed.itemizedBill.map((item) => (
                    <li key={item.description} className="flex items-center justify-between gap-3 text-xs">
                      <span className="min-w-0 text-slate-600">{item.description} · ${item.cost.toFixed(2)}</span>
                      {item.cleared ? (
                        <span className="shrink-0 font-medium text-emerald-700">Cleared</span>
                      ) : (
                        <button
                          id={`quick-bill-${bed.id}-${item.description.toLowerCase().replace(/ /g, '-')}`}
                          data-help-action="billing"
                          type="button"
                          onClick={() => clearBillingItem(bed.id, item.description)}
                          className="shrink-0 rounded-md border border-teal-200 bg-teal-50 px-2 py-1 font-semibold text-teal-700 transition hover:bg-teal-100"
                        >
                          Quick clear
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {blockingTest && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                    <FlaskConical aria-hidden="true" className="h-4 w-4 shrink-0" />
                    Blocked by Pending Lab {blockingTest.id}
                  </div>
                  <p className="text-xs text-slate-600">
                    {blockingPatient ? `${blockingPatient.name}'s discharge is waiting on diagnostic clearance.` : 'Discharge is waiting on diagnostic clearance.'}
                  </p>
                  <button
                    data-help-action="lab"
                    type="button"
                    onClick={() => completeLabTest(blockingTest.id)}
                    className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    Expedite Discharge &amp; Clear Bed
                  </button>
                </div>
              )}
              {bed.blockedByTaskId && !primaryBlocker && (
                <p className="mt-3 text-xs font-medium text-emerald-700">Diagnostics cleared · bed recovery complete.</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
