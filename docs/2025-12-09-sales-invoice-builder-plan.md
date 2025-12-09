# Sales Invoice Builder - Implementation Plan

**Date:** December 9, 2025
**Feature:** Comprehensive Sales Invoice Builder for POS System
**Status:** Planning Phase

---

## 📋 Executive Summary

This document outlines the complete implementation plan for a flexible, drag-and-drop sales invoice builder tailored for point-of-sale (POS) systems. The builder will support multiple paper sizes, ZATCA e-invoicing compliance (Saudi Arabia), dynamic field customization, and template management at the branch level.

---

## 🎯 Requirements Summary

### Business Requirements

1. **User Interface:**
   - Drag-and-drop functionality for customizing invoice layout
   - User-friendly interface optimized for screen size, font size, and touch functionality
   - Mobile-responsive design

2. **Invoice Components:**
   - **Header:** Company logo, name, address, phone, VAT number, CRN
   - **Title:** Dynamic based on customer VAT status (Standard/Simplified Tax Invoice)
   - **Customer Section:** Name, VAT number, CRN, national address
   - **Invoice Info:** Invoice number, order number, date/time, cashier name, price inclusion label
   - **Items Table:** Name, barcode, unit, price, quantity, discount, VAT, subtotal, notes
   - **Summary:** Total, discount, VAT (included/excluded), paid, change
   - **Footer:** Invoice barcode, order type, payment method, notes, ZATCA QR code, powered-by text

3. **Flexibility:**
   - All fields are dynamic with customizable labels
   - Add/remove fields and sections
   - Show/hide columns in items table
   - Modify column headers

4. **Printing:**
   - Support multiple paper sizes: 58mm thermal, 80mm thermal, A4, custom sizes
   - Print from top-left corner (0,0)
   - Force light mode printing regardless of app theme

5. **Templates:**
   - Save invoice templates in HTML format
   - Preview with realistic sample data
   - Multiple templates per branch with active template selection

6. **ZATCA Compliance:**
   - Phase 1: QR code generation with TLV encoding
   - Phase 2-ready architecture for future integration

### Technical Requirements

- **Storage Level:** Branch-level templates (each branch manages independently)
- **Access Control:** Manager and HeadOfficeAdmin roles only
- **Integration:** Standalone admin page in branch dashboard
- **UI Library:** dnd-kit for drag-and-drop
- **Data Format:** JSON schema for template configuration
- **ZATCA:** Phase 1 implementation with Phase 2 preparation

---

## 🏗️ Technical Architecture

### Backend Components

#### 1. Database Entities

**InvoiceTemplate**
```csharp
public class InvoiceTemplate
{
    public int Id { get; set; }
    public int BranchId { get; set; }
    public string Name { get; set; } // "Default 80mm", "A4 Detailed"
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public PaperSize PaperSize { get; set; } // 58mm, 80mm, A4, Custom
    public int? CustomWidth { get; set; } // in mm
    public int? CustomHeight { get; set; } // in mm
    public string Schema { get; set; } // JSON configuration
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int CreatedBy { get; set; }

    // Navigation
    public Branch Branch { get; set; }
    public User Creator { get; set; }
}

public enum PaperSize
{
    Thermal58mm,
    Thermal80mm,
    A4,
    Custom
}
```

**CompanyInfo**
```csharp
public class CompanyInfo
{
    public int Id { get; set; }
    public int BranchId { get; set; }
    public string CompanyName { get; set; }
    public string? CompanyNameAr { get; set; }
    public string? LogoUrl { get; set; }
    public string? VatNumber { get; set; }
    public string? CommercialRegNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }

    // Navigation
    public Branch Branch { get; set; }
}
```

#### 2. DTOs

**Template DTOs:**
- `InvoiceTemplateDto` - Full template with schema
- `CreateInvoiceTemplateDto` - Create new template
- `UpdateInvoiceTemplateDto` - Update template
- `InvoiceTemplateListDto` - Summary for list view
- `SetActiveTemplateDto` - Mark template as active

**Company DTOs:**
- `CompanyInfoDto` - Company information
- `UpdateCompanyInfoDto` - Update company details

**Preview DTOs:**
- `InvoicePreviewDto` - Preview request with sample data
- `GenerateInvoiceDto` - Generate invoice for actual sale

#### 3. Services

**ZatcaService**
```csharp
public interface IZatcaService
{
    string GenerateQRCode(Sale sale, CompanyInfo company);
    byte[] GenerateTLVEncoding(ZatcaInvoiceData data);
    string GenerateInvoiceHash(Sale sale);
}
```

**InvoiceRenderingService**
```csharp
public interface IInvoiceRenderingService
{
    string RenderInvoice(InvoiceTemplate template, Sale sale, CompanyInfo company);
    string RenderPreview(InvoiceTemplate template, InvoicePreviewData sampleData);
    string ConvertJsonSchemaToHtml(string jsonSchema, Dictionary<string, object> data);
}
```

