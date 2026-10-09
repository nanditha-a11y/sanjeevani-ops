import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertOctagon, ClipboardList, Clock3, FileCheck2, Plus, Trash2 } from 'lucide-react';
import { CategorySelector } from './CategorySelector';
import { PatientLink } from './PatientLink';
import { LabQueue } from './LabQueue';
import { useOpsStore } from '../store/useOpsStore';

const claimCategories = [
  { value: 'cashless', label: 'Cashless Pre-Auth' },
  { value: 'reimbursement', label: 'Reimbursement Claim' },
  { value: 'enhancement', label: 'Enhancement Approval' },
  { value: 'copay', label: 'Co-Payment / Deductible' },
  { value: 'denial', label: 'Denial / Query Rejection' },
] as const;

export function InsurancePage({ focus }: { focus?: 'lab-fast-track' }) {
  const claims = useOpsStore((state) => state.insuranceClaims);
  const clearInsuranceClaim = useOpsStore((state) => state.clearInsuranceClaim);
  const emergencyTpaOverride = useOpsStore((state) => state.emergencyTpaOverride);
  const escalateExpiredClaims = useOpsStore((state) => state.escalateExpiredClaims);
  const addInsuranceClaim = useOpsStore((state) => state.addInsuranceClaim);
  const moveToTrash = useOpsStore((state) => state.moveToTrash);
  const isAdmin = useOpsStore((state) => state.currentUser?.role === 'hospital_admin');
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);
  const [claimCategory, setClaimCategory] = useState<(typeof claimCategories)[number]['value']>('cashless');
  const [selectedProvider, setSelectedProvider] = useState('HealthSure TPA');
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newProvider, setNewProvider] = useState('HealthSure TPA');
  const [newAmount, setNewAmount] = useState('');
  const [newDeadline, setNewDeadline] = useState('60');
  const [newCriticality, setNewCriticality] = useState<'critical' | 'stable'>('stable');
  const providers = [...new Set(claims.map((claim) => claim.tpaProvider))];

  useEffect(() => {
    if (focus === 'lab-fast-track') {
      window.setTimeout(() => document.getElementById('lab-fast-track')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [focus]);

  useEffect(() => {
    const timer = window.setInterval(escalateExpiredClaims, 60_000);
    return () => window.clearInterval(timer);
  }, [escalateExpiredClaims]);

  const sortedClaims = claims.filter((claim) => claim.claimType === claimCategory && claim.tpaProvider === selectedProvider).sort((first, second) => {
    const urgency = Number(second.patientHealthStatus === 'critical') - Number(first.patientHealthStatus === 'critical');
    return urgency || first.deadlineMinutesLeft - second.deadlineMinutesLeft;
  });

  return (
    <main className="mx-auto max-w-[1400px] space-y-5">
      <header className="glass-panel flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Page 6 · Financial coordination</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Insurance &amp; Emergency Overrides</h1>
          <p className="mt-2 text-sm text-slate-600">Resolve TPA pre-clearance quickly; clinical deterioration bypasses the routine approval queue.</p>
        </div>
        <button type="button" onClick={() => setClaimModalOpen(true)} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"><Plus aria-hidden="true" className="mr-1 inline h-4 w-4" /> New Claim Entry</button>
      </header>

      <section className="glass-panel p-5" aria-label="TPA provider overview">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Provider groups</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {providers.map((provider) => {
            const providerClaims = claims.filter((claim) => claim.tpaProvider === provider);
            const urgent = providerClaims.some((claim) => claim.approvalStatus === 'pending' && claim.deadlineMinutesLeft <= 30);
            const pending = providerClaims.filter((claim) => claim.approvalStatus === 'pending').length;
            const tone = urgent ? 'border-rose-200 bg-rose-50 text-rose-800' : pending ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800';
            return (
              <button key={provider} type="button" onClick={() => setSelectedProvider(provider)} className={`rounded-xl border p-4 text-left ${selectedProvider === provider ? 'border-teal-300 bg-teal-50 ring-2 ring-teal-100' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between gap-2"><span className="font-semibold text-slate-900">{provider}</span><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${tone}`}>{urgent ? 'Critical deadline' : pending ? 'Review queue' : 'Normal'}</span></div>
                <p className="mt-2 text-xs text-slate-500">{pending} pending of {providerClaims.length} claims</p>
              </button>
            );
          })}
        </div>
      </section>

      <CategorySelector label="Insurance claim categories" options={claimCategories} value={claimCategory} onChange={setClaimCategory} />
      <AnimatePresence mode="wait">
        <motion.section
          key={claimCategory}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          aria-label="Insurance claims prioritized by patient condition and deadline"
          className="space-y-4"
        >
        {sortedClaims.map((claim) => {
          const isApproved = claim.approvalStatus === 'pre_approved';
          const isExpired = claim.approvalStatus === 'escalated' || claim.deadlineMinutesLeft === 0;
          const isUrgent = claim.patientHealthStatus === 'critical' && claim.deadlineMinutesLeft <= 30 && !isApproved;
          const expanded = expandedClaim === claim.claimId;
          return (
            <article key={claim.claimId} className={`glass-panel overflow-hidden p-5 sm:p-6 ${isUrgent ? 'border-rose-300' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">Claim #{claim.claimId}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      claim.patientHealthStatus === 'critical' ? 'bg-rose-50 text-rose-700' : 'bg-teal-50 text-teal-700'
                    }`}>{claim.patientHealthStatus === 'critical' ? 'Critical Patient' : 'Stable Patient'}</span>
                    {claim.vitalsWorsening && !isApproved && (
                      <span className="animate-pulse rounded-full border border-rose-300 bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800">
                        Vitals Worsening
                      </span>
                    )}
                    {isExpired && (
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                        Auto-Escalated to Superintendent
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600"><PatientLink patientName={claim.patientName} className="font-medium" /> · {claim.tpaProvider}</p>
                </div>
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                  isUrgent ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-slate-200 bg-white text-slate-700'
                }`}>
                  <Clock3 aria-hidden="true" className="h-4 w-4" />
                  <div>
                    <p className="font-mono text-sm font-bold tabular-nums">{String(claim.deadlineMinutesLeft).padStart(2, '0')}:00</p>
                    <p className="text-[10px]">{isExpired ? 'Escalation triggered' : 'mins before auto-escalation'}</p>
                  </div>
                </div>
              </div>

              {claim.requiresSuperintendentSignoff && !isApproved && (
                <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                  <AlertOctagon aria-hidden="true" className="h-4 w-4" />
                  Critical deadline · Superintendent sign-off required
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-lg font-bold text-slate-900">${claim.claimAmount.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">Approval status: {claim.approvalStatus.replace('_', ' ')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpandedClaim(expanded ? null : claim.claimId)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <ClipboardList aria-hidden="true" className="mr-2 inline h-4 w-4 text-teal-700" />
                    {expanded ? 'Hide claim summary' : 'View pre-filled claim summary'}
                  </button>
                  {!isApproved && claim.vitalsWorsening && (
                    <button
                      data-help-action="override"
                      type="button"
                      onClick={() => emergencyTpaOverride(claim.claimId)}
                      className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                    >
                      Emergency Pre-Auth Override
                    </button>
                  )}
                  {!isApproved && !claim.vitalsWorsening && (
                    <button
                      data-help-action="preapprove"
                      type="button"
                      onClick={() => clearInsuranceClaim(claim.claimId)}
                      className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                    >
                      {claim.claimType === 'denial' ? 'Re-Submit Clinical Record' : 'Pre-Approve TPA'}
                    </button>
                  )}
                  {isApproved && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                      <FileCheck2 aria-hidden="true" className="h-4 w-4" /> Pre-clearance complete
                    </span>
                  )}
                  <button type="button" disabled={!isAdmin} title={!isAdmin ? 'Sign in as a Hospital Admin to archive claims.' : undefined} onClick={() => moveToTrash('Insurance Claim', claim.claimId, 'Moved from TPA provider queue')} aria-label={`Move claim ${claim.claimId} to trash`} className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
                </div>
              </div>

              {expanded && (
                <div className="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-teal-700">Pre-filled doctor notes</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{claim.doctorNotes}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-teal-700">ICD codes &amp; attached lab results</h3>
                    <ul className="mt-2 space-y-1">
                      {claim.icdCodes.map((code) => (
                        <li key={code} className="text-sm font-semibold text-slate-700">ICD-10: {code}</li>
                      ))}
                      {claim.attachedLabResults.map((result) => (
                        <li key={result} className="text-sm text-slate-700">· {result}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </article>
          );
        })}
        {sortedClaims.length === 0 && <div className="glass-panel p-6 text-sm text-slate-600">No {claimCategories.find((category) => category.value === claimCategory)?.label} claims are currently queued for {selectedProvider}.</div>}
        </motion.section>
      </AnimatePresence>

      <section id="lab-fast-track" aria-label="Lab fast-track queue" className="scroll-mt-28 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Diagnostic coordination</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Lab Fast-Track</h2>
        </div>
        <LabQueue />
      </section>

      <AnimatePresence>
        {claimModalOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setClaimModalOpen(false); }}>
            <motion.form className="glass-panel w-full max-w-md space-y-4 bg-white p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onSubmit={(event) => {
              event.preventDefault();
              const amount = Number(newAmount);
              const deadline = Number(newDeadline);
              if (!newPatientName.trim() || !newProvider.trim() || !Number.isFinite(amount) || amount <= 0 || !Number.isInteger(deadline) || deadline < 1) return;
              addInsuranceClaim({
                patientName: newPatientName.trim(),
                patientHealthStatus: newCriticality,
                claimAmount: amount,
                tpaProvider: newProvider.trim(),
                deadlineMinutesLeft: deadline,
                approvalStatus: 'pending',
                requiresSuperintendentSignoff: newCriticality === 'critical' && deadline <= 30,
                vitalsWorsening: newCriticality === 'critical',
                doctorNotes: 'New claim entry; clinical summary pending.',
                attachedLabResults: [],
                claimType: claimCategory,
                icdCodes: [],
              });
              setNewPatientName('');
              setNewAmount('');
              setSelectedProvider(newProvider.trim());
              setClaimModalOpen(false);
            }}>
              <h2 className="text-xl font-bold text-slate-900">New Claim Entry</h2>
              <label className="block text-sm font-medium text-slate-700">Patient Name<input required value={newPatientName} onChange={(event) => setNewPatientName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
              <label className="block text-sm font-medium text-slate-700">TPA Provider<input required value={newProvider} onChange={(event) => setNewProvider(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
              <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-slate-700">Claim Amount<input required type="number" min="0.01" step="0.01" value={newAmount} onChange={(event) => setNewAmount(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label><label className="text-sm font-medium text-slate-700">Deadline (minutes)<input required type="number" min="1" value={newDeadline} onChange={(event) => setNewDeadline(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label></div>
              <label className="block text-sm font-medium text-slate-700">Patient Criticality<select value={newCriticality} onChange={(event) => setNewCriticality(event.target.value as 'critical' | 'stable')} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"><option value="stable">Stable Patient</option><option value="critical">Critical Patient</option></select></label>
              <p className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900">Claim type: {claimCategories.find((category) => category.value === claimCategory)?.label}</p>
              <button type="submit" className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white hover:bg-teal-700">Create Claim</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
