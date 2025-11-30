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
import MobileCart from '@/components/sales/pos/MobileCart';
import MobileCartBar from '@/components/sales/pos/MobileCartBar';
import CheckoutDialog from '@/components/sales/pos/CheckoutDialog';
import InvoiceDisplay from '@/components/sales/InvoiceDisplay';
import { CreateSaleDto, ProductDto, SaleDto } from '@/types/api.types';
import { InvoiceType, PaymentMethod, DiscountType } from '@/types/enums';
import { SaleLineItem } from '@/components/sales/SaleLineItemsList';

export default function POSPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const { user, branch } = useAuth();
  const { isOnline, queueTransaction } = useOfflineSync();

  // Layout state
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'top'>('left');
  const [showSettings, setShowSettings] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(true);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Cart state
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdatedItemIndex, setLastUpdatedItemIndex] = useState<number | undefined>(undefined);

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
      // Update existing item quantity
      const updatedItems = [...lineItems];
      updatedItems[existingIndex].quantity += 1;
      setLineItems(updatedItems);
      setLastUpdatedItemIndex(existingIndex);
    } else {
      // Build product image URL using current branch context
      const productImage = product.images && product.images.length > 0 && branch
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/v1/images/${branch.branchCode}/products/${product.images[0].imagePath}/thumb?productId=${product.id}`
        : undefined;

      const newItem: SaleLineItem = {
        productId: product.id,
        productName: product.nameEn,
        productSku: product.sku,
        quantity: 1,
        unitPrice: product.sellingPrice,
        discountType: DiscountType.None,
        discountValue: 0,
        productImage,
      };
      setLineItems([...lineItems, newItem]);
      setLastUpdatedItemIndex(undefined); // New item will scroll to bottom
    }
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const updatedItems = [...lineItems];
    updatedItems[index].quantity = Math.max(1, quantity);
    setLineItems(updatedItems);
    setLastUpdatedItemIndex(index);
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
        // Auto-collapse cart after successful order
        setIsCartVisible(false);
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
        // Auto-collapse cart after successful order
        setIsCartVisible(false);
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
      <div className="bg-white border-b border-gray-200 shadow-sm z-10 sticky top-0">
        {/* Main Header Row */}
        <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3">
          {/* Left: Back Button + Title */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <button
              onClick={() => router.push('/branch/sales')}
              className="
                p-2 sm:p-3
                text-gray-600
                hover:text-gray-900
                hover:bg-gray-100
                rounded-lg
                transition-all
                touch-manipulation
                active:scale-95
                min-w-touch-target min-h-touch-target
                flex items-center justify-center
              "
              aria-label="Go back to sales"
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Point of Sale</h1>
              <p className="text-xs text-gray-600">
                {isOnline ? '🟢 Online' : '🔴 Offline'}
              </p>
            </div>
          </div>

          {/* Center: Search Bar (Desktop only) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="
                w-full
                px-4 py-2.5
                border-2 border-gray-300
                rounded-xl
                focus:ring-4 focus:ring-blue-200
                focus:border-blue-500
                transition-all
                text-base
              "
              aria-label="Search products"
            />
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Shopping Cart Toggle (Desktop only - hidden on mobile) */}
            <button
              onClick={() => setIsCartVisible(!isCartVisible)}
              className="
                hidden md:flex
                relative p-2 sm:p-3
                text-gray-600
                hover:text-gray-900
                hover:bg-gray-100
                rounded-lg
                transition-all
                touch-manipulation
                active:scale-95
                min-w-touch-target min-h-touch-target
                items-center justify-center
              "
              title={isCartVisible ? 'Hide cart' : 'Show cart'}
              aria-label={`${isCartVisible ? 'Hide' : 'Show'} shopping cart`}
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {lineItems.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1"
                  aria-label={`${lineItems.reduce((sum, item) => sum + item.quantity, 0)} items in cart`}
                >
                  {lineItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="
                p-2 sm:p-3
                text-gray-600
                hover:text-gray-900
                hover:bg-gray-100
                rounded-lg
                transition-all
                touch-manipulation
                active:scale-95
                min-w-touch-target min-h-touch-target
                flex items-center justify-center
              "
              aria-label={`${showSettings ? 'Hide' : 'Show'} settings`}
            >
              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Search Row */}
        <div className="block md:hidden px-3 pb-3">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="
              w-full
              px-4 py-3
              border-2 border-gray-300
              rounded-xl
              focus:ring-4 focus:ring-blue-200
              focus:border-blue-500
              transition-all
              text-base
            "
            aria-label="Search products"
          />
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
          <div className="h-full flex relative">
            {/* Category Sidebar - Desktop */}
            <div
              className={`hidden md:block bg-gray-50 border-r border-gray-200 overflow-y-auto transition-all duration-300 ${
                isSidebarCollapsed ? 'w-0' : 'w-64'
              }`}
            >
              {!isSidebarCollapsed && (
                <CategorySidebar
                  selectedCategoryId={selectedCategoryId}
                  onCategorySelect={setSelectedCategoryId}
                  isHorizontal={false}
                />
              )}
            </div>

            {/* Sidebar Toggle Button - Desktop */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex absolute left-0 top-4 z-10 bg-white border border-gray-300 rounded-r-lg px-2 py-3 shadow-md hover:bg-gray-50 transition-all items-center justify-center"
              style={{ left: isSidebarCollapsed ? '0' : '256px' }}
              title={isSidebarCollapsed ? 'Show categories' : 'Hide categories'}
            >
              <svg
                className={`w-4 h-4 text-gray-600 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Mobile Category Button */}
            <button
              onClick={() => setIsMobileCategoryOpen(true)}
              className="md:hidden fixed bottom-6 left-6 z-20 bg-blue-600 text-white rounded-full p-5 shadow-lg hover:bg-blue-700 transition-all active:scale-95 touch-manipulation min-w-[64px] min-h-[64px] flex items-center justify-center"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Mobile Category Sidebar */}
            {isMobileCategoryOpen && (
              <>
                <div
                  className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                  onClick={() => setIsMobileCategoryOpen(false)}
                />
                <div className="md:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl z-40 overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Categories</h2>
                    <button
                      onClick={() => setIsMobileCategoryOpen(false)}
                      className="p-3 hover:bg-gray-100 rounded-lg transition-all touch-manipulation active:scale-95 min-w-[48px] min-h-[48px] flex items-center justify-center"
                    >
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div
                    onClick={() => setIsMobileCategoryOpen(false)}
                  >
                    <CategorySidebar
                      selectedCategoryId={selectedCategoryId}
                      onCategorySelect={setSelectedCategoryId}
                      isHorizontal={false}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <ProductGrid
                selectedCategoryId={selectedCategoryId}
                searchQuery={searchQuery}
                onProductSelect={handleProductSelect}
              />
            </div>

            {/* Shopping Cart */}
            {isCartVisible && (
              <div className="hidden md:block w-96 animate-slideIn">
                <ShoppingCart
                  items={lineItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onCheckout={handleCheckout}
                  onClearCart={handleClearCart}
                  lastUpdatedIndex={lastUpdatedItemIndex}
                />
              </div>
            )}
          </div>
        ) : (
          /* Top Bar Layout */
          <div className="h-full flex flex-col relative">
            {/* Category Top Bar */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 overflow-x-auto">
              <CategorySidebar
                selectedCategoryId={selectedCategoryId}
                onCategorySelect={setSelectedCategoryId}
                isHorizontal={true}
              />
            </div>

            {/* Mobile Category Button */}
            <button
              onClick={() => setIsMobileCategoryOpen(true)}
              className="md:hidden fixed bottom-6 left-6 z-20 bg-blue-600 text-white rounded-full p-5 shadow-lg hover:bg-blue-700 transition-all active:scale-95 touch-manipulation min-w-[64px] min-h-[64px] flex items-center justify-center"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Mobile Category Sidebar */}
            {isMobileCategoryOpen && (
              <>
                <div
                  className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                  onClick={() => setIsMobileCategoryOpen(false)}
                />
                <div className="md:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl z-40 overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Categories</h2>
                    <button
                      onClick={() => setIsMobileCategoryOpen(false)}
                      className="p-3 hover:bg-gray-100 rounded-lg transition-all touch-manipulation active:scale-95 min-w-[48px] min-h-[48px] flex items-center justify-center"
                    >
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div
                    onClick={() => setIsMobileCategoryOpen(false)}
                  >
                    <CategorySidebar
                      selectedCategoryId={selectedCategoryId}
                      onCategorySelect={setSelectedCategoryId}
                      isHorizontal={false}
                    />
                  </div>
                </div>
              </>
            )}

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
              {isCartVisible && (
                <div className="hidden md:block w-96 animate-slideIn">
                  <ShoppingCart
                    items={lineItems}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onCheckout={handleCheckout}
                    onClearCart={handleClearCart}
                    lastUpdatedIndex={lastUpdatedItemIndex}
                  />
                </div>
              )}
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

      {/* Mobile Cart Bottom Bar */}
      <MobileCartBar
        items={lineItems}
        onClick={() => setIsMobileCartOpen(true)}
      />

      {/* Mobile Cart Sheet */}
      <MobileCart
        isOpen={isMobileCartOpen}
        onClose={() => setIsMobileCartOpen(false)}
        items={lineItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        onClearCart={handleClearCart}
        lastUpdatedIndex={lastUpdatedItemIndex}
      />
    </div>
  );
}
