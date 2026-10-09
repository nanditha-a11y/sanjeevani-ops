import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, UserRound } from 'lucide-react';
import { useOpsStore } from '../store/useOpsStore';

const quickPrompts = [
  'What is holding up Ward B?',
  'Show me patients ready for discharge',
  'Any pressure drops in Isolation?',
  'Check O-Negative blood levels',
];

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  action?: 'fast-track-lab' | 'release-b12';
}

function operationalAnswer(query: string, state: ReturnType<typeof useOpsStore.getState>) {
  const normalized = query.toLowerCase();
  if (normalized.includes('ward b') || normalized.includes('holding') || normalized.includes('lab')) {
    const test = state.labTests.find((item) => item.id === 'L882');
    const bed = state.beds.find((item) => item.id === 'B12');
    if (test && test.status !== 'completed' && bed) {
      return {
        text: `Ward B discharge is being held by pending Lab #882 (${test.testName}) for ${test.patientName}. Bed B12 is ${bed.dischargeReadiness}% discharge-ready, so completing the blocker will clear its linked pending task.`,
        action: 'fast-track-lab' as const,
      };
    }
    return { text: 'Lab #882 is complete. Check the ward roster for any remaining discharge or billing clearances.' };
  }
  if (normalized.includes('discharge') || normalized.includes('ready')) {
    const candidates = state.beds.filter((bed) => bed.dischargeReadiness >= 80 && bed.occupancyStatus !== 'available');
    if (!candidates.length) return { text: 'There are no currently occupied beds at 80% or higher discharge readiness.' };
    const bedReadyForRelease = candidates.find((bed) => bed.id === 'B12' && bed.patientId
      && state.patients.find((patient) => patient.id === bed.patientId)?.dischargeStages.find((stage) => stage.id === 'payment_cleared')?.completed);
    return {
      text: candidates.map((bed) => {
        const patient = state.patients.find((item) => item.id === bed.patientId);
        return `${bed.bedNumber} · ${patient?.name ?? 'Patient record unavailable'} · ${bed.dischargeReadiness}% ready · ${bed.wardIssue}`;
      }).join('\n'),
      ...(bedReadyForRelease
        ? { action: 'release-b12' as const }
        : candidates.some((bed) => bed.id === 'B12') && state.labTests.some((test) => test.id === 'L882' && test.status !== 'completed')
        ? { action: 'fast-track-lab' as const }
        : {}),
    };
  }
  if (normalized.includes('pressure') || normalized.includes('isolation')) {
    const alerts = state.isolationRooms.filter((room) =>
      (room.airPressure === 'negative' && room.pressurePa >= 0)
      || (room.airPressure === 'positive' && room.pressurePa <= 0)
      || room.hepaFilterHealth < 75,
    );
    return alerts.length
      ? { text: `Isolation maintenance needs attention in ${alerts.map((room) => `${room.roomNumber} (${room.pressurePa} Pa, HEPA ${room.hepaFilterHealth}%)`).join('; ')}.` }
      : { text: `No pressure drops or low-filter alerts are recorded across ${state.isolationRooms.length} isolation rooms. Rooms in decontamination lockout are tracked separately.` };
  }
  if (normalized.includes('blood') || normalized.includes('negative') || normalized.includes('o-')) {
    const inventory = state.bloodInventory.find((item) => item.bloodType === 'O-Negative');
    return inventory
      ? { text: `O-Negative reserves are ${inventory.currentUnits} units against a target of ${inventory.targetUnits}. ${inventory.currentUnits <= 5 ? 'This is low inventory; open Blood Drives to broadcast the donor alert.' : 'Current stock is above the low-inventory threshold.'}` }
      : { text: 'O-Negative inventory is not currently available in the operational store.' };
  }
  if (normalized.includes('tpa') || normalized.includes('claim') || normalized.includes('deadline') || normalized.includes('insurance')) {
    const pending = [...state.insuranceClaims]
      .filter((claim) => claim.approvalStatus === 'pending')
      .sort((first, second) => Number(second.patientHealthStatus === 'critical') - Number(first.patientHealthStatus === 'critical') || first.deadlineMinutesLeft - second.deadlineMinutesLeft);
    return pending.length
      ? { text: `Highest-priority pending claims: ${pending.slice(0, 3).map((claim) => `${claim.claimId} · ${claim.patientName} · ${claim.patientHealthStatus} · ${claim.deadlineMinutesLeft} mins (${claim.tpaProvider})`).join('; ')}.` }
      : { text: 'There are no pending TPA claims.' };
  }
  if (normalized.includes('bill') || normalized.includes('payment') || normalized.includes('clearance')) {
    const pending = state.beds.filter((bed) => bed.occupancyStatus !== 'available' && bed.billingStatus !== 'fully_paid');
    return { text: `${pending.length} occupied or pending beds still have billing clearance outstanding${pending.length ? `: ${pending.map((bed) => bed.bedNumber).join(', ')}` : ''}.` };
  }
  const pendingAlerts = [...state.alerts].sort((first, second) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[first.urgency] - rank[second.urgency];
  });
  return {
    text: `Operational snapshot: ${state.patients.filter((patient) => patient.status !== 'discharged').length} active patients, ${state.beds.filter((bed) => bed.occupancyStatus === 'available').length} available beds, ${state.insuranceClaims.filter((claim) => claim.approvalStatus === 'pending').length} pending TPA claims. Highest-priority alert: ${pendingAlerts[0]?.title ?? 'none active'}. Ask me about a ward, discharge, isolation room, blood reserve, billing, or TPA deadline for more detail.`,
  };
}

