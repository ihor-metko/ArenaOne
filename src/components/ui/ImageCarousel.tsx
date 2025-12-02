"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import "./ImageCarousel.css";

interface CarouselImage {
  url: string;
  alt: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  onImageClick?: (index: number) => void;
  showIndicators?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  loop?: boolean;
  className?: string;
}

export function ImageCarousel({
  images,
  onImageClick,
  showIndicators = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  loop = true,
  className = "",
}: ImageCarouselProps) {
  const t = useTranslations();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canGoPrevious = loop || currentIndex > 0;
  const canGoNext = loop || currentIndex < images.length - 1;

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    if (!autoPlay || images.length <= 1) return;
    stopAutoPlay();
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (loop) {
          return (prev + 1) % images.length;
        }
        return prev < images.length - 1 ? prev + 1 : 0;
      });
    }, autoPlayInterval);
  }, [autoPlay, autoPlayInterval, images.length, loop, stopAutoPlay]);

  useEffect(() => {
    startAutoPlay();
    return stopAutoPlay;
  }, [startAutoPlay, stopAutoPlay]);

  const handlePrevious = useCallback(() => {
    if (!canGoPrevious || isTransitioning) return;
    stopAutoPlay();
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      if (prev === 0) {
        return loop ? images.length - 1 : 0;
      }
      return prev - 1;
    });
    setTimeout(() => setIsTransitioning(false), 300);
    startAutoPlay();
  }, [canGoPrevious, isTransitioning, loop, images.length, stopAutoPlay, startAutoPlay]);

  const handleNext = useCallback(() => {
    if (!canGoNext || isTransitioning) return;
    stopAutoPlay();
    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      if (prev === images.length - 1) {
        return loop ? 0 : images.length - 1;
      }
      return prev + 1;
    });
    setTimeout(() => setIsTransitioning(false), 300);
    startAutoPlay();
  }, [canGoNext, isTransitioning, loop, images.length, stopAutoPlay, startAutoPlay]);

  const handleGoToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    stopAutoPlay();
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
    startAutoPlay();
  }, [isTransitioning, currentIndex, stopAutoPlay, startAutoPlay]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;
      
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          handlePrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (onImageClick) {
            onImageClick(currentIndex);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevious, handleNext, onImageClick, currentIndex]);

  // Touch/drag handlers
  const handleDragStart = useCallback((clientX: number) => {
    stopAutoPlay();
    setIsDragging(true);
    setDragStartX(clientX);
    setDragOffset(0);
  }, [stopAutoPlay]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    const offset = clientX - dragStartX;
    setDragOffset(offset);
  }, [isDragging, dragStartX]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const threshold = 50; // Minimum drag distance to trigger navigation
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }
    
    setDragOffset(0);
    startAutoPlay();
  }, [isDragging, dragOffset, handlePrevious, handleNext, startAutoPlay]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      handleDragEnd();
    }
  }, [isDragging, handleDragEnd]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handleImageClick = useCallback(() => {
    // Only trigger click if not dragging
    if (Math.abs(dragOffset) < 5 && onImageClick) {
      onImageClick(currentIndex);
    }
  }, [dragOffset, onImageClick, currentIndex]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`im-carousel ${className}`}
      role="region"
      aria-label={t("common.imageCarousel")}
      aria-roledescription="carousel"
    >
      <div
        className="im-carousel-viewport"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="im-carousel-track"
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${isDragging ? dragOffset : 0}px))`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
          }}
          aria-live="polite"
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="im-carousel-slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${images.length}: ${image.alt}`}
              aria-hidden={index !== currentIndex}
            >
              <button
                type="button"
                className="im-carousel-image-button"
                onClick={handleImageClick}
                tabIndex={index === currentIndex ? 0 : -1}
                aria-label={image.alt}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt}
                  className="im-carousel-image"
                  draggable={false}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="im-carousel-nav im-carousel-nav--prev"
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            aria-label={t("common.previousImage")}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <button
            type="button"
            className="im-carousel-nav im-carousel-nav--next"
            onClick={handleNext}
            disabled={!canGoNext}
            aria-label={t("common.nextImage")}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && images.length > 1 && (
        <div
          className="im-carousel-indicators"
          role="tablist"
          aria-label={t("common.carouselSlides")}
        >
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`im-carousel-indicator ${index === currentIndex ? "im-carousel-indicator--active" : ""}`}
              onClick={() => handleGoToSlide(index)}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`${t("common.slide")} ${index + 1}`}
              tabIndex={index === currentIndex ? 0 : -1}
            />
          ))}
        </div>
      )}

      {/* Slide counter for screen readers */}
      <div className="im-carousel-sr-only" aria-live="polite" aria-atomic="true">
        {t("common.slideOf", { current: currentIndex + 1, total: images.length })}
      </div>
    </div>
  );
}
