/**
 * Purchase Form Modal
 * Modal for creating new purchase orders with line items
 *
 * ENHANCED:
 * - Phase 1 & 2: Modern UI with barcode scanning and improved UX
 * - Phase 3: Mobile card layout with responsive table/card switching
 * - Phase 4: Discount system (amount/percentage) and tax calculation (included/excluded)
 * - Phase 5: Payment status tracking and amount paid with auto-status updates
 * - Phase 6: Invoice image upload with preview, validation, and file info display
 */

"use client";

import { useState, useEffect } from "react";
import { Scan, Plus, Minus, X, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import inventoryService from "@/services/inventory.service";
import supplierService from "@/services/supplier.service";
import { PurchaseDto, SupplierDto, ProductDto, CreatePurchaseLineItemDto, CategoryDto } from "@/types/api.types";
import { useApiOperation } from "@/hooks/useApiOperation";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/shared/dialog";
import { ImageCarousel } from "@/components/shared/image-carousel";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/RadixInput";
import { Label } from "@/components/shared/label";
import { Card, CardContent } from "@/components/shared/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/RadixSelect";

interface PurchaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchase?: PurchaseDto;
  mode?: "create" | "edit" | "view";
}

interface LineItemForm extends CreatePurchaseLineItemDto {
  productName?: string;
  lineTotal: number;
}

