// Migration Types for Frontend

export type MigrationStatus =
  | "Pending"
  | "InProgress"
  | "Completed"
  | "Failed"
  | "RequiresManualIntervention";

export interface MigrationResult {
  success: boolean;
  appliedMigrations: string[];
  errorMessage?: string;
  duration: string;
  branchesProcessed: number;
  branchesSucceeded: number;
  branchesFailed: number;
}

export interface MigrationHistory {
  branchId: string;
  branchCode: string;
  appliedMigrations: string[];
  pendingMigrations: string[];
  lastMigrationDate?: string;
  status: string;
  retryCount: number;
  errorDetails?: string;
}

export interface BranchMigrationStatus {
  branchId: string;
  branchCode: string;
  branchName: string;
  lastMigrationApplied: string;
  status: string;
  lastAttemptAt: string;
  retryCount: number;
  errorDetails?: string;
  isLocked: boolean;
  lockExpiresAt?: string;
}

export interface PendingMigrationsResponse {
  branchId: string;
  pendingMigrations: string[];
  count: number;
}

export interface ValidationResult {
  branchId: string;
  isValid: boolean;
  status: string;
}
