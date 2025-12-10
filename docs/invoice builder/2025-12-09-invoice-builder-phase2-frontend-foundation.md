# Sales Invoice Builder - Phase 2 Frontend Foundation

**Date:** December 9, 2025
**Phase:** Phase 2 - Frontend Foundation
**Status:** ⚠️ Partial - Infrastructure Complete, UI Pending
**Build Status:** ✅ Success (TypeScript passed, 0 errors)

---

## 📋 Overview

Successfully completed the frontend infrastructure layer for the Sales Invoice Builder, including NPM packages, TypeScript types, and API service layer. The foundation is now ready for UI component development.

---

## ✅ Completed Tasks (5/14 - Infrastructure Complete)

### 1. NPM Package Installation

- ✅ Installed `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` for drag-and-drop
- ✅ Installed `react-to-print` for invoice printing
- ✅ Installed `qrcode` and `@types/qrcode` for QR code generation
- ✅ All packages compatible with Next.js 16 and React 19

### 2. TypeScript Types Layer

- ✅ Created comprehensive type definitions in `frontend/types/invoice-template.types.ts`
- ✅ Defined all DTOs matching backend contracts
- ✅ Created default invoice schema template
- ✅ Created section palette definitions

### 3. API Service Layer

- ✅ Created `invoice-template.service.ts` with full CRUD operations
- ✅ Created `branch-info.service.ts` for branch data management
- ✅ Both services follow existing patterns and conventions

### 4. Build Verification

- ✅ Frontend build succeeded with no TypeScript errors
- ✅ All new types and services compile correctly

---

## 📁 Files Created (3 files)

### TypeScript Types (1 file)

```
frontend/types/
└── invoice-template.types.ts  (340 lines)
    ├── PaperSize enum
    ├── InvoiceTemplate interfaces
    ├── BranchInfo interfaces
    ├── InvoiceSchema types
    ├── DEFAULT_INVOICE_SCHEMA
    └── SECTION_PALETTE definitions
```

### API Services (2 files)

```
frontend/services/
├── invoice-template.service.ts  (125 lines)
│   ├── getTemplates()
│   ├── getActiveTemplate()
│   ├── createTemplate()
│   ├── updateTemplate()
│   ├── deleteTemplate()
│   ├── setActiveTemplate()
│   ├── duplicateTemplate()
│   ├── previewTemplate()
│   └── generateInvoice()
└── branch-info.service.ts  (44 lines)
    ├── getBranchInfo()
    └── upsertBranchInfo()
```

---

## 📦 NPM Packages Installed

| Package            | Version | Purpose                           |
| ------------------ | ------- | --------------------------------- |
| @dnd-kit/core      | Latest  | Drag-and-drop core functionality  |
| @dnd-kit/sortable  | Latest  | Sortable lists and sections       |
| @dnd-kit/utilities | Latest  | Helper utilities for dnd-kit      |
| react-to-print     | Latest  | Print React components            |
| qrcode             | Latest  | QR code generation                |
| @types/qrcode      | Latest  | TypeScript definitions for qrcode |

---

## 🔧 TypeScript Type Definitions

### Core Types

**PaperSize Enum:**

```typescript
enum PaperSize {
  Thermal58mm = 0,
  Thermal80mm = 1,
  A4 = 2,
  Custom = 3,
}
```

**Invoice Template:**

```typescript
interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  paperSize: PaperSize;
  customWidth?: number;
  customHeight?: number;
  schema: string; // JSON
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
```

**Branch Info:**

