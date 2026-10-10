import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BedDouble, HeartPulse, MessageSquareWarning, Sparkles } from 'lucide-react';
import { useOpsStore } from '../store/useOpsStore';
import { PatientAwareText } from './PatientLink';
import type { OperationalAlert } from '../types';
import { CausalFlow } from './CausalFlow';
import type { AppPage } from './Navigation';
import { ActionQueueToolbar, sortAndFilterAlerts, type AlertFilter, type AlertSort } from './ActionQueueToolbar';

function ExecutiveAlert({ alert, onDispatch }: { alert: OperationalAlert; onDispatch: (alertId: string) => void }) {
  const urgencyStyle = alert.urgency === 'high'
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : alert.urgency === 'medium'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-teal-200 bg-teal-50 text-teal-800';
  const urgencyIconColor = alert.urgency === 'high'
    ? 'text-rose-700'
    : alert.urgency === 'medium'
      ? 'text-amber-800'
      : 'text-teal-800';
  return (
    <article className={`rounded-xl border bg-white p-4 ${alert.urgency === 'high' ? 'border-l-4 border-l-rose-500' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className={`rounded-lg p-2 ${alert.urgency === 'high' ? 'bg-rose-50' : alert.urgency === 'medium' ? 'bg-amber-50' : 'bg-teal-50'}`}>
            <AlertTriangle aria-hidden="true" className={`h-5 w-5 ${urgencyIconColor}`} />
          </span>
          <div>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${urgencyStyle}`}>{alert.urgency === 'medium' ? 'moderate' : alert.urgency} priority</span>
            <h3 className="mt-2 text-sm font-bold text-slate-900">{alert.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600"><PatientAwareText text={alert.description} /></p>
          </div>
        </div>
        <button
          data-help-action="dispatch"
          type="button"
          onClick={() => onDispatch(alert.id)}
          className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          Approve &amp; Dispatch
        </button>
      </div>
    </article>
  );
}

function AnalogClock({ now }: { now: Date }) {
  const seconds = now.getSeconds();
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;
  const hand = (angle: number, length: number, width: number, color: string) => (
    <line x1="50" y1="50" x2="50" y2={50 - length} stroke={color} strokeWidth={width} strokeLinecap="round" transform={`rotate(${angle} 50 50)`} />
  );
  return (
    <svg role="img" aria-label={`Analog clock, ${now.toLocaleTimeString()}`} viewBox="0 0 100 100" className="h-16 w-16" aria-hidden="false">
      <circle cx="50" cy="50" r="46" fill="white" stroke="#99F6E4" strokeWidth="3" />
      {[...Array(12)].map((_, index) => {
        const angle = index * 30 * Math.PI / 180;
        return <circle key={index} cx={50 + Math.sin(angle) * 38} cy={50 - Math.cos(angle) * 38} r={index % 3 === 0 ? 1.5 : 1} fill="#0F766E" />;
      })}
      {hand(hours * 30, 22, 4, '#0F172A')}
      {hand(minutes * 6, 31, 2.8, '#0F766E')}
      {hand(seconds * 6, 36, 1.2, '#F97360')}
      <circle cx="50" cy="50" r="2.5" fill="#0F766E" />
    </svg>
  );
}

export function CommandCenter({ onNavigate }: { onNavigate: (page: AppPage, focus?: 'vacant-beds' | 'hdu' | 'lab-fast-track') => void }) {
  const alerts = useOpsStore((state) => state.alerts);
  const beds = useOpsStore((state) => state.beds);
  const patients = useOpsStore((state) => state.patients);
  const labTests = useOpsStore((state) => state.labTests);
  const isolationRooms = useOpsStore((state) => state.isolationRooms);
  const campaigns = useOpsStore((state) => state.campaigns);
  const bloodInventory = useOpsStore((state) => state.bloodInventory);
  const patientFeedback = useOpsStore((state) => state.patientFeedback);
  const updatePatientFeedbackStatus = useOpsStore((state) => state.updatePatientFeedbackStatus);
  const openPatientRecord = useOpsStore((state) => state.openPatientRecord);
  const dispatchAction = useOpsStore((state) => state.dispatchAction);
  const [now, setNow] = useState(() => new Date());
  const [alertFilter, setAlertFilter] = useState<AlertFilter>('all');
  const [alertSort, setAlertSort] = useState<AlertSort>('priority');

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const sortedAlerts = sortAndFilterAlerts(alerts, alertFilter, alertSort);
  const criticalAlerts = sortedAlerts.filter((alert) => alert.urgency === 'high');
  const pendingBlocker = [...labTests]
    .filter((test) => test.isDischargeBlocker && test.status !== 'completed')
    .sort((first, second) => second.requestedTimeMinutesAgo - first.requestedTimeMinutesAgo)[0];
  const blockerBed = pendingBlocker
    ? beds.find((bed) => bed.blockedByTaskId === pendingBlocker.id)
    : undefined;
  const blockerPending = Boolean(pendingBlocker);
  const activePatients = patients.filter((patient) => patient.status !== 'discharged').length;
  const availableBeds = beds.filter((bed) => bed.occupancyStatus === 'available').length;
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const isolationNeedsAttention = isolationRooms.filter((room) => room.sanitizationStatus === 'pending_decon' || room.hepaFilterHealth < 75).length;
  const campaign = campaigns.find((item) => item.status === 'active');
  const feedbackAlerts = patientFeedback
    .filter((feedback) => feedback.status !== 'resolved')
    .sort((a, b) => {
      const severity = { high: 0, medium: 1, low: 2 };
      return severity[a.severity] - severity[b.severity] || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    })
    .slice(0, 3);

  return (
    <main className="mx-auto max-w-[1400px] space-y-5">
      <header className="glass-panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-teal-200 bg-teal-50 p-2.5 text-teal-700"><HeartPulse aria-hidden="true" className="h-6 w-6" /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Page 1 · Executive operations</p>
            <h1 className="text-xl font-bold text-slate-900">Executive Command Center</h1>
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex flex-col items-center">
            <AnalogClock now={now} />
            <span className="mt-1 text-center font-mono text-xs font-semibold tabular-nums text-slate-800">{time} · Local Hospital Time</span>
          </div>
        </div>
      </header>

      <section className="glass-panel relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-teal-100/70 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <span className="rounded-xl bg-teal-50 p-2.5 text-teal-700"><Sparkles aria-hidden="true" className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">AI Executive Briefing</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{blockerPending ? `Operational bottleneck: ${blockerBed?.ward ?? 'discharge'} throughput` : 'Operational status: discharge diagnostics'}</h2>
            <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-600">
              {blockerPending
                ? `Pending ${pendingBlocker?.testName} for ${pendingBlocker?.patientName} is holding ${blockerBed?.bedNumber ?? 'a bed'} at ${blockerBed?.dischargeReadiness ?? 0}% discharge readiness. Review the linked diagnostic and discharge tasks to restore capacity.`
                : 'No discharge-blocking diagnostics are currently pending. Continue monitoring ward capacity and time-sensitive claims from their dedicated operational pages.'}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => onNavigate('wards')} className="glass-panel flex items-center gap-3 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50/40">
          <Activity aria-hidden="true" className="h-5 w-5 text-teal-700" />
          <div><p className="text-xs text-slate-500">Active patients</p><p className="text-lg font-bold text-slate-900">{activePatients}</p></div>
        </button>
        <button type="button" onClick={() => onNavigate('wards', 'vacant-beds')} className="glass-panel flex items-center gap-3 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40">
          <BedDouble aria-hidden="true" className="h-5 w-5 text-teal-700" />
          <div><p className="text-xs text-slate-500">Available beds</p><p className="text-lg font-bold text-slate-900">{availableBeds}</p></div>
        </button>
        <button type="button" onClick={() => document.getElementById('action-center')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="glass-panel flex items-center gap-3 p-4 text-left transition hover:border-rose-300 hover:bg-rose-50/40">
          <AlertTriangle aria-hidden="true" className="h-5 w-5 text-rose-700" />
          <div><p className="text-xs text-slate-500">High-priority actions</p><p className="text-lg font-bold text-slate-900">{criticalAlerts.length}</p></div>
        </button>
      </div>

      <section aria-labelledby="causal-flow-title" className="glass-panel p-5 sm:p-6">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Live dependencies</p>
          <h2 id="causal-flow-title" className="mt-1 text-lg font-bold text-slate-900">Causal Flow Graph</h2>
        </div>
        <CausalFlow onNavigate={onNavigate} />
      </section>

      <section aria-label="Department traffic" className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => onNavigate('isolation')} className="glass-panel flex items-center justify-between gap-4 p-4 text-left transition hover:border-amber-300 hover:bg-amber-50/40">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Department traffic</p><p className="mt-1 font-semibold text-slate-900">Isolation Status</p><p className="mt-1 text-xs text-slate-600">{isolationRooms.length} rooms · {isolationNeedsAttention} requiring attention</p></div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isolationNeedsAttention ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>{isolationNeedsAttention ? 'Review' : 'Stable'}</span>
        </button>
        <button type="button" onClick={() => onNavigate('campaigns')} className="glass-panel flex items-center justify-between gap-4 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50/40">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Emergency supply</p><p className="mt-1 font-semibold text-slate-900">Blood Reserves</p><p className="mt-1 text-xs text-slate-600">{bloodInventory.map((item) => `${item.bloodType}: ${item.currentUnits}`).join(' · ')}</p></div>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">{campaign ? `${campaign.collectedUnits}/${campaign.targetUnits} units` : 'No active drive'}</span>
        </button>
      </section>

      <section aria-labelledby="patient-feedback-title" className="glass-panel p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-amber-50 p-2 text-amber-800"><MessageSquareWarning aria-hidden="true" className="h-5 w-5" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Patient experience</p>
              <h2 id="patient-feedback-title" className="mt-0.5 text-lg font-bold text-slate-900">Patient Satisfaction &amp; Feedback Alerts</h2>
            </div>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">{patientFeedback.filter((feedback) => feedback.status !== 'resolved').length} unresolved</span>
        </div>
        <div className="space-y-2">
          {feedbackAlerts.map((feedback) => (
            <article key={feedback.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-100 bg-white p-3">
              <button type="button" onClick={() => { if (feedback.patientId) openPatientRecord(feedback.patientId); }} className="min-w-0 flex-1 text-left">
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${feedback.severity === 'high' ? 'bg-rose-100 text-rose-800' : feedback.severity === 'medium' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>{feedback.severity}</span>
                <span className="ml-2 text-sm font-semibold text-slate-900">{feedback.patientName} · {feedback.category}</span>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">{feedback.issueDescription}</p>
                <p className="mt-1 text-[11px] text-slate-500">{feedback.department} · {feedback.status} · {new Date(feedback.timestamp).toLocaleString()}</p>
              </button>
              <button type="button" onClick={() => updatePatientFeedbackStatus(feedback.id, 'resolved')} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">Resolve</button>
            </article>
          ))}
          {!feedbackAlerts.length && <p className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">No unresolved patient complaints.</p>}
        </div>
      </section>

      <section id="action-center" aria-labelledby="action-center-title" className="scroll-mt-28 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Immediate response</p>
          <h2 id="action-center-title" className="mt-1 text-lg font-bold text-slate-900">Action Center</h2>
        </div>
        <ActionQueueToolbar filter={alertFilter} onFilterChange={setAlertFilter} sort={alertSort} onSortChange={setAlertSort} />
        {sortedAlerts.length ? sortedAlerts.map((alert) => (
          <ExecutiveAlert key={alert.id} alert={alert} onDispatch={dispatchAction} />
        )) : <div className="glass-panel p-5 text-sm text-emerald-800">No operational alerts are active.</div>}
      </section>
    </main>
  );
}