**InvoiceTemplateService**
```csharp
public interface IInvoiceTemplateService
{
    Task<List<InvoiceTemplateListDto>> GetTemplatesAsync(int branchId);
    Task<InvoiceTemplateDto> GetTemplateByIdAsync(int id, int branchId);
    Task<InvoiceTemplateDto> GetActiveTemplateAsync(int branchId);
    Task<InvoiceTemplateDto> CreateTemplateAsync(CreateInvoiceTemplateDto dto, int branchId, int userId);
    Task<InvoiceTemplateDto> UpdateTemplateAsync(int id, UpdateInvoiceTemplateDto dto, int branchId);
    Task DeleteTemplateAsync(int id, int branchId);
    Task<InvoiceTemplateDto> SetActiveTemplateAsync(int id, int branchId);
    Task<InvoiceTemplateDto> DuplicateTemplateAsync(int id, string newName, int branchId, int userId);
}
```

#### 4. API Endpoints

```
GET    /api/v1/invoice-templates
       - Get all templates for current branch
       - Authorization: Manager+

GET    /api/v1/invoice-templates/{id}
       - Get template by ID
       - Authorization: Manager+

POST   /api/v1/invoice-templates
       - Create new template
       - Authorization: Manager+
       - Body: CreateInvoiceTemplateDto

PUT    /api/v1/invoice-templates/{id}
       - Update template
       - Authorization: Manager+
       - Body: UpdateInvoiceTemplateDto

DELETE /api/v1/invoice-templates/{id}
       - Delete template
       - Authorization: Manager+

POST   /api/v1/invoice-templates/{id}/set-active
       - Set template as active
       - Authorization: Manager+

GET    /api/v1/invoice-templates/active
       - Get active template for branch
       - Authorization: Manager+

POST   /api/v1/invoice-templates/{id}/preview
       - Generate preview with sample data
       - Authorization: Manager+
       - Body: InvoicePreviewDto

POST   /api/v1/invoice-templates/{id}/duplicate
       - Duplicate existing template
       - Authorization: Manager+
       - Body: { newName: string }

POST   /api/v1/invoices/{saleId}/generate
       - Generate invoice HTML for a sale
       - Authorization: Cashier+
       - Uses active template

GET    /api/v1/company-info
       - Get company info for current branch
       - Authorization: Manager+

PUT    /api/v1/company-info
       - Update company info
       - Authorization: Manager+
       - Body: UpdateCompanyInfoDto
```

---

### Frontend Components

#### 1. Pages

**Invoice Builder Page**
- Route: `/branch/settings/invoice-builder`
- Access: Manager+
- Features:
  - Drag-and-drop section builder
  - Field customization panel
  - Live preview pane
  - Save/load templates
  - Print test invoice

**Template Management Page**
- Route: `/branch/settings/invoice-templates`
- Access: Manager+
- Features:
  - List all templates
  - Set active template
  - Duplicate/delete templates
  - Create new template

**Company Settings Page**
- Route: `/branch/settings/company-info`
- Access: Manager+
- Features:
  - Edit company details
  - Upload logo
  - VAT/CRN information

#### 2. Core Components

**InvoiceBuilder**
```tsx
interface InvoiceBuilderProps {
  templateId?: number; // Edit mode
  onSave: (template: InvoiceTemplate) => void;
}
```
- Main builder interface with three panels:
  - Section palette (left)
  - Canvas with drag-and-drop (center)
  - Properties panel (right)

**SectionPalette**
- Draggable section types:
  - Header
  - Title
  - Customer Info
  - Invoice Metadata
  - Items Table
  - Summary
  - Footer
  - Custom Section

**SectionEditor**
- Inline editing for each section
- Show/hide fields
- Rename labels
- Configure properties

**FieldCustomizer**
- Edit field properties:
  - Label text
  - Visibility
  - Width (for table columns)
  - Alignment
  - Font size

**InvoicePreview**
```tsx
interface InvoicePreviewProps {
  schema: InvoiceSchema;
  sampleData: InvoiceData;
  paperSize: PaperSize;
  customDimensions?: { width: number; height: number };
}
```
- Live preview with realistic data
- Responsive to schema changes
- Shows actual print dimensions

**PrintDialog**
```tsx
interface PrintDialogProps {
  invoiceHtml: string;
  paperSize: PaperSize;
  onPrint: () => void;
}
```
- Paper size selector
- Print preview
- Force light mode
- Custom dimensions input

**TemplateCard**
- Template list item with:
  - Thumbnail preview
  - Name and description
  - Active badge
  - Actions (edit, duplicate, delete, set active)

#### 3. NPM Packages

```bash
# Drag and drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Printing
npm install react-to-print

# QR Code generation
npm install qrcode
npm install @types/qrcode --save-dev

# Additional utilities
npm install html2canvas
```

---

## 📊 Database Schema

### Migration: Create Invoice Templates

