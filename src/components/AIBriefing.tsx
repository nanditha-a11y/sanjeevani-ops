import { motion } from 'framer-motion';
import { Sparkles, Wifi } from 'lucide-react';
import { useOpsStore } from '../store/useOpsStore';
import { Bed, LabTest } from '../types';

function countBlockedDischarges(beds: Bed[], labTests: LabTest[]) {
  const blockerIds = new Set(labTests.filter((t) => t.isDischargeBlocker && t.status !== 'completed').map((t) => t.id));
  return beds.filter((b) => b.blockedByTaskId && blockerIds.has(b.blockedByTaskId)).length;
}

function findPrimaryBlocker(labTests: LabTest[]) {
  return labTests.find((t) => t.isDischargeBlocker && t.status !== 'completed');
}

export function AIBriefing() {
  const hospitalHealthScore = useOpsStore((s) => s.hospitalHealthScore);
  const beds = useOpsStore((s) => s.beds);
  const labTests = useOpsStore((s) => s.labTests);
  const blockedCount = countBlockedDischarges(beds, labTests);
  const blocker = findPrimaryBlocker(labTests);

  return (
    <motion.div
      className="glass-card rounded-2xl p-6 mb-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Purple glow accent */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: '#7C3AED' }} />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-10" style={{ background: '#A855F7' }} />

      <div className="flex items-start gap-4 relative z-10">
        {/* Sparkle icon */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 rounded-xl blur-md opacity-40" style={{ background: 'rgba(124, 58, 237, 0.3)' }} />
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#7C3AED]" />
            <span className="text-sm font-semibold text-[#7C3AED] uppercase tracking-wider">Executive AI Briefing</span>
          </div>

          <p className="text-base text-slate-200 leading-relaxed">
            Good morning, Dr. Suresh. Sanjeevani Operational Health is at{' '}
            <span className="font-bold text-white">{hospitalHealthScore}/100</span>.
            {blockedCount > 0 ? (
              <>
                {' '}
                Primary Bottleneck:{' '}
                <span className="text-[#F59E0B] font-semibold">
                  {blockedCount} blocked discharge-blocks in Ward B
                </span>{' '}
                are threatening Emergency Intake over the next 2 hours. Root Cause:{' '}
                <span className="text-[#EF4444] font-semibold">
                  Overdue Lab Report #{blocker?.id} holding Bed B12 clearance.
                </span>
              </>
            ) : (
              <> Operational flow is stable. No discharge blockers active.</>
            )}
          </p>

          {/* Live Signal Sync badge */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Live Signal Sync</span>
            </div>
            <span className="text-xs text-slate-500">Updated in real-time</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
