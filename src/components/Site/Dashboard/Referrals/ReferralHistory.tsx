import { format } from "date-fns";
import { CheckCircle2, Clock, User } from "lucide-react";
import type { ReferralRecord } from "@/api/referralEndpoints";

interface Props {
  referrals: ReferralRecord[] | undefined;
  isLoading: boolean;
}

export default function ReferralHistory({ referrals, isLoading }: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <h3 className="text-base font-black tracking-tight text-white">Your Referrals</h3>
        <span className="text-[10px] font-bold text-white/20 uppercase bg-white/5 px-3 py-1 rounded-full">
          Recent Activities
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 bg-white/[0.02]">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Earned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 w-32 bg-white/5 rounded" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-20 bg-white/5 rounded" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-12 bg-white/5 rounded ml-auto" /></td>
                </tr>
              ))
            ) : !referrals || referrals.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-white/20 text-xs italic">
                  No referrals found yet. Share your link to start earning!
                </td>
              </tr>
            ) : (
              referrals.map((ref) => (
                <tr key={ref.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black italic uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                          {ref.referred_username}
                        </p>
                        <p className="text-[10px] text-white/30 font-medium">{ref.referred_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {ref.is_rewarded ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        Rewarded
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-white/40 text-[10px] font-black uppercase">
                        <Clock className="w-3 h-3" />
                        Pending
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-white/40 font-bold uppercase">
                    {format(new Date(ref.created_at), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-sm font-black tracking-tighter italic ${ref.is_rewarded ? 'text-[#cee88c]' : 'text-white/20'}`}>
                      {ref.is_rewarded ? `+$${ref.reward_amount}` : "$0.00"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
