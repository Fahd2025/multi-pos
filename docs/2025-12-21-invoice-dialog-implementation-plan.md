# Implementation Plan - InvoiceDialog Replacement

The goal is to replace the current simplified `NewInvoiceModal` with a comprehensive `InvoiceDialog` that matches the feature set of the legacy `old/src/components/branch/sales/InvoiceDialog.tsx`.

## User Review Required

> [!IMPORTANT]
> The "Negative Stock" logic relies on settings that may not be available in the current frontend context. I will assume default behavior (block negative stock) or mock the settings for now unless `branchService` provides them.

> [!NOTE]
> I will be creating a NEW component `InvoiceDialog.tsx` and updating the Sales Page to use it. `NewInvoiceModal.tsx` will be left unused (or can be deleted later).

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
