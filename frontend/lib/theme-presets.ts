/**
 * Theme Preset Library
 *
 * Contains carefully designed theme presets optimized for POS/retail environments.
 * Each preset includes full color system with light and dark mode variants.
 */

import { ThemePreset } from '@/types/branch-settings';

export const themePresets: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    nameAr: 'الافتراضي',
    description: 'Clean and professional default theme',
    descriptionAr: 'المظهر الافتراضي النظيف والاحترافي',
    light: {
      primary: 'hsl(222, 47%, 11%)',
      primaryForeground: 'hsl(210, 40%, 98%)',
      secondary: 'hsl(210, 40%, 96%)',
      secondaryForeground: 'hsl(222, 47%, 11%)',
      accent: 'hsl(217, 91%, 60%)',
      accentForeground: 'hsl(210, 40%, 98%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(222, 47%, 11%)',
      card: 'hsl(0, 0%, 100%)',
      cardForeground: 'hsl(222, 47%, 11%)',
      border: 'hsl(214, 32%, 91%)',
      input: 'hsl(214, 32%, 91%)',
      ring: 'hsl(217, 91%, 60%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(210, 40%, 98%)',
      success: 'hsl(142, 71%, 45%)',
      warning: 'hsl(38, 92%, 50%)',
      info: 'hsl(199, 89%, 48%)',
    },
    dark: {
      primary: 'hsl(210, 40%, 98%)',
      primaryForeground: 'hsl(222, 47%, 11%)',
      secondary: 'hsl(217, 33%, 17%)',
      secondaryForeground: 'hsl(210, 40%, 98%)',
      accent: 'hsl(217, 91%, 60%)',
      accentForeground: 'hsl(210, 40%, 98%)',
      background: 'hsl(222, 47%, 11%)',
      foreground: 'hsl(210, 40%, 98%)',
      card: 'hsl(222, 47%, 11%)',
      cardForeground: 'hsl(210, 40%, 98%)',
      border: 'hsl(217, 33%, 17%)',
      input: 'hsl(217, 33%, 17%)',
      ring: 'hsl(217, 91%, 60%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(210, 40%, 98%)',
      success: 'hsl(142, 71%, 45%)',
      warning: 'hsl(38, 92%, 50%)',
      info: 'hsl(199, 89%, 48%)',
    },
  },

  // Retail/POS Optimized Theme
  {
    id: 'retail-blue',
    name: 'Retail Blue',
    nameAr: 'أزرق التجزئة',
    description: 'Professional blue theme optimized for retail',
    descriptionAr: 'مظهر أزرق احترافي محسّن للبيع بالتجزئة',
    light: {
      primary: 'hsl(211, 100%, 50%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(210, 40%, 96%)',
      secondaryForeground: 'hsl(211, 100%, 50%)',
      accent: 'hsl(211, 100%, 45%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(222, 47%, 11%)',
      card: 'hsl(0, 0%, 100%)',
      cardForeground: 'hsl(222, 47%, 11%)',
      border: 'hsl(214, 32%, 91%)',
      input: 'hsl(214, 32%, 91%)',
      ring: 'hsl(211, 100%, 50%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(142, 71%, 45%)',
      warning: 'hsl(38, 92%, 50%)',
      info: 'hsl(199, 89%, 48%)',
    },
    dark: {
      primary: 'hsl(211, 100%, 50%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(217, 33%, 17%)',
      secondaryForeground: 'hsl(210, 40%, 98%)',
      accent: 'hsl(211, 100%, 60%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(222, 47%, 11%)',
      foreground: 'hsl(210, 40%, 98%)',
      card: 'hsl(217, 33%, 17%)',
      cardForeground: 'hsl(210, 40%, 98%)',
      border: 'hsl(217, 33%, 20%)',
      input: 'hsl(217, 33%, 20%)',
      ring: 'hsl(211, 100%, 50%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(142, 71%, 45%)',
      warning: 'hsl(38, 92%, 50%)',
      info: 'hsl(199, 89%, 48%)',
    },
  },

  // Restaurant/Hospitality Theme
  {
    id: 'restaurant-warm',
    name: 'Restaurant Warm',
    nameAr: 'دفء المطعم',
    description: 'Warm, inviting theme for restaurants',
    descriptionAr: 'مظهر دافئ وجذاب للمطاعم',
    light: {
      primary: 'hsl(24, 70%, 50%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(36, 100%, 95%)',
      secondaryForeground: 'hsl(24, 70%, 30%)',
      accent: 'hsl(14, 90%, 53%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(43, 100%, 98%)',
      foreground: 'hsl(24, 45%, 15%)',
      card: 'hsl(0, 0%, 100%)',
      cardForeground: 'hsl(24, 45%, 15%)',
      border: 'hsl(36, 40%, 88%)',
      input: 'hsl(36, 40%, 88%)',
      ring: 'hsl(24, 70%, 50%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(142, 71%, 45%)',
      warning: 'hsl(38, 92%, 50%)',
      info: 'hsl(199, 89%, 48%)',
    },
    dark: {
      primary: 'hsl(24, 70%, 50%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(30, 20%, 20%)',
      secondaryForeground: 'hsl(36, 100%, 95%)',
      accent: 'hsl(14, 90%, 53%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(24, 45%, 8%)',
      foreground: 'hsl(36, 100%, 95%)',
      card: 'hsl(24, 35%, 12%)',
      cardForeground: 'hsl(36, 100%, 95%)',
      border: 'hsl(30, 20%, 20%)',
      input: 'hsl(30, 20%, 20%)',
      ring: 'hsl(24, 70%, 50%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(142, 71%, 45%)',
      warning: 'hsl(38, 92%, 50%)',
      info: 'hsl(199, 89%, 48%)',
    },
  },

  // Modern/Tech Theme
  {
    id: 'modern-purple',
    name: 'Modern Purple',
    nameAr: 'بنفسجي عصري',
    description: 'Contemporary purple theme with high contrast',
    descriptionAr: 'مظهر بنفسجي عصري بتباين عالي',
    light: {
      primary: 'hsl(262, 83%, 58%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(270, 75%, 95%)',
      secondaryForeground: 'hsl(262, 83%, 38%)',
      accent: 'hsl(280, 85%, 60%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(262, 83%, 18%)',
      card: 'hsl(0, 0%, 100%)',
      cardForeground: 'hsl(262, 83%, 18%)',
      border: 'hsl(270, 40%, 92%)',
      input: 'hsl(270, 40%, 92%)',
      ring: 'hsl(262, 83%, 58%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(142, 71%, 45%)',
      warning: 'hsl(38, 92%, 50%)',
      info: 'hsl(199, 89%, 48%)',
    },
    dark: {
      primary: 'hsl(262, 83%, 65%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(270, 30%, 20%)',
      secondaryForeground: 'hsl(270, 75%, 95%)',
      accent: 'hsl(280, 85%, 70%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(262, 60%, 8%)',
      foreground: 'hsl(270, 75%, 95%)',
      card: 'hsl(262, 50%, 12%)',
      cardForeground: 'hsl(270, 75%, 95%)',
      border: 'hsl(270, 30%, 20%)',
      input: 'hsl(270, 30%, 20%)',
      ring: 'hsl(262, 83%, 65%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(142, 71%, 45%)',
      warning: 'hsl(38, 92%, 50%)',
      info: 'hsl(199, 89%, 48%)',
    },
  },

  // Eco/Health Theme
  {
    id: 'minimal-green',
    name: 'Minimal Green',
    nameAr: 'أخضر بسيط',
    description: 'Clean minimal theme with natural green tones',
    descriptionAr: 'مظهر بسيط ونظيف بدرجات خضراء طبيعية',
    light: {
      primary: 'hsl(142, 71%, 45%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(138, 76%, 97%)',
      secondaryForeground: 'hsl(142, 71%, 25%)',
      accent: 'hsl(151, 55%, 42%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(142, 50%, 15%)',
      card: 'hsl(0, 0%, 100%)',
      cardForeground: 'hsl(142, 50%, 15%)',
      border: 'hsl(138, 40%, 90%)',
      input: 'hsl(138, 40%, 90%)',
      ring: 'hsl(142, 71%, 45%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(142, 71%, 45%)',
      warning: 'hsl(38, 92%, 50%)',
      info: 'hsl(199, 89%, 48%)',
    },
    dark: {
      primary: 'hsl(142, 71%, 50%)',
      primaryForeground: 'hsl(0, 0%, 100%)',
      secondary: 'hsl(140, 30%, 18%)',
      secondaryForeground: 'hsl(138, 76%, 97%)',
      accent: 'hsl(151, 55%, 52%)',
      accentForeground: 'hsl(0, 0%, 100%)',
      background: 'hsl(142, 50%, 7%)',
      foreground: 'hsl(138, 76%, 97%)',
      card: 'hsl(142, 40%, 11%)',
      cardForeground: 'hsl(138, 76%, 97%)',
      border: 'hsl(140, 30%, 18%)',
      input: 'hsl(140, 30%, 18%)',
      ring: 'hsl(142, 71%, 50%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(0, 0%, 100%)',
      success: 'hsl(142, 71%, 50%)',
      warning: 'hsl(38, 92%, 50%)',
      info: 'hsl(199, 89%, 48%)',
    },
  },
];

/**
 * Get preset by ID
 */
export const getPresetById = (id: string): ThemePreset | undefined => {
  return themePresets.find((preset) => preset.id === id);
};

/**
 * Get default preset (first in list)
 */
export const getDefaultPreset = (): ThemePreset => {
  return themePresets[0]; // 'default' preset
};

/**
 * Get all preset IDs
 */
export const getAllPresetIds = (): string[] => {
  return themePresets.map((preset) => preset.id);
};

/**
 * Check if a preset ID exists
 */
export const isValidPresetId = (id: string): boolean => {
  return getAllPresetIds().includes(id);
};
