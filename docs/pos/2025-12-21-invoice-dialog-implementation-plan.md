# Implementation Plan - InvoiceDialog Replacement

**Status:** 🟡 Phase 1 Complete - Backend & Frontend Infrastructure Ready
**Updated:** 2025-12-21

The goal is to replace the current simplified `NewInvoiceModal` with a comprehensive `InvoiceDialog` that matches the feature set of the legacy `old/src/components/branch/sales/InvoiceDialog.tsx`.

## ✅ Phase 1 Complete (Backend & Frontend Infrastructure)

All backend and frontend infrastructure changes have been completed and verified:
- ✅ Backend DTOs extended to support invoice-level discounts, amount paid, order types
- ✅ Branch settings extended with inventory stock configuration
- ✅ Database migration created for new fields
- ✅ Frontend types updated
- ✅ Customer service created
- ✅ Backend build successful (0 errors)

See [Full Implementation Summary](./2025-12-21-invoice-dialog-implementation-summary.md) for complete details.

## 🔄 Phase 2 Pending (Component Implementation)

> [!NOTE]
> Creating a NEW component `InvoiceDialog.tsx` to replace `NewInvoiceModal`. The old modal will remain for backward compatibility.

## Proposed Changes

### Component Layer

#### [NEW] [InvoiceDialog.tsx](file:///c:/Users/hp/Desktop/nextjs-POS/claude/multi-pos/frontend/components/branch/sales/InvoiceDialog.tsx)

- **UI Structure**:
  - Max-width dialog (screen size appropriate) with 2-column layout.
  - **Left**:
    - Invoice Info (ID, Date).
    - Customer Selection (Searchable select + "Add Customer" triggering `CustomerFormModal`).
    - Product Item Entry (Barcode, Category Filter, Product Select, Quantity).
    - Items Table (Row per item with Qty edit, Remove, Subtotal).
  - **Right**:
    - Order Type (Dine-in, Takeout, etc.).
    - Payment Method.
    - Financial Summary (Subtotal, Discount %/Amt, VAT, Total, Amount Paid, Change).
    - Notes.
    - Submit/Cancel actions.
- **Logic**:
  - `fetchInitialData`: Load Products, Categories, Customers using `inventoryService` and `customerService` (if available) or `salesService`.
  - `calculateTotals`: Real-time calculation of subtotal, tax, discount, grand total.
  - `handleSubmit`: Payload construction matches `CreateSaleDto`.

#### [MODIFY] [page.tsx](file:///c:/Users/hp/Desktop/nextjs-POS/claude/multi-pos/frontend/app/[locale]/branch/sales/page.tsx)

- Replace `NewInvoiceModal` import and usage with `InvoiceDialog`.
- Ensure state management (`isOpen`, `onSuccess`) is compatible.

### Shared Utils

#### [MODIFY] [utils.ts](file:///c:/Users/hp/Desktop/nextjs-POS/claude/multi-pos/frontend/lib/utils.ts)

- Add `formatCurrency(amount: number, currency: string)` helper.

## Verification Plan

### Manual Verification

1.  **Open Dialog**: Click "New Invoice" on Sales page.
2.  **Add Items**:
    - Scan/Enter Barcode (Simulated).
    - Select from Dropdown.
    - Change Quantities.
3.  **Customer**:
    - Select existing customer.
    - Create new customer via sub-dialog (if `CustomerFormModal` integrates easily).
4.  **Financials**:
    - Apply discount.
    - Check tax calculation.
    - Enter "Amount Paid" and check "Change" display.
5.  **Submit**:
    - Create invoice and verify success toast.
    - Verify Table refresh.
