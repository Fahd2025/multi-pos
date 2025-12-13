"use client";

/**
 * Branch Settings Page
 *
 * Comprehensive settings page for managing branch information, regional settings, and tax configuration.
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  BranchSettings,
  UpdateBranchSettings,
  Address,
  TIMEZONES,
  CURRENCIES,
  DATE_FORMATS,
  NUMBER_FORMATS,
} from "@/types/branch-settings";
import { getBranchSettings, updateBranchSettings, uploadBranchLogo } from "@/lib/branch-settings";
import { authService } from "@/services/auth.service";
import { API_BASE_URL } from "@/lib/constants";
import { RoleGuard, usePermission } from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/enums";
import { Button } from "@/components/shared/Button";
import { BRANCH_ROUTES } from "@/lib/routes";
import { useToast } from "@/hooks/useToast";

export default function BranchSettingsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const { canManage } = usePermission();

  // State
  const [settings, setSettings] = useState<UpdateBranchSettings>({
    nameEn: "",
    nameAr: "",
    addressEn: undefined,
    addressAr: undefined,
    phone: "",
    email: "",
    vatNumber: "",
    commercialRegistrationNumber: "",
    timeZone: "UTC",
    currency: "USD",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    numberFormat: "en-US",
    enableTax: false,
    taxRate: 0,
    priceIncludesTax: false,
  });

  const { error: showErrorToast, success: showSuccessToast } = useToast();

  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"branch" | "regional" | "tax">("branch");
  const [imageError, setImageError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - RoleGuard handles permission

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Get branch and token from auth service
      const branch = authService.getCurrentBranch();
      const token = authService.getAccessToken();

      if (!branch || !token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const data = await getBranchSettings(branch.branchId);

      console.log("Branch Settings API Response:", {
        id: data.id,
        code: data.code,
        logoPath: data.logoPath,
        logoUrl: data.logoUrl,
      });

      // Convert BranchSettings to UpdateBranchSettings format
      setSettings({
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        addressEn: data.addressEn,
        addressAr: data.addressAr,
        phone: data.phone,
        email: data.email,
        vatNumber: data.vatNumber,
        commercialRegistrationNumber: data.commercialRegistrationNumber,
        timeZone: data.timeZone,
        currency: data.currency,
        language: data.language,
        dateFormat: data.dateFormat,
        numberFormat: data.numberFormat,
        enableTax: data.enableTax,
        taxRate: data.taxRate,
        priceIncludesTax: data.priceIncludesTax,
      });

      // Set logo URL if available
      if (data.logoPath && data.logoPath.trim() !== "") {
        try {
          let absoluteLogoUrl: string;

          // Check if logoPath is in new format (starts with /api/v1/)
          if (data.logoPath.startsWith("/api/v1/")) {
            // New format: just prepend the base URL
            absoluteLogoUrl = `${API_BASE_URL}${data.logoPath}`;
          } else {
            // Old format (GUID): construct the URL using branch code and ID
            absoluteLogoUrl = `${API_BASE_URL}/api/v1/images/${data.code}/branches/${data.id}/thumb`;
            console.warn(
              "Branch has old logo format (GUID):",
              data.logoPath,
              "- constructing URL from branch data"
            );
          }

          // Validate URL before setting it
          new URL(absoluteLogoUrl);
          console.log("Loading logo from logoPath:", {
            logoPath: data.logoPath,
            absoluteUrl: absoluteLogoUrl,
            format: data.logoPath.startsWith("/api/v1/") ? "new" : "old (GUID)",
          });
          setLogoUrl(absoluteLogoUrl);
          setImageError(false);
        } catch (err) {
          console.error("Invalid logo path:", data.logoPath, err);
          setLogoUrl("");
          setImageError(true);
        }
      } else {
        // No logo available
        console.log("No logo path found in branch settings");
        setLogoUrl("");
        setImageError(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      // Get branch and token from auth service
      const branch = authService.getCurrentBranch();
      const token = authService.getAccessToken();

      if (!branch || !token) {
        setError("Authentication required. Please log in.");
        return;
      }

      // Upload logo if selected
      if (logoFile) {
        const logoResult = await uploadBranchLogo(branch.branchId, logoFile);
        // Construct full URL from logoPath
        try {
          const absoluteLogoUrl = `${API_BASE_URL}${logoResult.logoUrl}`;
          // Validate URL before setting it
          new URL(absoluteLogoUrl);
          console.log("Uploaded logo URL:", absoluteLogoUrl);
          setLogoUrl(absoluteLogoUrl);
          setImageError(false);
        } catch (err) {
          console.error("Invalid uploaded logo URL:", logoResult.logoUrl, err);
          const errorMsg = "Invalid logo URL received from server";
          showErrorToast("Logo Upload Error", errorMsg);
          setError(errorMsg);
          return;
        }
      }

      // Update settings
      await updateBranchSettings(branch.branchId, settings);

      setSuccess("Settings saved successfully");
      setLogoFile(null);

      // Reload settings to get updated data
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Logo file size must not exceed 5MB");
        return;
      }

      // Clear any previous error
      setError("");
      setImageError(false);

      setLogoFile(file);

      // Create blob URL for preview
      try {
        const blobUrl = URL.createObjectURL(file);
        setLogoUrl(blobUrl);
      } catch (err) {
        console.error("Failed to create blob URL:", err);
        setError("Failed to preview image");
      }
    }
  };

  const updateAddress = (lang: "En" | "Ar", field: keyof Address, value: string) => {
    const addressKey = `address${lang}` as "addressEn" | "addressAr";
    setSettings((prev) => ({
      ...prev,
      [addressKey]: {
        ...(prev[addressKey] || {}),
        [field]: value,
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
          role="status"
          aria-label="Loading"
        ></div>
      </div>
    );
  }

  return (
    <RoleGuard
      requireRole={UserRole.Manager}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Only Managers can access Branch Settings.</p>
          <Button onClick={() => router.push(`/${locale}/branch`)}>
            Go to Dashboard
          </Button>
        </div>
      }
    >
      <div>
        <div>
          {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Branch Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your branch information, regional preferences, and tax configuration
          </p>
        </div>

        {/* Quick Links to Other Settings */}
        <div className="mb-8">
          <button
            onClick={() => router.push(BRANCH_ROUTES.SETTINGS_INVOICE_TEMPLATES(locale))}
            className="flex items-center justify-between p-4 w-full md:w-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">📄</div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Invoice Templates
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage invoice designs (uses branch information)
                </p>
              </div>
            </div>
            <div className="text-gray-400">→</div>
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            role="alert"
            aria-live="polite"
          >
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            role="status"
            aria-live="polite"
          >
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Settings sections" role="tablist">
            <button
              onClick={() => setActiveTab("branch")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === "branch"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }
              `}
              role="tab"
              aria-selected={activeTab === "branch"}
              aria-controls="branch-panel"
            >
              Branch Information
            </button>
            <button
              onClick={() => setActiveTab("regional")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === "regional"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }
              `}
              role="tab"
              aria-selected={activeTab === "regional"}
              aria-controls="regional-panel"
            >
              Regional Settings
            </button>
            <button
              onClick={() => setActiveTab("tax")}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === "tax"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }
              `}
              role="tab"
              aria-selected={activeTab === "tax"}
              aria-controls="tax-panel"
            >
              Tax Settings
            </button>
          </nav>
        </div>

        {/* Branch Information Section */}
        {activeTab === "branch" && (
          <div
            id="branch-panel"
            role="tabpanel"
            aria-labelledby="branch-tab"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Branch Information
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Branch Name (English) */}
              <div>
                <label
                  htmlFor="nameEn"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Name (English){" "}
                  <span className="text-red-500" aria-label="required">
                    *
                  </span>
                </label>
                <input
                  type="text"
                  id="nameEn"
                  value={settings.nameEn}
                  onChange={(e) => setSettings({ ...settings, nameEn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  required
                  aria-required="true"
                />
              </div>

              {/* Branch Name (Arabic) */}
              <div>
                <label
                  htmlFor="nameAr"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Name (Arabic){" "}
                  <span className="text-red-500" aria-label="required">
                    *
                  </span>
                </label>
                <input
                  type="text"
                  id="nameAr"
                  value={settings.nameAr}
                  onChange={(e) => setSettings({ ...settings, nameAr: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  dir="rtl"
                  required
                  aria-required="true"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={settings.phone || ""}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="+1 234 567 8900"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={settings.email || ""}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="branch@example.com"
                />
              </div>

              {/* VAT Number */}
              <div>
                <label
                  htmlFor="vatNumber"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  VAT Number
                </label>
                <input
                  type="text"
                  id="vatNumber"
                  value={settings.vatNumber || ""}
                  onChange={(e) => setSettings({ ...settings, vatNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="123456789"
                />
              </div>

              {/* Commercial Registration Number */}
              <div>
                <label
                  htmlFor="crn"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Commercial Registration Number
                </label>
                <input
                  type="text"
                  id="crn"
                  value={settings.commercialRegistrationNumber || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, commercialRegistrationNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="CR-123456789"
                />
              </div>
            </div>

            {/* Address Section (English) */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Address (English)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="cityEn"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="cityEn"
                    value={settings.addressEn?.city || ""}
                    onChange={(e) => updateAddress("En", "city", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="districtEn"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    District
                  </label>
                  <input
                    type="text"
                    id="districtEn"
                    value={settings.addressEn?.district || ""}
                    onChange={(e) => updateAddress("En", "district", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="streetEn"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Street
                  </label>
                  <input
                    type="text"
                    id="streetEn"
                    value={settings.addressEn?.street || ""}
                    onChange={(e) => updateAddress("En", "street", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="buildingEn"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Building Number
                  </label>
                  <input
                    type="text"
                    id="buildingEn"
                    value={settings.addressEn?.buildingNumber || ""}
                    onChange={(e) => updateAddress("En", "buildingNumber", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="postalEn"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="postalEn"
                    value={settings.addressEn?.postalCode || ""}
                    onChange={(e) => updateAddress("En", "postalCode", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label
                    htmlFor="shortAddressEn"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Short Address
                  </label>
                  <textarea
                    id="shortAddressEn"
                    value={settings.addressEn?.shortAddress || ""}
                    onChange={(e) => updateAddress("En", "shortAddress", e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Address Section (Arabic) */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Address (Arabic)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="cityAr"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="cityAr"
                    value={settings.addressAr?.city || ""}
                    onChange={(e) => updateAddress("Ar", "city", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label
                    htmlFor="districtAr"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    District
                  </label>
                  <input
                    type="text"
                    id="districtAr"
                    value={settings.addressAr?.district || ""}
                    onChange={(e) => updateAddress("Ar", "district", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label
                    htmlFor="streetAr"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Street
                  </label>
                  <input
                    type="text"
                    id="streetAr"
                    value={settings.addressAr?.street || ""}
                    onChange={(e) => updateAddress("Ar", "street", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label
                    htmlFor="buildingAr"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Building Number
                  </label>
                  <input
                    type="text"
                    id="buildingAr"
                    value={settings.addressAr?.buildingNumber || ""}
                    onChange={(e) => updateAddress("Ar", "buildingNumber", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label
                    htmlFor="postalAr"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="postalAr"
                    value={settings.addressAr?.postalCode || ""}
                    onChange={(e) => updateAddress("Ar", "postalCode", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    dir="rtl"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label
                    htmlFor="shortAddressAr"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Short Address
                  </label>
                  <textarea
                    id="shortAddressAr"
                    value={settings.addressAr?.shortAddress || ""}
                    onChange={(e) => updateAddress("Ar", "shortAddress", e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Branch Logo
              </h3>
              <div className="flex items-center gap-6">
                {logoUrl && logoUrl.trim() !== "" && !imageError ? (
                  <div className="relative w-32 h-32 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
                    {logoUrl.startsWith("http") ? (
                      // Use regular img for external URLs to avoid Next.js image optimization issues
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <img
                          src={logoUrl}
                          alt="Branch Logo"
                          className="max-w-full max-h-full object-contain"
                          onError={() => {
                            console.error("Failed to load image:", logoUrl);
                            setImageError(true);
                          }}
                          onLoad={() => {
                            // Reset error state when image loads successfully
                            setImageError(false);
                          }}
                        />
                      </div>
                    ) : (
                      // Use Next.js Image for local assets
                      <Image
                        src={logoUrl}
                        alt="Branch Logo"
                        fill
                        className="object-contain p-2"
                        unoptimized={logoUrl.startsWith("blob:")}
                        onError={() => {
                          console.error("Failed to load image:", logoUrl);
                          setImageError(true);
                        }}
                        onLoadingComplete={() => {
                          // Reset error state when image loads successfully
                          setImageError(false);
                        }}
                      />
                    )}
                  </div>
                ) : imageError ? (
                  <div className="relative w-32 h-32 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center p-2">
                      Logo unavailable.
                      <br />
                      Please upload a new one.
                    </p>
                  </div>
                ) : null}

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoChange}
                    accept="image/*"
                    className="hidden"
                    aria-label="Upload branch logo"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                  >
                    {logoUrl ? "Change Logo" : "Upload Logo"}
                  </button>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    JPG, PNG, GIF or SVG. Max size 5MB.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regional Settings Section */}
        {activeTab === "regional" && (
          <div
            id="regional-panel"
            role="tabpanel"
            aria-labelledby="regional-tab"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Regional Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Time Zone */}
              <div>
                <label
                  htmlFor="timeZone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Time Zone{" "}
                  <span className="text-red-500" aria-label="required">
                    *
                  </span>
                </label>
                <select
                  id="timeZone"
                  value={settings.timeZone}
                  onChange={(e) => setSettings({ ...settings, timeZone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  required
                  aria-required="true"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose the timezone for displaying dates and times
                </p>
              </div>

              {/* Currency */}
              <div>
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Currency{" "}
                  <span className="text-red-500" aria-label="required">
                    *
                  </span>
                </label>
                <select
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  required
                  aria-required="true"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr.value} value={curr.value}>
                      {curr.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose the default currency for transactions
                </p>
              </div>

              {/* Language */}
              <div>
                <label
                  htmlFor="language"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Language{" "}
                  <span className="text-red-500" aria-label="required">
                    *
                  </span>
                </label>
                <select
                  id="language"
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  required
                  aria-required="true"
                >
                  <option value="en">English</option>
                  <option value="ar">Arabic (العربية)</option>
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Default language for the user interface
                </p>
              </div>

              {/* Date Format */}
              <div>
                <label
                  htmlFor="dateFormat"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Date Format{" "}
                  <span className="text-red-500" aria-label="required">
                    *
                  </span>
                </label>
                <select
                  id="dateFormat"
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  required
                  aria-required="true"
                >
                  {DATE_FORMATS.map((fmt) => (
                    <option key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  How dates are displayed throughout the system
                </p>
              </div>

              {/* Number Format */}
              <div className="md:col-span-2">
                <label
                  htmlFor="numberFormat"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Number Format{" "}
                  <span className="text-red-500" aria-label="required">
                    *
                  </span>
                </label>
                <select
                  id="numberFormat"
                  value={settings.numberFormat}
                  onChange={(e) => setSettings({ ...settings, numberFormat: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                  required
                  aria-required="true"
                >
                  {NUMBER_FORMATS.map((fmt) => (
                    <option key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  How numbers and currency values are formatted
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tax Settings Section */}
        {activeTab === "tax" && (
          <div
            id="tax-panel"
            role="tabpanel"
            aria-labelledby="tax-tab"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Tax Settings
            </h2>

            <div className="space-y-6">
              {/* Enable Tax */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="enableTax"
                    type="checkbox"
                    checked={settings.enableTax}
                    onChange={(e) => setSettings({ ...settings, enableTax: e.target.checked })}
                    className="w-5 h-5 border-gray-300 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 transition-colors"
                    aria-describedby="enableTax-description"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="enableTax" className="font-medium text-gray-900 dark:text-white">
                    Enable Tax
                  </label>
                  <p
                    id="enableTax-description"
                    className="text-sm text-gray-500 dark:text-gray-400"
                  >
                    When enabled, tax will be calculated on all transactions
                  </p>
                </div>
              </div>

              {/* Tax Rate */}
              <div className="max-w-md">
                <label
                  htmlFor="taxRate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Tax Rate (%){" "}
                  {settings.enableTax && (
                    <span className="text-red-500" aria-label="required">
                      *
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  id="taxRate"
                  value={settings.taxRate}
                  onChange={(e) =>
                    setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })
                  }
                  min="0"
                  max="100"
                  step="0.01"
                  disabled={!settings.enableTax}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-describedby="taxRate-description"
                />
                <p
                  id="taxRate-description"
                  className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                >
                  The percentage of tax to apply (e.g., 15 for 15%)
                </p>
              </div>

              {/* Price Includes Tax */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tax Calculation Method{" "}
                  {settings.enableTax && (
                    <span className="text-red-500" aria-label="required">
                      *
                    </span>
                  )}
                </label>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="priceExclusive"
                        name="taxMethod"
                        type="radio"
                        checked={!settings.priceIncludesTax}
                        onChange={() => setSettings({ ...settings, priceIncludesTax: false })}
                        disabled={!settings.enableTax}
                        className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50 transition-colors"
                        aria-describedby="priceExclusive-description"
                      />
                    </div>
                    <div className="ml-3">
                      <label
                        htmlFor="priceExclusive"
                        className="font-medium text-gray-900 dark:text-white"
                      >
                        Price Exclusive
                      </label>
                      <p
                        id="priceExclusive-description"
                        className="text-sm text-gray-500 dark:text-gray-400"
                      >
                        Tax is added on top of the base price (e.g., $100 + 15% tax = $115 total)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="priceInclusive"
                        name="taxMethod"
                        type="radio"
                        checked={settings.priceIncludesTax}
                        onChange={() => setSettings({ ...settings, priceIncludesTax: true })}
                        disabled={!settings.enableTax}
                        className="w-4 h-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50 transition-colors"
                        aria-describedby="priceInclusive-description"
                      />
                    </div>
                    <div className="ml-3">
                      <label
                        htmlFor="priceInclusive"
                        className="font-medium text-gray-900 dark:text-white"
                      >
                        Price Inclusive
                      </label>
                      <p
                        id="priceInclusive-description"
                        className="text-sm text-gray-500 dark:text-gray-400"
                      >
                        Tax is already included in the price (e.g., $115 includes 15% tax, base
                        price is $100)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={loadSettings}
            disabled={isSaving}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div
                  className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                  aria-hidden="true"
                ></div>
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
        </div>
      </div>
    </RoleGuard>
  );
}
