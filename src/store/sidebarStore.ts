import { create } from 'zustand'

interface SidebarStore {
    isOpen: boolean      // For mobile drawer
    isCollapsed: boolean // For desktop side collapse
    toggle: () => void
    toggleCollapsed: () => void
    close: () => void
}

export const useSidebarStore = create<SidebarStore>((set) => ({
    isOpen: false,
    isCollapsed: false,
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
    close: () => set({ isOpen: false }),
}))