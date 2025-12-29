# Return Invoice System - Usage Guide

**Version:** 1.0
**Date:** 2025-12-29
**For:** Developers integrating the Return Invoice Dialog

---

## 📋 Quick Start

### 1. Import the Component

```typescript
import ReturnInvoiceDialog from "@/components/branch/sales/ReturnInvoiceDialog";
import { SaleDto, ReturnResponseDto } from "@/types/api.types";
import salesService from "@/services/sales.service";
```

### 2. Add State Management

```typescript
const [returnDialogOpen, setReturnDialogOpen] = useState(false);
const [selectedSale, setSelectedSale] = useState<SaleDto | null>(null);
```

### 3. Create Handler Function

```typescript
const handleOpenReturnDialog = async (sale: SaleDto) => {
  try {
    // IMPORTANT: Fetch full sale details with line items
    const fullSale = await salesService.getSaleById(sale.id);

    // Set state and open dialog
    setSelectedSale(fullSale);
    setReturnDialogOpen(true);
  } catch (error) {
    console.error("Error loading sale:", error);
    toast.error("Failed to load sale details");
  }
};
```

### 4. Add the Component

```typescript
<ReturnInvoiceDialog
  isOpen={returnDialogOpen}
  onClose={() => setReturnDialogOpen(false)}
  sale={selectedSale}
  onSuccess={(returnResponse) => {
    console.log("Return processed:", returnResponse);
    // Refresh your data here
  }}
/>
```

### 5. Add a Return Button

```typescript
<button
  onClick={() => handleOpenReturnDialog(sale)}
  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
>
  Return Invoice
</button>
```

---

## 🔧 Complete Integration Example

### Sales Table Integration

```typescript
"use client";

import { useState } from "react";
import { toast } from "sonner";
import ReturnInvoiceDialog from "@/components/branch/sales/ReturnInvoiceDialog";
import salesService from "@/services/sales.service";
import { SaleDto, ReturnResponseDto } from "@/types/api.types";

export default function SalesPage() {
  const [sales, setSales] = useState<SaleDto[]>([]);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleDto | null>(null);

  // Fetch full sale details before opening dialog
  const handleOpenReturnDialog = async (sale: SaleDto) => {
    try {
      // CRITICAL: Must fetch full sale with line items
      const fullSale = await salesService.getSaleById(sale.id);

      setSelectedSale(fullSale);
      setReturnDialogOpen(true);
    } catch (error: any) {
      console.error("Error loading sale:", error);
      toast.error(error.message || "Failed to load sale details");
    }
  };

  // Handle successful return
  const handleReturnSuccess = async (returnResponse: ReturnResponseDto) => {
    console.log("Return processed successfully:", returnResponse);

    // Show success message
    toast.success(
      `Return ${returnResponse.returnOrderNumber} processed successfully!`
    );

    // Refresh sales list to show updated statuses
    await fetchSales();

    // Close dialog
    setReturnDialogOpen(false);
  };

  const fetchSales = async () => {
    try {
      const response = await salesService.getSales({
        page: 1,
        pageSize: 50,
      });
      setSales(response.data);
    } catch (error: any) {
      toast.error("Failed to fetch sales");
    }
  };

  return (
    <div>
      {/* Sales Table */}
      <table>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.orderNumber}</td>
              <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
              <td>${sale.total.toFixed(2)}</td>
              <td>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    sale.status === "returned"
                      ? "bg-red-100 text-red-700"
                      : sale.status === "partially_returned"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {sale.status}
                </span>
              </td>
              <td>
                <button
                  onClick={() => handleOpenReturnDialog(sale)}
                  disabled={sale.isVoided || sale.status === "returned"}
                  className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Return
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Return Dialog */}
      <ReturnInvoiceDialog
        isOpen={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
        sale={selectedSale}
        onSuccess={handleReturnSuccess}
      />
    </div>
  );
}
```

---

## 📚 API Reference

### Component Props

```typescript
interface ReturnInvoiceDialogProps {
  /** Controls dialog visibility */
  isOpen: boolean;

  /** Called when user closes dialog (X button or Cancel) */
  onClose: () => void;

  /** Sale object with full details including lineItems */
  sale: SaleDto | null;

  /** Optional callback when return is successfully processed */
  onSuccess?: (returnResponse: ReturnResponseDto) => void;
}
```

### Required Sale Data Structure

