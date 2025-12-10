# Invoice Builder Form Completion Plan

**Date:** December 10, 2025
**Status:** 📋 Planning Phase
**Approach:** JSON Schema + Form Builder (No Drag-and-Drop)
**Priority:** Complete all missing features from original requirements

---

## 📋 Executive Summary

This plan completes the invoice builder to match 100% of the original prompt requirements using the existing form-based approach. All features will use JSON schema configuration and the current form builder UI.

**Total Effort:** 32-43 hours (4-5.5 working days)
**Phases:** 4 main phases covering all missing features

---

## Phase Overview

| Phase | Focus | Hours | Priority |
|-------|-------|-------|----------|
| **Phase 1** | Field Label Editing (Internationalization) | 7-9 | 🔴 Critical |
| **Phase 2** | Missing Invoice Fields | 15-20 | 🔴 Critical |
| **Phase 3** | Invoice Barcode & Print Alignment | 3-4 | 🟠 Important |
| **Phase 4** | Saudi National Address Support | 2-3 | 🟡 Optional |
| **Testing** | Comprehensive testing across all phases | 5-7 | 🔴 Critical |
| **TOTAL** | | **32-43 hours** | |

---

## Phase 1: Field Label Editing & Internationalization

### 🎯 Goal
Enable full customization of ALL field labels in the invoice template to support:
- Complete Arabic invoices
- Any language localization
- Custom business terminology
- Future internationalization needs

### 📊 Current Label Editing Status

| Section | Current State | Action Needed |
|---------|---------------|---------------|
| Header | ❌ No label editing | Add label inputs for all header fields |
| Title | ✅ Fully editable | No changes needed |
| Customer | ✅ Fully editable | No changes needed |
| Metadata | ✅ Fully editable | No changes needed |
| Items | ✅ Fully editable | No changes needed |
| Summary | ✅ Fully editable | No changes needed |
| Footer | ⚠️ Partial | Add label inputs for section headers |

### 🔧 Implementation Tasks

#### Group 1.1: Schema Foundation (1 hour)

**T1.1.1 - Update DEFAULT_INVOICE_SCHEMA with header labels**
- File: `frontend/types/invoice-template.types.ts`
- Location: Header section config
- Add the following label fields:
  ```typescript
  {
    id: "header",
    type: "header",
    order: 1,
    visible: true,
    config: {
      showLogo: true,
      showBranchName: true,
      branchNameLabel: "Branch Name",          // NEW
      showAddress: true,
      addressLabel: "Address",                  // NEW
      showPhone: true,
      phoneLabel: "Phone",                      // NEW
      showVatNumber: true,
      vatNumberLabel: "VAT Number",             // NEW
      showCRN: true,
      crnLabel: "CR Number",                    // NEW
      alignment: "center"
    }
  }
  ```

**T1.1.2 - Update DEFAULT_INVOICE_SCHEMA with footer labels**
- File: `frontend/types/invoice-template.types.ts`
- Location: Footer section config
- Add the following label fields:
  ```typescript
  {
    id: "footer",
    type: "footer",
    order: 7,
    visible: true,
    config: {
      showZatcaQR: true,
      zatcaQRLabel: "Scan for e-Invoice",      // NEW
      showNotes: true,
      notesLabel: "Notes",                      // NEW
      notesText: "Thank you for your business!",
      showPoweredBy: false,
      poweredByText: ""
    }
  }
  ```

**T1.1.3 - Update backend seeder templates**
- File: `Backend/Data/Branch/InvoiceTemplateSeeder.cs`
- Update `CreateThermal58mmTemplate()` - Add all new label fields
- Update `CreateThermal80mmTemplate()` - Add all new label fields
- Update `CreateA4Template()` - Add all new label fields
- Use English defaults for all labels

#### Group 1.2: Builder UI - Header Section (1.5 hours)

**T1.2.1 - Update create builder header UI**
- File: `frontend/app/[locale]/branch/settings/invoice-builder/page.tsx`
- Location: `renderSectionFields()` method, case "header"
- Current: Only checkboxes for show/hide
- Change to: Checkbox + text input for each field

UI Pattern for each field:
```tsx
{/* Branch Name */}
<div>
  <label className="flex items-center gap-2 mb-1">
    <input
      type="checkbox"
      checked={section.config?.showBranchName ?? true}
      onChange={(e) =>
        updateSectionConfig(section.id, { showBranchName: e.target.checked })
      }
    />
    <span className="text-sm font-medium">Show Branch Name</span>
  </label>
  {section.config?.showBranchName && (
    <input
      type="text"
      value={section.config?.branchNameLabel || "Branch Name"}
      onChange={(e) =>
        updateSectionConfig(section.id, { branchNameLabel: e.target.value })
      }
      className="mt-1 w-full px-3 py-1 text-sm border rounded"
      placeholder="Label for Branch Name"
    />
  )}
</div>
```

Apply this pattern for:
- Branch Name (`branchNameLabel`)
- Address (`addressLabel`)
- Phone (`phoneLabel`)
- VAT Number (`vatNumberLabel`)
- CR Number (`crnLabel`)

**T1.2.2 - Update edit builder header UI**
- File: `frontend/app/[locale]/branch/settings/invoice-builder/[id]/page.tsx`
- Copy exact changes from T1.2.1 (same code structure)

#### Group 1.3: Builder UI - Footer Section (1 hour)

**T1.3.1 - Update create builder footer UI**
- File: `frontend/app/[locale]/branch/settings/invoice-builder/page.tsx`
- Location: `renderSectionFields()` method, case "footer"

Add label inputs:
```tsx
{/* ZATCA QR Code */}
<div>
  <label className="flex items-center gap-2 mb-1">
    <input
      type="checkbox"
      checked={section.config?.showZatcaQR ?? true}
      onChange={(e) =>
        updateSectionConfig(section.id, { showZatcaQR: e.target.checked })
      }
    />
    <span className="text-sm font-medium">Show ZATCA QR Code</span>
  </label>
  {section.config?.showZatcaQR && (
    <input
      type="text"
      value={section.config?.zatcaQRLabel || "Scan for e-Invoice"}
      onChange={(e) =>
        updateSectionConfig(section.id, { zatcaQRLabel: e.target.value })
      }
      className="mt-1 w-full px-3 py-1 text-sm border rounded"
      placeholder="Label for QR Code"
    />
  )}
</div>

{/* Notes Section */}
<div>
  <label className="flex items-center gap-2 mb-1">
    <input
      type="checkbox"
      checked={section.config?.showNotes ?? true}
      onChange={(e) =>
        updateSectionConfig(section.id, { showNotes: e.target.checked })
      }
    />
    <span className="text-sm font-medium">Show Notes</span>
  </label>
  {section.config?.showNotes && (
    <>
      <input
        type="text"
        value={section.config?.notesLabel || "Notes"}
        onChange={(e) =>
          updateSectionConfig(section.id, { notesLabel: e.target.value })
        }
        className="mt-1 w-full px-3 py-1 text-sm border rounded"
        placeholder="Section Label"
      />
      <textarea
        value={section.config?.notesText || ""}
        onChange={(e) =>
          updateSectionConfig(section.id, { notesText: e.target.value })
        }
        rows={2}
        className="mt-1 w-full px-3 py-2 border rounded"
        placeholder="Notes content"
      />
    </>
  )}
</div>
```

