# Return Invoice System - Implementation Plan for Multi-POS Project

**Date:** 2025-12-29
**Project:** Multi-Branch POS System
**Feature:** Complete Return Invoice Management System
**Target:** Touch-Screen Optimized, Multi-Device Support

---

## Executive Summary

This document provides a comprehensive implementation plan for adding a complete return invoice system to the Multi-POS project. The system will support:

- ✅ Full and partial returns
- ✅ Touch-screen optimized interface (responsive design)
- ✅ Multiple printing options (return invoice, original invoice, combined invoice)
- ✅ Reference tracking between original and return invoices
- ✅ Inventory management integration
- ✅ Multi-device support (tablets, phones, desktops)
- ✅ Manager approval workflows

---

## Table of Contents

1. [Current Implementation Analysis](#1-current-implementation-analysis)
2. [Database Schema Requirements](#2-database-schema-requirements)
3. [Backend API Implementation](#3-backend-api-implementation)
4. [Frontend Component Architecture](#4-frontend-component-architecture)
5. [Touch-Screen UI/UX Design](#5-touch-screen-uiux-design)
6. [Printing System](#6-printing-system)
7. [Implementation Phases](#7-implementation-phases)
8. [Code Examples](#8-code-examples)
9. [Testing Checklist](#9-testing-checklist)

---

## 1. Current Implementation Analysis

### Existing Features (Old Project)

**✅ What Works Well:**
- Return API with transaction support
- Inventory rollback (returns stock to inventory)
- Partial and full return support
- Return reason tracking
- Proportional tax and discount calculations
- Return invoice printing

**❌ What Needs Improvement:**
- No touch-screen optimization
- Complex UI for mobile devices
- Limited responsive design
- No combined invoice printing
- Missing reference ID display
- No visual feedback for large touch targets

---

## 2. Database Schema Requirements

### Required Tables/Models

#### Sales Model (Existing - Requires Extension)

```csharp
public class Sales
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } // e.g., "ORD-20251229-123456"
    public string OrderType { get; set; } // "dine-in", "takeout", "delivery"
    public int? CustomerId { get; set; }
    public int UserId { get; set; }
    public int? TableId { get; set; }
    public string? TableNumber { get; set; }
    public int? GuestCount { get; set; }

    // Financial fields
    public decimal Subtotal { get; set; }
    public string? DiscountType { get; set; } // "percentage", "fixed"
    public decimal? DiscountValue { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }

    // Payment
    public string PaymentMethod { get; set; } // "cash", "card", "mobile_payment"
    public decimal? AmountPaid { get; set; }
    public decimal? ChangeGiven { get; set; }

    // Status
    public string Status { get; set; } // "completed", "voided", "returned", "partially_returned"

    // **NEW: Return fields**
    public bool IsReturn { get; set; } = false;
    public DateTime? ReturnDate { get; set; }
    public string? ReturnReason { get; set; } // "damaged", "wrong_item", "customer_request", etc.
    public string? ReturnNotes { get; set; }
    public int? OriginalSalesId { get; set; } // **Reference to original invoice**
    public int? ReturnApprovedBy { get; set; } // Manager user ID

    // Timestamps
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public Customer? Customer { get; set; }
    public User User { get; set; }
    public Table? Table { get; set; }
    public Sales? OriginalSales { get; set; } // **Self-reference**
    public ICollection<SalesItem> Items { get; set; }
    public ICollection<Sales> ReturnedSales { get; set; } // **Reverse navigation**
}
```

#### SalesItem Model (Existing - Requires Extension)

```csharp
public class SalesItem
{
    public int Id { get; set; }
    public int SalesId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }

    // **NEW: Return tracking**
    public int ReturnQuantity { get; set; } = 0; // Track how many returned

    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }

    // **NEW: Item status**
    public string Status { get; set; } = "ordered"; // "ordered", "completed", "returned", "partially_returned"

    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public Sales Sales { get; set; }
    public Product Product { get; set; }
}
```

### Database Migration Requirements

**Migration: Add Return Fields to Sales Table**
```sql
ALTER TABLE Sales ADD IsReturn BIT DEFAULT 0;
ALTER TABLE Sales ADD ReturnDate DATETIME NULL;
ALTER TABLE Sales ADD ReturnReason NVARCHAR(100) NULL;
ALTER TABLE Sales ADD ReturnNotes NVARCHAR(500) NULL;
ALTER TABLE Sales ADD OriginalSalesId INT NULL;
ALTER TABLE Sales ADD ReturnApprovedBy INT NULL;

-- Add foreign key constraint
ALTER TABLE Sales ADD CONSTRAINT FK_Sales_OriginalSales
    FOREIGN KEY (OriginalSalesId) REFERENCES Sales(Id);

-- Add index for faster queries
CREATE INDEX IX_Sales_OriginalSalesId ON Sales(OriginalSalesId);
CREATE INDEX IX_Sales_IsReturn ON Sales(IsReturn);
```

**Migration: Add Return Fields to SalesItem Table**
```sql
ALTER TABLE SalesItem ADD ReturnQuantity INT DEFAULT 0;
ALTER TABLE SalesItem ADD Status NVARCHAR(50) DEFAULT 'ordered';

-- Add index
CREATE INDEX IX_SalesItem_Status ON SalesItem(Status);
```

---

## 3. Backend API Implementation

### API Endpoints

#### 1. Get Sale Details (Existing - Verify)
```
GET /api/v1/sales/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "orderNumber": "ORD-20251229-123456",
    "orderType": "dine-in",
    "status": "completed",
    "isReturn": false,
    "originalSalesId": null,
    "items": [
      {
        "id": 456,
        "productId": 10,
        "quantity": 5,
        "returnQuantity": 0,
        "unitPrice": 15.50,
        "lineTotal": 77.50,
        "status": "ordered",
        "product": {
          "name": "Product Name"
        }
      }
    ]
  }
}
```

#### 2. Process Return (NEW)
```
POST /api/v1/sales/return
```

**Request:**
```json
{
  "originalSalesId": 123,
  "returnReason": "customer_request",
  "returnNotes": "Customer changed mind",
  "items": [
    {
      "salesItemId": 456,
      "productId": 10,
      "returnQuantity": 2,
      "unitPrice": 15.50
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Return processed successfully",
    "returnOrderNumber": "RET-ORD-20251229-123456-1735467890",
    "returnSaleId": 124,
    "refundAmount": 32.23,
    "originalSaleId": 123
  }
}
```

#### 3. Get Return History for Sale (NEW)
```
GET /api/v1/sales/{id}/returns
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 124,
      "orderNumber": "RET-ORD-20251229-123456-1735467890",
      "returnDate": "2025-12-29T10:30:00Z",
      "returnReason": "customer_request",
      "refundAmount": 32.23,
      "items": [...]
    }
  ]
}
```

### Backend Implementation (C# - ASP.NET Core)

**File: `Backend/Services/SalesReturnService.cs`**

```csharp
using Backend.Data;
using Backend.Models;
using Backend.Models.DTOs.Branch.Sales;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public class SalesReturnService
    {
        private readonly BranchDbContext _context;

        public SalesReturnService(BranchDbContext context)
        {
            _context = context;
        }

        public async Task<ReturnResult> ProcessReturnAsync(
            int originalSalesId,
            string returnReason,
            string? returnNotes,
            List<ReturnItemRequest> items,
            int userId)
        {
            // 1. Fetch original sale
            var originalSale = await _context.Sales
                .Include(s => s.Items)
                .Include(s => s.Customer)
                .FirstOrDefaultAsync(s => s.Id == originalSalesId);

            if (originalSale == null)
                throw new Exception("Original sale not found");

            if (originalSale.Status == "voided")
                throw new Exception("Cannot return a voided sale");

            // 2. Validate return items
            foreach (var returnItem in items)
            {
                var originalItem = originalSale.Items
                    .FirstOrDefault(i => i.Id == returnItem.SalesItemId);

                if (originalItem == null)
                    throw new Exception($"Sales item {returnItem.SalesItemId} not found");

                int maxReturnable = originalItem.Quantity - originalItem.ReturnQuantity;
                if (returnItem.ReturnQuantity > maxReturnable)
                    throw new Exception($"Cannot return {returnItem.ReturnQuantity}, max {maxReturnable}");
            }

            // 3. Calculate return totals
            decimal returnSubtotal = items.Sum(i => i.UnitPrice * i.ReturnQuantity);

            decimal discountRate = originalSale.Subtotal > 0
                ? originalSale.DiscountTotal / originalSale.Subtotal
                : 0;
            decimal taxRate = originalSale.Subtotal > 0
                ? originalSale.TaxAmount / originalSale.Subtotal
                : 0;

            decimal returnDiscount = returnSubtotal * discountRate;
            decimal returnTax = returnSubtotal * taxRate;
            decimal returnTotal = returnSubtotal - returnDiscount + returnTax;

            // 4. Generate return order number
            string returnOrderNumber = $"RET-{originalSale.OrderNumber}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

            // 5. Start transaction
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Create return sale
                var returnSale = new Sales
                {
                    OrderNumber = returnOrderNumber,
                    OrderType = originalSale.OrderType,
                    CustomerId = originalSale.CustomerId,
                    UserId = userId,
                    TableId = originalSale.TableId,
                    TableNumber = originalSale.TableNumber,
                    Subtotal = -returnSubtotal,
                    DiscountType = originalSale.DiscountType,
                    DiscountValue = originalSale.DiscountValue,
                    DiscountTotal = -returnDiscount,
                    TaxRate = originalSale.TaxRate,
                    TaxAmount = -returnTax,
                    Total = -returnTotal,
                    PaymentMethod = originalSale.PaymentMethod,
                    Status = "completed",
                    IsReturn = true,
                    ReturnDate = DateTime.UtcNow,
                    ReturnReason = returnReason,
                    ReturnNotes = returnNotes,
                    OriginalSalesId = originalSalesId,
                    ReturnApprovedBy = userId,
                    Notes = $"Return for invoice {originalSale.OrderNumber}",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Sales.Add(returnSale);
                await _context.SaveChangesAsync();

                // Create return items
                foreach (var returnItem in items)
                {
                    var salesItem = new SalesItem
                    {
                        SalesId = returnSale.Id,
                        ProductId = returnItem.ProductId,
                        Quantity = -returnItem.ReturnQuantity,
                        UnitPrice = returnItem.UnitPrice,
                        LineTotal = -(returnItem.UnitPrice * returnItem.ReturnQuantity),
                        Status = "returned",
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.SalesItems.Add(salesItem);

                    // Update original item
                    var originalItem = originalSale.Items
                        .First(i => i.Id == returnItem.SalesItemId);
                    originalItem.ReturnQuantity += returnItem.ReturnQuantity;
                    originalItem.Status = originalItem.ReturnQuantity >= originalItem.Quantity
                        ? "returned"
                        : "partially_returned";

                    // Return stock to inventory
                    var product = await _context.Products.FindAsync(returnItem.ProductId);
                    if (product != null)
                    {
                        product.Quantity += returnItem.ReturnQuantity;
                    }
                }

                // Update original sale status
                bool allReturned = originalSale.Items.All(i => i.ReturnQuantity >= i.Quantity);
                if (allReturned)
                {
                    originalSale.Status = "returned";
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new ReturnResult
                {
                    Success = true,
                    Message = "Return processed successfully",
                    ReturnOrderNumber = returnOrderNumber,
                    ReturnSaleId = returnSale.Id,
                    RefundAmount = returnTotal,
                    OriginalSaleId = originalSalesId
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }

    public class ReturnItemRequest
    {
        public int SalesItemId { get; set; }
        public int ProductId { get; set; }
        public int ReturnQuantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class ReturnResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string ReturnOrderNumber { get; set; }
        public int ReturnSaleId { get; set; }
        public decimal RefundAmount { get; set; }
        public int OriginalSaleId { get; set; }
    }
}
```

**File: `Backend/Program.cs` (Add endpoint)**

```csharp
// Add after existing sales endpoints

app.MapPost("/api/v1/sales/return", async (
    HttpContext context,
    BranchDbContext db,
    SalesReturnService returnService) =>
{
    var userId = context.User.GetUserId(); // Get from JWT

    var request = await context.Request.ReadFromJsonAsync<ReturnRequest>();

    if (request == null)
        return Results.BadRequest(new { error = "Invalid request" });

    try
    {
        var result = await returnService.ProcessReturnAsync(
            request.OriginalSalesId,
            request.ReturnReason,
            request.ReturnNotes,
            request.Items.Select(i => new ReturnItemRequest
            {
                SalesItemId = i.SalesItemId,
                ProductId = i.ProductId,
                ReturnQuantity = i.ReturnQuantity,
                UnitPrice = i.UnitPrice
            }).ToList(),
            userId
        );

        return Results.Ok(new
        {
            success = true,
            data = result
        });
    }
    catch (Exception ex)
    {
        return Results.BadRequest(new
        {
            success = false,
            error = ex.Message
        });
    }
})
.RequireAuthorization()
.WithName("ProcessReturn")
.WithTags("Sales");

app.MapGet("/api/v1/sales/{id}/returns", async (
    int id,
    BranchDbContext db) =>
{
    var returns = await db.Sales
        .Where(s => s.OriginalSalesId == id && s.IsReturn)
        .Include(s => s.Items)
            .ThenInclude(i => i.Product)
        .Include(s => s.Customer)
        .Include(s => s.User)
        .OrderByDescending(s => s.CreatedAt)
        .ToListAsync();

    return Results.Ok(new
    {
        success = true,
        data = returns
    });
})
.RequireAuthorization()
.WithName("GetSaleReturns")
.WithTags("Sales");
```

---

## 4. Frontend Component Architecture

### Component Structure

```
frontend/components/
├── branch/sales/
│   ├── ReturnInvoiceDialog.tsx           (NEW - Main return dialog)
│   ├── ReturnItemSelector.tsx            (NEW - Touch-optimized item selection)
│   ├── ReturnReasonSelector.tsx          (NEW - Return reason picker)
│   ├── ReturnSummary.tsx                 (NEW - Summary display)
│   ├── InvoicePrintPreview.tsx           (NEW - Print preview)
│   └── SalesTable.tsx                    (MODIFY - Add return button)
│
├── pos/
│   └── pos-v2/
│       └── ReturnTransactionDialog.tsx   (NEW - POS return interface)
│
└── invoice/
    ├── ReturnInvoicePrint.tsx            (NEW - Return invoice template)
    ├── OriginalInvoicePrint.tsx          (NEW - Original invoice template)
    └── CombinedInvoicePrint.tsx          (NEW - Combined invoice template)
```

### Key Components

#### 1. ReturnInvoiceDialog.tsx (Touch-Optimized)

**Features:**
- Large touch targets (minimum 44x44px)
- Swipe gestures for mobile
- Visual feedback on tap
- Quantity adjustment with +/- buttons
- Full-screen on mobile devices
- Bottom sheet on tablets

**Props:**
```typescript
interface ReturnInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: number;
  onSuccess?: (returnSale: SaleData) => void;
}
```

#### 2. ReturnItemSelector.tsx (Touch-Optimized)

**Features:**
- Card-based layout for each item
- Large checkbox/toggle switches
- Stepper controls for quantity (50px minimum)
- Visual stock indicators
- Swipe to select on mobile

**Props:**
```typescript
interface ReturnItemSelectorProps {
  items: SaleItem[];
  selectedItems: Map<number, number>; // itemId -> returnQuantity
  onSelectionChange: (itemId: number, quantity: number) => void;
}
```

---

## 5. Touch-Screen UI/UX Design

### Design Principles

1. **Touch Target Size**
   - Minimum: 44x44px (Apple HIG)
   - Recommended: 48x48px (Material Design)
   - Ideal for fat fingers: 56x56px

2. **Spacing**
   - Minimum gap between targets: 8px
   - Recommended: 16px for comfortable tapping

3. **Gestures**
   - Swipe to dismiss dialogs
   - Pull to refresh lists
   - Long press for additional options
   - Pinch to zoom on invoices

4. **Feedback**
   - Haptic feedback on tap (if supported)
   - Visual ripple effect
   - Loading states
   - Success/error animations

### Responsive Breakpoints

```css
/* Mobile (Portrait) */
@media (max-width: 640px) {
  /* Full-screen dialogs */
  /* Stack layout */
  /* Bottom navigation */
}

/* Tablet (Portrait) */
@media (min-width: 641px) and (max-width: 1024px) {
  /* Bottom sheet dialogs */
  /* 2-column grid */
  /* Side navigation */
}

/* Tablet (Landscape) / Desktop */
@media (min-width: 1025px) {
  /* Modal dialogs */
  /* 3+ column grid */
  /* Sidebar navigation */
}
```

### Component Layouts

#### Mobile (< 640px)
```
┌─────────────────┐
│   Top Bar       │ 60px
├─────────────────┤
│                 │
│   Item List     │ Scrollable
│   (Full Width)  │
│                 │
├─────────────────┤
│   Summary       │ Fixed
│   (Sticky)      │ 120px
├─────────────────┤
│   Actions       │ 80px
│   [Cancel][OK]  │
└─────────────────┘
```

#### Tablet (641px - 1024px)
```
┌──────────────────────────────┐
│   Dialog Header              │ 70px
├────────────────┬─────────────┤
│                │             │
│   Item List    │   Summary   │
│   (60%)        │   (40%)     │ Scrollable
│                │   Sticky    │
│                │             │
├────────────────┴─────────────┤
│   Actions [Cancel] [OK]      │ 80px
└──────────────────────────────┘
```

#### Desktop (> 1024px)
```
┌──────────────────────────────────────┐
│   Dialog Header                      │ 80px
├────────────────┬─────────────────────┤
│                │                     │
│   Item List    │   Summary + Actions │
│   (70%)        │   (30%)             │ Scrollable
│                │   Sticky Sidebar    │
│                │                     │
└────────────────┴─────────────────────┘
```

### Touch-Friendly Controls

**Quantity Stepper:**
```tsx
<div className="flex items-center gap-4">
  <button
    className="w-14 h-14 rounded-full bg-red-500 text-white text-2xl font-bold active:scale-95 transition-transform"
    onClick={() => decrement()}
  >
    −
  </button>

  <input
    type="number"
    className="w-20 h-14 text-center text-2xl font-bold border-2 rounded-lg"
    value={quantity}
    onChange={handleChange}
  />

  <button
    className="w-14 h-14 rounded-full bg-green-500 text-white text-2xl font-bold active:scale-95 transition-transform"
    onClick={() => increment()}
  >
    +
  </button>
</div>
```

**Item Card (Touch-Optimized):**
```tsx
<div className="p-4 border-2 rounded-xl active:bg-gray-50 transition-colors min-h-[100px]">
  <div className="flex items-center gap-4">
    {/* Large checkbox */}
    <input
      type="checkbox"
      className="w-8 h-8 rounded-lg"
      checked={selected}
      onChange={handleSelect}
    />

    {/* Product info */}
    <div className="flex-1">
      <h3 className="text-lg font-bold">{product.name}</h3>
      <p className="text-gray-600 text-base">
        Available: {maxReturnable} / Original: {quantity}
      </p>
      <p className="text-xl font-bold text-green-600">
        ${unitPrice.toFixed(2)}
      </p>
    </div>

    {/* Quantity stepper */}
    {selected && <QuantityStepper />}
  </div>
</div>
```

---

## 6. Printing System

### Print Options

1. **Return Invoice Only**
   - Shows returned items
   - Refund amount
   - Reference to original invoice

2. **Original Invoice**
   - Full original invoice
   - Shows what was returned
   - Updated status

3. **Combined Invoice**
   - Original items
   - Returned items (highlighted)
   - Final balance

### Print Templates

#### Template 1: Return Invoice

**File: `frontend/components/invoice/ReturnInvoicePrint.tsx`**

```tsx
interface ReturnInvoicePrintProps {
  returnSale: SaleData;
  originalSale: SaleData;
  branchInfo: BranchInfo;
}

export function ReturnInvoicePrint({
  returnSale,
  originalSale,
  branchInfo
}: ReturnInvoicePrintProps) {
  return (
    <div className="print-container max-w-[80mm] mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-4">
        <img src={branchInfo.logo} className="h-16 mx-auto" />
        <h1 className="text-xl font-bold">{branchInfo.name}</h1>
        <p className="text-sm">{branchInfo.address}</p>
        <p className="text-sm">Tel: {branchInfo.phone}</p>
      </div>

      {/* Return Banner */}
      <div className="bg-red-100 border-l-4 border-red-500 p-3 mb-4">
        <h2 className="text-lg font-bold text-red-700">RETURN INVOICE</h2>
      </div>

      {/* Invoice Info */}
      <div className="mb-4 text-sm">
        <div className="flex justify-between">
          <span>Return #:</span>
          <strong className="text-red-600">{returnSale.orderNumber}</strong>
        </div>
        <div className="flex justify-between">
          <span>Original #:</span>
          <strong>{originalSale.orderNumber}</strong>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{new Date(returnSale.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Reason:</span>
          <span className="capitalize">{returnSale.returnReason?.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Returned Items */}
      <table className="w-full mb-4 text-sm">
        <thead>
          <tr className="border-b border-t">
            <th className="text-left py-2">Item</th>
            <th className="text-right py-2">Qty</th>
            <th className="text-right py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {returnSale.items.map((item, index) => (
            <tr key={index} className="border-b">
              <td className="py-2">{item.product.name}</td>
              <td className="text-right">{Math.abs(item.quantity)}</td>
              <td className="text-right text-red-600 font-semibold">
                ${Math.abs(item.lineTotal).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Refund Summary */}
      <div className="border-t-2 pt-2 text-sm">
        <div className="flex justify-between mb-1">
          <span>Subtotal:</span>
          <span>${Math.abs(returnSale.subtotal).toFixed(2)}</span>
        </div>
        {returnSale.discountTotal > 0 && (
          <div className="flex justify-between mb-1 text-green-600">
            <span>Discount Refund:</span>
            <span>${Math.abs(returnSale.discountTotal).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between mb-1">
          <span>Tax Refund:</span>
          <span>${Math.abs(returnSale.taxAmount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t-2 pt-2">
          <span>TOTAL REFUND:</span>
          <span className="text-red-600">
            ${Math.abs(returnSale.total).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-xs text-gray-600">
        <p>Refund Method: {returnSale.paymentMethod}</p>
        <p>Processed By: {returnSale.user.fullName}</p>
        <p className="mt-2">Thank you for your understanding</p>
      </div>
    </div>
  );
}
```

#### Template 2: Combined Invoice

Shows original items + returned items with final balance.

```tsx
export function CombinedInvoicePrint({
  originalSale,
  returnSales,
  branchInfo
}: CombinedInvoicePrintProps) {
  const totalReturned = returnSales.reduce((sum, ret) =>
    sum + Math.abs(ret.total), 0);
  const finalBalance = originalSale.total - totalReturned;

  return (
    <div className="print-container">
      {/* Header */}
      {/* ... */}

      {/* Original Items */}
      <section className="mb-6">
        <h3 className="font-bold mb-2">ORIGINAL INVOICE</h3>
        <table>
          {/* Original items table */}
        </table>
        <div className="text-right">
          <strong>Original Total: ${originalSale.total.toFixed(2)}</strong>
        </div>
      </section>

      {/* Returned Items */}
      <section className="mb-6 bg-red-50 p-4">
        <h3 className="font-bold text-red-700 mb-2">RETURNED ITEMS</h3>
        {returnSales.map(returnSale => (
          <div key={returnSale.id} className="mb-4">
            <p className="text-sm">Return #: {returnSale.orderNumber}</p>
            <table>
              {/* Return items table */}
            </table>
          </div>
        ))}
        <div className="text-right text-red-600">
          <strong>Total Returned: -${totalReturned.toFixed(2)}</strong>
        </div>
      </section>

      {/* Final Balance */}
      <section className="border-t-4 pt-4">
        <div className="flex justify-between text-2xl font-bold">
          <span>FINAL BALANCE:</span>
          <span className={finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
            ${finalBalance.toFixed(2)}
          </span>
        </div>
      </section>
    </div>
  );
}
```

### Print Implementation

```tsx
import { useReactToPrint } from 'react-to-print';

function PrintManager() {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Invoice-${orderNumber}`,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
      }
    `
  });

  return (
    <>
      <button onClick={handlePrint}>Print</button>
      <div ref={componentRef} className="hidden">
        <ReturnInvoicePrint {...props} />
      </div>
    </>
  );
}
```

---

## 7. Implementation Phases

### Phase 1: Backend Setup (Week 1)
- ✅ Database schema migration
- ✅ Create SalesReturnService
- ✅ Add API endpoints
- ✅ Unit tests for return logic

### Phase 2: Core Frontend (Week 2)
- ✅ ReturnInvoiceDialog component
- ✅ ReturnItemSelector component
- ✅ API integration
- ✅ Basic validation

### Phase 3: Touch Optimization (Week 3)
- ✅ Responsive layouts
- ✅ Touch-friendly controls
- ✅ Gesture support
- ✅ Mobile testing

### Phase 4: Printing System (Week 4)
- ✅ Return invoice template
- ✅ Original invoice template
- ✅ Combined invoice template
- ✅ Print preview
- ✅ PDF export

### Phase 5: Testing & Polish (Week 5)
- ✅ Cross-device testing
- ✅ Performance optimization
- ✅ Accessibility (WCAG 2.1)
- ✅ User acceptance testing

---

## 8. Code Examples

### Complete ReturnInvoiceDialog Component

**File: `frontend/components/branch/sales/ReturnInvoiceDialog.tsx`**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/shared/Button';
import { toast } from 'sonner';

interface ReturnInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: number;
  onSuccess?: () => void;
}

export function ReturnInvoiceDialog({
  open,
  onOpenChange,
  saleId,
  onSuccess
}: ReturnInvoiceDialogProps) {
  const [sale, setSale] = useState<SaleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Map<number, number>>(new Map());
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  // Fetch sale details
  useEffect(() => {
    if (open && saleId) {
      fetchSaleDetails();
    }
  }, [open, saleId]);

  const fetchSaleDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/sales/${saleId}`);
      const result = await response.json();

      if (result.success) {
        setSale(result.data);
      }
    } catch (error) {
      toast.error('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (itemId: number, quantity: number) => {
    const newMap = new Map(selectedItems);
    if (quantity > 0) {
      newMap.set(itemId, quantity);
    } else {
      newMap.delete(itemId);
    }
    setSelectedItems(newMap);
  };

  const handleSubmit = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one item to return');
      return;
    }

    if (!returnReason) {
      toast.error('Please select a return reason');
      return;
    }

    try {
      setLoading(true);

      const items = Array.from(selectedItems.entries()).map(([itemId, qty]) => {
        const item = sale!.items.find(i => i.id === itemId)!;
        return {
          salesItemId: itemId,
          productId: item.productId,
          returnQuantity: qty,
          unitPrice: item.unitPrice
        };
      });

      const response = await fetch('/api/v1/sales/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalSalesId: saleId,
          returnReason,
          returnNotes,
          items
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Return processed successfully');
        onOpenChange(false);
        onSuccess?.();

        // Optional: Trigger print dialog
        // handlePrintReturn(result.data.returnSaleId);
      } else {
        toast.error(result.error || 'Failed to process return');
      }
    } catch (error) {
      toast.error('An error occurred while processing the return');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Return Invoice</h2>
          {sale && (
            <p className="text-gray-600 mt-1">
              Invoice: {sale.orderNumber}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && <p>Loading...</p>}

          {!loading && sale && (
            <>
              {/* Item Selection */}
              <div className="mb-6">
                <h3 className="font-bold mb-4 text-lg">Select Items to Return</h3>
                <div className="space-y-4">
                  {sale.items.map(item => (
                    <ReturnItemCard
                      key={item.id}
                      item={item}
                      selectedQuantity={selectedItems.get(item.id) || 0}
                      onQuantityChange={(qty) => handleItemSelect(item.id, qty)}
                    />
                  ))}
                </div>
              </div>

              {/* Return Reason */}
              <div className="mb-6">
                <label className="block font-bold mb-2">Return Reason *</label>
                <select
                  className="w-full p-4 border-2 rounded-lg text-lg"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                >
                  <option value="">Select a reason</option>
                  <option value="damaged">Damaged Product</option>
                  <option value="wrong_item">Wrong Item</option>
                  <option value="customer_request">Customer Request</option>
                  <option value="quality_issue">Quality Issue</option>
                  <option value="expired">Expired Product</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block font-bold mb-2">Additional Notes (Optional)</label>
                <textarea
                  className="w-full p-4 border-2 rounded-lg text-lg"
                  rows={3}
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                />
              </div>

              {/* Summary */}
              {selectedItems.size > 0 && (
                <ReturnSummary
                  sale={sale}
                  selectedItems={selectedItems}
                />
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t flex gap-4">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1 bg-red-600 hover:bg-red-700"
            onClick={handleSubmit}
            disabled={loading || selectedItems.size === 0 || !returnReason}
          >
            {loading ? 'Processing...' : 'Process Return'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### ReturnItemCard (Touch-Optimized)

```tsx
interface ReturnItemCardProps {
  item: SaleItem;
  selectedQuantity: number;
  onQuantityChange: (quantity: number) => void;
}

function ReturnItemCard({
  item,
  selectedQuantity,
  onQuantityChange
}: ReturnItemCardProps) {
  const maxReturnable = item.quantity - item.returnQuantity;
  const isSelected = selectedQuantity > 0;

  const increment = () => {
    if (selectedQuantity < maxReturnable) {
      onQuantityChange(selectedQuantity + 1);
    }
  };

  const decrement = () => {
    onQuantityChange(Math.max(0, selectedQuantity - 1));
  };

  return (
    <div className={`
      border-2 rounded-xl p-4 transition-all
      ${isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200'}
      ${maxReturnable === 0 ? 'opacity-50' : 'active:scale-[0.98]'}
    `}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          className="w-8 h-8 mt-1 rounded-lg"
          checked={isSelected}
          onChange={(e) => {
            if (e.target.checked && selectedQuantity === 0) {
              onQuantityChange(maxReturnable);
            } else if (!e.target.checked) {
              onQuantityChange(0);
            }
          }}
          disabled={maxReturnable === 0}
        />

        {/* Product Info */}
        <div className="flex-1">
          <h4 className="font-bold text-lg">{item.product.name}</h4>
          <div className="text-base text-gray-600 mt-1">
            <p>Original Qty: {item.quantity}</p>
            <p>Previously Returned: {item.returnQuantity}</p>
            <p className="font-semibold text-green-600">
              Available: {maxReturnable}
            </p>
          </div>
          <p className="text-xl font-bold text-gray-900 mt-2">
            ${item.unitPrice.toFixed(2)} each
          </p>
        </div>

        {/* Quantity Stepper */}
        {isSelected && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="w-14 h-14 rounded-full bg-red-500 text-white text-2xl font-bold
                         active:scale-95 transition-transform disabled:opacity-50"
              onClick={decrement}
              disabled={selectedQuantity === 0}
            >
              −
            </button>

            <input
              type="number"
              className="w-20 h-14 text-center text-2xl font-bold border-2 rounded-lg"
              value={selectedQuantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                onQuantityChange(Math.min(maxReturnable, Math.max(0, val)));
              }}
              min={0}
              max={maxReturnable}
            />

            <button
              type="button"
              className="w-14 h-14 rounded-full bg-green-500 text-white text-2xl font-bold
                         active:scale-95 transition-transform disabled:opacity-50"
              onClick={increment}
              disabled={selectedQuantity >= maxReturnable}
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Return Amount Preview */}
      {isSelected && (
        <div className="mt-4 pt-4 border-t text-right">
          <p className="text-sm text-gray-600">Return Amount:</p>
          <p className="text-2xl font-bold text-red-600">
            ${(selectedQuantity * item.unitPrice).toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 9. Testing Checklist

### Backend Testing

- [ ] Return creates negative sale record
- [ ] Return updates original sale item returnQuantity
- [ ] Return updates inventory (adds stock back)
- [ ] Partial return leaves original sale as "completed"
- [ ] Full return updates original sale to "returned"
- [ ] Cannot return more than available quantity
- [ ] Cannot return voided sales
- [ ] Transaction rollback on error
- [ ] Proportional discount and tax calculations
- [ ] Return order number generation

### Frontend Testing

- [ ] Dialog opens with sale details
- [ ] Items display correctly with available quantities
- [ ] Cannot return more than available
- [ ] Quantity stepper works (increment/decrement)
- [ ] Direct quantity input validation
- [ ] Return reason validation
- [ ] Summary calculates correctly
- [ ] Success toast and dialog close
- [ ] Error handling and display
- [ ] Loading states

### Touch-Screen Testing

- [ ] Touch targets minimum 44x44px
- [ ] No accidental taps
- [ ] Buttons respond to first tap
- [ ] Scroll works smoothly
- [ ] Swipe gestures work
- [ ] No text selection on tap
- [ ] Visual feedback on tap
- [ ] Works on iPad
- [ ] Works on Android tablet
- [ ] Works on iPhone
- [ ] Works on Android phone

### Responsive Testing

- [ ] Mobile portrait (< 640px)
- [ ] Mobile landscape (< 640px)
- [ ] Tablet portrait (641px - 1024px)
- [ ] Tablet landscape (641px - 1024px)
- [ ] Desktop (> 1024px)
- [ ] 4K display (> 2560px)

### Printing Testing

- [ ] Return invoice prints correctly
- [ ] Original invoice shows return status
- [ ] Combined invoice displays both
- [ ] 80mm thermal printer compatible
- [ ] A4 paper compatible
- [ ] Print preview works
- [ ] PDF export works
- [ ] QR code displays
- [ ] Barcode displays
- [ ] Logo displays

### Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast (WCAG AA)
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Form validation accessible

---

## Summary

This implementation plan provides a complete, production-ready system for handling return invoices in your Multi-POS project with:

✅ **Database Schema** - Complete with migrations
✅ **Backend API** - Transaction-safe return processing
✅ **Frontend Components** - Touch-optimized and responsive
✅ **Printing System** - Multiple invoice formats
✅ **Reference Tracking** - Links returns to original sales
✅ **Mobile-First Design** - Works on all devices
✅ **Manager Workflows** - Approval tracking
✅ **Inventory Integration** - Automatic stock adjustments

**Next Steps:**
1. Review and approve this plan
2. Create database migrations
3. Implement backend service
4. Build frontend components
5. Test on multiple devices
6. Deploy to staging
7. User acceptance testing
8. Production deployment

---

**Document Version:** 1.0
**Last Updated:** 2025-12-29
**Author:** Implementation Team
**Status:** Ready for Implementation
