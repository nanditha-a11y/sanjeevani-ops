import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, BedDouble, Plus, Trash2, UserRound } from 'lucide-react';
import { PatientLink } from './PatientLink';
import { useOpsStore } from '../store/useOpsStore';

interface WardFormState {
  name: string;
  floor: string;
  totalRooms: string;
  emergencyCapacityThreshold: string;
}

interface PatientFormState {
  id: string;
  name: string;
  age: string;
  gender: string;
  bedNumber: string;
  chiefComplaint: string;
  attendingPhysician: string;
}

const emptyWard: WardFormState = { name: '', floor: '', totalRooms: '', emergencyCapacityThreshold: '85' };
const emptyPatient: PatientFormState = { id: '', name: '', age: '', gender: '', bedNumber: '', chiefComplaint: '', attendingPhysician: '' };

const statusFor = (occupancy: number, threshold: number) => occupancy > threshold
  ? { text: 'CRITICAL SURGE / FILLING UP', style: 'border-rose-200 bg-rose-50 text-rose-800' }
  : occupancy >= 60
    ? { text: 'Moderate Load', style: 'border-amber-200 bg-amber-50 text-amber-800' }
    : { text: 'Normal Capacity', style: 'border-emerald-200 bg-emerald-50 text-emerald-800' };

