# Invoice Builder - Testing Phase Plan

**Date:** December 10, 2025
**Phase:** Testing Phase
**Status:** 🟡 Ready to Execute
**Scope:** Comprehensive testing of all 5 implementation phases

---

## Overview

This document provides a complete testing plan for the invoice builder system, covering all features implemented in Phases 1-5. The testing phase validates functionality, performance, compatibility, and user experience across the entire system.

---

## Test Summary

| Category | Test Count | Priority | Status |
|----------|------------|----------|--------|
| Unit Tests | 8 | High | ⏳ Pending |
| Integration Tests | 4 | High | ⏳ Pending |
| Visual/UI Tests | 6 | High | ⏳ Pending |
| Browser Compatibility | 3 | Medium | ⏳ Pending |
| Print Tests | 2 | Medium | ⏳ Pending |
| User Acceptance Tests | 5 | High | ⏳ Pending |
| Performance Tests | 2 | Low | ⏳ Pending |
| **Total** | **30** | - | **0% Complete** |

---

## Test Environment

### Prerequisites

**Backend:**
- .NET 8 SDK installed
- Database (SQLite/MSSQL/PostgreSQL/MySQL)
- Backend server running on https://localhost:5001

**Frontend:**
- Node.js 18+ installed
- Next.js 16.0.3 with Turbopack
- Frontend server running on http://localhost:3000

**Test Data:**
- Sample branch configuration
- Test customer records with Arabic names
- Test products with barcodes
- Sample sales transactions

**Tools Required:**
- Web browsers (Chrome, Firefox, Safari, Edge)
- Mobile devices or emulators
- Print preview capability
- Network throttling tools (optional)

---

## Unit Tests

### UT-01: RTL Detection - Arabic Unicode Range

**Category:** Unit Test
**Priority:** High
**Feature:** Phase 5 - RTL Layout

**Test Description:**
Verify that the `hasArabicContent()` function correctly detects Arabic characters across all Unicode ranges.

**Test Data:**
```typescript
const testCases = [
  // Standard Arabic
  { input: "شركة الرياض", expected: true, description: "Standard Arabic" },
  { input: "مرحبا", expected: true, description: "Arabic greeting" },

  // Arabic Supplement
  { input: "\u0750\u0751\u0752", expected: true, description: "Arabic Supplement" },

  // Arabic Extended-A
  { input: "\u08A0\u08A1\u08A2", expected: true, description: "Arabic Extended-A" },

  // English only
  { input: "ABC Company", expected: false, description: "English only" },
  { input: "Company 123", expected: false, description: "English with numbers" },

  // Mixed content
  { input: "ABC شركة", expected: true, description: "Mixed English-Arabic" },

  // Empty/null
  { input: "", expected: false, description: "Empty string" },
  { input: null, expected: false, description: "Null value" },
  { input: undefined, expected: false, description: "Undefined value" },

  // Special characters
  { input: "!@#$%^&*()", expected: false, description: "Special characters only" },
  { input: "Test!شركة", expected: true, description: "Special chars with Arabic" },
];
```

**Test Steps:**
1. Import `hasArabicContent()` function from InvoicePreview component
2. Run each test case through the function
3. Compare actual result with expected result

**Expected Results:**
- All test cases return expected boolean values
- Function handles null/undefined gracefully
- No console errors or exceptions

**Validation:**
```typescript
testCases.forEach(test => {
  const result = hasArabicContent(test.input);
  console.assert(result === test.expected,
    `Failed: ${test.description} - Expected ${test.expected}, got ${result}`
  );
});
```

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### UT-02: RTL Mode Determination

**Category:** Unit Test
**Priority:** High
**Feature:** Phase 5 - RTL Layout

**Test Description:**
Verify RTL mode is correctly determined based on schema configuration and content.

**Test Data:**
```typescript
const testScenarios = [
  // Explicit RTL
  {
    schema: { rtl: true },
    data: { branchNameAr: "", customerName: "John" },
    expected: true,
    description: "Explicit RTL=true overrides content"
  },

  // Explicit LTR
  {
    schema: { rtl: false },
    data: { branchNameAr: "شركة", customerName: "محمد" },
    expected: false,
    description: "Explicit RTL=false overrides Arabic content"
  },

  // Auto-detect: Arabic branch
  {
    schema: { rtl: undefined },
    data: { branchNameAr: "شركة الرياض", customerName: "John" },
    expected: true,
    description: "Auto-detect from branchNameAr"
  },

  // Auto-detect: Arabic customer
  {
    schema: { rtl: undefined },
    data: { branchNameAr: "", customerName: "محمد أحمد" },
    expected: true,
    description: "Auto-detect from customerName"
  },

  // Auto-detect: No Arabic
  {
    schema: { rtl: undefined },
    data: { branchNameAr: "ABC", customerName: "John" },
    expected: false,
    description: "Auto-detect defaults to LTR"
  },

  // Schema missing rtl field
  {
    schema: {},
    data: { branchNameAr: "شركة", customerName: "" },
    expected: true,
    description: "Missing schema.rtl triggers auto-detect"
  },
];
```

**Test Steps:**
1. For each scenario, set up schema and data
2. Calculate isRTL value using detection logic
3. Verify result matches expected value

**Expected Results:**
- Explicit schema.rtl always takes precedence
- Auto-detection checks branchNameAr first, then customerName
- Default is false (LTR) when no Arabic detected

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### UT-03: Saudi Address Validation - PostalCode

**Category:** Unit Test
**Priority:** High
**Feature:** Phase 4 - Saudi National Address

**Test Description:**
Verify PostalCode field validates exactly 5 digits.

