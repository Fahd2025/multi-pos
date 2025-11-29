/**
 * Image URL Utility Functions
 * Helper functions to construct image URLs for products and categories
 */

import { API_BASE_URL } from './constants';

/**
 * Build product image URL
 * @param branchCode - Branch code (e.g., "B001")
 * @param imageId - Image ID from product.images[].imagePath
 * @param productId - Product ID
 * @param size - Image size: "thumb" or "full"
 * @returns Full image URL
 */
export function buildProductImageUrl(
  branchCode: string,
  imageId: string,
  productId: string,
  size: 'thumb' | 'full' = 'thumb'
): string {
  return `${API_BASE_URL}/api/v1/images/${branchCode}/products/${imageId}/${size}?productId=${productId}`;
}

/**
 * Build category image URL
 * @param branchCode - Branch code (e.g., "B001")
 * @param imageId - Image ID from category.imagePath
 * @param categoryId - Category ID
 * @param size - Image size: "thumb" or "full"
 * @returns Full image URL
 */
export function buildCategoryImageUrl(
  branchCode: string,
  imageId: string,
  categoryId: string,
  size: 'thumb' | 'full' = 'thumb'
): string {
  return `${API_BASE_URL}/api/v1/images/${branchCode}/categories/${imageId}/${size}?categoryId=${categoryId}`;
}
