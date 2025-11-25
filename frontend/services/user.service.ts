/**
 * User Service
 * Frontend service for user management (admin and user operations)
 */

import api from './api';
import { ApiResponse, PaginationResponse } from '@/types/api.types';

/**
 * User DTO - Response from API
 */
export interface UserDto {
  id: string;
  username: string;
  email: string;
  fullNameEn: string;
  fullNameAr?: string;
  phone?: string;
  preferredLanguage: string;
  isActive: boolean;
  isHeadOfficeAdmin: boolean;
  lastLoginAt?: string;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
  assignedBranchIds: string[];
  assignedBranches: UserBranchDto[];
}

/**
 * User Branch DTO
 */
export interface UserBranchDto {
  branchId: string;
  branchCode: string;
  branchNameEn: string;
  branchNameAr: string;
  role: string;
  assignedAt: string;
}

/**
 * Create User DTO
 */
export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  fullNameEn: string;
  fullNameAr?: string;
  phone?: string;
  preferredLanguage?: string;
  isActive?: boolean;
  isHeadOfficeAdmin?: boolean;
  branchAssignments?: BranchAssignmentDto[];
}

/**
 * Branch Assignment DTO
 */
export interface BranchAssignmentDto {
  branchId: string;
  role: string;
}

/**
 * Update User DTO
 */
export interface UpdateUserDto {
  email?: string;
  fullNameEn?: string;
  fullNameAr?: string;
  phone?: string;
  preferredLanguage?: string;
  isActive?: boolean;
  newPassword?: string;
}

/**
 * Assign Branch DTO
 */
export interface AssignBranchDto {
  branchId: string;
  role: string;
}

/**
 * User Activity DTO
 */
export interface UserActivityDto {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit Log DTO
 */
export interface AuditLogDto {
  id: string;
  timestamp: string;
  userId?: string;
  branchId?: string;
  eventType: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Get users with filtering options
 */
export const getUsers = async (
  includeInactive?: boolean,
  branchId?: string,
  role?: string,
  searchTerm?: string,
  page?: number,
  pageSize?: number
): Promise<{ users: UserDto[]; pagination: PaginationResponse }> => {
  const params = new URLSearchParams();
  if (includeInactive !== undefined) params.append('includeInactive', includeInactive.toString());
  if (branchId) params.append('branchId', branchId);
  if (role) params.append('role', role);
  if (searchTerm) params.append('searchTerm', searchTerm);
  if (page) params.append('page', page.toString());
  if (pageSize) params.append('pageSize', pageSize.toString());

  const response = await api.get<ApiResponse<{ users: UserDto[]; pagination: PaginationResponse }>>(
    `/api/v1/users?${params.toString()}`
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to fetch users');
  }

  return response.data.data;
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<UserDto> => {
  const response = await api.get<ApiResponse<UserDto>>(`/api/v1/users/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to fetch user');
  }

  return response.data.data;
};

/**
 * Create a new user (admin only)
 */
export const createUser = async (user: CreateUserDto): Promise<UserDto> => {
  const response = await api.post<ApiResponse<UserDto>>('/api/v1/users', user);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to create user');
  }

  return response.data.data;
};

/**
 * Update user information
 */
export const updateUser = async (id: string, user: UpdateUserDto): Promise<UserDto> => {
  const response = await api.put<ApiResponse<UserDto>>(`/api/v1/users/${id}`, user);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to update user');
  }

  return response.data.data;
};

/**
 * Delete user (admin only)
 */
export const deleteUser = async (id: string): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>(`/api/v1/users/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete user');
  }
};

/**
 * Assign user to branch (admin only)
 */
export const assignBranch = async (userId: string, assignment: AssignBranchDto): Promise<void> => {
  const response = await api.post<ApiResponse<void>>(
    `/api/v1/users/${userId}/assign-branch`,
    assignment
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to assign branch');
  }
};

/**
 * Remove branch assignment (admin only)
 */
export const removeBranchAssignment = async (userId: string, branchId: string): Promise<void> => {
  const response = await api.delete<ApiResponse<void>>(
    `/api/v1/users/${userId}/branches/${branchId}`
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to remove branch assignment');
  }
};

/**
 * Get user activity log
 */
export const getUserActivity = async (userId: string, limit?: number): Promise<UserActivityDto[]> => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());

  const response = await api.get<ApiResponse<UserActivityDto[]>>(
    `/api/v1/users/${userId}/activity?${params.toString()}`
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to fetch user activity');
  }

  return response.data.data;
};

/**
 * Get audit logs (admin only)
 */
export const getAuditLogs = async (
  userId?: string,
  branchId?: string,
  eventType?: string,
  action?: string,
  fromDate?: string,
  toDate?: string,
  page?: number,
  pageSize?: number
): Promise<{ logs: AuditLogDto[]; pagination: PaginationResponse }> => {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (branchId) params.append('branchId', branchId);
  if (eventType) params.append('eventType', eventType);
  if (action) params.append('action', action);
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (page) params.append('page', page.toString());
  if (pageSize) params.append('pageSize', pageSize.toString());

  const response = await api.get<
    ApiResponse<{ logs: AuditLogDto[]; pagination: PaginationResponse }>
  >(`/api/v1/audit/logs?${params.toString()}`);

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to fetch audit logs');
  }

  return response.data.data;
};

/**
 * Get user audit trail
 */
export const getUserAuditTrail = async (
  userId: string,
  fromDate?: string,
  toDate?: string,
  page?: number,
  pageSize?: number
): Promise<AuditLogDto[]> => {
  const params = new URLSearchParams();
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (page) params.append('page', page.toString());
  if (pageSize) params.append('pageSize', pageSize.toString());

  const response = await api.get<ApiResponse<AuditLogDto[]>>(
    `/api/v1/audit/user/${userId}?${params.toString()}`
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to fetch user audit trail');
  }

  return response.data.data;
};
