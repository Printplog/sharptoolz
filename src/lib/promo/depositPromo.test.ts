import { describe, it, expect } from "vitest";
import { calcBonus, qualifies, amountToUnlock, type DepositPromoConfig } from "./depositPromo";

const cfg: DepositPromoConfig = {
  enable_deposit_promo: true,
  deposit_promo_min_amount: 30,
  deposit_promo_percentage: 100,
  deposit_promo_max_bonus: 50,
  deposit_promo_expiry_days: 7,
  deposit_promo_message: "",
};

describe("depositPromo", () => {
  it("returns 0 below the minimum", () => {
    expect(calcBonus(29.99, cfg)).toBe(0);
    expect(qualifies(29.99, cfg)).toBe(false);
  });
  it("applies percentage at/above min", () => {
    expect(calcBonus(30, cfg)).toBe(30);
    expect(qualifies(30, cfg)).toBe(true);
  });
  it("caps at max bonus", () => {
    expect(calcBonus(500, cfg)).toBe(50);
  });
  it("returns 0 when promo disabled", () => {
    expect(calcBonus(100, { ...cfg, enable_deposit_promo: false })).toBe(0);
  });
  it("amountToUnlock is the gap to the minimum", () => {
    expect(amountToUnlock(18, cfg)).toBe(12);
    expect(amountToUnlock(40, cfg)).toBe(0);
  });
});
