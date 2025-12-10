"use client";

/**
 * Invoice Builder Page (Create New Template)
 *
 * Form-based invoice template builder for creating new templates
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import invoiceTemplateService from "@/services/invoice-template.service";
import {
  PaperSize,
  getPaperSizeName,
  DEFAULT_INVOICE_SCHEMA,
  InvoiceSchema,
  InvoiceSchemaSection,
} from "@/types/invoice-template.types";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/enums";
import { Button } from "@/components/shared/Button";
import { BRANCH_ROUTES } from "@/lib/routes";

export default function InvoiceBuilderPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();

  // Template metadata
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [paperSize, setPaperSize] = useState<PaperSize>(PaperSize.Thermal80mm);
  const [customWidth, setCustomWidth] = useState<number>(80);
  const [customHeight, setCustomHeight] = useState<number>(297);
  const [setAsActive, setSetAsActive] = useState(false);

  // Invoice schema (using default as starting point)
  const [schema, setSchema] = useState<InvoiceSchema>({
    ...DEFAULT_INVOICE_SCHEMA,
  });

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const updateSectionVisibility = (sectionId: string, visible: boolean) => {
    setSchema((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, visible } : section
      ),
    }));
  };

  const updateSectionConfig = (sectionId: string, config: Record<string, any>) => {
    setSchema((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, config: { ...section.config, ...config } } : section
      ),
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      // Validate
      if (!templateName.trim()) {
        setError("Template name is required");
        return;
      }

      // Create template
      await invoiceTemplateService.createTemplate({
        name: templateName,
        description: description || undefined,
        paperSize,
        customWidth: paperSize === PaperSize.Custom ? customWidth : undefined,
        customHeight: paperSize === PaperSize.Custom ? customHeight : undefined,
        schema: JSON.stringify(schema),
        setAsActive,
      });

      setSuccess("Template created successfully");

      // Redirect to templates list after short delay
      setTimeout(() => {
        router.push(BRANCH_ROUTES.SETTINGS_INVOICE_TEMPLATES(locale));
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(BRANCH_ROUTES.SETTINGS_INVOICE_TEMPLATES(locale));
  };

  const renderSectionFields = (section: InvoiceSchemaSection) => {
    switch (section.type) {
      case "header":
        return (
          <div className="space-y-4">
            {/* Logo */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={section.config?.showLogo ?? true}
                  onChange={(e) =>
                    updateSectionConfig(section.id, { showLogo: e.target.checked })
                  }
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Logo</span>
              </label>
            </div>

            {/* Branch Name */}
            <div>
              <label className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={section.config?.showBranchName ?? true}
                  onChange={(e) =>
                    updateSectionConfig(section.id, { showBranchName: e.target.checked })
                  }
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Branch Name</span>
              </label>
              {section.config?.showBranchName && (
                <input
                  type="text"
                  value={section.config?.branchNameLabel || "Branch Name"}
                  onChange={(e) =>
                    updateSectionConfig(section.id, { branchNameLabel: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Label for Branch Name"
                />
              )}
            </div>

            {/* Address */}
            <div>
              <label className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={section.config?.showAddress ?? true}
                  onChange={(e) =>
                    updateSectionConfig(section.id, { showAddress: e.target.checked })
                  }
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Address</span>
              </label>
              {section.config?.showAddress && (
                <input
                  type="text"
                  value={section.config?.addressLabel || "Address"}
                  onChange={(e) =>
                    updateSectionConfig(section.id, { addressLabel: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Label for Address"
                />
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={section.config?.showPhone ?? true}
                  onChange={(e) =>
                    updateSectionConfig(section.id, { showPhone: e.target.checked })
                  }
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Phone</span>
              </label>
              {section.config?.showPhone && (
                <input
                  type="text"
                  value={section.config?.phoneLabel || "Phone"}
                  onChange={(e) =>
                    updateSectionConfig(section.id, { phoneLabel: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Label for Phone"
                />
              )}
            </div>

            {/* VAT Number */}
            <div>
              <label className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={section.config?.showVatNumber ?? true}
                  onChange={(e) =>
                    updateSectionConfig(section.id, { showVatNumber: e.target.checked })
                  }
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show VAT Number</span>
              </label>
              {section.config?.showVatNumber && (
                <input
                  type="text"
                  value={section.config?.vatNumberLabel || "VAT Number"}
                  onChange={(e) =>
                    updateSectionConfig(section.id, { vatNumberLabel: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Label for VAT Number"
                />
              )}
            </div>

            {/* Commercial Registration Number */}
            <div>
              <label className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={section.config?.showCRN ?? true}
                  onChange={(e) =>
                    updateSectionConfig(section.id, { showCRN: e.target.checked })
                  }
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Commercial Reg. Number</span>
              </label>
              {section.config?.showCRN && (
                <input
                  type="text"
                  value={section.config?.crnLabel || "CR Number"}
                  onChange={(e) =>
                    updateSectionConfig(section.id, { crnLabel: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Label for CR Number"
                />
              )}
            </div>
          </div>
        );

      case "title":
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Standard Tax Invoice Title
              </label>
              <input
                type="text"
                value={section.config?.standardTitle || ""}
                onChange={(e) =>
                  updateSectionConfig(section.id, { standardTitle: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Standard Tax Invoice"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Simplified Tax Invoice Title
              </label>
              <input
                type="text"
                value={section.config?.simplifiedTitle || ""}
                onChange={(e) =>
                  updateSectionConfig(section.id, { simplifiedTitle: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Simplified Tax Invoice"
              />
            </div>
          </div>
        );

      case "customer":
      case "metadata":
        return (
          <div className="space-y-2">
            {(section.config?.fields || []).map((field: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <label className="flex items-center gap-2 flex-1">
                  <input
                    type="checkbox"
                    checked={field.visible ?? true}
                    onChange={(e) => {
                      const fields = [...(section.config?.fields || [])];
                      fields[index] = { ...field, visible: e.target.checked };
                      updateSectionConfig(section.id, { fields });
                    }}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={field.label || ""}
                    onChange={(e) => {
                      const fields = [...(section.config?.fields || [])];
                      fields[index] = { ...field, label: e.target.value };
                      updateSectionConfig(section.id, { fields });
                    }}
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    placeholder="Field Label"
                  />
                </label>
              </div>
            ))}
          </div>
        );

      case "items":
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Item Table Columns:</p>
            {(section.config?.columns || []).map((column: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <label className="flex items-center gap-2 flex-1">
                  <input
                    type="checkbox"
                    checked={column.visible ?? true}
                    onChange={(e) => {
                      const columns = [...(section.config?.columns || [])];
                      columns[index] = { ...column, visible: e.target.checked };
                      updateSectionConfig(section.id, { columns });
                    }}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={column.label || ""}
                    onChange={(e) => {
                      const columns = [...(section.config?.columns || [])];
                      columns[index] = { ...column, label: e.target.value };
                      updateSectionConfig(section.id, { columns });
                    }}
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    placeholder="Column Label"
                  />
                </label>
              </div>
            ))}
          </div>
        );

      case "summary":
        return (
          <div className="space-y-2">
            {(section.config?.fields || []).map((field: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <label className="flex items-center gap-2 flex-1">
                  <input
                    type="checkbox"
                    checked={field.visible ?? true}
                    onChange={(e) => {
                      const fields = [...(section.config?.fields || [])];
                      fields[index] = { ...field, visible: e.target.checked };
                      updateSectionConfig(section.id, { fields });
                    }}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <input
                    type="text"
                    value={field.label || ""}
                    onChange={(e) => {
                      const fields = [...(section.config?.fields || [])];
                      fields[index] = { ...field, label: e.target.value };
                      updateSectionConfig(section.id, { fields });
                    }}
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    placeholder="Field Label"
                  />
                </label>
              </div>
            ))}
          </div>
        );

      case "footer":
        return (
          <div className="space-y-4">
            {/* ZATCA QR Code */}
            <div>
              <label className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={section.config?.showZatcaQR ?? true}
                  onChange={(e) =>
                    updateSectionConfig(section.id, { showZatcaQR: e.target.checked })
                  }
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show ZATCA QR Code</span>
              </label>
              {section.config?.showZatcaQR && (
                <input
                  type="text"
                  value={section.config?.zatcaQRLabel || "Scan for e-Invoice"}
                  onChange={(e) =>
                    updateSectionConfig(section.id, { zatcaQRLabel: e.target.value })
                  }
                  className="mt-1 w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Label for QR Code"
                />
              )}
            </div>

            {/* Notes Section */}
            <div>
              <label className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={section.config?.showNotes ?? true}
                  onChange={(e) =>
                    updateSectionConfig(section.id, { showNotes: e.target.checked })
                  }
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Notes</span>
              </label>
              {section.config?.showNotes && (
                <>
                  <input
                    type="text"
                    value={section.config?.notesLabel || "Notes"}
                    onChange={(e) =>
                      updateSectionConfig(section.id, { notesLabel: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    placeholder="Section Label"
                  />
                  <textarea
                    value={section.config?.notesText || ""}
                    onChange={(e) =>
                      updateSectionConfig(section.id, { notesText: e.target.value })
                    }
                    rows={2}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Notes content"
                  />
                </>
              )}
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-gray-500 dark:text-gray-400">No configuration available</p>;
    }
  };

  return (
    <RoleGuard
      requireRole={UserRole.Manager}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
          <Button onClick={() => router.push(`/${locale}/branch`)}>Go to Dashboard</Button>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Invoice Template
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Design your custom invoice template by configuring sections and fields
          </p>
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

        {/* Template Metadata */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Template Information
          </h2>

          <div className="space-y-4">
            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Standard 80mm Receipt"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Describe this template..."
              />
            </div>

            {/* Paper Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paper Size <span className="text-red-500">*</span>
              </label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(Number(e.target.value) as PaperSize)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value={PaperSize.Thermal58mm}>58mm Thermal</option>
                <option value={PaperSize.Thermal80mm}>80mm Thermal</option>
                <option value={PaperSize.A4}>A4 Paper</option>
                <option value={PaperSize.Custom}>Custom Size</option>
              </select>
            </div>

            {/* Custom Size Fields */}
            {paperSize === PaperSize.Custom && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Width (mm)
                  </label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    min={50}
                    max={500}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Height (mm)
                  </label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    min={100}
                    max={1000}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Set as Active */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={setAsActive}
                onChange={(e) => setSetAsActive(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Set as active template after creation
              </span>
            </label>
          </div>
        </div>

        {/* Sections Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Invoice Sections
          </h2>

          <div className="space-y-3">
            {schema.sections.map((section) => (
              <div
                key={section.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={section.visible}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateSectionVisibility(section.id, e.target.checked);
                      }}
                      className="rounded border-gray-300 dark:border-gray-600"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {section.type === "metadata" ? "Invoice Details" : section.type}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedSection === section.id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Section Content */}
                {expandedSection === section.id && (
                  <div className="p-4 bg-white dark:bg-gray-800">
                    {renderSectionFields(section)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mb-8">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              "Create Template"
            )}
          </button>
        </div>
      </div>
    </RoleGuard>
  );
}
