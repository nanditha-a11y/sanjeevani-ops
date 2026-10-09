import { create } from 'zustand';
import type {
  Campaign,
  BloodInventory,
  DonorAppointment,
  IsolationRoom,
  InsuranceClaim,
  Patient,
  Bed,
  LabTest,
  OperationalAlert,
  Ward,
  TrashRecord,
  BillingLineItem,
  AboutUsContent,
  AuthUser,
  PatientFeedback,
  PhysicianWorkload,
} from '../types';
import {
  mockBloodInventory,
  mockCampaigns,
  mockDonorAppointments,
  mockIsolationRooms,
  mockInsuranceClaims,
  mockPatients,
  mockBeds,
  mockLabTests,
  mockAlerts,
  mockWards,
  mockAboutUsContent,
  mockPatientFeedback,
  mockPhysicianWorkloads,
} from '../data/mockData';

type TimeOffset = 'NOW' | '+1h' | '+2h' | '+4h';

interface OpsStore {
  hospitalHealthScore: number;
  activeTimeOffset: TimeOffset;
  alerts: OperationalAlert[];
  beds: Bed[];
  labTests: LabTest[];
  patients: Patient[];
  isolationRooms: IsolationRoom[];
  campaigns: Campaign[];
  insuranceClaims: InsuranceClaim[];
  bloodInventory: BloodInventory[];
  donorAppointments: DonorAppointment[];
  emergencySmsDispatches: number;
  wards: Ward[];
  aboutUsContent: AboutUsContent;
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  trashRecords: TrashRecord[];
  selectedPatientRecordId: string | null;
  patientFeedback: PatientFeedback[];
  physicianWorkloads: PhysicianWorkload[];
  updateAboutUsContent: (updates: Partial<AboutUsContent>) => void;
  resetAboutUsSection: (section: keyof AboutUsContent) => void;
  clearAboutUsSection: (section: keyof AboutUsContent) => void;
  login: (user: Omit<AuthUser, 'id'>) => void;
  logout: () => void;

  dispatchAction: (alertId: string) => void;
  completeLabTest: (testId: string) => void;
  clearInsuranceClaim: (claimId: string) => void;
  completeRoomSanitization: (roomId: string) => void;
  startRoomDecontamination: (roomId: string) => void;
  incrementBloodDrive: (campaignId: string, units?: number) => void;
  clearBillingItem: (bedId: string, description: string) => void;
  completeDecontamination: (roomId: string) => void;
  checkInDonor: (appointmentId: string) => void;
  broadcastEmergencySms: () => void;
  completeDischargeStage: (patientId: string, stageId: Patient['dischargeStages'][number]['id']) => void;
  releaseBed: (bedId: string) => void;
  fastTrackBedDischarge: (bedId: string) => void;
  flagLamaWaiver: (patientId: string) => void;
  escalateExpiredClaims: () => void;
  emergencyTpaOverride: (claimId: string) => void;
  tickIsolationScrubbing: () => void;
  updateIsolationChecklist: (
    roomId: string,
    item: keyof IsolationRoom['checklist'],
    checked: boolean,
  ) => void;
  clearPatientBillingItem: (patientId: string, description: string) => void;
  setTimeOffset: (offset: TimeOffset) => void;
  moveToTrash: (recordType: TrashRecord['recordType'], recordId: string, reason?: string) => void;
  restoreFromTrash: (trashId: string) => void;
  permanentlyDelete: (trashId: string) => void;
  addWard: (ward: Omit<Ward, 'id'>) => void;
  addPatientToWard: (input: { wardName: string; id: string; name: string; age: number; gender: string; bedNumber: string; chiefComplaint: string; attendingPhysician: string }) => void;
  assignPatientToIsolationRoom: (roomId: string, patientId: string, attendingPhysician: string) => void;
  addIsolationRoom: (room: Omit<IsolationRoom, 'roomId'>) => void;
  addCampaign: (campaign: Omit<Campaign, 'id'>) => void;
  addInsuranceClaim: (claim: Omit<InsuranceClaim, 'claimId'>) => void;
  openPatientRecord: (patientId: string | null) => void;
  togglePatientChecklist: (patientId: string, itemId: string, completed: boolean) => void;
  addPatientDocument: (patientId: string, documentName: string) => void;
  addPatientCharge: (patientId: string, item: BillingLineItem) => void;
  updatePatientNotes: (patientId: string, notes: string) => void;
  addPatientFeedback: (feedback: Omit<PatientFeedback, 'id' | 'timestamp' | 'status'>) => void;
  updatePatientFeedbackStatus: (feedbackId: string, status: PatientFeedback['status']) => void;
  reassignPatientDoctor: (patientId: string, doctorName: string) => void;
}

