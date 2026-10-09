import { useState } from 'react';
import { Activity, ArrowRight, BedDouble, Building2, HeartPulse, LockKeyhole, LogIn, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';
import { useOpsStore } from '../store/useOpsStore';
import type { UserRole } from '../types';

type AuthTab = 'login' | 'register';

const roles: Array<{ value: UserRole; label: string }> = [
  { value: 'hospital_admin', label: 'Hospital Admin' },
  { value: 'ward_doctor', label: 'Ward Doctor' },
  { value: 'lab_tech', label: 'Lab Tech' },
  { value: 'tpa_officer', label: 'TPA Officer' },
];

const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10';
const features = [
  { icon: BedDouble, text: 'Real-Time Bed & Isolation Tracking' },
  { icon: Activity, text: 'Causal Flow Bottleneck Analytics' },
  { icon: ShieldCheck, text: 'Instant TPA & Discharge Clearance' },
];

export function AuthPage() {
  const login = useOpsStore((state) => state.login);
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<UserRole>('hospital_admin');
  const [error, setError] = useState('');

  const startSession = (name: string, userEmail: string, userRole: UserRole, extra?: { staffId: string; department: string }) => {
    login({
      fullName: name,
      email: userEmail,
      role: userRole,
      ...extra,
    });
    setError('');
    setPassword('');
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email or username and password to continue.');
      return;
    }
    if (tab === 'register' && (!fullName.trim() || !staffId.trim() || !department.trim())) {
      setError('Complete your name, staff ID, and department to register.');
      return;
    }

    const displayName = tab === 'register' ? fullName.trim() : email.trim().split('@')[0];
    startSession(
      displayName,
      email.trim(),
      role,
      tab === 'register' ? { staffId: staffId.trim(), department: department.trim() } : undefined,
    );
  };

  const continueAsAdmin = () => {
    startSession('Dr. Suresh', 'admin@sanjeevani.demo', 'hospital_admin', {
      staffId: 'ADMIN-001',
      department: 'Hospital Administration',
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] lg:grid-cols-2">
        <section className="relative flex min-h-[340px] flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-800 px-6 py-8 text-white sm:px-10 sm:py-10 lg:min-h-screen lg:px-14 lg:py-14">
          <div className="pointer-events-none absolute -right-28 -top-24 h-96 w-96 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-40 -left-24 h-[30rem] w-[30rem] rounded-full border border-white/10" />
          <div className="relative">
            <div className="inline-flex items-center gap-3">
              <span className="rounded-2xl border border-white/20 bg-white/10 p-3 shadow-lg backdrop-blur">
                <HeartPulse aria-hidden="true" className="h-7 w-7" />
              </span>
              <span className="text-lg font-bold tracking-tight sm:text-xl">Sanjeevani Operations</span>
            </div>
            <div className="mt-12 max-w-xl lg:mt-24">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-teal-50">
                <Sparkles aria-hidden="true" className="h-4 w-4" /> HOSPITAL OPERATIONS INTELLIGENCE
              </p>
              <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Clarity for every
                <span className="block text-teal-100">care transition.</span>
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-teal-50/90 sm:text-base sm:leading-7">
                AI-Powered Hospital Operations &amp; Bed Turnover System
              </p>
            </div>
          </div>

          <div className="relative mt-8 grid gap-3 sm:grid-cols-3 lg:mt-12 lg:grid-cols-1 lg:max-w-md">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 shadow-lg backdrop-blur-sm">
                <span className="rounded-xl bg-white/15 p-2"><Icon aria-hidden="true" className="h-5 w-5" /></span>
                <span className="text-sm font-semibold leading-5 text-white">{text}</span>
              </div>
            ))}
          </div>
          <p className="relative mt-8 text-xs text-teal-100/70 lg:mt-10">Connected teams. Safer handovers. Better hospital flow.</p>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-7 text-center lg:text-left">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 lg:mx-0">
                <Building2 aria-hidden="true" className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-teal-700">Sanjeevani Hospital</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {tab === 'login' ? 'Welcome to your command center' : 'Create your staff account'}
              </h2>
              <p className="mt-2 text-sm text-slate-500">Sign in with your staff credentials to continue.</p>
            </div>

            <div role="tablist" aria-label="Authentication options" className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button type="button" role="tab" aria-selected={tab === 'login'} onClick={() => { setTab('login'); setError(''); }} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${tab === 'login' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                Sign In
              </button>
              <button type="button" role="tab" aria-selected={tab === 'register'} onClick={() => { setTab('register'); setError(''); }} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${tab === 'register' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                Create Staff Account
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {tab === 'register' && (
                <>
                  <label className="block text-sm font-medium text-slate-700">Full Name
                    <input required value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder="Your full name" className={inputClass} />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">Staff ID
                      <input required value={staffId} onChange={(event) => setStaffId(event.target.value)} placeholder="e.g. ST-1042" className={inputClass} />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">Department
                      <input required value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="e.g. Cardiology" className={inputClass} />
                    </label>
                  </div>
                </>
              )}
              <label className="block text-sm font-medium text-slate-700">Email / Username
                <input required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="name@hospital.org" className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-700">Password
                <span className="relative mt-1.5 block">
                  <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} placeholder="Enter your password" className={`${inputClass} mt-0 pl-10`} />
                </span>
              </label>
              <label className="block text-sm font-medium text-slate-700">Role
                <select value={role} onChange={(event) => {
                  const selectedRole = roles.find((item) => item.value === event.target.value);
                  if (selectedRole) setRole(selectedRole.value);
                }} className={inputClass}>
                  {roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-700/20 transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20">
                {tab === 'login'
                  ? <><LogIn aria-hidden="true" className="h-4 w-4" /> Sign In to Command Center</>
                  : <><UserPlus aria-hidden="true" className="h-4 w-4" /> Register Account</>}
                <ArrowRight aria-hidden="true" className="ml-auto h-4 w-4" />
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
            </div>
            <button type="button" onClick={continueAsAdmin} className="w-full rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100">
              Demo Access: Continue as Administrator
            </button>
            <p className="mt-5 text-center text-xs leading-5 text-slate-500">
              Demo environment only: this form does not verify credentials with a server. Use an approved identity provider and server-side authorization for production access.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
