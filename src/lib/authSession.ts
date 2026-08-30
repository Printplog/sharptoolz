import type { User } from "@/types";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";

export const SESSION_EXPIRED_TOAST_ID = "session-expired";

let sessionGeneration = 0;

export const getAuthSessionGeneration = () => sessionGeneration;

export const isCurrentAuthSession = (generation: number) =>
  generation === sessionGeneration;

export const establishAuthenticatedSession = (user: User) => {
  // Invalidate responses that were sent with an older cookie before login.
  sessionGeneration += 1;
  void queryClient.cancelQueries({ queryKey: ["currentUser"] });
  queryClient.setQueryData(["currentUser"], user);
  useAuthStore.getState().setUser(user);
};

export const expireAuthenticatedSession = (generation?: number) => {
  if (generation !== undefined && !isCurrentAuthSession(generation)) {
    return false;
  }

  sessionGeneration += 1;
  queryClient.removeQueries({ queryKey: ["currentUser"] });
  useAuthStore.getState().logout();
  return true;
};
