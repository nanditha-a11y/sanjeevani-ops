import { Activity } from 'lucide-react';
import { LabQueue } from './LabQueue';
import { WardHub } from './WardHub';

export function DepartmentViews() {
  return (
    <div className="space-y-5">
      <header className="glass-panel flex items-start gap-3 p-5 sm:p-6">
        <span className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
          <Activity aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Department execution</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Reverse Triage &amp; Execution</h2>
          <p className="mt-1 text-sm text-slate-600">Coordinate ward bed recovery with the diagnostics fast-track queue.</p>
        </div>
      </header>
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <WardHub />
        <LabQueue />
      </div>
    </div>
  );
}
