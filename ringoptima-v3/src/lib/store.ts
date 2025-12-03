import { create } from 'zustand';
import type { Contact, Batch, Filter } from '../types';

interface RingoptimaStore {
  // Data
  contacts: Contact[];
  batches: Batch[];

  // UI State
  selectedContacts: number[];
  filter: Filter;
  isCommandPaletteOpen: boolean;

  // Actions
  setContacts: (contacts: Contact[]) => void;
  setBatches: (batches: Batch[]) => void;
  updateContact: (id: number, updates: Partial<Contact>) => void;
  deleteContact: (id: number) => void;

  // Selection
  toggleContactSelection: (id: number) => void;
  selectAllContacts: () => void;
  clearSelection: () => void;

  // Filtering
  setFilter: (filter: Partial<Filter>) => void;
  resetFilter: () => void;

  // UI
  toggleCommandPalette: () => void;
}

const defaultFilter: Filter = {
  search: '',
  operator: '',
  status: '',
  priority: '',
  sort: '',
};

export const useStore = create<RingoptimaStore>((set) => ({
  // Initial state
  contacts: [],
  batches: [],
  selectedContacts: [],
  filter: defaultFilter,
  isCommandPaletteOpen: false,

  // Actions
  setContacts: (contacts) => set({ contacts }),
  setBatches: (batches) => set({ batches }),

  updateContact: (id, updates) =>
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  deleteContact: (id) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
      selectedContacts: state.selectedContacts.filter((cid) => cid !== id),
    })),

  // Selection
  toggleContactSelection: (id) =>
    set((state) => ({
      selectedContacts: state.selectedContacts.includes(id)
        ? state.selectedContacts.filter((cid) => cid !== id)
        : [...state.selectedContacts, id],
    })),

  selectAllContacts: () =>
    set((state) => ({
      selectedContacts: state.contacts.map((c) => c.id!),
    })),

  clearSelection: () => set({ selectedContacts: [] }),

  // Filtering
  setFilter: (filter) =>
    set((state) => ({
      filter: { ...state.filter, ...filter },
    })),

  resetFilter: () => set({ filter: defaultFilter }),

  // UI
  toggleCommandPalette: () =>
    set((state) => ({
      isCommandPaletteOpen: !state.isCommandPaletteOpen,
    })),
}));