```sql
CREATE TABLE InvoiceTemplates (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    BranchId INTEGER NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 0,
    PaperSize NVARCHAR(20) NOT NULL, -- 'Thermal58mm', 'Thermal80mm', 'A4', 'Custom'
    CustomWidth INTEGER NULL, -- in mm
    CustomHeight INTEGER NULL, -- in mm
    Schema TEXT NOT NULL, -- JSON configuration
    CreatedAt DATETIME NOT NULL,
    UpdatedAt DATETIME NOT NULL,
    CreatedBy INTEGER NOT NULL,
    FOREIGN KEY (BranchId) REFERENCES Branches(Id) ON DELETE CASCADE,
    FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
);

CREATE INDEX IX_InvoiceTemplates_BranchId ON InvoiceTemplates(BranchId);
CREATE INDEX IX_InvoiceTemplates_IsActive ON InvoiceTemplates(IsActive);

CREATE TABLE CompanyInfo (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    BranchId INTEGER NOT NULL UNIQUE,
    CompanyName NVARCHAR(200) NOT NULL,
    CompanyNameAr NVARCHAR(200) NULL,
    LogoUrl NVARCHAR(500) NULL,
    VatNumber NVARCHAR(50) NULL,
    CommercialRegNumber NVARCHAR(50) NULL,
    Address NVARCHAR(500) NULL,
    City NVARCHAR(100) NULL,
    PostalCode NVARCHAR(20) NULL,
    Phone NVARCHAR(50) NULL,
    Email NVARCHAR(100) NULL,
    Website NVARCHAR(200) NULL,
    FOREIGN KEY (BranchId) REFERENCES Branches(Id) ON DELETE CASCADE
);

CREATE INDEX IX_CompanyInfo_BranchId ON CompanyInfo(BranchId);
```

---

## 🗂️ JSON Schema Structure

### Template Schema Format

```json
{
  "version": "1.0",
  "paperSize": "Thermal80mm",
  "priceIncludesVat": true,
  "sections": [
    {
      "id": "header",
      "type": "header",
      "order": 1,
      "visible": true,
      "config": {
        "showLogo": true,
        "logoAlignment": "center",
        "logoMaxWidth": "120px",
        "showCompanyName": true,
        "companyNameSize": "18px",
        "companyNameWeight": "bold",
        "showCompanyNameAr": false,
        "showAddress": true,
        "showCity": true,
        "showPostalCode": false,
        "showPhone": true,
        "showEmail": false,
        "showWebsite": false,
        "showVatNumber": true,
        "showCRN": true,
        "alignment": "center",
        "spacing": "10px"
      }
    },
    {
      "id": "invoice-title",
      "type": "title",
      "order": 2,
      "visible": true,
      "config": {
        "dynamicTitle": true,
        "standardTitle": "Standard Tax Invoice",
        "standardTitleAr": "فاتورة ضريبية",
        "simplifiedTitle": "Simplified Tax Invoice",
        "simplifiedTitleAr": "فاتورة ضريبية مبسطة",
        "showArabic": false,
        "fontSize": "16px",
        "fontWeight": "bold",
        "alignment": "center",
        "spacing": "10px"
      }
    },
    {
      "id": "customer-info",
      "type": "customer",
      "order": 3,
      "visible": true,
      "config": {
        "title": "Customer Information",
        "showTitle": true,
        "fields": [
          {
            "key": "name",
            "label": "Customer Name",
            "labelAr": "اسم العميل",
            "visible": true,
            "required": false
          },
          {
            "key": "vatNumber",
            "label": "VAT Number",
            "labelAr": "رقم الضريبة",
            "visible": true,
            "required": false
          },
          {
            "key": "crn",
            "label": "Commercial Reg. Number",
            "labelAr": "رقم السجل التجاري",
            "visible": true,
            "required": false
          },
          {
            "key": "address",
            "label": "Address",
            "labelAr": "العنوان",
            "visible": false,
            "required": false
          }
        ],
        "layout": "vertical",
        "spacing": "5px"
      }
    },
    {
      "id": "invoice-meta",
      "type": "metadata",
      "order": 4,
      "visible": true,
      "config": {
        "fields": [
          {
            "key": "invoiceNumber",
            "label": "Invoice #",
            "labelAr": "رقم الفاتورة",
            "visible": true
          },
          {
            "key": "orderNumber",
            "label": "Order #",
            "labelAr": "رقم الطلب",
            "visible": true
          },
          {
            "key": "date",
            "label": "Date",
            "labelAr": "التاريخ",
            "visible": true,
            "format": "YYYY-MM-DD HH:mm"
          },
          {
            "key": "cashier",
            "label": "Cashier",
            "labelAr": "أمين الصندوق",
            "visible": true
          }
        ],
        "showPriceIncludesVat": true,
        "priceIncludesVatLabel": "Price includes VAT",
        "priceExcludesVatLabel": "Price excludes VAT",
        "layout": "grid",
        "columns": 2,
        "spacing": "5px"
      }
    },
    {
      "id": "items-table",
      "type": "items",
      "order": 5,
      "visible": true,
      "config": {
        "columns": [
          {
            "key": "name",
            "label": "Item",
            "labelAr": "الصنف",
            "visible": true,
            "width": "30%",
            "alignment": "left"
          },
          {
            "key": "barcode",
            "label": "Barcode",
            "labelAr": "الباركود",
            "visible": false,
            "width": "15%",
            "alignment": "center"
          },
          {
            "key": "unit",
            "label": "Unit",
            "labelAr": "الوحدة",
            "visible": true,
            "width": "10%",
            "alignment": "center"
          },
          {
            "key": "price",
            "label": "Price",
            "labelAr": "السعر",
            "visible": true,
            "width": "12%",
            "alignment": "right",
            "format": "0.00"
          },
          {
            "key": "quantity",
            "label": "Qty",
            "labelAr": "الكمية",
            "visible": true,
            "width": "8%",
            "alignment": "center",
            "format": "0.00"
          },
          {
            "key": "discount",
            "label": "Disc.",
            "labelAr": "الخصم",
            "visible": true,
            "width": "10%",
            "alignment": "right",
            "format": "0.00"
          },
          {
            "key": "vat",
            "label": "VAT",
            "labelAr": "الضريبة",
            "visible": true,
            "width": "10%",
            "alignment": "right",
            "format": "0.00"
          },
          {
            "key": "total",
            "label": "Total",
            "labelAr": "الإجمالي",
            "visible": true,
            "width": "15%",
            "alignment": "right",
            "format": "0.00",
            "fontWeight": "bold"
          }
        ],
        "showNotes": true,
        "notesLabel": "Notes",
        "notesPosition": "below",
        "showBorders": true,
        "showHeader": true,
        "headerBackground": "#f5f5f5",
        "alternateRowColors": false,
        "fontSize": "11px",
        "rowPadding": "5px"
      }
    },
    {
      "id": "summary",
      "type": "summary",
      "order": 6,
      "visible": true,
      "config": {
        "fields": [
          {
            "key": "subtotal",
            "label": "Subtotal",
            "labelAr": "المجموع الفرعي",
            "visible": true,
            "format": "0.00"
          },
          {
            "key": "discount",
            "label": "Total Discount",
            "labelAr": "إجمالي الخصم",
            "visible": true,
            "format": "0.00"
          },
          {
            "key": "vatAmount",
            "label": "VAT Amount (15%)",
            "labelAr": "قيمة الضريبة (15%)",
            "visible": true,
            "format": "0.00"
          },
          {
            "key": "total",
            "label": "Total",
            "labelAr": "الإجمالي",
            "visible": true,
            "format": "0.00",
            "highlight": true,
            "fontSize": "16px",
            "fontWeight": "bold"
          },
          {
            "key": "paid",
            "label": "Paid",
            "labelAr": "المدفوع",
            "visible": false,
            "format": "0.00"
          },
          {
            "key": "change",
            "label": "Change",
            "labelAr": "الباقي",
            "visible": false,
            "format": "0.00"
          }
        ],
        "alignment": "right",
        "spacing": "5px",
        "showBorder": true,
        "borderStyle": "top"
      }
    },
    {
      "id": "footer",
      "type": "footer",
      "order": 7,
      "visible": true,
      "config": {
        "showInvoiceBarcode": true,
        "invoiceBarcodeFormat": "CODE128",
        "invoiceBarcodeHeight": "40px",
        "showOrderType": true,
        "orderTypeLabel": "Order Type",
        "orderTypes": ["Take Out", "Dine In", "Delivery"],
        "showPaymentMethod": true,
        "paymentMethodLabel": "Payment Method",
        "paymentMethods": ["Cash", "Card", "Mobile"],
        "showNotes": true,
        "notesLabel": "Notes",
        "notesText": "Thank you for your business!",
        "showZatcaQR": true,
        "zatcaQRSize": "150px",
        "zatcaQRLabel": "Scan for e-Invoice",
        "showPoweredBy": true,
        "poweredByText": "Powered by Your Company",
        "alignment": "center",
        "spacing": "10px"
      }
    }
  ],
  "styling": {
    "fontFamily": "Arial, sans-serif",
    "fontSize": {
      "header": "14px",
      "title": "16px",
      "body": "12px",
      "footer": "10px"
    },
    "spacing": {
      "sectionGap": "15px",
      "lineHeight": "1.5",
      "padding": "10px"
    },
    "colors": {
      "text": "#000000",
      "background": "#ffffff",
      "border": "#cccccc",
      "highlight": "#000000"
    },
    "borders": {
      "style": "solid",
      "width": "1px",
      "radius": "0px"
    }
  }
}
```

