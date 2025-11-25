/**
 * Customer Analytics Widget
 * Dashboard widget showing customer metrics
 */

'use client';

import { useState, useEffect } from 'react';
import customerService from '@/services/customer.service';
import { CustomerDto } from '@/types/api.types';
import Link from 'next/link';

interface CustomerAnalyticsWidgetProps {
  locale: string;
}

export default function CustomerAnalyticsWidget({ locale }: CustomerAnalyticsWidgetProps) {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newThisMonth: 0,
  });
  const [topCustomers, setTopCustomers] = useState<CustomerDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get all customers
      const allCustomersResponse = await customerService.getCustomers({
        page: 1,
        pageSize: 1,
      });
      setStats((prev) => ({ ...prev, totalCustomers: allCustomersResponse.pagination.totalItems }));

      // Get active customers
      const activeCustomersResponse = await customerService.getCustomers({
        page: 1,
        pageSize: 1,
        isActive: true,
      });
      setStats((prev) => ({ ...prev, activeCustomers: activeCustomersResponse.pagination.totalItems }));

      // Get top customers by total purchases
      const topCustomersResponse = await customerService.getCustomers({
        page: 1,
        pageSize: 5,
        isActive: true,
      });
      // Sort by total purchases descending
      const sorted = topCustomersResponse.data.sort((a, b) => b.totalPurchases - a.totalPurchases);
      setTopCustomers(sorted);

      // Calculate new customers this month (simplified - checking creation date)
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const newCustomers = allCustomersResponse.data.filter(
        (c) => new Date(c.createdAt) >= thisMonth
      ).length;
      setStats((prev) => ({ ...prev, newThisMonth: newCustomers }));
    } catch (err) {
      console.error('Error loading customer analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded shadow p-6">
        <h3 className="text-lg font-bold mb-4">Customer Analytics</h3>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Customer Analytics</h3>
        <Link href={`/${locale}/branch/customers`} className="text-blue-600 hover:underline text-sm">
          View All
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.totalCustomers}</p>
          <p className="text-xs text-gray-600">Total Customers</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{stats.activeCustomers}</p>
          <p className="text-xs text-gray-600">Active</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{stats.newThisMonth}</p>
          <p className="text-xs text-gray-600">New This Month</p>
        </div>
      </div>

      {/* Top Customers */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Top Customers</p>
        {topCustomers.length > 0 ? (
          <div className="space-y-2">
            {topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">{index + 1}.</span>
                  <Link
                    href={`/${locale}/branch/customers/${customer.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {customer.nameEn}
                  </Link>
                </div>
                <span className="font-medium text-green-600">
                  ${customer.totalPurchases.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No customers yet</p>
        )}
      </div>
    </div>
  );
}