**Test Data:**
```typescript
const postalCodeTests = [
  // Valid
  { value: "12345", valid: true, description: "Valid 5-digit postal code" },
  { value: "00000", valid: true, description: "All zeros (valid format)" },
  { value: "99999", valid: true, description: "All nines (valid format)" },

  // Invalid - wrong length
  { value: "1234", valid: false, error: "Postal code must be 5 digits" },
  { value: "123456", valid: false, error: "Postal code must be 5 digits" },
  { value: "123", valid: false, error: "Postal code must be 5 digits" },

  // Invalid - non-numeric
  { value: "12A45", valid: false, error: "Postal code must be 5 digits" },
  { value: "ABCDE", valid: false, error: "Postal code must be 5 digits" },
  { value: "12-45", valid: false, error: "Postal code must be 5 digits" },
  { value: "12 45", valid: false, error: "Postal code must be 5 digits" },

  // Edge cases
  { value: "", valid: true, description: "Empty (optional field)" },
  { value: null, valid: true, description: "Null (optional field)" },
];
```

**Test Steps:**
1. Create test CreateCustomerDto objects with various PostalCode values
2. Send POST request to `/api/v1/customers`
3. Verify validation response

**Expected Results:**
- Valid postal codes are accepted
- Invalid formats return 400 Bad Request
- Error message matches validation attribute
- Null/empty values are accepted (optional field)

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### UT-04: Saudi Address Validation - AdditionalNumber

**Category:** Unit Test
**Priority:** High
**Feature:** Phase 4 - Saudi National Address

**Test Description:**
Verify AdditionalNumber field validates exactly 4 digits.

**Test Data:**
```typescript
const additionalNumberTests = [
  // Valid
  { value: "6789", valid: true, description: "Valid 4-digit additional number" },
  { value: "0000", valid: true, description: "All zeros (valid format)" },
  { value: "9999", valid: true, description: "All nines (valid format)" },

  // Invalid - wrong length
  { value: "678", valid: false, error: "Additional number must be 4 digits" },
  { value: "67890", valid: false, error: "Additional number must be 4 digits" },
  { value: "12", valid: false, error: "Additional number must be 4 digits" },

  // Invalid - non-numeric
  { value: "67A9", valid: false, error: "Additional number must be 4 digits" },
  { value: "ABCD", valid: false, error: "Additional number must be 4 digits" },
  { value: "67-9", valid: false, error: "Additional number must be 4 digits" },

  // Edge cases
  { value: "", valid: true, description: "Empty (optional field)" },
  { value: null, valid: true, description: "Null (optional field)" },
];
```

**Test Steps:**
1. Create test CreateCustomerDto objects with various AdditionalNumber values
2. Send POST request to `/api/v1/customers`
3. Verify validation response

**Expected Results:**
- Valid additional numbers are accepted
- Invalid formats return 400 Bad Request
- Error message matches validation attribute
- Null/empty values are accepted (optional field)

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### UT-05: Barcode Format Validation

**Category:** Unit Test
**Priority:** Medium
**Feature:** Phase 3 - Invoice Barcode

**Test Description:**
Verify BarcodeDisplay component accepts all supported barcode formats.

**Test Data:**
```typescript
const supportedFormats = [
  "CODE128", "CODE39", "CODE128A", "CODE128B", "CODE128C",
  "EAN13", "EAN8", "EAN5", "EAN2",
  "UPC", "UPCE",
  "ITF14", "ITF",
  "MSI", "MSI10", "MSI11", "MSI1010", "MSI1110",
  "pharmacode", "codabar"
];

const testCases = supportedFormats.map(format => ({
  format,
  value: "123456789",
  shouldRender: true
}));

// Add invalid format test
testCases.push({
  format: "INVALID_FORMAT",
  value: "123456789",
  shouldRender: false  // May throw error or render nothing
});
```

**Test Steps:**
1. Render BarcodeDisplay component with each format
2. Verify no TypeScript compilation errors
3. Verify barcode renders without runtime errors
4. Check console for warnings/errors

**Expected Results:**
- All supported formats compile without TypeScript errors
- All supported formats render without runtime errors
- Invalid formats handled gracefully (error boundary or null render)

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### UT-06: Invoice Schema Validation

**Category:** Unit Test
**Priority:** High
**Feature:** All Phases - Schema Structure

**Test Description:**
Verify DEFAULT_INVOICE_SCHEMA has correct structure and all expected fields.

**Test Steps:**
1. Import DEFAULT_INVOICE_SCHEMA
2. Validate schema structure
3. Check all required sections exist
4. Verify field configurations

**Validation Checks:**
```typescript
// Schema structure
assert(schema.version === "1.0", "Schema version is 1.0");
assert(schema.paperSize, "Paper size is defined");
assert(typeof schema.priceIncludesVat === "boolean", "priceIncludesVat is boolean");
assert(Array.isArray(schema.sections), "Sections is array");
assert(schema.sections.length === 7, "Has 7 sections");

// Section types
const expectedTypes = ["header", "title", "customer", "metadata", "items", "summary", "footer"];
const actualTypes = schema.sections.map(s => s.type);
assert(JSON.stringify(actualTypes.sort()) === JSON.stringify(expectedTypes.sort()),
  "All section types present");

// Header section
const header = schema.sections.find(s => s.type === "header");
assert(header.config.showBranchName !== undefined, "Has showBranchName");
assert(header.config.branchNameLabel, "Has branchNameLabel");
assert(header.config.addressLabel, "Has addressLabel");
assert(header.config.phoneLabel, "Has phoneLabel");
assert(header.config.vatNumberLabel, "Has vatNumberLabel");
assert(header.config.crnLabel, "Has crnLabel");

// Customer section - National Address
const customer = schema.sections.find(s => s.type === "customer");
const nationalAddressFields = ["buildingNumber", "streetName", "district", "city",
  "postalCode", "additionalNumber", "unitNumber"];
nationalAddressFields.forEach(field => {
  assert(customer.config.fields.some(f => f.key === field),
    `Customer section has ${field} field`);
});

// Footer section - Barcode
const footer = schema.sections.find(s => s.type === "footer");
assert(footer.config.showBarcode !== undefined, "Has showBarcode");
assert(footer.config.barcodeLabel, "Has barcodeLabel");
assert(footer.config.barcodeFormat, "Has barcodeFormat");
assert(typeof footer.config.barcodeWidth === "number", "Has barcodeWidth");
assert(typeof footer.config.barcodeHeight === "number", "Has barcodeHeight");

// RTL support
assert(schema.rtl === undefined || typeof schema.rtl === "boolean",
  "RTL is undefined or boolean");
```