export default function PurchaseFormModal({
  isOpen,
  onClose,
  onSuccess,
  purchase,
  mode = "create",
}: PurchaseFormModalProps) {
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const { branch } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    purchaseOrderNumber: "",
    supplierId: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [lineItems, setLineItems] = useState<LineItemForm[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);

  // NEW: Barcode and filtering state
  const [barcode, setBarcode] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [filteredProducts, setFilteredProducts] = useState<ProductDto[]>([]);

  // NEW: Product selection state for manual add
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemUnitCost, setItemUnitCost] = useState(0);

  // PHASE 4: Discount and tax state
  const [discountType, setDiscountType] = useState<"amount" | "percentage">("amount");
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(15); // Default 15% VAT
  const [taxIncluded, setTaxIncluded] = useState(false); // Tax included in unit cost or added on top

  // PHASE 5: Payment status state
  const [paymentStatus, setPaymentStatus] = useState<number>(0); // 0=Pending, 1=Partial, 2=Paid
  const [amountPaid, setAmountPaid] = useState(0);

  // PHASE 6: Invoice upload state
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);

  const { execute, isLoading } = useApiOperation();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Load suppliers, products, and categories
   */
  useEffect(() => {
    if (isOpen) {
      loadDropdownData();

      if (purchase && (mode === "edit" || mode === "view")) {
        // Edit/View mode - load existing purchase
        setFormData({
          purchaseOrderNumber: purchase.purchaseOrderNumber || "",
          supplierId: purchase.supplierId,
          purchaseDate: purchase.purchaseDate.split("T")[0],
          notes: purchase.notes || "",
        });
        setLineItems(
          purchase.lineItems.map((item) => ({
            productId: item.productId,
            productName: item.productNameEn,
            quantity: item.quantity,
            unitCost: item.unitCost,
            lineTotal: item.lineTotal,
          }))
        );

        // PHASE 4: Load discount and tax
        setDiscountType(purchase.discountType as "amount" | "percentage");
        setDiscountValue(purchase.discountValue || 0);
        setTaxRate(purchase.taxRate || 15);
        setTaxIncluded(purchase.taxIncluded || false);

        // PHASE 5: Load payment status and amount paid
        setPaymentStatus(purchase.paymentStatus || 0);
        setAmountPaid(purchase.amountPaid || 0);

        // PHASE 6: Load invoice image preview if available
        if (purchase.invoiceImagePath && purchase.id) {
          // Use the API endpoint for serving purchase invoice images
          const branchCode = branch?.branchCode || 'B001';
          const imageUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062'}/api/v1/images/${branchCode}/purchases/${purchase.id}/invoice/large`;
          setInvoicePreview(imageUrl);
        } else {
          setInvoicePreview(null);
        }
        setInvoiceFile(null); // No file object in edit/view mode
      } else {
        // Create mode - reset form
        resetForm();
      }

      setValidationErrors({});
    }
  }, [isOpen, purchase, mode]);

  /**
   * Filter products by category
   */
  useEffect(() => {
    if (selectedCategoryId && selectedCategoryId !== "all") {
      setFilteredProducts(
        products.filter((p) => p.categoryId === selectedCategoryId)
      );
    } else {
      setFilteredProducts(products);
    }
  }, [selectedCategoryId, products]);

  const loadDropdownData = async () => {
    try {
      const [suppliersResponse, productsData, categoriesData] = await Promise.all([
        supplierService.getSuppliers({ includeInactive: false, pageSize: 1000 }),
        inventoryService.getProducts({ pageSize: 1000 }),
        inventoryService.getCategories(),
      ]);
      setSuppliers(suppliersResponse.data);
      setProducts(productsData.data);
      setFilteredProducts(productsData.data);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error("Failed to load dropdown data:", err);
      toast.error("Failed to load data");
    }
  };

  /**
   * NEW: Handle barcode search
   */
  const handleBarcodeSearch = () => {
    if (!barcode.trim()) {
      toast.error("Please enter a barcode");
      return;
    }

    const product = products.find((p) => p.barcode === barcode.trim());

    if (product) {
      // Show immediate feedback that product was found
      toast.success(`Found: ${product.nameEn} - $${product.costPrice.toFixed(2)}`, {
        duration: 2000,
      });

      // Update dropdowns to reflect the scanned product
      if (product.categoryId) {
        setSelectedCategoryId(product.categoryId);
      }
      setSelectedProductId(product.id);
      setItemUnitCost(product.costPrice);

      // Add product to purchase
      addProductToPurchase(product, product.costPrice);

      // Clear barcode field
      setBarcode("");
    } else {
      toast.error(`Product not found: ${barcode.trim()}`);
    }
  };

  /**
   * NEW: Add product to purchase items
   */
  const addProductToPurchase = (product: ProductDto, unitCost: number) => {
    // Check if item already exists with same unit cost
    const existingItemIndex = lineItems.findIndex(
      (item) => item.productId === product.id && item.unitCost === unitCost
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      const updatedItems = [...lineItems];
      updatedItems[existingItemIndex].quantity += itemQuantity;
      updatedItems[existingItemIndex].lineTotal =
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitCost;
      setLineItems(updatedItems);
      toast.success(`Updated: ${product.nameEn} (Qty: ${updatedItems[existingItemIndex].quantity})`);
    } else {
      // Add new item
      const newItem: LineItemForm = {
        productId: product.id,
        productName: product.nameEn,
        quantity: itemQuantity,
        unitCost: unitCost,
        lineTotal: itemQuantity * unitCost,
      };
      setLineItems([...lineItems, newItem]);
      toast.success(`Added: ${product.nameEn} (Qty: ${itemQuantity})`);
    }
  };

  /**
   * NEW: Handle manual add item
   */
  const handleAddItem = () => {
    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }

    if (itemUnitCost <= 0) {
      toast.error("Unit cost must be greater than 0");
      return;
    }

    const product = products.find((p) => p.id === selectedProductId);
    if (product) {
      addProductToPurchase(product, itemUnitCost);
      // Reset selection
      setSelectedProductId("");
      setItemQuantity(1);
      setItemUnitCost(0);
    }
  };

  /**
   * NEW: Handle product selection change
   */
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find((p) => p.id === productId);
    if (product) {
      setItemUnitCost(product.costPrice);
    }
  };

  /**
   * NEW: Update item quantity with +/- buttons
   */
  const updateItemQuantity = (index: number, delta: number) => {
    const updatedItems = [...lineItems];
    const newQuantity = updatedItems[index].quantity + delta;

    if (newQuantity < 1) return;

    updatedItems[index].quantity = newQuantity;
    updatedItems[index].lineTotal = newQuantity * updatedItems[index].unitCost;
    setLineItems(updatedItems);
  };

  /**
   * Remove line item
   */
  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
    toast.info("Item removed");
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.supplierId) errors.supplierId = "Supplier is required";
    if (!formData.purchaseDate) errors.purchaseDate = "Purchase date is required";
    if (lineItems.length === 0) errors.lineItems = "At least one product is required";

    lineItems.forEach((item, index) => {
      if (!item.productId) errors[`lineItem_${index}_product`] = "Product is required";
      if (!item.quantity || item.quantity <= 0)
        errors[`lineItem_${index}_quantity`] = "Quantity must be greater than 0";
      if (!item.unitCost || item.unitCost <= 0)
        errors[`lineItem_${index}_unitCost`] = "Unit cost must be greater than 0";
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Calculate total cost
   */
  const calculateTotalCost = (): number => {
    return lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  /**
   * Calculate total items count
   */
  const totalItemsCount = lineItems.reduce((sum, item) => sum + item.quantity, 0);

  /**
   * PHASE 4: Calculate discount, tax, and grand total
   */
  const subtotal = calculateTotalCost();

  // Calculate discount amount based on type
  const discountAmount =
    discountType === "percentage"
      ? (subtotal * discountValue) / 100
      : discountValue;

  const subtotalAfterDiscount = subtotal - discountAmount;

  // Calculate tax based on whether it's included or excluded
  let taxAmount = 0;
  let grandTotal = 0;

  if (taxIncluded) {
    // Tax is included in the unit cost, so we need to extract it
    // Formula: Tax = Total / (1 + Tax Rate) * Tax Rate
    taxAmount =
      (subtotalAfterDiscount / (1 + taxRate / 100)) * (taxRate / 100);
    grandTotal = subtotalAfterDiscount;
  } else {
    // Tax is added on top
    taxAmount = (subtotalAfterDiscount * taxRate) / 100;
    grandTotal = subtotalAfterDiscount + taxAmount;
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix validation errors");
      return;
    }

    // PHASE 6: Convert invoice file to base64 if present
    let invoiceImageBase64 = undefined;
    let invoiceImageFileName = undefined;

    if (invoiceFile) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            // Remove data:image/xxx;base64, prefix
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(invoiceFile);
        });
        invoiceImageBase64 = base64;
        invoiceImageFileName = invoiceFile.name;
      } catch (error) {
        console.error("Failed to convert invoice image to base64:", error);
        toast.error("Failed to process invoice image");
        return;
      }
    }

    const purchaseData = {
      supplierId: formData.supplierId,
      purchaseDate: formData.purchaseDate,
      purchaseOrderNumber: formData.purchaseOrderNumber.trim() || undefined,
      lineItems: lineItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
      notes: formData.notes.trim() || undefined,
      // PHASE 4: Discount and tax data
      discountType: discountType,
      discountValue: discountValue,
      discountAmount: discountAmount,
      taxRate: taxRate,
      taxAmount: taxAmount,
      taxIncluded: taxIncluded,
      // Calculated totals
      subtotal: subtotal,
      grandTotal: grandTotal,
      // PHASE 5: Payment status and amount paid
      paymentStatus: paymentStatus,
      amountPaid: amountPaid,
      // PHASE 6: Invoice image (base64 encoded)
      invoiceImageBase64: invoiceImageBase64,
      invoiceImageFileName: invoiceImageFileName,
    };

    if (isEditMode && purchase) {
      await execute({
        operation: () => inventoryService.updatePurchase(purchase.id, purchaseData),
        successMessage: "Purchase order updated successfully",
        successDetail: `Grand Total: $${grandTotal.toFixed(2)}`,
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      });
    } else {
      await execute({
        operation: () => inventoryService.createPurchase(purchaseData),
        successMessage: "Purchase order created successfully",
        successDetail: `Grand Total: $${grandTotal.toFixed(2)}`,
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      });
    }
  };

  /**
   * PHASE 6: Handle invoice file selection
   */
  const handleInvoiceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload JPG, PNG, or WEBP image.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error("File size exceeds 5MB. Please upload a smaller image.");
      return;
    }

    setInvoiceFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setInvoicePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    toast.success(`Invoice image selected: ${file.name}`);
  };

  /**
   * PHASE 6: Remove invoice file
   */
  const handleRemoveInvoice = () => {
    setInvoiceFile(null);
    setInvoicePreview(null);
    toast.info("Invoice image removed");
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setFormData({
      purchaseOrderNumber: "",
      supplierId: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setLineItems([]);
    setBarcode("");
    setSelectedCategoryId("all");
    setSelectedProductId("");
    setItemQuantity(1);
    setItemUnitCost(0);
    // PHASE 4: Reset discount and tax
    setDiscountType("amount");
    setDiscountValue(0);
    setTaxRate(15);
    setTaxIncluded(false);
    // PHASE 5: Reset payment status
    setPaymentStatus(0);
    setAmountPaid(0);
    // PHASE 6: Reset invoice upload
    setInvoiceFile(null);
    setInvoicePreview(null);
    setValidationErrors({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isViewMode
              ? "Purchase Order Details"
              : isEditMode
              ? "Edit Purchase Order"
              : "Create Purchase Order"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* PHASE 1: 3-Column Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN (2/3): Purchase Info & Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Purchase Header */}
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                <div>
                  <Label className="text-xs text-gray-600">
                    Purchase Order Number
                  </Label>
                  <Input
                    type="text"
                    value={formData.purchaseOrderNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseOrderNumber: e.target.value })
                    }
                    disabled={isViewMode}
                    placeholder="Auto-generated if empty"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to auto-generate (e.g., B001-PO-000001)
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-gray-600">
                    Purchase Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                    disabled={isViewMode}
                    className={`mt-1 ${
                      validationErrors.purchaseDate ? "border-red-500" : ""
                    }`}
                  />
                  {validationErrors.purchaseDate && (
                    <p className="text-xs text-red-500 mt-1">
                      {validationErrors.purchaseDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Supplier Information */}
              <div className="space-y-3 p-4 border rounded-lg">
                <Label className="text-sm font-semibold">
                  Supplier Information <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.supplierId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, supplierId: value })
                  }
                  disabled={isViewMode}
                >
                  <SelectTrigger
                    className={validationErrors.supplierId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="-- Select Supplier --" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers
                      .filter((s) => s.isActive)
                      .map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          [{supplier.code}] {supplier.nameEn}
                          {supplier.totalPurchases > 0
                            ? ` - ${supplier.totalPurchases} previous order${
                                supplier.totalPurchases > 1 ? "s" : ""
                              }`
                            : " - New supplier"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {validationErrors.supplierId && (
                  <p className="text-sm text-red-500">
                    {validationErrors.supplierId}
                  </p>
                )}
              </div>

              {/* PHASE 2: Add Items Section with Barcode Scanner */}
              {!isViewMode && (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                  <h3 className="font-semibold text-lg">Add Items</h3>

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
                          className="text-lg h-12"
                        />
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleBarcodeSearch();
                          }}
                          size="lg"
                          className="min-h-[44px]"
                        >
                          <Scan className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-blue-50 px-2 text-gray-600">
                        OR Select Manually
                      </span>
                    </div>
                  </div>

                  {/* PHASE 2: Manual Product Selection with Category Filter */}
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Category</Label>
                      <Select
                        value={selectedCategoryId}
                        onValueChange={setSelectedCategoryId}
                      >
                        <SelectTrigger className="mt-1 h-12">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.nameEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-2">
                      <Label className="text-xs">Product</Label>
                      <Select
                        value={selectedProductId}
                        onValueChange={handleProductSelect}
                      >
                        <SelectTrigger className="mt-1 h-12">
                          <SelectValue placeholder="Select Product" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.nameEn}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Unit Cost</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={itemUnitCost}
                        onChange={(e) =>
                          setItemUnitCost(parseFloat(e.target.value) || 0)
                        }
                        className="mt-1 h-12 text-lg"
                        placeholder="0.00"
                        inputMode="decimal"
                      />
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
                        className="mt-1 h-12 text-lg"
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full min-h-[44px]"
                    disabled={!selectedProductId}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              )}

              {/* Purchase Items - Responsive: Cards on Mobile, Table on Desktop */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2">
                  <h3 className="font-semibold">
                    Purchase Items ({totalItemsCount} items)
                  </h3>
                </div>

                {validationErrors.lineItems && (
                  <div className="p-4 bg-red-50 border-b border-red-200">
                    <p className="text-red-500 text-sm">{validationErrors.lineItems}</p>
                  </div>
                )}

                {/* PHASE 3: Mobile Card Layout (< 768px) */}
                <div className="md:hidden">
                  {lineItems.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      No items added yet
                    </div>
                  ) : (
                    <div className="space-y-3 p-3">
                      {lineItems.map((item, index) => (
                        <Card key={`card-${item.productId}-${index}`}>
                          <CardContent className="p-4">
                            {/* Header: Product name and remove button */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                    {index + 1}
                                  </span>
                                  <p className="font-semibold text-base">
                                    {item.productName}
                                  </p>
                                </div>
                                <p className="text-sm text-gray-600">
                                  ${item.unitCost.toFixed(2)} per unit
                                </p>
                              </div>
                              {!isViewMode && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveLineItem(index)}
                                  className="h-10 w-10 p-0 -mt-1 -mr-1"
                                >
                                  <X className="h-5 w-5 text-red-600" />
                                </Button>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                              <span className="text-sm font-medium text-gray-700">
                                Quantity:
                              </span>
                              {isViewMode ? (
                                <span className="text-lg font-semibold">
                                  {item.quantity}
                                </span>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateItemQuantity(index, -1)}
                                    disabled={item.quantity <= 1}
                                    className="h-10 w-10 p-0 min-h-[44px] min-w-[44px]"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="text-xl font-semibold min-w-[3rem] text-center">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateItemQuantity(index, 1)}
                                    className="h-10 w-10 p-0 min-h-[44px] min-w-[44px]"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Line Total */}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t bg-blue-50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                              <span className="text-sm font-medium text-gray-700">
                                Line Total:
                              </span>
                              <span className="text-xl font-bold text-blue-600">
                                ${item.lineTotal.toFixed(2)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop Table Layout (>= 768px) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">#</th>
                        <th className="text-left p-3 text-sm font-medium">Product</th>
                        <th className="text-right p-3 text-sm font-medium">Unit Cost</th>
                        <th className="text-center p-3 text-sm font-medium">Quantity</th>
                        <th className="text-right p-3 text-sm font-medium">Total</th>
                        {!isViewMode && (
                          <th className="text-center p-3 text-sm font-medium">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={isViewMode ? 5 : 6}
                            className="text-center p-8 text-gray-500"
                          >
                            No items added yet
                          </td>
                        </tr>
                      ) : (
                        lineItems.map((item, index) => (
                          <tr
                            key={`item-${item.productId}-${index}`}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="p-3 text-sm">{index + 1}</td>
                            <td className="p-3">
                              <p className="font-medium">{item.productName}</p>
                            </td>
                            <td className="p-3 text-right text-sm">
                              ${item.unitCost.toFixed(2)}
                            </td>
                            <td className="p-3">
                              {isViewMode ? (
                                <div className="text-center font-medium">
                                  {item.quantity}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateItemQuantity(index, -1)}
                                    disabled={item.quantity <= 1}
                                    className="h-8 w-8 p-0"
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
                                    className="h-8 w-8 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right font-semibold">
                              ${item.lineTotal.toFixed(2)}
                            </td>
                            {!isViewMode && (
                              <td className="p-3 text-center">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveLineItem(index)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (1/3): Summary & Actions */}
            <div className="space-y-6">
              {/* Purchase Summary with Discount & Tax (PHASE 4) */}
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold text-lg">Purchase Summary</h3>

                <div className="space-y-3">
                  {/* Subtotal */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal ({totalItemsCount} items):
                    </span>
                    <span className="font-semibold">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Discount Settings */}
                  {!isViewMode && (
                    <div className="space-y-3 pt-2 border-t">
                      <Label className="text-sm font-semibold">Discount Settings</Label>

                      {/* Discount Type Toggle */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Discount Type</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={discountType === "amount" ? "default" : "outline"}
                            onClick={() => {
                              setDiscountType("amount");
                              setDiscountValue(0);
                            }}
                            className="flex-1"
                          >
                            Amount ($)
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={discountType === "percentage" ? "default" : "outline"}
                            onClick={() => {
                              setDiscountType("percentage");
                              setDiscountValue(0);
                            }}
                            className="flex-1"
                          >
                            Percentage (%)
                          </Button>
                        </div>
                      </div>

                      {/* Discount Value Input */}
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {discountType === "percentage"
                            ? "Discount Percentage"
                            : "Discount Amount"}
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max={discountType === "percentage" ? 100 : undefined}
                          step={discountType === "percentage" ? "0.1" : "0.01"}
                          value={discountValue}
                          onChange={(e) =>
                            setDiscountValue(parseFloat(e.target.value) || 0)
                          }
                          placeholder={discountType === "percentage" ? "0.0" : "0.00"}
                          inputMode="decimal"
                        />
                      </div>
                    </div>
                  )}

                  {/* Discount Summary */}
                  {discountAmount > 0 && (
                    <div className="space-y-1 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Discount {isViewMode && `(${discountType === "percentage" ? `${discountValue}%` : `$${discountValue.toFixed(2)}`})`}:
                        </span>
                        <span className="font-semibold text-red-600">
                          -${discountAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tax Settings */}
                  {!isViewMode && (
                    <div className="space-y-3 pt-2 border-t">
                      <Label className="text-sm font-semibold">Tax Settings</Label>

                      {/* Tax Included Toggle */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">
                          Tax Calculation Method
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={!taxIncluded ? "default" : "outline"}
                            onClick={() => setTaxIncluded(false)}
                            className="flex-1"
                          >
                            Tax Excluded
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={taxIncluded ? "default" : "outline"}
                            onClick={() => setTaxIncluded(true)}
                            className="flex-1"
                          >
                            Tax Included
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {taxIncluded
                            ? "Tax is included in the unit cost"
                            : "Tax will be added on top of the total"}
                        </p>
                      </div>

                      {/* Tax Rate Input */}
                      <div className="space-y-1">
                        <Label className="text-xs">Tax Rate (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={taxRate}
                          onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                          placeholder="15"
                          inputMode="decimal"
                        />
                      </div>
                    </div>
                  )}

                  {/* Tax Summary */}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-gray-600">
                        {taxIncluded ? "VAT (Included)" : "VAT"} ({taxRate}%):
                      </span>
                      <span className="font-semibold">
                        ${taxAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="flex justify-between text-lg font-bold pt-3 border-t-2">
                    <span>Grand Total:</span>
                    <span className="text-blue-600">
                      ${grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* PHASE 5: Payment Status & Tracking */}
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                <h3 className="font-semibold text-lg">Payment Tracking</h3>

                {/* Payment Status Dropdown */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Payment Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={paymentStatus.toString()}
                    onValueChange={(value) => setPaymentStatus(parseInt(value))}
                    disabled={isViewMode}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Pending</SelectItem>
                      <SelectItem value="1">Partial</SelectItem>
                      <SelectItem value="2">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount Paid Input */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Amount Paid</Label>
                  <Input
                    type="number"
                    min="0"
                    max={grandTotal}
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setAmountPaid(value);
                      // Auto-update payment status based on amount
                      if (value === 0) {
                        setPaymentStatus(0); // Pending
                      } else if (value >= grandTotal) {
                        setPaymentStatus(2); // Paid
                      } else {
                        setPaymentStatus(1); // Partial
                      }
                    }}
                    placeholder="0.00"
                    inputMode="decimal"
                    disabled={isViewMode}
                    className="text-lg font-semibold bg-white"
                  />
                  {amountPaid > 0 && (
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between text-gray-600">
                        <span>Paid:</span>
                        <span className="font-semibold text-green-600">
                          ${amountPaid.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Remaining:</span>
                        <span
                          className={`font-semibold ${
                            grandTotal - amountPaid > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          ${Math.max(0, grandTotal - amountPaid).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Status Badge */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        paymentStatus === 2
                          ? "bg-green-100 text-green-700"
                          : paymentStatus === 1
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {paymentStatus === 2
                        ? "Paid"
                        : paymentStatus === 1
                        ? "Partial"
                        : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* PHASE 6: Invoice Image Upload / Display */}
              {isViewMode ? (
                // View Mode: Display invoice image if available
                invoicePreview && (
                  <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-gray-600" />
                      <Label className="text-sm font-semibold">Invoice Image</Label>
                    </div>

                    {/* Image Display with ImageCarousel */}
                    <div className="w-full">
                      <ImageCarousel
                        images={[invoicePreview]}
                        alt="Purchase invoice"
                        className="w-full h-96"
                      />
                    </div>
                  </div>
                )
              ) : (
                // Create/Edit Mode: Upload interface
                <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-gray-600" />
                    <Label className="text-sm font-semibold">Invoice Image</Label>
                    <span className="text-xs text-gray-500">(Optional)</span>
                  </div>

                  {/* Image Preview */}
                  {invoicePreview && (
                    <div className="relative h-40 w-full rounded-lg border-2 border-dashed border-gray-300 overflow-hidden bg-white">
                      <img
                        src={invoicePreview}
                        alt="Invoice preview"
                        className="w-full h-full object-contain"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={handleRemoveInvoice}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* File Input */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleInvoiceSelect}
                        className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    <div className="flex items-start gap-2 text-xs text-gray-500">
                      <Upload className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>Max 5MB, JPG/PNG/WEBP format</p>
                        <p className="mt-1">Upload a scanned copy or photo of the purchase invoice</p>
                      </div>
                    </div>
                  </div>

                  {/* File Info */}
                  {invoiceFile && (
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-700">{invoiceFile.name}</span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {(invoiceFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={isViewMode}
                  rows={3}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isViewMode ? "bg-gray-100" : ""
                  }`}
                  placeholder="Optional purchase notes..."
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  type="submit"
                  disabled={isLoading || lineItems.length === 0 || isViewMode}
                  className="w-full h-12 text-lg min-h-[44px]"
                >
                  {isLoading
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                    ? "Update Purchase Order"
                    : "Create Purchase Order"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full min-h-[44px]"
                >
                  {isViewMode ? "Close" : "Cancel"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
