import type {
  Bed,
  CsvAdmissionRecord,
  CsvAppointmentRecord,
  CsvBedRecord,
  CsvDiagnosticRecord,
  CsvDischargeRecord,
  CsvEDWaitTimeRecord,
  CsvFeedbackRecord,
  CsvPatientRecord,
  CsvStaffRecord,
  Department,
  DepartmentDoctor,
  DepartmentPatientAssignment,
  DischargeRequest,
  DischargeStage,
  EDWaitTime,
  HospitalAppointment,
  HospitalCsvDataset,
  HospitalCsvSource,
  LabTest,
  OperationalAlert,
  Patient,
  PatientFeedback,
  PhysicianWorkload,
  Ward,
} from '../types';

const DATA_SNAPSHOT = new Date('2026-11-16T10:00:00');
const FILES = {
  patients: 'patients.csv',
  beds: 'beds.csv',
  admissions: 'admissions.csv',
  diagnostics: 'diagnostics.csv',
  discharge: 'discharge.csv',
  staff: 'staff.csv',
  feedback: 'feedback.csv',
  appointments: 'appointments.csv',
  edWaitTimes: 'ed_wait_times.csv',
} as const;

const HEADERS: { [Key in keyof HospitalCsvSource]: Array<keyof HospitalCsvSource[Key][number]> } = {
  patients: ['patient_id', 'age_group', 'department', 'visit_type', 'status'],
  beds: ['bed_id', 'ward', 'bed_type', 'occupancy', 'patient_id', 'admission_discharge_status'],
  admissions: ['admission_id', 'patient_id', 'admission_time', 'department', 'ward', 'expected_discharge', 'status', 'triage_priority'],
  diagnostics: ['test_id', 'test', 'patient_id', 'department', 'status', 'requested_time', 'expected_completion'],
  discharge: ['request_id', 'patient_id', 'ward', 'bed_id', 'requested_time', 'pending_tasks', 'medication_status', 'document_status'],
  staff: ['staff_id', 'name', 'role', 'department', 'date', 'shift', 'availability', 'patients_assigned'],
  feedback: ['feedback_id', 'date', 'department', 'category', 'severity', 'resolution_status', 'comment'],
  appointments: ['appointment_id', 'doctor', 'department', 'datetime', 'status', 'waiting_time_min'],
  edWaitTimes: ['date', 'hour', 'ed_avg_wait_min'],
};

function parseCsv<Row extends object>(
  text: string,
  fileName: string,
  expectedHeaders: readonly string[],
  identityColumn: keyof Row,
): Row[] {
  const source = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error(`${fileName} contains an unterminated quoted field.`);
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.trim() !== '')) rows.push(row);
  }

  const header = rows.shift()?.map((value) => value.trim());
  if (!header?.length || header.some((value) => !value)) {
    throw new Error(`${fileName} is missing a valid header row.`);
  }
  const missingHeaders = expectedHeaders.filter((name) => !header.includes(name));
  if (missingHeaders.length) {
    throw new Error(`${fileName} is missing required column(s): ${missingHeaders.join(', ')}.`);
  }

  const records: Row[] = [];
  rows.forEach((values, rowIndex) => {
    if (values.length !== header.length) {
      console.warn(`Skipping malformed ${fileName} row ${rowIndex + 2}: expected ${header.length} columns, got ${values.length}.`);
      return;
    }
    const record = Object.fromEntries(header.map((key, index) => [key, values[index].trim()])) as Record<string, string>;
    if (!record[String(identityColumn)]) {
      console.warn(`Skipping malformed ${fileName} row ${rowIndex + 2}: missing ${String(identityColumn)}.`);
      return;
    }
    records.push(record as Row);
  });
  return records;
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function dateValue(value: string | undefined): string {
  if (!value?.trim()) return '';
  const normalized = value.trim().replace(' ', 'T');
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(normalized) ? `${normalized}T00:00:00` : normalized);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

function minutesAgo(value: string | undefined): number {
  const parsed = dateValue(value);
  if (!parsed) return 0;
  return Math.max(0, Math.floor((DATA_SNAPSHOT.getTime() - new Date(parsed).getTime()) / 60_000));
}

