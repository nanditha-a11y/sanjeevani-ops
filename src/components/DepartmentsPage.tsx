import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, ArrowLeft, BedDouble, Building2, Check, Clock3, Edit3, Plus, Search, Stethoscope, Trash2, UserRound, X } from 'lucide-react';
import { useOpsStore } from '../store/useOpsStore';
import type { Department, DepartmentDoctorStatus, DepartmentTriagePriority } from '../types';

const colorOptions = [
  { value: 'teal', label: 'Teal', className: 'bg-teal-100 text-teal-800 border-teal-200', dot: 'bg-teal-500' },
  { value: 'rose', label: 'Rose', className: 'bg-rose-100 text-rose-800 border-rose-200', dot: 'bg-rose-500' },
  { value: 'violet', label: 'Violet', className: 'bg-violet-100 text-violet-800 border-violet-200', dot: 'bg-violet-500' },
  { value: 'amber', label: 'Amber', className: 'bg-amber-100 text-amber-900 border-amber-200', dot: 'bg-amber-500' },
  { value: 'pink', label: 'Pink', className: 'bg-pink-100 text-pink-800 border-pink-200', dot: 'bg-pink-500' },
  { value: 'blue', label: 'Blue', className: 'bg-sky-100 text-sky-800 border-sky-200', dot: 'bg-sky-500' },
];

const doctorStatuses: DepartmentDoctorStatus[] = ['On Duty', 'In OPD', 'On Call'];
const priorityOrder: Record<DepartmentTriagePriority, number> = { high: 0, moderate: 1, low: 2 };
const priorityLabel: Record<DepartmentTriagePriority, string> = { high: 'High Priority', moderate: 'Moderate Priority', low: 'Low Priority' };

const newDepartment = (): Department => ({
  id: `DEPT-${Date.now()}`,
  name: '',
  color: 'teal',
  doctors: [],
  patients: [],
});

function emptyDoctor() {
  return { id: `DOC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '', status: 'On Duty' as DepartmentDoctorStatus };
}

function emptyAssignment() {
  return {
    id: `ASSIGN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    patientId: '',
    patientName: '',
    priority: 'moderate' as DepartmentTriagePriority,
    wardName: '',
    bedNumber: '',
  };
}

function priorityStyle(priority: DepartmentTriagePriority) {
  if (priority === 'high') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (priority === 'moderate') return 'border-amber-200 bg-amber-50 text-amber-900';
  return 'border-emerald-200 bg-emerald-50 text-emerald-800';
}

function colorStyle(color: string) {
  return colorOptions.find((option) => option.value === color)?.className ?? colorOptions[0].className;
}

interface DepartmentsPageProps {
  onOpenWardFile: (patientId: string, wardName: string) => void;
}

