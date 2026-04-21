import axios from "axios";
import { useAuthStore } from "@/store/authStore";


export const BASE_URL = import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:8003";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});


const refreshToken = async () => {
  const response = await axios.post(
    `${BASE_URL}/accounts/refresh-token/`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};


// Interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response, // ✅ Pass successful responses
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthStore.getState();

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn("[AuthInterceptor] 401 Unauthorized detected - Attempting token refresh...");
      originalRequest._retry = true; // ✅ Prevent infinite loops

      try {
        await refreshToken(); // ✅ Attempt to refresh the token
        console.log("[AuthInterceptor] Token refresh successful - Retrying original request...");
        return apiClient(originalRequest); // ✅ Retry the original request
      } catch (err) {
        console.error("[AuthInterceptor] Token refresh failed:", err);
        authStore.logout(); // ✅ Clear user data
        // window.location.href = "/auth/login"; // ✅ Redirect to login if needed
      }
    }

    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);