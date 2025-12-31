/**
 * TypeScript types for Branch Settings
 */

export interface Address {
  city?: string;
  district?: string;
  street?: string;
  buildingNumber?: string;
  postalCode?: string;
  shortAddress?: string;
}

/**
 * Theme Configuration Types
 */

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ThemeStyle = 'preset' | 'custom';

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryForeground: string;

  // Secondary colors
  secondary: string;
  secondaryForeground: string;

  // Accent colors
  accent: string;
  accentForeground: string;

  // Background colors
  background: string;
  foreground: string;

  // Surface colors
  card: string;
  cardForeground: string;

  // Border and input
  border: string;
  input: string;
  ring: string;

  // Semantic colors
  destructive: string;
  destructiveForeground: string;
  success: string;
  warning: string;
  info: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  light: ThemeColors;
  dark: ThemeColors;
  preview?: string; // Preview image URL
}

export interface ThemeConfig {
  // Basic mode
  mode: ThemeMode; // 'light' | 'dark' | 'auto'

  // Style configuration
  style: ThemeStyle; // 'preset' | 'custom'
  presetId?: string; // If using preset

  // Custom colors (if style === 'custom')
  customColors?: {
    light: Partial<ThemeColors>;
    dark: Partial<ThemeColors>;
  };

  // Advanced settings
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fontScale?: number; // 0.8 to 1.2
  spacing?: 'compact' | 'comfortable' | 'spacious';

  // Animations
  enableAnimations?: boolean;
  animationSpeed?: 'slow' | 'normal' | 'fast';

  // Accessibility
  highContrast?: boolean;
  reducedMotion?: boolean;
}

export interface BranchSettings {
  id: string;
  code: string;

  // Branch Information
  nameEn: string;
  nameAr: string;
  addressEn?: Address;
  addressAr?: Address;
  phone?: string;
  email?: string;
  vatNumber?: string;
  commercialRegistrationNumber?: string;
  logoPath?: string;
  logoUrl?: string;

  // Regional Settings
  timeZone: string;
  currency: string;
  language: string;
  dateFormat: string;
  numberFormat: string;

  // Tax Settings
  enableTax: boolean;
  taxRate: number;
  priceIncludesTax: boolean;

  // Theme Configuration
  themeConfig?: ThemeConfig;

  // Metadata
  isActive: boolean;
  updatedAt: string;
}

export interface UpdateBranchSettings {
  // Branch Information
  nameEn: string;
  nameAr: string;
  addressEn?: Address;
  addressAr?: Address;
  phone?: string;
  email?: string;
  vatNumber?: string;
  commercialRegistrationNumber?: string;

  // Regional Settings
  timeZone: string;
  currency: string;
  language: string;
  dateFormat: string;
  numberFormat: string;

  // Tax Settings
  enableTax: boolean;
  taxRate: number;
  priceIncludesTax: boolean;

  // Theme Configuration
  themeConfig?: ThemeConfig;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

export const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Riyadh', label: 'Riyadh (AST)' },
  { value: 'Asia/Kuwait', label: 'Kuwait (AST)' },
  { value: 'Asia/Qatar', label: 'Qatar (AST)' },
  { value: 'Asia/Bahrain', label: 'Bahrain (AST)' },
  { value: 'Asia/Muscat', label: 'Muscat (GST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
];

export const CURRENCIES = [
  { value: 'USD', label: 'US Dollar (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (GBP)', symbol: '£' },
  { value: 'SAR', label: 'Saudi Riyal (SAR)', symbol: 'ر.س' },
  { value: 'AED', label: 'UAE Dirham (AED)', symbol: 'د.إ' },
  { value: 'KWD', label: 'Kuwaiti Dinar (KWD)', symbol: 'د.ك' },
  { value: 'QAR', label: 'Qatari Riyal (QAR)', symbol: 'ر.ق' },
  { value: 'BHD', label: 'Bahraini Dinar (BHD)', symbol: 'د.ب' },
  { value: 'OMR', label: 'Omani Rial (OMR)', symbol: 'ر.ع.' },
  { value: 'JPY', label: 'Japanese Yen (JPY)', symbol: '¥' },
  { value: 'CNY', label: 'Chinese Yuan (CNY)', symbol: '¥' },
  { value: 'INR', label: 'Indian Rupee (INR)', symbol: '₹' },
];

export const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (UK/EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
  { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY' },
];

export const NUMBER_FORMATS = [
  { value: 'en-US', label: 'English (US) - 1,234.56' },
  { value: 'en-GB', label: 'English (UK) - 1,234.56' },
  { value: 'ar-SA', label: 'Arabic (Saudi) - ١٬٢٣٤٫٥٦' },
  { value: 'ar-AE', label: 'Arabic (UAE) - ١٬٢٣٤٫٥٦' },
  { value: 'de-DE', label: 'German - 1.234,56' },
  { value: 'fr-FR', label: 'French - 1 234,56' },
];
