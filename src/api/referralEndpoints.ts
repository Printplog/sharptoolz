import { apiClient } from "./apiClient";

export type ReferralStats = {
    referral_code: string;
    total_referrals: number;
    successful_referrals: number;
    total_earned: number;
    referral_link: string;
};

export type LeaderboardEntry = {
    username: string;
    successful_referrals: number;
    total_earned: number;
};

export const getReferralStats = async (): Promise<ReferralStats> => {
    const res = await apiClient.get('/referrals/stats/');
    return res.data;
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const res = await apiClient.get('/referrals/leaderboard/');
    return res.data;
};
