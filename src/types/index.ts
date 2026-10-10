export interface Patient {
  id: string;
  name: string;
  age: number;
  ageGroup?: string;
  admissionId?: string;
  admissionTime?: string;
  expectedDischarge?: string;
  triagePriority?: 'P1' | 'P2';
  department: string;
  visitType: string;
  status: 'arrived' | 'triage' | 'waiting' | 'consulting' | 'discharged' | 'admitted';
  waitingTimeMinutes: number;
  itemizedBill: BillingLineItem[];
  billingStatus: BillingStatus;
  dischargeStages: DischargeStage[];
  dischargeType: DischargeType;
  billType: BillType;
  dischargeNote: string;
  lamaWaiverFlagged?: boolean;
  gender?: string;
  chiefComplaint?: string;
  currentDiagnosis?: string;
  medicalHistory?: string;
  adminNotes?: string;
  documents?: string[];
  operationalChecklist?: Array<{ id: string; label: string; completed: boolean }>;
  completedActions?: Array<{ description: string; completedAt: string }>;
}

export type DischargeType = 'regular' | 'lama' | 'transfer' | 'absconded';
export type BillType = 'provisional' | 'final' | 'credit';

export interface Bed {
  id: string;
  ward: string;
  bedNumber: string;
  occupancyStatus: 'occupied' | 'discharge_pending' | 'available';
  dischargeReadiness: number;
  blockedByTaskId?: string;
  patientId?: string;
  itemizedBill: BillingLineItem[];
  billingStatus: BillingStatus;
  wardType: WardType;
  attendingPhysician: string;
  wardIssue: string;
}

export type WardType = 'general' | 'surgical' | 'pediatric' | 'stepdown' | 'daycare';

export interface Ward {
  id: string;
  name: string;
  floor: number | null;
  totalRooms: number;
  emergencyCapacityThreshold: number;
}

export interface AboutUsContent {
  mission: string;
  history: string;
  bedCapacity: number;
  specialtyCenters: string;
  ownership: string;
  accreditations: string;
  safetyRating: string;
  nationalRanking: string;
  performanceMetrics: string;
  leadership: string;
  affiliations: string;
  communityOutreach: string;
}

export type UserRole = 'hospital_admin' | 'ward_doctor' | 'lab_tech' | 'tpa_officer';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  staffId?: string;
  department?: string;
}

export type PatientFeedbackCategory =
  | 'Lab Delay'
  | 'ED Wait Time'
  | 'Billing Clearance'
  | 'Staff Attentiveness'
  | 'Billing'
  | 'Cleanliness'
  | 'Discharge delay'
  | 'Food'
  | 'Staff behaviour'
  | 'Waiting time';

export interface PatientFeedback {
  id: string;
  patientName: string;
  patientId?: string;
  department: string;
  category: PatientFeedbackCategory;
  issueDescription: string;
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved';
  timestamp: string;
}

export interface PhysicianWorkload {
  doctorId: string;
  doctorName: string;
  department: string;
  activePatientsCount: number;
  blockedPatientsCount: number;
  capacityStatus: 'overloaded' | 'balanced' | 'available';
  availability?: DepartmentDoctorStatus;
}

export type DepartmentDoctorStatus = 'On Duty' | 'In OPD' | 'On Call' | 'On Leave';
export type DepartmentTriagePriority = 'high' | 'moderate' | 'low';

export interface DepartmentDoctor {
  id: string;
  name: string;
  status: DepartmentDoctorStatus;
}

export interface DepartmentPatientAssignment {
  id: string;
  patientId: string;
  patientName: string;
  priority: DepartmentTriagePriority;
  wardName: string;
  bedNumber: string;
}

export interface Department {
  id: string;
  name: string;
  color: string;
  doctors: DepartmentDoctor[];
  patients: DepartmentPatientAssignment[];
}

export interface DischargeStage {
  id: 'doctor_signoff' | 'pharmacy_check' | 'insurance_preapproval' | 'payment_cleared' | 'going_home';
  label: string;
  completed: boolean;
}

export interface BillingLineItem {
  description: string;
  cost: number;
  cleared: boolean;
}

export type BillingStatus = 'pending_clearance' | 'fully_paid' | 'tpa_preauthorized';

export interface IsolationRoom {
  roomId: string;
  roomNumber: string;
  airPressure: 'negative' | 'positive' | 'normal';
  category: 'negative' | 'positive' | 'anteroom' | 'convertible';
  isolationType: 'Airborne' | 'Contact' | 'Viral';
  patientName: string;
  diagnosis: string;
  admissionDate: string;
  sanitizationStatus: 'clean' | 'pending_decon';
  pressurePa: number;
  hepaFilterHealth: number;
  airScrubbingMinutesRemaining: number;
  patientId?: string;
  attendingPhysician?: string;
  vitalsSummary?: string;
  clinicalRisk?: 'stable' | 'elevated' | 'critical';
  checklist: {
    ppeEquipmentChecked: boolean;
    hepaFilterInspected: boolean;
    pressureTestPassed: boolean;
  };
  linkedBedId?: string;
}

export interface Campaign {
  id: string;
  title: string;
  targetUnits: number;
  collectedUnits: number;
  status: 'active' | 'scheduled';
  impactSummary: string;
  bloodType?: BloodInventory['bloodType'];
  donationType: DonationType;
  recipientDetails: string;
  driveLocation: string;
  machineStatus: string;
}