**T1.3.2 - Update edit builder footer UI**
- File: `frontend/app/[locale]/branch/settings/invoice-builder/[id]/page.tsx`
- Copy exact changes from T1.3.1

#### Group 1.4: Preview Component Updates (1.5-2 hours)

**T1.4.1 - Update InvoicePreview header rendering**
- File: `frontend/components/invoice/InvoicePreview.tsx`
- Location: `renderHeader()` method

Replace all hardcoded labels with dynamic labels from config:

```tsx
// BEFORE
{config.showBranchName && data.branchName && (
  <div className="font-bold">
    {data.branchName}
  </div>
)}
{config.showPhone && data.phone && (
  <div>Phone: {data.phone}</div>
)}

// AFTER
{config.showBranchName && data.branchName && (
  <div className="font-bold">
    {config.branchNameLabel && <span>{config.branchNameLabel}: </span>}
    {data.branchName}
  </div>
)}
{config.showPhone && data.phone && (
  <div>
    {config.phoneLabel || "Phone"}: {data.phone}
  </div>
)}
```

Update for all header fields:
- Branch Name (`branchNameLabel`)
- Address (`addressLabel`)
- Phone (`phoneLabel`)
- VAT Number (`vatNumberLabel`)
- CR Number (`crnLabel`)

**T1.4.2 - Update InvoicePreview footer rendering**
- File: `frontend/components/invoice/InvoicePreview.tsx`
- Location: `renderFooter()` method

Update QR code section:
```tsx
// BEFORE
{config.showZatcaQR && data.zatcaQrCode && (
  <div className="text-center">
    <p className="text-xs mb-1">Scan for e-Invoice</p>
    <QRCodeDisplay value={data.zatcaQrCode} size={128} />
  </div>
)}

// AFTER
{config.showZatcaQR && data.zatcaQrCode && (
  <div className="text-center">
    <p className="text-xs mb-1">{config.zatcaQRLabel || "Scan for e-Invoice"}</p>
    <QRCodeDisplay value={data.zatcaQrCode} size={128} />
  </div>
)}
```

Update notes section:
```tsx
// BEFORE
{config.showNotes && config.notesText && (
  <div className="text-center text-sm mt-2">
    <p className="font-medium mb-1">Notes:</p>
    <p>{config.notesText}</p>
  </div>
)}

// AFTER
{config.showNotes && config.notesText && (
  <div className="text-center text-sm mt-2">
    <p className="font-medium mb-1">{config.notesLabel || "Notes"}:</p>
    <p>{config.notesText}</p>
  </div>
)}
```

#### Group 1.5: Testing (2 hours)

**T1.5.1 - Test default English template**
- Create new template without changing labels
- Verify all default labels appear
- Preview and print
- Verify output correctness

**T1.5.2 - Test full Arabic template**
- Create new template "Arabic 80mm Invoice"
- Change ALL labels to Arabic:

**Header Labels:**
- Branch Name → اسم الفرع
- Address → العنوان
- Phone → الهاتف
- VAT Number → الرقم الضريبي
- CR Number → رقم السجل التجاري

**Title:**
- Standard Tax Invoice → فاتورة ضريبية
- Simplified Tax Invoice → فاتورة ضريبية مبسطة

**Customer Fields:**
- Customer Name → اسم العميل
- VAT Number → الرقم الضريبي
- Phone → الهاتف

**Metadata Fields:**
- Invoice # → رقم الفاتورة
- Date → التاريخ
- Cashier → أمين الصندوق

**Items Columns:**
- Item → الصنف
- Qty → الكمية
- Price → السعر
- Total → الإجمالي

**Summary Fields:**
- Subtotal → المجموع الفرعي
- Discount → الخصم
- VAT (15%) → ضريبة القيمة المضافة
- Total → الإجمالي

**Footer Labels:**
- Scan for e-Invoice → امسح للفاتورة الإلكترونية
- Notes → ملاحظات

- Save template and set as active
- Preview invoice
- Verify ALL Arabic labels render correctly
- Print test invoice
- Verify printed output

**T1.5.3 - Test mixed language template**
- Create template with some English, some Arabic
- Verify both languages render correctly

**T1.5.4 - Test backward compatibility**
- Load existing templates (created before this update)
- Verify they still work with default labels
- Edit and save old template
- Verify labels don't break

**Phase 1 Total Time: 7-9 hours**

---

## Phase 2: Missing Invoice Fields

### 🎯 Goal
Add all missing fields from original requirements to achieve complete invoice functionality.

### 📋 Missing Fields Summary

| Category | Missing Fields | Priority |
|----------|---------------|----------|
| Metadata | Order Number, Price Includes/Excludes VAT Label | High |
| Items Table | Barcode, Unit of Measurement, Discount, VAT, Item Notes | High |
| Summary | Paid Amount, Change Returned | Medium |
| Footer | Order Type, Payment Method | High |

### 🔧 Implementation Tasks

#### Group 2.1: Backend - Sale Entity Updates (3-4 hours)

**T2.1.1 - Add Order Number field**
- File: `Backend/Models/Entities/Branch/Sale.cs`
- Add property:
  ```csharp
  /// <summary>
  /// Optional order number (separate from invoice number)
  /// </summary>
  public string? OrderNumber { get; set; }
  ```
- Create migration:
  ```bash
  cd Backend
  dotnet ef migrations add AddOrderNumberToSales --context BranchDbContext
  ```

**T2.1.2 - Add Order Type enum and field**
- File: `Backend/Models/Entities/Branch/Sale.cs`
- Add enum before class:
  ```csharp
  public enum OrderType
  {
      TakeOut = 0,
      DineIn = 1,
      Delivery = 2
  }
  ```
