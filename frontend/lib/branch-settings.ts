/**
 * API service for Branch Settings
 */

import { ApiResponse, BranchSettings, UpdateBranchSettings } from "@/types/branch-settings";
import api from "@/services/api";
import { API_ROUTES } from "@/lib/constants";

/**
 * Get branch settings
 */
export async function getBranchSettings(branchId: string): Promise<BranchSettings> {
  try {
    const response = await api.get<ApiResponse<BranchSettings>>(
      API_ROUTES.BRANCHES.SETTINGS(branchId)
    );

    if (!response.data.success || !response.data.data) {
      throw new Error("Failed to fetch branch settings");
    }

    return response.data.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message ||
                 error.response?.data?.message ||
                 "Failed to fetch branch settings";
    throw new Error(errorMessage);
  }
}

/**
 * Update branch settings
 */
export async function updateBranchSettings(
  branchId: string,
  settings: UpdateBranchSettings
): Promise<BranchSettings> {
  try {
    const response = await api.put<ApiResponse<BranchSettings>>(
      API_ROUTES.BRANCHES.SETTINGS(branchId),
      settings
    );

    if (!response.data.success || !response.data.data) {
      throw new Error("Failed to update branch settings");
    }

    return response.data.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message ||
                 error.response?.data?.message ||
                 "Failed to update branch settings";
    throw new Error(errorMessage);
  }
}

/**
 * Upload branch logo
 */
export async function uploadBranchLogo(
  branchId: string,
  file: File
): Promise<{ logoPath: string; logoUrl: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ApiResponse<{ logoPath: string; logoUrl: string }>>(
      `${API_ROUTES.BRANCHES.BASE}/${branchId}/logo`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error("Failed to upload logo");
    }

    return response.data.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message ||
                 error.response?.data?.message ||
                 "Failed to upload logo";
    throw new Error(errorMessage);
  }
}

/**
 * Get branch logo URL
 * @param branchCode - The branch code (e.g., "B001")
 * @param branchId - The branch ID (GUID)
 * @param size - Image size (thumb, medium, large, original). Default: thumb
 */
export function getBranchLogoUrl(branchCode: string, branchId: string, size: string = "thumb"): string {
  return `${API_BASE_URL}/api/v1/images/${branchCode}/branches/${branchId}/${size}`;
}
