import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, X } from "lucide-react";
import { getSiteSettings } from "@/api/apiEndpoints";
import type { SiteSettings } from "@/types";
import { calcBonus, type DepositPromoConfig } from "@/lib/promo/depositPromo";

const DISMISS_KEY = "deposit_promo_dismissed";

export default function DepositPromoPopup() {
  const location = useLocation();
  const navigate = useNavigate();
  // Lazy-init from localStorage so a previously-dismissed popup never flashes on mount.
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings,
  });

  // Deposit bonus promo config (falls back to disabled while settings are loading/absent)
  const promoCfg: DepositPromoConfig = {
    enable_deposit_promo: settings?.enable_deposit_promo ?? false,
    deposit_promo_min_amount: settings?.deposit_promo_min_amount ?? 0,
    deposit_promo_percentage: settings?.deposit_promo_percentage ?? 0,
    deposit_promo_max_bonus: settings?.deposit_promo_max_bonus ?? 0,
    deposit_promo_expiry_days: settings?.deposit_promo_expiry_days ?? 0,
    deposit_promo_message: settings?.deposit_promo_message ?? "",
  };

  const onWalletPage = location.pathname.includes("/wallet");
  const visible = !!promoCfg.enable_deposit_promo && !onWalletPage && !dismissed;

  const minAmount = Number(promoCfg.deposit_promo_min_amount) || 0;
  const percentage = Number(promoCfg.deposit_promo_percentage) || 0;
  const maxBonus = Number(promoCfg.deposit_promo_max_bonus) || 0;
  const expiryDays = Number(promoCfg.deposit_promo_expiry_days) || 0;
  const sampleBonus = calcBonus(minAmount, promoCfg);

  const message =
    promoCfg.deposit_promo_message ||
    `Deposit $${minAmount.toFixed(0)}+ and get ${percentage}% bonus (up to $${maxBonus.toFixed(0)}).` +
      (expiryDays ? ` Bonus expires ${expiryDays} days after credit.` : "");

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const handleDeposit = () => {
    dismiss();
    navigate("/wallet");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-24 left-4 z-40 w-[calc(100%-2rem)] max-w-sm lg:bottom-6 lg:left-6"
        >
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-black p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-primary/10 blur-[60px]" />

            <div className="relative z-10 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-widest text-primary">
                  Limited Deposit Bonus
                </p>
                <p className="mt-1 text-sm leading-relaxed text-white/80">{message}</p>
              </div>
              <button
                onClick={dismiss}
                className="shrink-0 text-white/30 transition-colors hover:text-white"
                aria-label="Dismiss deposit promo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative z-10 mt-4 flex items-center gap-2">
              <button
                onClick={handleDeposit}
                className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition-all hover:scale-[1.02] active:scale-95"
              >
                Deposit now (+${sampleBonus.toFixed(2)})
              </button>
              <button
                onClick={dismiss}
                className="px-3 py-2.5 text-sm font-medium text-white/40 transition-colors hover:text-white"
              >
                Maybe later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