- Add property to Sale class:
  ```csharp
  /// <summary>
  /// Type of order (Take Out, Dine In, Delivery)
  /// </summary>
  public OrderType? OrderType { get; set; }
  ```
- Create migration:
  ```bash
  dotnet ef migrations add AddOrderTypeToSales --context BranchDbContext
  ```

**T2.1.3 - Add Payment Method enum and field**
- File: `Backend/Models/Entities/Branch/Sale.cs`
- Add enum:
  ```csharp
  public enum PaymentMethod
  {
      Cash = 0,
      Card = 1,
      MobilePayment = 2,
      BankTransfer = 3,
      Multiple = 4
  }
  ```
- Add property:
  ```csharp
  /// <summary>
  /// Payment method used for this sale
  /// </summary>
  public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
  ```
- Create migration:
  ```bash
  dotnet ef migrations add AddPaymentMethodToSales --context BranchDbContext
  ```

**T2.1.4 - Add Paid and Change fields**
- File: `Backend/Models/Entities/Branch/Sale.cs`
- Add properties:
  ```csharp
  /// <summary>
  /// Amount paid by customer (useful for cash payments)
  /// </summary>
  public decimal? AmountPaid { get; set; }

  /// <summary>
  /// Change returned to customer (calculated: AmountPaid - Total)
  /// </summary>
  public decimal? ChangeReturned { get; set; }
  ```
- Create migration:
  ```bash
  dotnet ef migrations add AddPaidAndChangeToSales --context BranchDbContext
  ```

**T2.1.5 - Add Barcode and Unit to Line Items**
- File: `Backend/Models/Entities/Branch/SaleLineItem.cs`
- Add properties:
  ```csharp
  /// <summary>
  /// Product barcode
  /// </summary>
  public string? Barcode { get; set; }

  /// <summary>
  /// Unit of measurement (e.g., "Piece", "Kg", "Liter")
  /// </summary>
  public string? UnitOfMeasurement { get; set; }

  /// <summary>
  /// Optional notes for this line item
  /// </summary>
  public string? Notes { get; set; }
  ```
- Create migration:
  ```bash
  dotnet ef migrations add AddBarcodeUnitNotesToLineItems --context BranchDbContext
  ```

**T2.1.6 - Run all migrations**
```bash
cd Backend
dotnet ef database update --context BranchDbContext
```

#### Group 2.2: Backend - DTO Updates (2-3 hours)

**T2.2.1 - Update SaleDto**
- File: `Backend/Models/DTOs/Branch/Sales/SaleDto.cs`
- Add properties:
  ```csharp
  public string? OrderNumber { get; set; }
  public OrderType? OrderType { get; set; }
  public PaymentMethod PaymentMethod { get; set; }
  public decimal? AmountPaid { get; set; }
  public decimal? ChangeReturned { get; set; }
  ```

**T2.2.2 - Update CreateSaleDto**
- File: `Backend/Models/DTOs/Branch/Sales/CreateSaleDto.cs`
- Add properties:
  ```csharp
  public string? OrderNumber { get; set; }
  public OrderType? OrderType { get; set; }
  public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
  public decimal? AmountPaid { get; set; }
  ```
- Add computed property or service method to calculate ChangeReturned

**T2.2.3 - Update SaleDetailsDto**
- File: `Backend/Models/DTOs/Branch/Sales/SaleDetailsDto.cs`
- Add same properties as SaleDto

**T2.2.4 - Update SaleLineItemDto**
- File: `Backend/Models/DTOs/Branch/Sales/SaleLineItemDto.cs`
- Add properties:
  ```csharp
  public string? Barcode { get; set; }
  public string? UnitOfMeasurement { get; set; }
  public string? Notes { get; set; }
  ```

**T2.2.5 - Update SalesService AutoMapper config**
- File: `Backend/Services/Branch/SalesService.cs` (or AutoMapper profile)
- Add mappings for new fields:
  ```csharp
  CreateMap<Sale, SaleDto>()
    .ForMember(dest => dest.OrderNumber, opt => opt.MapFrom(src => src.OrderNumber))
    .ForMember(dest => dest.OrderType, opt => opt.MapFrom(src => src.OrderType))
    .ForMember(dest => dest.PaymentMethod, opt => opt.MapFrom(src => src.PaymentMethod))
    .ForMember(dest => dest.AmountPaid, opt => opt.MapFrom(src => src.AmountPaid))
    .ForMember(dest => dest.ChangeReturned, opt => opt.MapFrom(src => src.ChangeReturned));

  CreateMap<SaleLineItem, SaleLineItemDto>()
    .ForMember(dest => dest.Barcode, opt => opt.MapFrom(src => src.Barcode))
    .ForMember(dest => dest.UnitOfMeasurement, opt => opt.MapFrom(src => src.UnitOfMeasurement))
    .ForMember(dest => dest.Notes, opt => opt.MapFrom(src => src.Notes));
  ```

#### Group 2.3: Frontend - Schema Updates (2-3 hours)

**T2.3.1 - Add Order Number to metadata section**
- File: `frontend/types/invoice-template.types.ts`
- Update DEFAULT_INVOICE_SCHEMA metadata fields array:
  ```typescript
  {
    id: "invoice-meta",
    type: "metadata",
    order: 4,
    visible: true,
    config: {
      fields: [
        { key: "invoiceNumber", label: "Invoice #", visible: true },
        { key: "orderNumber", label: "Order #", visible: true }, // NEW
        { key: "date", label: "Date", visible: true },
        { key: "cashier", label: "Cashier", visible: true },
      ],
    },
  }
  ```

**T2.3.2 - Add Price Includes VAT label to metadata section**
- File: `frontend/types/invoice-template.types.ts`
- Update metadata config:
  ```typescript
  config: {
    fields: [ /* existing fields */ ],
    // NEW: Price VAT label configuration
    showPriceIncludesVat: true,
    priceIncludesLabel: "Price includes VAT (15%)",
    priceExcludesLabel: "Price excludes VAT (15%)",
  }
  ```

