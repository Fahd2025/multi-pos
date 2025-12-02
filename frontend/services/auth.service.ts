/**
 * Authentication Service
 * Handles user login, logout, token refresh, and session management
 */

import api from "./api";
import { STORAGE_KEYS, API_ROUTES } from "@/lib/constants";

// Types for auth requests and responses
export interface LoginRequest {
  branchName?: string; // Optional for head office login
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  accessTokenExpiresIn: number;
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  fullNameEn: string;
  fullNameAr?: string;
  preferredLanguage: string;
  isHeadOfficeAdmin: boolean;
  branches: BranchAssignment[];
}

export interface BranchAssignment {
  branchId: string;
  branchCode: string;
  branchNameEn: string;
  branchNameAr?: string;
  role: number; // 0=Cashier, 1=Manager, 2=Admin
}

export interface RefreshTokenResponse {
  accessToken: string;
  accessTokenExpiresIn: number;
}

class AuthService {
  /**
   * Login user with branch selection, username, and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // Map frontend field names to backend field names
      const loginPayload = {
        username: credentials.username,
        password: credentials.password,
        branchCode: credentials.branchName || undefined,
      };

      const response = await api.post<{ success: boolean; data: LoginResponse; message: string }>(
        API_ROUTES.AUTH.LOGIN,
        loginPayload
      );

      const { accessToken, user } = response.data.data;

      // Store access token and user data
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

        // Find and store the selected branch from user's branch assignments (if branch login)
        if (credentials.branchName) {
          // Match using branchCode since that's what the login form submits
          const selectedBranch = user.branches.find(
            (b) => b.branchCode?.toLowerCase() === credentials.branchName!.toLowerCase()
          );

          if (selectedBranch) {
            localStorage.setItem(STORAGE_KEYS.BRANCH, JSON.stringify(selectedBranch));
          } else {
            console.error("No branch found with branchCode matching:", credentials.branchName);
          }
        } else {
          // For head office login, clear any existing branch data
          localStorage.removeItem(STORAGE_KEYS.BRANCH);
        }
      }

      return response.data.data;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await api.post(API_ROUTES.AUTH.LOGOUT);
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Clear local storage regardless of API success
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.BRANCH);
      }
    }
  }

  /**
   * Refresh access token using HTTP-only refresh token cookie
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    try {
      const response = await api.post<{
        success: boolean;
        data: RefreshTokenResponse;
        message: string;
      }>(API_ROUTES.AUTH.REFRESH);

      const { accessToken } = response.data.data;

      // Update stored access token
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      }

      return response.data.data;
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw error;
    }
  }

  /**
   * Get current user profile from API
   */
  async getMe(): Promise<UserResponse> {
    try {
      const response = await api.get<{ success: boolean; data: UserResponse; message: string }>(
        API_ROUTES.AUTH.ME
      );

      const user = response.data.data;

      // Update stored user data
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      }

      return user;
    } catch (error) {
      console.error("Get user profile failed:", error);
      throw error;
    }
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Get stored user data
   */
  getCurrentUser(): UserResponse | null {
    if (typeof window === "undefined") return null;

    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch (error) {
      console.error("Failed to parse user data:", error);
      return null;
    }
  }

  /**
   * Get currently selected branch
   */
  getCurrentBranch(): BranchAssignment | null {
    if (typeof window === "undefined") return null;

    const branchJson = localStorage.getItem(STORAGE_KEYS.BRANCH);
    if (!branchJson) return null;

    try {
      return JSON.parse(branchJson);
    } catch (error) {
      console.error("Failed to parse branch data:", error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * Check if current user is head office admin
   */
  isHeadOfficeAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.isHeadOfficeAdmin ?? false;
  }

  /**
   * Check if current user has specific role in current branch
   */
  hasRole(role: number): boolean {
    const branch = this.getCurrentBranch();
    if (!branch) return false;
    return branch.role >= role;
  }
}

// Export singleton instance
export const authService = new AuthService();
