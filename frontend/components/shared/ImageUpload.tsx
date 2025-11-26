'use client';

import React, { useState, useRef } from 'react';
import { OptimizedImage } from './OptimizedImage';

interface ImageUploadProps {
  branchName: string;
  entityType: string;
  entityId?: string;
  currentImages?: string[];
  multiple?: boolean;
  maxFiles?: number;
  onUpload?: (files: File[]) => void;
  onRemove?: (imageId: string) => void;
  className?: string;
  label?: string;
  accept?: string;
}

/**
 * Reusable Image Upload component with preview, drag-and-drop, and multi-file support
 */
export const ImageUpload: React.FC<ImageUploadProps> = ({
  branchName,
  entityType,
  entityId,
  currentImages = [],
  multiple = false,
  maxFiles = 5,
  onUpload,
  onRemove,
  className = '',
  label = 'Upload Image',
  accept = 'image/jpeg,image/png,image/webp',
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) => {
      // Validate file type
      const validTypes = accept.split(',').map((t) => t.trim());
      return validTypes.some((type) => file.type === type);
    });

    // Limit number of files
    const filesToAdd = multiple ? validFiles.slice(0, maxFiles - selectedFiles.length) : [validFiles[0]];

    if (!multiple) {
      setSelectedFiles(filesToAdd);
    } else {
      setSelectedFiles([...selectedFiles, ...filesToAdd]);
    }

    // Generate previews
    const newPreviews: string[] = [];
    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === filesToAdd.length) {
          if (!multiple) {
            setPreviews(newPreviews);
          } else {
            setPreviews([...previews, ...newPreviews]);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    // Call onUpload callback
    if (onUpload) {
      onUpload(filesToAdd);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleRemoveExisting = (imageId: string) => {
    if (onRemove) {
      onRemove(imageId);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Label */}
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-6 cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${selectedFiles.length > 0 || currentImages.length > 0 ? 'bg-gray-50' : 'bg-white'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {multiple ? `Up to ${maxFiles} images` : 'Single image'} (JPEG, PNG, WebP)
          </p>
        </div>
      </div>

      {/* Existing Images */}
      {entityId && currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {currentImages.map((imageId, index) => (
            <div key={index} className="relative group">
              <OptimizedImage
                branchName={branchName}
                entityType={entityType}
                entityId={entityId}
                size="medium"
                alt={`Image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleRemoveExisting(imageId)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview Selected Images */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {selectedFiles[index]?.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Info */}
      {selectedFiles.length > 0 && (
        <div className="text-sm text-gray-600">
          {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
          {multiple && selectedFiles.length < maxFiles && ` (${maxFiles - selectedFiles.length} more allowed)`}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
