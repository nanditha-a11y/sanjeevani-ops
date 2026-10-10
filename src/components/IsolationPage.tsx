import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardCheck, Gauge, HeartPulse, Plus, Trash2, UserRound, Wind, X } from 'lucide-react';
import { CategorySelector } from './CategorySelector';
import { PatientLink } from './PatientLink';
import { useOpsStore } from '../store/useOpsStore';
import type { IsolationRoom } from '../types';

const safetyChecks = [
  { key: 'ppeEquipmentChecked', label: 'PPE Equipment Checked' },
  { key: 'hepaFilterInspected', label: 'HEPA Filter Inspected' },
  { key: 'pressureTestPassed', label: 'Pressure Test Passed' },
] as const;

const isolationCategories = [
  { value: 'negative', label: 'Negative Pressure (Airborne)', purpose: 'Contain airborne pathogens with inward airflow and negative pressure.' },
  { value: 'positive', label: 'Positive Pressure (Protective)', purpose: 'Protect immunocompromised patients with filtered outward airflow.' },
  { value: 'anteroom', label: 'Anteroom Buffer Units', purpose: 'Provide a controlled transition space for staff entry and PPE changes.' },
  { value: 'convertible', label: 'Neutral / Convertible Rooms', purpose: 'Rooms configured for flexible use after pressure and filter checks.' },
] as const;

const isPressureNormal = (room: Pick<IsolationRoom, 'airPressure' | 'pressurePa'>) => (
  (room.airPressure === 'negative' && room.pressurePa < 0)
  || (room.airPressure === 'positive' && room.pressurePa > 0)
  || (room.airPressure === 'normal' && room.pressurePa === 0)
);