### Section Types Reference

| Section Type | Description | Configurable Properties |
|-------------|-------------|------------------------|
| `header` | Company information | Logo, name, address, contact, VAT, CRN |
| `title` | Invoice title | Dynamic (Standard/Simplified), Arabic support |
| `customer` | Customer details | Name, VAT, CRN, address fields |
| `metadata` | Invoice info | Number, date, cashier, price inclusion label |
| `items` | Items table | Columns, notes, borders, formatting |
| `summary` | Totals section | Subtotal, discount, VAT, total, paid, change |
| `footer` | Footer elements | Barcode, QR, order type, payment, notes, powered-by |
| `custom` | User-defined | Free HTML/text content |

---

## 🔐 ZATCA Implementation (Phase 1)

### ZATCA E-Invoicing Overview

ZATCA (Zakat, Tax and Customs Authority) is Saudi Arabia's tax authority that mandates e-invoicing for all businesses. The implementation has two phases:

- **Phase 1 (Generation Phase):** Generate invoices with ZATCA-compliant QR codes
- **Phase 2 (Integration Phase):** Report/clear invoices with ZATCA platform

### Phase 1 Requirements

1. **QR Code Content** - TLV (Tag-Length-Value) encoded data:
   - Tag 1: Seller name
   - Tag 2: VAT registration number
   - Tag 3: Timestamp (ISO 8601)
   - Tag 4: Invoice total (including VAT)
   - Tag 5: VAT amount
   - Tag 6: Invoice hash (SHA-256 of invoice XML/data)

