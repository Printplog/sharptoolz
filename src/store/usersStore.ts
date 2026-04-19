import { create } from 'zustand';
import { adminUsers } from '@/api/apiEndpoints';
import type { AdminUsers } from '@/types';

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
  
  // Actions
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearchQuery: (query: string) => void;
  setSearchInput: (input: string) => void;
  setRoleFilter: (role: 'all' | 'admin' | 'staff' | 'user') => void;
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

  fetchUsers: async () => {
    const { currentPage, pageSize, searchQuery, roleFilter } = get();
    
    set({ isLoading: true, error: null });
    
    try {
      const data = await adminUsers({
        page: currentPage,
        page_size: pageSize,
        search: searchQuery,
        role: roleFilter,
      });
      set({ data, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        isLoading: false 
      });
    }
  },

  handleSearch: () => {
    const { searchInput } = get();
    get().setSearchQuery(searchInput);
  },

  resetSearch: () => {
    set({ searchQuery: '', searchInput: '', currentPage: 1 });
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
    });
  },
}));
