/**
 * InvoiceDialog Component
 * Comprehensive invoice creation dialog with full feature set
 * Replaces the simplified NewInvoiceModal with advanced functionality
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  ProductDto,
  CategoryDto,
  CustomerDto,
  CreateSaleDto,
  SaleDto,
} from "@/types/api.types";
import { BranchSettingsDto } from "@/services/branch.service";
import {
  InvoiceType,
  PaymentMethod,
  DiscountType,
  OrderType,
} from "@/types/enums";
import inventoryService from "@/services/inventory.service";
import customerService from "@/services/customer.service";
import salesService from "@/services/sales.service";
import branchService from "@/services/branch.service";
import CustomerFormModal from "@/components/branch/customers/CustomerFormModal";
import { formatCurrency } from "@/lib/utils";

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (sale: SaleDto) => void;
  branchId?: string;
  branchName?: string;
}

interface InvoiceItem {
  productId: string;
  product: ProductDto;
  quantity: number;
  unitPrice: number;
}

export default function InvoiceDialog({
  isOpen,
  onClose,
  onSuccess,
  branchId,
  branchName = "default",
}: InvoiceDialogProps) {
  // Invoice metadata state
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.DineIn);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.Cash
  );
  const [notes, setNotes] = useState("");

  // Product selection state
  const [barcode, setBarcode] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState(1);

  // Invoice items
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  // Financial state
  const [discountType, setDiscountType] = useState<"percentage" | "amount">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);

  // Data
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductDto[]>([]);
  const [branchSettings, setBranchSettings] = useState<BranchSettingsDto | null>(null);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [negativeStockLimit, setNegativeStockLimit] = useState(0);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Customer dialog
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  // Refs
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial data on mount
  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      generateInvoiceNumber();
      setInvoiceDate(new Date());
    }
  }, [isOpen, branchId]);

  // Filter products by category
  useEffect(() => {
    if (selectedCategoryId && selectedCategoryId !== "all") {
      setFilteredProducts(
        products.filter((p) => p.categoryId === selectedCategoryId)
      );
    } else {
      setFilteredProducts(products);
    }
  }, [selectedCategoryId, products]);

  // Auto-focus barcode input
  useEffect(() => {
    if (isOpen && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes, customersRes, settingsRes] =
        await Promise.all([
          inventoryService.getProducts({
            isActive: true,
            pageSize: 500,
          }),
          inventoryService.getCategories(),
          customerService.getCustomers({
            isActive: true,
            pageSize: 500,
          }),
          branchId
            ? branchService.getBranchSettings(branchId)
            : Promise.resolve(null),
        ]);

      setProducts(productsRes.data || []);
      setFilteredProducts(productsRes.data || []);
      setCategories(categoriesRes || []);
      setCustomers(customersRes.data || []);
      setBranchSettings(settingsRes);

      // Set inventory stock settings (default to blocking negative stock for now)
      // TODO: Once backend BranchSettingsDto includes these fields, read from settingsRes
      setAllowNegativeStock(false);
      setNegativeStockLimit(0);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
      // Set fallback empty arrays
      setProducts([]);
      setFilteredProducts([]);
      setCategories([]);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    setInvoiceNumber(`INV-${timestamp}-${random}`);
  };

  const handleBarcodeSearch = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!barcode.trim()) {
      toast.error("Please enter a barcode");
      return;
    }

    const product = products.find(
      (p) =>
        p.barcode?.toLowerCase() === barcode.toLowerCase() ||
        p.sku.toLowerCase() === barcode.toLowerCase()
    );

    if (product) {
      toast.info(`Found: ${product.nameEn} - Stock: ${product.stockLevel}`, {
        duration: 2000,
      });

      // Update dropdowns to reflect scanned product
      setSelectedCategoryId(product.categoryId);
      setSelectedProductId(product.id);

      // Add to invoice
      addProductToInvoice(product);
      setBarcode("");
    } else {
      toast.error(`Product not found: "${barcode.trim()}"`);
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (product) {
      addProductToInvoice(product);
      setSelectedProductId("");
      setItemQuantity(1);
    }
  };

  const addProductToInvoice = (product: ProductDto) => {
    // Stock validation (using state values)

    // Calculate current cart quantity for this product
    const currentCartQty =
      invoiceItems.find((item) => item.productId === product.id)?.quantity ?? 0;
    const newTotalQty = currentCartQty + itemQuantity;

    if (!allowNegativeStock && product.stockLevel < newTotalQty) {
      toast.error(`Insufficient stock. Available: ${product.stockLevel}`);
      return;
    }

    if (allowNegativeStock) {
      const projectedStock = product.stockLevel - newTotalQty;
      if (projectedStock < negativeStockLimit) {
        toast.error(
          `Cannot exceed negative stock limit of ${negativeStockLimit}`
        );
        return;
      }
    }

    // Check if item already exists
    const existingIndex = invoiceItems.findIndex(
      (item) => item.productId === product.id
    );

    if (existingIndex >= 0) {
      // Update quantity
      const updatedItems = [...invoiceItems];
      updatedItems[existingIndex].quantity += itemQuantity;
      setInvoiceItems(updatedItems);
      toast.success(`Updated: ${product.nameEn} (Qty: ${updatedItems[existingIndex].quantity})`);
    } else {
      // Add new item
      const newItem: InvoiceItem = {
        productId: product.id,
        product,
        quantity: itemQuantity,
        unitPrice: product.sellingPrice,
      };
      setInvoiceItems([...invoiceItems, newItem]);
      toast.success(`Added: ${product.nameEn} (Qty: ${itemQuantity})`);
    }
  };

  const updateItemQuantity = (index: number, delta: number) => {
    const updatedItems = [...invoiceItems];
    const newQuantity = updatedItems[index].quantity + delta;

    if (newQuantity < 1) return;

    // Stock validation (using state values)
    const product = updatedItems[index].product;

    if (!allowNegativeStock && product.stockLevel < newQuantity) {
      toast.error("Insufficient stock");
      return;
    }

    if (allowNegativeStock) {
      const projectedStock = product.stockLevel - newQuantity;
      if (projectedStock < negativeStockLimit) {
        toast.error(
          `Cannot exceed negative stock limit of ${negativeStockLimit}`
        );
        return;
      }
    }

    updatedItems[index].quantity = newQuantity;
    setInvoiceItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Derived values from settings
  const currency = branchSettings?.currency ?? "USD";
  const locale = branchSettings?.language === "ar" ? "ar-SA" : "en-US";
  const taxRate = branchSettings?.taxRate ?? 15; // Default 15%

  // Calculate totals
  const calculateTotals = () => {
    // 1. Line items subtotal
    const subtotal = invoiceItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // 2. Invoice-level discount
    const discountAmount =
      discountType === "percentage"
        ? (subtotal * discountValue) / 100
        : discountValue;

    const discountedSubtotal = subtotal - discountAmount;

    // 3. Tax (on discounted subtotal)
    const taxAmount = (discountedSubtotal * taxRate) / 100;

    // 4. Grand total
    const grandTotal = discountedSubtotal + taxAmount;

    // 5. Change
    const change = amountPaid - grandTotal;

    return {
      subtotal,
      discountAmount,
      discountedSubtotal,
      taxRate,
      taxAmount,
      grandTotal,
      change,
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async () => {
    // Validation
    if (invoiceItems.length === 0) {
      toast.error("Please add at least one item to the invoice");
      return;
    }

    if (amountPaid < totals.grandTotal) {
      toast.error("Amount paid is less than the total amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const saleData: CreateSaleDto = {
        customerId: customerId || undefined,
        invoiceType: InvoiceType.Standard,
        orderNumber: invoiceNumber,
        orderType: orderType,
        lineItems: invoiceItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountType: DiscountType.None, // Line-item discounts (not used for now)
          discountValue: 0,
        })),
        paymentMethod: paymentMethod,
        amountPaid: amountPaid,
        changeReturned: totals.change > 0 ? totals.change : 0,
        invoiceDiscountType:
          discountValue > 0
            ? discountType === "percentage"
              ? DiscountType.Percentage
              : DiscountType.FixedAmount
            : DiscountType.None,
        invoiceDiscountValue: discountValue,
        notes: notes || undefined,
      };

      const sale = await salesService.createSale(saleData);
      toast.success(`Invoice created! Transaction ID: ${sale.transactionId}`);

      // Call success callback
      onSuccess?.(sale);

      // Reset form and close
      resetForm();
      onClose();
    } catch (error: any) {
      console.error("Failed to create invoice:", error);
      toast.error(error.message || "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setInvoiceItems([]);
    setCustomerId(null);
    setOrderType(OrderType.DineIn);
    setPaymentMethod(PaymentMethod.Cash);
    setDiscountValue(0);
    setAmountPaid(0);
    setNotes("");
    setBarcode("");
    setSelectedCategoryId("");
    setSelectedProductId("");
    setItemQuantity(1);
    generateInvoiceNumber();
  };

  const handleCustomerCreated = async () => {
    // Refresh customer list
    try {
      const customersRes = await customerService.getCustomers({
        isActive: true,
        pageSize: 500,
      });
      setCustomers(customersRes.data || []);
      toast.success("Customer created successfully");
    } catch (error) {
      console.error("Failed to refresh customers:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Create New Invoice
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Fill in the invoice details and add items
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Invoice Info & Items (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Invoice Header */}
                  <div className="grid grid-cols-2 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                        Invoice Number
                      </label>
                      <input
                        type="text"
                        value={invoiceNumber}
                        readOnly
                        className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono font-semibold text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                        Date & Time
                      </label>
                      <input
                        type="text"
                        value={invoiceDate.toLocaleString()}
                        readOnly
                        className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  {/* Customer Selection */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Customer Information
                      </label>
                      <button
                        type="button"
                        onClick={() => setCustomerDialogOpen(true)}
                        className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        + Add Customer
                      </button>
                    </div>
                    <select
                      value={customerId || ""}
                      onChange={(e) => setCustomerId(e.target.value || null)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Walk-in Customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.nameEn}
                          {customer.phone ? ` - ${customer.phone}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Add Items Section */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-blue-50 dark:bg-blue-950">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
                      Add Items to Invoice
                    </h3>

                    {/* Barcode Scanner */}
                    <form onSubmit={handleBarcodeSearch} className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Scan Barcode
                      </label>
                      <div className="flex gap-2">
                        <input
                          ref={barcodeInputRef}
                          type="text"
                          value={barcode}
                          onChange={(e) => setBarcode(e.target.value)}
                          placeholder="Scan or enter barcode/SKU..."
                          className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                          🔍 Search
                        </button>
                      </div>
                    </form>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-blue-50 dark:bg-blue-950 px-2 text-gray-600 dark:text-gray-400">
                          Or select manually
                        </span>
                      </div>
                    </div>

                    {/* Manual Product Selection */}
                    <div className="grid grid-cols-5 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Category
                        </label>
                        <select
                          value={selectedCategoryId}
                          onChange={(e) => setSelectedCategoryId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">All Categories</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.nameEn}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Product
                        </label>
                        <select
                          value={selectedProductId}
                          onChange={(e) => setSelectedProductId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select product</option>
                          {filteredProducts.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.nameEn} - {formatCurrency(product.sellingPrice, currency, locale)} (Stock:{" "}
                              {product.stockLevel})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={itemQuantity}
                          onChange={(e) =>
                            setItemQuantity(parseInt(e.target.value) || 1)
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={!selectedProductId}
                      className="w-full mt-4 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      + Add Item to Invoice
                    </button>
                  </div>

                  {/* Invoice Items Table */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-900 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Invoice Items ({invoiceItems.reduce((sum, item) => sum + item.quantity, 0)} items)
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                              #
                            </th>
                            <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Product
                            </th>
                            <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Price
                            </th>
                            <th className="text-center p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Quantity
                            </th>
                            <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Total
                            </th>
                            <th className="text-center p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceItems.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="text-center p-8 text-gray-500 dark:text-gray-400"
                              >
                                No items added yet. Add items using the form above.
                              </td>
                            </tr>
                          ) : (
                            invoiceItems.map((item, index) => (
                              <tr
                                key={`${item.productId}-${index}`}
                                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <td className="p-3 text-sm text-gray-900 dark:text-gray-100">
                                  {index + 1}
                                </td>
                                <td className="p-3">
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {item.product.nameEn}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    SKU: {item.product.sku}
                                  </p>
                                </td>
                                <td className="p-3 text-right text-sm text-gray-900 dark:text-gray-100">
                                  {formatCurrency(item.unitPrice, currency, locale)}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => updateItemQuantity(index, -1)}
                                      disabled={item.quantity <= 1}
                                      className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                                    >
                                      −
                                    </button>
                                    <span className="w-12 text-center font-medium text-gray-900 dark:text-gray-100">
                                      {item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateItemQuantity(index, 1)}
                                      className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="p-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                                  {formatCurrency(item.unitPrice * item.quantity, currency, locale)}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-bold"
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Column - Summary & Payment (1/3 width) */}
                <div className="space-y-6">
                  {/* Order Type & Payment Method */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Order Type
                      </label>
                      <select
                        value={orderType}
                        onChange={(e) => setOrderType(parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={OrderType.DineIn}>Dine-in</option>
                        <option value={OrderType.Takeout}>Takeout</option>
                        <option value={OrderType.Delivery}>Delivery</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) =>
                          setPaymentMethod(parseInt(e.target.value))
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={PaymentMethod.Cash}>Cash</option>
                        <option value={PaymentMethod.Card}>Card</option>
                        <option value={PaymentMethod.DigitalWallet}>
                          Digital Wallet
                        </option>
                        <option value={PaymentMethod.BankTransfer}>
                          Bank Transfer
                        </option>
                        <option value={PaymentMethod.Check}>Check</option>
                      </select>
                    </div>
                  </div>

                  {/* Invoice Summary */}
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
                      Invoice Summary
                    </h3>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Subtotal:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(totals.subtotal, currency, locale)}
                        </span>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Discount
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={discountType}
                            onChange={(e) =>
                              setDiscountType(e.target.value as "percentage" | "amount")
                            }
                            className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="percentage">%</option>
                            <option value="amount">$</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={discountValue}
                            onChange={(e) =>
                              setDiscountValue(parseFloat(e.target.value) || 0)
                            }
                            placeholder="0.00"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                          <span>Discount Amount:</span>
                          <span className="font-semibold">
                            -{formatCurrency(totals.discountAmount, currency, locale)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm pt-2 border-t border-gray-300 dark:border-gray-600">
                        <span className="text-gray-600 dark:text-gray-400">
                          Tax ({totals.taxRate}%):
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(totals.taxAmount, currency, locale)}
                        </span>
                      </div>

                      <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-gray-400 dark:border-gray-500">
                        <span className="text-gray-900 dark:text-gray-100">Total Amount:</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {formatCurrency(totals.grandTotal, currency, locale)}
                        </span>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-gray-300 dark:border-gray-600">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Amount Paid
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={amountPaid}
                          onChange={(e) =>
                            setAmountPaid(parseFloat(e.target.value) || 0)
                          }
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-lg font-semibold rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {amountPaid > 0 && (
                        <div
                          className={`flex justify-between text-sm p-3 rounded ${
                            totals.change >= 0
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                          }`}
                        >
                          <span className="font-medium">Change:</span>
                          <span className="font-bold">
                            {totals.change >= 0
                              ? formatCurrency(totals.change, currency, locale)
                              : `Insufficient (${formatCurrency(Math.abs(totals.change), currency, locale)} short)`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notes (Optional)
                    </label>
                    <textarea
                      className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add any notes for this invoice..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={handleSubmit}
                      disabled={
                        isSubmitting ||
                        invoiceItems.length === 0 ||
                        amountPaid < totals.grandTotal
                      }
                      className="w-full h-12 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Processing..." : "Finalize Invoice"}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Add Dialog */}
      <CustomerFormModal
        isOpen={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        onSuccess={handleCustomerCreated}
        branchName={branchName}
      />
    </>
  );
}
