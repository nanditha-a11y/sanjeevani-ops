import { Bot, Building2, HeartPulse, LogOut, UserRound } from 'lucide-react';
import type { AuthUser } from '../types';

export type AppPage = 'executive' | 'isolation' | 'wards' | 'campaigns' | 'discharge' | 'insurance' | 'trash' | 'about' | 'agent' | 'departments';

export const appPages: Array<{ id: AppPage; label: string; icon?: typeof Bot }> = [
  { id: 'executive', label: '1. Executive AI' },
  { id: 'isolation', label: '2. Isolation Wards' },
  { id: 'wards', label: '3. Common Wards' },
  { id: 'campaigns', label: '4. Blood Drives' },
  { id: 'discharge', label: '5. Discharge & Billing' },
  { id: 'insurance', label: '6. Insurance & TPA' },
  { id: 'trash', label: '7. Trash / Archives' },
  { id: 'agent', label: '8. AI Agent Chat', icon: Bot },
  { id: 'departments', label: 'Departments', icon: Building2 },
];

interface NavigationProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  currentUser: AuthUser;
  onLogout: () => void;
}

const roleLabel = {
  hospital_admin: 'Admin',
  ward_doctor: 'Ward Doctor',
  lab_tech: 'Lab Tech',
  tpa_officer: 'TPA Officer',
} as const;

export function Navigation({ currentPage, onNavigate, currentUser, onLogout }: NavigationProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          aria-current={currentPage === 'about' ? 'page' : undefined}
          onClick={() => onNavigate('about')}
          className="flex shrink-0 items-center gap-2 rounded-lg pr-2 text-left hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          aria-label="About Sanjeevani Hospital"
        >
          <span className="rounded-lg bg-teal-50 p-2 text-teal-700">
            <HeartPulse aria-hidden="true" className="h-5 w-5" />
          </span>
          <span className="text-xs font-bold text-slate-900 sm:text-sm">Sanjeevani Operations</span>
        </button>
        <nav aria-label="Hospital operations pages" className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {appPages.map((page) => (
            <button
              key={page.id}
              type="button"
              aria-current={currentPage === page.id ? 'page' : undefined}
              onClick={() => onNavigate(page.id)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs transition sm:text-sm ${
                currentPage === page.id
                  ? 'border border-teal-200 bg-teal-50 font-semibold text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {page.icon && <page.icon aria-hidden="true" className="mr-1 inline h-4 w-4" />}
              {page.label}
            </button>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 text-xs font-semibold text-slate-700 lg:flex">
            <UserRound aria-hidden="true" className="h-4 w-4 text-teal-700" />
            {currentUser.fullName} · {roleLabel[currentUser.role]}
          </span>
          <button type="button" onClick={onLogout} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <LogOut aria-hidden="true" className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
