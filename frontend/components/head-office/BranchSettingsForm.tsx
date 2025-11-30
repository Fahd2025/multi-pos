/**
 * Branch Settings Form
 * Reusable form for updating branch regional settings
 */

'use client';

import React, { useState } from 'react';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { Button } from '@/components/shared/Button';
import branchService, { BranchDto, BranchSettingsDto } from '@/services/branch.service';
import { ErrorAlert } from '@/components/shared/ErrorAlert';

interface BranchSettingsFormProps {
  branch: BranchDto;
  onUpdate: () => void;
}

export const BranchSettingsForm: React.FC<BranchSettingsFormProps> = ({ branch, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<BranchSettingsDto>({
    language: branch.language,
    currency: branch.currency,
    timeZone: branch.timeZone,
    dateFormat: branch.dateFormat,
    numberFormat: branch.numberFormat,
    taxRate: branch.taxRate,
  });

  const handleChange = (field: keyof BranchSettingsDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await branchService.updateBranchSettings(branch.id, formData);
      setSuccess(true);
      onUpdate();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Regional Settings
      </h2>

      {error && <ErrorAlert message={error} className="mb-4" />}

      {success && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-800 dark:text-green-400">
          Settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Time Zone*"
            value={formData.timeZone}
            onChange={(e) => handleChange('timeZone', e.target.value)}
            placeholder="UTC"
            required
          />

          <Input
            label="Date Format*"
            value={formData.dateFormat}
            onChange={(e) => handleChange('dateFormat', e.target.value)}
            placeholder="MM/DD/YYYY"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Number Format*"
            value={formData.numberFormat}
            onChange={(e) => handleChange('numberFormat', e.target.value)}
            placeholder="en-US"
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

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
};
