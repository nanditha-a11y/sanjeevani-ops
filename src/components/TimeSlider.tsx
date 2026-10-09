import { motion } from 'framer-motion';
import { Clock, Activity } from 'lucide-react';
import { useOpsStore } from '../store/useOpsStore';

const OFFSETS = ['NOW', '+1h', '+2h', '+4h'] as const;
type Offset = (typeof OFFSETS)[number];

function getBannerText(offset: string) {
  switch (offset) {
    case 'NOW':
      return null;
    case '+1h':
      return 'Predictive Mode: Simulating capacity and bed intake for +1 Hour';
    case '+2h':
      return 'Predictive Mode: Simulating capacity and bed intake for +2 Hours';
    case '+4h':
      return 'Predictive Mode: Simulating capacity and bed intake for +4 Hours';
    default:
      return null;
  }
}

export function TimeSlider() {
  const activeTimeOffset = useOpsStore((s) => s.activeTimeOffset);
  const setTimeOffset = useOpsStore((s) => s.setTimeOffset);

  return (
    <div className="mb-6">
      {/* Time offset pills */}
      <div className="flex flex-wrap gap-2 justify-center">
        {OFFSETS.map((offset) => {
          const isActive = activeTimeOffset === offset;
          return (
            <motion.button
              key={offset}
              onClick={() => setTimeOffset(offset)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                isActive
                  ? 'bg-[#7C3AED] text-white shadow-lg shadow-purple-500/30'
                  : 'bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:border-purple-500/30 hover:bg-slate-700/50'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              {offset === 'NOW' && (
                <Clock className="w-3.5 h-3.5" />
              )}
              {offset === '+1h' && (
                <Clock className="w-3.5 h-3.5" />
              )}
              {offset === '+2h' && (
                <Clock className="w-3.5 h-3.5" />
              )}
              {offset === '+4h' && (
                <Clock className="w-3.5 h-3.5" />
              )}
              {offset}
            </motion.button>
          );
        })}
      </div>

      {/* Predictive mode banner */}
      {activeTimeOffset !== 'NOW' && (
        <motion.div
          className="mt-4 glass-card rounded-xl px-5 py-3 flex items-center gap-3 border-l-4"
          style={{ borderLeftColor: '#7C3AED' }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full blur-sm opacity-40" style={{ background: 'rgba(124, 58, 237, 0.3)' }} />
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-200">{getBannerText(activeTimeOffset)}</p>
            <p className="text-xs text-slate-500 mt-0.5">All metrics reflect projected state at {activeTimeOffset}</p>
          </div>
          <button
            onClick={() => setTimeOffset('NOW')}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 transition-colors"
          >
            Reset
          </button>
        </motion.div>
      )}
    </div>
  );
}
