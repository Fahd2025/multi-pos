/**
 * Branch User Service
 * Frontend service for managing branch-specific users
 * Each branch has its own users stored in the branch database
 */

import api from './api';
import { ApiResponse } from '@/types/api.types';

/**
 * Branch User DTO - Response from API
 */
export interface BranchUserDto {
  id: string;
  username: string;
  email: string;
  fullNameEn: string;
  fullNameAr?: string;
  phone?: string;
  preferredLanguage: string;
  role: string; // Manager or Cashier
  isActive: boolean;
  lastLoginAt?: string;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Branch User DTO
 */
export interface CreateBranchUserDto {
  username: string;
  password: string;
  email: string;
  fullNameEn: string;
  fullNameAr?: string;
  phone?: string;
  preferredLanguage?: string;
  role?: string;
  isActive?: boolean;
}

/**
 * Update Branch User DTO
 */
export interface UpdateBranchUserDto {
  email?: string;
  fullNameEn?: string;
  fullNameAr?: string;
  phone?: string;
  preferredLanguage?: string;
  role?: string;
  isActive?: boolean;
  newPassword?: string;
}

/**
 * Get all branch users
 * @param includeInactive - Include inactive users
 * @param branchId - Optional branch ID (for head office admins)
 */
export const getBranchUsers = async (includeInactive = false, branchId?: string): Promise<BranchUserDto[]> => {
  const params = new URLSearchParams();
  if (includeInactive) params.append('includeInactive', 'true');
  if (branchId) params.append('branchId', branchId);

  const response = await api.get<ApiResponse<BranchUserDto[]>>(
    `/api/v1/branch/users?${params.toString()}`
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to fetch branch users');
  }

  if (!response.data.data) {
    throw new Error('No data returned from server');
  }

  return response.data.data;
};

/**
 * Get branch user by ID
 * @param id - User ID
 * @param branchId - Optional branch ID (for head office admins)
 */
export const getBranchUserById = async (id: string, branchId?: string): Promise<BranchUserDto> => {
  const params = new URLSearchParams();
  if (branchId) params.append('branchId', branchId);

  const response = await api.get<ApiResponse<BranchUserDto>>(
    `/api/v1/branch/users/${id}?${params.toString()}`
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to fetch branch user');
  }

  if (!response.data.data) {
    throw new Error('No data returned from server');
  }

  return response.data.data;
};

/**
 * Create a new branch user (Manager only)
 * @param user - User data
 * @param branchId - Optional branch ID (for head office admins)
 */
export const createBranchUser = async (user: CreateBranchUserDto, branchId?: string): Promise<BranchUserDto> => {
  const params = new URLSearchParams();
  if (branchId) params.append('branchId', branchId);

  const response = await api.post<ApiResponse<BranchUserDto>>(
    `/api/v1/branch/users?${params.toString()}`,
    user
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to create branch user');
  }

  if (!response.data.data) {
    throw new Error('No data returned from server');
  }

  return response.data.data;
};

/**
 * Update branch user information (Manager only)
 * @param id - User ID
 * @param user - Updated user data
 * @param branchId - Optional branch ID (for head office admins)
 */
export const updateBranchUser = async (
  id: string,
  user: UpdateBranchUserDto,
  branchId?: string
): Promise<BranchUserDto> => {
  const params = new URLSearchParams();
  if (branchId) params.append('branchId', branchId);

  const response = await api.put<ApiResponse<BranchUserDto>>(
    `/api/v1/branch/users/${id}?${params.toString()}`,
    user
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to update branch user');
  }

  if (!response.data.data) {
    throw new Error('No data returned from server');
  }

  return response.data.data;
};

/**
 * Delete branch user (Manager only)
 * @param id - User ID
 * @param branchId - Optional branch ID (for head office admins)
 */
export const deleteBranchUser = async (id: string, branchId?: string): Promise<void> => {
  const params = new URLSearchParams();
  if (branchId) params.append('branchId', branchId);

  const response = await api.delete<ApiResponse<void>>(
    `/api/v1/branch/users/${id}?${params.toString()}`
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to delete branch user');
  }
};

/**
 * Check if username is available
 * @param username - Username to check
 * @param excludeUserId - Optional user ID to exclude from check
 * @param branchId - Optional branch ID (for head office admins)
 */
export const checkUsernameAvailability = async (
  username: string,
  excludeUserId?: string,
  branchId?: string
): Promise<boolean> => {
  const params = new URLSearchParams();
  if (branchId) params.append('branchId', branchId);

  const response = await api.post<ApiResponse<{ isAvailable: boolean }>>(
    `/api/v1/branch/users/check-username?${params.toString()}`,
    {
      username,
      excludeUserId: excludeUserId || null,
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Failed to check username availability');
  }

  if (!response.data.data) {
    throw new Error('No data returned from server');
  }

  return response.data.data.isAvailable;
};
