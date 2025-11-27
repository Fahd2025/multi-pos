'use client'

import React, { useState } from 'react'
import { Button } from './button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Dialog, DialogContent } from './dialog'

interface ImageCarouselProps {
  images: string[]
  alt: string
  className?: string
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  alt,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!images || images.length === 0) {
    return (
      <div className={`bg-muted rounded flex items-center justify-center ${className}`}>
        <div className="text-muted-foreground text-center p-4">
          No images available
        </div>
      </div>
    )
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Main image */}
        <img
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover rounded cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        />

        {/* Navigation buttons - only show if multiple images */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Image counter */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Thumbnail indicators */}
            <div className="absolute bottom-2 left-2 flex gap-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => goToImage(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Full-screen modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <img
              src={images[currentIndex]}
              alt={`${alt} - Full size`}
              className="w-full h-auto max-h-[80vh] object-contain"
            />

            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Navigation in modal */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Thumbnail strip at bottom */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/70 p-2 rounded">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      className={`w-12 h-12 rounded border-2 ${
                        index === currentIndex ? 'border-white' : 'border-transparent'
                      }`}
                      onClick={() => goToImage(index)}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}