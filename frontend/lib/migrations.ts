import {
  MigrationResult,
  MigrationHistory,
  BranchMigrationStatus,
  PendingMigrationsResponse,
  ValidationResult,
} from "@/types/migrations";
import { STORAGE_KEYS, API_BASE_URL } from "@/lib/constants";

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Create headers with authentication
 */
function createHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Apply migrations to a specific branch
 */
export async function applyBranchMigrations(branchId: string): Promise<MigrationResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/migrations/branches/${branchId}/apply`, {
    method: "POST",
    headers: createHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errorMessage || "Failed to apply migrations");
  }

  return response.json();
}

/**
 * Apply migrations to all active branches
 */
export async function applyAllBranchMigrations(): Promise<MigrationResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/migrations/branches/apply-all`, {
    method: "POST",
    headers: createHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errorMessage || "Failed to apply migrations to all branches");
  }

  return response.json();
}

/**
 * Get pending migrations for a branch
 */
export async function getPendingMigrations(branchId: string): Promise<PendingMigrationsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/migrations/branches/${branchId}/pending`, {
    method: "GET",
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch pending migrations");
  }

  return response.json();
}

/**
 * Get migration history for a branch
 */
export async function getMigrationHistory(branchId: string): Promise<MigrationHistory> {
  const response = await fetch(`${API_BASE_URL}/api/v1/migrations/branches/${branchId}/history`, {
    method: "GET",
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch migration history");
  }

  return response.json();
}

/**
 * Validate branch database schema
 */
export async function validateBranchDatabase(branchId: string): Promise<ValidationResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/migrations/branches/${branchId}/validate`, {
    method: "GET",
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to validate branch database");
  }

  return response.json();
}

/**
 * Get migration status for all branches
 */
export async function getAllMigrationStatus(): Promise<BranchMigrationStatus[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/migrations/branches/status`, {
    method: "GET",
    headers: createHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch migration status");
  }

  return response.json();
}
