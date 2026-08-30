import { afterEach, describe, expect, it } from "vitest";

import type { User } from "@/types";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";
import {
  establishAuthenticatedSession,
  expireAuthenticatedSession,
  getAuthSessionGeneration,
} from "./authSession";

const user: User = {
  pk: 1,
  username: "tester",
  email: "tester@example.com",
  total_purchases: 0,
  downloads: 0,
  wallet_balance: "0.00",
  is_active: true,
  is_staff: false,
  date_joined: "2026-01-01T00:00:00Z",
};

afterEach(() => {
  expireAuthenticatedSession();
  queryClient.clear();
});

describe("authenticated session generations", () => {
  it("does not let an expired request clear a newer login", () => {
    const expiredRequestGeneration = getAuthSessionGeneration();

    establishAuthenticatedSession(user);

    expect(expireAuthenticatedSession(expiredRequestGeneration)).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(queryClient.getQueryData(["currentUser"])).toEqual(user);
  });

  it("still clears the session when the failed request belongs to it", () => {
    establishAuthenticatedSession(user);
    const currentGeneration = getAuthSessionGeneration();

    expect(expireAuthenticatedSession(currentGeneration)).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
