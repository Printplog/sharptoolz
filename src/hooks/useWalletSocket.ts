// src/hooks/useWalletSocket.ts
import { useCallback } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { useWebSocketClient } from './useWebSocketClient';
import type { WalletData } from '@/types';

type WalletEvent = {
  type: 'wallet.updated';
  data: WalletData;
};

export function useWalletSocket() {
  const setWallet = useWalletStore((state) => state.setWallet);

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${protocol}://127.0.0.1:8000/ws/wallet/`;

  // Memoize the callback to prevent unnecessary re-renders
  const handleMessage = useCallback((msg: WalletEvent) => {
    if (msg.type === 'wallet.updated') {
      setWallet(msg.data);
    }
    console.log('[WS] Wallet updated:', msg);
  }, [setWallet]);

  const { sendMessage, connect } = useWebSocketClient<WalletEvent>({
    url: wsUrl,
    onMessage: handleMessage,
    reconnectAttempts: 5, // Increase reconnection attempts for wallet data
    reconnectInterval: 2000,
  });

  return { sendMessage, reconnect: connect };
}