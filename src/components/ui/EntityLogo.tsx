"use client";

/**
 * EntityLogo - Reusable logo component with theme-aware logo selection
 *
 * This component handles:
 * - Theme-aware logo selection (switching between primary and secondary logos based on theme)
 * - Contrast enhancement (applying background styling when logo doesn't match current theme)
 * - Logo object structure support
 *
 * Used by: EntityBanner, AdminOrganizationCard, AdminClubCard, PublicClubCard
 */

import React, { useMemo, useState, useEffect } from "react";
import { isValidImageUrl, getImageUrl } from "@/utils/image";
import type { LogoObject } from "@/types/organization";
import "./EntityLogo.styles.css";

export interface EntityLogoProps {
  /**
   * Logo object containing url, theme, and secondary logo info
   */
  logo: LogoObject | null | undefined;

  /**
   * Alt text for the logo image
   */
  alt: string;

  /**
   * Additional CSS classes to apply to the logo
   */
  className?: string;
}

/**
 * EntityLogo component
 * Renders an entity logo with theme-aware selection and contrast enhancement
 */
export function EntityLogo({
  logo,
  alt,
  className = "",
}: EntityLogoProps) {
  // Detect current theme
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    // Initial theme detection
    const checkTheme = () => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    };

    checkTheme();

    // Set up observer to watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Determine which logo to display based on theme and logo object
  const effectiveLogoUrl = useMemo(() => {
    if (!logo) {
      return null;
    }

    const currentTheme = isDarkTheme ? 'dark' : 'light';

    // If we have a second logo with theme info
    if (logo.secondUrl && logo.secondTheme) {
      // Check if second logo matches current theme
      if (logo.secondTheme === currentTheme) {
        return logo.secondUrl;
      }
      // Check if primary logo matches current theme
      if (logo.theme === currentTheme) {
        return logo.url;
      }
    }

    // Only one logo, or no theme match - use primary logo
    return logo.url;
  }, [logo, isDarkTheme]);

  /**
   * Determine if we need to apply contrast enhancement styles for a universal logo
   * Returns CSS class name for contrast adjustment or empty string
   */
  const logoContrastClass = useMemo(() => {
    // Only apply contrast styles when we have a single universal logo
    if (!logo || !logo.theme) {
      return ''; // No logo or no theme info, no special styling
    }

    // If we have two separate logos (theme-specific), no contrast adjustment needed
    if (logo.secondUrl && logo.secondTheme) {
      return ''; // Theme-specific logos handle this themselves
    }

    const currentTheme = isDarkTheme ? 'dark' : 'light';
    const logoTheme = logo.theme;

    // Apply contrast enhancement when logo theme doesn't match current theme
    if (logoTheme === 'light' && currentTheme === 'dark') {
      // Light logo on dark background needs a light background for visibility
      return 'rsp-club-hero-logo--contrast-light';
    } else if (logoTheme === 'dark' && currentTheme === 'light') {
      // Dark logo on light background needs a dark background for visibility
      return 'rsp-club-hero-logo--contrast-dark';
    }

    // Logo theme matches current theme, no contrast adjustment needed
    return '';
  }, [logo, isDarkTheme]);

  // Convert stored path to display URL
  const logoFullUrl = useMemo(() => getImageUrl(effectiveLogoUrl), [effectiveLogoUrl]);

  // Validate logo URL
  const hasLogo = useMemo(() => isValidImageUrl(logoFullUrl), [logoFullUrl]);

  // Don't render if no valid logo
  if (!hasLogo || !logoFullUrl) {
    return null;
  }

  // Build complete class list
  // Strategy: Use either custom className OR base class, not both
  // - Custom classes (e.g., rsp-club-logo-overlay) are self-sufficient with all needed styles
  // - Base class (rsp-club-hero-logo) is used when no custom class provided (EntityBanner context)
  // - Contrast classes are always added when needed, regardless of base/custom class
  const logoClasses = [
    className || 'rsp-club-hero-logo', // Custom class OR base logo styles
    logoContrastClass,                  // Contrast enhancement if needed
  ].filter(Boolean).join(' ');

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={logoFullUrl}
      alt={logo?.altText || alt}
      className={logoClasses}
    />
  );
}