**T2.3.3 - Add new columns to items table**
- File: `frontend/types/invoice-template.types.ts`
- Update items table columns:
  ```typescript
  {
    id: "items-table",
    type: "items",
    order: 5,
    visible: true,
    config: {
      columns: [
        { key: "name", label: "Item", visible: true, width: "25%" },
        { key: "barcode", label: "Barcode", visible: false, width: "12%" }, // NEW
        { key: "unit", label: "Unit", visible: false, width: "8%" },        // NEW
        { key: "quantity", label: "Qty", visible: true, width: "10%" },
        { key: "price", label: "Price", visible: true, width: "15%" },
        { key: "discount", label: "Discount", visible: false, width: "10%" }, // NEW
        { key: "vat", label: "VAT", visible: false, width: "10%" },          // NEW
        { key: "total", label: "Total", visible: true, width: "15%" },
      ],
      showItemNotes: false, // NEW: Toggle for showing notes row under each item
    },
  }
  ```

**T2.3.4 - Add Paid and Change to summary section**
- File: `frontend/types/invoice-template.types.ts`
- Update summary fields:
  ```typescript
  {
    id: "summary",
    type: "summary",
    order: 6,
    visible: true,
    config: {
      fields: [
        { key: "subtotal", label: "Subtotal", visible: true },
        { key: "discount", label: "Discount", visible: true },
        { key: "vatAmount", label: "VAT (15%)", visible: true },
        { key: "total", label: "Total", visible: true, highlight: true },
        { key: "paid", label: "Paid", visible: false },     // NEW
        { key: "change", label: "Change", visible: false }, // NEW
      ],
    },
  }
  ```

**T2.3.5 - Add Order Type and Payment Method to footer**
- File: `frontend/types/invoice-template.types.ts`
- Update footer config:
  ```typescript
  {
    id: "footer",
    type: "footer",
    order: 7,
    visible: true,
    config: {
      showZatcaQR: true,
      zatcaQRLabel: "Scan for e-Invoice",
      showNotes: true,
      notesLabel: "Notes",
      notesText: "Thank you for your business!",
      // NEW: Order type configuration
      showOrderType: true,
      orderTypeLabel: "Order Type",
      // NEW: Payment method configuration
      showPaymentMethod: true,
      paymentMethodLabel: "Payment Method",
      showPoweredBy: false,
      poweredByText: "",
    },
  }
  ```

**T2.3.6 - Update backend seeder with new fields**
- File: `Backend/Data/Branch/InvoiceTemplateSeeder.cs`
- Update all three template methods (`CreateThermal58mmTemplate`, `CreateThermal80mmTemplate`, `CreateA4Template`)
- Add all new fields to their JSON schemas
- Use appropriate defaults (visible=false for optional fields)

#### Group 2.4: Builder UI Updates (3-4 hours)

**T2.4.1 - Add Price VAT Label to metadata section builder**
- Files: `invoice-builder/page.tsx` and `invoice-builder/[id]/page.tsx`
- Location: `renderSectionFields()` method, case "metadata"
- After the fields array rendering, add:
  ```tsx
  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
    <h4 className="text-sm font-medium mb-2">Price VAT Label:</h4>
    <label className="flex items-center gap-2 mb-2">
      <input
        type="checkbox"
        checked={section.config?.showPriceIncludesVat ?? true}
        onChange={(e) =>
          updateSectionConfig(section.id, { showPriceIncludesVat: e.target.checked })
        }
      />
      <span className="text-sm">Show Price VAT Label</span>
    </label>
    {section.config?.showPriceIncludesVat && (
      <div className="space-y-2 ml-6">
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Label when price includes VAT:
          </label>
          <input
            type="text"
            value={section.config?.priceIncludesLabel || "Price includes VAT (15%)"}
            onChange={(e) =>
              updateSectionConfig(section.id, { priceIncludesLabel: e.target.value })
            }
            className="w-full px-3 py-1 text-sm border rounded"
            placeholder="e.g., Price includes VAT (15%)"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Label when price excludes VAT:
          </label>
          <input
            type="text"
            value={section.config?.priceExcludesLabel || "Price excludes VAT (15%)"}
            onChange={(e) =>
              updateSectionConfig(section.id, { priceExcludesLabel: e.target.value })
            }
            className="w-full px-3 py-1 text-sm border rounded"
            placeholder="e.g., Price excludes VAT (15%)"
          />
        </div>
      </div>
    )}
  </div>
  ```

**T2.4.2 - Add Item Notes toggle to items section builder**
- Files: `invoice-builder/page.tsx` and `invoice-builder/[id]/page.tsx`
- Location: `renderSectionFields()` method, case "items"
- After the columns array rendering, add:
  ```tsx
  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={section.config?.showItemNotes ?? false}
        onChange={(e) =>
          updateSectionConfig(section.id, { showItemNotes: e.target.checked })
        }
      />
      <span className="text-sm">Show item notes (as expandable row)</span>
    </label>
  </div>
  ```

**T2.4.3 - Add Order Type configuration to footer section builder**
- Files: `invoice-builder/page.tsx` and `invoice-builder/[id]/page.tsx`
- Location: `renderSectionFields()` method, case "footer"
- Add after existing footer fields:
  ```tsx
  {/* Order Type */}
  <div>
    <label className="flex items-center gap-2 mb-1">
      <input
        type="checkbox"
        checked={section.config?.showOrderType ?? true}
        onChange={(e) =>
          updateSectionConfig(section.id, { showOrderType: e.target.checked })
        }
      />
      <span className="text-sm font-medium">Show Order Type</span>
    </label>
    {section.config?.showOrderType && (
      <input
        type="text"
        value={section.config?.orderTypeLabel || "Order Type"}
        onChange={(e) =>
          updateSectionConfig(section.id, { orderTypeLabel: e.target.value })
        }
        className="mt-1 w-full px-3 py-1 text-sm border rounded"
        placeholder="Label for Order Type"
      />
    )}
  </div>
  ```

**T2.4.4 - Add Payment Method configuration to footer section builder**
- Files: `invoice-builder/page.tsx` and `invoice-builder/[id]/page.tsx`
- Location: `renderSectionFields()` method, case "footer"
- Add after order type:
  ```tsx
  {/* Payment Method */}
  <div>
    <label className="flex items-center gap-2 mb-1">
      <input
        type="checkbox"
        checked={section.config?.showPaymentMethod ?? true}
        onChange={(e) =>
          updateSectionConfig(section.id, { showPaymentMethod: e.target.checked })
        }
      />
      <span className="text-sm font-medium">Show Payment Method</span>
    </label>
    {section.config?.showPaymentMethod && (
      <input
        type="text"
        value={section.config?.paymentMethodLabel || "Payment Method"}
        onChange={(e) =>
          updateSectionConfig(section.id, { paymentMethodLabel: e.target.value })
        }
        className="mt-1 w-full px-3 py-1 text-sm border rounded"
        placeholder="Label for Payment Method"
      />
    )}
  </div>
  ```

