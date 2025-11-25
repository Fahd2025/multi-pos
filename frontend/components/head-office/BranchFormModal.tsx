/**
 * Branch Form Modal
 * Reusable modal for creating/editing branches
 * Uses existing Modal and Form components
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Input } from '@/components/shared/Form/Input';
import { Select } from '@/components/shared/Form/Select';
import { Button } from '@/components/shared/Button';
import branchService, { CreateBranchDto, UpdateBranchDto, BranchDto } from '@/services/branch.service';

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

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    nameEn: '',
    nameAr: '',
    loginName: '',
    email: '',
    phone: '',
    databaseProvider: 0, // SQLite by default
    dbServer: '',
    dbName: '',
    dbPort: 0,
    dbUsername: '',
    dbPassword: '',
    language: 'en',
    currency: 'USD',
    taxRate: 0,
  });

  // Initialize form data when branch prop changes
  useEffect(() => {
    if (branch) {
      setFormData({
        code: branch.code,
        nameEn: branch.nameEn,
        nameAr: branch.nameAr,
        loginName: branch.loginName,
        email: branch.email || '',
        phone: branch.phone || '',
        databaseProvider: ['SQLite', 'MSSQL', 'PostgreSQL', 'MySQL'].indexOf(branch.databaseProvider),
        dbServer: branch.dbServer,
        dbName: branch.dbName,
        dbPort: branch.dbPort,
        dbUsername: branch.dbUsername || '',
        dbPassword: '', // Never populate password for security
        language: branch.language,
        currency: branch.currency,
        taxRate: branch.taxRate,
      });
    } else {
      // Reset form for create mode
      setFormData({
        code: '',
        nameEn: '',
        nameAr: '',
        loginName: '',
        email: '',
        phone: '',
        databaseProvider: 0,
        dbServer: '',
        dbName: '',
        dbPort: 0,
        dbUsername: '',
        dbPassword: '',
        language: 'en',
        currency: 'USD',
        taxRate: 0,
      });
    }
  }, [branch, isOpen]);

  // Update default port when database provider changes
  useEffect(() => {
    if (!isEditMode) {
      const defaultPort = branchService.getDefaultPort(formData.databaseProvider);
      setFormData((prev) => ({ ...prev, dbPort: defaultPort }));
    }
  }, [formData.databaseProvider, isEditMode]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleTestConnection = async () => {
    if (!branch?.id) {
      setError('Save the branch first to test the connection');
      return;
    }

    setTestingConnection(true);
    setError(null);

    try {
      const result = await branchService.testConnection(branch.id);
      alert(result.message);
    } catch (err: any) {
      setError(err.message || 'Connection test failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditMode && branch) {
        // Update branch
        const updateDto: UpdateBranchDto = {
          nameEn: formData.nameEn,
          nameAr: formData.nameAr,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          databaseProvider: formData.databaseProvider,
          dbServer: formData.dbServer,
          dbName: formData.dbName,
          dbPort: formData.dbPort,
          dbUsername: formData.dbUsername || undefined,
          dbPassword: formData.dbPassword || undefined,
          language: formData.language,
          currency: formData.currency,
          taxRate: formData.taxRate,
        };
        await branchService.updateBranch(branch.id, updateDto);
      } else {
        // Create branch
        const createDto: CreateBranchDto = {
          code: formData.code,
          nameEn: formData.nameEn,
          nameAr: formData.nameAr,
          loginName: formData.loginName,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          databaseProvider: formData.databaseProvider,
          dbServer: formData.dbServer,
          dbName: formData.dbName,
          dbPort: formData.dbPort,
          dbUsername: formData.dbUsername || undefined,
          dbPassword: formData.dbPassword || undefined,
          language: formData.language,
          currency: formData.currency,
          taxRate: formData.taxRate,
        };
        await branchService.createBranch(createDto);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} branch`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Branch' : 'Create New Branch'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Branch Code*"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              disabled={isEditMode}
              placeholder="B001"
              required
            />
            <Input
              label="Login Name*"
              value={formData.loginName}
              onChange={(e) => handleChange('loginName', e.target.value)}
              disabled={isEditMode}
              placeholder="branch001"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name (English)*"
              value={formData.nameEn}
              onChange={(e) => handleChange('nameEn', e.target.value)}
              placeholder="Main Branch"
              required
            />
            <Input
              label="Name (Arabic)*"
              value={formData.nameAr}
              onChange={(e) => handleChange('nameAr', e.target.value)}
              placeholder="الفرع الرئيسي"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="branch@example.com"
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
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
            onChange={(e) => handleChange('databaseProvider', parseInt(e.target.value))}
            options={branchService.getDatabaseProviderOptions()}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Database Server*"
              value={formData.dbServer}
              onChange={(e) => handleChange('dbServer', e.target.value)}
              placeholder={formData.databaseProvider === 0 ? './data/branches' : 'localhost'}
              required
            />
            <Input
              label="Database Name*"
              value={formData.dbName}
              onChange={(e) => handleChange('dbName', e.target.value)}
              placeholder="branch_db"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Port*"
              type="number"
              value={formData.dbPort}
              onChange={(e) => handleChange('dbPort', parseInt(e.target.value))}
              required
            />
            <Input
              label="Username"
              value={formData.dbUsername}
              onChange={(e) => handleChange('dbUsername', e.target.value)}
              placeholder="sa"
            />
            <Input
              label="Password"
              type="password"
              value={formData.dbPassword}
              onChange={(e) => handleChange('dbPassword', e.target.value)}
              placeholder={isEditMode ? '(unchanged)' : ''}
            />
          </div>

          {isEditMode && (
            <Button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              variant="secondary"
            >
              {testingConnection ? 'Testing...' : 'Test Connection'}
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
              onChange={(e) => handleChange('language', e.target.value)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'ar', label: 'Arabic' }
              ]}
              required
            />

            <Input
              label="Currency*"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
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
              onChange={(e) => handleChange('taxRate', parseFloat(e.target.value))}
              required
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" onClick={onClose} variant="secondary" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEditMode ? 'Update Branch' : 'Create Branch'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