**Expected Results:**
- Schema has correct version and structure
- All 7 sections present with correct types
- All Phase 1-5 fields are included
- Field visibility defaults are correct

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### UT-07: Field Label Customization

**Category:** Unit Test
**Priority:** Medium
**Feature:** Phase 1 - Label Editing

**Test Description:**
Verify custom field labels are applied correctly in invoice rendering.

**Test Data:**
```typescript
const customSchema = {
  ...DEFAULT_INVOICE_SCHEMA,
  sections: DEFAULT_INVOICE_SCHEMA.sections.map(section => {
    if (section.type === "header") {
      return {
        ...section,
        config: {
          ...section.config,
          branchNameLabel: "Company Name (Custom)",
          addressLabel: "Location (Custom)",
          phoneLabel: "Tel (Custom)",
          vatNumberLabel: "Tax ID (Custom)",
          crnLabel: "Reg# (Custom)",
        }
      };
    }
    return section;
  })
};

const testData = {
  branchName: "Test Company",
  address: "123 Main St",
  phone: "+1234567890",
  vatNumber: "VAT123",
  commercialRegNumber: "CR456",
  // ... other required fields
};
```

**Test Steps:**
1. Render InvoicePreview with custom schema
2. Inspect rendered HTML
3. Verify custom labels appear instead of defaults

**Expected Results:**
- Custom labels render in place of default labels
- Label text matches schema configuration
- No rendering errors

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### UT-08: Order Type and Payment Method Enums

**Category:** Unit Test
**Priority:** Medium
**Feature:** Phase 2 - Missing Fields

**Test Description:**
Verify OrderType and PaymentMethod enums have correct values.

**Validation:**
```typescript
// OrderType enum
assert(OrderType.TakeOut === 0, "TakeOut = 0");
assert(OrderType.DineIn === 1, "DineIn = 1");
assert(OrderType.Delivery === 2, "Delivery = 2");

// PaymentMethod enum
assert(PaymentMethod.Cash === 0, "Cash = 0");
assert(PaymentMethod.Card === 1, "Card = 1");
assert(PaymentMethod.DigitalWallet === 2, "DigitalWallet = 2");
assert(PaymentMethod.BankTransfer === 3, "BankTransfer = 3");
assert(PaymentMethod.Multiple === 4, "Multiple = 4");

// Enum names
assert(OrderType[0] === "TakeOut", "OrderType 0 is TakeOut");
assert(PaymentMethod[4] === "Multiple", "PaymentMethod 4 is Multiple");
```

**Expected Results:**
- All enum values match specification
- Enum to string conversion works correctly
- No duplicate values

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

## Integration Tests

### IT-01: Invoice Template CRUD Operations

**Category:** Integration Test
**Priority:** High
**Feature:** All Phases - Template Management

**Test Description:**
Verify complete CRUD cycle for invoice templates.

**Test Steps:**

**1. Create Template:**
```http
POST /api/v1/invoice-templates
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Test Template - IT01",
  "description": "Integration test template",
  "paperSize": 1,
  "schema": "{...DEFAULT_INVOICE_SCHEMA...}",
  "setAsActive": false
}
```

**Expected:** 201 Created, returns template with ID

**2. Read Template:**
```http
GET /api/v1/invoice-templates/{id}
Authorization: Bearer {token}
```

**Expected:** 200 OK, returns complete template

**3. Update Template:**
```http
PUT /api/v1/invoice-templates/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Test Template - IT01 (Updated)",
  "description": "Updated description",
  "paperSize": 1,
  "schema": "{...modified schema...}"
}
```

**Expected:** 200 OK, returns updated template

**4. List Templates:**
```http
GET /api/v1/invoice-templates
Authorization: Bearer {token}
```

**Expected:** 200 OK, list includes test template

**5. Activate Template:**
```http
POST /api/v1/invoice-templates/{id}/activate
Authorization: Bearer {token}
```

**Expected:** 200 OK, template.isActive = true

**6. Delete Template:**
```http
DELETE /api/v1/invoice-templates/{id}
Authorization: Bearer {token}
```

**Expected:** 204 No Content

**7. Verify Deletion:**
```http
GET /api/v1/invoice-templates/{id}
Authorization: Bearer {token}
```

**Expected:** 404 Not Found

**Validation:**
- All operations complete successfully
- Data persists correctly
- Schema JSON serialization/deserialization works
- Active template toggling works
- Deleted templates cannot be retrieved

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### IT-02: Customer with National Address

**Category:** Integration Test
**Priority:** High
**Feature:** Phase 4 - Saudi National Address

**Test Description:**
Verify customer creation, update, and retrieval with Saudi National Address fields.

**Test Steps:**

**1. Create Customer with Full Address:**
```http
POST /api/v1/customers
Authorization: Bearer {token}
Content-Type: application/json

{
  "code": "TEST-IT02",
  "nameEn": "Test Customer",
  "nameAr": "عميل تجريبي",
  "phone": "+966501234567",
  "email": "test@example.com",
  "buildingNumber": "7700",
  "streetName": "King Fahd Road",
  "district": "Al Olaya",
  "city": "Riyadh",
  "postalCode": "12345",
  "additionalNumber": "6789",
  "unitNumber": "Suite 301",
  "isActive": true
}
```

**Expected:** 201 Created, returns customer with all address fields

**2. Retrieve Customer:**
```http
GET /api/v1/customers/{id}
Authorization: Bearer {token}
```

**Expected:**
- 200 OK
- All national address fields present
- Values match input

