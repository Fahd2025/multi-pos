'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CashDrawerService } from '@/services/cash-drawer.service';
import { CashDrawer } from '@/types/cash-drawer.types';

export default function CashDrawerPage() {
  const router = useRouter();
  const [currentDrawer, setCurrentDrawer] = useState<CashDrawer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentDrawer();
  }, []);

  const loadCurrentDrawer = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }
      const drawer = await CashDrawerService.getCurrentDrawer(token);
      setCurrentDrawer(drawer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cash drawer');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = async (openingBalance: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');

      const drawer = await CashDrawerService.openDrawer(
        { openingBalance },
        token
      );
      setCurrentDrawer(drawer);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open cash drawer');
    }
  };

  const handleCloseDrawer = async (actualCash: number) => {
    if (!currentDrawer) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No access token found');

      const drawer = await CashDrawerService.closeDrawer(
        currentDrawer.id,
        { actualCash },
        token
      );
      setCurrentDrawer(drawer);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close cash drawer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cash drawer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Cash Drawer Management</h1>
        <button
          onClick={() => router.push('/en/branch/cash-drawer/history')}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          📋 View History
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {!currentDrawer ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">No Open Cash Drawer</h2>
          <p className="text-gray-600 mb-6">
            There is no open cash drawer for this branch. Open a drawer to start processing cash transactions.
          </p>
          <OpenDrawerForm onSubmit={handleOpenDrawer} />
        </div>
      ) : currentDrawer.status === 'Open' ? (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-green-800">Cash Drawer Open</h2>
                <p className="text-sm text-green-600">
                  Opened by {currentDrawer.openedByUsername} at{' '}
                  {new Date(currentDrawer.openedAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Expected Cash</div>
                <div className="text-3xl font-bold text-green-700">
                  ${currentDrawer.expectedCash.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white p-4 rounded">
                <div className="text-sm text-gray-600">Opening Balance</div>
                <div className="text-xl font-semibold">${currentDrawer.openingBalance.toFixed(2)}</div>
              </div>
              <div className="bg-white p-4 rounded">
                <div className="text-sm text-gray-600">Transactions</div>
                <div className="text-xl font-semibold">{currentDrawer.totalTransactionCount}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {currentDrawer.salesCount} sales, {currentDrawer.transactions.length} other
                </div>
              </div>
              <div className="bg-white p-4 rounded">
                <div className="text-sm text-gray-600">Status</div>
                <div className="text-xl font-semibold text-green-600">{currentDrawer.status}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Close Cash Drawer</h3>
            <CloseDrawerForm
              expectedCash={currentDrawer.expectedCash}
              onSubmit={handleCloseDrawer}
            />
          </div>

          {currentDrawer.transactions.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              <div className="space-y-2">
                {currentDrawer.transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <div className="font-medium">{transaction.type}</div>
                      <div className="text-sm text-gray-600">{transaction.reason}</div>
                    </div>
                    <div className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Cash Drawer Closed</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-sm text-gray-600">Expected Cash</div>
              <div className="text-xl font-semibold">${currentDrawer.expectedCash.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Actual Cash</div>
              <div className="text-xl font-semibold">${currentDrawer.actualCash?.toFixed(2) || '0.00'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Variance</div>
              <div className={`text-xl font-semibold ${(currentDrawer.variance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${currentDrawer.variance?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Closed At</div>
              <div className="text-sm">{currentDrawer.closedAt ? new Date(currentDrawer.closedAt).toLocaleString() : 'N/A'}</div>
            </div>
          </div>
          <button
            onClick={loadCurrentDrawer}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}

function OpenDrawerForm({ onSubmit }: { onSubmit: (amount: number) => void }) {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (value >= 0) {
      onSubmit(value);
      setAmount('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Opening Balance ($)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="0.00"
          required
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
      >
        Open Cash Drawer
      </button>
    </form>
  );
}

function CloseDrawerForm({
  expectedCash,
  onSubmit
}: {
  expectedCash: number;
  onSubmit: (amount: number) => void
}) {
  const [actualCash, setActualCash] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(actualCash);
    if (value >= 0) {
      onSubmit(value);
      setActualCash('');
    }
  };

  const variance = actualCash ? parseFloat(actualCash) - expectedCash : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
        <div className="text-sm text-gray-700">Expected Cash in Drawer</div>
        <div className="text-2xl font-bold text-blue-700">${expectedCash.toFixed(2)}</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Actual Cash Counted ($)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={actualCash}
          onChange={(e) => setActualCash(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="0.00"
          required
        />
      </div>

      {actualCash && (
        <div className={`p-4 rounded ${variance >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="text-sm text-gray-700">Variance (Over/Short)</div>
          <div className={`text-2xl font-bold ${variance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            ${variance.toFixed(2)}
          </div>
        </div>
      )}

      <button
        type="submit"
        className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-medium"
      >
        Close Cash Drawer
      </button>
    </form>
  );
}