export function AgentPage() {
  const patients = useOpsStore((state) => state.patients);
  const completeLabTest = useOpsStore((state) => state.completeLabTest);
  const releaseBed = useOpsStore((state) => state.releaseBed);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'assistant', text: 'Hello. I can answer operational questions using the current dashboard data. Try a quick prompt or ask about beds, discharge, isolation, blood inventory, billing, or TPA claims.' },
  ]);
  const [input, setInput] = useState('');
  const scrollContainer = useRef<HTMLDivElement>(null);
  const canReleaseB12 = useOpsStore((state) => Boolean(state.beds.find((bed) => bed.id === 'B12')?.patientId)
    && Boolean(state.patients.find((patient) => patient.id === state.beds.find((bed) => bed.id === 'B12')?.patientId)?.dischargeStages.find((stage) => stage.id === 'payment_cleared')?.completed));

  useEffect(() => {
    scrollContainer.current?.scrollTo({ top: scrollContainer.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (message: string) => {
    const query = message.trim();
    if (!query) return;
    const response = operationalAnswer(query, useOpsStore.getState());
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'user', text: query },
      { id: Date.now() + 1, role: 'assistant', ...response },
    ]);
    setInput('');
  };

  const executeAction = (action: ChatMessage['action']) => {
    if (action === 'fast-track-lab') {
      completeLabTest('L882');
      setMessages((current) => [...current, { id: Date.now(), role: 'assistant', text: 'Lab #882 marked completed. Bed B12 readiness and linked discharge status have been updated.' }]);
    } else if (action === 'release-b12') {
      releaseBed('B12');
      setMessages((current) => [...current, { id: Date.now(), role: 'assistant', text: 'Bed B12 release was requested. The store releases it only after payment clearance is complete.' }]);
    }
  };

  const currentPatientCount = patients.filter((patient) => patient.status !== 'discharged').length;

  return (
    <main className="mx-auto max-w-[1100px] space-y-5">
      <header className="glass-panel flex items-center gap-3 p-5 sm:p-6">
        <span className="rounded-xl bg-teal-50 p-3 text-teal-700"><Bot aria-hidden="true" className="h-6 w-6" /></span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Page 8 · Operations assistant</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">AI Agent Chat</h1>
          <p className="mt-1 text-sm text-slate-600">Ask about live operations. Snapshot: {currentPatientCount} active patients.</p>
        </div>
      </header>

      <section className="glass-panel overflow-hidden" aria-label="Hospital operations chat">
        <div className="border-b border-slate-200 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-800"><Sparkles aria-hidden="true" className="h-4 w-4" /> Quick prompts</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => sendMessage(prompt)} className="rounded-full border border-teal-200 bg-white px-3 py-2 text-xs font-medium text-teal-800 transition hover:bg-teal-50">{prompt}</button>
            ))}
          </div>
        </div>

        <div ref={scrollContainer} className="max-h-[55vh] min-h-[330px] space-y-4 overflow-y-auto bg-slate-50/60 p-4 sm:p-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800"><Bot aria-hidden="true" className="h-5 w-5" /></span>}
              <div className={`max-w-[85%] whitespace-pre-line rounded-2xl p-4 text-sm leading-relaxed ${
                message.role === 'user' ? 'bg-teal-600 text-white' : 'border border-slate-200 bg-white text-slate-700 shadow-sm'
              }`}>
                {message.text}
                {message.action === 'fast-track-lab' && (
                  <button type="button" onClick={() => executeAction(message.action)} className="mt-3 block rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">Fast-Track Lab #882</button>
                )}
                {message.action === 'release-b12' && (
                  <button type="button" disabled={!canReleaseB12} onClick={() => executeAction(message.action)} title={!canReleaseB12 ? 'Complete payment clearance before releasing the bed.' : undefined} className="mt-3 block rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">Release Bed B12</button>
                )}
              </div>
              {message.role === 'user' && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700"><UserRound aria-hidden="true" className="h-5 w-5" /></span>}
            </div>
          ))}
        </div>

        <form onSubmit={(event) => { event.preventDefault(); sendMessage(input); }} className="flex gap-2 border-t border-slate-200 bg-white p-4">
          <label className="sr-only" htmlFor="agent-message">Ask the hospital operations assistant</label>
          <input id="agent-message" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about beds, patients, billing, or TPA..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100" />
          <button type="submit" disabled={!input.trim()} className="rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"><Send aria-hidden="true" className="h-4 w-4" /><span className="sr-only">Send message</span></button>
        </form>
      </section>
      <p className="text-xs leading-relaxed text-slate-500">Operational responses are generated from the current in-browser demo data. Verify clinical decisions and confirm all actions before execution.</p>
    </main>
  );
}
