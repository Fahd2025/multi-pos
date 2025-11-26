/**
 * useAuth Hook
 * Custom React hook for authentication state management
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { authService, LoginRequest, UserResponse, BranchAssignment } from "@/services/auth.service";
import { useRouter } from "next/navigation";

interface UseAuthReturn {
  user: UserResponse | null;
  branch: BranchAssignment | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest, loginMode?: "branch" | "headoffice") => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isHeadOfficeAdmin: () => boolean;
  hasRole: (role: number) => boolean;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [branch, setBranch] = useState<BranchAssignment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = authService.getCurrentUser();
        const storedBranch = authService.getCurrentBranch();

        setUser(storedUser);
        setBranch(storedBranch);
      } catch (err) {
        console.error("Failed to initialize auth:", err);
        setError("Failed to restore session");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(
    async (credentials: LoginRequest, loginMode: "branch" | "headoffice" = "branch") => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authService.login(credentials);
        setUser(response.user);

        // Get current locale from window location (default to 'en')
        const pathSegments = window.location.pathname.split("/").filter(Boolean);
        const locale = pathSegments[0] || "en";

        // Handle branch login
        if (loginMode === "branch") {
          // Find selected branch
          const selectedBranch = response.user.branches.find(
            (b) => b.branchCode.toLowerCase() === credentials.branchName?.toLowerCase()
          );

          setBranch(selectedBranch || null);
          router.push(`/${locale}/branch`);
        }
        // Handle head office login
        else if (loginMode === "headoffice") {
          setBranch(null);

          // Verify user is actually a head office admin
          if (!response.user.isHeadOfficeAdmin) {
            setError("You don't have permission to access the head office dashboard.");
            throw new Error("Not authorized for head office access");
          }

          router.push(`/${locale}/head-office`);
        }
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Login failed. Please check your credentials.";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.logout();
      setUser(null);
      setBranch(null);

      // Get current locale from window location (default to 'en')
      const pathSegments = window.location.pathname.split("/").filter(Boolean);
      const locale = pathSegments[0] || "en";

      router.push(`/${locale}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Logout failed.";
      setError(errorMessage);
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Refresh user profile from API
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedUser = await authService.getMe();
      setUser(updatedUser);

      // Update branch if needed
      const currentBranch = authService.getCurrentBranch();
      setBranch(currentBranch);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to refresh user data.";
      setError(errorMessage);
      console.error("Refresh user error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if user is head office admin
  const isHeadOfficeAdmin = useCallback(() => {
    return user?.isHeadOfficeAdmin ?? false;
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback(
    (role: number) => {
      if (!branch) return false;
      return branch.role >= role;
    },
    [branch]
  );

  return {
    user,
    branch,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    isHeadOfficeAdmin,
    hasRole,
  };
}
