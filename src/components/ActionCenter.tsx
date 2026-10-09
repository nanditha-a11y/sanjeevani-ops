import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, Zap, Clock, Pause, Play, ChevronDown, ChevronUp, CheckCircle2, Target } from 'lucide-react';
import { useOpsStore } from '../store/useOpsStore';
import { PatientAwareText } from './PatientLink';
import { ActionQueueToolbar, sortAndFilterAlerts, type AlertFilter, type AlertSort } from './ActionQueueToolbar';

type Urgency = 'high' | 'medium' | 'low';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'auto';
}

const URGENCY_CONFIG: Record<Urgency, { label: string; color: string; bg: string; border: string; badgeBg: string; badgeText: string; accent: string }> = {
  high: {
    label: 'High',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    badgeText: 'text-rose-700',
    accent: '#E07A5F',
  },
  medium: {
    label: 'Moderate',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeText: 'text-amber-700',
    accent: '#D97706',
  },
  low: {
    label: 'Low',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    badgeText: 'text-sky-700',
    accent: '#0EA5E9',
  },
};

function parseBlastRadius(summary: string) {
  const matches = summary.match(/(\d+)\s*(Ward Bed|ED Intake Patient|patient|bed)/gi);
  if (!matches) return summary;
  const wardBeds = summary.match(/(\d+)\s*Ward Bed/i)?.[1] || '0';
  const edPatients = summary.match(/(\d+)\s*ED Intake Patient/i)?.[1] || summary.match(/(\d+)\s*patient/i)?.[1] || '0';
  if (wardBeds !== '0' && edPatients !== '0') {
    return `Impacts: ${wardBeds} Ward Bed${parseInt(wardBeds) > 1 ? 's' : ''}, ${edPatients} ED Intake Patient${parseInt(edPatients) > 1 ? 's' : ''}`;
  }
  return summary;
}

