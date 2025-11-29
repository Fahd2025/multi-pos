/**
 * Point of Sale Page
 * Full POS interface for processing transactions with offline support
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import salesService from '@/services/sales.service';
import ProductSearch from '@/components/sales/ProductSearch';
import SaleLineItemsList, { SaleLineItem } from '@/components/sales/SaleLineItemsList';
import PaymentSection from '@/components/sales/PaymentSection';
import InvoiceDisplay from '@/components/sales/InvoiceDisplay';
import { CreateSaleDto, ProductDto, SaleDto } from '@/types/api.types';
import { InvoiceType, PaymentMethod, DiscountType } from '@/types/enums';

export default function POSPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline, queueTransaction } = useOfflineSync();

  const [lineItems, setLineItems] = useState<SaleLineItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<SaleDto | null>(null);

  // Default tax rate (should come from branch settings in production)
  const TAX_RATE = 15;

  const handleProductSelect = (product: ProductDto) => {
    // Check if product already in cart
    const existingIndex = lineItems.findIndex((item) => item.productId === product.id);

    if (existingIndex >= 0) {
      // Increase quantity if already in cart
      const updatedItems = [...lineItems];
      updatedItems[existingIndex].quantity += 1;
      setLineItems(updatedItems);
    } else {
      // Add new item to cart
      const newItem: SaleLineItem = {
        productId: product.id,
        productName: product.nameEn,
        productSku: product.sku,
        quantity: 1,
        unitPrice: product.sellingPrice,
        discountType: DiscountType.None,
        discountValue: 0,
      };
      setLineItems([...lineItems, newItem]);
    }

    setError(null);
    setSuccess(`Added ${product.nameEn} to cart`);
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const updatedItems = [...lineItems];
    updatedItems[index].quantity = Math.max(1, quantity);
    setLineItems(updatedItems);
  };

  const handleUpdateDiscount = (
    index: number,
    discountType: DiscountType,
    discountValue: number
  ) => {
    const updatedItems = [...lineItems];
    updatedItems[index].discountType = discountType;
    updatedItems[index].discountValue = discountValue;
    setLineItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = (): number => {
    return lineItems.reduce((sum, item) => {
      let discountedPrice = item.unitPrice;

      if (item.discountType === DiscountType.Percentage) {
        discountedPrice = item.unitPrice * (1 - item.discountValue / 100);
      } else if (item.discountType === DiscountType.FixedAmount) {
        discountedPrice = item.unitPrice - item.discountValue;
      }

      return sum + discountedPrice * item.quantity;
    }, 0);
  };

  const handleCompleteSale = async (
    paymentMethod: PaymentMethod,
    invoiceType: InvoiceType,
    paymentReference?: string
  ) => {
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
        lineItems: lineItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountType: item.discountType,
          discountValue: item.discountValue,
        })),
        paymentMethod,
        paymentReference,
        notes: undefined,
      };

      if (isOnline) {
        // Process sale online
        const sale = await salesService.createSale(saleData);
        setCompletedSale(sale);
        setSuccess(`Sale completed! Transaction ID: ${sale.transactionId}`);
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

        setSuccess('Sale queued for sync when online');
        setLineItems([]);
      }
    } catch (err: any) {
      console.error('Failed to complete sale:', err);
      setError(err.message || 'Failed to complete sale');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseInvoice = () => {
    setCompletedSale(null);
  };

  const subtotal = calculateSubtotal();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Point of Sale</h1>
            <p className="text-gray-600 mt-1">Process sales transactions</p>
          </div>
          <button
            onClick={() => router.push('/branch/sales')}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            ← Back to Sales
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

        {/* Success Display */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product Search & Line Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Search */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Search Products
              </h3>
              <ProductSearch onProductSelect={handleProductSelect} />
            </div>

            {/* Line Items List */}
            <SaleLineItemsList
              items={lineItems}
              onUpdateQuantity={handleUpdateQuantity}
              onUpdateDiscount={handleUpdateDiscount}
              onRemoveItem={handleRemoveItem}
            />
          </div>

          {/* Right Column - Payment Section */}
          <div>
            <PaymentSection
              subtotal={subtotal}
              taxRate={TAX_RATE}
              onCompleteSale={handleCompleteSale}
              processing={processing}
              isOnline={isOnline}
            />
          </div>
        </div>

        {/* Invoice Display Modal */}
        {completedSale && (
          <InvoiceDisplay
            sale={completedSale}
            onClose={handleCloseInvoice}
            onPrint={() => {
              salesService.printInvoice(completedSale.id).catch(console.error);
            }}
          />
        )}
      </div>
    </div>
  );
}
