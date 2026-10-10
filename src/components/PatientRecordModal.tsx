import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, MessageSquareWarning, Plus, Trash2, X } from 'lucide-react';
import { useOpsStore } from '../store/useOpsStore';
import type { PatientFeedback } from '../types';

const defaultChecklist = [
  { id: 'vitals', label: 'Vitals Stable', completed: false },
  { id: 'doctor', label: 'Doctor Clearance Signoff', completed: false },
  { id: 'pharmacy', label: 'Pharmacy Verification', completed: false },
  { id: 'tpa', label: 'TPA Pre-Auth', completed: false },
];

export function PatientRecordModal() {
  const patientId = useOpsStore((state) => state.selectedPatientRecordId);
  const patients = useOpsStore((state) => state.patients);
  const beds = useOpsStore((state) => state.beds);
  const openPatientRecord = useOpsStore((state) => state.openPatientRecord);
  const moveToTrash = useOpsStore((state) => state.moveToTrash);
  const isAdmin = useOpsStore((state) => state.currentUser?.role === 'hospital_admin');
  const toggleChecklist = useOpsStore((state) => state.togglePatientChecklist);
  const addDocument = useOpsStore((state) => state.addPatientDocument);
  const addCharge = useOpsStore((state) => state.addPatientCharge);
  const updateNotes = useOpsStore((state) => state.updatePatientNotes);
  const patientFeedback = useOpsStore((state) => state.patientFeedback);
  const addPatientFeedback = useOpsStore((state) => state.addPatientFeedback);
  const updatePatientFeedbackStatus = useOpsStore((state) => state.updatePatientFeedbackStatus);
  const physicianWorkloads = useOpsStore((state) => state.physicianWorkloads);
  const reassignPatientDoctor = useOpsStore((state) => state.reassignPatientDoctor);
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeCost, setChargeCost] = useState('');
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintCategory, setComplaintCategory] = useState<PatientFeedback['category']>('Lab Delay');
  const [complaintSeverity, setComplaintSeverity] = useState<PatientFeedback['severity']>('medium');
  const [complaintDescription, setComplaintDescription] = useState('');
  const patient = patients.find((item) => item.id === patientId);
  const bed = patient ? beds.find((item) => item.patientId === patient.id) : undefined;
  const checklist = patient?.operationalChecklist ?? defaultChecklist;
  const total = patient?.itemizedBill.reduce((sum, item) => sum + item.cost, 0) ?? 0;
  const documents = patient?.documents ?? [];
  const patientComplaints = patientFeedback.filter((feedback) => feedback.patientId === patient?.id);
  const physicianLoad = bed ? beds.filter((item) => item.attendingPhysician === bed.attendingPhysician && item.occupancyStatus !== 'available').length : 0;
  const physicianBlockedLoad = bed ? beds.filter((item) => item.attendingPhysician === bed.attendingPhysician
    && item.occupancyStatus !== 'available'
    && (Boolean(item.blockedByTaskId) || item.dischargeReadiness >= 80)).length : 0;
  const physicianCapacity = physicianLoad >= 4 ? 'overloaded' : physicianLoad === 0 ? 'available' : 'balanced';

  const attachDocument = (file?: File) => {
    if (patient && file) addDocument(patient.id, file.name);
  };

  const submitCharge = () => {
    const cost = Number(chargeCost);
    if (!patient || !chargeDescription.trim() || !Number.isFinite(cost) || cost < 0) return;
    addCharge(patient.id, { description: chargeDescription.trim(), cost, cleared: false });
    setChargeDescription('');
    setChargeCost('');
  };

  const submitComplaint = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patient || !complaintDescription.trim()) return;
    addPatientFeedback({
      patientName: patient.name,
      patientId: patient.id,
      department: bed?.ward ?? patient.department,
      category: complaintCategory,
      issueDescription: complaintDescription,
      severity: complaintSeverity,
    });
    setComplaintDescription('');
    setComplaintOpen(false);
  };

  return (
    <AnimatePresence>
      {patient && (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) openPatientRecord(null); }}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-record-title"
            className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl sm:p-7"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Comprehensive administrative record</p>
                <h2 id="patient-record-title" className="mt-1 text-2xl font-bold text-slate-900">{patient.name}</h2>
                <p className="mt-1 text-sm text-slate-600">{patient.id} · {patient.age ? `${patient.age} years` : patient.ageGroup ? `Age ${patient.ageGroup}` : 'Age not recorded'} · {patient.gender ?? 'Gender not recorded'} · {bed ? `${bed.ward} / ${bed.bedNumber}` : patient.department}</p>
                {bed && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">Attending physician:</span>
                    <select aria-label="Reassign attending physician" value={bed.attendingPhysician} onChange={(event) => reassignPatientDoctor(patient.id, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                      {physicianWorkloads.map((doctor) => <option key={doctor.doctorId} value={doctor.doctorName}>{doctor.doctorName}</option>)}
                    </select>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${physicianCapacity === 'overloaded' ? 'bg-rose-100 text-rose-800' : physicianCapacity === 'available' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'}`}>
                      {physicianLoad} active · {physicianBlockedLoad} blocked · {physicianCapacity}
                    </span>
                  </div>
                )}
              </div>
              <button type="button" aria-label="Close patient record" onClick={() => openPatientRecord(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-5 py-5">
              <section className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
                <h3 className="font-bold text-slate-900">Main Issue &amp; AI Operational Summary</h3>
                <p className="mt-2 text-sm text-slate-700">Chief complaint: {patient.chiefComplaint ?? patient.visitType}</p>
                <p className="mt-1 text-sm text-slate-700">Current diagnosis: {patient.currentDiagnosis ?? patient.visitType}</p>
                <p className="mt-1 text-sm text-slate-700">Operational status: {bed?.blockedByTaskId ? `Bottleneck · awaiting ${bed.blockedByTaskId}` : bed ? `${bed.dischargeReadiness}% discharge readiness` : patient.status}</p>
              </section>

              <section>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-slate-900">Documents &amp; Attachments</h3>
                  <label className="cursor-pointer rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100">
                    <Plus aria-hidden="true" className="mr-1 inline h-4 w-4" /> Attach Document
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="sr-only" onChange={(event) => attachDocument(event.target.files?.[0])} />
                  </label>
                </div>
                <ul className="mt-3 space-y-2">
                  {documents.map((document, index) => (
                    <li key={`${document}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                      <FileText aria-hidden="true" className="h-4 w-4 text-teal-700" /> {document}
                    </li>
                  ))}
                  {documents.length === 0 && <li className="text-sm text-slate-500">No documents attached.</li>}
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-slate-900">Itemized Payment &amp; Billing Ledger</h3>
                <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 px-3">
                  {patient.itemizedBill.map((item, index) => (
                    <li key={`${item.description}-${index}`} className="flex justify-between gap-3 py-2.5 text-sm">
                      <span className="text-slate-700">{item.description} {item.cleared ? <span className="text-emerald-700">· Cleared</span> : null}</span>
                      <span className="font-mono font-semibold text-slate-900">${item.cost.toFixed(2)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between py-2.5 text-sm font-bold text-slate-900"><span>Total</span><span>${total.toFixed(2)}</span></li>
                </ul>
                <form className="mt-3 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); submitCharge(); }}>
                  <input required aria-label="Charge description" value={chargeDescription} onChange={(event) => setChargeDescription(event.target.value)} placeholder="Charge description" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <input required aria-label="Charge amount" type="number" min="0" step="0.01" value={chargeCost} onChange={(event) => setChargeCost(event.target.value)} placeholder="Amount" className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <button type="submit" className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"><Plus aria-hidden="true" className="mr-1 inline h-4 w-4" /> Add Charge Item</button>
                </form>
              </section>

              <section>
                <h3 className="font-bold text-slate-900">Operational Checklist</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {checklist.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                      <input type="checkbox" checked={item.completed} onChange={(event) => toggleChecklist(patient.id, item.id, event.target.checked)} className="h-4 w-4 accent-teal-600" />
                      {item.label}
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-bold text-slate-900">Completed Actions Log</h3>
                <ol className="mt-2 space-y-2">
                  {(patient.completedActions ?? []).map((action, index) => (
                    <li key={`${action.completedAt}-${index}`} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{action.completedAt} · {action.description}</li>
                  ))}
                  {!patient.completedActions?.length && <li className="text-sm text-slate-500">No completed actions recorded yet.</li>}
                </ol>
              </section>

              <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MessageSquareWarning aria-hidden="true" className="h-5 w-5 text-amber-700" />
                    <h3 className="font-bold text-slate-900">Patient Feedback &amp; Complaints History</h3>
                  </div>
                  <button type="button" onClick={() => setComplaintOpen((open) => !open)} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-50">
                    <Plus aria-hidden="true" className="mr-1 inline h-4 w-4" /> Log Complaint
                  </button>
                </div>
                {complaintOpen && (
                  <form onSubmit={submitComplaint} className="mt-4 grid gap-3 rounded-lg border border-amber-200 bg-white p-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-slate-600">Category
                      <select value={complaintCategory} onChange={(event) => setComplaintCategory(event.target.value as PatientFeedback['category'])} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal">
                        <option>Lab Delay</option><option>ED Wait Time</option><option>Billing Clearance</option><option>Staff Attentiveness</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-slate-600">Severity
                      <select value={complaintSeverity} onChange={(event) => setComplaintSeverity(event.target.value as PatientFeedback['severity'])} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal">
                        <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Issue description
                      <textarea required value={complaintDescription} onChange={(event) => setComplaintDescription(event.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal" placeholder="Describe the patient's concern…" />
                    </label>
                    <button type="submit" className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 sm:col-span-2">Save Complaint</button>
                  </form>
                )}
                <ul className="mt-3 space-y-2">
                  {patientComplaints.map((feedback) => (
                    <li key={feedback.id} className="rounded-lg border border-amber-100 bg-white p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{feedback.category} <span className="font-normal text-slate-500">· {feedback.severity} severity</span></p>
                          <p className="mt-1 text-sm text-slate-700">{feedback.issueDescription}</p>
                          <p className="mt-1 text-xs text-slate-500">{new Date(feedback.timestamp).toLocaleString()} · {feedback.status}</p>
                        </div>
                        {feedback.status !== 'resolved' && <button type="button" onClick={() => updatePatientFeedbackStatus(feedback.id, 'resolved')} className="shrink-0 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">Resolve Complaint</button>}
                        {feedback.status === 'resolved' && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Resolved</span>}
                      </div>
                    </li>
                  ))}
                  {!patientComplaints.length && <li className="text-sm text-slate-500">No feedback or complaints recorded for this patient.</li>}
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-slate-900">Past Medical History &amp; Notes</h3>
                <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{patient.medicalHistory ?? 'Allergies, chronic conditions, and prior hospitalizations not recorded.'}</p>
                <label className="mt-3 block text-xs font-semibold text-slate-600" htmlFor="patient-admin-notes">Administrative notes</label>
                <textarea id="patient-admin-notes" value={patient.adminNotes ?? ''} onChange={(event) => updateNotes(patient.id, event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800" placeholder="Add administrative notes…" />
              </section>

              <section className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                <h3 className="font-bold text-rose-900">Admin Danger Zone</h3>
                <button type="button" disabled={!isAdmin} title={!isAdmin ? 'Sign in as a Hospital Admin to archive patient records.' : undefined} onClick={() => { moveToTrash('Patient', patient.id, 'Moved from patient record drawer'); openPatientRecord(null); }} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                  <Trash2 aria-hidden="true" className="h-4 w-4" /> Move Patient Record to Trash
                </button>
              </section>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