2. **Invoice Types:**
   - **Standard Tax Invoice:** B2B, VAT-registered customers
   - **Simplified Tax Invoice:** B2C, non-VAT customers

### TLV Encoding Format

```
[Tag][Length][Value][Tag][Length][Value]...
```

Each component:
- **Tag:** 1 byte (tag number)
- **Length:** 1 byte (value length in bytes)
- **Value:** N bytes (UTF-8 encoded string)

### C# Implementation

```csharp
public class ZatcaService : IZatcaService
{
    public string GenerateQRCode(Sale sale, CompanyInfo company)
    {
        var tlvData = EncodeTLV(new Dictionary<int, string>
        {
            { 1, company.CompanyName },
            { 2, company.VatNumber ?? "N/A" },
            { 3, sale.Date.ToString("yyyy-MM-ddTHH:mm:ssZ") },
            { 4, sale.TotalAmount.ToString("0.00") },
            { 5, sale.VatAmount.ToString("0.00") },
            { 6, GenerateInvoiceHash(sale) }
        });

        return Convert.ToBase64String(tlvData);
    }

    private byte[] EncodeTLV(Dictionary<int, string> tags)
    {
        using var ms = new MemoryStream();

        foreach (var tag in tags.OrderBy(t => t.Key))
        {
            var value = Encoding.UTF8.GetBytes(tag.Value);
            ms.WriteByte((byte)tag.Key);
            ms.WriteByte((byte)value.Length);
            ms.Write(value, 0, value.Length);
        }

        return ms.ToArray();
    }

    public string GenerateInvoiceHash(Sale sale)
    {
        // Simplified hash for Phase 1
        // Phase 2 requires XML invoice hashing
        var hashInput = $"{sale.InvoiceNumber}|{sale.Date:O}|{sale.TotalAmount}";
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(hashInput));
        return Convert.ToBase64String(hash);
    }
}
```

### Phase 2 Preparation

While implementing Phase 1, the architecture should support:
- XML invoice generation (UBL 2.1 format)
- Digital signatures with X.509 certificates
- API integration with ZATCA platform
- Invoice reporting and clearance workflows
- Error handling for ZATCA responses

**Recommended Approach:**
- Create `IZatcaService` interface with Phase 1 methods
- Add placeholder methods for Phase 2 (throwing `NotImplementedException`)
- Structure data models to support both phases
- Document Phase 2 requirements in code comments

---

## 📦 Implementation Phases

### Phase 1: Backend Foundation

**Tasks:**
1. ✅ Create database migration for `InvoiceTemplates` and `CompanyInfo`
2. ✅ Create entity models (`InvoiceTemplate`, `CompanyInfo`)
3. ✅ Create DTOs for templates and company info
4. ✅ Implement `ZatcaService` with TLV encoding
5. ✅ Implement `InvoiceRenderingService` for JSON to HTML conversion
6. ✅ Implement `InvoiceTemplateService` with CRUD operations
7. ✅ Add API endpoints for template management
8. ✅ Add API endpoints for company info
9. ✅ Add authorization (Manager+ only)
10. ✅ Test all backend endpoints

**Deliverables:**
- Database tables created
- All services implemented and tested
- API endpoints functional
- Swagger documentation updated

---

### Phase 2: Frontend Builder UI

**Tasks:**
11. ✅ Install dnd-kit packages
12. ✅ Create invoice builder page structure
13. ✅ Implement `SectionPalette` component
14. ✅ Implement `InvoiceBuilder` main component
15. ✅ Add drag-and-drop functionality for sections
16. ✅ Implement `SectionEditor` for inline editing
17. ✅ Implement `FieldCustomizer` panel
18. ✅ Add section reordering
19. ✅ Add section add/remove functionality
20. ✅ Create company settings page

**Deliverables:**
- Functional drag-and-drop builder
- Section customization working
- Company info editable

---

### Phase 3: Preview & Rendering

**Tasks:**
21. ✅ Implement `InvoicePreview` component
22. ✅ Create sample data generator for preview
23. ✅ Implement JSON schema to HTML rendering
24. ✅ Add live preview updates
25. ✅ Implement `PrintDialog` component
26. ✅ Add react-to-print integration
27. ✅ Support multiple paper sizes (58mm, 80mm, A4, custom)
28. ✅ Force light mode for printing
29. ✅ Test print alignment (0,0 top-left)
30. ✅ Add ZATCA QR code display in preview

**Deliverables:**
- Live preview working
- Print functionality for all paper sizes
- QR codes displaying correctly

---

### Phase 4: Template Management

**Tasks:**
31. ✅ Create template management list page
32. ✅ Implement `TemplateCard` component
33. ✅ Add template CRUD operations (create, edit, delete)
34. ✅ Implement set active template functionality
35. ✅ Add duplicate template feature
36. ✅ Implement template export to HTML
37. ✅ Add default template creation on first use
38. ✅ Add template validation
39. ✅ Create navigation in settings menu
40. ✅ Add breadcrumbs and routing

**Deliverables:**
- Template management fully functional
- Multiple templates supported
- Active template selection working

---

### Phase 5: Integration & Testing

**Tasks:**
41. ✅ Integrate active template with sales page
42. ✅ Add "Print Invoice" button to sales page
43. ✅ Fetch active template on sale completion
44. ✅ Generate invoice HTML with sale data
45. ✅ Test with various invoice scenarios:
    - Standard tax invoice (B2B)
    - Simplified tax invoice (B2C)
    - Multiple items with discounts
    - Different payment methods
    - Various paper sizes