**3. Update Address:**
```http
PUT /api/v1/customers/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  ...existing fields...,
  "buildingNumber": "8800",
  "streetName": "Olaya Street",
  "postalCode": "54321",
  "additionalNumber": "9876"
}
```

**Expected:** 200 OK, updated address fields

**4. Create Customer with Partial Address:**
```http
POST /api/v1/customers
{
  "code": "TEST-IT02-PARTIAL",
  "nameEn": "Partial Address Customer",
  "buildingNumber": "1234",
  "city": "Jeddah",
  // Other address fields omitted
}
```

**Expected:** 201 Created, optional fields are null

**Validation:**
- All 7 national address fields persist correctly
- Postal code validation (5 digits) enforced
- Additional number validation (4 digits) enforced
- Optional fields can be null
- Address fields retrievable via API

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### IT-03: Sale with Extended Fields

**Category:** Integration Test
**Priority:** High
**Feature:** Phase 2 - Missing Fields

**Test Description:**
Verify sale creation with OrderNumber, OrderType, AmountPaid, ChangeReturned.

**Test Steps:**

**1. Create Sale with All Fields:**
```http
POST /api/v1/sales
Authorization: Bearer {token}
Content-Type: application/json

{
  "customerId": "{existingCustomerId}",
  "orderNumber": "ORD-2025-001",
  "orderType": 0,  // TakeOut
  "paymentMethod": 0,  // Cash
  "amountPaid": 150.00,
  "changeReturned": 10.00,
  "invoiceType": 1,  // Simplified
  "lineItems": [
    {
      "productId": "{existingProductId}",
      "barcode": "1234567890",
      "unit": "piece",
      "quantity": 2,
      "unitPrice": 50.00,
      "discountType": 0,
      "discountValue": 0,
      "notes": "Extra packaging"
    }
  ]
}
```

**Expected:** 201 Created, sale includes all new fields

**2. Retrieve Sale:**
```http
GET /api/v1/sales/{id}
Authorization: Bearer {token}
```

**Expected:**
- 200 OK
- OrderNumber, OrderType present
- AmountPaid, ChangeReturned present
- Line items include barcode, unit, notes
- OrderTypeName computed correctly ("TakeOut")

**3. Get Invoice:**
```http
GET /api/v1/sales/{id}/invoice
Authorization: Bearer {token}
```

**Expected:**
- Invoice data includes orderNumber, orderType, paymentMethod
- Line items include barcode, unit, notes
- AmountPaid and ChangeReturned in summary

**Validation:**
- All Phase 2 fields persist correctly
- Enum values map correctly
- Optional fields can be null
- Invoice generation includes new fields

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### IT-04: Database Migrations

**Category:** Integration Test
**Priority:** High
**Feature:** Phase 2, Phase 4 - Migrations

**Test Description:**
Verify database migrations apply successfully without data loss.

**Test Steps:**

**1. Check Current Migration Status:**
```bash
cd Backend
dotnet ef migrations list --context BranchDbContext
```

**Expected:** List shows both migrations:
- AddInvoiceFieldsToSalesAndLineItems
- AddSaudiNationalAddressToCustomers

**2. Apply Migrations (if not applied):**
```bash
dotnet ef database update --context BranchDbContext
```

**Expected:** Migrations apply successfully, no errors

**3. Verify Sales Table Schema:**
```sql
-- Run against branch database
PRAGMA table_info(Sales);
-- or
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Sales';
```

**Expected Columns:**
- OrderNumber (nvarchar(50), nullable)
- OrderType (int, nullable)
- AmountPaid (decimal, nullable)
- ChangeReturned (decimal, nullable)

**4. Verify SaleLineItems Table Schema:**
```sql
PRAGMA table_info(SaleLineItems);
```

**Expected Columns:**
- Barcode (nvarchar(100), nullable)
- Unit (nvarchar(50), nullable)
- Notes (nvarchar(500), nullable)

**5. Verify Customers Table Schema:**
```sql
PRAGMA table_info(Customers);
```

**Expected Columns:**
- BuildingNumber (nvarchar(10), nullable)
- StreetName (nvarchar(200), nullable)
- District (nvarchar(200), nullable)
- City (nvarchar(100), nullable)
- PostalCode (nvarchar(10), nullable)
- AdditionalNumber (nvarchar(10), nullable)
- UnitNumber (nvarchar(50), nullable)

**6. Test Data Integrity:**
- Create test records before migration (if testing fresh)
- Apply migrations
- Verify existing records still accessible
- Verify new fields are null for old records

**Validation:**
- All migrations apply without errors
- All new columns created with correct types
- Existing data preserved
- Nullable constraints correct
- No foreign key issues

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

## Visual/UI Tests

### VT-01: RTL Layout - Arabic Invoice

**Category:** Visual Test
**Priority:** High
**Feature:** Phase 5 - RTL Layout

**Test Description:**
Verify invoice renders correctly in RTL mode with Arabic content.

**Test Setup:**
1. Create invoice template with rtl=true
2. Create customer with Arabic name: "محمد أحمد"
3. Set branch name Arabic: "شركة الرياض"
4. Create sale with Arabic product names

**Test Steps:**
1. Navigate to invoice preview
2. Observe layout direction
3. Check text alignment
4. Verify table column order

**Visual Checklist:**
- [ ] Main container has dir="rtl" attribute
- [ ] Text flows right-to-left
- [ ] Headers aligned to right
- [ ] Table columns reversed (Total → Price → Qty → Name)
- [ ] Table headers aligned right
- [ ] Table cells aligned right
- [ ] Arabic text displays correctly (not reversed characters)
- [ ] Numbers display correctly (not mirrored)
- [ ] Borders and spacing look natural
- [ ] QR code and barcode not mirrored (still left-to-right)

**Screenshot Required:** Yes

**Expected Result:**
- Complete visual mirroring
- Natural Arabic reading flow
- Professional appearance
- No layout artifacts or overlaps

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### VT-02: RTL Layout - Mixed Content

