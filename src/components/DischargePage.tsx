import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, ChevronUp, Circle, ReceiptText } from 'lucide-react';
import { CategorySelector } from './CategorySelector';
import { PatientLink } from './PatientLink';
import { useOpsStore } from '../store/useOpsStore';
import type { Patient } from '../types';

const stages: Patient['dischargeStages'][number]['id'][] = [
  'doctor_signoff',
  'pharmacy_check',
  'insurance_preapproval',
  'payment_cleared',
  'going_home',
];

const dischargeTypes = [
  { value: 'regular', label: 'Regular / Planned' },
  { value: 'lama', label: 'LAMA / DAMA' },
  { value: 'transfer', label: 'Transfer / Referral' },
  { value: 'absconded', label: 'Absconded' },
] as const;

const billTypes = [
  { value: 'provisional', label: 'Provisional / Running' },
  { value: 'final', label: 'Final Settlement' },
  { value: 'credit', label: 'Credit / Panel' },
] as const;

export function DischargePage() {
  const patients = useOpsStore((state) => state.patients);
  const beds = useOpsStore((state) => state.beds);
  const clearPatientBillingItem = useOpsStore((state) => state.clearPatientBillingItem);
  const completeDischargeStage = useOpsStore((state) => state.completeDischargeStage);
  const releaseBed = useOpsStore((state) => state.releaseBed);
  const flagLamaWaiver = useOpsStore((state) => state.flagLamaWaiver);
  const [dischargeType, setDischargeType] = useState<(typeof dischargeTypes)[number]['value']>('regular');
  const [billType, setBillType] = useState<(typeof billTypes)[number]['value']>('provisional');
  const [expandedPatient, setExpandedPatient] = useState<string | null>('P009');
  const inpatientPatients = patients.filter((patient) =>
    beds.some((bed) => bed.patientId === patient.id) && patient.status !== 'discharged'
      && patient.dischargeType === dischargeType && patient.billType === billType,
  );
  const settleAndRelease = (patient: Patient, bedId: string) => {
    patient.itemizedBill.filter((item) => !item.cleared).forEach((item) => clearPatientBillingItem(patient.id, item.description));
    completeDischargeStage(patient.id, 'payment_cleared');
    releaseBed(bedId);
  };

  return (
    <main className="mx-auto max-w-[1400px] space-y-5">
      <header className="glass-panel p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Page 5 · Patient flow</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Real-Time Discharge &amp; Live Billing</h1>
        <p className="mt-2 text-sm text-slate-600">Resolve itemized charges, complete discharge milestones, and release cleared beds to housekeeping.</p>
      </header>

      <section className="glass-panel space-y-4 p-5" aria-label="Discharge and bill type selectors">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-700">Discharge type</p>
          <CategorySelector label="Discharge types" options={dischargeTypes} value={dischargeType} onChange={setDischargeType} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-700">Bill type</p>
          <CategorySelector label="Bill types" options={billTypes} value={billType} onChange={setBillType} />
        </div>
      </section>
      <AnimatePresence mode="wait">
      <motion.div
        key={`${dischargeType}-${billType}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
        className="space-y-4"
      >
        {inpatientPatients.map((patient) => {
          const bed = beds.find((item) => item.patientId === patient.id);
          if (!bed) return null;
          const isExpanded = expandedPatient === patient.id;
          const outstandingBalance = patient.itemizedBill.filter((item) => !item.cleared).reduce((total, item) => total + item.cost, 0);
          const invoiceTotal = patient.itemizedBill.reduce((total, item) => total + item.cost, 0);
          const paymentCleared = patient.dischargeStages.find((stage) => stage.id === 'payment_cleared')?.completed ?? false;
          const stage3Complete = patient.dischargeStages.find((stage) => stage.id === 'insurance_preapproval')?.completed ?? false;
          const stage4CanComplete = stage3Complete && patient.itemizedBill.every((item) => item.cleared) && !paymentCleared;

          return (
            <article key={patient.id} className="glass-panel overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-teal-50 p-2.5 text-teal-700"><ReceiptText aria-hidden="true" className="h-5 w-5" /></span>
                  <div>
                    <h2 className="font-bold text-slate-900"><PatientLink patientId={patient.id} patientName={patient.name} className="font-bold" /> <span className="font-mono text-xs font-medium text-slate-500">· {patient.id}</span></h2>
                    <p className="mt-1 text-xs text-slate-500">{patient.department} · Bed {bed.bedNumber} · {patient.billingStatus.replace('_', ' ')}</p>
                    <p className="mt-1 text-xs font-medium text-teal-800">Classification: {patient.dischargeType.toUpperCase()} · {patient.dischargeNote || 'No special discharge note'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Outstanding</p>
                    <p className={`font-mono text-lg font-bold ${outstandingBalance ? 'text-amber-700' : 'text-emerald-700'}`}>${outstandingBalance.toFixed(2)}</p>
                  </div>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedPatient(isExpanded ? null : patient.id)}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
                  >
                    {isExpanded ? <ChevronUp aria-hidden="true" className="h-4 w-4" /> : <ChevronDown aria-hidden="true" className="h-4 w-4" />}
                    <span className="sr-only">{isExpanded ? 'Collapse' : 'Expand'} billing details</span>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-200 p-5">
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <section aria-label={`${patient.name} itemized billing`}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">Live Itemized Billing Ledger</h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          outstandingBalance === 0 ? 'bg-emerald-50 text-emerald-700'
                            : patient.billingStatus === 'tpa_preauthorized' ? 'bg-sky-50 text-sky-700'
                              : 'bg-amber-50 text-amber-800'
                        }`}>
                          {outstandingBalance === 0 ? 'Cleared' : patient.billingStatus === 'tpa_preauthorized' ? 'TPA Pre-Approved' : 'Pending TPA / Payment'}
                        </span>
                      </div>
                      <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-3">
                        {patient.itemizedBill.map((item) => (
                          <li key={item.description} className="flex items-center justify-between gap-3 py-3 text-sm">
                            <div>
                              <p className="font-medium text-slate-800">{item.description}</p>
                              <p className="text-xs text-slate-500">{item.cleared ? 'Clearance recorded' : 'Awaiting clearance'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-semibold text-slate-800">${item.cost.toFixed(2)}</span>
                              {item.cleared ? (
                                <span className="text-xs font-semibold text-emerald-700">Cleared</span>
                              ) : (
                                <button
                                  data-help-action="bill"
                                  type="button"
                                  onClick={() => clearPatientBillingItem(patient.id, item.description)}
                                  className="rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100"
                                >
                                  Quick clear
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                        <span className="font-medium text-slate-600">Invoice total</span>
                        <span className="font-mono font-bold text-slate-900">${invoiceTotal.toFixed(2)}</span>
                      </div>
                    </section>

                    <section aria-label={`${patient.name} discharge milestones`}>
                      <h3 className="text-sm font-bold text-slate-900">Discharge Progress Tracker</h3>
                      <ol className="mt-3 space-y-2">
                        {patient.dischargeStages.map((stage, index) => {
                          const canComplete = index > 0 && !stage.completed
                            && (index === 3 ? stage4CanComplete : index === 4 ? paymentCleared : patient.dischargeStages[index - 1].completed);
                          const allEarlierDone = index === 0 || patient.dischargeStages[index - 1].completed;
                          return (
                            <li key={stage.id} className={`flex items-center justify-between gap-3 rounded-lg border p-2.5 ${
                              stage.completed ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-white'
                            }`}>
                              <div className="flex items-center gap-2.5">
                                {stage.completed
                                  ? <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-700" />
                                  : <Circle aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-300" />}
                                <span className={`text-xs font-semibold ${stage.completed ? 'text-emerald-800' : 'text-slate-700'}`}>
                                  {index + 1}. {stage.label}
                                </span>
                              </div>
                              {!stage.completed && index < 4 && (
                                <button
                                  type="button"
                                  disabled={
                                    !allEarlierDone
                                    || (index === 2 && patient.billingStatus !== 'tpa_preauthorized')
                                    || (index === 3 && !stage4CanComplete)
                                  }
                                  onClick={() => completeDischargeStage(patient.id, stage.id)}
                                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-teal-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:text-slate-400"
                                >
                                  {index === 2 && patient.billingStatus !== 'tpa_preauthorized'
                                    ? 'Awaiting TPA'
                                    : index === 3 && !patient.itemizedBill.every((item) => item.cleared)
                                      ? 'Clear ledger first'
                                      : 'Mark complete'}
                                </button>
                              )}
                              {index === 4 && !stage.completed && (
                                <button
                                  data-help-action="release-bed"
                                  type="button"
                                  disabled={!paymentCleared}
                                  onClick={() => releaseBed(bed.id)}
                                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                  Release Bed to Housekeeping
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ol>
                      {paymentCleared && (
                        <button
                          data-help-action="release-bed"
                          type="button"
                          onClick={() => releaseBed(bed.id)}
                          className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          Release Bed to Housekeeping
                        </button>
                      )}
                    </section>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
                {patient.dischargeType === 'lama' && (
                  <button
                    type="button"
                    onClick={() => flagLamaWaiver(patient.id)}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                  >
                    {patient.lamaWaiverFlagged ? 'LAMA Legal Waiver Flagged' : 'Flag LAMA Legal Waiver'}
                  </button>
                )}
                <button
                  type="button"
                  disabled={!patient.dischargeStages.find((stage) => stage.id === 'insurance_preapproval')?.completed}
                  onClick={() => settleAndRelease(patient, bed.id)}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Settle Bill &amp; Release Bed
                </button>
              </div>
            </article>
          );
        })}
        {inpatientPatients.length === 0 && <div className="glass-panel p-6 text-center text-sm text-slate-600">No active inpatient discharges match this type combination.</div>}
      </motion.div>
      </AnimatePresence>
    </main>
  );
}
