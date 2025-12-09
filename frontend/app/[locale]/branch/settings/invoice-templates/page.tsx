"use client";

/**
 * Invoice Template Management Page
 *
 * Manage invoice templates with CRUD operations
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import invoiceTemplateService from "@/services/invoice-template.service";
import {
  InvoiceTemplateListItem,
  getPaperSizeName,
  PaperSize,
} from "@/types/invoice-template.types";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/enums";
import { Button } from "@/components/shared/Button";
import { ConfirmationDialog } from "@/components/shared";
import { BRANCH_ROUTES } from "@/lib/routes";

export default function InvoiceTemplatesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();

  // State
  const [templates, setTemplates] = useState<InvoiceTemplateListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<InvoiceTemplateListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Duplicate dialog state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [templateToDuplicate, setTemplateToDuplicate] = useState<InvoiceTemplateListItem | null>(
    null
  );
  const [duplicateName, setDuplicateName] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await invoiceTemplateService.getTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetActive = async (template: InvoiceTemplateListItem) => {
    try {
      setError("");
      setSuccess("");
      await invoiceTemplateService.setActiveTemplate(template.id);
      setSuccess(`"${template.name}" set as active template`);
      await loadTemplates(); // Reload to update UI
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set active template");
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      setIsDeleting(true);
      setError("");
      setSuccess("");
      await invoiceTemplateService.deleteTemplate(templateToDelete.id);
      setSuccess(`Template "${templateToDelete.name}" deleted successfully`);
      setShowDeleteDialog(false);
      setTemplateToDelete(null);
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template");
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!templateToDuplicate || !duplicateName.trim()) return;

    try {
      setIsDuplicating(true);
      setError("");
      setSuccess("");
      await invoiceTemplateService.duplicateTemplate(templateToDuplicate.id, {
        newName: duplicateName,
      });
      setSuccess(`Template duplicated as "${duplicateName}"`);
      setShowDuplicateDialog(false);
      setTemplateToDuplicate(null);
      setDuplicateName("");
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate template");
    } finally {
      setIsDuplicating(false);
    }
  };

  const openDeleteDialog = (template: InvoiceTemplateListItem) => {
    setTemplateToDelete(template);
    setShowDeleteDialog(true);
  };

  const openDuplicateDialog = (template: InvoiceTemplateListItem) => {
    setTemplateToDuplicate(template);
    setDuplicateName(`${template.name} (Copy)`);
    setShowDuplicateDialog(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
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
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Only Managers can manage invoice templates.
          </p>
          <Button onClick={() => router.push(`/${locale}/branch`)}>Go to Dashboard</Button>
        </div>
      }
    >
      <div>
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Invoice Templates
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your invoice designs and layouts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push(`${BRANCH_ROUTES.SETTINGS_INVOICE_TEMPLATES(locale)}/preview`)}
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              Preview Active Template
            </Button>
            <Button
              onClick={() => router.push(BRANCH_ROUTES.SETTINGS_INVOICE_BUILDER(locale))}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              + Create New Template
            </Button>
          </div>
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

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Templates Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
              Create your first invoice template to customize how your invoices look when printed.
            </p>
            <Button
              onClick={() => router.push(BRANCH_ROUTES.SETTINGS_INVOICE_BUILDER(locale))}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Your First Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`bg-white dark:bg-gray-800 rounded-lg border-2 transition-all hover:shadow-lg ${
                  template.isActive
                    ? "border-green-500 dark:border-green-600"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {/* Template Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {template.name}
                    </h3>
                    {template.isActive && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Paper Size:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {template.paperSizeName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Created:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(template.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(template.updatedAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  {!template.isActive && (
                    <button
                      onClick={() => handleSetActive(template)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                    >
                      Set as Active
                    </button>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() =>
                        router.push(BRANCH_ROUTES.SETTINGS_INVOICE_BUILDER_EDIT(locale, template.id))
                      }
                      className="px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      title="Edit template"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDuplicateDialog(template)}
                      className="px-3 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                      title="Duplicate template"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => openDeleteDialog(template)}
                      disabled={template.isActive}
                      className="px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={template.isActive ? "Cannot delete active template" : "Delete template"}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          title="Delete Template"
          message={`Are you sure you want to delete "${templateToDelete?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          isProcessing={isDeleting}
        />

        {/* Duplicate Dialog */}
        {showDuplicateDialog && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowDuplicateDialog(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Duplicate Template
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Enter a name for the duplicated template:
              </p>
              <input
                type="text"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors mb-6"
                placeholder="Template name"
                autoFocus
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDuplicateDialog(false)}
                  disabled={isDuplicating}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDuplicate}
                  disabled={isDuplicating || !duplicateName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDuplicating ? (
                    <>
                      <div
                        className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
                        aria-hidden="true"
                      ></div>
                      Duplicating...
                    </>
                  ) : (
                    "Duplicate"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
