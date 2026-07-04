export interface DepositPromoConfig {
  enable_deposit_promo: boolean;
  deposit_promo_min_amount: number;
  deposit_promo_percentage: number;
  deposit_promo_max_bonus: number;
  deposit_promo_expiry_days: number;
  deposit_promo_message: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function qualifies(amount: number, cfg: DepositPromoConfig): boolean {
  return !!cfg?.enable_deposit_promo && amount >= Number(cfg.deposit_promo_min_amount);
}

export function calcBonus(amount: number, cfg: DepositPromoConfig): number {
  if (!qualifies(amount, cfg)) return 0;
  const raw = (amount * Number(cfg.deposit_promo_percentage)) / 100;
  return round2(Math.min(raw, Number(cfg.deposit_promo_max_bonus)));
}

export function amountToUnlock(amount: number, cfg: DepositPromoConfig): number {
  if (!cfg?.enable_deposit_promo) return 0;
  const gap = Number(cfg.deposit_promo_min_amount) - amount;
  return gap > 0 ? round2(gap) : 0;
}