export function DepartmentsPage({ onOpenWardFile }: DepartmentsPageProps) {
  const departments = useOpsStore((state) => state.departments);
  const patients = useOpsStore((state) => state.patients);
  const beds = useOpsStore((state) => state.beds);
  const saveDepartment = useOpsStore((state) => state.saveDepartment);
  const deleteDepartment = useOpsStore((state) => state.deleteDepartment);
  const removeDepartmentPatient = useOpsStore((state) => state.removeDepartmentPatient);
  const wards = useOpsStore((state) => state.wards);
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<Department | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addPatientForm, setAddPatientForm] = useState<{
    name: string;
    patientId: string;
    priority: DepartmentTriagePriority;
    wardName: string;
    bedNumber: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const detailDepartment = departments.find((department) => department.id === detailId);

  const visibleDepartments = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return departments.map((department) => ({
      ...department,
      patients: [...department.patients].sort((first, second) => priorityOrder[first.priority] - priorityOrder[second.priority]),
    })).filter((department) => {
      if (!search) return true;
      const fields = [
        department.name,
        ...department.doctors.map((doctor) => doctor.name),
        ...department.patients.flatMap((assignment) => [
          assignment.patientName,
          assignment.patientId,
          assignment.wardName,
          assignment.bedNumber,
          patients.find((patient) => patient.id === assignment.patientId)?.name ?? '',
          ...beds.filter((bed) => bed.patientId === assignment.patientId).flatMap((bed) => [bed.ward, bed.bedNumber]),
        ]),
      ];
      return fields.some((field) => field.toLocaleLowerCase().includes(search));
    });
  }, [beds, departments, patients, query]);

  const updateDoctor = (index: number, updates: Partial<Department['doctors'][number]>) => {
    if (!editor) return;
    setEditor({ ...editor, doctors: editor.doctors.map((doctor, doctorIndex) => doctorIndex === index ? { ...doctor, ...updates } : doctor) });
  };

  const updateAssignment = (index: number, updates: Partial<Department['patients'][number]>) => {
    if (!editor) return;
    setEditor({ ...editor, patients: editor.patients.map((assignment, assignmentIndex) => assignmentIndex === index ? { ...assignment, ...updates } : assignment) });
  };

  const submitEditor = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor?.name.trim()) {
      setError('Enter a department name.');
      return;
    }
    const duplicate = departments.some((department) => department.id !== editor.id && department.name.toLowerCase() === editor.name.trim().toLowerCase());
    if (duplicate) {
      setError('A department with this name already exists.');
      return;
    }
    const patientIds = editor.patients.map((assignment) => assignment.patientId.trim().toLowerCase());
    if (new Set(patientIds).size !== patientIds.length) {
      setError('A patient can only be listed once in a department.');
      return;
    }
    const incompleteAssignment = editor.patients.find((assignment) => !assignment.patientId.trim() || !assignment.patientName.trim() || !assignment.wardName.trim() || !assignment.bedNumber.trim());
    if (incompleteAssignment) {
      setError('Complete the patient name, ID, assigned ward, and bed number or remove the incomplete entry.');
      return;
    }
    const occupiedBedConflict = editor.patients.find((assignment) => beds.some((bed) =>
      bed.ward.toLowerCase() === assignment.wardName.trim().toLowerCase()
      && bed.bedNumber.toLowerCase() === assignment.bedNumber.trim().toLowerCase()
      && bed.patientId !== assignment.patientId.trim(),
    ));
    if (occupiedBedConflict) {
      setError(`${occupiedBedConflict.wardName} bed ${occupiedBedConflict.bedNumber} is already assigned to another patient.`);
      return;
    }
    saveDepartment({
      ...editor,
      name: editor.name.trim(),
      doctors: editor.doctors.filter((doctor) => doctor.name.trim()).map((doctor) => ({ ...doctor, name: doctor.name.trim() })),
      patients: editor.patients.map((assignment) => ({
        ...assignment,
        patientId: assignment.patientId.trim(),
        patientName: assignment.patientName.trim(),
        wardName: assignment.wardName.trim(),
        bedNumber: assignment.bedNumber.trim(),
      })),
    });
    setEditor(null);
    setError('');
  };

  const submitPatient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detailDepartment || !addPatientForm) return;
    const patientId = addPatientForm.patientId.trim();
    const duplicateInDepartment = detailDepartment.patients.some((assignment) => assignment.patientId.toLowerCase() === patientId.toLowerCase());
    const bedConflict = beds.some((bed) => bed.ward.toLowerCase() === addPatientForm.wardName.toLowerCase()
      && bed.bedNumber.toLowerCase() === addPatientForm.bedNumber.trim().toLowerCase()
      && bed.patientId !== patientId);
    if (duplicateInDepartment) {
      setDetailError('This patient is already assigned to the department.');
      return;
    }
    if (bedConflict) {
      setDetailError('That bed is already assigned to another patient.');
      return;
    }
    const assignment = {
      id: `ASSIGN-${Date.now()}`,
      patientId,
      patientName: addPatientForm.name.trim(),
      priority: addPatientForm.priority,
      wardName: addPatientForm.wardName,
      bedNumber: addPatientForm.bedNumber.trim(),
    };
    saveDepartment({ ...detailDepartment, patients: [...detailDepartment.patients, assignment] });
    setAddPatientForm(null);
    setDetailError('');
  };

  const confirmRemovePatient = (assignmentId: string, patientName: string) => {
    if (!detailDepartment) return;
    const confirmed = window.confirm(`Remove ${patientName} from ${detailDepartment.name}? Their patient and ward records will remain unchanged.`);
    if (confirmed) removeDepartmentPatient(detailDepartment.id, assignmentId);
  };

  return (
    <main className="mx-auto max-w-[1400px] space-y-5">
      <section className="sticky top-36 z-20 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-md shadow-slate-900/5 backdrop-blur-xl sm:top-24 sm:p-4 lg:top-20" aria-label="Global department search">
        <label className="flex items-center gap-3">
          <Search aria-hidden="true" className="ml-1 h-5 w-5 shrink-0 text-teal-700" />
          <span className="sr-only">Search departments, doctors, patients, wards, and beds</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search departments, doctors, patients, patient IDs, wards, or beds…" className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X aria-hidden="true" className="h-4 w-4" /></button>}
        </label>
      </section>

      <header className="glass-panel flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Operations directory</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Departments Management</h1>
          <p className="mt-2 text-sm text-slate-600">Coordinate on-duty teams, patient triage, and ward assignments across departments.</p>
        </div>
        <button type="button" onClick={() => { setEditor(newDepartment()); setError(''); }} className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700">
          <Plus aria-hidden="true" className="mr-1.5 inline h-4 w-4" /> Add Department
        </button>
      </header>

      <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
        <p>{query ? `${visibleDepartments.length} matching department${visibleDepartments.length === 1 ? '' : 's'}` : `${departments.length} departments`}</p>
        <p className="hidden items-center gap-1.5 sm:flex"><Activity aria-hidden="true" className="h-4 w-4 text-teal-700" /> Patients ordered by triage severity</p>
      </div>

      <section className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Department cards">
        {visibleDepartments.map((department) => {
          const doctorsOnDuty = department.doctors.filter((doctor) => doctor.status === 'On Duty').length;
          const patientsSorted = [...department.patients].sort((first, second) => priorityOrder[first.priority] - priorityOrder[second.priority]);
          return (
            <motion.article
              layout
              key={department.id}
              role="group"
              tabIndex={0}
              aria-label={`Open ${department.name} department details`}
              onClick={() => { setDetailId(department.id); setDetailError(''); }}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setDetailId(department.id);
                  setDetailError('');
                }
              }}
              className="glass-panel cursor-pointer overflow-hidden transition hover:-translate-y-0.5 hover:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <header className="flex items-start justify-between gap-3 p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`rounded-xl border p-2.5 ${colorStyle(department.color)}`}><Building2 aria-hidden="true" className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-slate-900">{department.name}</h2>
                    <p className="mt-1 text-xs text-slate-500">{department.doctors.length} {department.doctors.length === 1 ? 'Doctor' : 'Doctors'} · {patientsSorted.length} Admitted {patientsSorted.length === 1 ? 'Patient' : 'Patients'}</p>
                  </div>
                </div>
                <div className="relative z-10 flex shrink-0 gap-1" onClick={(event) => event.stopPropagation()}>
                  <button type="button" aria-label={`Edit ${department.name}`} onClick={() => { setEditor({ ...department, doctors: department.doctors.map((doctor) => ({ ...doctor })), patients: department.patients.map((assignment) => ({ ...assignment })) }); setError(''); }} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"><Edit3 aria-hidden="true" className="h-4 w-4" /></button>
                  <button type="button" aria-label={`Delete ${department.name}`} onClick={() => {
                    if (window.confirm(`Delete ${department.name}? This removes the department grouping, not patient or ward records.`)) {
                      deleteDepartment(department.id);
                      if (detailId === department.id) setDetailId(null);
                    }
                  }} className="rounded-lg border border-rose-200 bg-white p-2 text-rose-700 hover:bg-rose-50"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
                </div>
              </header>
              <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
                <div className="flex flex-wrap gap-2">
                  {department.doctors.slice(0, 3).map((doctor) => (
                    <span key={doctor.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">
                      <UserRound aria-hidden="true" className="h-3.5 w-3.5 text-teal-700" /> {doctor.name} · {doctor.status}
                    </span>
                  ))}
                  {!department.doctors.length && <span className="text-xs text-slate-500">No doctors assigned</span>}
                  {department.doctors.length > 3 && <span className="rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">+{department.doctors.length - 3} more</span>}
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="text-slate-500">{doctorsOnDuty} on duty · {patientsSorted.filter((patient) => patient.priority === 'high').length} high priority</span>
                  <span className="font-semibold text-teal-800">Open details →</span>
                </div>
              </div>
            </motion.article>
          );
        })}
        {!visibleDepartments.length && <p className="glass-panel p-6 text-sm text-slate-600">{query ? 'No departments or assigned records match this search.' : 'No departments yet. Add a department to get started.'}</p>}
      </section>

      <AnimatePresence>
        {detailDepartment && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/35 p-3 backdrop-blur-sm sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) { setDetailId(null); setAddPatientForm(null); } }}>
            <motion.section role="dialog" aria-modal="true" aria-labelledby="department-detail-title" className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl" initial={{ opacity: 0, y: 12, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.99 }}>
              <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 p-4 backdrop-blur sm:px-6">
                <div className="flex items-center gap-3">
                  <span className={`rounded-xl border p-2.5 ${colorStyle(detailDepartment.color)}`}><Building2 aria-hidden="true" className="h-5 w-5" /></span>
                  <div>
                    <button type="button" onClick={() => { setDetailId(null); setAddPatientForm(null); }} className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:text-teal-900"><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Back to Departments</button>
                    <h2 id="department-detail-title" className="text-xl font-bold text-slate-900">{detailDepartment.name}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setAddPatientForm({ name: '', patientId: '', priority: 'moderate', wardName: wards[0]?.name ?? 'Ward A', bedNumber: '' }); setDetailError(''); }} className="rounded-lg bg-teal-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"><Plus aria-hidden="true" className="mr-1 inline h-4 w-4" /> Add Patient</button>
                  <button type="button" aria-label="Close department details" onClick={() => { setDetailId(null); setAddPatientForm(null); }} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><X aria-hidden="true" className="h-5 w-5" /></button>
                </div>
              </header>

              <div className="space-y-6 p-4 sm:p-6">
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <div><h3 className="flex items-center gap-2 font-bold text-slate-900"><Stethoscope aria-hidden="true" className="h-4 w-4 text-teal-700" /> Assigned Medical Team</h3><p className="mt-1 text-xs text-slate-500">Current specialty coverage and duty status.</p></div>
                    <span className="text-xs text-slate-500">{detailDepartment.doctors.length} doctors</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {detailDepartment.doctors.map((doctor) => (
                      <div key={doctor.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800"><UserRound aria-hidden="true" className="h-4 w-4 text-teal-700" />{doctor.name}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${doctor.status === 'On Duty' ? 'bg-emerald-100 text-emerald-800' : doctor.status === 'In OPD' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-900'}`}>{doctor.status}</span>
                      </div>
                    ))}
                    {!detailDepartment.doctors.length && <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No doctors assigned. Use Edit to configure the medical team.</p>}
                  </div>
                </section>

                {addPatientForm && (
                  <form onSubmit={submitPatient} className="rounded-xl border border-teal-200 bg-teal-50/50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-bold text-slate-900">Assign Patient to {detailDepartment.name}</h3><p className="text-xs text-slate-600">This assignment will update the shared patient and ward records.</p></div><button type="button" aria-label="Cancel adding patient" onClick={() => setAddPatientForm(null)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white"><X aria-hidden="true" className="h-4 w-4" /></button></div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <label className="text-xs font-semibold text-slate-600">Patient Name<input required value={addPatientForm.name} onChange={(event) => setAddPatientForm({ ...addPatientForm, name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal" placeholder="Full name" /></label>
                      <label className="text-xs font-semibold text-slate-600">Patient ID<input required value={addPatientForm.patientId} onChange={(event) => setAddPatientForm({ ...addPatientForm, patientId: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal" placeholder="e.g. P012" /></label>
                      <label className="text-xs font-semibold text-slate-600">Triage Priority<select value={addPatientForm.priority} onChange={(event) => setAddPatientForm({ ...addPatientForm, priority: event.target.value as DepartmentTriagePriority })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal"><option value="high">High Priority</option><option value="moderate">Moderate Priority</option><option value="low">Low Priority</option></select></label>
                      <label className="text-xs font-semibold text-slate-600">Assigned Ward<select value={addPatientForm.wardName} onChange={(event) => setAddPatientForm({ ...addPatientForm, wardName: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal">{[...new Set([...wards.map((ward) => ward.name), 'ICU', 'Isolation'])].map((wardName) => <option key={wardName}>{wardName}</option>)}</select></label>
                      <label className="text-xs font-semibold text-slate-600">Bed Number<input required value={addPatientForm.bedNumber} onChange={(event) => setAddPatientForm({ ...addPatientForm, bedNumber: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal" placeholder="e.g. B05" /></label>
                      <div className="flex items-end"><button type="submit" className="w-full rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"><Check aria-hidden="true" className="mr-1 inline h-4 w-4" /> Assign Patient</button></div>
                    </div>
                    {detailError && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-sm text-rose-800">{detailError}</p>}
                  </form>
                )}

                <section>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div><h3 className="flex items-center gap-2 font-bold text-slate-900"><BedDouble aria-hidden="true" className="h-4 w-4 text-teal-700" /> Patient Priority Triage</h3><p className="mt-1 text-xs text-slate-500">Patients are sorted by clinical severity: High, Moderate, then Low.</p></div>
                    <span className="text-xs font-semibold text-slate-500">{detailDepartment.patients.length} assigned</span>
                  </div>
                  <ul className="space-y-3">
                    {[...detailDepartment.patients].sort((first, second) => priorityOrder[first.priority] - priorityOrder[second.priority]).map((assignment) => {
                      const linkedPatient = patients.find((patient) => patient.id === assignment.patientId);
                      const actualBed = beds.find((bed) => bed.patientId === assignment.patientId);
                      const wardName = actualBed?.ward ?? assignment.wardName;
                      const bedNumber = actualBed?.bedNumber ?? assignment.bedNumber;
                      return (
                        <li key={assignment.id} className={`rounded-xl border-l-4 border p-4 ${assignment.priority === 'high' ? 'border-rose-200 border-l-rose-500 bg-rose-50/50' : assignment.priority === 'moderate' ? 'border-amber-200 border-l-amber-500 bg-amber-50/40' : 'border-emerald-200 border-l-emerald-500 bg-emerald-50/40'}`}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900">{assignment.patientName} <span className="ml-1 rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-600">{assignment.patientId}</span></p>
                              <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${priorityStyle(assignment.priority)}`}>{priorityLabel[assignment.priority]}</span>
                              <p className="mt-2 text-xs text-slate-600">{wardName} · Bed {bedNumber}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button type="button" disabled={!linkedPatient} onClick={() => onOpenWardFile(assignment.patientId, wardName)} title={!linkedPatient ? 'No matching patient record is linked yet.' : `Open ${assignment.patientName}'s ward file`} className="rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50">View Ward File</button>
                              <button type="button" onClick={() => confirmRemovePatient(assignment.id, assignment.patientName)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><Trash2 aria-hidden="true" className="h-3.5 w-3.5" /> Remove Patient</button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                    {!detailDepartment.patients.length && <li className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No patients assigned to this department.</li>}
                  </ul>
                </section>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editor && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-3 backdrop-blur-sm sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setEditor(null); }}>
            <motion.section role="dialog" aria-modal="true" aria-labelledby="department-editor-title" className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl" initial={{ opacity: 0, y: 12, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.99 }}>
              <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 p-4 backdrop-blur sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Department configuration</p>
                  <h2 id="department-editor-title" className="mt-1 text-xl font-bold text-slate-900">{departments.some((department) => department.id === editor.id) ? 'Edit Department' : 'Add Department'}</h2>
                </div>
                <button type="button" aria-label="Close department editor" onClick={() => setEditor(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X aria-hidden="true" className="h-5 w-5" /></button>
              </header>
              <form onSubmit={submitEditor} className="space-y-6 p-4 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">Department Name
                    <input required value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} placeholder="e.g. Cardiology" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100" />
                  </label>
                  <label className="text-sm font-semibold text-slate-700">Color Theme
                    <select value={editor.color} onChange={(event) => setEditor({ ...editor, color: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal">
                      {colorOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                </div>

                <section className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div><h3 className="font-bold text-slate-900">Doctors Manager</h3><p className="text-xs text-slate-500">Add clinicians and set their current status.</p></div>
                    <button type="button" onClick={() => setEditor({ ...editor, doctors: [...editor.doctors, emptyDoctor()] })} className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100"><Plus aria-hidden="true" className="mr-1 inline h-4 w-4" /> Add Doctor</button>
                  </div>
                  <div className="space-y-2">
                    {editor.doctors.map((doctor, index) => (
                      <div key={doctor.id} className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
                        <input aria-label={`Doctor ${index + 1} name`} value={doctor.name} onChange={(event) => updateDoctor(index, { name: event.target.value })} placeholder="Doctor name" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                        <select aria-label={`Doctor ${index + 1} status`} value={doctor.status} onChange={(event) => updateDoctor(index, { status: event.target.value as DepartmentDoctorStatus })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                          {doctorStatuses.map((status) => <option key={status}>{status}</option>)}
                        </select>
                        <button type="button" aria-label={`Remove ${doctor.name || 'doctor'}`} onClick={() => setEditor({ ...editor, doctors: editor.doctors.filter((_, doctorIndex) => doctorIndex !== index) })} className="rounded-lg border border-rose-200 px-3 py-2 text-rose-700 hover:bg-rose-50"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
                      </div>
                    ))}
                    {!editor.doctors.length && <p className="text-sm text-slate-500">No doctors added.</p>}
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div><h3 className="font-bold text-slate-900">Patients Manager</h3><p className="text-xs text-slate-500">Assignments sync to the global patient and ward records when saved.</p></div>
                    <button type="button" onClick={() => setEditor({ ...editor, patients: [...editor.patients, emptyAssignment()] })} className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100"><Plus aria-hidden="true" className="mr-1 inline h-4 w-4" /> Add Patient</button>
                  </div>
                  <div className="space-y-3">
                    {editor.patients.map((assignment, index) => (
                      <div key={assignment.id} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-3">
                        <input aria-label={`Patient ${index + 1} name`} value={assignment.patientName} onChange={(event) => updateAssignment(index, { patientName: event.target.value })} placeholder="Patient name" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
                        <input aria-label={`Patient ${index + 1} ID`} value={assignment.patientId} onChange={(event) => updateAssignment(index, { patientId: event.target.value })} placeholder="Patient ID (e.g. P012)" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
                        <select aria-label={`Patient ${index + 1} triage priority`} value={assignment.priority} onChange={(event) => updateAssignment(index, { priority: event.target.value as DepartmentTriagePriority })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                          <option value="high">High Priority</option><option value="moderate">Moderate Priority</option><option value="low">Low Priority</option>
                        </select>
                        <input aria-label={`Patient ${index + 1} assigned ward`} value={assignment.wardName} onChange={(event) => updateAssignment(index, { wardName: event.target.value })} placeholder="Assigned ward" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
                        <input aria-label={`Patient ${index + 1} bed number`} value={assignment.bedNumber} onChange={(event) => updateAssignment(index, { bedNumber: event.target.value })} placeholder="Bed number" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
                        <button type="button" onClick={() => setEditor({ ...editor, patients: editor.patients.filter((_, assignmentIndex) => assignmentIndex !== index) })} className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><Trash2 aria-hidden="true" className="h-4 w-4" /> Remove Patient</button>
                      </div>
                    ))}
                    {!editor.patients.length && <p className="text-sm text-slate-500">No patient assignments added.</p>}
                  </div>
                </section>

                {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                  <button type="button" onClick={() => setEditor(null)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"><Check aria-hidden="true" className="mr-1.5 inline h-4 w-4" /> Save Department</button>
                </div>
              </form>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
