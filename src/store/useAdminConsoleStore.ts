import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type LogType = 'info' | 'warn' | 'error' | 'success' | 'table';

export interface LogMessage {
  id: string;
  timestamp: string;
  type: LogType;
  message: string;
  data?: any;
}

interface AdminConsoleState {
  logs: LogMessage[];
  isOpen: boolean;
  addLog: (type: LogType, message: string, data?: any) => void;
  clearLogs: () => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
}

export const useAdminConsoleStore = create<AdminConsoleState>()(
  persist(
    (set) => ({
      logs: [],
      isOpen: false,
      addLog: (type, message, data) => 
        set((state) => ({
          logs: [
            ...state.logs,
            {
              id: Math.random().toString(36).substring(7),
              timestamp: new Date().toLocaleTimeString(),
              type,
              message,
              data,
            },
          ].slice(-100), // Keep last 100 logs
        })),
      clearLogs: () => set({ logs: [] }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open) => set({ isOpen: open }),
    }),
    {
      name: 'admin-console-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
