export interface Patient {
  id: string;
  name: string;
  age: number;
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
  floor: number;
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

export interface PatientFeedback {
  id: string;
  patientName: string;
  patientId: string;
  department: string;
  category: 'Lab Delay' | 'ED Wait Time' | 'Billing Clearance' | 'Staff Attentiveness';
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
}

export type DepartmentDoctorStatus = 'On Duty' | 'In OPD' | 'On Call';
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
}
