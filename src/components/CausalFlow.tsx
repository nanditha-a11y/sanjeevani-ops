import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, X, Zap, Clock, Hospital, FlaskConical, Home, UserMinus, CheckCircle2 } from 'lucide-react';
import { useOpsStore } from '../store/useOpsStore';
import type { AppPage } from './Navigation';

type StageId = 'ed' | 'wardB' | 'lab' | 'discharge';

interface StageNode {
  id: StageId;
  label: string;
  icon: typeof Hospital;
  status: 'normal' | 'warning' | 'critical';
  subtitle: string;
  page: AppPage;
  focus?: 'vacant-beds' | 'hdu' | 'lab-fast-track';
  waitTime?: string;
}

const STAGE_NODES: StageNode[] = [
  {
    id: 'ed',
    label: 'Emergency Dept',
    icon: Hospital,
    status: 'warning',
    subtitle: 'Active Intake',
    page: 'wards',
    focus: 'hdu',
    waitTime: '+45 min surge',
  },
  {
    id: 'wardB',
    label: 'Ward B (Beds)',
    icon: Home,
    status: 'warning',
    subtitle: '100% Occupancy',
    page: 'wards',
  },
  {
    id: 'lab',
    label: 'Diagnostic Lab',
    icon: FlaskConical,
    status: 'critical',
    subtitle: 'Overdue Test #882',
    page: 'insurance',
    focus: 'lab-fast-track',
  },
  {
    id: 'discharge',
    label: 'Discharge Hub',
    icon: UserMinus,
    status: 'normal',
    subtitle: 'Pending Clearance',
    page: 'discharge',
  },
];