export const useOpsStore = create<OpsStore>((set, get) => ({
  hospitalHealthScore: 72,
  activeTimeOffset: 'NOW',
  alerts: mockAlerts,
  beds: mockBeds,
  labTests: mockLabTests,
  patients: mockPatients,
  isolationRooms: mockIsolationRooms,
  campaigns: mockCampaigns,
  insuranceClaims: mockInsuranceClaims,
  bloodInventory: mockBloodInventory,
  donorAppointments: mockDonorAppointments,
  emergencySmsDispatches: 0,
  wards: mockWards,
  aboutUsContent: { ...mockAboutUsContent },
  currentUser: null,
  isAuthenticated: false,
  trashRecords: [],
  selectedPatientRecordId: null,
  patientFeedback: mockPatientFeedback,
  physicianWorkloads: mockPhysicianWorkloads,
  updateAboutUsContent: (updates) => set((state) => state.currentUser?.role === 'hospital_admin'
    ? { aboutUsContent: { ...state.aboutUsContent, ...updates } }
    : state),
  resetAboutUsSection: (section) => set((state) => state.currentUser?.role === 'hospital_admin'
    ? { aboutUsContent: { ...state.aboutUsContent, [section]: mockAboutUsContent[section] } }
    : state),
  clearAboutUsSection: (section) => set((state) => state.currentUser?.role === 'hospital_admin'
    ? {
      aboutUsContent: {
        ...state.aboutUsContent,
        [section]: section === 'bedCapacity' ? 0 : '',
      },
    }
    : state),
  login: (user) => set({
    currentUser: { ...user, id: `USER-${Date.now()}` },
    isAuthenticated: true,
  }),
  logout: () => set({ currentUser: null, isAuthenticated: false }),

  dispatchAction: (alertId: string) => {
    const state = get();
    const alert = state.alerts.find((a) => a.id === alertId);

    if (!alert) return;

    const updatedLabTests = state.labTests.map((test) => {
      if (test.id === 'L882') {
        return { ...test, status: 'completed' as const };
      }
      return test;
    });

    const updatedBeds = state.beds.map((bed) => {
      if (bed.id === 'B12') {
        return { ...bed, dischargeReadiness: 100, blockedByTaskId: undefined };
      }
      if (bed.blockedByTaskId === 'L882') {
        return { ...bed, blockedByTaskId: undefined };
      }
      return bed;
    });

    const alertsWithoutResolved = state.alerts.filter((a) => a.id !== alertId);

    set({
      alerts: alertsWithoutResolved,
      labTests: updatedLabTests,
      beds: updatedBeds,
      hospitalHealthScore: Math.min(100, state.hospitalHealthScore + 12),
    });
  },

  completeLabTest: (testId: string) => {
    const state = get();
    const test = state.labTests.find((item) => item.id === testId);

    if (!test || test.status === 'completed') return;

    const updatedBeds = state.beds.map((bed) => {
      if (bed.blockedByTaskId === testId) {
        return {
          ...bed,
          dischargeReadiness: 100,
          blockedByTaskId: undefined,
        };
      }
      if (testId === 'L882' && bed.id === 'B12') {
        return {
          ...bed,
          dischargeReadiness: 100,
          blockedByTaskId: undefined,
        };
      }
      return bed;
    });
    const clearsDischargeBlocker = test.isDischargeBlocker || testId === 'L882';

    set({
      labTests: state.labTests.map((item) =>
        item.id === testId ? { ...item, status: 'completed' as const } : item,
      ),
      patients: state.patients.map((patient) => patient.id === test.patientId
        ? {
          ...patient,
          completedActions: [
            ...(patient.completedActions ?? []),
            { description: `Lab ${test.id} completed · ${test.testName}`, completedAt: new Date().toLocaleString() },
          ],
        }
        : patient),
      beds: updatedBeds,
      alerts: clearsDischargeBlocker
        ? state.alerts.filter((alert) => alert.id !== 'A001')
        : state.alerts,
      hospitalHealthScore: Math.min(
        100,
        state.hospitalHealthScore + (clearsDischargeBlocker ? 12 : 3),
      ),
    });
  },

  clearInsuranceClaim: (claimId: string) => {
    const state = get();
    const claim = state.insuranceClaims.find((item) => item.claimId === claimId);

    if (!claim || claim.approvalStatus === 'pre_approved') return;

    set({
      insuranceClaims: state.insuranceClaims.map((item) =>
        item.claimId === claimId
          ? { ...item, approvalStatus: 'pre_approved', requiresSuperintendentSignoff: false }
          : item,
      ),
      patients: state.patients.map((patient) =>
        patient.name === claim.patientName
          ? {
            ...patient,
            billingStatus: 'tpa_preauthorized',
            dischargeStages: patient.dischargeStages.map((stage) =>
              stage.id === 'insurance_preapproval' ? { ...stage, completed: true } : stage,
            ),
          }
          : patient,
      ),
      beds: state.beds.map((bed) =>
        bed.patientId && state.patients.find(
          (patient) => patient.id === bed.patientId && patient.name === claim.patientName,
        )
          ? { ...bed, billingStatus: 'tpa_preauthorized' }
          : bed,
      ),
    });
  },

  completeRoomSanitization: (roomId: string) => {
    const state = get();
    if (!state.isolationRooms.some((room) => room.roomId === roomId)) return;

    set({
      isolationRooms: state.isolationRooms.map((room) =>
        room.roomId === roomId
          ? {
            ...room,
            sanitizationStatus: 'clean',
            patientName: 'Unoccupied',
            patientId: undefined,
            attendingPhysician: undefined,
            vitalsSummary: undefined,
            clinicalRisk: undefined,
            diagnosis: 'No active case',
            admissionDate: '—',
          }
          : room,
      ),
    });
  },

  startRoomDecontamination: (roomId: string) => {
    const state = get();
    if (!state.isolationRooms.some((room) => room.roomId === roomId && room.sanitizationStatus === 'clean' && room.patientName === 'Unoccupied' && !room.patientId)) return;
    set({
      isolationRooms: state.isolationRooms.map((room) =>
        room.roomId === roomId
          ? {
            ...room,
            sanitizationStatus: 'pending_decon',
            patientName: 'Unoccupied',
            diagnosis: 'No active case',
            admissionDate: '—',
            airScrubbingMinutesRemaining: 14,
            checklist: {
              ppeEquipmentChecked: false,
              hepaFilterInspected: false,
              pressureTestPassed: false,
            },
          }
          : room,
      ),
    });
  },

  incrementBloodDrive: (campaignId: string, units = 1) => {
    const state = get();
    if (!Number.isInteger(units) || units <= 0) return;
    if (!state.campaigns.some((campaign) => campaign.id === campaignId)) return;

    set({
      campaigns: state.campaigns.map((campaign) =>
        campaign.id === campaignId
          ? { ...campaign, collectedUnits: Math.min(campaign.targetUnits, campaign.collectedUnits + units) }
          : campaign,
      ),
      bloodInventory: state.bloodInventory.map((inventory) => {
        const campaign = state.campaigns.find((item) => item.id === campaignId);
        return campaign?.bloodType === inventory.bloodType
          ? { ...inventory, currentUnits: Math.min(inventory.targetUnits, inventory.currentUnits + units) }
          : inventory;
      }),
    });
  },

  clearBillingItem: (bedId: string, description: string) => {
    const state = get();
    const bed = state.beds.find((item) => item.id === bedId);
    if (!bed || !bed.itemizedBill.some((item) => item.description === description && !item.cleared)) return;

    const updatedLedger = bed.itemizedBill.map((item) =>
      item.description === description ? { ...item, cleared: true } : item,
    );
    const isFullyPaid = updatedLedger.every((item) => item.cleared);
    const linkedPatientId = bed.patientId;

    set({
      beds: state.beds.map((item) =>
        item.id === bedId
          ? { ...item, itemizedBill: updatedLedger, billingStatus: isFullyPaid ? 'fully_paid' : item.billingStatus }
          : item,
      ),
      patients: linkedPatientId
        ? state.patients.map((patient) =>
          patient.id === linkedPatientId
            ? {
              ...patient,
              itemizedBill: patient.itemizedBill.map((item) =>
                item.description === description ? { ...item, cleared: true } : item,
              ),
              billingStatus: isFullyPaid ? 'fully_paid' : patient.billingStatus,
            }
            : patient,
        )
        : state.patients,
    });
  },

  completeDecontamination: (roomId: string) => {
    const state = get();
    const room = state.isolationRooms.find((item) => item.roomId === roomId);
    if (!room || room.sanitizationStatus !== 'pending_decon') return;
    if (!Object.values(room.checklist).every(Boolean)) return;
    if (room.airScrubbingMinutesRemaining > 0) return;

    set({
      isolationRooms: state.isolationRooms.map((item) =>
        item.roomId === roomId
          ? {
            ...item,
            sanitizationStatus: 'clean',
            patientName: 'Unoccupied',
            patientId: undefined,
            attendingPhysician: undefined,
            vitalsSummary: undefined,
            clinicalRisk: undefined,
            diagnosis: 'No active case',
            admissionDate: '—',
            airScrubbingMinutesRemaining: 0,
          }
          : item,
      ),
      beds: room.linkedBedId
        ? state.beds.map((bed) => bed.id === room.linkedBedId
          ? { ...bed, occupancyStatus: 'available', dischargeReadiness: 100, blockedByTaskId: undefined }
          : bed)
        : state.beds,
    });
  },

  checkInDonor: (appointmentId: string) => {
    const state = get();
    set({
      donorAppointments: state.donorAppointments.map((appointment) =>
        appointment.id === appointmentId ? { ...appointment, checkedIn: true } : appointment,
      ),
    });
  },

  broadcastEmergencySms: () => {
    const state = get();
    set({ emergencySmsDispatches: state.emergencySmsDispatches + 1 });
  },

  completeDischargeStage: (patientId, stageId) => {
    const state = get();
    const patient = state.patients.find((item) => item.id === patientId);
    if (!patient) return;
    const stageIndex = patient.dischargeStages.findIndex((stage) => stage.id === stageId);
    if (stageIndex < 0 || (stageIndex > 0 && !patient.dischargeStages[stageIndex - 1].completed)) return;
    if (stageId === 'payment_cleared' && !patient.itemizedBill.every((item) => item.cleared)) return;

    set({
      patients: state.patients.map((item) =>
        item.id === patientId
          ? {
            ...item,
            dischargeStages: item.dischargeStages.map((stage) =>
              stage.id === stageId ? { ...stage, completed: true } : stage,
            ),
          }
          : item,
      ),
    });
  },

  releaseBed: (bedId: string) => {
    const state = get();
    const bed = state.beds.find((item) => item.id === bedId);
    if (!bed?.patientId) return;
    const patient = state.patients.find((item) => item.id === bed.patientId);
    if (!patient?.dischargeStages.find((stage) => stage.id === 'payment_cleared')?.completed) return;

    set({
      beds: state.beds.map((item) =>
        item.id === bedId
          ? { ...item, occupancyStatus: 'available', dischargeReadiness: 100, patientId: undefined }
          : item,
      ),
      patients: state.patients.map((item) =>
        item.id === patient.id
          ? {
            ...item,
            status: 'discharged',
            completedActions: [
              ...(item.completedActions ?? []),
              { description: `Bed ${bed.bedNumber} released to housekeeping`, completedAt: new Date().toLocaleString() },
            ],
            dischargeStages: item.dischargeStages.map((stage) =>
              stage.id === 'going_home' ? { ...stage, completed: true } : stage,
            ),
          }
          : item,
      ),
    });
  },

  fastTrackBedDischarge: (bedId: string) => {
    const bed = get().beds.find((item) => item.id === bedId);
    if (!bed || bed.occupancyStatus === 'available') return;
    if (bed.blockedByTaskId) {
      get().completeLabTest(bed.blockedByTaskId);
    }
    set({
      beds: get().beds.map((item) =>
        item.id === bedId
          ? { ...item, dischargeReadiness: 100, occupancyStatus: 'discharge_pending', blockedByTaskId: undefined }
          : item,
      ),
    });
  },

  flagLamaWaiver: (patientId: string) => {
    set({
      patients: get().patients.map((patient) =>
        patient.id === patientId ? { ...patient, lamaWaiverFlagged: true } : patient,
      ),
    });
  },

  escalateExpiredClaims: () => {
    const state = get();
    if (!state.insuranceClaims.some((claim) => claim.approvalStatus === 'pending')) {
      return;
    }

    set({
      insuranceClaims: state.insuranceClaims.map((claim) =>
        claim.approvalStatus !== 'pending'
          ? claim
          : claim.deadlineMinutesLeft <= 1
            ? {
              ...claim,
              deadlineMinutesLeft: 0,
              approvalStatus: 'escalated',
              requiresSuperintendentSignoff: true,
            }
            : { ...claim, deadlineMinutesLeft: claim.deadlineMinutesLeft - 1 },
      ),
    });
  },

  emergencyTpaOverride: (claimId: string) => {
    const state = get();
    const claim = state.insuranceClaims.find((item) => item.claimId === claimId);
    if (!claim || !claim.vitalsWorsening || claim.approvalStatus === 'pre_approved') return;

    set({
      insuranceClaims: state.insuranceClaims.map((item) =>
        item.claimId === claimId
          ? { ...item, approvalStatus: 'pre_approved', requiresSuperintendentSignoff: false }
          : item,
      ),
      beds: state.beds.map((bed) => {
        const linkedPatient = state.patients.find((patient) => patient.id === bed.patientId);
        return linkedPatient?.name === claim.patientName ? { ...bed, billingStatus: 'tpa_preauthorized' } : bed;
      }),
      patients: state.patients.map((patient) =>
        patient.name === claim.patientName
          ? {
            ...patient,
            billingStatus: 'tpa_preauthorized',
            dischargeStages: patient.dischargeStages.map((stage) =>
              stage.id === 'insurance_preapproval' ? { ...stage, completed: true } : stage,
            ),
          }
          : patient,
      ),
    });
  },

  tickIsolationScrubbing: () => {
    const state = get();
    set({
      isolationRooms: state.isolationRooms.map((room) =>
        room.sanitizationStatus === 'pending_decon' && room.airScrubbingMinutesRemaining > 0
          ? { ...room, airScrubbingMinutesRemaining: room.airScrubbingMinutesRemaining - 1 }
          : room,
      ),
    });
  },

  updateIsolationChecklist: (roomId, item, checked) => {
    const state = get();
    set({
      isolationRooms: state.isolationRooms.map((room) =>
        room.roomId === roomId
          ? { ...room, checklist: { ...room.checklist, [item]: checked } }
          : room,
      ),
    });
  },

  clearPatientBillingItem: (patientId, description) => {
    const state = get();
    const patient = state.patients.find((item) => item.id === patientId);
    if (!patient || !patient.itemizedBill.some((item) => item.description === description && !item.cleared)) return;

    const ledger = patient.itemizedBill.map((item) =>
      item.description === description ? { ...item, cleared: true } : item,
    );
    const fullyPaid = ledger.every((item) => item.cleared);
    set({
      patients: state.patients.map((item) => item.id === patientId
        ? { ...item, itemizedBill: ledger, billingStatus: fullyPaid ? 'fully_paid' : item.billingStatus }
        : item),
      beds: state.beds.map((bed) => bed.patientId === patientId
        ? {
          ...bed,
          itemizedBill: bed.itemizedBill.map((item) =>
            item.description === description ? { ...item, cleared: true } : item,
          ),
          billingStatus: fullyPaid ? 'fully_paid' : bed.billingStatus,
        }
        : bed),
    });
  },

  moveToTrash: (recordType, recordId, reason = 'Archived by administrator') => {
    const state = get();
    if (state.currentUser?.role !== 'hospital_admin') return;
    let record: TrashRecord | undefined;
    const deletedAt = new Date().toISOString();
    const trashId = `${recordType.toLowerCase().replace(/ /g, '-')}-${recordId}-${Date.now()}`;

    switch (recordType) {
      case 'Patient': {
        const patient = state.patients.find((item) => item.id === recordId);
        if (!patient) return;
        const relatedBeds = state.beds.filter((bed) => bed.patientId === patient.id);
        record = { id: trashId, recordType, itemName: patient.name, deletedAt, reason, record: patient, relatedBeds };
        set({
          patients: state.patients.filter((item) => item.id !== recordId),
          beds: state.beds.map((bed) => bed.patientId === recordId
            ? { ...bed, patientId: undefined, occupancyStatus: 'available', dischargeReadiness: 0 }
            : bed),
        });
        break;
      }
      case 'Ward': {
        const ward = state.wards.find((item) => item.id === recordId);
        if (!ward) return;
        if (state.beds.some((bed) => bed.ward === ward.name && bed.occupancyStatus !== 'available')) return;
        record = { id: trashId, recordType, itemName: ward.name, deletedAt, reason, record: ward };
        set({ wards: state.wards.filter((item) => item.id !== recordId) });
        break;
      }
      case 'Isolation Unit': {
        const room = state.isolationRooms.find((item) => item.roomId === recordId);
        if (!room) return;
        if (room.patientName !== 'Unoccupied' || room.sanitizationStatus === 'pending_decon') return;
        record = { id: trashId, recordType, itemName: room.roomNumber, deletedAt, reason, record: room };
        set({ isolationRooms: state.isolationRooms.filter((item) => item.roomId !== recordId) });
        break;
      }
      case 'Blood Drive': {
        const campaign = state.campaigns.find((item) => item.id === recordId);
        if (!campaign) return;
        record = { id: trashId, recordType, itemName: campaign.title, deletedAt, reason, record: campaign };
        set({ campaigns: state.campaigns.filter((item) => item.id !== recordId) });
        break;
      }
      case 'Insurance Claim': {
        const claim = state.insuranceClaims.find((item) => item.claimId === recordId);
        if (!claim) return;
        record = { id: trashId, recordType, itemName: claim.claimId, deletedAt, reason, record: claim };
        set({ insuranceClaims: state.insuranceClaims.filter((item) => item.claimId !== recordId) });
        break;
      }
    }

    if (record) set({ trashRecords: [...get().trashRecords, record] });
  },

  restoreFromTrash: (trashId) => {
    const state = get();
    if (state.currentUser?.role !== 'hospital_admin') return;
    const archived = state.trashRecords.find((item) => item.id === trashId);
    if (!archived) return;
    const trashRecords = state.trashRecords.filter((item) => item.id !== trashId);
    switch (archived.recordType) {
      case 'Patient':
        set({
          patients: [...state.patients, archived.record],
          beds: archived.relatedBeds
            ? state.beds.map((bed) => archived.relatedBeds?.some((saved) => saved.id === bed.id) ? archived.relatedBeds.find((saved) => saved.id === bed.id)! : bed)
              .concat(archived.relatedBeds.filter((saved) => !state.beds.some((bed) => bed.id === saved.id)))
            : state.beds,
          trashRecords,
        });
        break;
      case 'Ward': set({ wards: [...state.wards, archived.record], trashRecords }); break;
      case 'Isolation Unit': set({ isolationRooms: [...state.isolationRooms, archived.record], trashRecords }); break;
      case 'Blood Drive': set({ campaigns: [...state.campaigns, archived.record], trashRecords }); break;
      case 'Insurance Claim': set({ insuranceClaims: [...state.insuranceClaims, archived.record], trashRecords }); break;
    }
  },

  permanentlyDelete: (trashId) => {
    if (get().currentUser?.role !== 'hospital_admin') return;
    set({ trashRecords: get().trashRecords.filter((item) => item.id !== trashId) });
  },

  addWard: (input) => {
    const state = get();
    if (!input.name.trim()
      || state.wards.some((ward) => ward.name.toLowerCase() === input.name.trim().toLowerCase())
      || state.trashRecords.some((record) => record.recordType === 'Ward' && record.record.name.toLowerCase() === input.name.trim().toLowerCase())) return;
    set({ wards: [...state.wards, { ...input, name: input.name.trim(), id: `WARD-${Date.now()}` }] });
  },

  addPatientToWard: (input) => {
    const state = get();
    if (!input.name.trim()
      || !input.id.trim()
      || state.patients.some((patient) => patient.id === input.id.trim())
      || state.trashRecords.some((record) => record.recordType === 'Patient' && record.record.id === input.id.trim())) return;
    if (!state.wards.some((ward) => ward.name === input.wardName)) return;
    const patient: Patient = {
      id: input.id.trim(),
      name: input.name.trim(),
      age: input.age,
      gender: input.gender,
      department: input.wardName,
      visitType: 'Ward admission',
      status: 'admitted',
      waitingTimeMinutes: 0,
      chiefComplaint: input.chiefComplaint,
      currentDiagnosis: input.chiefComplaint,
      medicalHistory: 'Not recorded',
      adminNotes: '',
      documents: [],
      operationalChecklist: [
        { id: 'vitals', label: 'Vitals Stable', completed: false },
        { id: 'doctor', label: 'Doctor Clearance Signoff', completed: false },
        { id: 'pharmacy', label: 'Pharmacy Verification', completed: false },
        { id: 'tpa', label: 'TPA Pre-Auth', completed: false },
      ],
      completedActions: [],
      itemizedBill: [],
      billingStatus: 'pending_clearance',
      dischargeStages: [
        { id: 'doctor_signoff', label: 'Doctor Signoff', completed: false },
        { id: 'pharmacy_check', label: 'Pharmacy Check', completed: false },
        { id: 'insurance_preapproval', label: 'Insurance Pre-Approval', completed: false },
        { id: 'payment_cleared', label: 'Payment Cleared', completed: false },
        { id: 'going_home', label: 'Going Home', completed: false },
      ],
      dischargeType: 'regular',
      billType: 'provisional',
      dischargeNote: '',
    };
    const bed: Bed = {
      id: `${input.wardName}-${input.bedNumber.trim()}`,
      ward: input.wardName,
      bedNumber: input.bedNumber.trim(),
      occupancyStatus: 'occupied',
      dischargeReadiness: 0,
      patientId: patient.id,
      itemizedBill: [],
      billingStatus: patient.billingStatus,
      wardType: 'general',
      attendingPhysician: input.attendingPhysician,
      wardIssue: input.chiefComplaint,
    };
    set({ patients: [...state.patients, patient], beds: [...state.beds, bed] });
  },

  assignPatientToIsolationRoom: (roomId, patientId, attendingPhysician) => {
    const state = get();
    const room = state.isolationRooms.find((item) => item.roomId === roomId);
    const patient = state.patients.find((item) => item.id === patientId);
    const isPressureNormal = room && (
      (room.airPressure === 'negative' && room.pressurePa < 0)
      || (room.airPressure === 'positive' && room.pressurePa > 0)
      || (room.airPressure === 'normal' && room.pressurePa === 0)
    );
    if (!room || !patient || !isPressureNormal
      || room.patientName !== 'Unoccupied'
      || room.patientId
      || room.sanitizationStatus !== 'clean'
      || room.airScrubbingMinutesRemaining > 0
      || room.hepaFilterHealth < 75
      || state.beds.some((bed) => bed.patientId === patientId)
      || state.isolationRooms.some((item) => item.patientId === patientId)) return;

    set({
      isolationRooms: state.isolationRooms.map((item) => item.roomId === roomId
        ? {
          ...item,
          patientId,
          patientName: patient.name,
          diagnosis: patient.currentDiagnosis || patient.chiefComplaint || patient.visitType,
          admissionDate: new Date().toISOString().slice(0, 10),
          attendingPhysician: attendingPhysician.trim(),
          vitalsSummary: 'Vitals pending bedside review',
          clinicalRisk: patient.status === 'triage' ? 'elevated' : 'stable',
        }
        : item),
      patients: state.patients.map((item) => item.id === patientId
        ? { ...item, department: `Isolation ${room.roomNumber}`, status: 'admitted' }
        : item),
    });
  },

  addIsolationRoom: (input) => {
    set({ isolationRooms: [...get().isolationRooms, { ...input, roomId: `ISO-R${Date.now()}` }] });
  },

  addCampaign: (input) => {
    set({ campaigns: [...get().campaigns, { ...input, id: `CAMP-${Date.now()}` }] });
  },

  addInsuranceClaim: (input) => {
    set({ insuranceClaims: [...get().insuranceClaims, { ...input, claimId: `CLM-${Date.now()}` }] });
  },

  openPatientRecord: (patientId) => set({ selectedPatientRecordId: patientId }),

  togglePatientChecklist: (patientId, itemId, completed) => {
    const defaults = [
      { id: 'vitals', label: 'Vitals Stable', completed: false },
      { id: 'doctor', label: 'Doctor Clearance Signoff', completed: false },
      { id: 'pharmacy', label: 'Pharmacy Verification', completed: false },
      { id: 'tpa', label: 'TPA Pre-Auth', completed: false },
    ];
    set({
      patients: get().patients.map((patient) => {
        if (patient.id !== patientId) return patient;
        const checklist = patient.operationalChecklist ?? defaults;
        const wasCompleted = checklist.find((item) => item.id === itemId)?.completed;
        return {
          ...patient,
          operationalChecklist: checklist.map((item) => item.id === itemId ? { ...item, completed } : item),
          completedActions: completed && !wasCompleted
            ? [...(patient.completedActions ?? []), { description: `${checklist.find((item) => item.id === itemId)?.label ?? itemId} marked complete`, completedAt: new Date().toLocaleString() }]
            : patient.completedActions,
        };
      }),
    });
  },

  addPatientDocument: (patientId, documentName) => {
    set({
      patients: get().patients.map((patient) => patient.id === patientId
        ? { ...patient, documents: [...(patient.documents ?? []), documentName] }
        : patient),
    });
  },

  addPatientCharge: (patientId, item) => {
    set({
      patients: get().patients.map((patient) => patient.id === patientId
        ? { ...patient, itemizedBill: [...patient.itemizedBill, item] }
        : patient),
      beds: get().beds.map((bed) => bed.patientId === patientId
        ? { ...bed, itemizedBill: [...bed.itemizedBill, item] }
        : bed),
    });
  },

  updatePatientNotes: (patientId, notes) => {
    set({
      patients: get().patients.map((patient) => patient.id === patientId ? { ...patient, adminNotes: notes } : patient),
    });
  },

  addPatientFeedback: (feedback) => {
    if (!feedback.issueDescription.trim()) return;
    set((state) => ({
      patientFeedback: [
        {
          ...feedback,
          id: `FB-${Date.now()}`,
          issueDescription: feedback.issueDescription.trim(),
          timestamp: new Date().toISOString(),
          status: 'open',
        },
        ...state.patientFeedback,
      ],
    }));
  },

  updatePatientFeedbackStatus: (feedbackId, status) => {
    set((state) => ({
      patientFeedback: state.patientFeedback.map((feedback) =>
        feedback.id === feedbackId ? { ...feedback, status } : feedback,
      ),
    }));
  },

  reassignPatientDoctor: (patientId, doctorName) => {
    const state = get();
    if (!state.physicianWorkloads.some((doctor) => doctor.doctorName === doctorName)) return;
    const beds = state.beds.map((bed) => bed.patientId === patientId
      ? { ...bed, attendingPhysician: doctorName }
      : bed);
    set({
      beds,
      physicianWorkloads: state.physicianWorkloads.map((doctor) => {
        const assignedBeds = beds.filter((bed) => bed.attendingPhysician === doctor.doctorName && bed.occupancyStatus !== 'available');
        const activePatientsCount = assignedBeds.length;
        const blockedPatientsCount = assignedBeds.filter((bed) => Boolean(bed.blockedByTaskId) || bed.dischargeReadiness >= 80).length;
        return {
          ...doctor,
          activePatientsCount,
          blockedPatientsCount,
          capacityStatus: activePatientsCount >= 4 ? 'overloaded' : activePatientsCount === 0 ? 'available' : 'balanced',
        };
      }),
    });
  },

  setTimeOffset: (offset: TimeOffset) => {
    set({ activeTimeOffset: offset });
  },
}));