**T2.4.5 - Verify new fields appear in builder**
- Check that Order Number appears in metadata fields list (automatically, no extra code needed)
- Check that Barcode, Unit, Discount, VAT appear in items columns list (automatically)
- Check that Paid and Change appear in summary fields list (automatically)

#### Group 2.5: Preview Component Updates (3-4 hours)

**T2.5.1 - Update renderMetadata() for Order Number**
- File: `frontend/components/invoice/InvoicePreview.tsx`
- Location: `renderMetadata()` method
- Add rendering for orderNumber field (similar to existing fields)
- Use field visibility and custom labels from config

**T2.5.2 - Add Price VAT Label rendering to metadata**
- File: `frontend/components/invoice/InvoicePreview.tsx`
- Location: `renderMetadata()` method
- After other metadata fields, add:
  ```tsx
  {config.showPriceIncludesVat && (
    <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
      {schema.priceIncludesVat
        ? (config.priceIncludesLabel || "Price includes VAT (15%)")
        : (config.priceExcludesLabel || "Price excludes VAT (15%)")}
    </div>
  )}
  ```

**T2.5.3 - Update renderItems() for new columns**
- File: `frontend/components/invoice/InvoicePreview.tsx`
- Location: `renderItems()` method
- Add rendering for:
  - Barcode column (if visible)
  - Unit column (if visible)
  - Discount column (if visible and item has discount)
  - VAT column (if visible)
- All should respect visibility settings and use custom labels

Example for barcode:
```tsx
{columns.find(c => c.key === 'barcode' && c.visible) && (
  <th className="text-left">{getColumnLabel('barcode')}</th>
)}
// ... in tbody:
{columns.find(c => c.key === 'barcode' && c.visible) && (
  <td>{item.barcode || '-'}</td>
)}
```

**T2.5.4 - Add item notes rendering**
- File: `frontend/components/invoice/InvoicePreview.tsx`
- Location: `renderItems()` method
- If `config.showItemNotes` is true and item has notes:
  ```tsx
  {config.showItemNotes && item.notes && (
    <tr className="border-t border-gray-200">
      <td colSpan={visibleColumnsCount} className="text-xs text-gray-600 italic pl-8 py-1">
        Note: {item.notes}
      </td>
    </tr>
  )}
  ```

**T2.5.5 - Update renderSummary() for Paid/Change**
- File: `frontend/components/invoice/InvoicePreview.tsx`
- Location: `renderSummary()` method
- Add rendering for Paid and Change fields (if visible)
- Follow same pattern as existing summary fields
- Use dynamic labels from config

**T2.5.6 - Update renderFooter() for Order Type and Payment Method**
- File: `frontend/components/invoice/InvoicePreview.tsx`
- Location: `renderFooter()` method
- Add rendering before QR code:
  ```tsx
  {/* Order Type */}
  {config.showOrderType && data.orderType && (
    <div className="text-sm mb-2">
      <span className="font-medium">{config.orderTypeLabel || "Order Type"}:</span>
      <span className="ml-2">{formatOrderType(data.orderType)}</span>
    </div>
  )}

  {/* Payment Method */}
  {config.showPaymentMethod && data.paymentMethod && (
    <div className="text-sm mb-2">
      <span className="font-medium">{config.paymentMethodLabel || "Payment Method"}:</span>
      <span className="ml-2">{formatPaymentMethod(data.paymentMethod)}</span>
    </div>
  )}
  ```

- Add helper functions:
  ```typescript
  const formatOrderType = (type: number): string => {
    const types = ["Take Out", "Dine In", "Delivery"];
    return types[type] || "Unknown";
  };

  const formatPaymentMethod = (method: number): string => {
    const methods = ["Cash", "Card", "Mobile Payment", "Bank Transfer", "Multiple"];
    return methods[method] || "Unknown";
  };
  ```

#### Group 2.6: Sales Page Integration (2-3 hours)

**T2.6.1 - Update sales page invoice data transformation**
- File: `frontend/app/[locale]/branch/sales/[id]/page.tsx`
- Location: `handlePrintInvoice()` function
- Add new fields to transformedData object:

```typescript
const transformedData = {
  // ... existing fields ...

  // NEW: Order information
  orderNumber: sale.orderNumber || undefined,
  orderType: sale.orderType,

  // NEW: Payment information
  paymentMethod: sale.paymentMethod,
  amountPaid: sale.amountPaid,
  changeReturned: sale.changeReturned,

  // Line Items - add new fields
  items: sale.lineItems.map((item) => ({
    name: item.productName,
    barcode: item.barcode || undefined,          // NEW
    unit: item.unitOfMeasurement || undefined,   // NEW
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount || 0,                 // NEW
    vat: item.taxAmount || 0,                     // NEW
    lineTotal: item.lineTotal,
    notes: item.notes || undefined,               // NEW
  })),

  // ... rest of existing code ...
};
```

**T2.6.2 - Update InvoiceData interface**
- File: `frontend/components/invoice/InvoicePreview.tsx` or separate types file
- Add new fields to InvoiceData interface:
  ```typescript
  interface InvoiceData {
    // ... existing fields ...

    // Order information
    orderNumber?: string;
    orderType?: number;

    // Payment information
    paymentMethod?: number;
    amountPaid?: number;
    changeReturned?: number;

    // Line items
    items: Array<{
      name: string;
      barcode?: string;           // NEW
      unit?: string;              // NEW
      quantity: number;
      unitPrice: number;
      discount?: number;          // NEW
      vat?: number;               // NEW
      lineTotal: number;
      notes?: string;             // NEW
    }>;

    // ... rest of existing fields ...
  }
  ```

#### Group 2.7: Testing (3-4 hours)

**T2.7.1 - Test Order Number field**
- Create sale with order number
- Verify appears in invoice if visible
- Test hiding order number field
- Test custom label

**T2.7.2 - Test Price Includes VAT label**
- Create template with priceIncludesVat=true
- Verify "Price includes VAT" label shows
- Edit template, set priceIncludesVat=false
- Verify "Price excludes VAT" label shows
- Test custom labels

**T2.7.3 - Test new Items Table columns**
- Add product with barcode and unit
- Create sale
- Enable Barcode column in template
- Verify barcode appears in invoice
- Enable Unit column
- Verify unit appears
- Test Discount and VAT columns
- Test custom labels for all columns

