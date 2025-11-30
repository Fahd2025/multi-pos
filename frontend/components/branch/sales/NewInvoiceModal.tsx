/**
 * New Invoice Modal Component
 * Quick invoice creation with barcode scanner and product dropdown
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { ProductDto, CreateSaleDto, SaleDto } from '@/types/api.types';
import { InvoiceType, PaymentMethod, DiscountType } from '@/types/enums';
import inventoryService from '@/services/inventory.service';
import salesService from '@/services/sales.service';
import { SaleLineItem } from './SaleLineItemsList';

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (sale: SaleDto) => void;
}

export default function NewInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
}: NewInvoiceModalProps) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [inputMode, setInputMode] = useState<'barcode' | 'dropdown'>('barcode');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>(InvoiceType.Touch);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setLineItems([]);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputMode === 'barcode') {
      barcodeInputRef.current?.focus();
    }
  }, [isOpen, inputMode]);

  const fetchProducts = async () => {
    try {
      const response = await inventoryService.getProducts({
        isActive: true,
        pageSize: 200,
      });
      setProducts(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products');
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const product = products.find(
      (p) =>
        p.barcode?.toLowerCase() === barcodeInput.toLowerCase() ||
        p.sku.toLowerCase() === barcodeInput.toLowerCase()
    );

    if (product) {
      addProductToCart(product, quantity);
      setBarcodeInput('');
      setQuantity(1);
    } else {
      setError(`Product not found with barcode/SKU: ${barcodeInput}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDropdownAdd = () => {
    if (!selectedProductId) {
      setError('Please select a product');
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (product) {
      addProductToCart(product, quantity);
      setSelectedProductId('');
      setQuantity(1);
    }
  };

  const addProductToCart = (product: ProductDto, qty: number) => {
    const existingIndex = lineItems.findIndex((item) => item.productId === product.id);

    if (existingIndex >= 0) {
      const updatedItems = [...lineItems];
      updatedItems[existingIndex].quantity += qty;
      setLineItems(updatedItems);
    } else {
      const newItem: SaleLineItem = {
        productId: product.id,
        productName: product.nameEn,
        productSku: product.sku,
        quantity: qty,
        unitPrice: product.sellingPrice,
        discountType: DiscountType.None,
        discountValue: 0,
      };
      setLineItems([...lineItems, newItem]);
    }

    setSuccess(`Added ${product.nameEn} to invoice`);
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleRemoveItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    const updatedItems = [...lineItems];
    updatedItems[index].quantity = Math.max(1, newQty);
    setLineItems(updatedItems);
  };

  const calculateTotal = () => {
    const subtotal = lineItems.reduce((sum, item) => {
      return sum + item.unitPrice * item.quantity;
    }, 0);
    const tax = subtotal * 0.15; // 15% tax
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleCreateInvoice = async () => {
    if (lineItems.length === 0) {
      setError('Please add at least one product');
      return;
    }

    try {
      setLoading(true);
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

      const sale = await salesService.createSale(saleData);
      setSuccess(`Invoice created! Transaction ID: ${sale.transactionId}`);

      if (onSuccess) {
        onSuccess(sale);
      }

      // Reset form after 1 second
      setTimeout(() => {
        setLineItems([]);
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create invoice:', err);
      setError(err.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const { subtotal, tax, total } = calculateTotal();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                New Invoice
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Quick invoice creation
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mx-4 md:mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mx-4 md:mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Add Products */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Add Products
                  </h3>

                  {/* Input Mode Toggle */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setInputMode('barcode')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        inputMode === 'barcode'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Barcode Scanner
                    </button>
                    <button
                      onClick={() => setInputMode('dropdown')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        inputMode === 'dropdown'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Product List
                    </button>
                  </div>

                  {/* Barcode Input */}
                  {inputMode === 'barcode' && (
                    <form onSubmit={handleBarcodeSubmit} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Scan or Enter Barcode/SKU
                        </label>
                        <input
                          ref={barcodeInputRef}
                          type="text"
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          placeholder="Scan barcode or enter SKU..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Add to Invoice
                      </button>
                    </form>
                  )}

                  {/* Dropdown Selection */}
                  {inputMode === 'dropdown' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Product
                        </label>
                        <select
                          value={selectedProductId}
                          onChange={(e) => setSelectedProductId(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Choose a product...</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.nameEn} - ${product.sellingPrice.toFixed(2)} (Stock: {product.stockLevel})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <button
                        onClick={handleDropdownAdd}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Add to Invoice
                      </button>
                    </div>
                  )}
                </div>

                {/* Payment Settings */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Payment Details
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={PaymentMethod.Cash}>Cash</option>
                        <option value={PaymentMethod.Card}>Card</option>
                        <option value={PaymentMethod.DigitalWallet}>Digital Wallet</option>
                        <option value={PaymentMethod.BankTransfer}>Bank Transfer</option>
                        <option value={PaymentMethod.Check}>Check</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Invoice Type
                      </label>
                      <select
                        value={invoiceType}
                        onChange={(e) => setInvoiceType(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={InvoiceType.Touch}>Touch Invoice (Simple)</option>
                        <option value={InvoiceType.Standard}>Standard Invoice (Detailed)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Cart Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Items ({lineItems.length})
                </h3>

                {lineItems.length === 0 ? (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <span className="text-4xl">🛒</span>
                    <p className="mt-3 text-gray-600">No items yet</p>
                    <p className="text-sm text-gray-500">Add products to create invoice</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
                      {lineItems.map((item, index) => (
                        <div key={index} className="p-3 bg-white hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.productName}</h4>
                              <p className="text-sm text-gray-600">SKU: {item.productSku}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleUpdateQuantity(index, parseInt(e.target.value) || 1)
                                  }
                                  min="1"
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <span className="text-sm text-gray-600">
                                  × ${item.unitPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-3">
                              <button
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-800 mb-2"
                              >
                                ×
                              </button>
                              <p className="font-semibold text-gray-900">
                                ${(item.unitPrice * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax (15%):</span>
                        <span className="font-medium">${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                        <span>Total:</span>
                        <span className="text-blue-600">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={loading || lineItems.length === 0}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
