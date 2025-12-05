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