46. ✅ Test ZATCA QR code scanning
47. ✅ Test template switching
48. ✅ Test field customization edge cases
49. ✅ Performance testing with large invoices
50. ✅ Mobile responsiveness testing

**Deliverables:**
- Complete end-to-end workflow
- All scenarios tested
- Documentation updated

---

## 📝 Detailed Task List

### Backend Tasks (1-10)

- [ ] **T001** - Create `InvoiceTemplate` entity in `Backend/Models/InvoiceTemplate.cs`
- [ ] **T002** - Create `CompanyInfo` entity in `Backend/Models/CompanyInfo.cs`
- [ ] **T003** - Add `DbSet<InvoiceTemplate>` and `DbSet<CompanyInfo>` to `BranchDbContext`
- [ ] **T004** - Create migration: `dotnet ef migrations add AddInvoiceTemplatesAndCompanyInfo`
- [ ] **T005** - Create DTOs in `Backend/Models/DTOs/InvoiceTemplates/`
  - `InvoiceTemplateDto.cs`
  - `CreateInvoiceTemplateDto.cs`
  - `UpdateInvoiceTemplateDto.cs`
  - `InvoiceTemplateListDto.cs`
  - `SetActiveTemplateDto.cs`
- [ ] **T006** - Create DTOs in `Backend/Models/DTOs/CompanyInfo/`
  - `CompanyInfoDto.cs`
  - `UpdateCompanyInfoDto.cs`
- [ ] **T007** - Create `IZatcaService` interface in `Backend/Services/IZatcaService.cs`
- [ ] **T008** - Implement `ZatcaService` in `Backend/Services/ZatcaService.cs`
  - TLV encoding
  - QR code generation
  - Invoice hash generation
- [ ] **T009** - Create `IInvoiceRenderingService` interface in `Backend/Services/IInvoiceRenderingService.cs`
- [ ] **T010** - Implement `InvoiceRenderingService` in `Backend/Services/InvoiceRenderingService.cs`
  - JSON schema parser
  - HTML template engine
  - Data binding
- [ ] **T011** - Create `IInvoiceTemplateService` interface in `Backend/Services/IInvoiceTemplateService.cs`
- [ ] **T012** - Implement `InvoiceTemplateService` in `Backend/Services/InvoiceTemplateService.cs`
  - CRUD operations
  - Active template management
  - Validation
- [ ] **T013** - Add invoice template endpoints to `Backend/Program.cs`
  - GET /api/v1/invoice-templates
  - GET /api/v1/invoice-templates/{id}
  - POST /api/v1/invoice-templates
  - PUT /api/v1/invoice-templates/{id}
  - DELETE /api/v1/invoice-templates/{id}
  - POST /api/v1/invoice-templates/{id}/set-active
  - GET /api/v1/invoice-templates/active
  - POST /api/v1/invoice-templates/{id}/duplicate
- [ ] **T014** - Add company info endpoints to `Backend/Program.cs`
  - GET /api/v1/company-info
  - PUT /api/v1/company-info
- [ ] **T015** - Add invoice generation endpoint to `Backend/Program.cs`
  - POST /api/v1/invoices/{saleId}/generate
- [ ] **T016** - Register services in DI container
- [ ] **T017** - Add authorization policies (Manager+)
- [ ] **T018** - Test backend with Postman/Swagger
- [ ] **T019** - Create seed data for default template
- [ ] **T020** - Update Swagger documentation

### Frontend Tasks (21-50)

- [ ] **T021** - Install NPM packages
  ```bash
  npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
  npm install react-to-print qrcode html2canvas
  npm install @types/qrcode --save-dev
  ```
- [ ] **T022** - Create types in `frontend/types/invoice.ts`
  - InvoiceTemplate
  - InvoiceSchema
  - Section types
  - Field types