**Category:** Visual Test
**Priority:** High
**Feature:** Phase 5 - RTL Layout

**Test Description:**
Verify invoice handles mixed English-Arabic content correctly.

**Test Setup:**
- Branch name: "ABC Company" (English)
- Customer name: "محمد أحمد" (Arabic)
- Products: Mix of English and Arabic names
- RTL mode: auto-detect (triggered by customerName)

**Visual Checklist:**
- [ ] Overall layout is RTL
- [ ] English text readable (not reversed)
- [ ] Arabic text readable (proper RTL)
- [ ] Each line has correct direction
- [ ] Mixed lines display naturally
- [ ] Product names with mixed content display correctly
- [ ] Numbers in correct positions

**Screenshot Required:** Yes

**Expected Result:**
- Proper bidirectional text handling
- Each piece of text in its natural direction
- No text overlap or spacing issues
- Professional mixed-language appearance

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### VT-03: Barcode Display - All Formats

**Category:** Visual Test
**Priority:** Medium
**Feature:** Phase 3 - Invoice Barcode

**Test Description:**
Verify barcode renders correctly with different configurations.

**Test Cases:**

**1. CODE128 (default):**
- Value: "INV-2025-001"
- Width: 2, Height: 50
- Display value: true

**2. EAN13:**
- Value: "1234567890123" (13 digits)
- Width: 2, Height: 40
- Display value: true

**3. QR Alternative (CODE39):**
- Value: "TEST123"
- Width: 3, Height: 60
- Display value: false

**Visual Checklist:**
- [ ] Barcode renders without errors
- [ ] Barcode is scannable (if scanner available)
- [ ] Value text displays below (when enabled)
- [ ] Value text hidden (when disabled)
- [ ] Width adjustment works correctly
- [ ] Height adjustment works correctly
- [ ] Barcode centered in container
- [ ] Label displays above barcode

**Screenshot Required:** Yes (one per format)

**Expected Result:**
- Clear, scannable barcodes
- Proper proportions
- No pixelation or blur
- Value text legible

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### VT-04: Saudi National Address Display

**Category:** Visual Test
**Priority:** High
**Feature:** Phase 4 - Saudi National Address

**Test Description:**
Verify national address fields display correctly in invoice.

**Test Setup:**
1. Enable all national address fields in template
2. Create customer with complete address:
   - Building Number: 7700
   - Street Name: King Fahd Road
   - District: Al Olaya
   - City: Riyadh
   - Postal Code: 12345
   - Additional Number: 6789
   - Unit Number: Suite 301

**Visual Checklist:**
- [ ] All 7 address fields visible
- [ ] Fields display in logical order
- [ ] Labels clear and readable
- [ ] Values aligned properly
- [ ] No field overlap
- [ ] Spacing consistent with other fields
- [ ] Long street names wrap correctly
- [ ] Arabic addresses (if any) display correctly

**Screenshot Required:** Yes

**Expected Result:**
- Professional address block
- Easy to read and understand
- Proper formatting
- Matches Saudi address standards

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### VT-05: Custom Field Labels

**Category:** Visual Test
**Priority:** Medium
**Feature:** Phase 1 - Label Editing

**Test Description:**
Verify custom labels display throughout invoice.

**Test Setup:**
1. Create template with custom labels:
   - Branch Name → "Company"
   - VAT Number → "Tax ID"
   - CR Number → "Reg #"
   - ZATCA QR → "Scan Here"
   - Notes → "Thank You!"
2. Generate invoice

**Visual Checklist:**
- [ ] Custom header labels display
- [ ] Custom footer labels display
- [ ] Labels not truncated
- [ ] Labels properly aligned with values
- [ ] Multi-language labels (if any) display correctly

**Screenshot Required:** Yes

**Expected Result:**
- All custom labels visible
- Professional appearance
- Clear association with values

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### VT-06: Builder UI - All Controls

**Category:** Visual Test
**Priority:** Medium
**Feature:** All Phases - Builder Interface

**Test Description:**
Verify all builder controls render and function correctly.

**Test Steps:**
1. Navigate to invoice builder (create page)
2. Test each control section

**Visual Checklist:**

**Header Section:**
- [ ] Show Branch Name checkbox
- [ ] Branch Name label input (appears when checked)
- [ ] Show Logo checkbox
- [ ] Show Address checkbox
- [ ] Address label input
- [ ] Show Phone checkbox
- [ ] Phone label input
- [ ] Show VAT Number checkbox
- [ ] VAT Number label input
- [ ] Show CRN checkbox
- [ ] CRN label input

**Footer Section:**
- [ ] Show Barcode checkbox
- [ ] Barcode label input
- [ ] Barcode width/height inputs
- [ ] Show barcode value checkbox
- [ ] Show ZATCA QR checkbox
- [ ] ZATCA QR label input
- [ ] Show Order Type checkbox
- [ ] Order Type label input
- [ ] Show Payment Method checkbox
- [ ] Payment Method label input
- [ ] Show Notes checkbox
- [ ] Notes label input
- [ ] Notes text area

**General:**
- [ ] RTL layout toggle
- [ ] Paper size selector
- [ ] Custom width/height (when custom selected)
- [ ] All inputs styled consistently
- [ ] Dark mode support (if applicable)
- [ ] Responsive layout

**Screenshot Required:** Yes (full page)

**Expected Result:**
- All controls visible and functional
- Clear visual hierarchy
- Consistent styling
- No UI glitches or overlaps

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

## Browser Compatibility Tests

### BC-01: Cross-Browser Rendering

**Category:** Browser Test
**Priority:** Medium
**Feature:** All Phases - Frontend

**Test Description:**
Verify invoice renders correctly across major browsers.

**Browsers to Test:**
1. Chrome (latest)
2. Firefox (latest)
3. Safari (latest, if available)
4. Edge (latest)

**Test Steps:**
1. Open invoice preview in each browser
2. Test both LTR and RTL modes
3. Verify all visual elements

