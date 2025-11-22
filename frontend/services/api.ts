import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, STORAGE_KEYS, HTTP_STATUS } from "@/lib/constants";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get access token from localStorage
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          // No refresh token, redirect to login
          handleAuthError();
          return Promise.reject(error);
        }

        // Try to refresh the token
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Store new tokens
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        handleAuthError();
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === HTTP_STATUS.FORBIDDEN) {
      // User doesn't have permission
      console.error("Access forbidden");
    }

    if (error.response?.status === HTTP_STATUS.NOT_FOUND) {
      console.error("Resource not found");
    }

    if (error.response?.status === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      console.error("Server error");
    }

    return Promise.reject(error);
  }
);

// Helper function to handle authentication errors
function handleAuthError() {
  // Clear all auth data
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.BRANCH);

  // Redirect to login if not already there
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

// Export the configured axios instance
export default api;

// Export helper functions for common API operations
export const apiHelpers = {
  /**
   * Get headers for file upload
   */
  getFileUploadHeaders: () => ({
    "Content-Type": "multipart/form-data",
  }),

  /**
   * Build query string from params object
   */
  buildQueryString: (params: Record<string, any>): string => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, String(params[key]));
      }
    });
    return queryParams.toString();
  },

  /**
   * Handle API error and extract error message
   */
  getErrorMessage: (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message || "An unexpected error occurred";
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "An unexpected error occurred";
  },
};
