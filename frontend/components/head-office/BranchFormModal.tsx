/**
 * Branch Form Modal with Logo Upload
 * Reusable modal for creating/editing branches with logo upload capability
 * Uses FeaturedDialog component for consistent UI
 */

"use client";

import React, { useEffect, useState } from "react";
import { FeaturedDialog } from "@/components/shared/FeaturedDialog";
import { Input } from "@/components/shared/Input";
import { Select } from "@/components/shared/Select";
import { Button } from "@/components/shared/Button";
import { ImageUpload } from "@/components/shared/ImageUpload";
import branchService, {
  CreateBranchDto,
  UpdateBranchDto,
  BranchDto,
} from "@/services/branch.service";
import imageService from "@/services/image.service";

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branch?: BranchDto; // If provided, edit mode; otherwise create mode
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  branch,
}) => {
  const isEditMode = !!branch;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [currentLogoPath, setCurrentLogoPath] = useState<string | null>(null); // Track current logo path separately

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    nameEn: "",
    nameAr: "",
    email: "",
    phone: "",
    databaseProvider: 0, // SQLite by default
    dbServer: "",
    dbName: "",
    dbPort: 0,
    dbUsername: "",
    dbPassword: "",
    trustServerCertificate: false, // For MSSQL
    sslMode: 0, // For PostgreSQL, MySQL: 0=Disable, 1=Require, 2=VerifyCA, 3=VerifyFull
    language: "en",
    currency: "USD",
    taxRate: 0,
  });

  /**
   * Extract entity ID from logoPath URL
   * Handles both new format (/api/v1/images/B001/branches/{id}/thumb) and legacy format (just ID)
   */
  const extractImageIdFromPath = (logoPath: string | null): string | null => {
    if (!logoPath) return null;

    // Check if it's the new URL path format
    if (logoPath.startsWith("/api/v1/images/")) {
      // Extract the ID from: /api/v1/images/{branchCode}/branches/{id}/{size}
      const match = logoPath.match(/\/branches\/([a-f0-9-]+)\//i);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Legacy format or unknown - return as-is
    return logoPath;
  };

  // Initialize form data when branch prop changes
  useEffect(() => {
    if (branch) {
      setFormData({
        code: branch.code,
        nameEn: branch.nameEn,
        nameAr: branch.nameAr,
        email: branch.email || "",
        phone: branch.phone || "",
        databaseProvider: ["SQLite", "MSSQL", "PostgreSQL", "MySQL"].indexOf(
          branch.databaseProvider
        ),
        dbServer: branch.dbServer,
        dbName: branch.dbName,
        dbPort: branch.dbPort,
        dbUsername: branch.dbUsername || "",
        dbPassword: "", // Never populate password for security
        trustServerCertificate: branch.trustServerCertificate || false,
        sslMode:
          ["Disable", "Require", "VerifyCA", "VerifyFull"].indexOf(branch.sslMode) !== -1
            ? ["Disable", "Require", "VerifyCA", "VerifyFull"].indexOf(branch.sslMode)
            : 0,
        language: branch.language,
        currency: branch.currency,
        taxRate: branch.taxRate,
      });
      // Set the current logo path to the branch's logo path
      setCurrentLogoPath(branch.logoPath || null);
    } else {
      // Reset form for create mode
      setFormData({
        code: "",
        nameEn: "",
        nameAr: "",
        email: "",
        phone: "",
        databaseProvider: 0,
        dbServer: "",
        dbName: "",
        dbPort: 0,
        dbUsername: "",
        dbPassword: "",
        trustServerCertificate: false,
        sslMode: 0,
        language: "en",
        currency: "USD",
        taxRate: 0,
      });
      setCurrentLogoPath(null);
    }
    setSelectedImages([]);
  }, [branch, isOpen]);

  // Update default port and SQLite settings when database provider changes
  useEffect(() => {
    if (!isEditMode) {
      const defaultPort = branchService.getDefaultPort(formData.databaseProvider);
      setFormData((prev) => ({
        ...prev,
        dbPort: defaultPort,
        // For SQLite, set default values (these are ignored by backend, which only uses branch code)
        ...(formData.databaseProvider === 0
          ? {
              dbServer: "",
              dbName: "",
            }
          : {}),
      }));
    }
  }, [formData.databaseProvider, isEditMode]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleTestConnection = async () => {
    if (!branch?.id) {
      setError("Save the branch first to test the connection");
      return;
    }

    setTestingConnection(true);
    setError(null);

    try {
      const result = await branchService.testConnection(branch.id);
      alert(result.message);
    } catch (err: any) {
      setError(err.message || "Connection test failed");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleImageUpload = (files: File[]) => {
    setSelectedImages(files);
  };

  const handleImageRemove = async (imageId: string) => {
    // Only update the UI state to remove the image visually
    // The actual deletion from server will happen when the form is submitted
    setCurrentLogoPath(null);
    console.log("Branch logo visually removed, will be deleted on form submit");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      let savedBranch;

      // For SQLite, set default values (backend ignores these and only uses branch code)
      const isSQLite = formData.databaseProvider === 0;
      const finalDbServer = isSQLite ? "SQLite" : formData.dbServer;
      const finalDbName = isSQLite ? "SQLite" : formData.dbName;

      if (isEditMode && branch) {
        // Update branch
        const updateDto: UpdateBranchDto = {
          nameEn: formData.nameEn,
          nameAr: formData.nameAr,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          databaseProvider: formData.databaseProvider,
          dbServer: finalDbServer,
          dbName: finalDbName,
          dbPort: formData.dbPort,
          dbUsername: formData.dbUsername || undefined,
          dbPassword: formData.dbPassword || undefined,
          trustServerCertificate: formData.trustServerCertificate,
          sslMode: formData.sslMode,
          language: formData.language,
          currency: formData.currency,
          taxRate: formData.taxRate,
        };
        savedBranch = await branchService.updateBranch(branch.id, updateDto);
      } else {
        // Create branch
        const createDto: CreateBranchDto = {
          code: formData.code,
          nameEn: formData.nameEn,
          nameAr: formData.nameAr,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          databaseProvider: formData.databaseProvider,
          dbServer: finalDbServer,
          dbName: finalDbName,
          dbPort: formData.dbPort,
          dbUsername: formData.dbUsername || undefined,
          dbPassword: formData.dbPassword || undefined,
          trustServerCertificate: formData.trustServerCertificate,
          sslMode: formData.sslMode,
          language: formData.language,
          currency: formData.currency,
          taxRate: formData.taxRate,
        };
        savedBranch = await branchService.createBranch(createDto);
      }

      // Handle logo operations
      const logoWasRemoved = currentLogoPath === null && branch?.logoPath;
      const newLogoSelected = selectedImages.length > 0;

      if (isEditMode && branch && branch.logoPath) {
        // Delete existing logo if user removed it OR is replacing it with a new one
        if (logoWasRemoved || newLogoSelected) {
          try {
            // Use branch.id for deletion, not logoPath
            // This works regardless of logoPath format (URL path or legacy ID)
            const success = await imageService.deleteImages(branch.code, "Branches", branch.id);
            if (success) {
              console.log("Successfully deleted old branch logo from server");
            } else {
              console.error("Failed to delete old branch logo from server");
            }
          } catch (error) {
            console.error("Error deleting old logo from server:", error);
            // Don't fail the whole operation
          }
        }
      }

      if (selectedImages.length > 0) {
        // Upload new logo if selected
        setUploadingImages(true);
        try {
          // First, upload the image to storage
          await imageService.uploadImage(
            savedBranch.code, // Use branch code for path construction
            "Branches",
            savedBranch.id,
            selectedImages[0] // Single logo
          );
          console.log("Successfully uploaded new branch logo to storage");

          // Then, update the branch record with the new logo path
          // The logo path follows the pattern: /api/v1/images/{branchCode}/branches/{id}/thumb
          const newLogoPath = `/api/v1/images/${savedBranch.code}/branches/${savedBranch.id}/thumb`;

          // Update ONLY the logo path field
          const logoUpdateDto: UpdateBranchDto = {
            logoPath: newLogoPath,
          };

          await branchService.updateBranch(savedBranch.id, logoUpdateDto);
          console.log("Successfully updated branch with new logo path:", newLogoPath);
        } catch (error) {
          console.error("Error uploading logo:", error);
          // Don't fail the whole operation
        } finally {
          setUploadingImages(false);
        }
      }

      onSuccess();
      onClose();
      setSelectedImages([]);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditMode ? "update" : "create"} branch`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeaturedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Branch" : "Create New Branch"}
      mode={isEditMode ? "edit" : "create"}
      size="xl"
      fields={[]}
      onSubmit={handleSubmit}
      isSubmitting={loading || uploadingImages}
      submitLabel={isEditMode ? "Update Branch" : "Create Branch"}
      cancelLabel="Cancel"
      additionalContent={
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Basic Information
            </h3>

            <Input
              label="Branch Code*"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              disabled={isEditMode}
              placeholder="B001"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Name (English)*"
                value={formData.nameEn}
                onChange={(e) => handleChange("nameEn", e.target.value)}
                placeholder="Main Branch"
                required
              />
              <Input
                label="Name (Arabic)*"
                value={formData.nameAr}
                onChange={(e) => handleChange("nameAr", e.target.value)}
                placeholder="الفرع الرئيسي"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="branch@example.com"
              />
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+1234567890"
              />
            </div>
          </div>

          {/* Database Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Database Configuration
            </h3>

            <Select
              label="Database Provider*"
              value={formData.databaseProvider}
              onChange={(e) => handleChange("databaseProvider", parseInt(e.target.value))}
              options={branchService.getDatabaseProviderOptions()}
              required
            />

            {/* SQLite - Show info message only */}
            {formData.databaseProvider === 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-400">
                Database will be automatically created at:{" "}
                <code className="font-mono">
                  Upload/Branches/{formData.code || "[branch-code]"}/Database/
                  {formData.code || "[branch-code]"}.db
                </code>
              </div>
            )}

            {/* Other providers - Show server and name fields */}
            {formData.databaseProvider !== 0 && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Database Server*"
                  value={formData.dbServer}
                  onChange={(e) => handleChange("dbServer", e.target.value)}
                  placeholder="localhost"
                  required
                />
                <Input
                  label="Database Name*"
                  value={formData.dbName}
                  onChange={(e) => handleChange("dbName", e.target.value)}
                  placeholder="branch_db"
                  required
                />
              </div>
            )}

            {/* Port, Username, Password - Not needed for SQLite */}
            {formData.databaseProvider !== 0 && (
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Port*"
                  type="number"
                  value={formData.dbPort}
                  onChange={(e) => handleChange("dbPort", parseInt(e.target.value))}
                  required
                />
                <Input
                  label="Username"
                  value={formData.dbUsername}
                  onChange={(e) => handleChange("dbUsername", e.target.value)}
                  placeholder="sa"
                />
                <Input
                  label="Password"
                  type="password"
                  value={formData.dbPassword}
                  onChange={(e) => handleChange("dbPassword", e.target.value)}
                  placeholder={isEditMode ? "(unchanged)" : ""}
                />
              </div>
            )}

            {/* SSL Configuration - MSSQL */}
            {formData.databaseProvider === 1 && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="trustServerCertificate"
                  checked={formData.trustServerCertificate}
                  onChange={(e) => handleChange("trustServerCertificate", e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label
                  htmlFor="trustServerCertificate"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Trust Server Certificate (recommended for development/self-signed certificates)
                </label>
              </div>
            )}

            {/* SSL Configuration - PostgreSQL & MySQL */}
            {(formData.databaseProvider === 2 || formData.databaseProvider === 3) && (
              <Select
                label="SSL Mode"
                value={formData.sslMode}
                onChange={(e) => handleChange("sslMode", parseInt(e.target.value))}
                options={[
                  { value: 0, label: "Disable (No SSL)" },
                  { value: 1, label: "Require (Encrypt connection)" },
                  { value: 2, label: "Verify CA (Verify certificate authority)" },
                  { value: 3, label: "Verify Full (Full certificate validation)" },
                ]}
              />
            )}

            {isEditMode && (
              <Button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                variant="secondary"
              >
                {testingConnection ? "Testing..." : "Test Connection"}
              </Button>
            )}
          </div>

          {/* Regional Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Regional Settings
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <Select
                label="Language*"
                value={formData.language}
                onChange={(e) => handleChange("language", e.target.value)}
                options={[
                  { value: "en", label: "English" },
                  { value: "ar", label: "Arabic" },
                ]}
                required
              />

              <Input
                label="Currency*"
                value={formData.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
                placeholder="USD"
                required
              />

              <Input
                label="Tax Rate (%)*"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={(e) => handleChange("taxRate", parseFloat(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Branch Logo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Branch Logo</h3>

            <ImageUpload
              branchName={branch?.code || "HeadOffice"}
              entityType="Branches"
              entityId={branch?.id}
              currentImages={
                currentLogoPath ? [extractImageIdFromPath(currentLogoPath) || currentLogoPath] : []
              }
              multiple={false}
              maxFiles={1}
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              label="Branch Logo (Optional)"
              cacheBust={true} // Always bust cache to ensure fresh images are displayed after uploads
            />

            {uploadingImages && (
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-sm font-medium">Uploading logo...</span>
              </div>
            )}

            {selectedImages.length > 0 && !uploadingImages && (
              <div className="text-sm text-gray-600 text-center">Logo ready to upload</div>
            )}
          </div>
        </div>
      }
    />
  );
};
