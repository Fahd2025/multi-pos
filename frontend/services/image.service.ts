/**
 * Image Service
 * Handles image upload, retrieval, and deletion
 */

import api from './api';

export interface ImageUploadResult {
  success: boolean;
  data?: {
    originalPath: string;
    thumbnailPaths: string[];
  };
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

class ImageService {
  /**
   * Upload an image for an entity
   */
  async uploadImage(
    branchName: string,
    entityType: string,
    entityId: string,
    file: File
  ): Promise<ImageUploadResult> {
    try {
      const formData = new FormData();
      formData.append('branchName', branchName);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);
      formData.append('image', file);

      const response = await api.post<ImageUploadResult>('/api/v1/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images for an entity
   */
  async uploadMultipleImages(
    branchName: string,
    entityType: string,
    entityId: string,
    files: File[]
  ): Promise<ImageUploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadImage(branchName, entityType, entityId, file)
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete all images for an entity
   */
  async deleteImages(branchName: string, entityType: string, entityId: string): Promise<boolean> {
    try {
      const response = await api.delete(`/api/v1/images/${branchName}/${entityType}/${entityId}`);
      // Check if the response indicates success
      if (response.data && response.data.success === true) {
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Image deletion error:', error);
      // Handle 404 as a "success" since image was already deleted
      if (error.response?.status === 404) {
        return true; // Image was already deleted, so operation is effectively successful
      }
      return false;
    }
  }

  /**
   * Get image URL for display
   */
  getImageUrl(
    branchName: string,
    entityType: string,
    entityId: string,
    size: 'thumb' | 'medium' | 'large' | 'original' = 'medium'
  ): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return `${apiUrl}/api/v1/images/${branchName}/${entityType}/${entityId}/${size}`;
  }
}

const imageService = new ImageService();
export default imageService;
