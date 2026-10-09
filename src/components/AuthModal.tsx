import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogIn, UserPlus, X } from 'lucide-react';
import { useOpsStore } from '../store/useOpsStore';
import type { UserRole } from '../types';

type AuthTab = 'login' | 'register';

const roles: Array<{ value: UserRole; label: string }> = [
  { value: 'hospital_admin', label: 'Hospital Admin' },
  { value: 'ward_doctor', label: 'Ward Doctor' },
  { value: 'lab_tech', label: 'Lab Tech' },
  { value: 'tpa_officer', label: 'TPA Officer' },
];

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const login = useOpsStore((state) => state.login);
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<UserRole>('hospital_admin');
  const [error, setError] = useState('');

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email or username and password.');
      return;
    }
    if (tab === 'register' && (!fullName.trim() || !staffId.trim() || !department.trim())) {
      setError('Complete your name, staff ID, and department.');
      return;
    }
    login({
      fullName: tab === 'register' ? fullName.trim() : email.trim().split('@')[0],
      email: email.trim(),
      role,
      ...(tab === 'register' ? { staffId: staffId.trim(), department: department.trim() } : {}),
    });
    setError('');
    setPassword('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
          <motion.section role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" className="glass-panel w-full max-w-lg bg-white p-5 shadow-2xl sm:p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Staff access</p>
                <h2 id="auth-modal-title" className="mt-1 text-xl font-bold text-slate-900">{tab === 'login' ? 'Welcome back' : 'Create staff account'}</h2>
              </div>
              <button type="button" aria-label="Close authentication dialog" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X aria-hidden="true" className="h-5 w-5" /></button>
            </div>

            <div role="tablist" aria-label="Authentication options" className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button type="button" role="tab" aria-selected={tab === 'login'} onClick={() => { setTab('login'); setError(''); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === 'login' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'}`}>Login</button>
              <button type="button" role="tab" aria-selected={tab === 'register'} onClick={() => { setTab('register'); setError(''); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === 'register' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'}`}>Registration</button>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-3">
              {tab === 'register' && (
                <>
                  <label className="block text-sm font-medium text-slate-700">Full Name<input required value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">Staff ID<input required value={staffId} onChange={(event) => setStaffId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>
                    <label className="block text-sm font-medium text-slate-700">Department<input required value={department} onChange={(event) => setDepartment(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>
                  </div>
                </>
              )}
              <label className="block text-sm font-medium text-slate-700">Email / Username<input required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium text-slate-700">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>
              <label className="block text-sm font-medium text-slate-700">Role
                <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                  {roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
              <button type="submit" className="w-full rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700">
                {tab === 'login' ? <><LogIn aria-hidden="true" className="mr-2 inline h-4 w-4" /> Sign In</> : <><UserPlus aria-hidden="true" className="mr-2 inline h-4 w-4" /> Create Account</>}
              </button>
            </form>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">Demo access only: credentials are not verified or stored by a server. Connect an approved identity provider before using this role selector for real access control.</p>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
