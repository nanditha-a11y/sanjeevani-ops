import { useOpsStore } from '../store/useOpsStore';

export function IsolationAndEmergencyPortal() {
  const isolationRooms = useOpsStore((state) => state.isolationRooms);
  const campaigns = useOpsStore((state) => state.campaigns);
  const completeRoomSanitization = useOpsStore((state) => state.completeRoomSanitization);
  const incrementBloodDrive = useOpsStore((state) => state.incrementBloodDrive);

  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <section aria-labelledby="isolation-title" className="glass-panel p-5 sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Infection prevention</p>
          <h2 id="isolation-title" className="mt-1 text-lg font-bold text-slate-900">Isolation Ward Status</h2>
          <p className="mt-1 text-sm text-slate-600">Room pressure and decontamination readiness for safe bed turnover.</p>
        </div>
        <div className="space-y-3">
          {isolationRooms.map((room) => {
            const needsDecon = room.sanitizationStatus === 'pending_decon';
            return (
              <article key={room.roomId} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{room.roomNumber}</h3>
                    <p className="mt-1 text-sm text-slate-600">{room.patientName}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    needsDecon ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}>
                    {needsDecon ? 'Pending decontamination' : 'Sanitized · ready'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-slate-700">{room.airPressure} pressure</span>
                  <span className="rounded-md bg-teal-50 px-2.5 py-1 text-teal-700">{room.isolationType} isolation</span>
                </div>
                {needsDecon ? (
                  <button
                    id={`quick-sanitize-${room.roomId}`}
                    data-help-action="sanitize"
                    type="button"
                    onClick={() => completeRoomSanitization(room.roomId)}
                    className="mt-4 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    1-Click Sanitize
                  </button>
                ) : (
                  <p className="mt-4 text-xs font-medium text-emerald-700">Room can be assigned when clinically appropriate.</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="campaign-title" className="glass-panel p-5 sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Community campaigns</p>
          <h2 id="campaign-title" className="mt-1 text-lg font-bold text-slate-900">Blood Drive Inventory</h2>
          <p className="mt-1 text-sm text-slate-600">Live contribution totals for emergency blood supply planning.</p>
        </div>
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const progress = Math.min(100, Math.round((campaign.collectedUnits / campaign.targetUnits) * 100));
            return (
              <article key={campaign.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{campaign.title}</h3>
                    <p className="mt-1 text-xs text-slate-600">{campaign.impactSummary}</p>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {campaign.status}
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <p className="font-mono text-2xl font-bold text-teal-700">{campaign.collectedUnits}<span className="ml-1 text-sm font-medium text-slate-500">/ {campaign.targetUnits} units</span></p>
                  <span className="text-xs text-slate-500">{progress}% of target</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <button
                  id={`quick-donation-${campaign.id}`}
                  data-help-action="donation"
                  type="button"
                  disabled={campaign.collectedUnits >= campaign.targetUnits}
                  onClick={() => incrementBloodDrive(campaign.id)}
                  className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Quick Update · +1 unit
                </button>
              </article>
            );
          })}
          {campaigns.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No active blood drives.</p>}
        </div>
      </section>
    </div>
  );
}

export function InsurancePortal() {
  const claims = useOpsStore((state) => state.insuranceClaims);
  const clearInsuranceClaim = useOpsStore((state) => state.clearInsuranceClaim);
  const sortedClaims = [...claims].sort((first, second) => {
    const criticalOrder = Number(second.patientHealthStatus === 'critical') - Number(first.patientHealthStatus === 'critical');
    return criticalOrder || first.deadlineMinutesLeft - second.deadlineMinutesLeft;
  });

  return (
    <section aria-labelledby="insurance-title" className="glass-panel p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Insurance pre-clearance</p>
          <h2 id="insurance-title" className="mt-1 text-lg font-bold text-slate-900">Insurance &amp; TPA Desk</h2>
          <p className="mt-1 text-sm text-slate-600">Critical patients are prioritized first, then by the nearest approval deadline.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">{claims.length} claims</span>
      </div>
      <div className="space-y-3">
        {sortedClaims.map((claim) => {
          const needsSignoff = claim.requiresSuperintendentSignoff && claim.approvalStatus === 'pending';
          const isApproved = claim.approvalStatus === 'pre_approved';
          const isUrgent = claim.patientHealthStatus === 'critical' && claim.deadlineMinutesLeft <= 60 && !isApproved;
          return (
            <article key={claim.claimId} className={`rounded-xl border bg-white p-4 ${isUrgent ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{claim.patientName}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      claim.patientHealthStatus === 'critical' ? 'bg-rose-50 text-rose-700' : 'bg-teal-50 text-teal-700'
                    }`}>
                      {claim.patientHealthStatus}
                    </span>
                    {needsSignoff && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Superintendent sign-off required
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{claim.claimId} · {claim.tpaProvider}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-bold text-slate-900">${claim.claimAmount.toFixed(2)}</p>
                  <p className={`text-xs font-semibold ${isUrgent ? 'text-rose-700' : 'text-slate-500'}`}>
                    {claim.deadlineMinutesLeft} min remaining
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  isApproved ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : claim.approvalStatus === 'escalated' ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}>
                  {claim.approvalStatus.replace('_', ' ')}
                </span>
                {!isApproved ? (
                  <button
                    id={`quick-tpa-${claim.claimId}`}
                    data-help-action="tpa"
                    type="button"
                    onClick={() => clearInsuranceClaim(claim.claimId)}
                    className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    {needsSignoff ? 'Superintendent Sign-off & Pre-Approve' : 'Pre-Approve TPA'}
                  </button>
                ) : (
                  <span className="text-sm font-semibold text-emerald-700">Pre-clearance complete</span>
                )}
              </div>
            </article>
          );
        })}
        {sortedClaims.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No insurance claims in the queue.</p>}
      </div>
    </section>
  );
}