function patientStatus(value: string | undefined, hasBed: boolean): Patient['status'] {
  const status = normalize(value);
  if (status.includes('discharg')) return 'discharged';
  if (status.includes('triage')) return 'triage';
  if (status.includes('consult')) return 'consulting';
  if (status.includes('wait')) return 'waiting';
  if (hasBed || status.includes('bed') || status.includes('admit')) return 'admitted';
  return 'arrived';
}

function feedbackStatus(value: string | undefined): PatientFeedback['status'] {
  const status = normalize(value);
  if (status === 'resolved' || status === 'closed') return 'resolved';
  if (status === 'in progress' || status === 'investigating') return 'investigating';
  return 'open';
}

function departmentSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function mapWardType(value: string | undefined): Bed['wardType'] {
  const type = normalize(value);
  if (type.includes('paediatric') || type.includes('pediatric')) return 'pediatric';
  if (type.includes('surg')) return 'surgical';
  if (type.includes('day')) return 'daycare';
  if (type.includes('step') || type.includes('hdu')) return 'stepdown';
  return 'general';
}

function buildStages(request?: DischargeRequest): DischargeStage[] {
  const pending = normalize(request?.pendingTasks);
  const medicationDone = ['dispensed', 'complete', 'completed'].includes(normalize(request?.medicationStatus));
  const documentDone = ['complete', 'completed', 'signed'].includes(normalize(request?.documentStatus))
    && !pending.includes('discharge summary');
  return [
    { id: 'doctor_signoff', label: 'Doctor Signoff', completed: documentDone },
    { id: 'pharmacy_check', label: 'Pharmacy Check', completed: medicationDone },
    { id: 'insurance_preapproval', label: 'Insurance Pre-Approval', completed: false },
    { id: 'payment_cleared', label: 'Payment Cleared', completed: false },
    { id: 'going_home', label: 'Going Home', completed: false },
  ];
}

function feedbackCategory(value: string): PatientFeedback['category'] {
  switch (value) {
    case 'Lab Delay':
    case 'ED Wait Time':
    case 'Billing Clearance':
    case 'Staff Attentiveness':
    case 'Billing':
    case 'Cleanliness':
    case 'Discharge delay':
    case 'Food':
    case 'Staff behaviour':
    case 'Waiting time':
      return value;
    default:
      return 'Waiting time';
  }
}

function hasPendingDiagnosticTask(request: DischargeRequest | undefined): boolean {
  const tasks = normalize(request?.pendingTasks);
  return tasks.includes('lab') || tasks.includes('report pending') || tasks.includes('diagnostic');
}

function mapFeedback(rows: CsvFeedbackRecord[]): PatientFeedback[] {
  return rows.map((row) => {
    const rawCategory = row.category || 'Waiting time';
    const rawSeverity = normalize(row.severity);
    return {
      id: row.feedback_id,
      patientName: 'Anonymous feedback',
      department: row.department || 'Unspecified department',
      category: feedbackCategory(rawCategory),
      issueDescription: row.comment || `${rawCategory} feedback; no comment provided.`,
      severity: rawSeverity === 'high' ? 'high' : rawSeverity === 'low' ? 'low' : 'medium',
      status: feedbackStatus(row.resolution_status),
      timestamp: dateValue(row.date) || DATA_SNAPSHOT.toISOString(),
    };
  });
}

