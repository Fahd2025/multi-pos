/**
 * Point of Sale Page
 * Full-page POS interface with category sidebar, product grid, and shopping cart
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import salesService from '@/services/sales.service';
import CategorySidebar from '@/components/sales/pos/CategorySidebar';
import ProductGrid from '@/components/sales/pos/ProductGrid';
import ShoppingCart from '@/components/sales/pos/ShoppingCart';
import CheckoutDialog from '@/components/sales/pos/CheckoutDialog';
import InvoiceDisplay from '@/components/sales/InvoiceDisplay';
import { CreateSaleDto, ProductDto, SaleDto } from '@/types/api.types';
import { InvoiceType, PaymentMethod, DiscountType } from '@/types/enums';
import { SaleLineItem } from '@/components/sales/SaleLineItemsList';

export default function POSPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline, queueTransaction } = useOfflineSync();

  // Layout state
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'top'>('left');
  const [showSettings, setShowSettings] = useState(false);

  // Cart state
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleDto | null>(null);

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleProductSelect = (product: ProductDto) => {
    const existingIndex = lineItems.findIndex((item) => item.productId === product.id);

    if (existingIndex >= 0) {
      const updatedItems = [...lineItems];
      updatedItems[existingIndex].quantity += 1;
      setLineItems(updatedItems);
    } else {
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

    setSuccess(`Added ${product.nameEn} to cart`);
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const updatedItems = [...lineItems];
    updatedItems[index].quantity = Math.max(1, quantity);
    setLineItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear the cart?')) {
      setLineItems([]);
    }
  };

  const handleCheckout = () => {
    if (lineItems.length === 0) {
      setError('Cart is empty');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setShowCheckoutDialog(true);
  };

  const handleConfirmCheckout = async (
    invoiceType: InvoiceType,
    paymentMethod: PaymentMethod
  ) => {
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
        paymentReference: undefined,
        notes: undefined,
      };

      if (isOnline) {
        const sale = await salesService.createSale(saleData);
        setCompletedSale(sale);
        setSuccess(`Sale completed! Transaction ID: ${sale.transactionId}`);
        setLineItems([]);
        setShowCheckoutDialog(false);
        setShowInvoiceDialog(true);
      } else {
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
        setShowCheckoutDialog(false);
      }
    } catch (err: any) {
      console.error('Failed to complete sale:', err);
      setError(err.message || 'Failed to complete sale');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseInvoice = () => {
    setShowInvoiceDialog(false);
    setCompletedSale(null);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/branch/sales')}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Point of Sale</h1>
              <p className="text-xs text-gray-600">
                {isOnline ? '🟢 Online' : '🔴 Offline'}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Sidebar Position
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSidebarPosition('left')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    sidebarPosition === 'left'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Left Sidebar
                </button>
                <button
                  onClick={() => setSidebarPosition('top')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    sidebarPosition === 'top'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Top Bar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="border-t border-red-200 bg-red-50 px-4 py-2">
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="border-t border-green-200 bg-green-50 px-4 py-2">
            <p className="text-sm text-green-800 font-medium">{success}</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {sidebarPosition === 'left' ? (
          /* Left Sidebar Layout */
          <div className="h-full flex">
            {/* Category Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
              <CategorySidebar
                selectedCategoryId={selectedCategoryId}
                onCategorySelect={setSelectedCategoryId}
                isHorizontal={false}
              />
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <ProductGrid
                selectedCategoryId={selectedCategoryId}
                searchQuery={searchQuery}
                onProductSelect={handleProductSelect}
              />
            </div>

            {/* Shopping Cart */}
            <div className="w-96">
              <ShoppingCart
                items={lineItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
                onClearCart={handleClearCart}
              />
            </div>
          </div>
        ) : (
          /* Top Bar Layout */
          <div className="h-full flex flex-col">
            {/* Category Top Bar */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 overflow-x-auto">
              <CategorySidebar
                selectedCategoryId={selectedCategoryId}
                onCategorySelect={setSelectedCategoryId}
                isHorizontal={true}
              />
            </div>

            {/* Product Grid & Cart */}
            <div className="flex-1 overflow-hidden flex">
              {/* Product Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <ProductGrid
                  selectedCategoryId={selectedCategoryId}
                  searchQuery={searchQuery}
                  onProductSelect={handleProductSelect}
                />
              </div>

              {/* Shopping Cart */}
              <div className="w-96">
                <ShoppingCart
                  items={lineItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onCheckout={handleCheckout}
                  onClearCart={handleClearCart}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      <CheckoutDialog
        isOpen={showCheckoutDialog}
        onClose={() => setShowCheckoutDialog(false)}
        items={lineItems}
        onConfirmCheckout={handleConfirmCheckout}
        processing={processing}
      />

      {/* Invoice Display */}
      {completedSale && showInvoiceDialog && (
        <InvoiceDisplay
          sale={completedSale}
          onClose={handleCloseInvoice}
          onPrint={() => {
            salesService.printInvoice(completedSale.id).catch(console.error);
          }}
        />
      )}
    </div>
  );
}
