import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOpsStore } from '../store/useOpsStore';
import { Clock, CheckCircle2 } from 'lucide-react';

function getHealthColor(score: number) {
  if (score > 80) return '#14B8A6';
  if (score >= 60) return '#14B8A6';
  return '#E07A5F';
}

function getHealthGlow(score: number) {
  if (score > 80) return 'rgba(20, 184, 166, 0.4)';
  if (score >= 60) return 'rgba(20, 184, 166, 0.35)';
  return 'rgba(239, 68, 68, 0.4)';
}

function getShiftLabel(hours: number) {
  if (hours >= 6 && hours < 12) return 'Morning Shift';
  if (hours >= 12 && hours < 18) return 'Afternoon Shift';
  if (hours >= 18 && hours < 24) return 'Evening Shift';
  return 'Night Shift';
}

export function Header() {
  const healthScore = useOpsStore((s) => s.hospitalHealthScore);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = String(minutes).padStart(2, '0');
  const timeString = `${displayHours}:${displayMinutes} ${ampm}`;
  const shiftLabel = getShiftLabel(hours);
  const color = getHealthColor(healthScore);
  const glow = getHealthGlow(healthScore);

  return (
    <header className="w-full mb-8">
      <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }}
        />

        {/* Logo & Title */}
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12">
            <div
              className="absolute inset-0 rounded-xl blur-md opacity-60"
              style={{ background: `radial-gradient(circle, ${glow}, transparent)` }}
            />
            <div
              className="relative w-12 h-12 rounded-xl flex items-center justify-center text-teal-700 font-bold text-xl border border-teal-200 bg-teal-50"
            >
              S
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              Sanjeevani Ops AI Command Center
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">Hospital Intelligence Network</p>
          </div>
        </div>

        {/* Right side: clock + health gauge */}
        <div className="flex items-center gap-6">
          {/* Live Clock */}
          <div className="glass-panel flex items-center gap-3 px-4 py-2 rounded-xl">
            <Clock className="w-4 h-4 text-teal-700" />
            <div>
              <div className="text-sm font-semibold text-[#0F172A]">{timeString}</div>
              <div className="text-xs text-slate-500">{shiftLabel}</div>
            </div>
            <div className="ml-2 w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
          </div>

          {/* Health Score Gauge */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Glow backlight */}
            <div
              className="absolute inset-0 rounded-full blur-xl"
              style={{
                background: `radial-gradient(circle, ${glow}, transparent 70%)`,
                opacity: 0.7,
              }}
            />
            {/* Outer ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="rgba(20, 184, 166, 0.2)"
                strokeWidth="8"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${healthScore * 3.14} 314`}
                initial={{ strokeDasharray: '0 314' }}
                animate={{ strokeDasharray: `${healthScore * 3.14} 314` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{
                  filter: `drop-shadow(0 0 6px ${glow})`,
                }}
              />
            </svg>
            {/* Center text */}
            <div className="relative flex flex-col items-center justify-center z-10">
              <motion.span
                className="text-3xl font-bold text-teal-700"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {healthScore}
              </motion.span>
              <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