- [ ] **T023** - Create API service in `frontend/services/invoiceTemplateService.ts`
- [ ] **T024** - Create invoice builder page: `frontend/app/branch/settings/invoice-builder/page.tsx`
- [ ] **T025** - Create template list page: `frontend/app/branch/settings/invoice-templates/page.tsx`
- [ ] **T026** - Create company settings page: `frontend/app/branch/settings/company-info/page.tsx`
- [ ] **T027** - Create `SectionPalette` component in `frontend/components/invoice-builder/SectionPalette.tsx`
- [ ] **T028** - Create `InvoiceBuilder` component in `frontend/components/invoice-builder/InvoiceBuilder.tsx`
- [ ] **T029** - Create `SectionEditor` component in `frontend/components/invoice-builder/SectionEditor.tsx`
- [ ] **T030** - Create `FieldCustomizer` component in `frontend/components/invoice-builder/FieldCustomizer.tsx`
- [ ] **T031** - Create `InvoicePreview` component in `frontend/components/invoice-builder/InvoicePreview.tsx`
- [ ] **T032** - Create `PrintDialog` component in `frontend/components/invoice-builder/PrintDialog.tsx`
- [ ] **T033** - Create `TemplateCard` component in `frontend/components/invoice-builder/TemplateCard.tsx`
- [ ] **T034** - Implement drag-and-drop functionality in InvoiceBuilder
- [ ] **T035** - Implement section reordering
- [ ] **T036** - Implement add/remove sections
- [ ] **T037** - Implement field show/hide
- [ ] **T038** - Implement field label editing
- [ ] **T039** - Create sample data generator in `frontend/utils/invoiceSampleData.ts`
- [ ] **T040** - Implement JSON to HTML renderer in `frontend/utils/invoiceRenderer.tsx`
- [ ] **T041** - Implement ZATCA QR code generation in frontend
- [ ] **T042** - Add live preview updates on schema changes
- [ ] **T043** - Implement print functionality with react-to-print
- [ ] **T044** - Add paper size selector (58mm, 80mm, A4, custom)
- [ ] **T045** - Force light mode for print CSS
- [ ] **T046** - Test print alignment (0,0)
- [ ] **T047** - Implement template save functionality
- [ ] **T048** - Implement template load functionality
- [ ] **T049** - Implement set active template
- [ ] **T050** - Implement duplicate template
- [ ] **T051** - Implement delete template
- [ ] **T052** - Add template export to HTML
- [ ] **T053** - Add default template creation wizard
- [ ] **T054** - Add navigation links in settings menu
- [ ] **T055** - Integrate with sales page
- [ ] **T056** - Add "Print Invoice" button to sales completion
- [ ] **T057** - Test with Standard Tax Invoice scenario
- [ ] **T058** - Test with Simplified Tax Invoice scenario
- [ ] **T059** - Test with multiple items and discounts
- [ ] **T060** - Test all paper sizes
- [ ] **T061** - Test ZATCA QR code scanning
- [ ] **T062** - Test mobile responsiveness
- [ ] **T063** - Performance testing
- [ ] **T064** - Create user documentation
- [ ] **T065** - Update CLAUDE.md with new features

---

## 🎨 UI/UX Mockup Description

### Invoice Builder Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Invoice Builder                                    [Save] [Preview] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────────────┐  ┌───────────────┐ │
│  │   Palette    │  │       Canvas         │  │  Properties   │ │
│  │              │  │                      │  │               │ │
│  │ ┌──────────┐ │  │  ┌──────────────┐  │  │ Section: Header│ │
│  │ │  Header  │ │  │  │   Header     │  │  │               │ │
│  │ └──────────┘ │  │  └──────────────┘  │  │ ☑ Show Logo   │ │
│  │              │  │                      │  │ ☑ Show Name   │ │
│  │ ┌──────────┐ │  │  ┌──────────────┐  │  │ ☑ Show VAT    │ │
│  │ │  Title   │ │  │  │  Invoice Title│ │  │               │ │
│  │ └──────────┘ │  │  └──────────────┘  │  │ Alignment:    │ │
│  │              │  │                      │  │ ● Center      │ │
│  │ ┌──────────┐ │  │  ┌──────────────┐  │  │ ○ Left        │ │
│  │ │ Customer │ │  │  │  Customer    │  │  │ ○ Right       │ │
│  │ └──────────┘ │  │  └──────────────┘  │  │               │ │
│  │              │  │                      │  │ [Delete]      │ │
│  │ ┌──────────┐ │  │  ┌──────────────┐  │  └───────────────┘ │
│  │ │  Items   │ │  │  │  Items Table │  │                   │ │
│  │ └──────────┘ │  │  └──────────────┘  │                   │ │
│  │              │  │                      │                   │ │
│  │ ┌──────────┐ │  │  ┌──────────────┐  │                   │ │
│  │ │ Summary  │ │  │  │   Summary    │  │                   │ │
│  │ └──────────┘ │  │  └──────────────┘  │                   │ │
│  │              │  │                      │                   │ │
│  │ ┌──────────┐ │  │  ┌──────────────┐  │                   │ │
│  │ │  Footer  │ │  │  │    Footer    │  │                   │ │
│  │ └──────────┘ │  │  └──────────────┘  │                   │ │
│  │              │  │                      │                   │ │
│  └──────────────┘  └──────────────────────┘                   │ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Template Management Page

