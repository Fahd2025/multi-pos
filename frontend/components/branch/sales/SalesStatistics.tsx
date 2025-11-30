/**
 * Sales Statistics Component
 * Display key sales metrics with responsive cards
 */

'use client';

import { useState, useEffect } from 'react';
import salesService from '@/services/sales.service';
import { SalesStatsDto } from '@/types/api.types';

interface SalesStatisticsProps {
  dateFrom?: string;
  dateTo?: string;
  onRefresh?: () => void;
}

export default function SalesStatistics({
  dateFrom,
  dateTo,
  onRefresh
}: SalesStatisticsProps) {
  const [stats, setStats] = useState<SalesStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use provided dates or default to today
      const today = new Date().toISOString().split('T')[0];
      const from = dateFrom || today;
      const to = dateTo || today;

      const data = await salesService.getSalesStats({
        dateFrom: from,
        dateTo: to,
      });

      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch sales statistics:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800">Failed to load statistics</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Safely extract values with defaults
  const todayRevenue = stats.todayRevenue ?? 0;
  const totalRevenue = stats.totalRevenue ?? 0;
  const todaySales = stats.todaySales ?? 0;
  const totalSales = stats.totalSales ?? 0;
  const averageOrderValue = stats.averageOrderValue ?? 0;
  const vatAmount = todayRevenue * 0.15;

  const statCards = [
    {
      id: 'revenue',
      label: 'Total Revenue',
      value: `$${todayRevenue.toFixed(2)}`,
      icon: '💰',
      color: 'blue',
      trend: todayRevenue > 0 && totalRevenue > 0 ? '+' + ((todayRevenue / totalRevenue) * 100).toFixed(1) + '%' : null,
    },
    {
      id: 'vat',
      label: 'Total VAT',
      value: `$${vatAmount.toFixed(2)}`,
      icon: '📊',
      color: 'green',
      subtext: '15% of revenue',
    },
    {
      id: 'transactions',
      label: 'Total Transactions',
      value: todaySales.toString(),
      icon: '🧾',
      color: 'purple',
      subtext: `${totalSales} all-time`,
    },
    {
      id: 'average',
      label: 'Average Transaction',
      value: `$${averageOrderValue.toFixed(2)}`,
      icon: '📈',
      color: 'orange',
      subtext: 'Per order',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {statCards.map((card) => (
        <div
          key={card.id}
          className={`bg-white border-2 rounded-lg p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 touch-manipulation active:scale-[0.98] ${
            colorClasses[card.color as keyof typeof colorClasses]
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-3xl md:text-4xl">{card.icon}</span>
            {card.trend && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                {card.trend}
              </span>
            )}
          </div>

          <h3 className="text-sm font-medium text-gray-600 mb-1">
            {card.label}
          </h3>

          <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {card.value}
          </p>

          {card.subtext && (
            <p className="text-xs text-gray-500">
              {card.subtext}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
