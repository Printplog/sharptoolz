import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { logout as logoutApi } from "@/api/apiEndpoints";
import { useAuthStore } from "@/store/authStore";
import { useWalletStore } from "@/store/walletStore";
import useChatStore from "@/store/chatStore";
import useToolStore from "@/store/formStore";
import { useUsersStore } from "@/store/usersStore";
import { useSvgStore } from "@/store/useSvgStore";
import { queryClient } from "@/lib/queryClient";
import { toast } from "sonner";

export const useLogout = () => {
  const navigate = useNavigate();
  const authLogout = useAuthStore((state) => state.logout);
  const walletReset = useWalletStore((state) => state.resetWallet);
  const chatClear = useChatStore((state) => state.clearChat);
  const formReset = useToolStore((state) => state.resetForm);
  const usersReset = useUsersStore((state) => state.reset);
  const svgReset = useSvgStore((state) => state.reset);

  const { mutate: performLogout, isPending } = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      // 1. Clear React Query Cache (Crucial for session persistence fix)
      queryClient.clear();

      // 2. Reset all Zustand Stores
      authLogout();
      walletReset();
      chatClear();
      formReset();
      usersReset();
      svgReset();

      // 3. Clear any residual local storage if necessary
      // (authStore uses persist, so authLogout() handles auth-storage)

      toast.success("Logged out successfully");
      navigate("/auth/login");
    },
    onError: (error: Error) => {
      // Even if API fails (e.g. session already expired), we should clear local state
      console.error("Logout API failed:", error);
      
      queryClient.clear();
      authLogout();
      walletReset();
      chatClear();
      formReset();
      usersReset();
      svgReset();
      
      navigate("/auth/login");
    },
  });

  const logout = () => {
    performLogout();
  };

  return { logout, isPending };
};
