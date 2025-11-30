/**
 * Supplier Details Page
 *
 * Display detailed supplier information and purchase history
 */

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { DataTableColumn } from "@/types/data-table.types";
import { SupplierDto, PurchaseDto } from "@/types/api.types";
import supplierService from "@/services/supplier.service";

export default function SupplierDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<SupplierDto | null>(null);
  const [purchases, setPurchases] = useState<PurchaseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");

  // Initialize data table for purchase history
  const {
    data: displayPurchases,
    paginationConfig,
    handlePageChange,
    handlePageSizeChange,
  } = useDataTable(purchases, {
    pageSize: 10,
    sortable: false,
    pagination: true,
  });

  // Load supplier data
  useEffect(() => {
    loadSupplier();
    loadPurchaseHistory();
  }, [supplierId]);

  const loadSupplier = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await supplierService.getSupplierById(supplierId);
      setSupplier(data);
    } catch (err: any) {
      setError(err.message || "Failed to load supplier details");
      console.error("Error loading supplier:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPurchaseHistory = async () => {
    try {
      const data = await supplierService.getSupplierPurchaseHistory(supplierId, {
        pageSize: 100, // Load all for client-side pagination
      });
      setPurchases(data);
    } catch (err: any) {
      console.error("Error loading purchase history:", err);
    }
  };

  // Define purchase history columns
  const purchaseColumns: DataTableColumn<PurchaseDto>[] = [
    {
      key: "purchaseOrderNumber",
      label: "PO Number",
      width: "120px",
      render: (value) => (
        <span className="font-mono text-sm font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: "purchaseDate",
      label: "Purchase Date",
      width: "130px",
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "receivedDate",
      label: "Received Date",
      width: "130px",
      render: (value) =>
        value ? (
          new Date(value).toLocaleDateString()
        ) : (
          <span className="text-gray-400">Pending</span>
        ),
    },
    {
      key: "totalCost",
      label: "Total Cost",
      width: "120px",
      render: (value) => (
        <span className="font-semibold text-gray-900">
          ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      label: "Payment",
      width: "120px",
      render: (value) => {
        const statuses = ["Pending", "Partial", "Completed", "Cancelled"];
        const colors = [
          "bg-yellow-100 text-yellow-800",
          "bg-blue-100 text-blue-800",
          "bg-green-100 text-green-800",
          "bg-gray-100 text-gray-800",
        ];
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[value]}`}>
            {statuses[value]}
          </span>
        );
      },
    },
    {
      key: "lineItems",
      label: "Items",
      width: "80px",
      render: (value) => <span className="text-gray-600">{value.length}</span>,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading supplier details...</p>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg
              className="w-12 h-12 text-red-600 mx-auto mb-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-lg font-medium text-red-800 mb-2">Failed to Load Supplier</h3>
            <p className="text-red-700 mb-4">{error || "Supplier not found"}</p>
            <Link
              href={`/${locale}/branch/suppliers`}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              ← Back to Suppliers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link href={`/${locale}/branch/suppliers`} className="text-blue-600 hover:text-blue-800">
            Suppliers
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">{supplier.nameEn}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{supplier.nameEn}</h1>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  supplier.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}
              >
                {supplier.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {supplier.nameAr && <p className="text-lg text-gray-600">{supplier.nameAr}</p>}
            <p className="text-gray-500 font-mono mt-1">{supplier.code}</p>
          </div>
          <button
            onClick={() => router.push(`/${locale}/branch/suppliers`)}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            ← Back
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Purchases</p>
            <p className="text-3xl font-bold text-blue-600">{supplier.totalPurchases}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total Spent</p>
            <p className="text-3xl font-bold text-purple-600">
              $
              {supplier.totalSpent.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Last Purchase</p>
            <p className="text-xl font-bold text-gray-900">
              {supplier.lastPurchaseDate
                ? new Date(supplier.lastPurchaseDate).toLocaleDateString()
                : "Never"}
            </p>
            {supplier.lastPurchaseDate && (
              <p className="text-sm text-gray-500 mt-1">
                {Math.floor(
                  (Date.now() - new Date(supplier.lastPurchaseDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days ago
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("details")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "details"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Supplier Details
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Purchase History ({purchases.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "details" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Details */}
              <div className="space-y-4">
                {supplier.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-gray-900">
                      <a
                        href={`mailto:${supplier.email}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {supplier.email}
                      </a>
                    </p>
                  </div>
                )}
                {supplier.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="mt-1 text-gray-900">
                      <a
                        href={`tel:${supplier.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {supplier.phone}
                      </a>
                    </p>
                  </div>
                )}
                {supplier.addressEn && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address (English)</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{supplier.addressEn}</p>
                  </div>
                )}
                {supplier.addressAr && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address (Arabic)</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap" dir="rtl">
                      {supplier.addressAr}
                    </p>
                  </div>
                )}
              </div>

              {/* Terms */}
              <div className="space-y-4">
                {supplier.paymentTerms && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                      {supplier.paymentTerms}
                    </p>
                  </div>
                )}
                {supplier.deliveryTerms && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Delivery Terms</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                      {supplier.deliveryTerms}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Created Date</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(supplier.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(supplier.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Purchase History</h2>
            {purchases.length > 0 ? (
              <DataTable
                data={displayPurchases}
                columns={purchaseColumns}
                getRowKey={(row) => row.id}
                pagination
                paginationConfig={paginationConfig}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                emptyMessage="No purchase orders found for this supplier."
              />
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No purchase orders</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a purchase order with this supplier.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/${locale}/branch/purchases`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Go to Purchases
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