**Checklist (per browser):**
- [ ] Invoice renders without errors
- [ ] Fonts load correctly
- [ ] Arabic text displays correctly
- [ ] RTL layout works
- [ ] Barcodes render
- [ ] QR codes render
- [ ] Print preview works
- [ ] No console errors
- [ ] Performance acceptable

**Screenshot Required:** Yes (one per browser)

**Known Issues:**
- Document any browser-specific issues
- Check for polyfill needs

**Expected Result:**
- Consistent rendering across all browsers
- Minor acceptable differences only
- No critical functionality broken

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### BC-02: Mobile Responsiveness

**Category:** Browser Test
**Priority:** Medium
**Feature:** All Phases - Frontend

**Test Description:**
Verify invoice builder and preview work on mobile devices.

**Devices to Test:**
1. iPhone (iOS Safari)
2. Android phone (Chrome)
3. iPad/tablet (if available)
4. Browser DevTools mobile emulation

**Test Steps:**
1. Open invoice builder on mobile
2. Create/edit template
3. View invoice preview
4. Test all major controls

**Checklist:**
- [ ] Builder UI accessible on mobile
- [ ] All controls reachable
- [ ] Touch targets adequate size
- [ ] Invoice preview readable
- [ ] No horizontal scroll (where inappropriate)
- [ ] Text size appropriate
- [ ] Buttons work with touch
- [ ] Forms submit correctly

**Screenshot Required:** Yes (key screens)

**Expected Result:**
- Usable on mobile devices
- May have simplified UI
- Core functionality intact
- Acceptable user experience

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### BC-03: RTL Support Verification

**Category:** Browser Test
**Priority:** High
**Feature:** Phase 5 - RTL Layout

**Test Description:**
Verify dir="rtl" attribute works correctly across browsers.

**Test Cases:**

**1. Auto-Detection Test:**
- Create invoice with Arabic content
- Verify automatic RTL activation
- Test in each browser

**2. Manual Toggle Test:**
- Enable RTL toggle in builder
- Verify preview updates
- Test in each browser

**3. Print Test:**
- Generate RTL invoice
- Open print preview
- Verify RTL preserved in print

**Checklist (per browser):**
- [ ] dir="rtl" attribute applied
- [ ] Layout mirrors correctly
- [ ] Text alignment right
- [ ] Flex direction reverses
- [ ] Margins mirror
- [ ] Table columns reverse
- [ ] Print preserves RTL

**Expected Result:**
- Consistent RTL behavior
- All browsers support dir attribute
- No layout breaking

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

## Print Tests

### PT-01: Print Layout - All Paper Sizes

**Category:** Print Test
**Priority:** Medium
**Feature:** All Phases - Printing

**Test Description:**
Verify invoice prints correctly on all supported paper sizes.

**Test Cases:**

**1. 58mm Thermal:**
- Select 58mm thermal template
- Generate invoice
- Print preview
- Check width constraint
- Verify content fits

**2. 80mm Thermal:**
- Select 80mm thermal template
- Generate invoice
- Print preview
- Check width constraint
- Verify content fits

**3. A4 Paper:**
- Select A4 template
- Generate invoice
- Print preview
- Check margins
- Verify professional appearance

**Print Checklist:**
- [ ] Content fits page width
- [ ] No content cut off
- [ ] Fonts readable
- [ ] Barcodes/QR codes print clearly
- [ ] Colors acceptable (if color printer)
- [ ] Grayscale acceptable (if B&W printer)
- [ ] Page breaks logical (multi-page)
- [ ] Headers/footers appropriate

**Physical Print:** Recommended (at least one paper size)

**Expected Result:**
- Professional print output
- All content visible
- Scannable codes
- Appropriate for business use

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### PT-02: RTL Print Verification

**Category:** Print Test
**Priority:** High
**Feature:** Phase 5 - RTL Layout

**Test Description:**
Verify RTL layout preserved in print output.

**Test Steps:**
1. Create RTL invoice (Arabic content or forced RTL)
2. Open browser print preview (Ctrl+P / Cmd+P)
3. Check layout direction
4. Print to PDF
5. Open PDF and verify
6. Physical print (optional)

**Print Checklist:**
- [ ] RTL direction maintained
- [ ] Text aligned right
- [ ] Table columns reversed
- [ ] Arabic text correct
- [ ] Layout mirrors preserved
- [ ] No visual artifacts
- [ ] Professional appearance

**Print to PDF:** Required

**Expected Result:**
- Print output matches screen preview
- RTL layout preserved
- Professional quality

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

## User Acceptance Tests

### UAT-01: English-Only Invoice Flow

**Category:** User Acceptance Test
**Priority:** High
**Feature:** All Phases - End-to-End

**Test Description:**
Complete workflow for English-language business.

**Persona:** English-language business owner in UAE

**User Story:**
"As an English-speaking business owner, I want to create professional invoices with my company details, so customers receive clear documentation."

**Test Steps:**

1. **Create Custom Template:**
   - Log in to system
   - Navigate to Invoice Builder
   - Create new template "My Business - English"
   - Set paper size: A4
   - Customize labels (optional)
   - Disable RTL (or leave auto)
   - Save template

2. **Configure Company Details:**
   - Set company name: "ABC Trading LLC"
   - Upload logo
   - Set VAT number
   - Set CR number
   - Set address, phone, email

3. **Create Customer:**
   - Add new customer "John Smith"
   - English name only
   - Phone, email
   - No Arabic content

4. **Create Sale:**
   - Select customer
   - Add products
   - Set order number
   - Select payment method: Card
   - Set order type: Take Out
   - Complete sale

5. **Generate Invoice:**
   - View invoice preview
   - Verify all details
   - Print preview
   - Export/Print

**Acceptance Criteria:**
- [ ] Template created successfully
- [ ] Company details saved
- [ ] Customer created
- [ ] Sale completed
- [ ] Invoice generated
- [ ] Invoice in LTR (English) layout
- [ ] All fields visible and correct
- [ ] Professional appearance
- [ ] Print quality acceptable
- [ ] No errors encountered