```typescript
interface SaleDto {
  id: string;                           // Sale ID (required)
  orderNumber: string;                  // Display in header
  saleDate: Date | string;              // Display in header
  subtotal: number;                     // For calculations
  taxAmount: number;                    // For calculations
  totalDiscount: number;                // For calculations
  total: number;                        // Display only
  isVoided: boolean;                    // Prevent returns
  status: string;                       // Track return status

  lineItems: SaleLineItemDto[];         // CRITICAL: Must be populated!
}

interface SaleLineItemDto {
  id: string;                           // saleItemId (required)
  productId: string;                    // Product reference
  productName?: string;                 // Display name
  quantity: number;                     // Original quantity sold
  unitPrice: number;                    // Price per unit
  returnQuantity?: number;              // Already returned (default 0)
  itemStatus?: string;                  // Item-level status
}
```

### Return Response Structure

```typescript
interface ReturnResponseDto {
  message: string;                      // Success message
  returnOrderNumber: string;            // e.g., "RET-ORD-001-123456789"
  returnSaleId: string;                 // ID of return sale
  refundAmount: number;                 // Total refund amount
  originalSaleId: string;               // Reference to original
  returnTransactionId?: string;         // Transaction ID
  returnDate: Date;                     // When processed
}
```

---

## ⚠️ Important Notes

### 1. Always Fetch Full Sale Details

**❌ Wrong:**
```typescript
// This will fail - sale list doesn't include line items!
setSelectedSale(sale);
setReturnDialogOpen(true);
```

**✅ Correct:**
```typescript
// Always fetch full details first
const fullSale = await salesService.getSaleById(sale.id);
setSelectedSale(fullSale);
setReturnDialogOpen(true);
```

### 2. Check Return Eligibility

**Best Practice:**
```typescript
const handleReturnClick = async (sale: SaleDto) => {
  // Check if sale can be returned
  if (sale.isVoided) {
    toast.error("Cannot return a voided sale");
    return;
  }

  if (sale.status === "returned") {
    toast.error("This sale has already been fully returned");
    return;
  }

  // Optional: Check with backend
  const canReturn = await salesService.canReturnSale(sale.id);
  if (!canReturn.canReturn) {
    toast.error(canReturn.reason || "Cannot return this sale");
    return;
  }

  // Proceed with return
  const fullSale = await salesService.getSaleById(sale.id);
  setSelectedSale(fullSale);
  setReturnDialogOpen(true);
};
```

### 3. Handle Manager Authorization

The backend requires Manager or Admin role. Handle authorization errors gracefully:

```typescript
const handleReturnSuccess = (returnResponse: ReturnResponseDto) => {
  toast.success("Return processed successfully!");
  // Update UI...
};

// The component handles authorization errors automatically
// via the salesService.processReturn() method
```

---

## 🎨 Customization

### Styling

The component uses Tailwind CSS. To customize:

```typescript
// Modify classes in ReturnInvoiceDialog.tsx
className="bg-white rounded-lg shadow-xl" // Change to your theme
```

### Return Reasons

Modify the `RETURN_REASONS` array in the component:

```typescript
const RETURN_REASONS = [
  { value: "damaged", label: "Damaged Item" },
  { value: "wrong_item", label: "Wrong Item" },
  // Add your custom reasons here
];
```

### Touch Target Sizes

Default: 56×56px (Material Design excellent)

To change globally, update all instances of:
```typescript
className="min-h-[56px] min-w-[56px]"
// Change to your preferred size (minimum 44px for Apple HIG)
```

---

## 🧪 Testing Your Integration

### Checklist

- [ ] Return button appears on sales table
- [ ] Clicking button opens dialog
- [ ] Sale details display correctly in dialog
- [ ] Can select/deselect items
- [ ] Quantity controls work (+/- buttons)
- [ ] Cannot exceed available quantity
- [ ] Refund amount calculates correctly
- [ ] Can select return reason
- [ ] Can add notes
- [ ] Summary view shows all data
- [ ] Submit button processes return
- [ ] Success callback fires
- [ ] Dialog closes on success
- [ ] Sales list refreshes
- [ ] Error handling works (try invalid data)

### Test Data

```typescript
// Create a test sale with multiple items
const testSale: SaleDto = {
  id: "test-sale-123",
  orderNumber: "ORD-001",
  saleDate: new Date(),
  subtotal: 100,
  taxAmount: 10,
  totalDiscount: 5,
  total: 105,
  isVoided: false,
  status: "completed",
  lineItems: [
    {
      id: "item-1",
      productId: "prod-1",
      productName: "Test Product 1",
      quantity: 5,
      unitPrice: 10,
      returnQuantity: 0,
    },
    {
      id: "item-2",
      productId: "prod-2",
      productName: "Test Product 2",
      quantity: 3,
      unitPrice: 15,
      returnQuantity: 1, // Already returned 1
    },
  ],
};
```

