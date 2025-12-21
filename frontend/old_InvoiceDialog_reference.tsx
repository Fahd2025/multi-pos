"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Plus, Minus, Search, Scan, UserPlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerAddDialog } from "./CustomerAddDialog";
import { useBranchContext } from '@/hooks/useBranchContext';
import { formatBranchCurrency } from '@/lib/currency';

interface Product {
  id: number;
  sku: string;
  barcode: string | null;
  name: string;
  nameAr: string | null;
  sellingPrice: number;
  quantity: number;
  category: {
    id: number;
    name: string;
    image?: string | null;
  };
}

interface Category {
  id: number;
  name: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface InvoiceItem {
  productId: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxAmount: number;
  total: number;
}

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InvoiceDialog({
  open,
  onOpenChange,
  onSuccess,
}: InvoiceDialogProps) {
  const { data: session } = useSession();
  const { currency } = useBranchContext();
  const branchId = session?.user?.branchId || 0;

  // Invoice state
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [orderType, setOrderType] = useState("dine-in");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  // Item selection state
  const [barcode, setBarcode] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState(1);

  // Invoice items
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  // Discount and payment
  const [discountType, setDiscountType] = useState<"percentage" | "amount">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [taxRate, setTaxRate] = useState(15); // Default 15% VAT

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Customer dialog
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  // Negative Stock Settings
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [negativeStockLimit, setNegativeStockLimit] = useState(-10);

  // Fetch data on mount
  useEffect(() => {
    if (open) {
      fetchInitialData();
      generateInvoiceNumber();
    }
  }, [open, branchId]);

  // Filter products by category
  useEffect(() => {
    if (selectedCategoryId && selectedCategoryId !== "all") {
      setFilteredProducts(
        products.filter((p) => p.category?.id === parseInt(selectedCategoryId))
      );
    } else {
      setFilteredProducts(products);
    }
  }, [selectedCategoryId, products]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes, customersRes, settingsRes] =
        await Promise.all([
          fetch("/api/branch/products", {
            headers: { "x-branch-id": branchId.toString() },
          }),
          fetch("/api/branch/categories?type=product", {
            headers: { "x-branch-id": branchId.toString() },
          }),
          fetch("/api/branch/customers", {
            headers: { "x-branch-id": branchId.toString() },
          }),
          fetch("/api/branch/settings"),
        ]);

      if (productsRes.ok) {
        try {
          const productsData = await productsRes.json();
          // Handle both array and object response formats
          const productsArray = Array.isArray(productsData)
            ? productsData
            : productsData.data || [];
          setProducts(productsArray);
          setFilteredProducts(productsArray);
        } catch (e) {
          console.error("Failed to parse products:", e);
          setProducts([]);
          setFilteredProducts([]);
        }
      } else {
        console.error("Products API failed:", productsRes.status);
        setProducts([]);
        setFilteredProducts([]);
      }

      if (categoriesRes.ok) {
        try {
          const categoriesData = await categoriesRes.json();
          // Handle both array and object response formats
          const categoriesArray = Array.isArray(categoriesData)
            ? categoriesData
            : categoriesData.data || [];
          setCategories(categoriesArray);
        } catch (e) {
          console.error("Failed to parse categories:", e);
          setCategories([]);
        }
      } else {
        console.error("Categories API failed:", categoriesRes.status);
        setCategories([]);
      }

      if (customersRes.ok) {
        try {
          const customersData = await customersRes.json();
          // Handle both array and object response formats
          const customersArray = Array.isArray(customersData)
            ? customersData
            : customersData.data || [];
          setCustomers(customersArray);
        } catch (e) {
          console.error("Failed to parse customers:", e);
          setCustomers([]);
        }
      } else {
        console.error("Customers API failed:", customersRes.status);
        setCustomers([]);
      }

      if (settingsRes.ok) {
        try {
          const settingsData = await settingsRes.json();
          if (settingsData.success && settingsData.data) {
            setAllowNegativeStock(
              settingsData.data.allow_negative_stock === "true" ||
                settingsData.data.allow_negative_stock === true
            );
            setNegativeStockLimit(
              parseInt(settingsData.data.negative_stock_limit || "-10")
            );
          }
        } catch (e) {
          console.error("Failed to parse settings:", e);
        }
      } else {
        console.error("Settings API failed:", settingsRes.status);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("❌ Failed to load data");
      // Ensure arrays are initialized even on error
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

  const handleBarcodeSearch = () => {
    if (!barcode.trim()) {
      toast.error("❌ Please enter a barcode");
      return;
    }

    const product = products.find((p) => p.barcode === barcode.trim());

    if (product) {
      // Show immediate feedback that product was found
      toast.info(
        `Product found: ${product.name} - ${formatBranchCurrency(product.sellingPrice, currency)} (Stock: ${product.quantity})`,
        {
          duration: 2000,
        }
      );

      // Update dropdowns to reflect the scanned product
      setSelectedCategoryId(product.category.id.toString());
      setSelectedProductId(product.id.toString());

      // Try to add product to invoice
      addProductToInvoice(product);

      // Clear barcode field only if product was found
      setBarcode("");
    } else {
      toast.error(`❌ Product not found with barcode: "${barcode.trim()}"`);
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId) {
      toast.error("❌ Please select a product");
      return;
    }

    const product = products.find((p) => p.id === parseInt(selectedProductId));
    if (product) {
      addProductToInvoice(product);
      setSelectedProductId("");
      setItemQuantity(1);
    }
  };

  const addProductToInvoice = (product: Product) => {
    // Calculate maximum sellable quantity based on settings
    const maxSellable = allowNegativeStock
      ? product.quantity + Math.abs(negativeStockLimit)
      : product.quantity;

    if (product.quantity < itemQuantity && !allowNegativeStock) {
      toast.error(`Insufficient stock. Available: ${product.quantity}`);
      return;
    }

    // Check if item already exists
    const existingItemIndex = invoiceItems.findIndex(
      (item) => item.productId === product.id
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      const updatedItems = [...invoiceItems];
      const newQuantity =
        updatedItems[existingItemIndex].quantity + itemQuantity;

      // Calculate current stock after all items in cart
      const currentCartQuantity = invoiceItems.reduce(
        (sum, item) =>
          item.productId === product.id ? sum + item.quantity : sum,
        0
      );
      const projectedStock =
        product.quantity - (currentCartQuantity + itemQuantity);

      if (projectedStock < negativeStockLimit && allowNegativeStock) {
        toast.error(
          `Cannot exceed negative stock limit. Maximum additional: ${
            Math.abs(negativeStockLimit) +
            product.quantity -
            currentCartQuantity
          } units`
        );
        return;
      }

      if (product.quantity < newQuantity && !allowNegativeStock) {
        toast.error(`Insufficient stock. Available: ${product.quantity}`);
        return;
      }

      updatedItems[existingItemIndex].quantity = newQuantity;
      updatedItems[existingItemIndex] = calculateItemTotals(
        updatedItems[existingItemIndex]
      );
      setInvoiceItems(updatedItems);
      toast.success(`✅ Updated: ${product.name} (Qty: ${newQuantity})`);
    } else {
      // Add new item
      const projectedStock = product.quantity - itemQuantity;

      if (projectedStock < negativeStockLimit && allowNegativeStock) {
        toast.error(
          `Cannot exceed negative stock limit. Maximum sellable: ${maxSellable} units`
        );
        return;
      }

      const newItem: InvoiceItem = {
        productId: product.id,
        product,
        quantity: itemQuantity,
        unitPrice: Number(product.sellingPrice),
        discount: 0,
        taxAmount: 0,
        total: 0,
      };
      setInvoiceItems([...invoiceItems, calculateItemTotals(newItem)]);
      toast.success(`✅ Added: ${product.name} (Qty: ${itemQuantity})`);
    }
  };

  const calculateItemTotals = (item: InvoiceItem): InvoiceItem => {
    const subtotal = item.quantity * item.unitPrice - item.discount;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    return {
      ...item,
      taxAmount,
      total,
    };
  };

  const updateItemQuantity = (index: number, delta: number) => {
    const updatedItems = [...invoiceItems];
    const newQuantity = updatedItems[index].quantity + delta;

    if (newQuantity < 1) return;

    // Check stock constraints
    const product = updatedItems[index].product;
    const projectedStock = product.quantity - newQuantity;

    if (!allowNegativeStock && product.quantity < newQuantity) {
      toast.error("❌ Insufficient stock");
      return;
    }

    if (allowNegativeStock && projectedStock < negativeStockLimit) {
      toast.error(
        `Cannot exceed negative stock limit of ${negativeStockLimit}`
      );
      return;
    }

    updatedItems[index].quantity = newQuantity;
    updatedItems[index] = calculateItemTotals(updatedItems[index]);
    setInvoiceItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Calculate totals
  const subtotal = invoiceItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const totalItemsCount = invoiceItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const discountAmount =
    discountType === "percentage"
      ? (subtotal * discountValue) / 100
      : discountValue;

  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
  const grandTotal = subtotalAfterDiscount + taxAmount;
  const changeGiven = amountPaid - grandTotal;

  const handleSubmit = async () => {
    if (invoiceItems.length === 0) {
      toast.error("❌ Please add at least one item to the invoice");
      return;
    }

    if (amountPaid < grandTotal) {
      toast.error("❌ Amount paid is less than the total amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const invoiceData = {
        orderNumber: invoiceNumber,
        orderType,
        customerId,
        subtotal,
        discountType: discountType,
        discountValue: discountValue,
        discountTotal: discountAmount,
        taxRate,
        taxAmount,
        total: grandTotal,
        paymentMethod,
        amountPaid,
        changeGiven: changeGiven > 0 ? changeGiven : 0,
        notes,
        items: invoiceItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.total,
        })),
      };

      const response = await fetch("/api/branch/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-branch-id": branchId.toString(),
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create invoice");
      }

      toast.success("✅Invoice created successfully");
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create invoice"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setInvoiceItems([]);
    setCustomerId(null);
    setOrderType("dine-in");
    setPaymentMethod("cash");
    setDiscountValue(0);
    setAmountPaid(0);
    setNotes("");
    setBarcode("");
    setSelectedCategoryId("");
    setSelectedProductId("");
    setItemQuantity(1);
    generateInvoiceNumber();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create New Invoice</DialogTitle>
            <DialogDescription>
              Fill in the invoice details and add items to create a new sale
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Invoice Info & Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Invoice Number
                  </Label>
                  <Input
                    value={invoiceNumber}
                    readOnly
                    className="font-mono font-semibold mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Date & Time
                  </Label>
                  <Input
                    value={invoiceDate.toLocaleString()}
                    readOnly
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Customer Information
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setCustomerDialogOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </div>
                <Select
                  value={customerId?.toString() || ""}
                  onValueChange={(v) => setCustomerId(v ? parseInt(v) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Walk-in Customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem
                        key={customer.id}
                        value={customer.id.toString()}
                      >
                        {customer.name}{" "}
                        {customer.phone ? `- ${customer.phone}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {customerId && customerId > 0 && (
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {customers.find((c) => c.id === customerId)?.email && (
                      <p>
                        Email:{" "}
                        {customers.find((c) => c.id === customerId)?.email}
                      </p>
                    )}
                    {customers.find((c) => c.id === customerId)?.address && (
                      <p>
                        Address:{" "}
                        {customers.find((c) => c.id === customerId)?.address}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Add Items Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
                <h3 className="font-semibold text-lg">Add Items to Invoice</h3>

                {/* Barcode Scanner */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Scan Barcode</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="Scan or enter barcode..."
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();

                            handleBarcodeSearch();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleBarcodeSearch();
                        }}
                      >
                        <Scan className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or select manually
                    </span>
                  </div>
                </div>

                {/* Manual Product Selection */}
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs">Category</Label>
                    <Select
                      value={selectedCategoryId}
                      onValueChange={setSelectedCategoryId}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Product</Label>
                    <Select
                      value={selectedProductId}
                      onValueChange={setSelectedProductId}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProducts.map((product) => (
                          <SelectItem
                            key={product.id}
                            value={product.id.toString()}
                          >
                            {product.name} - {formatBranchCurrency(product.sellingPrice, currency)} (Stock:{" "}
                            {product.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) =>
                        setItemQuantity(parseInt(e.target.value) || 1)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full"
                  disabled={!selectedProductId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item to Invoice
                </Button>
              </div>

              {/* Invoice Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2">
                  <h3 className="font-semibold">
                    Invoice Items ({totalItemsCount} items)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">#</th>
                        <th className="text-left p-3 text-sm font-medium">
                          Product
                        </th>
                        <th className="text-right p-3 text-sm font-medium">
                          Price
                        </th>
                        <th className="text-center p-3 text-sm font-medium">
                          Quantity
                        </th>
                        <th className="text-right p-3 text-sm font-medium">
                          VAT ({taxRate}%)
                        </th>
                        <th className="text-right p-3 text-sm font-medium">
                          Total
                        </th>
                        <th className="text-center p-3 text-sm font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center p-8 text-muted-foreground"
                          >
                            No items added yet. Add items using the form above.
                          </td>
                        </tr>
                      ) : (
                        invoiceItems.map((item, index) => (
                          <tr
                            key={`item-${item.productId}-${index}`}
                            className="border-b hover:bg-muted/20"
                          >
                            <td className="p-3 text-sm">{index + 1}</td>
                            <td className="p-3">
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.product.sku}
                              </p>
                            </td>
                            <td className="p-3 text-right text-sm">
                              {formatBranchCurrency(item.unitPrice, currency)}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateItemQuantity(index, -1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-12 text-center font-medium">
                                  {item.quantity}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateItemQuantity(index, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                            <td className="p-3 text-right text-sm">
                              {formatBranchCurrency(item.taxAmount, currency)}
                            </td>
                            <td className="p-3 text-right font-semibold">
                              {formatBranchCurrency(item.total, currency)}
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeItem(index)}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column - Summary & Payment */}
            <div className="space-y-6">
              {/* Order Type & Payment Method */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div>
                  <Label>Order Type</Label>
                  <Select value={orderType} onValueChange={setOrderType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dine-in">Dine-in</SelectItem>
                      <SelectItem value="takeout">Takeout</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold text-lg">Invoice Summary</h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Subtotal ({totalItemsCount} items):
                    </span>
                    <span className="font-semibold">
                      {formatBranchCurrency(subtotal, currency)}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs">Discount</Label>
                    <div className="flex gap-2">
                      <Select
                        value={discountType}
                        onValueChange={(v) =>
                          setDiscountType(v as "percentage" | "amount")
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="amount">$</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountValue}
                        onChange={(e) =>
                          setDiscountValue(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-destructive">
                      <span>Discount Amount:</span>
                      <span className="font-semibold">
                        -{formatBranchCurrency(discountAmount, currency)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">
                      VAT ({taxRate}%):
                    </span>
                    <span className="font-semibold">
                      {formatBranchCurrency(taxAmount, currency)}
                    </span>
                  </div>

                  <div className="flex justify-between text-lg font-bold pt-3 border-t-2">
                    <span>Total Amount:</span>
                    <span className="text-primary">
                      {formatBranchCurrency(grandTotal, currency)}
                    </span>
                  </div>

                  <div className="space-y-2 pt-3 border-t">
                    <Label>Amount Paid</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amountPaid}
                      onChange={(e) =>
                        setAmountPaid(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                      className="text-lg font-semibold"
                    />
                  </div>

                  {amountPaid > 0 && (
                    <div
                      className={`flex justify-between text-sm p-3 rounded ${
                        changeGiven >= 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <span className="font-medium">Change:</span>
                      <span className="font-bold">
                        {changeGiven >= 0
                          ? formatBranchCurrency(changeGiven, currency)
                          : `Insufficient (${formatBranchCurrency(Math.abs(changeGiven), currency)} short)`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Add any notes for this invoice..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    invoiceItems.length === 0 ||
                    amountPaid < grandTotal
                  }
                  className="w-full h-12 text-lg"
                >
                  {isSubmitting ? "Processing..." : "Finalize Invoice"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Add Dialog */}
      <CustomerAddDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        branchId={branchId}
        onSuccess={fetchInitialData}
      />
    </>
  );
}