**Expected Result:**
- Smooth end-to-end flow
- Professional English invoice
- User satisfied with output

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### UAT-02: Arabic-Only Invoice Flow

**Category:** User Acceptance Test
**Priority:** High
**Feature:** All Phases - End-to-End

**Test Description:**
Complete workflow for Arabic-language business.

**Persona:** Arabic-speaking business owner in Saudi Arabia

**User Story:**
"As an Arabic-speaking business owner, I want to create invoices in Arabic with proper RTL layout and Saudi address format."

**Test Steps:**

1. **Create Arabic Template:**
   - Navigate to Invoice Builder
   - Create new template "نموذج الفاتورة"
   - Set paper size: 80mm thermal
   - **Enable RTL layout** (checkbox)
   - Customize labels in Arabic (optional)
   - Save template

2. **Configure Company Details:**
   - Company name Arabic: "شركة الرياض للتجارة"
   - Set VAT number
   - Set CR number
   - Set address in Arabic

3. **Create Customer with National Address:**
   - Customer name: "محمد أحمد"
   - Phone: +966501234567
   - Building Number: 7700
   - Street: شارع الملك فهد
   - District: العليا
   - City: الرياض
   - Postal Code: 12345
   - Additional Number: 6789

4. **Create Sale:**
   - Select customer
   - Add products (Arabic names)
   - Complete sale

5. **Generate Invoice:**
   - View invoice preview
   - Verify RTL layout
   - Verify Arabic text correct
   - Verify national address displays
   - Print preview

**Acceptance Criteria:**
- [ ] Template with RTL enabled
- [ ] Arabic company details saved
- [ ] Customer with full national address created
- [ ] Sale completed
- [ ] Invoice in RTL layout
- [ ] Arabic text displays correctly (not reversed)
- [ ] National address formatted properly
- [ ] Professional Arabic appearance
- [ ] Print quality acceptable

**Expected Result:**
- Smooth Arabic workflow
- Professional RTL invoice
- Saudi address format correct
- User satisfied with output

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### UAT-03: Mixed Language Business

**Category:** User Acceptance Test
**Priority:** High
**Feature:** All Phases - End-to-End

**Test Description:**
Business serving both English and Arabic customers.

**Persona:** Bilingual business in Dubai

**User Story:**
"As a bilingual business, I want one system that handles both English and Arabic invoices automatically based on customer."

**Test Steps:**