function ActionCard({ alert, onDispatch, onAutoExecute }: {
  alert: ReturnType<typeof useOpsStore.getState>['alerts'][0];
  onDispatch: (id: string) => void;
  onAutoExecute: (id: string) => void;
}) {
  const config = URGENCY_CONFIG[alert.urgency];
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(alert.urgency !== 'low' ? alert.autoPilotSecondsLeft : null);
  const [localToast, setLocalToast] = useState<Toast | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasAutoExecutedRef = useRef(false);

  const isTimerRelevant = alert.urgency !== 'low';
  const totalSeconds = isTimerRelevant ? (alert.autoPilotSecondsLeft > 0 ? alert.autoPilotSecondsLeft : 180) : 180;
  const progress = timeLeft !== null ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  const minutes = Math.floor((timeLeft ?? 0) / 60);
  const seconds = (timeLeft ?? 0) % 60;

  useEffect(() => {
    if (!isTimerRelevant || isPaused || timeLeft === 0) return;

    wasAutoExecutedRef.current = false;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onAutoExecute(alert.id);
          setLocalToast({
            id: `auto-${alert.id}`,
            message: 'Auto-Executed by Operational AI',
            type: 'auto',
          });
          wasAutoExecutedRef.current = true;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTimerRelevant, isPaused, alert.id, onAutoExecute]);

  useEffect(() => {
    if (localToast) {
      const timer = setTimeout(() => setLocalToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [localToast]);

  const handleDispatch = () => {
    onDispatch(alert.id);
    setLocalToast({
      id: `dispatch-${alert.id}`,
      message: 'Dispatch sent to Head of Diagnostics & Ward B Lead',
      type: 'success',
    });
  };

  const togglePause = () => {
    if (timeLeft === 0) return;
    setIsPaused((p) => !p);
  };

  const urgencyIcon = alert.urgency === 'high' ? AlertTriangle : alert.urgency === 'medium' ? AlertCircle : Info;
  type UrgencyIconType = typeof AlertTriangle;
  return (
    <div className="glass-panel rounded-2xl p-5 border-l-4 relative overflow-hidden" style={{ borderLeftColor: config.accent }}>
      {/* Accent glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none" style={{ background: config.accent }} />

      {/* Toast notification */}
      <AnimatePresence>
        {localToast && (
          <motion.div
            className={`absolute -top-3 right-4 px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg border ${
              localToast.type === 'auto'
                ? 'bg-slate-50 text-teal-700 border-teal-200'
                : 'bg-teal-50 text-teal-700 border-teal-200'
            }`}
            initial={{ opacity: 0, y: -10, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -10, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {localToast.type === 'auto' ? (
              <>
                <Zap className="w-3 h-3 inline mr-1" />
                {localToast.message}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 inline mr-1" />
                {localToast.message}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`p-2 rounded-lg ${config.bg} border ${config.border}`}>
            {React.createElement(urgencyIcon as React.ComponentType<{ className?: string }>, { className: `w-4 h-4 ${config.color}` })}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{alert.department}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${config.badgeBg}`}>
                {config.label} Priority
              </span>
            </div>
            <h3 className="text-base font-semibold text-[#0F172A] mt-1 leading-tight">{alert.title}</h3>
          </div>
        </div>
        <div className={`flex-shrink-0 p-2 rounded-lg ${config.bg} border ${config.border}`}>
          <Target className={`w-4 h-4 ${config.color}`} />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-4 line-clamp-2"><PatientAwareText text={alert.description} /></p>

      {/* Blast Radius */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-teal-700" />
            <span className="text-xs font-medium text-slate-500">Blast Radius</span>
          </div>
          <p className="text-sm text-slate-700 mt-1 font-medium">{parseBlastRadius(alert.blastRadiusSummary)}</p>
        </div>
      </div>

      {/* Countdown Timer (high & medium only) */}
      {isTimerRelevant && (
        <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
          {/* Progress ring */}
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="4" />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={config.accent}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progress * 1.256} 125.6`}
                initial={{ strokeDasharray: '0 125.6' }}
                animate={{ strokeDasharray: `${progress * 1.256} 125.6` }}
                transition={{ duration: 0.3 }}
                style={{ filter: `drop-shadow(0 0 4px ${config.accent})` }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-bold ${config.color}`}>
                {minutes}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Timer controls */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-slate-500">Auto-Pilot Countdown</span>
              {timeLeft !== null && (
                <span className={`text-xs font-bold ${timeLeft === 0 ? 'text-rose-700' : timeLeft <= 30 ? 'text-teal-700' : config.color}`}>
                  {timeLeft === 0 ? 'Auto-Execute imminent' : `${timeLeft}s remaining`}
                </span>
              )}
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${config.accent}, ${config.accent}dd)` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={togglePause}
                disabled={timeLeft === 0 || !isTimerRelevant}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  isPaused
                    ? 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3 h-3 inline mr-1" />
                    Resume Auto-Pilot
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 inline mr-1" />
                    Pause Auto-Pilot
                  </>
                )}
              </button>
              {timeLeft !== null && timeLeft > 0 && (
                <span className="text-xs text-slate-500">
                  AI will auto-execute if unresolved
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleDispatch}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-teal-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="w-4 h-4" />
          Approve & Dispatch
        </button>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-all"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Transparency accordion */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="mt-4 pt-4 border-t border-slate-200"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="glass-panel rounded-xl p-4 bg-slate-50 border border-slate-200 font-mono text-xs">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-3.5 h-3.5 text-teal-700" />
                <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Why the AI Thinks This</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-teal-600 mt-0.5">▸</span>
                  <div>
                    <span className="text-slate-500">Diagnostics:</span>
                    <span className="text-slate-600 ml-1">Test #{alert.title.includes('#882') ? '882' : 'N/A'} requested 90m ago (Status: <span className="text-rose-700">Delayed</span>)</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-teal-600 mt-0.5">▸</span>
                  <div>
                    <span className="text-slate-500">Discharges:</span>
                    <span className="text-slate-600 ml-1">Patient #204 ready at 95% (Status: <span className="text-teal-700">Held by Test #882</span>)</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-rose-600 mt-0.5">▸</span>
                  <div>
                    <span className="text-slate-500">Beds:</span>
                    <span className="text-slate-600 ml-1">Ward B Occupancy = 100% (Status: <span className="text-rose-700">Capacity Lock</span>)</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200">
                <span className="text-slate-500">Data sources:</span>
                <span className="text-slate-500 ml-1">Lab Info System · Bed Management System · ED Triage Queue · Real-time Patient Tracker</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ActionCenter() {
  const alerts = useOpsStore((s) => s.alerts);
  const dispatchAction = useOpsStore((s) => s.dispatchAction);
  const [alertFilter, setAlertFilter] = useState<AlertFilter>('all');
  const [alertSort, setAlertSort] = useState<AlertSort>('priority');
  const sortedAlerts = sortAndFilterAlerts(alerts, alertFilter, alertSort);

  const handleDispatch = (id: string) => {
    dispatchAction(id);
  };

  const handleAutoExecute = (id: string) => {
    dispatchAction(id);
  };

  return (
    <motion.div
      className="glass-panel rounded-2xl p-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      {/* Purple glow accent */}
      <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-15" style={{ background: '#14B8A6' }} />

      <div className="flex items-center gap-3 mb-5 relative z-10">
        <Zap className="w-5 h-5 text-[#14B8A6]" />
        <h2 className="text-lg font-semibold text-[#0F172A]">Human-in-the-Loop Action Center</h2>
        <span className="text-xs text-slate-500 ml-2">{sortedAlerts.length} active alerts</span>
      </div>

      <div className="relative z-10 mb-4">
        <ActionQueueToolbar filter={alertFilter} onFilterChange={setAlertFilter} sort={alertSort} onSortChange={setAlertSort} />
      </div>

      {sortedAlerts.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-10 h-10 text-[#14B8A6] mx-auto mb-3" />
          <p className="text-slate-500">All alerts resolved. Operational flow is stable.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAlerts.map((alert) => (
            <ActionCard
              key={alert.id}
              alert={alert}
              onDispatch={handleDispatch}
              onAutoExecute={handleAutoExecute}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