function mapDataset(tables: HospitalCsvSource): HospitalCsvDataset {
  const admissions = tables.admissions.filter((row) => row.patient_id);
  const diagnosticRows = tables.diagnostics.filter((row) => row.patient_id);
  const dischargeRows = tables.discharge.filter((row) => row.patient_id);
  const admissionsByPatient = new Map(admissions.map((row) => [row.patient_id, row]));
  const requests: DischargeRequest[] = dischargeRows.map((row) => ({
    id: row.request_id,
    patientId: row.patient_id,
    ward: row.ward || 'Unassigned ward',
    bedId: row.bed_id || '',
    requestedTime: dateValue(row.requested_time) || DATA_SNAPSHOT.toISOString(),
    pendingTasks: row.pending_tasks || '',
    medicationStatus: row.medication_status || 'Unknown',
    documentStatus: row.document_status || 'Unknown',
  }));
  const requestsByPatient = new Map(requests.map((request) => [request.patientId, request]));

  const testRows = diagnosticRows;
  const testsByPatient = new Map<string, CsvDiagnosticRecord[]>();
  testRows.forEach((row) => {
    const list = testsByPatient.get(row.patient_id) ?? [];
    list.push(row);
    testsByPatient.set(row.patient_id, list);
  });
  const labTests: LabTest[] = testRows.map((row) => {
    const status = normalize(row.status);
    const patientId = row.patient_id;
    const patient = tables.patients.find((item) => item.patient_id === patientId);
    const request = requestsByPatient.get(patientId);
    return {
      id: row.test_id,
      testName: row.test || 'Diagnostic test',
      patientId,
      patientName: patientId,
      status: status.includes('complete') || status.includes('final') ? 'completed'
        : status.includes('process') || status.includes('progress') ? 'processing' : 'pending',
      requestedTimeMinutesAgo: minutesAgo(row.requested_time),
      isDischargeBlocker: Boolean(status !== 'completed' && hasPendingDiagnosticTask(request)),
    };
  });

  const bedRows = tables.beds;
  const bedRecords: Bed[] = bedRows.map((row) => {
    const bedId = row.bed_id;
    const ward = row.ward || 'Unassigned ward';
    const patientId = row.patient_id || undefined;
    const occupancy = normalize(row.occupancy);
    const dischargeState = normalize(row.admission_discharge_status);
    const request = patientId ? requestsByPatient.get(patientId) : undefined;
    const pendingTest = patientId && hasPendingDiagnosticTask(request)
      ? labTests.find((test) => test.patientId === patientId && test.isDischargeBlocker
        && test.status !== 'completed')
      : undefined;
    const isAvailable = occupancy.includes('vacant') || occupancy.includes('available') || occupancy.includes('free')
      || (!occupancy && !patientId);
    const isDischargePending = dischargeState.includes('discharge') || Boolean(patientId && requestsByPatient.has(patientId));
    return {
      id: bedId,
      ward,
      bedNumber: bedId,
      occupancyStatus: isAvailable ? 'available' : isDischargePending ? 'discharge_pending' : 'occupied',
      dischargeReadiness: isAvailable ? 100 : isDischargePending ? 50 : 0,
      blockedByTaskId: pendingTest?.test_id,
      patientId: isAvailable ? undefined : patientId,
      itemizedBill: [],
      billingStatus: 'pending_clearance',
      wardType: mapWardType(row.bed_type),
      attendingPhysician: 'Unassigned',
      wardIssue: isDischargePending ? 'Discharge pending' : '',
    };
  });

  const bedsByPatient = new Map<string, Bed>();
  bedRecords.forEach((bed) => {
    if (bed.patientId) bedsByPatient.set(bed.patientId, bed);
  });
  const patients: Patient[] = tables.patients.map((row) => {
    const id = row.patient_id;
    const admission = admissionsByPatient.get(id);
    const request = requestsByPatient.get(id);
    const bed = bedsByPatient.get(id);
    const rawPriority = normalize(admission?.triage_priority);
    const dischargeStageList = buildStages(request);
    return {
      id,
      name: id,
      age: 0,
      ageGroup: row.age_group || undefined,
      admissionId: admission?.admission_id || undefined,
      admissionTime: dateValue(admission?.admission_time) || undefined,
      expectedDischarge: dateValue(admission?.expected_discharge) || undefined,
      triagePriority: rawPriority === 'p1' ? 'P1' : rawPriority === 'p2' ? 'P2' : undefined,
      department: admission?.department || row.department || 'Unspecified department',
      visitType: row.visit_type || 'Not recorded',
      status: patientStatus(admission?.status || row.status, Boolean(bed)),
      waitingTimeMinutes: 0,
      itemizedBill: [],
      billingStatus: 'pending_clearance',
      dischargeStages: dischargeStageList,
      dischargeType: 'regular',
      billType: 'provisional',
      dischargeNote: request?.pendingTasks || '',
      chiefComplaint: undefined,
      currentDiagnosis: undefined,
      adminNotes: undefined,
    };
  });

  const wardsByName = new Map<string, Ward>();
  bedRecords.forEach((bed) => {
    const existing = wardsByName.get(bed.ward);
    if (existing) {
      existing.totalRooms += 1;
    } else {
      wardsByName.set(bed.ward, {
        id: departmentSlug(bed.ward),
        name: bed.ward,
        floor: null,
        totalRooms: 1,
        emergencyCapacityThreshold: 85,
      });
    }
  });
  const wards = [...wardsByName.values()].map((ward) => ({
    ...ward,
    emergencyCapacityThreshold: 85,
  }));

  const selectedShift = DATA_SNAPSHOT.getHours() < 14 ? 'morning' : 'evening';
  const latestStaffDate = tables.staff.reduce((latest, row) =>
    row.date > latest ? row.date : latest, '');
  const selectedStaffRows = tables.staff.filter((row) =>
    row.date === latestStaffDate && normalize(row.shift).includes(selectedShift) && normalize(row.role) === 'doctor');
  const uniqueStaff = new Map<string, CsvStaffRecord>();
  selectedStaffRows.forEach((row) => {
    if (row.staff_id && !uniqueStaff.has(row.staff_id)) uniqueStaff.set(row.staff_id, row);
  });
  const physicianWorkloads: PhysicianWorkload[] = [...uniqueStaff.values()].map((row) => {
    const activePatientsCount = Number.parseInt(row.patients_assigned, 10) || 0;
    const availability = normalize(row.availability);
    const doctorAvailability: PhysicianWorkload['availability'] = availability.includes('leave')
      || availability.includes('unavailable') ? 'On Leave'
      : availability.includes('call') ? 'On Call'
        : availability.includes('opd') ? 'In OPD' : 'On Duty';
    return {
      doctorId: row.staff_id,
      doctorName: row.name || row.staff_id,
      department: row.department || 'Unspecified department',
      activePatientsCount,
      blockedPatientsCount: 0,
      capacityStatus: activePatientsCount >= 25 ? 'overloaded'
        : activePatientsCount >= 10 ? 'balanced' : 'available',
      availability: doctorAvailability,
    };
  });

  const departmentsByName = new Map<string, Department>();
  const departmentNames = new Set([
    ...patients.filter((patient) => patient.status !== 'discharged').map((patient) => patient.department),
    ...physicianWorkloads.map((doctor) => doctor.department),
  ]);
  [...departmentNames].forEach((name, index) => {
    departmentsByName.set(name, {
      id: departmentSlug(name),
      name,
      color: ['#0f766e', '#0284c7', '#7c3aed', '#ea580c', '#be123c'][index % 5],
      doctors: [],
      patients: [],
    });
  });
  const doctorsByDepartment = new Map<string, DepartmentDoctor[]>();
  physicianWorkloads.forEach((doctor) => {
    const list = doctorsByDepartment.get(doctor.department) ?? [];
    const status: DepartmentDoctor['status'] = doctor.availability ?? 'On Duty';
    list.push({ id: doctor.doctorId, name: doctor.doctorName, status });
    doctorsByDepartment.set(doctor.department, list);
  });
  departmentsByName.forEach((department) => {
    department.doctors = doctorsByDepartment.get(department.name) ?? [];
  });
  patients.filter((patient) => patient.status !== 'discharged').forEach((patient) => {
    const department = departmentsByName.get(patient.department);
    if (!department) return;
    const bed = bedsByPatient.get(patient.id);
    const admission = admissionsByPatient.get(patient.id);
    const priority: DepartmentPatientAssignment['priority'] = patient.triagePriority === 'P1' ? 'high'
      : patient.triagePriority === 'P2' ? 'moderate' : 'low';
    department.patients.push({
      id: `${department.id}-${patient.id}`,
      patientId: patient.id,
      patientName: patient.name,
      priority,
      wardName: bed?.ward || admission?.ward || 'Ward not assigned',
      bedNumber: bed?.bedNumber || 'Bed not assigned',
    });
  });

  const feedback = mapFeedback(tables.feedback);
  const alerts: OperationalAlert[] = requests.filter((request) => {
    const medicationPending = !['dispensed', 'complete', 'completed'].includes(normalize(request.medicationStatus));
    const documentsPending = !['complete', 'completed', 'signed'].includes(normalize(request.documentStatus));
    const tasksPending = Boolean(normalize(request.pendingTasks) && !normalize(request.pendingTasks).startsWith('none'));
    return medicationPending || documentsPending || tasksPending;
  }).map((request) => {
    const linkedTests = (testsByPatient.get(request.patientId) ?? [])
      .filter((test) => !normalize(test.status).includes('complete') && hasPendingDiagnosticTask(request))
      .map((test) => test.test_id)
      .filter(Boolean);
    const bed = bedRecords.find((item) => item.id === request.bedId);
    return {
      id: `CSV-${request.id}`,
      title: `Discharge delayed · Patient ${request.patientId}`,
      description: request.pendingTasks || 'Discharge request is awaiting review.',
      department: admissionsByPatient.get(request.patientId)?.department || 'Discharge',
      urgency: linkedTests.length > 0 ? 'high' : 'medium',
      recommendedAction: 'Review pending discharge tasks',
      blastRadiusSummary: `Bed ${request.bedId || 'unassigned'} · ${request.ward}`,
      autoPilotSecondsLeft: 0,
      createdAt: request.requestedTime,
      linkedLabTestIds: linkedTests,
      linkedBedIds: bed ? [bed.id] : [],
    };
  });

  const appointments: HospitalAppointment[] = tables.appointments.map((row) => ({
    id: row.appointment_id || '',
    doctor: row.doctor || 'Unassigned',
    department: row.department || 'Unspecified department',
    dateTime: dateValue(row.datetime) || '',
    status: ['Cancelled', 'Completed', 'No-show', 'Open slot', 'Scheduled', 'Waiting'].includes(row.status)
      ? row.status as HospitalAppointment['status'] : 'Waiting',
    waitingTimeMinutes: row.waiting_time_min.trim() && Number.isFinite(Number(row.waiting_time_min))
      ? Number(row.waiting_time_min) : null,
  }));
  const edWaitTimes: EDWaitTime[] = tables.edWaitTimes.map((row) => ({
    date: row.date || '',
    hour: row.hour || '',
    averageWaitMinutes: row.ed_avg_wait_min.trim() && Number.isFinite(Number(row.ed_avg_wait_min))
      ? Number(row.ed_avg_wait_min) : null,
  }));

  return {
    patients,
    beds: bedRecords,
    wards,
    labTests,
    patientFeedback: feedback,
    physicianWorkloads,
    departments: [...departmentsByName.values()],
    appointments,
    edWaitTimes,
    dischargeRequests: requests,
    alerts,
  };
}

