'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  branchName: string;
  entityType: string;
  entityId: string;
  alt: string;
  size?: 'thumb' | 'medium' | 'large' | 'original';
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fallbackSrc?: string;
}

/**
 * OptimizedImage component for displaying images from the backend with lazy loading
 * and automatic size selection based on the provided size prop
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  branchName,
  entityType,
  entityId,
  alt,
  size = 'medium',
  className = '',
  width,
  height,
  priority = false,
  fallbackSrc = '/placeholder-image.png',
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Construct the image URL from the backend
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const imageSrc = `${apiUrl}/api/v1/images/${branchName}/${entityType}/${entityId}/${size}`;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Image failed to load:', `${apiUrl}/api/v1/images/${branchName}/${entityType}/${entityId}/${size}`);
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setImageError(false); // Reset error when image loads successfully
    setIsLoading(false);
  };

  // Use fallback if image failed to load
  const src = imageError ? fallbackSrc : imageSrc;

  return (
    <div className={`relative ${className}`}>
      {isLoading && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="text-gray-400">Loading...</div>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading={priority ? 'eager' : 'lazy'}
        width={width}
        height={height}
      />
    </div>
  );
};

export default OptimizedImage;
