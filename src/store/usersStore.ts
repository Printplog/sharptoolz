import { create } from 'zustand';
import { adminUsers } from '@/api/apiEndpoints';
import errorMessage from '@/lib/utils/errorMessage';
import type { AdminUsers } from '@/types';

// Monotonic counter used to discard stale in-flight responses.
let latestRequestId = 0;

interface UsersState {
  // Data
  data: AdminUsers | null;
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  pageSize: number;
  
  // Search
  searchQuery: string;
  searchInput: string;
  roleFilter: 'all' | 'admin' | 'staff' | 'user';
  sourceFilter: string;
  days: number | null;
  date: string;
  
  // Actions
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearchQuery: (query: string) => void;
  setSearchInput: (input: string) => void;
  setRoleFilter: (role: 'all' | 'admin' | 'staff' | 'user') => void;
  setSourceFilter: (source: string) => void;
  setDays: (days: number | null) => void;
  setDate: (date: string) => void;
  fetchUsers: () => Promise<void>;
  handleSearch: () => void;
  resetSearch: () => void;
  reset: () => void;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  // Initial state
  data: null,
  isLoading: false,
  error: null,
  currentPage: 1,
  pageSize: 10,
  searchQuery: '',
  searchInput: '',
  roleFilter: 'all',
  sourceFilter: '',
  days: null,
  date: '',

  // Actions
  setCurrentPage: (page: number) => {
    set({ currentPage: page });
    get().fetchUsers();
  },

  setPageSize: (size: number) => {
    set({ pageSize: size, currentPage: 1 });
    get().fetchUsers();
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query, currentPage: 1 });
    get().fetchUsers();
  },

  setSearchInput: (input: string) => {
    set({ searchInput: input });
  },

  setRoleFilter: (role: 'all' | 'admin' | 'staff' | 'user') => {
    set({ roleFilter: role, currentPage: 1 });
    get().fetchUsers();
  },

  setSourceFilter: (source: string) => {
    set({ sourceFilter: source, currentPage: 1 });
    get().fetchUsers();
  },

  setDays: (days: number | null) => {
    set({ days, date: '', currentPage: 1 });
    get().fetchUsers();
  },

  setDate: (date: string) => {
    set({ date, days: null, currentPage: 1 });
    get().fetchUsers();
  },

  fetchUsers: async () => {
    const { currentPage, pageSize, searchQuery, roleFilter, sourceFilter, days, date } = get();

    // Page clicks fire faster than the API answers, and responses can land out
    // of order — only the newest request is allowed to write to the store.
    const requestId = latestRequestId + 1;
    latestRequestId = requestId;

    set({ isLoading: true, error: null });

    try {
      const data = await adminUsers({
        page: currentPage,
        page_size: pageSize,
        search: searchQuery,
        role: roleFilter,
        source: sourceFilter,
        days: days || undefined,
        date: date || undefined,
      });
      if (requestId !== latestRequestId) return;
      set({ data, isLoading: false });
    } catch (error) {
      if (requestId !== latestRequestId) return;
      set({
        error: errorMessage(error),
        isLoading: false,
      });
    }
  },

  handleSearch: () => {
    const { searchInput } = get();
    get().setSearchQuery(searchInput);
  },

  resetSearch: () => {
    set({ searchQuery: '', searchInput: '', currentPage: 1, sourceFilter: '' });
    get().fetchUsers();
  },

  reset: () => {
    set({
      data: null,
      isLoading: false,
      error: null,
      currentPage: 1,
      pageSize: 10,
      searchQuery: '',
      searchInput: '',
      roleFilter: 'all',
      sourceFilter: '',
    });
  },
}));
