"use client";

import { useState, useEffect, useRef } from "react";
import { ProductDto, CustomerDto, CreateSaleDto, SaleDto, CategoryDto } from "@/types/api.types";
import { InvoiceType, PaymentMethod, DiscountType } from "@/types/enums";
import inventoryService from "@/services/inventory.service";
import customerService from "@/services/customer.service";
import salesService from "@/services/sales.service";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Select } from "@/components/shared/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { Label } from "@/components/shared/label";
import { Textarea } from "@/components/shared/textarea";
import { Trash2, Plus, Scan, X, UserPlus, ChevronDown } from "lucide-react";

interface CreateSalesInvoiceFormProps {
  onCancel: () => void;
  onSuccess: (sale: SaleDto) => void;
}

interface InvoiceLineItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
  vatRate: number; // 0.15
}

export default function CreateSalesInvoiceForm({
  onCancel,
  onSuccess,
}: CreateSalesInvoiceFormProps) {
  // Loading states
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Data sources
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [customers, setCustomers] = useState<CustomerDto[]>([]);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState(""); // Optional manual override or display
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 16));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Product Addition Section
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [addQuantity, setAddQuantity] = useState(1);

  // Invoice Items
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);

  // Side Panel Options
  const [orderType, setOrderType] = useState<string>("Dine-in");
  const [paymentMethod, setPaymentMethod] = useState<number>(PaymentMethod.Cash);

  // Summary
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState("");

  // Refs
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Initial Data Fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setProductsLoading(true);
      setCustomersLoading(true);

      const [productsRes, categoriesRes, customersRes] = await Promise.all([
        inventoryService.getProducts({ isActive: true, pageSize: 1000 }),
        inventoryService.getCategories(),
        customerService.getCustomers({ isActive: true, pageSize: 1000 }),
      ]);

      setProducts(productsRes.data || []);
      setCategories(categoriesRes || []);
      setCustomers(customersRes.data || []);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setProductsLoading(false);
      setCustomersLoading(false);
    }
  };

  // Product Addition Logic
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!barcodeInput.trim()) return;

    const product = products.find((p) => p.barcode === barcodeInput || p.sku === barcodeInput);

    if (product) {
      addProductToInvoice(product, addQuantity);
      setBarcodeInput("");
      setAddQuantity(1);
    } else {
      alert("Product not found");
    }
  };

  const handleManualAdd = () => {
    if (!selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (product) {
      addProductToInvoice(product, addQuantity);
      setSelectedProductId("");
      setAddQuantity(1);
    }
  };

  const addProductToInvoice = (product: ProductDto, qty: number) => {
    setLineItems((prev) => {
      const existing = prev.findIndex((item) => item.productId === product.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].quantity += qty;
        return updated;
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.nameEn,
          productSku: product.sku,
          quantity: qty,
          unitPrice: product.sellingPrice,
          discountType: DiscountType.None,
          discountValue: 0,
          vatRate: 0.15,
        },
      ];
    });
  };

  // Table Actions
  const updateQuantity = (index: number, delta: number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty > 0) {
        updated[index].quantity = newQty;
      }
      return updated;
    });
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  let discountAmount = 0;
  if (discountType === "percent") {
    discountAmount = (subtotal * discountValue) / 100;
  } else {
    discountAmount = discountValue;
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const totalVat = taxableAmount * 0.15;
  const totalAmount = taxableAmount + totalVat;
  const changeAmount = amountPaid - totalAmount;

  // Submit
  const handleFinishInvoice = async () => {
    if (lineItems.length === 0) {
      alert("Please add at least one product.");
      return;
    }

    try {
      setLoading(true);
      const saleData: CreateSaleDto = {
        customerId: selectedCustomerId || undefined,
        invoiceType: InvoiceType.Standard,
        paymentMethod: paymentMethod,
        notes: `Order Type: ${orderType}\n${notes}`,
        lineItems: lineItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountType: item.discountType,
          discountValue: item.discountValue,
        })),
      };

      const result = await salesService.createSale(saleData);
      onSuccess(result);
    } catch (error) {
      console.error("Failed to create invoice", error);
      alert("Failed to create invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Options
  const customerOptions = [
    { value: "", label: "Select customer (optional)" },
    ...customers.map((c) => ({
      value: c.id,
      label: `${c.nameEn} ${c.phone ? `(${c.phone})` : ""}`,
    })),
  ];

  const filteredProducts = selectedCategoryId
    ? products.filter((p) => p.categoryId === selectedCategoryId)
    : products;

  const productOptions = [
    { value: "", label: "Select product" },
    ...filteredProducts.map((p) => ({ value: p.id, label: `${p.nameEn} ($${p.sellingPrice})` })),
  ];

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((c) => ({ value: c.id, label: c.nameEn })),
  ];

  const orderTypeOptions = [
    { value: "Dine-in", label: "Dine-in" },
    { value: "Takeout", label: "Takeout" },
    { value: "Delivery", label: "Delivery" },
    { value: "Drive-thru", label: "Drive-thru" },
  ];

  const paymentMethodOptions = [
    { value: PaymentMethod.Cash, label: "Cash" },
    { value: PaymentMethod.Card, label: "Card" },
    { value: PaymentMethod.DigitalWallet, label: "Digital Wallet" },
    { value: PaymentMethod.BankTransfer, label: "Bank Transfer" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Create New Invoice
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Fill in the invoice details and add items to create a new sale
          </p>
        </div>
        <Button onClick={onCancel} variant="secondary">
          ← Back to Sales
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (Left 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Header Info: Invoice Details and Customer */}
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Invoice Number
                    </Label>
                    <Input
                      placeholder="Auto-generated"
                      value={invoiceNumber}
                      className="bg-gray-50 border-gray-200"
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </Label>
                    <Input
                      type="datetime-local"
                      value={invoiceDate}
                      className="bg-gray-50 border-gray-200"
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-bold text-gray-900">Customer Information</Label>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<UserPlus className="w-4 h-4" />}
                    >
                      Add Customer
                    </Button>
                  </div>
                  <Select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    options={customerOptions}
                    className="w-full bg-gray-50 border-gray-200"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. Add Items Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Add Items to Invoice</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Scan */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500">Scan Barcode</Label>
                <div className="flex gap-2">
                  <Input
                    ref={barcodeInputRef}
                    placeholder="Scan or enter barcode..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBarcodeSubmit()}
                    className="bg-gray-50 border-gray-200"
                  />
                  <Button
                    onClick={(e) => handleBarcodeSubmit(e)}
                    className="w-12 px-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700"
                  >
                    <Scan className="w-5 h-5 text-white" />
                  </Button>
                </div>
              </div>

              {/* Separator */}
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-semibold uppercase">
                  Or Select Manually
                </span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* Manual Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4 space-y-2">
                  <Label className="text-xs font-semibold text-gray-500">Category</Label>
                  <Select
                    value={selectedCategoryId}
                    onChange={(e) => {
                      setSelectedCategoryId(e.target.value);
                      setSelectedProductId(""); // Reset product when category changes
                    }}
                    options={categoryOptions}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <div className="md:col-span-6 space-y-2">
                  <Label className="text-xs font-semibold text-gray-500">Product</Label>
                  <Select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    options={productOptions}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs font-semibold text-gray-500">Quantity</Label>
                  <div className="flex items-center">
                    <Input
                      type="number"
                      min="1"
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                      className="bg-gray-50 border-gray-200 text-center"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleManualAdd}
                disabled={!selectedProductId}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6 text-base font-semibold shadow-sm"
                leftIcon={<Plus className="w-5 h-5" />}
              >
                Add Item to Invoice
              </Button>
            </CardContent>
          </Card>

          {/* 4. Invoice Items Table */}
          <Card className="overflow-hidden border border-gray-200 shadow-none">
            <CardHeader className="bg-gray-50 border-b border-gray-100 py-4">
              <CardTitle className="text-base font-bold text-gray-800">
                Invoice Items ({lineItems.length} items)
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">#</th>
                    <th className="px-6 py-4 font-semibold">Product</th>
                    <th className="px-6 py-4 font-semibold">Price</th>
                    <th className="px-6 py-4 font-semibold">Quantity</th>
                    <th className="px-6 py-4 font-semibold">VAT (15%)</th>
                    <th className="px-6 py-4 font-semibold text-right">Total</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        No items added yet.
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item, index) => {
                      const lineTotal = item.unitPrice * item.quantity;
                      const vat = lineTotal * item.vatRate;
                      const totalWithVat = lineTotal + vat;

                      return (
                        <tr key={index} className="bg-white hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{item.productName}</div>
                            <div className="text-xs text-gray-400">{item.productSku}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">${item.unitPrice.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQuantity(index, -1)}
                                className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(index, 1)}
                                className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">${vat.toFixed(2)}</td>
                          <td className="px-6 py-4 font-bold text-gray-900 text-right">
                            ${totalWithVat.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => removeLineItem(index)}
                              className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Side Panel (Right 1/3) */}
        <div className="space-y-6">
          {/* 5. Sidebar Options */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Order Type</Label>
              <Select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                options={orderTypeOptions}
                className="bg-white border-gray-200 p-3"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-sm">Payment Method</Label>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(parseInt(e.target.value))}
                options={paymentMethodOptions}
                className="bg-white border-gray-200 p-3"
              />
            </div>
          </div>

          {/* 6. Summary Section */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-white border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-bold">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">
                  Subtotal ({lineItems.length} items):
                </span>
                <span className="font-bold text-gray-900">${subtotal.toFixed(2)}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Discount</Label>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-24">
                    <select
                      className="w-full h-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as "fixed" | "percent")}
                    >
                      <option value="fixed">$</option>
                      <option value="percent">%</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="bg-white border-gray-200"
                  />
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-500 font-medium mt-1">
                    <span>Discount Amount:</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">VAT (15%):</span>
                <span className="font-bold text-gray-900">${totalVat.toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-black text-blue-600">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="font-bold text-sm">Amount Paid</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="bg-gray-50 border-gray-200 text-lg"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-100">
                <span className="font-bold text-green-800">Change:</span>
                <span
                  className={`font-black text-xl ${
                    changeAmount < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  ${changeAmount > 0 ? changeAmount.toFixed(2) : "0.00"}
                </span>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Label className="text-sm font-semibold mb-2 block">Notes (Optional)</Label>
                <Textarea
                  placeholder="Add any notes for this invoice..."
                  className="h-24 bg-white border-gray-200 text-gray-600"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons - Moved to bottom of right column */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleFinishInvoice}
              disabled={loading || lineItems.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 shadow-md"
            >
              Finalize Invoice
            </Button>
            <Button
              onClick={onCancel}
              disabled={loading}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
