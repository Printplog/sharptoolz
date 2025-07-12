// src/store/useWalletStore.ts
import type { Transaction, WalletData } from '@/types';
import { create } from 'zustand';



type WalletState = {
  newPayment: boolean;
  setNewPayment: (isTrue: boolean) => void;
  wallet: WalletData | null;
  setWallet: (data: WalletData) => void;
  updateBalance: (newBalance: number) => void;
  addTransaction: (tx: Transaction) => void;
  resetWallet: () => void;
};

export const useWalletStore = create<WalletState>((set) => ({
  newPayment: false,
  setNewPayment: (data) => set({ newPayment: data }),
  wallet: null,
  setWallet: (data) => set({ wallet: data }),
  updateBalance: (newBalance) =>
    set((state) =>
      state.wallet
        ? { wallet: { ...state.wallet, balance: newBalance } }
        : state
    ),
  addTransaction: (tx) =>
    set((state) =>
      state.wallet
        ? {
            wallet: {
              ...state.wallet,
              transactions: [tx, ...state.wallet.transactions],
            },
          }
        : state
    ),
  resetWallet: () => set({ wallet: null }),
}));
