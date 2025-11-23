/**
 * Sales Page
 * Point of Sale interface for processing transactions
 * TODO: Full implementation with product search, line items, and payment processing
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import salesService from '@/services/sales.service';
import { CreateSaleDto, SaleLineItemDto } from '@/types/api.types';
import { InvoiceType, PaymentMethod, DiscountType } from '@/types/enums';

export default function SalesPage({ params }: { params: { locale: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline, queueTransaction } = useOfflineSync();

  const [lineItems, setLineItems] = useState<SaleLineItemDto[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>(InvoiceType.Touch);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateTotal = () => {
    const subtotal = lineItems.reduce((sum, item) => {
      let discountedPrice = item.unitPrice;
      if (item.discountType === DiscountType.Percentage) {
        discountedPrice = item.unitPrice * (1 - item.discountValue / 100);
      } else if (item.discountType === DiscountType.FixedAmount) {
        discountedPrice = item.unitPrice - item.discountValue;
      }
      return sum + discountedPrice * item.quantity;
    }, 0);

    return subtotal;
  };

  const handleCompleteSale = async () => {
    if (lineItems.length === 0) {
      setError('Please add at least one item to the sale');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const saleData: CreateSaleDto = {
        customerId: undefined,
        invoiceType,
        lineItems,
        paymentMethod,
        paymentReference: undefined,
        notes: undefined,
      };

      if (isOnline) {
        // Process sale online
        const sale = await salesService.createSale(saleData);
        alert(`Sale completed! Transaction ID: ${sale.transactionId}`);
        setLineItems([]);
      } else {
        // Queue for offline sync
        if (!user) throw new Error('User not authenticated');

        await queueTransaction({
          type: 'sale',
          timestamp: new Date(),
          branchId: user.branches[0]?.branchId || '',
          userId: user.id,
          data: saleData,
        });

        alert('Sale queued for sync when online');
        setLineItems([]);
      }
    } catch (err: any) {
      console.error('Failed to complete sale:', err);
      setError(err.message || 'Failed to complete sale');
    } finally {
      setProcessing(false);
    }
  };

  const total = calculateTotal();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-gray-600 mt-1">Process sales transactions</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          ← Back
        </button>
      </div>

      {/* Offline Warning */}
      {!isOnline && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">
            ⚠️ You are offline. Sales will be queued and synced when connection is restored.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Search (Placeholder) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <span className="text-6xl">🔍</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Product Search
            </h3>
            <p className="mt-2 text-gray-600">
              Product search component will be implemented here
            </p>
            <p className="mt-1 text-sm text-gray-500">
              (T093: ProductSearch component)
            </p>
          </div>

          {/* Line Items Display (Placeholder) */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Items ({lineItems.length})
            </h3>

            {lineItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No items added yet
              </div>
            ) : (
              <div className="space-y-2">
                {lineItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">Product {item.productId.substring(0, 8)}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-sm text-gray-500">
              (T094: SaleLineItemsList component)
            </p>
          </div>
        </div>

        {/* Right Column - Payment Section */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment</h3>

            {/* Invoice Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Type
              </label>
              <select
                value={invoiceType}
                onChange={(e) => setInvoiceType(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value={InvoiceType.Touch}>Touch Invoice</option>
                <option value={InvoiceType.Standard}>Standard Invoice</option>
              </select>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value={PaymentMethod.Cash}>Cash</option>
                <option value={PaymentMethod.Card}>Card</option>
                <option value={PaymentMethod.DigitalWallet}>Digital Wallet</option>
              </select>
            </div>

            {/* Total Display */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* Complete Sale Button */}
              <button
                onClick={handleCompleteSale}
                disabled={processing || lineItems.length === 0}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Complete Sale'}
              </button>

              <p className="mt-4 text-xs text-gray-500 text-center">
                (T095: PaymentSection component)
              </p>
            </div>
          </div>

          {/* Development Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="font-medium text-blue-900">🚧 In Development</p>
            <p className="text-blue-700 mt-1">
              This is a placeholder interface. Full implementation includes:
            </p>
            <ul className="mt-2 space-y-1 text-blue-600 text-xs list-disc list-inside">
              <li>Product search and selection (T093)</li>
              <li>Line items management (T094)</li>
              <li>Payment processing (T095)</li>
              <li>Invoice display (T096)</li>
              <li>Offline sync integration (T098-T099)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