```typescript
interface BranchInfo {
  id: string;
  branchName: string;
  branchNameAr?: string;
  logoUrl?: string;
  vatNumber?: string;
  commercialRegNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Schema Types

**Invoice Schema:**

```typescript
interface InvoiceSchema {
  version: string;
  paperSize: string;
  priceIncludesVat: boolean;
  sections: InvoiceSchemaSection[];
  styling?: InvoiceStyling;
}
```

**Section Types:**

- `header` - Branch logo and information
- `title` - Invoice title (Standard/Simplified)
- `customer` - Customer details
- `metadata` - Invoice number, date, cashier
- `items` - Line items table
- `summary` - Totals and VAT
- `footer` - QR code, notes, powered-by
- `custom` - User-defined content

---

## 🌐 API Service Methods

### Invoice Template Service

| Method                       | Endpoint                                       | Description              |
| ---------------------------- | ---------------------------------------------- | ------------------------ |
| `getTemplates()`             | GET /api/v1/invoice-templates                  | Get all templates        |
| `getActiveTemplate()`        | GET /api/v1/invoice-templates/active           | Get active template      |
| `getTemplateById(id)`        | GET /api/v1/invoice-templates/{id}             | Get template by ID       |
| `createTemplate(dto)`        | POST /api/v1/invoice-templates                 | Create new template      |
| `updateTemplate(id, dto)`    | PUT /api/v1/invoice-templates/{id}             | Update template          |
| `deleteTemplate(id)`         | DELETE /api/v1/invoice-templates/{id}          | Delete template          |
| `setActiveTemplate(id)`      | POST /api/v1/invoice-templates/{id}/set-active | Set as active            |
| `duplicateTemplate(id, dto)` | POST /api/v1/invoice-templates/{id}/duplicate  | Duplicate template       |
| `previewTemplate(dto)`       | POST /api/v1/invoice-templates/preview         | Preview with sample data |
| `generateInvoice(saleId)`    | POST /api/v1/invoices/{saleId}/generate        | Generate invoice HTML    |

### Branch Info Service

| Method                  | Endpoint                | Description               |
| ----------------------- | ----------------------- | ------------------------- |
| `getBranchInfo()`       | GET /api/v1/branch-info | Get branch information    |
| `upsertBranchInfo(dto)` | PUT /api/v1/branch-info | Create/update branch info |

---

## 📊 Default Invoice Schema

The default schema includes 7 pre-configured sections:

1. **Header Section** - Branch logo, name, address, contact, VAT, CRN
2. **Title Section** - Dynamic title (Standard/Simplified Tax Invoice)
3. **Customer Section** - Customer name, VAT number, phone
4. **Metadata Section** - Invoice number, date, cashier
5. **Items Table** - Item name, quantity, price, total (4 columns)
6. **Summary Section** - Subtotal, discount, VAT, total
7. **Footer Section** - ZATCA QR code, notes, thank you message

**Schema Features:**

- ✅ Fully customizable section visibility
- ✅ Configurable field labels
- ✅ Flexible styling options
- ✅ Section ordering support
- ✅ Multi-language support (English/Arabic)

---

## 🧪 Build Verification

### Frontend Build Results

```
▲ Next.js 16.0.3 (Turbopack)
✓ Compiled successfully in 4.1s
✓ TypeScript checks passed
✓ All types valid
Build succeeded
```

### Type Safety

- ✅ All enums match backend definitions
- ✅ All DTOs match backend contracts
- ✅ Service methods properly typed
- ✅ No TypeScript errors or warnings

---

## ⚠️ Pending Tasks (UI Components)

The following UI components still need to be implemented:

### Critical Pages (High Priority)

1. **Branch Settings Page** (`/branch/settings/branch-info`)

   - Form for branch information (name, VAT, CRN, address, etc.)
   - Logo upload functionality
   - Save/update branch details
   - **Prerequisite for templates**

2. **Template Management List Page** (`/branch/settings/invoice-templates`)

   - List all templates with thumbnails
   - Active template indicator
   - Actions: Edit, Duplicate, Delete, Set Active
   - Create new template button

3. **Invoice Builder Page** (`/branch/settings/invoice-builder`)

   - **Option A: Simple Form-Based Builder** (Recommended for MVP)

     - Form-based section configuration
     - Field visibility toggles
     - Label customization inputs
     - Paper size selector
     - Save template functionality

   - **Option B: Full Drag-and-Drop Builder** (Advanced)
     - Three-panel layout (palette, canvas, properties)
     - dnd-kit integration for section reordering
     - Inline field editing
     - Live preview pane
     - Visual template designer

### Supporting Components

4. **Invoice Preview Component**

   - Renders invoice HTML from schema
   - Shows realistic sample data
   - Responsive to schema changes
   - Print button integration

5. **Print Dialog Component**

   - Paper size selector
   - Print preview
   - Print button with react-to-print

6. **QR Code Generator Component**
   - Uses qrcode package
   - Displays ZATCA QR codes
   - Base64 image generation

### Integration Points

7. **Sales Page Integration**

   - Add "Print Invoice" button to sales page
   - Fetch active template on sale completion
   - Generate and display invoice
   - Print functionality

8. **Navigation Updates**
   - Add "Invoice Templates" to settings menu
   - Add "Branch Info" to settings menu
   - Add breadcrumbs for new pages

---

## 🎯 Recommended Implementation Path

### Phase 2A: Branch Setup (1-2 hours)

1. Create Branch Settings page with form
2. Add logo upload functionality
3. Test branch info CRUD operations

### Phase 2B: Template Management (2-3 hours)

1. Create template list page
2. Add template card components
3. Implement activate/duplicate/delete actions
4. Add create template wizard

### Phase 2C: Simple Builder (4-6 hours)

1. Create form-based builder page
2. Add section visibility toggles
3. Add field label customization
4. Add paper size selector
5. Implement save/update functionality

### Phase 2D: Preview & Print (2-3 hours)

1. Create invoice preview component
2. Integrate ZATCA QR code generator
3. Add print functionality with react-to-print
4. Test with different paper sizes

### Phase 2E: Integration (1-2 hours)

1. Add navigation menu items
2. Integrate with sales page
3. End-to-end testing
4. Bug fixes and polish

**Total Estimated Effort:** 10-16 hours for complete Phase 2

---

## 🚀 Alternative: Full Drag-and-Drop Builder

For the advanced drag-and-drop builder (Option B), additional work required:

### Additional Components Needed

1. **SectionPalette Component**

   - Draggable section items
   - Visual section icons
   - Drag overlay effects

2. **InvoiceCanvas Component**

   - Drop zone for sections
   - Sortable section list
   - Section drag handles
   - Visual section borders

3. **FieldCustomizer Panel**

   - Property editing sidebar
   - Field visibility toggles
   - Label input fields
   - Styling options

4. **dnd-kit Integration**
   - DndContext setup
   - Sortable section array
   - Drag sensors configuration
   - Collision detection

**Additional Effort:** +6-10 hours for full drag-and-drop

---

## 💡 Implementation Recommendations

### For MVP (Minimum Viable Product)

**Recommend:** Form-Based Builder (Option A)

- ✅ Faster to implement (4-6 hours vs 10-16 hours)
- ✅ Easier to maintain and debug
- ✅ Sufficient for most use cases
- ✅ Can upgrade to drag-and-drop later

### For Full Feature Set

**Recommend:** Drag-and-Drop Builder (Option B)

- ✅ Better user experience
- ✅ More intuitive and visual
- ✅ Matches original requirements
- ⚠️ More complex implementation
- ⚠️ Requires more testing

---

## 📝 Code Examples

### Using Invoice Template Service

```typescript
import invoiceTemplateService from "@/services/invoice-template.service";
import { DEFAULT_INVOICE_SCHEMA } from "@/types/invoice-template.types";

