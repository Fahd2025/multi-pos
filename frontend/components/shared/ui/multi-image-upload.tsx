"use client";

import React, { useState, useCallback } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Upload, X, Plus } from "lucide-react";
import { toast } from "sonner";

interface MultiImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  maxSize?: number; // in MB
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  images,
  onChange,
  maxImages = 8,
  maxSize = 5,
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(
    (files: FileList) => {
      if (!files || files.length === 0) return;

      const currentCount = images.length;
      const remainingSlots = maxImages - currentCount;

      if (files.length > remainingSlots) {
        toast.error(
          `You can only upload ${remainingSlots} more image(s). Maximum ${maxImages} images allowed.`
        );
        return;
      }
      // Filter valid files first
      const validFiles = Array.from(files).filter((file) => {
        // Check file type
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not a valid image file`);
          return false;
        }

        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is ${maxSize}MB`);
          return false;
        }

        return true;
      });

      if (validFiles.length === 0) return;

      const newImages: string[] = [];
      let processedCount = 0;

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            newImages.push(reader.result as string);
          }
          processedCount++;

          // When all files are processed, update the state
          if (processedCount === validFiles.length) {
            onChange([...images, ...newImages]);
          }
        };

        reader.onerror = () => {
          toast.error(`Error reading ${file.name}`);
          processedCount++;

          // Still check if all files are processed
          if (processedCount === validFiles.length) {
            onChange([...images, ...newImages]);
          }
        };

        reader.readAsDataURL(file);
      });
    },
    [images, onChange, maxImages, maxSize]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset the input so the same file can be selected again
      e.target.value = "";
    }
  };

  const triggerFileInput = useCallback(() => {
    const input = document.getElementById("multi-image-upload") as HTMLInputElement;
    if (input) {
      input.click();
    }
  }, []);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <Label>
        Product Images ({images.length}/{maxImages})
      </Label>

      {/* Image Grid */}
      <div className="grid grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={image}
              alt={`Product image ${index + 1}`}
              className="w-full h-24 object-cover rounded border"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="h-6 w-6 p-0"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            {index === 0 && (
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-1 rounded">
                Main
              </div>
            )}
          </div>
        ))}

        {/* Upload area - show if under maximum */}
        {images.length < maxImages && (
          <div
            className={`w-full h-24 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragActive
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={triggerFileInput}
          >
            <Plus className="h-6 w-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground text-center">Add Image</span>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <Input
        id="multi-image-upload"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Upload button and info */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          disabled={images.length >= maxImages}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Images
        </Button>
        <span className="text-sm text-muted-foreground">
          Maximum {maxImages} images, up to {maxSize}MB each. First image will be the main image.
        </span>
      </div>

      {/* Drag and drop info */}
      <div className="text-xs text-muted-foreground">
        💡 Tip: You can drag and drop multiple images at once, or click to select files.
      </div>
    </div>
  );
};