1. **Create Bilingual Template:**
   - Template name: "Dual Language Template"
   - Paper size: A4
   - **Leave RTL as auto-detect** (don't force)
   - Save template

2. **Create English Customer:**
   - Name: "David Wilson"
   - English details only
   - Create sale
   - Generate invoice
   - **Verify: LTR layout** (auto-detected)

3. **Create Arabic Customer:**
   - Name: "أحمد السعيد"
   - Arabic name
   - With national address
   - Create sale
   - Generate invoice
   - **Verify: RTL layout** (auto-detected)

4. **Create Mixed Customer:**
   - English company name
   - Arabic contact person
   - Create sale
   - Generate invoice
   - **Verify: Layout direction appropriate**

**Acceptance Criteria:**
- [ ] Single template for all customers
- [ ] English customer → LTR invoice (auto)
- [ ] Arabic customer → RTL invoice (auto)
- [ ] Mixed content handled gracefully
- [ ] No manual RTL toggling needed
- [ ] Both invoice types professional
- [ ] System detects language automatically
- [ ] User workflow simple

**Expected Result:**
- Seamless bilingual operation
- Automatic language detection
- Both layouts professional
- User satisfied with flexibility

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### UAT-04: Barcode Scanning Verification

**Category:** User Acceptance Test
**Priority:** Medium
**Feature:** Phase 3 - Invoice Barcode

**Test Description:**
Verify generated barcodes are scannable.

**Persona:** Warehouse manager using barcode scanner

**User Story:**
"As a warehouse manager, I want to scan invoice barcodes to quickly retrieve invoice information."

**Test Steps:**

1. **Setup:**
   - Obtain barcode scanner (or smartphone with scanner app)
   - Create template with barcode enabled
   - Set format: CODE128
   - Set appropriate size (width: 2, height: 50)

2. **Generate Test Invoices:**
   - Create 5 different invoices
   - Each with unique invoice number
   - Print each invoice (or display on screen)

3. **Scan Test:**
   - Scan each barcode
   - Record scanned value
   - Verify matches invoice number

4. **Different Formats:**
   - Test CODE128
   - Test EAN13 (if applicable)
   - Test CODE39

**Acceptance Criteria:**
- [ ] Barcodes scan successfully
- [ ] Scanned value matches invoice number
- [ ] Scanner reads barcode first try (or within 3 attempts)
- [ ] Works on printed paper
- [ ] Works on screen (if scanner supports)
- [ ] Multiple formats work
- [ ] Barcode size appropriate

**Equipment Needed:**
- Barcode scanner or smartphone with scanner app
- Printer (for physical test)

**Expected Result:**
- All barcodes scannable
- Quick scan (< 3 seconds)
- Accurate data capture
- Professional implementation

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### UAT-05: Complete Template Customization

**Category:** User Acceptance Test
**Priority:** Medium
**Feature:** All Phases - Customization

**Test Description:**
User customizes all available features.

**Persona:** Detail-oriented business owner

**User Story:**
"As a detail-oriented user, I want full control over invoice appearance with all customization options."

**Customization Checklist:**

**Phase 1 - Labels:**
- [ ] Change header labels (address, phone, VAT, CRN)
- [ ] Change footer labels (QR, notes)
- [ ] Verify labels display

**Phase 2 - Fields:**
- [ ] Enable order number field
- [ ] Enable order type display
- [ ] Enable payment method display
- [ ] Enable item barcode column
- [ ] Enable item unit column
- [ ] Enable item discount column
- [ ] Enable item VAT column
- [ ] Enable item notes column
- [ ] Enable paid/change fields
- [ ] Verify all fields work in invoice

**Phase 3 - Barcode:**
- [ ] Enable invoice barcode
- [ ] Customize barcode label
- [ ] Adjust barcode size
- [ ] Test different format
- [ ] Verify barcode renders

**Phase 4 - National Address:**
- [ ] Enable building number
- [ ] Enable street name
- [ ] Enable district
- [ ] Enable city
- [ ] Enable postal code
- [ ] Enable additional number
- [ ] Enable unit number
- [ ] Verify address displays

**Phase 5 - RTL:**
- [ ] Test auto-detect mode
- [ ] Test forced RTL mode
- [ ] Test forced LTR mode
- [ ] Verify layout changes

**General:**
- [ ] Change paper size
- [ ] Test custom size (if applicable)
- [ ] Reorder sections (if supported)
- [ ] Save template
- [ ] Generate invoice
- [ ] Verify all customizations applied

**Expected Result:**
- All customization options work
- Changes persist after save
- Invoice reflects all changes
- Professional appearance maintained
- User satisfied with flexibility

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

## Performance Tests

### PERF-01: Invoice Generation Performance

**Category:** Performance Test
**Priority:** Low
**Feature:** All Phases - Performance

**Test Description:**
Measure time to generate invoice with all features enabled.

**Test Setup:**
- Template with all Phase 1-5 features enabled
- Customer with full national address
- Sale with 20 line items
- Each item has barcode, unit, notes, discount, VAT

**Test Steps:**
1. Record start time
2. Call GET /api/v1/sales/{id}/invoice
3. Record end time
4. Calculate response time
5. Repeat 10 times
6. Calculate average, min, max

**Performance Targets:**
- Average: < 500ms
- Maximum: < 1000ms
- P95: < 800ms

**Test Results Table:**
| Run | Response Time (ms) | Notes |
|-----|-------------------|-------|
| 1   | ___ ms            |       |
| 2   | ___ ms            |       |
| 3   | ___ ms            |       |
| 4   | ___ ms            |       |
| 5   | ___ ms            |       |
| 6   | ___ ms            |       |
| 7   | ___ ms            |       |
| 8   | ___ ms            |       |
| 9   | ___ ms            |       |
| 10  | ___ ms            |       |
| **Avg** | ___ ms        |       |

**Expected Result:**
- Response time within target
- No memory leaks
- CPU usage reasonable
- No performance degradation over time

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

### PERF-02: Frontend Rendering Performance

**Category:** Performance Test
**Priority:** Low
**Feature:** All Phases - Performance

**Test Description:**
Measure invoice preview rendering time.

**Test Setup:**
- Invoice with 50 line items
- All fields visible
- Barcode and QR code enabled
- RTL mode enabled

**Test Steps:**
1. Open browser DevTools Performance tab
2. Start recording
3. Navigate to invoice preview
4. Wait for complete render
5. Stop recording
6. Analyze metrics

**Metrics to Record:**
- Time to First Render: ___ ms
- Time to Interactive: ___ ms
- Total Rendering Time: ___ ms
- Frame Rate: ___ fps
- Memory Usage: ___ MB

**Performance Targets:**
- First Render: < 1000ms
- Time to Interactive: < 2000ms
- Frame Rate: > 30fps
- Memory Usage: < 100MB

**Browser Tests:**
- Chrome: ___
- Firefox: ___
- Safari: ___
- Edge: ___

**Expected Result:**
- Smooth rendering
- No janky scrolling
- No memory leaks
- Acceptable on older devices

**Status:** ⏳ Pending
**Actual Result:** _To be filled during testing_

---

## Test Execution Summary

### Execution Instructions

**1. Prepare Test Environment:**
```bash
# Backend
cd Backend
dotnet ef database update --context BranchDbContext
dotnet run

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

**2. Create Test User:**
```http
POST /api/v1/auth/login
{
  "username": "admin",
  "password": "123"
}
```
Save the JWT token for subsequent requests.

**3. Execute Tests:**
- Follow each test case in order
- Mark status as Pass ✅, Fail ❌, or Skip ⏭️
- Record actual results
- Take screenshots where required
- Note any issues or unexpected behavior

**4. Report Issues:**
- Create detailed bug reports for failures
- Include steps to reproduce
- Attach screenshots/logs
- Categorize severity (Critical/Major/Minor)

---

## Test Results Summary

_To be completed after test execution_

### Summary Statistics

| Category | Total | Pass | Fail | Skip | Pass Rate |
|----------|-------|------|------|------|-----------|
| Unit Tests | 8 | - | - | - | -% |
| Integration Tests | 4 | - | - | - | -% |
| Visual/UI Tests | 6 | - | - | - | -% |
| Browser Tests | 3 | - | - | - | -% |
| Print Tests | 2 | - | - | - | -% |
| User Acceptance Tests | 5 | - | - | - | -% |
| Performance Tests | 2 | - | - | - | -% |
| **TOTAL** | **30** | **-** | **-** | **-** | **-%** |

### Critical Issues Found

_List any critical issues that block release_

### Major Issues Found

_List major issues that impact functionality_

### Minor Issues Found

_List minor issues and cosmetic problems_

### Recommendations

_Testing team recommendations for improvements_

---

## Sign-Off

### Test Lead Approval

- **Name:** _______________
- **Date:** _______________
- **Signature:** _______________
- **Status:** ⏳ Pending / ✅ Approved / ❌ Rejected

### Product Owner Approval

- **Name:** _______________
- **Date:** _______________
- **Signature:** _______________
- **Status:** ⏳ Pending / ✅ Approved / ❌ Rejected

---

**Document Status:** 🟡 Ready for Testing
**Last Updated:** December 10, 2025
**Version:** 1.0
**Next Review:** After test execution completion
