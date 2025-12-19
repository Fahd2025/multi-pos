"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Minus } from "lucide-react";
import { ProductDto } from "@/types/api.types";
import salesService from "@/services/sales.service";
import inventoryService from "@/services/inventory.service";

interface DeliveryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export function DeliveryForm({
  open,
  onOpenChange,
  onSuccess,
}: DeliveryFormProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryInfo, setDeliveryInfo] = useState({
    customerName: "",
    phone: "",
    address: "",
    instructions: "",
  });

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      const response = await inventoryService.getProducts({
        isActive: true,
      });
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const addToCart = (product: ProductDto) => {
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.nameEn,
          quantity: 1,
          unitPrice: product.sellingPrice,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.productId === productId) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const onSubmit = async () => {
    if (cart.length === 0) {
      alert("Please add items to the order");
      return;
    }

    if (
      !deliveryInfo.customerName ||
      !deliveryInfo.phone ||
      !deliveryInfo.address
    ) {
      alert("Please fill in all delivery information");
      return;
    }

    try {
      setLoading(true);

      // Create the sale with delivery information
      await salesService.createSale({
        invoiceType: 0, // Standard invoice
        deliveryAddress: `${deliveryInfo.customerName}, ${deliveryInfo.phone}, ${deliveryInfo.address}`,
        specialInstructions: deliveryInfo.instructions || undefined,
        isDelivery: true,
        paymentMethod: 0, // Cash
        lineItems: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountType: 0, // No discount
          discountValue: 0,
        })),
      });

      // Reset form
      setCart([]);
      setDeliveryInfo({
        customerName: "",
        phone: "",
        address: "",
        instructions: "",
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to create delivery order:", error);
      alert("Failed to create delivery order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>New Delivery Order</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left: Products */}
          <div>
            <h3 className="font-semibold mb-3">Select Products</h3>
            <div className="space-y-2 max-h-96 overflow-auto">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => addToCart(product)}
                >
                  <div>
                    <p className="font-medium">{product.nameEn}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(product.sellingPrice)}
                    </p>
                  </div>
                  <button className="p-2 border rounded-lg hover:bg-emerald-50 hover:border-emerald-500 transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Cart & Delivery Info */}
          <div className="space-y-4">
            {/* Cart */}
            <div>
              <h3 className="font-semibold mb-3">Order Items</h3>
              {cart.length === 0 ? (
                <p className="text-sm text-gray-500">No items added</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(item.unitPrice)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1 border rounded hover:bg-gray-100"
                          onClick={() => updateQuantity(item.productId, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          className="p-1 border rounded hover:bg-gray-100"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Information */}
            <div>
              <h3 className="font-semibold mb-3">Delivery Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.customerName}
                    onChange={(e) =>
                      setDeliveryInfo({
                        ...deliveryInfo,
                        customerName: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={deliveryInfo.phone}
                    onChange={(e) =>
                      setDeliveryInfo({
                        ...deliveryInfo,
                        phone: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={deliveryInfo.address}
                    onChange={(e) =>
                      setDeliveryInfo({
                        ...deliveryInfo,
                        address: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    rows={2}
                    placeholder="Enter delivery address"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Special Instructions
                  </label>
                  <textarea
                    value={deliveryInfo.instructions}
                    onChange={(e) =>
                      setDeliveryInfo({
                        ...deliveryInfo,
                        instructions: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    rows={2}
                    placeholder="Add delivery notes"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                onClick={onSubmit}
                disabled={loading || cart.length === 0}
              >
                {loading ? "Creating..." : "Create Order"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
