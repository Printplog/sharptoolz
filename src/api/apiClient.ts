import axios from "axios";
import { useAuthStore } from "@/store/authStore";


export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_PUBLIC_API_URL,
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

const apiUrl = import.meta.env.ENV === "development" ? "" : import.meta.env.VITE_PUBLIC_API_URL


const refreshToken = async () => {
  const response = await axios.post(
    `${import.meta.env.VITE_PUBLIC_API_URL}accounts/refresh-token/`,
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
      originalRequest._retry = true; // ✅ Prevent infinite loops

      try {
        await refreshToken(); // ✅ Attempt to refresh the token
        return apiClient(originalRequest); // ✅ Retry the original request
      } catch {
        authStore.logout(); // ✅ Clear user data
        // window.location.href = "/auth/login"; // ✅ Redirect to login if needed
      }
    }

    console.log(apiUrl)

    return Promise.reject(error);
  }
);