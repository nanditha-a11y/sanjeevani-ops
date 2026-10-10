import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AboutPage } from './components/AboutPage';
import { CampaignsPage } from './components/CampaignsPage';
import { CommandCenter } from './components/CommandCenter';
import { DischargePage } from './components/DischargePage';
import { HelpModal } from './components/HelpModal';
import { InsurancePage } from './components/InsurancePage';
import { IsolationPage } from './components/IsolationPage';
import { Navigation, type AppPage } from './components/Navigation';
import { WardsPage } from './components/WardsPage';
import { TrashPage } from './components/TrashPage';
import { PatientRecordModal } from './components/PatientRecordModal';
import { AgentPage } from './components/AgentPage';
import { AuthPage } from './components/AuthPage';
import { DepartmentsPage } from './components/DepartmentsPage';
import { useOpsStore } from './store/useOpsStore';

const pageContent: Record<Exclude<AppPage, 'about' | 'executive' | 'wards' | 'agent' | 'departments'>, ComponentType> = {
  isolation: IsolationPage,
  campaigns: CampaignsPage,
  discharge: DischargePage,
  insurance: InsurancePage,
  trash: TrashPage,
};

export function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>(() => window.location.pathname === '/departments' ? 'departments' : 'executive');
  const [routeFocus, setRouteFocus] = useState<'vacant-beds' | 'hdu' | 'lab-fast-track' | undefined>();
  const [wardTarget, setWardTarget] = useState<{ wardName: string; patientId: string } | undefined>();
  const currentUser = useOpsStore((state) => state.currentUser);
  const isAuthenticated = useOpsStore((state) => state.isAuthenticated);
  const logout = useOpsStore((state) => state.logout);
  const openPatientRecord = useOpsStore((state) => state.openPatientRecord);

  const navigate = (page: AppPage, focus?: 'vacant-beds' | 'hdu' | 'lab-fast-track') => {
    setCurrentPage(page);
    setRouteFocus(focus);
    setWardTarget(undefined);
    const nextPath = page === 'departments' ? '/departments' : '/';
    if (window.location.pathname !== nextPath) window.history.pushState({}, '', nextPath);
  };
  const navigateToPatientWard = (patientId: string, wardName: string) => {
    setCurrentPage('wards');
    setRouteFocus(undefined);
    setWardTarget({ patientId, wardName });
    openPatientRecord(patientId);
    if (window.location.pathname !== '/') window.history.pushState({}, '', '/');
  };

  useEffect(() => {
    const onPopState = () => {
      setCurrentPage(window.location.pathname === '/departments' ? 'departments' : 'executive');
      setRouteFocus(undefined);
      setWardTarget(undefined);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (!isAuthenticated || !currentUser) {
    return <AuthPage />;
  }

  const page = currentPage === 'about'
    ? <AboutPage />
    : currentPage === 'executive'
      ? <CommandCenter onNavigate={navigate} />
    : currentPage === 'agent'
      ? <AgentPage />
      : currentPage === 'departments'
        ? <DepartmentsPage onOpenWardFile={navigateToPatientWard} />
    : currentPage === 'wards'
        ? <WardsPage focus={routeFocus === 'vacant-beds' || routeFocus === 'hdu' ? routeFocus : undefined} wardTarget={wardTarget} />
        : currentPage === 'insurance'
          ? <InsurancePage focus={routeFocus === 'lab-fast-track' ? routeFocus : undefined} />
        : (() => {
          const ActivePage = pageContent[currentPage];
          return <ActivePage />;
        })();

  return (
    <div className="min-h-screen pt-36 text-slate-900 sm:pt-24 lg:pt-20">
      <Navigation currentPage={currentPage} onNavigate={navigate} currentUser={currentUser} onLogout={logout} />
      <div className="px-4 pb-8 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {page}
          </motion.div>
        </AnimatePresence>
      </div>
      <HelpModal currentPage={currentPage} />
      <PatientRecordModal />
    </div>
  );
}

export default App;