// Get all templates
const templates = await invoiceTemplateService.getTemplates();

// Create new template
const newTemplate = await invoiceTemplateService.createTemplate({
  name: "Default 80mm",
  description: "Standard 80mm thermal receipt",
  paperSize: PaperSize.Thermal80mm,
  schema: JSON.stringify(DEFAULT_INVOICE_SCHEMA),
  setAsActive: true,
});

// Preview template
const html = await invoiceTemplateService.previewTemplate({
  name: "Preview",
  paperSize: PaperSize.Thermal80mm,
  schema: JSON.stringify(schema),
});
```

### Using Branch Info Service

```typescript
import branchInfoService from "@/services/branch-info.service";

// Get branch info
const branch = await branchInfoService.getBranchInfo();

// Update branch info
const updated = await branchInfoService.upsertBranchInfo({
  branchName: "My Store",
  vatNumber: "123456789012345",
  phone: "+966 50 123 4567",
  address: "123 Main St, Riyadh",
});
```

---

## 🧩 Component Structure (Proposed)

```
frontend/components/invoice-builder/
├── BranchInfoForm.tsx         // Branch settings form
├── TemplateCard.tsx            // Template list item
├── TemplateList.tsx            // Template management page
├── InvoiceBuilder.tsx          // Main builder (form or drag-drop)
├── SectionPalette.tsx          // Section palette (drag-drop only)
├── SectionEditor.tsx           // Section configuration form
├── FieldCustomizer.tsx         // Field properties panel
├── InvoicePreview.tsx          // Live preview component
├── PrintDialog.tsx             // Print dialog with options
└── QRCodeDisplay.tsx           // ZATCA QR code component