**T2.7.4 - Test Item Notes**
- Add item with notes to sale
- Enable "Show item notes" in template
- Verify notes appear under item row
- Test disabling notes display

**T2.7.5 - Test Paid and Change fields**
- Create cash sale
- Set AmountPaid = 100, Total = 85
- Enable Paid and Change fields in template
- Verify Paid shows 100
- Verify Change shows 15
- Test with exact payment (no change)
- Test custom labels

**T2.7.6 - Test Order Type**
- Create sales with each order type (Take Out, Dine In, Delivery)
- Enable Order Type in template
- Verify correct type displays
- Test custom label
- Test in both English and Arabic templates

**T2.7.7 - Test Payment Method**
- Create sales with different payment methods
- Enable Payment Method in template
- Verify correct method displays (Cash, Card, etc.)
- Test custom label
- Test visibility toggle

**T2.7.8 - End-to-end workflow test**
- Create complete sale with all new fields populated
- Create template with all new fields visible and custom labels
- Print invoice
- Verify ALL fields appear correctly with custom labels
- Test on different paper sizes (58mm, 80mm, A4)

**Phase 2 Total Time: 15-20 hours**

---

## Phase 3: Invoice Barcode & Print Alignment

### 🎯 Goal
- Add invoice number barcode to footer (separate from ZATCA QR)
- Verify and fix print alignment (0,0 positioning)

### 🔧 Implementation Tasks

#### Group 3.1: Invoice Number Barcode (2-3 hours)

**T3.1.1 - Install barcode library**
```bash
cd frontend
npm install react-barcode
npm install @types/react-barcode --save-dev
```

**T3.1.2 - Create BarcodeDisplay component**
- File: `frontend/components/invoice/BarcodeDisplay.tsx`
- Create new file:
  ```typescript
  "use client";

  import { useEffect, useRef } from "react";
  import Barcode from "react-barcode";

  interface BarcodeDisplayProps {
    value: string;
    format?: "CODE128" | "CODE39" | "EAN13" | "EAN8";
    height?: number;
    width?: number;
    displayValue?: boolean;
    className?: string;
  }

  export default function BarcodeDisplay({
    value,
    format = "CODE128",
    height = 40,
    width = 2,
    displayValue = true,
    className = "",
  }: BarcodeDisplayProps) {
    if (!value) return null;

    return (
      <div className={`inline-block ${className}`}>
        <Barcode
          value={value}
          format={format}
          height={height}
          width={width}
          displayValue={displayValue}
        />
      </div>
    );
  }
  ```

**T3.1.3 - Add barcode config to footer schema**
- File: `frontend/types/invoice-template.types.ts`
- Update footer config in DEFAULT_INVOICE_SCHEMA:
  ```typescript
  {
    id: "footer",
    type: "footer",
    order: 7,
    visible: true,
    config: {
      // ... existing config ...

      // NEW: Invoice barcode configuration
      showInvoiceBarcode: false,
      invoiceBarcodeLabel: "Invoice Number",
      invoiceBarcodeFormat: "CODE128",
      invoiceBarcodeHeight: 40,

      // ... rest of config ...
    },
  }
  ```

**T3.1.4 - Add barcode UI to footer builder**
- Files: `invoice-builder/page.tsx` and `invoice-builder/[id]/page.tsx`
- Location: `renderSectionFields()` method, case "footer"
- Add after other footer fields:
  ```tsx
  {/* Invoice Number Barcode */}
  <div>
    <label className="flex items-center gap-2 mb-1">
      <input
        type="checkbox"
        checked={section.config?.showInvoiceBarcode ?? false}
        onChange={(e) =>
          updateSectionConfig(section.id, { showInvoiceBarcode: e.target.checked })
        }
      />
      <span className="text-sm font-medium">Show Invoice Number Barcode</span>
    </label>
    {section.config?.showInvoiceBarcode && (
      <div className="ml-6 space-y-2">
        <input
          type="text"
          value={section.config?.invoiceBarcodeLabel || "Invoice Number"}
          onChange={(e) =>
            updateSectionConfig(section.id, { invoiceBarcodeLabel: e.target.value })
          }
          className="w-full px-3 py-1 text-sm border rounded"
          placeholder="Label for Barcode"
        />
        <select
          value={section.config?.invoiceBarcodeFormat || "CODE128"}
          onChange={(e) =>
            updateSectionConfig(section.id, { invoiceBarcodeFormat: e.target.value })
          }
          className="w-full px-3 py-1 text-sm border rounded"
        >
          <option value="CODE128">CODE128</option>
          <option value="CODE39">CODE39</option>
          <option value="EAN13">EAN13</option>
          <option value="EAN8">EAN8</option>
        </select>
        <input
          type="number"
          min="20"
          max="100"
          value={section.config?.invoiceBarcodeHeight || 40}
          onChange={(e) =>
            updateSectionConfig(section.id, { invoiceBarcodeHeight: parseInt(e.target.value) })
          }
          className="w-full px-3 py-1 text-sm border rounded"
          placeholder="Barcode Height (px)"
        />
      </div>
    )}
  </div>
  ```

**T3.1.5 - Add barcode rendering to preview footer**
- File: `frontend/components/invoice/InvoicePreview.tsx`
- Location: `renderFooter()` method
- Add import:
  ```typescript
  import BarcodeDisplay from "./BarcodeDisplay";
  ```
- Add rendering:
  ```tsx
  {/* Invoice Number Barcode */}
  {config.showInvoiceBarcode && data.invoiceNumber && (
    <div className="text-center mb-4">
      <p className="text-xs mb-1">{config.invoiceBarcodeLabel || "Invoice Number"}</p>
      <BarcodeDisplay
        value={data.invoiceNumber}
        format={config.invoiceBarcodeFormat || "CODE128"}
        height={config.invoiceBarcodeHeight || 40}
        width={2}
        displayValue={true}
      />
    </div>
  )}
  ```

**T3.1.6 - Update backend seeder with barcode config**
- File: `Backend/Data/Branch/InvoiceTemplateSeeder.cs`
- Add barcode fields to footer config in all three templates (default to false/hidden)

#### Group 3.2: Print Alignment Verification (1 hour)

**T3.2.1 - Add print CSS for 0,0 alignment**
- File: `frontend/components/invoice/InvoicePreview.tsx`
- Add or update style tag/CSS module:
  ```css
  @media print {
    @page {
      margin: 0;
      padding: 0;
      size: auto;
    }

    body {
      margin: 0 !important;
      padding: 0 !important;
    }

    .invoice-preview {
      position: absolute;
      top: 0;
      left: 0;
      margin: 0;
      padding: 0;
      width: 100%;
    }

    /* Hide non-invoice elements when printing */
    .no-print {
      display: none !important;
    }
  }
  ```