export function CausalFlow({ onNavigate }: { onNavigate: (page: AppPage, focus?: 'vacant-beds' | 'hdu' | 'lab-fast-track') => void }) {
  const [activeNode, setActiveNode] = useState<StageId | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const labTests = useOpsStore((s) => s.labTests);
  const beds = useOpsStore((s) => s.beds);
  const edWaitTimes = useOpsStore((s) => s.edWaitTimes);
  const dispatchAction = useOpsStore((s) => s.dispatchAction);
  const completeLabTest = useOpsStore((s) => s.completeLabTest);

  const pendingBlocker = [...labTests]
    .filter((test) => test.isDischargeBlocker && test.status !== 'completed')
    .sort((first, second) => second.requestedTimeMinutesAgo - first.requestedTimeMinutesAgo)[0];
  const blockerBed = pendingBlocker ? beds.find((bed) => bed.blockedByTaskId === pendingBlocker.id) : undefined;
  const pendingDischargeBeds = beds.filter((bed) => bed.occupancyStatus === 'discharge_pending').length;
  const latestEdWait = [...edWaitTimes].sort((first, second) =>
    `${second.date} ${second.hour}`.localeCompare(`${first.date} ${first.hour}`),
  )[0];
  const wardNames = [...new Set(beds.map((bed) => bed.ward))];
  const monitoredWard = wardNames
    .map((name) => {
      const wardBeds = beds.filter((bed) => bed.ward === name);
      const occupied = wardBeds.filter((bed) => bed.occupancyStatus !== 'available').length;
      return { name, beds: wardBeds, occupancyPercent: wardBeds.length ? Math.round(occupied / wardBeds.length * 100) : 0 };
    })
    .find((ward) => ward.name.toLowerCase().includes('ward b'))
    ?? wardNames.map((name) => {
      const wardBeds = beds.filter((bed) => bed.ward === name);
      const occupied = wardBeds.filter((bed) => bed.occupancyStatus !== 'available').length;
      return { name, beds: wardBeds, occupancyPercent: wardBeds.length ? Math.round(occupied / wardBeds.length * 100) : 0 };
    }).sort((first, second) => second.occupancyPercent - first.occupancyPercent)[0];
  const wardBWarning = Boolean(monitoredWard && monitoredWard.occupancyPercent >= 80);
  const edWaitMinutes = latestEdWait?.averageWaitMinutes ?? null;
  const edCritical = edWaitMinutes !== null && edWaitMinutes >= 45;
  const labCritical = Boolean(pendingBlocker);

  const nodes: StageNode[] = STAGE_NODES.map((n) => {
    if (n.id === 'ed') return {
      ...n,
      status: edCritical ? 'critical' as const : edWaitMinutes !== null && edWaitMinutes >= 25 ? 'warning' as const : 'normal' as const,
      subtitle: edWaitMinutes !== null ? `Average wait: ${edWaitMinutes} min` : 'Wait data unavailable',
      waitTime: edWaitMinutes !== null ? `${edWaitMinutes} min average` : undefined,
    };
    if (n.id === 'wardB') return {
      ...n,
      status: wardBWarning ? 'warning' as const : 'normal' as const,
      subtitle: monitoredWard ? `${monitoredWard.occupancyPercent}% Occupancy` : 'No bed data',
    };
    if (n.id === 'lab') return {
      ...n,
      status: labCritical ? 'critical' as const : 'normal' as const,
      subtitle: pendingBlocker ? `Pending Test ${pendingBlocker.id}` : 'No blocking tests',
    };
    return { ...n, subtitle: `${pendingDischargeBeds} Discharge Pending` };
  });

  const statusColor = (status: StageNode['status']) => {
    switch (status) {
      case 'critical':
        return {
          border: 'border-rose-300',
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.12)]',
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          accent: '#EF4444',
        };
      case 'warning':
        return {
          border: 'border-amber-300',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.12)]',
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          accent: '#F59E0B',
        };
      default:
        return {
          border: 'border-teal-200',
          glow: 'shadow-sm',
          bg: 'bg-teal-50',
          text: 'text-teal-700',
          accent: '#64748B',
        };
    }
  };

  const openDrawer = (nodeId: StageId) => {
    setActiveNode(nodeId);
    setIsOpen(true);
  };

  const closeDrawer = () => {
    setIsOpen(false);
    setTimeout(() => setActiveNode(null), 200);
  };

  const handleDispatch = () => {
    if (pendingBlocker) {
      const linkedAlert = useOpsStore.getState().alerts.find((alert) => alert.linkedLabTestIds?.includes(pendingBlocker.id));
      if (linkedAlert) dispatchAction(linkedAlert.id);
      else completeLabTest(pendingBlocker.id);
    }
    closeDrawer();
  };

  return (
    <motion.div
      className="glass-panel rounded-2xl p-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <Activity className="w-5 h-5 text-teal-700" />
        <h2 className="text-lg font-semibold text-slate-900">Causal Bottleneck Flow</h2>
        <span className="text-xs text-slate-500 ml-2">Real-time patient flow pipeline</span>
      </div>

      {labCritical && (
        <button
          type="button"
          onClick={() => onNavigate('insurance')}
          className="mb-5 flex w-full items-center gap-3 rounded-xl border-l-4 border-rose-500 border-y border-r border-rose-200 bg-rose-50 p-4 text-left transition hover:bg-rose-100"
        >
          <AlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0 text-rose-700" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-bold uppercase tracking-wide text-rose-700">Pinned · High priority bottleneck</span>
            <span className="mt-1 block text-sm font-semibold text-rose-950">{pendingBlocker?.testName} {pendingBlocker?.id} is holding {blockerBed?.ward ?? 'ward'} discharge and Emergency Department intake.</span>
          </span>
          <span className="text-xs font-bold text-rose-800">Open fast-track →</span>
        </button>
      )}

      {/* Flow graph */}
      <div className="relative">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 120" preserveAspectRatio="none">
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#A855F7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          {/* Connection lines */}
          {[0, 1, 2].map((i) => (
            <line
              key={i}
              x1={100 + i * 200 + 40}
              y1="60"
              x2={100 + (i + 1) * 200 - 40}
              y2="60"
              stroke="url(#flowGradient)"
              strokeWidth="2"
              strokeDasharray="8 4"
            />
          ))}
          {/* Flowing pulses */}
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={`pulse-${i}`}
              cx={100 + i * 200 + 40}
              cy="60"
              r="4"
              fill="#A855F7"
              initial={{ cx: 100 + i * 200 + 40 }}
              animate={{
                cx: [100 + i * 200 + 40, 100 + (i + 1) * 200 - 40],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'linear',
              }}
              style={{ filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.6))' }}
            />
          ))}
        </svg>

        {/* Nodes */}
        <div className="relative z-10 flex justify-between items-center">
          {nodes.map((node, idx) => {
            const colors = statusColor(node.status);
            const Icon = node.icon;
            const isCritical = node.status === 'critical';
            return (
              <div key={node.id} className="flex flex-col items-center gap-1">
              <motion.button
                type="button"
                onClick={() => onNavigate(node.page, node.focus)}
                aria-label={`Open ${node.label} operations page`}
                className={`relative flex flex-col items-center gap-2 rounded-xl border bg-white p-4 transition-all duration-200 hover:bg-slate-50 ${colors.border} ${colors.glow} ${isCritical ? 'animate-pulse' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1, duration: 0.4 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Critical pulse ring */}
                {isCritical && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-red-500/30 pointer-events-none"
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <Icon className={`w-6 h-6 ${colors.text}`} />
                <span className="text-sm font-semibold text-slate-900 text-center">{node.label}</span>
                <span className={`text-xs ${colors.text} text-center`}>{node.subtitle}</span>
                {node.waitTime && (
                  <div className="flex items-center gap-1 text-xs text-rose-400">
                    <Clock className="w-3 h-3" />
                    <span>{node.waitTime}</span>
                  </div>
                )}
              </motion.button>
              <button type="button" onClick={() => openDrawer(node.id)} className="rounded-md px-2 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-100 hover:text-teal-800">Impact details</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Domino Blast Radius Drawer */}
      <AnimatePresence>
        {isOpen && activeNode && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 backdrop-blur-sm bg-slate-900/35 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
            />
            {/* Slide-over drawer */}
            <motion.div
              className="fixed right-0 top-0 bottom-0 w-full max-w-md glass-panel bg-white z-50 shadow-2xl overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-lg blur-md opacity-40" style={{ background: 'rgba(239, 68, 68, 0.3)' }} />
                    <div className="relative w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-rose-700" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Domino Blast Radius</h3>
                    <p className="text-xs text-slate-500">Causal impact analysis</p>
                  </div>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                {/* Node summary */}
                <div className="glass-panel rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {(() => {
                      const node = nodes.find((n) => n.id === activeNode);
                      const Icon = node?.icon || Activity;
                      const colors = statusColor(node?.status || 'normal');
                      return (
                        <>
                          <Icon className={`w-5 h-5 ${colors.text}`} />
                          <span className="text-sm font-semibold text-slate-900">{node?.label}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                            {node?.status}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-sm text-slate-700">
                    {activeNode === 'lab' && (pendingBlocker
                      ? `${pendingBlocker.testName} (${pendingBlocker.id}) for ${pendingBlocker.patientName} has been pending for ${pendingBlocker.requestedTimeMinutesAgo} minutes and is linked to discharge flow.`
                      : 'No pending diagnostic is currently marked as a discharge blocker.')}
                    {activeNode === 'wardB' && (monitoredWard
                      ? `${monitoredWard.name} is at ${monitoredWard.occupancyPercent}% bed occupancy with ${monitoredWard.beds.filter((bed) => bed.occupancyStatus === 'discharge_pending').length} discharges pending.`
                      : 'No ward bed data is available.')}
                    {activeNode === 'ed' && (latestEdWait && edWaitMinutes !== null
                      ? `Emergency Department average wait was ${edWaitMinutes} minutes at ${latestEdWait.date} ${latestEdWait.hour}.`
                      : 'Emergency Department wait-time data is not available.')}
                    {activeNode === 'discharge' && `${pendingDischargeBeds} beds are marked discharge-pending in the current operational data.`}
                  </p>
                </div>

                {/* Blast radius chain */}
                {activeNode === 'lab' && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-600" />
                      Blast Radius Chain
                    </h4>

                    {/* Root Cause */}
                    <div className="glass-panel rounded-xl p-4 border-l-4" style={{ borderLeftColor: '#EF4444' }}>
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0 mt-0.5">
                          <div className="absolute inset-0 rounded-full blur-sm opacity-40" style={{ background: 'rgba(239, 68, 68, 0.3)' }} />
                          <div className="relative w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-rose-700" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Root Cause</span>
                            <span className="text-xs text-slate-500">P0</span>
                          </div>
                          <p className="text-sm font-medium text-slate-900">{pendingBlocker ? `${pendingBlocker.testName} · ${pendingBlocker.id}` : 'No active blocker'}</p>
                          <p className="text-xs text-slate-500 mt-1">{pendingBlocker ? `Patient ${pendingBlocker.patientName} · ${pendingBlocker.status} · pending for ${pendingBlocker.requestedTimeMinutesAgo} mins` : 'No discharge-blocking diagnostic is currently pending.'}</p>
                          <div className="mt-2 flex items-center gap-1 text-xs text-rose-400">
                            <Clock className="w-3 h-3" />
                            <span>{pendingBlocker ? `${pendingBlocker.requestedTimeMinutesAgo} minutes pending` : 'No active delay'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Direct Impact */}
                    <div className="glass-panel rounded-xl p-4 border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0 mt-0.5">
                          <div className="absolute inset-0 rounded-full blur-sm opacity-40" style={{ background: 'rgba(245, 158, 11, 0.3)' }} />
                          <div className="relative w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                            <Home className="w-4 h-4 text-amber-700" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Direct Impact</span>
                            <span className="text-xs text-slate-500">P1</span>
                          </div>
                          <p className="text-sm font-medium text-slate-900">{blockerBed ? `Holding ${blockerBed.ward} Bed ${blockerBed.bedNumber} clearance` : 'No linked bed found'}</p>
                          <p className="text-xs text-slate-500 mt-1">{blockerBed ? `Patient ${pendingBlocker?.patientName} at ${blockerBed.dischargeReadiness}% discharge readiness — blocked by ${pendingBlocker?.id}` : 'No bed is currently linked to the primary diagnostic blocker.'}</p>
                          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                            <Activity className="w-3 h-3" />
                            <span>{blockerBed ? `${blockerBed.dischargeReadiness}% ready, 1 blocker` : 'No linked blocker'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cascade Impact */}
                    <div className="glass-panel rounded-xl p-4 border-l-4" style={{ borderLeftColor: '#14B8A6' }}>
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0 mt-0.5">
                          <div className="absolute inset-0 rounded-full blur-sm opacity-40" style={{ background: 'rgba(124, 58, 237, 0.3)' }} />
                          <div className="relative w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-purple-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Cascade Impact</span>
                            <span className="text-xs text-slate-500">P2</span>
                          </div>
                          <p className="text-sm font-medium text-slate-900">Backing up Emergency Department intake</p>
                          <p className="text-xs text-slate-500 mt-1">{edWaitMinutes !== null ? `ED average wait is ${edWaitMinutes} minutes; downstream bed capacity is ${monitoredWard?.occupancyPercent ?? 0}% occupied.` : 'ED wait-time measurements are not available.'}</p>
                          <div className="mt-2 flex items-center gap-1 text-xs text-rose-400">
                            <Clock className="w-3 h-3" />
                            <span>{edWaitMinutes !== null ? `${edWaitMinutes} min average wait` : 'No wait-time data'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action button */}
                {activeNode === 'lab' && (
                  <button
                    onClick={handleDispatch}
                    className="w-full py-3 px-5 rounded-xl bg-teal-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-teal-700 transition-all duration-200 shadow-md active:scale-[0.98]"
                  >
                    <Zap className="w-4 h-4" />
                    Quick Dispatch: Fast-Track Test
                  </button>
                )}

                {activeNode !== 'lab' && (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500">Select the Diagnostic Lab node to view the full blast radius chain.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