```
┌─────────────────────────────────────────────────────────────────┐
│ Invoice Templates                             [+ New Template] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ Default 80mm  ⭐   │  │  A4 Detailed       │                │
│  │ [Thumbnail]         │  │  [Thumbnail]       │                │
│  │                     │  │                    │                │
│  │ Thermal 80mm        │  │  A4 Paper          │                │
│  │                     │  │                    │                │
│  │ [Edit] [Duplicate]  │  │ [Edit] [Set Active]│                │
│  │        [Delete]     │  │        [Delete]    │                │
│  └────────────────────┘  └────────────────────┘                │
│                                                                   │
│  ┌────────────────────┐                                         │
│  │  Simplified        │                                         │
│  │  [Thumbnail]       │                                         │
│  │                    │                                         │
│  │  Thermal 58mm      │                                         │
│  │                    │                                         │
│  │ [Edit] [Set Active]│                                         │
│  │        [Delete]    │                                         │
│  └────────────────────┘                                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Strategy

### Unit Tests

**Backend:**
- ZatcaService TLV encoding
- Invoice hash generation
- Template validation
- JSON schema parsing

**Frontend:**
- Sample data generation
- JSON to HTML rendering
- Field validation

### Integration Tests

- Template CRUD operations
- Active template switching
- Invoice generation with sale data
- QR code generation end-to-end

### Manual Testing Scenarios

1. **Standard Tax Invoice:**
   - Customer with VAT number
   - Multiple items
   - Various discounts
   - Print on 80mm paper
   - Verify QR code scans correctly

2. **Simplified Tax Invoice:**
   - Walk-in customer (no VAT)
   - Few items
   - Print on 58mm paper
   - Verify title changes

3. **Template Customization:**
   - Hide/show fields
   - Reorder sections
   - Change labels
   - Add custom section
   - Save and load template

4. **Multi-template:**
   - Create 3 templates
   - Switch active template
   - Delete non-active template
   - Duplicate template

5. **Print Testing:**
   - Test all paper sizes
   - Verify alignment (0,0)
   - Test in dark mode app
   - Verify light mode print

6. **Edge Cases:**
   - Very long item names
   - Large quantities
   - High discounts
   - Missing company info
   - No logo

---

## 📚 Documentation Requirements

### User Guide

Create in `docs/user-guide-invoice-builder.md`:
- How to access invoice builder
- Creating your first template
- Customizing sections and fields
- Setting up company information
- Managing multiple templates
- Printing invoices
- ZATCA compliance overview

### Developer Guide

Create in `docs/developer-guide-invoice-builder.md`:
- Architecture overview
- Adding new section types
- Extending JSON schema
- Customizing rendering logic
- Adding Phase 2 ZATCA support

### API Documentation

Update Swagger descriptions for:
- All invoice template endpoints
- Company info endpoints
- Invoice generation endpoint

---

## 🔄 Future Enhancements (Post-Implementation)

### Phase 2 ZATCA Integration
- XML invoice generation (UBL 2.1)
- Digital signatures
- ZATCA platform API integration
- Invoice reporting
- Invoice clearance

### Advanced Features
- Multi-language support (Arabic/English switching)
- Email invoice to customers
- PDF generation
- Invoice history and reprints
- Custom CSS injection
- Image upload for custom sections
- Conditional field display
- Formula-based calculated fields
- Barcode format selection
- Color theme customization

### Performance
- Template caching
- Lazy loading for large templates
- Invoice generation queue for bulk operations

### Analytics
- Popular template analysis
- Print frequency tracking
- Field usage statistics

---

## 📊 Success Criteria

### Functional
- ✅ Create, edit, delete, duplicate templates
- ✅ Drag-and-drop section builder works smoothly
- ✅ All fields are customizable
- ✅ Preview updates in real-time
- ✅ Print works on all paper sizes
- ✅ ZATCA QR codes generate correctly
- ✅ Active template integration with sales

### Performance
- ✅ Builder loads in < 2 seconds
- ✅ Preview updates in < 500ms
- ✅ Invoice generation in < 1 second

### UX
- ✅ Intuitive drag-and-drop interface
- ✅ Clear visual feedback
- ✅ Mobile-friendly on tablets
- ✅ Helpful error messages
- ✅ Undo/redo support (nice-to-have)

### Quality
- ✅ No console errors
- ✅ TypeScript type safety
- ✅ Responsive design
- ✅ Accessibility (keyboard navigation)
- ✅ Cross-browser compatibility

---

## 🛠️ Development Environment Setup

### Prerequisites
- Node.js 18+
- .NET 8.0 SDK
- SQLite (or other database provider)

### Setup Steps

1. **Install frontend packages:**
   ```bash
   cd frontend
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   npm install react-to-print qrcode html2canvas
   npm install @types/qrcode --save-dev
   ```

2. **Run database migration:**
   ```bash
   cd Backend
   dotnet ef migrations add AddInvoiceTemplatesAndCompanyInfo
   dotnet ef database update
   ```

3. **Start development servers:**
   ```bash
   # Terminal 1 - Backend
   cd Backend
   dotnet watch

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

4. **Access application:**
   - Frontend: http://localhost:3000
   - Backend: https://localhost:5001
   - Swagger: https://localhost:5001/swagger

---

## 📞 Support & Questions

For questions or clarifications during implementation:
1. Review this plan document
2. Check CLAUDE.md for project conventions
3. Refer to existing code patterns (Sales, Inventory modules)
4. Ask specific technical questions

---

## ✅ Implementation Checklist

Track overall progress:

**Backend (20 tasks):**
- [ ] Database & Entities (T001-T004)
- [ ] DTOs (T005-T006)
- [ ] Services (T007-T012)
- [ ] API Endpoints (T013-T015)
- [ ] Configuration & Testing (T016-T020)

**Frontend (45 tasks):**
- [ ] Setup & Types (T021-T023)
- [ ] Pages (T024-T026)
- [ ] Components (T027-T033)
- [ ] Drag & Drop (T034-T038)
- [ ] Rendering & Preview (T039-T042)
- [ ] Printing (T043-T046)
- [ ] Template Management (T047-T053)
- [ ] Navigation (T054-T055)
- [ ] Integration & Testing (T056-T063)
- [ ] Documentation (T064-T065)

---

**Total Tasks:** 65
**Estimated Effort:** Large feature (equivalent to full User Story)
**Status:** Ready for implementation

---

*This plan was created on December 9, 2025. For updates or modifications, edit this file and update the date.*