---

## 🔧 Troubleshooting

### Problem: "Sale data not available" error

**Cause:** `sale` prop is null or undefined

**Solution:**
```typescript
// Always check sale exists before opening
if (!sale) {
  toast.error("Sale not found");
  return;
}

const fullSale = await salesService.getSaleById(sale.id);
```

### Problem: Items show as "Product {id}"

**Cause:** `productName` field is missing in line items

**Solution:**
```typescript
// Ensure your API returns productName in line items
// Or add a product lookup:
const enrichedSale = {
  ...sale,
  lineItems: await Promise.all(
    sale.lineItems.map(async (item) => ({
      ...item,
      productName: item.productName || await getProductName(item.productId),
    }))
  ),
};
```

### Problem: Dialog doesn't close on mobile

**Cause:** Accidental touches on backdrop

**Solution:** Already handled in component - backdrop click closes dialog

---

## 📖 Advanced Usage

### Custom Success Handling

```typescript
const handleReturnSuccess = async (returnResponse: ReturnResponseDto) => {
  // 1. Update local state
  setSales((prev) =>
    prev.map((s) =>
      s.id === returnResponse.originalSaleId
        ? { ...s, status: "partially_returned" }
        : s
    )
  );

  // 2. Track analytics
  analytics.track("return_processed", {
    returnId: returnResponse.returnSaleId,
    amount: returnResponse.refundAmount,
  });

  // 3. Print receipt automatically
  try {
    await salesService.printInvoice(returnResponse.returnSaleId);
  } catch (error) {
    // Print failed, but return succeeded
    console.error("Failed to print receipt:", error);
  }

  // 4. Show notification
  toast.success(
    `Return ${returnResponse.returnOrderNumber} processed successfully!`,
    {
      action: {
        label: "Print",
        onClick: () => salesService.printInvoice(returnResponse.returnSaleId),
      },
    }
  );
};
```

### Conditional Return Button

```typescript
const canReturnSale = (sale: SaleDto): boolean => {
  // Check various conditions
  if (sale.isVoided) return false;
  if (sale.status === "returned") return false;
  if (!sale.lineItems || sale.lineItems.length === 0) return false;

  // Check if any items can still be returned
  const hasReturnableItems = sale.lineItems.some(
    (item) => item.quantity > (item.returnQuantity || 0)
  );

  return hasReturnableItems;
};

// In your JSX:
{canReturnSale(sale) && (
  <button onClick={() => handleOpenReturnDialog(sale)}>
    Return Invoice
  </button>
)}
```

---

## 🚀 Performance Tips

### 1. Memoize Expensive Calculations

```typescript
import { useMemo } from "react";

const refundAmount = useMemo(() => {
  const selectedItems = returnItems.filter(item => item.returnQuantity > 0);
  const subtotal = selectedItems.reduce(...);
  // ... calculations
  return totalRefund;
}, [returnItems, sale]);
```

### 2. Debounce API Calls

```typescript
import { useDebounce } from "@/hooks/useDebounce";

const debouncedNotes = useDebounce(returnNotes, 500);
// Save draft to backend with debounced value
```

### 3. Lazy Load Dialog

```typescript
import dynamic from "next/dynamic";

const ReturnInvoiceDialog = dynamic(
  () => import("@/components/branch/sales/ReturnInvoiceDialog"),
  { ssr: false }
);
```

---

## 📞 Support

### Need Help?

- **Documentation:** See implementation plan in `docs/return-invoice/planning/`
- **API Reference:** Check `docs/return-invoice/PHASE-1-COMPLETION-SUMMARY.md`
- **Examples:** Review `docs/return-invoice/QUICK-START-GUIDE.md`

### Found a Bug?

1. Check console for error messages
2. Verify sale data structure
3. Test with different device sizes
4. Review browser compatibility

---

## ✅ Integration Complete!

You're now ready to integrate the Return Invoice Dialog into your application. Follow the quick start guide, test thoroughly, and enjoy the touch-optimized return experience!

**Happy Coding!** 🎉

---

**Document Version:** 1.0
**Last Updated:** 2025-12-29
**Maintained By:** Development Team