export type DonationType = 'whole_blood' | 'apheresis' | 'autologous' | 'mobile' | 'directed';

export interface BloodInventory {
  bloodType: 'O-Negative' | 'A-Positive' | 'B-Positive';
  currentUnits: number;
  targetUnits: number;
}

export interface DonorAppointment {
  id: string;
  donorName: string;
  bloodType: BloodInventory['bloodType'];
  time: string;
  checkedIn: boolean;
}

export interface HospitalAppointment {
  id: string;
  doctor: string;
  department: string;
  dateTime: string;
  status: 'Cancelled' | 'Completed' | 'No-show' | 'Open slot' | 'Scheduled' | 'Waiting';
  waitingTimeMinutes: number | null;
}

export interface EDWaitTime {
  date: string;
  hour: string;
  averageWaitMinutes: number | null;
}

export interface DischargeRequest {
  id: string;
  patientId: string;
  ward: string;
  bedId: string;
  requestedTime: string;
  pendingTasks: string;
  medicationStatus: string;
  documentStatus: string;
}

export interface CsvPatientRecord {
  patient_id: string;
  age_group: string;
  department: string;
  visit_type: string;
  status: string;
}

export interface CsvBedRecord {
  bed_id: string;
  ward: string;
  bed_type: string;
  occupancy: string;
  patient_id: string;
  admission_discharge_status: string;
}

export interface CsvAdmissionRecord {
  admission_id: string;
  patient_id: string;
  admission_time: string;
  department: string;
  ward: string;
  expected_discharge: string;
  status: string;
  triage_priority: string;
}

export interface CsvDiagnosticRecord {
  test_id: string;
  test: string;
  patient_id: string;
  department: string;
  status: string;
  requested_time: string;
  expected_completion: string;
}

export interface CsvDischargeRecord {
  request_id: string;
  patient_id: string;
  ward: string;
  bed_id: string;
  requested_time: string;
  pending_tasks: string;
  medication_status: string;
  document_status: string;
}

export interface CsvStaffRecord {
  staff_id: string;
  name: string;
  role: string;
  department: string;
  date: string;
  shift: string;
  availability: string;
  patients_assigned: string;
}

export interface CsvFeedbackRecord {
  feedback_id: string;
  date: string;
  department: string;
  category: string;
  severity: string;
  resolution_status: string;
  comment: string;
}

export interface CsvAppointmentRecord {
  appointment_id: string;
  doctor: string;
  department: string;
  datetime: string;
  status: string;
  waiting_time_min: string;
}

export interface CsvEDWaitTimeRecord {
  date: string;
  hour: string;
  ed_avg_wait_min: string;
}

export interface HospitalCsvSource {
  patients: CsvPatientRecord[];
  beds: CsvBedRecord[];
  admissions: CsvAdmissionRecord[];
  diagnostics: CsvDiagnosticRecord[];
  discharge: CsvDischargeRecord[];
  staff: CsvStaffRecord[];
  feedback: CsvFeedbackRecord[];
  appointments: CsvAppointmentRecord[];
  edWaitTimes: CsvEDWaitTimeRecord[];
}

export interface InsuranceClaim {
  claimId: string;
  patientName: string;
  patientHealthStatus: 'critical' | 'stable';
  claimAmount: number;
  tpaProvider: string;
  deadlineMinutesLeft: number;
  approvalStatus: 'pending' | 'pre_approved' | 'escalated';
  requiresSuperintendentSignoff: boolean;
  vitalsWorsening: boolean;
  doctorNotes: string;
  attachedLabResults: string[];
  claimType: ClaimType;
  icdCodes: string[];
}

export type ClaimType = 'cashless' | 'reimbursement' | 'enhancement' | 'copay' | 'denial';

export type TrashRecord =
  | { id: string; recordType: 'Patient'; itemName: string; deletedAt: string; reason: string; record: Patient; relatedBeds?: Bed[] }
  | { id: string; recordType: 'Ward'; itemName: string; deletedAt: string; reason: string; record: Ward }
  | { id: string; recordType: 'Isolation Unit'; itemName: string; deletedAt: string; reason: string; record: IsolationRoom }
  | { id: string; recordType: 'Blood Drive'; itemName: string; deletedAt: string; reason: string; record: Campaign }
  | { id: string; recordType: 'Insurance Claim'; itemName: string; deletedAt: string; reason: string; record: InsuranceClaim };

export interface LabTest {
  id: string;
  testName: string;
  patientId: string;
  patientName: string;
  status: 'pending' | 'processing' | 'completed';
  requestedTimeMinutesAgo: number;
  isDischargeBlocker: boolean;
}

export interface OperationalAlert {
  id: string;
  title: string;
  description: string;
  department: string;
  urgency: 'high' | 'medium' | 'low';
  recommendedAction: string;
  blastRadiusSummary: string;
  autoPilotSecondsLeft: number;
  createdAt: string;
  linkedLabTestIds?: string[];
  linkedBedIds?: string[];
}

export interface HospitalCsvDataset {
  patients: Patient[];
  beds: Bed[];
  wards: Ward[];
  labTests: LabTest[];
  patientFeedback: PatientFeedback[];
  physicianWorkloads: PhysicianWorkload[];
  departments: Department[];
  appointments: HospitalAppointment[];
  edWaitTimes: EDWaitTime[];
  dischargeRequests: DischargeRequest[];
  alerts: OperationalAlert[];
}
