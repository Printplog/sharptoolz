import { apiClient } from "./apiClient";

export interface ReferralStats {
  total_referrals: number;
  rewarded_referrals: number;
  pending_referrals: number;
  total_earned: number;
  withdrawable_balance: string;
  min_withdrawal: string;
  referral_code: string;
  referral_link: string;
  reward_percentage: string;
  min_deposit_threshold: string;
}

export const requestWithdrawal = async (data: { amount: number; usdt_address: string }): Promise<{ detail: string }> => {
  const res = await apiClient.post('/referrals/request_withdrawal/', data);
  return res.data;
};

export const remindFriends = async (): Promise<{ detail: string }> => {
  const res = await apiClient.post('/referrals/remind_friends/');
  return res.data;
};

export interface ReferralRecord {
  id: string;
  referred_username: string;
  referred_email: string;
  is_rewarded: boolean;
  reward_amount: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  username: string;
  amount: number;
}

export const getReferralStats = async (): Promise<ReferralStats> => {
  const res = await apiClient.get('/referrals/stats/');
  return res.data;
};

export const getReferralHistory = async (): Promise<ReferralRecord[]> => {
  const res = await apiClient.get('/referrals/');
  return res.data;
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const res = await apiClient.get('/referrals/leaderboard/');
  return res.data;
};
