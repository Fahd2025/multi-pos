/**
 * Invoice Display Component
 * Display Touch and Standard invoice formats with print functionality
 */

'use client';

import { useRef } from 'react';
import { SaleDto } from '@/types/api.types';
import { InvoiceType, PaymentMethod } from '@/types/enums';

interface InvoiceDisplayProps {
  sale: SaleDto;
  onClose: () => void;
  onPrint?: () => void;
}

export default function InvoiceDisplay({ sale, onClose, onPrint }: InvoiceDisplayProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const getPaymentMethodName = (method: PaymentMethod): string => {
    switch (method) {
      case PaymentMethod.Cash:
        return 'Cash';
      case PaymentMethod.Card:
        return 'Card';
      case PaymentMethod.DigitalWallet:
        return 'Digital Wallet';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isTouchInvoice = sale.invoiceType === InvoiceType.Touch;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isTouchInvoice ? '📱 Touch Invoice' : '📄 Standard Invoice'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <span>🖨️</span>
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div ref={printRef} className="p-6">
          {/* Touch Invoice Format - Simple */}
          {isTouchInvoice && (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center border-b border-gray-200 pb-4">
                <h1 className="text-2xl font-bold">SALE RECEIPT</h1>
                <p className="text-sm text-gray-600 mt-1">Touch Invoice</p>
              </div>

              {/* Transaction Info */}
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono font-semibold">{sale.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{formatDate(sale.saleDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cashier:</span>
                  <span>{sale.cashierName}</span>
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t border-b border-gray-200 py-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left pb-2">Item</th>
                      <th className="text-right pb-2">Qty</th>
                      <th className="text-right pb-2">Price</th>
                      <th className="text-right pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.lineItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100">
                        <td className="py-2">{item.productName}</td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right">${item.discountedUnitPrice.toFixed(2)}</td>
                        <td className="text-right font-medium">
                          ${item.lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>${sale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax:</span>
                  <span>${sale.taxAmount.toFixed(2)}</span>
                </div>
                {sale.totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Total Saved:</span>
                    <span>-${sale.totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>TOTAL:</span>
                  <span>${sale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method:</span>
                  <span>{getPaymentMethodName(sale.paymentMethod)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-gray-600 border-t border-gray-200 pt-4">
                <p>Thank you for your purchase!</p>
                <p className="mt-1">Please keep this receipt for your records</p>
              </div>
            </div>
          )}

          {/* Standard Invoice Format - Detailed */}
          {!isTouchInvoice && (
            <div className="space-y-6">
              {/* Company Header */}
              <div className="text-center border-b-2 border-gray-300 pb-6">
                <h1 className="text-3xl font-bold">Multi-POS System</h1>
                <p className="text-gray-600 mt-2">Branch: Main Office</p>
                <p className="text-sm text-gray-500">123 Business St, City, Country</p>
                <p className="text-sm text-gray-500">Phone: +1 234 567 8900</p>
              </div>

              {/* Invoice Header */}
              <div className="flex justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-blue-600">INVOICE</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    #{sale.invoiceNumber || sale.transactionId}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">Invoice Date:</p>
                  <p className="text-gray-600">{formatDate(sale.saleDate)}</p>
                </div>
              </div>

              {/* Customer & Transaction Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    {sale.customerName ? (
                      <>
                        <p className="font-medium text-gray-900">{sale.customerName}</p>
                        <p>Customer ID: {sale.customerId}</p>
                      </>
                    ) : (
                      <p className="italic">Walk-in Customer</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Transaction Details:</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Transaction ID: {sale.transactionId}</p>
                    <p>Cashier: {sale.cashierName}</p>
                    <p>Payment: {getPaymentMethodName(sale.paymentMethod)}</p>
                    {sale.paymentReference && (
                      <p>Reference: {sale.paymentReference}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 px-4">#</th>
                      <th className="text-left py-3 px-4">Product</th>
                      <th className="text-left py-3 px-4">SKU</th>
                      <th className="text-right py-3 px-4">Qty</th>
                      <th className="text-right py-3 px-4">Unit Price</th>
                      <th className="text-right py-3 px-4">Discount</th>
                      <th className="text-right py-3 px-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.lineItems.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-3 px-4">{index + 1}</td>
                        <td className="py-3 px-4 font-medium">{item.productName}</td>
                        <td className="py-3 px-4 text-gray-600">{item.productSku}</td>
                        <td className="text-right py-3 px-4">{item.quantity}</td>
                        <td className="text-right py-3 px-4">
                          ${item.unitPrice.toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-4">
                          {item.discountValue > 0 ? (
                            <span className="text-green-600">
                              {item.discountType === 1
                                ? `${item.discountValue}%`
                                : `$${item.discountValue.toFixed(2)}`}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="text-right py-3 px-4 font-semibold">
                          ${item.lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="flex justify-end">
                <div className="w-80 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>${sale.subtotal.toFixed(2)}</span>
                  </div>
                  {sale.totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Total Discount:</span>
                      <span>-${sale.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span>${sale.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t-2 border-gray-300 pt-2">
                    <span>TOTAL DUE:</span>
                    <span className="text-blue-600">${sale.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {sale.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Notes:</h3>
                  <p className="text-sm text-gray-600">{sale.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-gray-200 pt-4 text-center text-sm text-gray-600">
                <p className="font-semibold">Thank you for your business!</p>
                <p className="mt-2">
                  This is a computer-generated invoice and does not require a signature.
                </p>
                <p className="mt-1">For inquiries, please contact support@example.com</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          ${printRef.current} * {
            visibility: visible;
          }
          ${printRef.current} {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