**T3.2.2 - Test print alignment**
- Print test invoices on different paper sizes
- Verify content starts at 0,0 (top-left corner)
- Test on Chrome, Firefox, Safari, Edge
- Document any browser-specific quirks

#### Group 3.3: Testing (1 hour)

**T3.3.1 - Test barcode generation**
- Enable invoice barcode in template
- Create sale
- Print invoice
- Verify barcode generates correctly
- Test with barcode scanner if available

**T3.3.2 - Test different barcode formats**
- Create templates with CODE128, CODE39, EAN13
- Generate invoices
- Verify all formats work
- Test scanning if possible

**T3.3.3 - Test barcode height configuration**
- Set different heights (20px, 40px, 60px, 100px)
- Verify barcode scales correctly
- Test on thermal printers

**T3.3.4 - Test print alignment**
- Print on 58mm thermal paper
- Print on 80mm thermal paper
- Print on A4 paper
- Verify 0,0 alignment on all paper sizes
- Measure physical output if possible

**Phase 3 Total Time: 3-4 hours**

---

## Phase 4: Saudi National Address Support (Optional)

### 🎯 Goal
Add structured Saudi national address format to customer section.

**Note:** This phase is OPTIONAL and can be implemented later if needed.

### 📋 National Address Structure

Saudi national address format:
- Building Number (رقم المبنى)
- Street Name (اسم الشارع)
- District (الحي)
- City (المدينة)
- Postal Code (الرمز البريدي) - 5 digits
- Additional Number (الرقم الإضافي) - 4 digits

Display format: `Building St., District, City 12345-1234`

### 🔧 Implementation Tasks (Brief Overview)

**T4.1 - Backend Customer Entity**
- Add national address fields to Customer entity
- Create migration

**T4.2 - Backend DTOs**
- Update CustomerDto with new fields

**T4.3 - Frontend Customer Form**
- Add national address input fields
- Add validation for postal code (5 digits) and additional number (4 digits)

**T4.4 - Invoice Schema**
- Add national address fields to customer section config
- Add visibility toggles for each field

**T4.5 - Invoice Preview**
- Format and display national address in customer section
- Use proper formatting: "Building St., District, City 12345-1234"

**T4.6 - Testing**
- Test with real Saudi addresses
- Verify formatting is correct
- Test with Arabic labels

**Phase 4 Total Time: 2-3 hours** (if implemented)

---

## Testing Strategy

### 📋 Comprehensive Testing Plan

#### Test Phase T.1: Unit Testing (1-2 hours)
- [ ] Schema validation tests
- [ ] Field visibility logic tests
- [ ] Label fallback tests (undefined → default)
- [ ] Enum conversion tests (OrderType, PaymentMethod)
- [ ] Barcode validation tests

#### Test Phase T.2: Integration Testing (2-3 hours)
- [ ] Template CRUD operations
- [ ] Sales integration with all new fields
- [ ] Print functionality with new fields
- [ ] Backward compatibility with old templates
- [ ] Migration testing (run migrations, verify data integrity)

#### Test Phase T.3: User Acceptance Testing (2-3 hours)
- [ ] **English Invoice Test**
  - Create template with default English labels
  - Create sale with all fields populated
  - Print invoice
  - Verify all fields display correctly

- [ ] **Arabic Invoice Test**
  - Create template with all Arabic labels
  - Create sale with all fields populated
  - Print invoice
  - Verify all Arabic labels display correctly
  - Verify no text overflow or rendering issues

- [ ] **Mixed Language Test**
  - Create template with mix of English and Arabic
  - Verify both render correctly
  - Test RTL vs LTR handling

- [ ] **All Paper Sizes Test**
  - Test on 58mm thermal
  - Test on 80mm thermal
  - Test on A4
  - Test on custom size (e.g., 100mm x 200mm)

- [ ] **All New Fields Test**
  - Order Number: Visible and printing
  - Price VAT Label: Correct label based on setting
  - Barcode Column: Displaying correctly
  - Unit Column: Displaying correctly
  - Discount Column: Showing per-item discounts
  - VAT Column: Showing per-item VAT
  - Item Notes: Expandable and readable
  - Paid Amount: Showing correctly
  - Change: Calculated correctly
  - Order Type: All three types display correctly
  - Payment Method: All five methods display correctly
  - Invoice Barcode: Generates and scans correctly

#### Test Phase T.4: Browser & Device Testing (1-2 hours)
- [ ] **Desktop Browsers**
  - Chrome (Windows, Mac)
  - Firefox (Windows, Mac)
  - Safari (Mac)
  - Edge (Windows)

- [ ] **Mobile Browsers**
  - Safari (iOS)
  - Chrome (Android)
  - Test on phone and tablet

- [ ] **Print Testing**
  - Test print dialog in each browser
  - Verify print preview shows correctly
  - Verify printed output matches preview

**Total Testing Time: 5-7 hours**

---

## Implementation Schedule

### Week 1: Foundation (Days 1-3)

**Day 1: Label Editing (3-4 hours)**
- Morning: Schema updates (T1.1.1 - T1.1.3)
- Afternoon: Header builder UI (T1.2.1 - T1.2.2)

**Day 2: Label Editing Continued (3-4 hours)**
- Morning: Footer builder UI (T1.3.1 - T1.3.2)
- Afternoon: Preview component updates (T1.4.1 - T1.4.2)

**Day 3: Label Testing + Backend Fields Start (4-5 hours)**
- Morning: Label editing testing (T1.5.1 - T1.5.4)
- Afternoon: Backend Sale entity updates (T2.1.1 - T2.1.4)

### Week 2: Missing Fields (Days 4-6)

**Day 4: Backend Completion (4-5 hours)**
- Morning: Line item updates + migrations (T2.1.5 - T2.1.6)
- Afternoon: DTO updates (T2.2.1 - T2.2.5)

**Day 5: Frontend Schema + Builder UI (5-6 hours)**
- Morning: Schema updates for all new fields (T2.3.1 - T2.3.6)
- Afternoon: Builder UI updates (T2.4.1 - T2.4.5)

**Day 6: Preview + Integration (5-6 hours)**
- Morning: Preview component updates (T2.5.1 - T2.5.6)
- Afternoon: Sales page integration (T2.6.1 - T2.6.2)

