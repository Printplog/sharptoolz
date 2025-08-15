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
  
  // Actions
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearchQuery: (query: string) => void;
  setSearchInput: (input: string) => void;
  fetchUsers: () => Promise<void>;
  handleSearch: () => void;
  resetSearch: () => void;
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
    set({ searchQuery: query });
  },

  setSearchInput: (input: string) => {
    set({ searchInput: input });
  },

  fetchUsers: async () => {
    const { currentPage, pageSize, searchQuery } = get();
    
    set({ isLoading: true, error: null });
    
    try {
      const data = await adminUsers({
        page: currentPage,
        page_size: pageSize,
        search: searchQuery,
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
    set({ searchQuery: searchInput, currentPage: 1 });
    get().fetchUsers();
  },

  resetSearch: () => {
    set({ searchQuery: '', searchInput: '', currentPage: 1 });
    get().fetchUsers();
  },
})); 