async function fetchCsv<Row extends object>(
  fileName: string,
  expectedHeaders: readonly (keyof Row)[],
  identityColumn: keyof Row,
): Promise<Row[]> {
  const response = await fetch(`/data/${fileName}`);
  if (!response.ok) throw new Error(`Unable to load /data/${fileName} (HTTP ${response.status}).`);
  return parseCsv<Row>(
    await response.text(),
    fileName,
    expectedHeaders.map(String),
    identityColumn,
  );
}

export async function loadHospitalCsvDataset(): Promise<HospitalCsvDataset> {
  const [patients, beds, admissions, diagnostics, discharge, staff, feedback, appointments, edWaitTimes] = await Promise.all([
    fetchCsv<CsvPatientRecord>(FILES.patients, HEADERS.patients, 'patient_id'),
    fetchCsv<CsvBedRecord>(FILES.beds, HEADERS.beds, 'bed_id'),
    fetchCsv<CsvAdmissionRecord>(FILES.admissions, HEADERS.admissions, 'admission_id'),
    fetchCsv<CsvDiagnosticRecord>(FILES.diagnostics, HEADERS.diagnostics, 'test_id'),
    fetchCsv<CsvDischargeRecord>(FILES.discharge, HEADERS.discharge, 'request_id'),
    fetchCsv<CsvStaffRecord>(FILES.staff, HEADERS.staff, 'staff_id'),
    fetchCsv<CsvFeedbackRecord>(FILES.feedback, HEADERS.feedback, 'feedback_id'),
    fetchCsv<CsvAppointmentRecord>(FILES.appointments, HEADERS.appointments, 'appointment_id'),
    fetchCsv<CsvEDWaitTimeRecord>(FILES.edWaitTimes, HEADERS.edWaitTimes, 'date'),
  ]);
  return mapDataset({
    patients,
    beds,
    admissions,
    diagnostics,
    discharge,
    staff,
    feedback,
    appointments,
    edWaitTimes,
  });
}
