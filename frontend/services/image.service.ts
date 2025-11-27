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
   * Upload multiple images for an entity (optimized for Products)
   */
  async uploadMultipleImages(
    branchName: string,
    entityType: string,
    entityId: string,
    files: File[]
  ): Promise<ImageUploadResult[]> {
    try {
      // Use the new multi-image upload endpoint for better performance and no file locking
      const formData = new FormData();
      formData.append('branchName', branchName);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);

      // Append all files with the same field name
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await api.post<{
        success: boolean;
        data?: {
          images: Array<{
            id: string;
            imagePath: string;
            thumbnailPath: string;
            displayOrder: number;
          }>;
          count: number;
        };
        error?: {
          code: string;
          message: string;
        };
        message?: string;
      }>('/api/v1/images/upload-multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Convert the response to match the expected format
      if (response.data.success && response.data.data) {
        return response.data.data.images.map((img) => ({
          success: true,
          data: {
            originalPath: img.imagePath,
            thumbnailPaths: [img.thumbnailPath],
          },
        }));
      }

      // If not successful, return error
      return [{
        success: false,
        error: response.data.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Failed to upload images',
        },
      }];
    } catch (error: any) {
      console.error('Multiple image upload error:', error);
      throw error;
    }
  }

  /**
   * Update product images (keep some existing, delete others, add new)
   * For editing products with partial image changes
   */
  async updateProductImages(
    branchName: string,
    productId: string,
    imageIdsToKeep: string[],
    newFiles: File[]
  ): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('branchName', branchName);
      formData.append('imageIdsToKeep', imageIdsToKeep.join(','));

      // Append all new files
      newFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await api.patch(`/api/v1/images/products/${productId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.success === true;
    } catch (error: any) {
      console.error('Product images update error:', error);
      return false;
    }
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
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5062';
    return `${apiUrl}/api/v1/images/${branchName}/${entityType}/${entityId}/${size}`;
  }

  /**
   * Get image URL for a specific ProductImage by its unique ID
   * For multi-image entities where each image has its own ID
   */
  getImageUrlByImageId(
    branchName: string,
    entityType: string,
    parentEntityId: string,
    imageId: string,
    size: 'thumb' | 'medium' | 'large' | 'original' = 'medium'
  ): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5062';
    // The backend stores images with imageId as filename in the parentEntityId directory
    // Pass productId as query parameter so backend knows where to find the file
    return `${apiUrl}/api/v1/images/${branchName}/${entityType}/${imageId}/${size}?productId=${parentEntityId}`;
  }
}

const imageService = new ImageService();
export default imageService;