export function IsolationPage() {
  const rooms = useOpsStore((state) => state.isolationRooms);
  const patients = useOpsStore((state) => state.patients);
  const beds = useOpsStore((state) => state.beds);
  const updateChecklist = useOpsStore((state) => state.updateIsolationChecklist);
  const completeDecontamination = useOpsStore((state) => state.completeDecontamination);
  const startRoomDecontamination = useOpsStore((state) => state.startRoomDecontamination);
  const tickScrubbing = useOpsStore((state) => state.tickIsolationScrubbing);
  const addIsolationRoom = useOpsStore((state) => state.addIsolationRoom);
  const assignPatientToIsolationRoom = useOpsStore((state) => state.assignPatientToIsolationRoom);
  const moveToTrash = useOpsStore((state) => state.moveToTrash);
  const isAdmin = useOpsStore((state) => state.currentUser?.role === 'hospital_admin');
  const [checklistRoom, setChecklistRoom] = useState<string | null>(null);
  const [assignmentRoomId, setAssignmentRoomId] = useState<string | null>(null);
  const [assignmentPatientId, setAssignmentPatientId] = useState('');
  const [assignmentPhysician, setAssignmentPhysician] = useState('');
  const [category, setCategory] = useState<(typeof isolationCategories)[number]['value']>('negative');
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomPressure, setNewRoomPressure] = useState('-15');
  const activeRoom = rooms.find((room) => room.roomId === checklistRoom);
  const assignmentRoom = rooms.find((room) => room.roomId === assignmentRoomId);
  const assignablePatients = patients.filter((patient) =>
    !beds.some((bed) => bed.patientId === patient.id)
      && !rooms.some((room) => room.patientId === patient.id),
  );
  const categoryRooms = rooms.filter((room) => room.category === category);
  const isRoomReady = (room: (typeof rooms)[number]) =>
    room.sanitizationStatus === 'clean'
      && room.patientName === 'Unoccupied'
      && !room.patientId
      && room.airScrubbingMinutesRemaining === 0
      && room.hepaFilterHealth >= 75
      && isPressureNormal(room);
  const readyRooms = categoryRooms.filter(isRoomReady);
  const occupiedCount = categoryRooms.filter((room) =>
    Boolean(room.patientId) || (!room.patientId
      && room.sanitizationStatus === 'clean'
      && room.patientName !== 'Unoccupied'),
  ).length;
  const maintenanceCount = categoryRooms.length - occupiedCount - readyRooms.length;
  const sensorAlerts = categoryRooms.filter((room) =>
    (room.airPressure === 'negative' && room.pressurePa >= 0)
      || (room.airPressure === 'positive' && room.pressurePa <= 0)
      || room.hepaFilterHealth < 75,
  ).length;
  const selectedCategory = isolationCategories.find((item) => item.value === category)!;

  useEffect(() => {
    const timer = window.setInterval(tickScrubbing, 60_000);
    return () => window.clearInterval(timer);
  }, [tickScrubbing]);

  return (
    <main className="mx-auto max-w-[1400px] space-y-5">
      <header className="glass-panel flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Page 2 · Infection prevention</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Isolation Room Maintenance</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">Monitor negative air pressure, HEPA filtration, and technician-approved decontamination before room reuse.</p>
        </div>
        <button type="button" onClick={() => setAddRoomOpen(true)} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"><Plus aria-hidden="true" className="mr-1.5 inline h-4 w-4" /> Add Isolation Unit</button>
      </header>

      <CategorySelector label="Isolation room categories" options={isolationCategories} value={category} onChange={setCategory} />
      <AnimatePresence mode="wait">
        <motion.section
          key={category}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="space-y-5"
        >
          <div className="glass-panel space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Category overview</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{selectedCategory.label}</h2>
                <p className="mt-1 max-w-3xl text-sm text-slate-600">{selectedCategory.purpose}</p>
                <p className="mt-2 text-xs font-semibold text-teal-800">
                  Air sensors online: {categoryRooms.length}/{categoryRooms.length} · {sensorAlerts ? `${sensorAlerts} alert${sensorAlerts > 1 ? 's' : ''}` : 'all readings normal'}
                </p>
              </div>
              <div className="grid min-w-full gap-2 sm:min-w-[550px] sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs text-slate-500">Occupied Patients</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{occupiedCount}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs text-amber-800">In Maintenance / Scrubbing</p>
                  <p className="mt-1 text-xl font-bold text-amber-900">{maintenanceCount}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs text-emerald-700">Ready / Vacant</p>
                  <p className="mt-1 text-xl font-bold text-emerald-800">{readyRooms.length}</p>
                </div>
              </div>
            </div>

            <section aria-label="Room readiness and purpose allocation" className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Room Readiness &amp; Purpose Allocation</p>
                  <h3 className="mt-1 text-base font-bold text-emerald-950">
                    {readyRooms.length} {readyRooms.length === 1 ? 'Room' : 'Rooms'} Ready for Assignment
                  </h3>
                </div>
                <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                  Decon complete · Pressure normal · Unoccupied
                </span>
              </div>
              {readyRooms.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {readyRooms.map((room) => {
                    const certification = room.category === 'negative'
                      ? 'COVID-19 / Tuberculosis / Measles Intake'
                      : room.category === 'positive'
                        ? 'Protective / Immunocompromised Care'
                        : room.category === 'anteroom'
                          ? 'Isolation Entry / PPE Transition'
                          : 'Convertible / General Isolation';
                    return (
                      <span key={room.roomId} className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-900">
                        <span className="font-bold">{room.roomNumber}</span> · Certified for: {certification}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-sm text-emerald-900">No room in this category currently meets assignment-readiness checks.</p>
              )}
            </section>
          </div>

          <section aria-label="Isolation room sensor monitors" className="grid gap-5 xl:grid-cols-2">
        {categoryRooms.map((room) => {
          const pressureDrop = (room.airPressure === 'negative' && room.pressurePa >= 0)
            || (room.airPressure === 'positive' && room.pressurePa <= 0);
          const locked = room.sanitizationStatus === 'pending_decon';
          const roomReady = isRoomReady(room);
          const vacant = room.patientName === 'Unoccupied' && !room.patientId;
          const roomOccupied = Boolean(room.patientId) || (!locked && !vacant);
          const patient = room.patientId ? patients.find((item) => item.id === room.patientId) : undefined;
          const checklistComplete = Object.values(room.checklist).every(Boolean);
          return (
            <motion.article
              key={room.roomId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass-panel overflow-hidden p-5 sm:p-6 ${pressureDrop ? 'border-amber-300' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{room.roomId}</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">{room.roomNumber}: {room.isolationType} Isolation</h2>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  pressureDrop ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : locked || room.hepaFilterHealth < 75 ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}>
                  {pressureDrop ? 'Critical · Pressure Alert' : locked || room.hepaFilterHealth < 75 ? 'Moderate · Maintenance Required' : 'Normal · Safe Status'}
                </span>
                <button type="button" disabled={!isAdmin || !vacant || locked} title={!isAdmin ? 'Sign in as a Hospital Admin to archive isolation rooms.' : !vacant || locked ? 'Discharge the patient and complete decontamination before archiving this unit.' : 'Move isolation unit to trash'} onClick={() => moveToTrash('Isolation Unit', room.roomId, 'Moved from isolation unit details')} aria-label={`Move ${room.roomNumber} to trash`} className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
              </div>

              {pressureDrop && (
                <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-bold text-amber-900 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  PRESSURE DROP DETECTED: Maintenance Alert Dispatched
                </div>
              )}

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <section aria-label="Patient information" className="rounded-xl border border-slate-200 bg-white p-4">
                  {roomOccupied ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Active patient profile</p>
                      <div className="mt-2 flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50/70 p-3">
                        <UserRound aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                        <div className="min-w-0">
                          {room.patientId ? (
                            <p className="font-semibold text-slate-900">
                              <PatientLink
                                patientId={room.patientId}
                                patientName={`${patient?.name ?? room.patientName} (${room.patientId})`}
                                className="text-base"
                              />
                              {patient && <span className="ml-1 text-sm font-medium text-slate-600">· Age {patient.age || patient.ageGroup || 'not recorded'}</span>}
                            </p>
                          ) : (
                            <p className="text-base font-semibold text-slate-900">{room.patientName}</p>
                          )}
                          <p className="mt-2 text-sm text-slate-700">{room.diagnosis}</p>
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-teal-700" />
                            Admitted {room.admissionDate}
                          </p>
                          {room.attendingPhysician && <p className="mt-1 text-xs text-slate-600">Attending: {room.attendingPhysician}</p>}
                          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-700">
                            <HeartPulse aria-hidden="true" className="h-3.5 w-3.5 text-rose-600" />
                            Vitals: {room.vitalsSummary ?? 'Pending bedside review'}
                          </p>
                          {room.clinicalRisk && (
                            <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              room.clinicalRisk === 'critical'
                                ? 'border-rose-200 bg-rose-50 text-rose-700'
                                : room.clinicalRisk === 'elevated'
                                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            }`}>
                              Clinical risk: {room.clinicalRisk}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : roomReady ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Room allocation</p>
                      <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                        READY FOR PATIENT INTAKE: Certified for {room.category === 'negative' ? 'Airborne Contagion' : room.category === 'positive' ? 'Protective Care' : 'Isolation Use'}
                      </p>
                      <button
                        type="button"
                        disabled={!assignablePatients.length}
                        title={!assignablePatients.length ? 'No unassigned patient records are available.' : undefined}
                        onClick={() => {
                          setAssignmentRoomId(room.roomId);
                          setAssignmentPatientId(assignablePatients[0]?.id ?? '');
                          setAssignmentPhysician('');
                        }}
                        className="mt-3 w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                      >
                        Assign Patient to Room
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Patient information</p>
                      <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
                        {locked ? 'Room is vacant and locked pending decontamination.' : 'Room is not ready for patient assignment.'}
                      </p>
                    </>
                  )}
                </section>

                <section aria-label="Room environmental maintenance" className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Environmental readiness</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={`rounded-xl border p-4 ${pressureDrop ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Gauge aria-hidden="true" className="h-4 w-4 text-teal-700" />
                        <span className="text-xs font-semibold uppercase tracking-wide">Air Pressure</span>
                      </div>
                      <p className={`mt-2 text-2xl font-bold ${pressureDrop ? 'text-rose-700' : 'text-teal-700'}`}>{room.pressurePa} Pa</p>
                      <p className="mt-1 text-xs text-slate-600">{pressureDrop ? 'Pressure Drop Alert' : `${room.airPressure === 'positive' ? 'Positive' : room.airPressure === 'negative' ? 'Negative' : 'Neutral'} pressure normal`}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Wind aria-hidden="true" className="h-4 w-4 text-teal-700" />
                        <span className="text-xs font-semibold uppercase tracking-wide">HEPA Filter Health</span>
                      </div>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{room.hepaFilterHealth}%</p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${room.hepaFilterHealth < 75 ? 'bg-amber-500' : 'bg-teal-500'}`} style={{ width: `${room.hepaFilterHealth}%` }} />
                      </div>
                    </div>
                  </div>
                  {locked && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3">
                      <p className="text-sm font-semibold text-rose-800">Air Scrubbing: {room.airScrubbingMinutesRemaining} mins remaining</p>
                      <p className="mt-1 text-xs text-slate-600">Room remains locked until circulation and technician checks are complete.</p>
                    </div>
                  )}
                  {!locked && room.airScrubbingMinutesRemaining > 0 && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                      Scrubbing Timer: {room.airScrubbingMinutesRemaining} mins remaining
                    </p>
                  )}
                  {locked && (
                    <button
                      data-help-action="decon"
                      type="button"
                      onClick={() => setChecklistRoom(room.roomId)}
                      className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                    >
                      <ClipboardCheck aria-hidden="true" className="mr-2 inline h-4 w-4" />
                      Open Safety Checklist
                    </button>
                  )}
                </section>
              </div>

              {!locked && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    {roomOccupied ? 'Patient remains in care; room is not vacant.' : roomReady ? 'Decontamination complete; room unlocked and ready.' : 'Room is vacant but requires maintenance before assignment.'}
                  </p>
                  {vacant && <button type="button" onClick={() => startRoomDecontamination(room.roomId)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                    Start Lockout / Decon
                  </button>}
                </div>
              )}
              {locked && checklistComplete && room.airScrubbingMinutesRemaining === 0 && (
                <button
                  data-help-action="decon"
                  type="button"
                  onClick={() => completeDecontamination(room.roomId)}
                  className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Complete Decon &amp; Unlock Room
                </button>
              )}
            </motion.article>
          );
        })}
      </section>
        </motion.section>
      </AnimatePresence>

      <AnimatePresence>
        {assignmentRoom && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => { if (event.target === event.currentTarget) setAssignmentRoomId(null); }}
          >
            <motion.form
              role="dialog"
              aria-modal="true"
              aria-labelledby="isolation-admission-title"
              className="glass-panel w-full max-w-lg space-y-4 bg-white p-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              onSubmit={(event) => {
                event.preventDefault();
                if (!assignmentPatientId || !assignmentPhysician.trim()) return;
                assignPatientToIsolationRoom(assignmentRoom.roomId, assignmentPatientId, assignmentPhysician);
                setAssignmentRoomId(null);
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Patient admission</p>
                  <h2 id="isolation-admission-title" className="mt-1 text-xl font-bold text-slate-900">Assign to {assignmentRoom.roomNumber}</h2>
                  <p className="mt-1 text-sm text-slate-600">Only unassigned patient records can be admitted to this ready room.</p>
                </div>
                <button type="button" aria-label="Close patient admission" onClick={() => setAssignmentRoomId(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              {assignablePatients.length ? (
                <>
                  <label className="block text-sm font-medium text-slate-700">
                    Patient
                    <select
                      required
                      value={assignmentPatientId}
                      onChange={(event) => setAssignmentPatientId(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                    >
                      {assignablePatients.map((patient) => (
                        <option key={patient.id} value={patient.id}>{patient.name} ({patient.id}) · Age {patient.age || patient.ageGroup || 'not recorded'}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Attending Physician
                    <input
                      required
                      value={assignmentPhysician}
                      onChange={(event) => setAssignmentPhysician(event.target.value)}
                      placeholder="Dr. Name"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5"
                    />
                  </label>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setAssignmentRoomId(null)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">Admit Patient</button>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  No unassigned patients are available. Assign or register a patient before admission.
                </div>
              )}
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {addRoomOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setAddRoomOpen(false); }}>
            <motion.form className="glass-panel w-full max-w-md space-y-4 bg-white p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onSubmit={(event) => {
              event.preventDefault();
              if (!newRoomNumber.trim()) return;
              addIsolationRoom({
                roomNumber: newRoomNumber.trim(),
                airPressure: category === 'negative' ? 'negative' : category === 'positive' ? 'positive' : 'normal',
                category,
                isolationType: category === 'negative' ? 'Airborne' : 'Contact',
                patientName: 'Unoccupied',
                diagnosis: 'No active case',
                admissionDate: '—',
                sanitizationStatus: 'clean',
                pressurePa: Number(newRoomPressure),
                hepaFilterHealth: 100,
                airScrubbingMinutesRemaining: 0,
                checklist: { ppeEquipmentChecked: true, hepaFilterInspected: true, pressureTestPassed: true },
              });
              setNewRoomNumber('');
              setAddRoomOpen(false);
            }}>
              <h2 className="text-xl font-bold text-slate-900">Add Isolation Unit</h2>
              <label className="block text-sm font-medium text-slate-700">Room Number<input required value={newRoomNumber} onChange={(event) => setNewRoomNumber(event.target.value)} placeholder="ISO-06" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
              <p className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900">Category: {selectedCategory.label}</p>
              <label className="block text-sm font-medium text-slate-700">Initial Pressure (Pa)<input type="number" value={newRoomPressure} onChange={(event) => setNewRoomPressure(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
              <button type="submit" className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white hover:bg-teal-700">Create Isolation Unit</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeRoom && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setChecklistRoom(null);
            }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="technician-checklist-title"
              className="glass-panel w-full max-w-lg bg-white p-5 shadow-2xl sm:p-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Technician verification · {activeRoom.roomNumber}</p>
                  <h2 id="technician-checklist-title" className="mt-1 text-xl font-bold text-slate-900">Digital Safety Checklist</h2>
                </div>
                <button aria-label="Close checklist" type="button" onClick={() => setChecklistRoom(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5 space-y-3">
                {safetyChecks.map((check) => (
                  <label key={check.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={activeRoom.checklist[check.key]}
                      onChange={(event) => updateChecklist(activeRoom.roomId, check.key, event.target.checked)}
                      className="h-4 w-4 accent-teal-600"
                    />
                    {check.label}
                  </label>
                ))}
              </div>
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                {activeRoom.airScrubbingMinutesRemaining > 0
                  ? `Air scrubbing must finish before this room can be unlocked (${activeRoom.airScrubbingMinutesRemaining} minutes remaining).`
                  : 'All safety checklist items must be verified before the room is unlocked.'}
              </p>
              <button
                data-help-action="decon"
                type="button"
                disabled={!Object.values(activeRoom.checklist).every(Boolean) || activeRoom.airScrubbingMinutesRemaining > 0}
                onClick={() => {
                  completeDecontamination(activeRoom.roomId);
                  setChecklistRoom(null);
                }}
                className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Complete Decon &amp; Unlock Room
              </button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
