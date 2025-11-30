/**
 * Database Connection Test Component
 * Test database connectivity for a branch
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/shared/Button';
import branchService from '@/services/branch.service';

interface DatabaseConnectionTestProps {
  branchId: string;
}

export const DatabaseConnectionTest: React.FC<DatabaseConnectionTestProps> = ({ branchId }) => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await branchService.testConnection(branchId);
      setResult(response);
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Database Connection Test
      </h2>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Test the database connection to ensure the branch database is accessible and properly
        configured.
      </p>

      <Button onClick={handleTest} disabled={testing} className="mb-4">
        {testing ? 'Testing Connection...' : 'Test Connection'}
      </Button>

      {result && (
        <div
          className={`rounded-lg border p-4 ${
            result.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 text-2xl mr-3">
              {result.success ? '✅' : '❌'}
            </div>
            <div>
              <h3
                className={`text-sm font-semibold mb-1 ${
                  result.success
                    ? 'text-green-800 dark:text-green-400'
                    : 'text-red-800 dark:text-red-400'
                }`}
              >
                {result.success ? 'Connection Successful' : 'Connection Failed'}
              </h3>
              <p
                className={`text-sm ${
                  result.success
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}
              >
                {result.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Troubleshooting Tips:
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-disc list-inside">
          <li>Verify the database server is running and accessible</li>
          <li>Check that the database name, username, and password are correct</li>
          <li>Ensure the specified port is open and not blocked by a firewall</li>
          <li>For SQLite, verify the file path exists and has proper permissions</li>
          <li>For remote databases, check network connectivity</li>
        </ul>
      </div>
    </div>
  );
};
