/**
 * Authentication Helper Functions
 * Utility functions for token storage, redirect logic, and auth state checks
 */

import { STORAGE_KEYS } from "./constants";

/**
 * Token Storage Functions
 */

export function storeAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function removeAccessToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function clearAuthData(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.BRANCH);
}

/**
 * Redirect Functions
 */

export function redirectToLogin(): void {
  if (typeof window === "undefined") return;

  // Clear auth data before redirecting
  clearAuthData();

  // Redirect to login page
  window.location.href = "/";
}

export function redirectToDashboard(isHeadOfficeAdmin: boolean): void {
  if (typeof window === "undefined") return;

  if (isHeadOfficeAdmin) {
    window.location.href = "/en/head-office";
  } else {
    window.location.href = "/en/branch";
  }
}

/**
 * Auth State Checks
 */

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) !== null;
}

export function getCurrentUser(): any | null {
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

export function getCurrentBranch(): any | null {
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
 * Inactivity Timer Functions
 */

let inactivityTimer: NodeJS.Timeout | null = null;
let warningTimer: NodeJS.Timeout | null = null;

export interface InactivityCallbacks {
  onWarning?: () => void;
  onTimeout?: () => void;
}

export function startInactivityTimer(timeoutMinutes: number, callbacks?: InactivityCallbacks): void {
  if (typeof window === "undefined") return;

  // Clear existing timers
  stopInactivityTimer();

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = (timeoutMinutes - 2) * 60 * 1000; // Warn 2 minutes before timeout

  // Set warning timer (28 minutes for 30-minute timeout)
  if (callbacks?.onWarning && warningMs > 0) {
    warningTimer = setTimeout(() => {
      callbacks.onWarning?.();
    }, warningMs);
  }

  // Set timeout timer
  inactivityTimer = setTimeout(() => {
    callbacks?.onTimeout?.();
    redirectToLogin();
  }, timeoutMs);
}

export function resetInactivityTimer(timeoutMinutes: number, callbacks?: InactivityCallbacks): void {
  stopInactivityTimer();
  startInactivityTimer(timeoutMinutes, callbacks);
}

export function stopInactivityTimer(): void {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }

  if (warningTimer) {
    clearTimeout(warningTimer);
    warningTimer = null;
  }
}

/**
 * Activity Event Listeners
 */

const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];

export function setupActivityListeners(timeoutMinutes: number, callbacks?: InactivityCallbacks): void {
  if (typeof window === "undefined") return;

  // Start initial timer
  startInactivityTimer(timeoutMinutes, callbacks);

  // Reset timer on user activity
  const resetTimer = () => {
    resetInactivityTimer(timeoutMinutes, callbacks);
  };

  // Add event listeners for user activity
  activityEvents.forEach((event) => {
    window.addEventListener(event, resetTimer, true);
  });
}

export function removeActivityListeners(): void {
  if (typeof window === "undefined") return;

  // Stop timer
  stopInactivityTimer();

  // Remove event listeners
  const resetTimer = () => {}; // Placeholder
  activityEvents.forEach((event) => {
    window.removeEventListener(event, resetTimer, true);
  });
}

/**
 * Role-Based Access Control Helpers
 */

export enum UserRole {
  Cashier = 0,
  Manager = 1,
  Admin = 2,
}

export function hasRole(requiredRole: UserRole): boolean {
  const branch = getCurrentBranch();
  if (!branch) return false;
  return branch.role >= requiredRole;
}

export function isHeadOfficeAdmin(): boolean {
  const user = getCurrentUser();
  return user?.isHeadOfficeAdmin ?? false;
}

export function canAccessRoute(route: string): boolean {
  if (!isAuthenticated()) return false;

  const user = getCurrentUser();
  if (!user) return false;

  // Head office routes
  if (route.startsWith("/head-office")) {
    return user.isHeadOfficeAdmin;
  }

  // Branch routes
  if (route.startsWith("/branch")) {
    return getCurrentBranch() !== null;
  }

  return true;
}
