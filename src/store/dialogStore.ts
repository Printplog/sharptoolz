// store/dialogStore.ts
import { create } from 'zustand';

// Define the dialog state shape
type DialogState = {
  dialogs: Record<string, boolean>; // Tracks open/close state for each dialog
  openDialog: (dialogName: string) => void;
  closeDialog: (dialogName: string) => void;
  toggleDialog: (dialogName: string) => void;
};

// Create the Zustand store
export const useDialogStore = create<DialogState>((set) => ({
  dialogs: {}, // Initial state: no dialogs open
  openDialog: (dialogName) =>
    set((state) => ({
      dialogs: { ...state.dialogs, [dialogName]: true },
    })),
  closeDialog: (dialogName) =>
    {
      set((state) => ({
        dialogs: { ...state.dialogs, [dialogName]: false },
      }))

    },
  toggleDialog: (dialogName) =>
    set((state) => ({
      dialogs: { ...state.dialogs, [dialogName]: !state.dialogs[dialogName] },
    })),
}));