frontend/app/[locale]/branch/settings/
├── branch-info/
│   └── page.tsx                // Branch settings page
├── invoice-templates/
│   └── page.tsx                // Template list page
└── invoice-builder/
    ├── page.tsx                // Builder page (new template)
    └── [id]/
        └── page.tsx            // Builder page (edit template)
```

---

## 📊 Code Statistics (Phase 2 Foundation)

| Category  | Files | Lines of Code |
| --------- | ----- | ------------- |
| Types     | 1     | 340           |
| Services  | 2     | 169           |
| **Total** | **3** | **~509**      |

**Plus:**

- 6 NPM packages installed
- 0 TypeScript errors
- Build time: 4.1s

---

## 🎯 Success Criteria (Foundation)

- ✅ All NPM packages installed and compatible
- ✅ TypeScript types match backend DTOs exactly
- ✅ API services follow existing patterns
- ✅ Frontend build succeeds with no errors
- ✅ Code quality maintained
- ✅ Documentation complete

---

## 📚 Next Steps

### Immediate (Branch Setup)

1. Create Branch Settings page
2. Test branch info CRUD
3. Add logo upload

### Short Term (Template Management)

1. Create template list page
2. Add basic template operations
3. Implement template activation

### Medium Term (Builder)

1. Choose builder approach (form vs drag-drop)
2. Implement chosen builder
3. Add preview and print
4. Integrate with sales

### Long Term (Advanced Features)

1. Upgrade to drag-and-drop builder (if started with form)
2. Add template export to HTML
3. Add custom CSS injection
4. Add more section types
5. Implement ZATCA Phase 2

---

## 🔍 Technical Notes

### Architecture Decisions

1. **Service Layer Pattern:** Singleton services matching existing codebase
2. **Type Safety:** Full TypeScript coverage with strict mode
3. **Default Schema:** Comprehensive starter template included
4. **Paper Sizes:** Enum-based with helper functions

### Integration Points

- ✅ Backend API fully compatible
- ✅ Types match backend exactly
- ✅ Services ready for immediate use
- ⚠️ UI components not yet implemented

### Known Limitations

1. **No UI Yet:** Foundation only, components pending
2. **No Preview:** Requires InvoicePreview component
3. **No Printing:** Requires PrintDialog component
4. **No Logo Upload:** Requires file upload implementation

---

## ⏱️ Time Estimates

**Foundation Complete:** 2 hours
**Remaining for Full Phase 2:**

- Branch Settings: 1-2 hours
- Template Management: 2-3 hours
- Simple Builder: 4-6 hours
- Preview & Print: 2-3 hours
- Integration: 1-2 hours
  **Total Remaining:** 10-16 hours

**Or with Drag-and-Drop Builder:** 16-26 hours total

---

## 📖 References

- **Backend Implementation:** `docs/2025-12-09-invoice-builder-backend-implementation.md`
- **Full Plan:** `docs/2025-12-09-sales-invoice-builder-plan.md`
- **dnd-kit Docs:** https://docs.dndkit.com/
- **react-to-print Docs:** https://github.com/gregnb/react-to-print

---

**Phase 2 Foundation completed on:** December 9, 2025
**Build status:** ✅ Success
**Ready for:** UI Component Development
**Recommended next:** Branch Settings Page

---

_This implementation follows the project conventions outlined in CLAUDE.md and maintains consistency with existing codebase patterns._