### Week 3: Barcode, Testing & Completion (Days 7-8)

**Day 7: Barcode + Print Alignment (3-4 hours)**
- Morning: Invoice barcode implementation (T3.1.1 - T3.1.6)
- Afternoon: Print alignment verification (T3.2.1 - T3.2.2)

**Day 8: Comprehensive Testing (5-7 hours)**
- Morning: Unit + Integration testing (T.1 - T.2)
- Afternoon: UAT + Browser testing (T.3 - T.4)

**Optional Day 9: National Address (2-3 hours)**
- Implement Phase 4 if required

---

## Success Criteria

### ✅ Phase 1 Success
- [ ] All invoice field labels editable
- [ ] Arabic invoice renders correctly
- [ ] English invoice works with defaults
- [ ] Mixed language supported
- [ ] Backward compatible with existing templates
- [ ] Zero TypeScript/build errors

### ✅ Phase 2 Success
- [ ] Order number displays on invoice
- [ ] Price VAT label shows correctly
- [ ] All new items table columns work (barcode, unit, discount, VAT, notes)
- [ ] Paid and change fields calculate correctly
- [ ] Order type displays correctly (Take Out, Dine In, Delivery)
- [ ] Payment method displays correctly (Cash, Card, etc.)
- [ ] All new fields respect visibility toggles
- [ ] All new fields use custom labels
- [ ] Sales integration complete

### ✅ Phase 3 Success
- [ ] Invoice number barcode generates correctly
- [ ] Barcode scans successfully (if scanner available)
- [ ] Different barcode formats work (CODE128, CODE39, etc.)
- [ ] Print starts at 0,0 (top-left)
- [ ] Print alignment verified on all paper sizes

### ✅ Overall Success
- [ ] 100% feature completion vs original prompt
- [ ] All missing fields implemented
- [ ] Full Arabic support
- [ ] All tests passing
- [ ] Zero regressions
- [ ] Documentation complete

---

## Risk Management

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Database migration failures | Low | High | Test migrations on copy of data first; keep backups |
| Backward compatibility breaks | Medium | High | Extensive testing with old templates; maintain defaults |
| Arabic text rendering issues | Low | Medium | Test with real Arabic data; verify fonts |
| Barcode scanning failures | Low | Medium | Test multiple barcode formats; provide fallbacks |
| Print alignment inconsistencies | Medium | Medium | Test across browsers; document quirks |
| Performance degradation | Low | Low | Keep rendering optimized; lazy load if needed |

---

## Rollback Plan

If critical issues arise:

1. **Database Rollback**
   ```bash
   cd Backend
   dotnet ef database update [previous-migration] --context BranchDbContext
   ```

2. **Frontend Rollback**
   - Git revert to previous stable commit
   - Deploy previous version
   - Default labels will be used

3. **Feature Flags** (Optional Future Enhancement)
   - Add feature flags to enable/disable new fields
   - Allows gradual rollout
   - Can disable problematic features without full rollback

---

## Documentation Requirements

### User Documentation
- [ ] **Arabic Invoice Creation Guide**
  - Step-by-step screenshots
  - Common Arabic translations reference
  - Example Arabic template

- [ ] **Invoice Field Reference**
  - Description of every field
  - When to use each field
  - Best practices

- [ ] **Print Setup Guide**
  - Thermal printer setup
  - Paper size configuration
  - Troubleshooting common issues

### Developer Documentation
- [ ] **Schema Reference**
  - Complete JSON schema documentation
  - All field descriptions
  - Example schemas

- [ ] **API Documentation**
  - New Sale fields
  - New Line Item fields
  - Enum definitions

- [ ] **Migration Guide**
  - How to run migrations
  - What each migration does
  - Rollback procedures

### Implementation Documentation
- [ ] **Phase Summary Documents**
  - One document per phase
  - Files modified list
  - Before/after screenshots
  - Test results

---

## Deliverables

### Code Deliverables
- [ ] Updated backend entities and migrations
- [ ] Updated DTOs with new fields
- [ ] Updated frontend schema
- [ ] Updated builder UI components
- [ ] Updated preview component
- [ ] Updated sales integration
- [ ] New barcode component
- [ ] Print CSS updates
- [ ] Updated seeder templates

### Documentation Deliverables
- [ ] This implementation plan
- [ ] User guides (Arabic invoices, field reference)
- [ ] Developer documentation (schema, API, migrations)
- [ ] Implementation summary per phase
- [ ] Test results and coverage report

### Testing Deliverables
- [ ] Test plan execution results
- [ ] Browser compatibility matrix
- [ ] Print test results
- [ ] Performance benchmarks
- [ ] Known issues list (if any)

---

## Conclusion

This plan provides a complete roadmap to finish the invoice builder to 100% of the original requirements using the JSON schema + form builder approach.

**Total Effort:** 32-43 hours (4-5.5 working days)

**Phases:**
1. Label Editing: 7-9 hours ✅
2. Missing Fields: 15-20 hours ✅
3. Barcode & Print: 3-4 hours ✅
4. National Address: 2-3 hours (optional)
5. Testing: 5-7 hours ✅

**Key Benefits:**
- Complete feature parity with original prompt
- Full internationalization support
- All missing fields implemented
- Maintains form-based UI (no drag-and-drop complexity)
- Uses "Branch" terminology throughout
- Backward compatible

**Next Steps:**
1. Review and approve this plan
2. Answer any clarification questions (see below)
3. Begin Phase 1 implementation
4. Track progress using todo list
5. Update this document with actual progress

---

## Questions for Clarification

Before starting implementation:

1. **Order Number**: Auto-generate or manual entry? Format?

2. **Change Calculation**: Automatic (AmountPaid - Total) or allow manual override?

3. **Barcode Default Format**: CODE128 recommended? Or other preference?

4. **National Address**: Implement Phase 4 now or later?

5. **Payment Method**: Allow custom payment methods in future? Or fixed list is sufficient?

6. **Item Notes**: Always show as expanded row? Or make collapsible/expandable?

7. **Testing Priority**: Focus on thermal printers or all paper sizes equally?

8. **Arabic RTL**: Just labels or full RTL layout for Arabic templates? (Recommend labels only for now)

---

**Document Status:** Draft - Awaiting Approval
**Created:** December 10, 2025
**Last Updated:** December 10, 2025
**Version:** 1.0

---

*This plan completes the invoice builder to match 100% of original requirements using form-based configuration and JSON schema approach. No drag-and-drop complexity, proper terminology (Branch not Company), full internationalization support.*
