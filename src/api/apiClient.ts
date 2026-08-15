import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { resolveApiBaseUrl } from "@/api/resolveApiBaseUrl";


const configuredBaseUrl = import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:8003";
export const BASE_URL = resolveApiBaseUrl(
  configuredBaseUrl,
  import.meta.env.DEV && typeof window !== "undefined" ? window.location.href : undefined,
);

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let csrfToken: string | null = null;
let csrfRequest: Promise<string> | null = null;

const ensureCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  if (!csrfRequest) {
    csrfRequest = axios
      .get<{ csrfToken: string }>(`${BASE_URL}/accounts/csrf/`, { withCredentials: true })
      .then((response) => {
        csrfToken = response.data.csrfToken;
        return csrfToken;
      })
      .finally(() => {
        csrfRequest = null;
      });
  }
  return csrfRequest;
};

apiClient.interceptors.request.use(async (config) => {
  const method = (config.method || "get").toLowerCase();
  if (!["get", "head", "options", "trace"].includes(method)) {
    const token = await ensureCsrfToken();
    config.headers.set("X-CSRFToken", token);
  }
  return config;
});


const refreshToken = async () => {
  const csrf = await ensureCsrfToken();
  const response = await axios.post(
    `${BASE_URL}/accounts/refresh-token/`,
    {},
    {
      withCredentials: true,
      headers: { "X-CSRFToken": csrf },
    }
  );
  return response.data;
};


// State for the token refresh queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      // Resolve the queued promises so they retry the original request
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => {
    const url = String(response.config.url || "");
    if (url.includes("/accounts/login/") || url.includes("/accounts/google/") || url.includes("/accounts/logout/")) {
      csrfToken = null;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthStore.getState();

    const detail = error.response?.data?.detail;
    if (
      error.response?.status === 403 &&
      typeof detail === "string" &&
      detail.startsWith("CSRF validation failed:") &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;
      csrfToken = null;
      const token = await ensureCsrfToken();
      originalRequest.headers.set("X-CSRFToken", token);
      return apiClient(originalRequest);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Once resolved, retry the original request
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      console.warn("[AuthInterceptor] 401 Unauthorized detected - Attempting token refresh...");
      originalRequest._retry = true; // ✅ Prevent infinite loops
      isRefreshing = true;

      try {
        await refreshToken(); // ✅ Attempt to refresh the token
        console.log("[AuthInterceptor] Token refresh successful - Retrying original request...");
        
        isRefreshing = false;
        processQueue(null);
        
        return apiClient(originalRequest); // ✅ Retry the original request
      } catch (err) {
        console.error("[AuthInterceptor] Token refresh failed:", err);
        
        isRefreshing = false;
        processQueue(err as Error);
        
        authStore.logout(); // ✅ Clear user data
        // window.location.href = "/auth/login"; // ✅ Redirect to login if needed
        return Promise.reject(err);
      }
    }

    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);
