import { create } from 'zustand';
import {
  fetchAllPrescriptions,
  fetchMyPrescriptions,
  reviewPrescription,
  uploadPrescription,
} from '../lib/api';
import { Prescription } from '../types';

interface PrescriptionStore {
  prescriptions: Prescription[];
  isLoading: boolean;
  error: string | null;
  uploadPrescription: (file: File) => Promise<Prescription>;
  fetchMyPrescriptions: () => Promise<void>;
  fetchAllPrescriptions: () => Promise<void>;
  getUserPrescriptions: (userId: string) => Prescription[];
  getAllPrescriptions: () => Prescription[];
  updatePrescriptionStatus: (
    prescriptionId: string,
    status: 'approved' | 'rejected',
    reviewedBy: string,
    notes?: string,
  ) => Promise<void>;
  getApprovedPrescription: (userId: string) => Prescription | undefined;
  getApprovedPrescriptions: (userId: string) => Prescription[];
}

const upsertPrescription = (prescriptions: Prescription[], prescription: Prescription) => {
  const existingPrescription = prescriptions.find((item) => item.id === prescription.id);
  if (!existingPrescription) {
    return [prescription, ...prescriptions];
  }

  return prescriptions.map((item) =>
    item.id === prescription.id ? prescription : item,
  );
};

export const usePrescriptionStore = create<PrescriptionStore>()((set, get) => ({
  prescriptions: [],
  isLoading: false,
  error: null,

  uploadPrescription: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const prescription = await uploadPrescription(file);
      set((state) => ({
        prescriptions: upsertPrescription(state.prescriptions, prescription),
        isLoading: false,
      }));
      return prescription;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload prescription';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchMyPrescriptions: async () => {
    set({ isLoading: true, error: null });
    try {
      const prescriptions = await fetchMyPrescriptions();
      set({ prescriptions, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch prescriptions',
        isLoading: false,
      });
    }
  },

  fetchAllPrescriptions: async () => {
    set({ isLoading: true, error: null });
    try {
      const prescriptions = await fetchAllPrescriptions();
      set({ prescriptions, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch prescriptions',
        isLoading: false,
      });
    }
  },

  getUserPrescriptions: (userId: string) => {
    return get().prescriptions.filter((prescription) => prescription.userId === userId);
  },

  getAllPrescriptions: () => {
    return get().prescriptions;
  },

  updatePrescriptionStatus: async (
    prescriptionId: string,
    status: 'approved' | 'rejected',
    _reviewedBy: string,
    notes?: string,
  ) => {
    set({ isLoading: true, error: null });
    try {
      const prescription = await reviewPrescription(prescriptionId, {
        status,
        notes,
      });
      set((state) => ({
        prescriptions: upsertPrescription(state.prescriptions, prescription),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update prescription',
        isLoading: false,
      });
      throw error;
    }
  },

  getApprovedPrescription: (userId: string) => {
    return get()
      .prescriptions
      .find(
        (prescription) =>
          prescription.userId === userId && prescription.status === 'approved',
      );
  },

  getApprovedPrescriptions: (userId: string) => {
    return get().prescriptions.filter(
      (prescription) =>
        prescription.userId === userId && prescription.status === 'approved',
    );
  },
}));