export function WardsPage({ focus }: { focus?: 'vacant-beds' | 'hdu' }) {
  const wards = useOpsStore((state) => state.wards);
  const beds = useOpsStore((state) => state.beds);
  const patients = useOpsStore((state) => state.patients);
  const physicianWorkloads = useOpsStore((state) => state.physicianWorkloads);
  const addWard = useOpsStore((state) => state.addWard);
  const addPatientToWard = useOpsStore((state) => state.addPatientToWard);
  const moveToTrash = useOpsStore((state) => state.moveToTrash);
  const isAdmin = useOpsStore((state) => state.currentUser?.role === 'hospital_admin');
  const fastTrackBedDischarge = useOpsStore((state) => state.fastTrackBedDischarge);
  const reassignPatientDoctor = useOpsStore((state) => state.reassignPatientDoctor);
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [wardModalOpen, setWardModalOpen] = useState(false);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [wardForm, setWardForm] = useState(emptyWard);
  const [patientForm, setPatientForm] = useState(emptyPatient);
  const selectedWard = wards.find((ward) => ward.id === selectedWardId);
  const showVacantBeds = focus === 'vacant-beds';
  const selectedBeds = selectedWard ? beds.filter((bed) => bed.ward === selectedWard.name) : [];
  const occupied = selectedBeds.filter((bed) => bed.occupancyStatus !== 'available').length;
  const vacancy = Math.max(0, (selectedWard?.totalRooms ?? 0) - occupied);
  const readiness = selectedBeds.filter((bed) => bed.occupancyStatus !== 'available');
  const averageReadiness = readiness.length ? Math.round(readiness.reduce((total, bed) => total + bed.dischargeReadiness, 0) / readiness.length) : 0;
  const availableBeds = beds.filter((bed) => bed.occupancyStatus === 'available');
  const currentPhysicianWorkloads = physicianWorkloads.map((doctor) => {
    const assignedBeds = beds.filter((bed) => bed.attendingPhysician === doctor.doctorName && bed.occupancyStatus !== 'available');
    const activePatientsCount = assignedBeds.length;
    const blockedPatientsCount = assignedBeds.filter((bed) => Boolean(bed.blockedByTaskId) || bed.dischargeReadiness >= 80).length;
    return {
      ...doctor,
      activePatientsCount,
      blockedPatientsCount,
      capacityStatus: activePatientsCount >= 4 ? 'overloaded' as const : activePatientsCount === 0 ? 'available' as const : 'balanced' as const,
    };
  });

  useEffect(() => {
    if (focus === 'hdu') {
      setSelectedWardId(wards.find((ward) => ward.name.toLowerCase().includes('step-down'))?.id ?? null);
    } else if (showVacantBeds) {
      window.setTimeout(() => document.getElementById('vacant-beds-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [focus, wards]);

  const saveWard = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const floor = Number(wardForm.floor);
    const totalRooms = Number(wardForm.totalRooms);
    const threshold = Number(wardForm.emergencyCapacityThreshold);
    if (!wardForm.name.trim() || !Number.isInteger(floor) || floor < 0 || !Number.isInteger(totalRooms) || totalRooms < 1 || !Number.isFinite(threshold) || threshold < 60 || threshold > 100) {
      setFormError('Enter a ward name, non-negative floor, positive room count, and a threshold from 60–100%.');
      return;
    }
    if (wards.some((ward) => ward.name.toLowerCase() === wardForm.name.trim().toLowerCase())) {
      setFormError('A ward with that name already exists.');
      return;
    }
    addWard({ name: wardForm.name, floor, totalRooms, emergencyCapacityThreshold: threshold });
    setWardForm(emptyWard);
    setFormError('');
    setWardModalOpen(false);
  };

  const savePatient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const age = Number(patientForm.age);
    if (!selectedWard || !patientForm.id.trim() || !patientForm.name.trim() || !Number.isInteger(age) || age < 0 || !patientForm.bedNumber.trim()) {
      setFormError('Complete patient ID, name, age, and room/bed number.');
      return;
    }
    if (patients.some((patient) => patient.id === patientForm.id.trim())) {
      setFormError('A patient with that ID already exists.');
      return;
    }
    if (beds.some((bed) => bed.ward === selectedWard.name && bed.bedNumber.toLowerCase() === patientForm.bedNumber.trim().toLowerCase())) {
      setFormError('That room/bed number is already registered in this ward.');
      return;
    }
    if (selectedBeds.filter((bed) => bed.occupancyStatus !== 'available').length >= selectedWard.totalRooms) {
      setFormError('This ward has reached its configured room capacity.');
      return;
    }
    addPatientToWard({
      ...patientForm,
      age,
      wardName: selectedWard.name,
    });
    setPatientForm(emptyPatient);
    setFormError('');
    setPatientModalOpen(false);
  };

  const activeTab = (selectedWard: boolean) => selectedWard
    ? 'rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800'
    : 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50';

  return (
    <main className="mx-auto max-w-[1400px] space-y-5">
      <header className="glass-panel flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Page 3 · Inpatient administration</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Common Wards</h1>
          <p className="mt-2 text-sm text-slate-600">Manage ward capacity, patient assignments, and high-priority discharge throughput.</p>
        </div>
        {!selectedWard && (
          <button type="button" onClick={() => setWardModalOpen(true)} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
            <Plus aria-hidden="true" className="mr-1.5 inline h-4 w-4" /> Add New Ward
          </button>
        )}
      </header>

      {showVacantBeds && !selectedWard && (
        <section id="vacant-beds-view" aria-label="Vacant beds view" className="glass-panel scroll-mt-28 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Vacancy overview</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">Available Beds</h2>
          <p className="mt-1 text-sm text-slate-600">Beds currently marked available across all wards.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableBeds.map((bed) => (
              <article key={bed.id} className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <p className="font-semibold text-emerald-900">{bed.bedNumber} · {bed.ward}</p>
                <p className="mt-1 text-xs text-emerald-800">{bed.wardType} · Ready for assignment</p>
              </article>
            ))}
            {!availableBeds.length && <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No beds are currently marked available.</p>}
          </div>
        </section>
      )}

      <AnimatePresence mode="wait">
        {!selectedWard ? (
          <motion.section key="ward-overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="All wards">
            {wards.map((ward) => {
              const wardBeds = beds.filter((bed) => bed.ward === ward.name);
              const activeBeds = wardBeds.filter((bed) => bed.occupancyStatus !== 'available').length;
              const occupancy = ward.totalRooms ? Math.round((activeBeds / ward.totalRooms) * 100) : 0;
              const status = statusFor(occupancy, ward.emergencyCapacityThreshold);
              return (
                <article key={ward.id} className="glass-panel p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Floor {ward.floor}</p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900">{ward.name}</h2>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-center text-[11px] font-bold ${status.style}`}>{status.text}</span>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Rooms</p><p className="mt-1 font-bold text-slate-900">{ward.totalRooms}</p></div>
                    <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Occupied</p><p className="mt-1 font-bold text-slate-900">{activeBeds}</p></div>
                    <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Occupancy</p><p className="mt-1 font-bold text-slate-900">{occupancy}%</p></div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${occupancy >= ward.emergencyCapacityThreshold ? 'bg-rose-500' : occupancy >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, occupancy)}%` }} /></div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setSelectedWardId(ward.id)} className={`${activeTab(true)} flex-1`}>Open Ward Details</button>
                    <button type="button" disabled={!isAdmin || activeBeds > 0} title={!isAdmin ? 'Sign in as a Hospital Admin to archive wards.' : activeBeds > 0 ? 'Discharge or reassign active patients before archiving this ward.' : 'Move ward to trash'} onClick={() => moveToTrash('Ward', ward.id, 'Moved from ward overview')} aria-label={`Move ${ward.name} to trash`} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
                  </div>
                </article>
              );
            })}
            {wards.length === 0 && <p className="glass-panel p-6 text-sm text-slate-600">No active wards. Add a ward to get started.</p>}
          </motion.section>
        ) : (
          <motion.section key={`ward-detail-${selectedWard.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <button type="button" onClick={() => setSelectedWardId(null)} className="font-semibold text-teal-800 hover:text-teal-900">Common Wards</button>
                <span className="text-slate-400">➔</span>
                <span className="font-bold text-slate-900">{selectedWard.name} (Floor {selectedWard.floor})</span>
              </div>
              <button type="button" onClick={() => setPatientModalOpen(true)} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
                <Plus aria-hidden="true" className="mr-1.5 inline h-4 w-4" /> Add Patient to Ward
              </button>
            </div>

            <section className="glass-panel p-5 sm:p-6" aria-label={`${selectedWard.name} capacity and discharge readiness`}>
              <div className="grid gap-4 sm:grid-cols-4">
                <div><p className="text-xs text-slate-500">Bed capacity</p><p className="text-2xl font-bold text-slate-900">{selectedWard.totalRooms}</p></div>
                <div><p className="text-xs text-slate-500">Active patients</p><p className="text-2xl font-bold text-teal-800">{occupied}</p></div>
                <div><p className="text-xs text-slate-500">Vacant beds</p><p className="text-2xl font-bold text-emerald-700">{vacancy}</p></div>
                <div><p className="text-xs text-slate-500">Average discharge readiness</p><p className="text-2xl font-bold text-teal-800">{averageReadiness}%</p></div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div><div className="flex justify-between text-xs"><span className="font-semibold text-slate-600">Occupancy</span><span className="font-bold text-slate-800">{selectedWard.totalRooms ? Math.round((occupied / selectedWard.totalRooms) * 100) : 0}%</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500" style={{ width: `${selectedWard.totalRooms ? Math.min(100, (occupied / selectedWard.totalRooms) * 100) : 0}%` }} /></div></div>
                <div><div className="flex justify-between text-xs"><span className="font-semibold text-slate-600">Readiness trend</span><span className="font-bold text-slate-800">{averageReadiness}%</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${averageReadiness}%` }} /></div></div>
              </div>
            </section>

            <section className="glass-panel p-5" aria-label="Attending physician workload">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Attending Physician Workload</h2>
                  <p className="mt-1 text-xs text-slate-500">Live patient assignment and discharge-blocker distribution.</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {currentPhysicianWorkloads.map((doctor) => (
                  <span key={doctor.doctorId} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${doctor.capacityStatus === 'overloaded' ? 'border-rose-200 bg-rose-50 text-rose-800' : doctor.capacityStatus === 'available' ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                    {doctor.doctorName}: {doctor.activePatientsCount} {doctor.activePatientsCount === 1 ? 'Patient' : 'Patients'}{doctor.blockedPatientsCount > 0 ? ` · ${doctor.blockedPatientsCount} blocked` : ''} ({doctor.capacityStatus})
                  </span>
                ))}
              </div>
            </section>

            <section className="glass-panel overflow-hidden" aria-label="Ward patient roster">
              <div className="border-b border-slate-200 p-5"><h2 className="text-lg font-bold text-slate-900">Patient Roster</h2></div>
              <div className="divide-y divide-slate-100">
                {selectedBeds.map((bed) => {
                  const patient = patients.find((item) => item.id === bed.patientId);
                  return (
                    <article key={bed.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_1.4fr_1fr_auto] lg:items-center">
                      <div className="flex items-center gap-3"><span className="rounded-xl bg-teal-50 p-2.5 text-teal-700"><BedDouble aria-hidden="true" className="h-5 w-5" /></span><div><p className="font-bold text-slate-900">{bed.bedNumber}</p><p className="text-xs text-slate-500">{bed.wardType} · {bed.occupancyStatus.replace('_', ' ')}</p></div></div>
                      <div><p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"><UserRound aria-hidden="true" className="h-4 w-4 text-teal-700" />{patient ? <PatientLink patientId={patient.id} patientName={`${patient.name} (${patient.id})`} className="font-semibold" /> : 'No patient assigned'}</p><p className="mt-1 text-xs text-slate-500">{bed.attendingPhysician} · {bed.wardIssue}</p></div>
                      <div><div className="flex justify-between text-xs"><span className="font-medium text-slate-600">Discharge readiness</span><span className="font-bold text-teal-800">{bed.dischargeReadiness}%</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500" style={{ width: `${bed.dischargeReadiness}%` }} /></div></div>
                      <div className="flex flex-wrap gap-2">
                        {patient && <label className="sr-only" htmlFor={`doctor-${bed.id}`}>Reassign attending doctor for {patient.name}</label>}
                        {patient && <select id={`doctor-${bed.id}`} aria-label={`Reassign attending doctor for ${patient.name}`} value={bed.attendingPhysician} onChange={(event) => reassignPatientDoctor(patient.id, event.target.value)} className="max-w-48 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700">
                          {currentPhysicianWorkloads.map((doctor) => <option key={doctor.doctorId} value={doctor.doctorName}>{doctor.doctorName} · {doctor.capacityStatus}</option>)}
                        </select>}
                        {patient && <PatientLink patientId={patient.id} patientName="View Full Patient File" className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold no-underline" />}
                        {patient && <button type="button" onClick={() => fastTrackBedDischarge(bed.id)} className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700">Fast-Track Discharge</button>}
                        {patient && <button type="button" disabled={!isAdmin} title={!isAdmin ? 'Sign in as a Hospital Admin to archive patient records.' : undefined} onClick={() => moveToTrash('Patient', patient.id, `Moved from ${selectedWard.name} patient roster`)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40">Move Patient to Trash</button>}
                        {!patient && bed.occupancyStatus !== 'available' && <button type="button" onClick={() => fastTrackBedDischarge(bed.id)} className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700">Fast-Track Discharge</button>}
                      </div>
                    </article>
                  );
                })}
                {selectedBeds.length === 0 && <p className="p-6 text-sm text-slate-600">No rooms registered in this ward yet. Add a patient and bed assignment to begin.</p>}
              </div>
            </section>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {wardModalOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setWardModalOpen(false); }}>
            <motion.form onSubmit={saveWard} className="glass-panel w-full max-w-lg space-y-4 bg-white p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
              <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">Add New Ward</h2><button type="button" onClick={() => setWardModalOpen(false)} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ArrowLeft aria-hidden="true" className="h-4 w-4" /></button></div>
              <label className="block text-sm font-medium text-slate-700">Ward Name<input required value={wardForm.name} onChange={(event) => setWardForm({ ...wardForm, name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
              <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-slate-700">Floor<input required type="number" min="0" value={wardForm.floor} onChange={(event) => setWardForm({ ...wardForm, floor: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label><label className="text-sm font-medium text-slate-700">Total Rooms<input required type="number" min="1" value={wardForm.totalRooms} onChange={(event) => setWardForm({ ...wardForm, totalRooms: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label></div>
              <label className="block text-sm font-medium text-slate-700">Emergency Capacity Threshold (%)<input required type="number" min="60" max="100" value={wardForm.emergencyCapacityThreshold} onChange={(event) => setWardForm({ ...wardForm, emergencyCapacityThreshold: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
              {formError && <p role="alert" className="text-sm font-medium text-rose-700">{formError}</p>}
              <button type="submit" className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white hover:bg-teal-700">Create Ward</button>
            </motion.form>
          </motion.div>
        )}
        {patientModalOpen && selectedWard && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setPatientModalOpen(false); }}>
            <motion.form onSubmit={savePatient} className="glass-panel w-full max-w-xl space-y-4 bg-white p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
              <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{selectedWard.name} · Floor {selectedWard.floor}</p><h2 className="text-xl font-bold text-slate-900">Add Patient to Ward</h2></div><button type="button" onClick={() => setPatientModalOpen(false)} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ArrowLeft aria-hidden="true" className="h-4 w-4" /></button></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Patient ID<input required value={patientForm.id} onChange={(event) => setPatientForm({ ...patientForm, id: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
                <label className="text-sm font-medium text-slate-700">Full Name<input required value={patientForm.name} onChange={(event) => setPatientForm({ ...patientForm, name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
                <label className="text-sm font-medium text-slate-700">Age<input required type="number" min="0" max="125" value={patientForm.age} onChange={(event) => setPatientForm({ ...patientForm, age: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
                <label className="text-sm font-medium text-slate-700">Gender<input required value={patientForm.gender} onChange={(event) => setPatientForm({ ...patientForm, gender: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
                <label className="text-sm font-medium text-slate-700">Room / Bed No.<input required value={patientForm.bedNumber} onChange={(event) => setPatientForm({ ...patientForm, bedNumber: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
                <label className="text-sm font-medium text-slate-700">Attending Doctor<input required value={patientForm.attendingPhysician} onChange={(event) => setPatientForm({ ...patientForm, attendingPhysician: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Main Issue / Diagnosis<input required value={patientForm.chiefComplaint} onChange={(event) => setPatientForm({ ...patientForm, chiefComplaint: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
              </div>
              {formError && <p role="alert" className="text-sm font-medium text-rose-700">{formError}</p>}
              <button type="submit" className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white hover:bg-teal-700">Add Patient to {selectedWard.name}</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
