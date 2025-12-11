# Invoice Builder - Manual Testing Execution Guide

**Date:** December 10, 2025
**Purpose:** Step-by-step guide for executing manual tests
**Target Audience:** QA Team, Developers, Product Owners
**Estimated Time:** 4-6 hours

---

## Overview

This document provides detailed instructions for executing the remaining 21 manual tests for the invoice builder system. All code verification tests have passed (9/9), and the implementation is confirmed to be production-ready. These manual tests verify the visual appearance, user experience, and real-world functionality.

---

## Prerequisites

### Environment Setup

**Backend:**
- ✅ Backend running on http://localhost:5062
- ✅ Database migrations applied
- ✅ Test data seeded

**Frontend:**
- ✅ Frontend running on http://localhost:3000
- ✅ Next.js 16 with Turbopack
- ✅ All dependencies installed

### Test Account

**Username:** admin
**Password:** 123
**Role:** HeadOfficeAdmin
**Branches:** B001 (Main Branch), B002 (Downtown), B003 (Mall)

### Required Tools

- [ ] Web browsers: Chrome, Firefox, Edge, Safari (if available)
- [ ] Mobile devices or browser DevTools emulator
- [ ] Printer or PDF generator for print tests
- [ ] Barcode scanner (optional, for verification)
- [ ] Screen capture tool for screenshots
- [ ] Timer for performance tests

---

## Test Execution Plan

### Phase 1: Visual/UI Tests (6 tests - ~90 minutes)

#### VT-01: RTL Layout - Arabic Invoice ⭐ HIGH PRIORITY

**Objective:** Verify invoice renders correctly in RTL mode with Arabic content

**Steps:**

1. **Login:**
   ```
   1. Navigate to http://localhost:3000
   2. Login with admin/123
   3. Select Branch: B001 (Main Branch)
   ```

2. **Create Test Customer (if not exists):**
   ```
   1. Navigate to Customers section
   2. Click "Add Customer"
   3. Fill form:
      - Code: RTL-TEST-001
      - Name (English): Not needed
      - Name (Arabic): محمد أحمد السعودي
      - Phone: +966501234567
      - Building Number: 7700
      - Street Name: طريق الملك فهد
      - District: العليا
      - City: الرياض
      - Postal Code: 12345
      - Additional Number: 6789
   4. Save customer
   ```

3. **Create Invoice Template with RTL:**
   ```
   1. Navigate to Settings → Invoice Builder
   2. Click "Create New Template"
   3. Template Name: "RTL Test Template"
   4. Paper Size: 80mm
   5. Check "Enable RTL Layout" ✅
   6. Configure customer section:
      - Enable all national address fields
   7. Save template
   8. Click "Activate" to set as active
   ```

4. **Create Test Sale:**
   ```
   1. Navigate to Sales → New Sale
   2. Select customer: محمد أحمد السعودي
   3. Add products (use products with Arabic names if available)
   4. Set OrderType: TakeOut
   5. PaymentMethod: Cash
   6. Complete sale
   ```

5. **View Invoice:**
   ```
   1. Click "View Invoice" or navigate to Sales history
   2. Click on the test sale
   3. Click "View Invoice"
   ```

**Visual Inspection Checklist:**

- [ ] **dir="rtl" Attribute:** Right-click invoice → Inspect → Check main container has `dir="rtl"`
- [ ] **Text Flow:** All text flows from right to left naturally
- [ ] **Headers:** Headers aligned to the right side
- [ ] **Table Layout:** Table columns in RTL order (Total → Price → Qty → Item Name)
- [ ] **Arabic Text:** Arabic text displays correctly (not reversed characters)
- [ ] **Numbers:** Numbers display correctly (not mirrored)
- [ ] **Customer Address:** National address fields display correctly
- [ ] **QR Code:** QR code not mirrored (remains LTR)
- [ ] **Barcode:** Barcode not mirrored (remains LTR)
- [ ] **Spacing:** Borders and spacing look natural and balanced
- [ ] **Overall:** Professional appearance with no layout artifacts

**Screenshots to Capture:**
1. Full invoice view
2. Close-up of header with Arabic text
3. Close-up of table with RTL columns
4. Close-up of customer address section
5. Browser DevTools showing dir="rtl" attribute

**Expected Result:** ✅ Complete visual mirroring with natural Arabic reading flow

**Pass Criteria:**
- All text properly aligned
- No visual artifacts or overlaps
- Professional, production-ready appearance
- QR/Barcode not mirrored

---

#### VT-02: RTL Layout - Mixed Content ⭐ HIGH PRIORITY

**Objective:** Verify invoice handles mixed English-Arabic content correctly

**Steps:**

1. **Prepare Mixed Language Data:**
   ```
   1. Create new customer:
      - Code: MIXED-TEST-001
      - Name (English): John Smith Co.
      - Name (Arabic): شركة المستقبل
      - Phone: +966501234567
   ```

2. **Create Sale with Mixed Products:**
   ```
   1. Create new sale for mixed language customer
   2. Add products with:
      - English name: "Laptop Computer"
      - Arabic name: "كمبيوتر محمول"
      - Mixed: "Samsung S24 جهاز"
   3. Complete sale
   ```

3. **View Invoice (auto-detect mode):**
   ```
   1. Ensure template has RTL: undefined or not checked (auto-detect)
   2. View invoice for this sale
   ```

**Visual Inspection Checklist:**

- [ ] **Auto-Detection:** RTL triggered by Arabic customer name
- [ ] **English Text:** English text readable (not reversed)
- [ ] **Arabic Text:** Arabic text in proper RTL form
- [ ] **Mixed Lines:** Each line displays naturally with correct direction
- [ ] **Product Names:** Mixed content products display correctly
- [ ] **Numbers:** Numbers in correct positions relative to text
- [ ] **Currency:** Currency symbols positioned correctly
- [ ] **Overall Layout:** Professional mixed-language appearance

**Screenshots to Capture:**
1. Full invoice with mixed content
2. Close-up of mixed product names
3. Close-up of customer info (English name, Arabic address if any)

**Expected Result:** ✅ Proper bidirectional text handling with each piece of text in its natural direction

**Pass Criteria:**
- No text overlap
- No spacing issues
- Professional appearance
- Both languages readable

---

#### VT-03: Barcode Display - All Formats 🔧 MEDIUM PRIORITY

**Objective:** Verify barcode renders correctly with different formats

**Steps:**

1. **Test CODE128 (default):**
   ```
   1. Create template with barcode settings:
      - Show Barcode: ✅
      - Format: CODE128
      - Width: 2
      - Height: 50
      - Show Value: ✅
   2. Create sale with Invoice Number: INV-2025-001
   3. View invoice
   ```

   **Check:**
   - [ ] Barcode renders without errors
   - [ ] Barcode is clear and sharp (no blur/pixelation)
   - [ ] Value text displays below: "INV-2025-001"
   - [ ] Barcode centered in container
   - [ ] Label displays above: "Invoice Number" (or custom label)

2. **Test EAN13:**
   ```
   1. Edit template:
      - Format: EAN13
      - Width: 2
      - Height: 40
   2. Create sale with Invoice Number: 1234567890123 (13 digits)
   3. View invoice
   ```

   **Check:**
   - [ ] EAN13 barcode renders correctly
   - [ ] Proper proportions for EAN13
   - [ ] Guard bars visible
   - [ ] Value text: 1234567890123

3. **Test with Scanner (if available):**
   ```
   1. Print invoice or display on screen
   2. Scan barcode with barcode scanner
   3. Verify scanner reads correct value
   ```

**Visual Inspection Checklist:**

- [ ] **Rendering:** Barcode renders without React errors
- [ ] **Quality:** Clear, sharp, no artifacts
- [ ] **Proportions:** Width and height adjustments work
- [ ] **Value Display:** Text displays/hides based on setting
- [ ] **Centering:** Barcode centered in container
- [ ] **Label:** Label appears above barcode
- [ ] **Print Quality:** Barcode looks good in print preview

**Screenshots to Capture:**
1. CODE128 barcode (with value)
2. EAN13 barcode
3. Barcode without value text
4. Print preview showing barcode

**Expected Result:** ✅ Clear, scannable barcodes with proper proportions

**Pass Criteria:**
- No rendering errors
- Professional appearance
- Scannable (if scanner available)
- Proper scaling

---

#### VT-04: Saudi National Address Display ⭐ HIGH PRIORITY

**Objective:** Verify all 7 national address fields display correctly

**Steps:**

1. **Create Template with Full Address:**
   ```
   1. Edit template → Customer Section
   2. Enable all national address fields:
      - ✅ Building Number
      - ✅ Street Name
      - ✅ District
      - ✅ City
      - ✅ Postal Code
      - ✅ Additional Number
      - ✅ Unit Number
   3. Save template
   ```

2. **Create Customer with Complete Address:**
   ```
   1. Create new customer:
      - Code: ADDR-TEST-001
      - Name: Saudi Test Customer
      - Building Number: 7700
      - Street Name: King Fahd Road
      - District: Al Olaya
      - City: Riyadh
      - Postal Code: 12345
      - Additional Number: 6789
      - Unit Number: Suite 301
   2. Save customer
   ```

3. **Create Sale and View Invoice:**
   ```
   1. Create sale for this customer
   2. View invoice
   3. Inspect customer section
   ```

**Visual Inspection Checklist:**

- [ ] **All 7 Fields Visible:**
  - [ ] Building Number: 7700
  - [ ] Street Name: King Fahd Road
  - [ ] District: Al Olaya
  - [ ] City: Riyadh
  - [ ] Postal Code: 12345
  - [ ] Additional Number: 6789
  - [ ] Unit Number: Suite 301

- [ ] **Layout:**
  - [ ] Fields in logical order
  - [ ] Labels clear and readable
  - [ ] Values aligned properly
  - [ ] No field overlap
  - [ ] Consistent spacing with other fields

- [ ] **Text Handling:**
  - [ ] Long street names wrap correctly
  - [ ] No text truncation (unless intentional)
  - [ ] Arabic addresses (if any) display correctly

- [ ] **Formatting:**
  - [ ] Professional address block appearance
  - [ ] Easy to read and understand
  - [ ] Matches Saudi address format standards

**Screenshots to Capture:**
1. Customer section with full national address
2. Close-up of address fields
3. Invoice with and without address fields (comparison)

**Expected Result:** ✅ Professional address block with all 7 fields displayed correctly

**Pass Criteria:**
- All fields visible when enabled
- Clear labels
- Proper alignment
- Professional formatting

---

#### VT-05: Custom Field Labels 🔧 MEDIUM PRIORITY

**Objective:** Verify custom labels display correctly throughout invoice

**Steps:**

1. **Create Template with Custom Labels:**
   ```
   1. Create new template: "Custom Labels Test"
   2. Customize header labels:
      - Branch Name → "Company"
      - Address → "Location"
      - Phone → "Tel"
      - VAT Number → "Tax ID"
      - CR Number → "Reg #"
   3. Customize footer labels:
      - ZATCA QR → "Scan Here"
      - Order Type → "Service Type"
      - Payment Method → "Payment"
      - Notes → "Thank You!"
   4. Save and activate template
   ```

2. **Create Test Invoice:**
   ```
   1. Create sale with this template active
   2. View invoice
   ```

**Visual Inspection Checklist:**

- [ ] **Header Custom Labels:**
  - [ ] "Company" instead of "Branch Name" ✅
  - [ ] "Location" instead of "Address" ✅
  - [ ] "Tel" instead of "Phone" ✅
  - [ ] "Tax ID" instead of "VAT Number" ✅
  - [ ] "Reg #" instead of "CR Number" ✅

- [ ] **Footer Custom Labels:**
  - [ ] "Scan Here" for QR code ✅
  - [ ] "Service Type" for order type ✅
  - [ ] "Payment" for payment method ✅
  - [ ] "Thank You!" for notes ✅

- [ ] **Quality:**
  - [ ] Labels not truncated
  - [ ] Labels properly aligned with values
  - [ ] Professional appearance
  - [ ] Clear association between label and value

**Screenshots to Capture:**
1. Full invoice with custom labels
2. Header section close-up
3. Footer section close-up

**Expected Result:** ✅ All custom labels visible and properly formatted

**Pass Criteria:**
- All custom labels applied
- No default labels showing
- Professional appearance
- Clear label-value association

---

#### VT-06: Builder UI - All Controls 🔧 MEDIUM PRIORITY

**Objective:** Verify all builder interface controls render and function

**Steps:**

1. **Navigate to Builder:**
   ```
   1. Go to Settings → Invoice Builder
   2. Click "Create New Template"
   ```

2. **Test General Controls:**
   ```
   - [ ] Template name input field
   - [ ] Description textarea
   - [ ] Paper size dropdown (58mm, 80mm, A4, Custom)
   - [ ] RTL layout toggle checkbox
   - [ ] Save button
   - [ ] Preview button
   - [ ] Cancel button
   ```

3. **Test Header Section:**
   ```
   - [ ] Show Logo checkbox
   - [ ] Show Branch Name checkbox
   - [ ] Branch Name label input (conditional)
   - [ ] Show Address checkbox
   - [ ] Address label input (conditional)
   - [ ] Show Phone checkbox
   - [ ] Phone label input (conditional)
   - [ ] Show VAT Number checkbox
   - [ ] VAT Number label input (conditional)
   - [ ] Show CRN checkbox
   - [ ] CRN label input (conditional)
   ```

4. **Test Customer Section:**
   ```
   - [ ] Show Customer Info checkbox
   - [ ] Customer fields list (expandable/collapsible)
   - [ ] Each field has:
      - [ ] Visible checkbox
      - [ ] Label input
      - [ ] Delete button (for custom fields)
   - [ ] All 10 fields present (name, vatNumber, phone, + 7 address fields)
   ```

5. **Test Items Section:**
   ```
   - [ ] Show Items Table checkbox
   - [ ] Column configuration list
   - [ ] Each column has:
      - [ ] Visible checkbox
      - [ ] Label input
      - [ ] Width input
      - [ ] Reorder buttons (up/down)
   - [ ] All 9 columns present
   ```

6. **Test Summary Section:**
   ```
   - [ ] Show Summary checkbox
   - [ ] Summary fields list
   - [ ] Each field has:
      - [ ] Visible checkbox
      - [ ] Label input
      - [ ] Highlight checkbox
   - [ ] All 6 fields present (subtotal, discount, vat, total, paid, change)
   ```

7. **Test Footer Section:**
   ```
   - [ ] Show Barcode checkbox
   - [ ] Barcode format dropdown
   - [ ] Barcode width input
   - [ ] Barcode height input
   - [ ] Show barcode value checkbox
   - [ ] Barcode label input
   - [ ] Show ZATCA QR checkbox
   - [ ] ZATCA QR label input
   - [ ] Show Order Type checkbox
   - [ ] Order Type label input
   - [ ] Show Payment Method checkbox
   - [ ] Payment Method label input
   - [ ] Show Notes checkbox
   - [ ] Notes label input
   - [ ] Notes text content textarea
   ```

**Visual Inspection Checklist:**

- [ ] **Layout:**
  - [ ] All sections visible
  - [ ] Clear visual hierarchy
  - [ ] Proper spacing between sections
  - [ ] No UI overlaps
  - [ ] Responsive layout (resize browser)

- [ ] **Styling:**
  - [ ] Consistent input styles
  - [ ] Buttons styled properly
  - [ ] Checkboxes aligned
  - [ ] Labels legible
  - [ ] Dark mode support (if applicable)

- [ ] **Functionality:**
  - [ ] Checkboxes toggle correctly
  - [ ] Conditional inputs show/hide
  - [ ] Inputs accept text
  - [ ] Dropdowns work
  - [ ] Save button enabled/disabled correctly
  - [ ] Preview shows real-time changes

**Screenshots to Capture:**
1. Full builder page
2. Header section expanded
3. Customer section with all fields
4. Items section with column config
5. Footer section with all controls
6. Mobile view (responsive test)

**Expected Result:** ✅ All controls visible, functional, and properly styled

**Pass Criteria:**
- No missing controls
- All sections accessible
- Professional UI
- Responsive layout
- No glitches

---

### Phase 2: Browser Compatibility Tests (3 tests - ~60 minutes)

#### BC-01: Cross-Browser Rendering 🌐 MEDIUM PRIORITY

**Objective:** Verify invoice renders consistently across browsers

**Browsers to Test:**
1. Chrome (latest)
2. Firefox (latest)
3. Edge (latest)
4. Safari (latest - if Mac available)

**Steps (repeat for each browser):**

1. **Open Invoice:**
   ```
   1. Open browser
   2. Navigate to http://localhost:3000
   3. Login (admin/123)
   4. Navigate to existing sale
   5. View invoice
   ```

2. **Test LTR Mode:**
   ```
   1. View English-only invoice
   2. Check all visual elements
   3. Open browser DevTools (F12)
   4. Check Console for errors
   ```

3. **Test RTL Mode:**
   ```
   1. View Arabic invoice with RTL
   2. Check RTL layout works
   3. Check for console errors
   ```

**Checklist (per browser):**

- [ ] **Chrome:**
  - [ ] Invoice renders without errors
  - [ ] Fonts load correctly
  - [ ] Arabic text displays
  - [ ] RTL layout works
  - [ ] Barcodes render
  - [ ] QR codes render
  - [ ] Print preview works (Ctrl+P)
  - [ ] No console errors
  - [ ] Performance acceptable (<2s load)

- [ ] **Firefox:**
  - [ ] Same checklist as Chrome

- [ ] **Edge:**
  - [ ] Same checklist as Chrome

- [ ] **Safari (if available):**
  - [ ] Same checklist as Chrome
  - [ ] Special attention to dir="rtl" support

**Screenshots to Capture:**
1. Invoice in Chrome
2. Invoice in Firefox
3. Invoice in Edge
4. Invoice in Safari (if available)
5. Console screenshot (no errors)

**Expected Result:** ✅ Consistent rendering across all browsers with minor acceptable differences

**Pass Criteria:**
- All browsers render correctly
- No critical errors
- Acceptable performance
- Functional parity

**Known Acceptable Differences:**
- Font rendering smoothing
- Scrollbar styling
- Minor spacing differences

---

#### BC-02: Mobile Responsiveness 📱 MEDIUM PRIORITY

**Objective:** Verify usability on mobile devices

**Devices/Emulators to Test:**
1. Chrome DevTools Mobile Emulation
2. Firefox Responsive Design Mode
3. Physical mobile device (if available)

**Steps:**

1. **Using Chrome DevTools:**
   ```
   1. Open Chrome
   2. Press F12 (DevTools)
   3. Click device toolbar icon (Ctrl+Shift+M)
   4. Select device: iPhone 12 Pro
   5. Navigate to invoice builder
   ```

2. **Test Builder UI on Mobile:**
   ```
   - [ ] Page loads without horizontal scroll
   - [ ] All sections accessible
   - [ ] Inputs reachable
   - [ ] Touch targets adequate size (minimum 44x44px)
   - [ ] Buttons work with touch
   - [ ] Dropdowns work
   - [ ] Checkboxes tappable
   - [ ] Save button accessible
   ```

3. **Test Invoice Preview on Mobile:**
   ```
   - [ ] Invoice displays full width
   - [ ] Text size readable
   - [ ] No horizontal scroll
   - [ ] Pinch-to-zoom works
   - [ ] QR code scannable
   - [ ] Navigation works
   ```

4. **Test Different Orientations:**
   ```
   1. Portrait mode: Test usability
   2. Landscape mode: Test usability
   ```

**Checklist:**

- [ ] **iPhone 12 Pro (390x844):**
  - [ ] Builder accessible
  - [ ] Invoice readable
  - [ ] Touch targets adequate
  - [ ] No layout breaks

- [ ] **iPad Air (820x1180):**
  - [ ] Same checklist

- [ ] **Android Phone (360x640):**
  - [ ] Same checklist

**Screenshots to Capture:**
1. Builder on mobile (portrait)
2. Builder on mobile (landscape)
3. Invoice preview on mobile
4. Tablet view
5. Touch target demonstration

**Expected Result:** ✅ Usable on mobile devices with acceptable UX

**Pass Criteria:**
- Core functionality accessible
- No horizontal scroll (inappropriate)
- Text readable
- Touch interactions work
- Acceptable user experience

---

#### BC-03: RTL Support Verification ⭐ HIGH PRIORITY

**Objective:** Verify dir="rtl" works correctly across browsers

**Test Matrix:**

| Browser | Auto-Detect | Manual Toggle | Print Preview |
|---------|-------------|---------------|---------------|
| Chrome  | [ ]         | [ ]           | [ ]           |
| Firefox | [ ]         | [ ]           | [ ]           |
| Edge    | [ ]         | [ ]           | [ ]           |
| Safari  | [ ]         | [ ]           | [ ]           |

**Steps:**

1. **Auto-Detection Test:**
   ```
   For each browser:
   1. Create invoice with Arabic customer name
   2. Ensure template RTL: undefined (auto-detect)
   3. View invoice
   4. Inspect element → verify dir="rtl" on container
   5. Verify visual RTL layout
   ```

2. **Manual Toggle Test:**
   ```
   For each browser:
   1. Go to template builder
   2. Enable "RTL Layout" toggle
   3. Save template
   4. Create invoice with English-only content
   5. View invoice
   6. Verify RTL layout still applied
   7. Inspect element → verify dir="rtl"
   ```

3. **Print Preview Test:**
   ```
   For each browser:
   1. View RTL invoice
   2. Press Ctrl+P (print preview)
   3. Verify RTL layout preserved in print preview
   4. Check page orientation
   5. Check margins
   ```

**Checklist (per browser):**

- [ ] **Auto-detection:**
  - [ ] dir="rtl" applied automatically
  - [ ] Layout mirrors correctly
  - [ ] Arabic text flows RTL

- [ ] **Manual toggle:**
  - [ ] RTL applies even without Arabic
  - [ ] Toggle persists across page loads
  - [ ] Builder preview updates in real-time

- [ ] **Print preview:**
  - [ ] RTL preserved in print
  - [ ] Layout doesn't break
  - [ ] Professional print appearance

**Screenshots to Capture:**
1. Browser DevTools showing dir="rtl" attribute (each browser)
2. Print preview showing RTL (each browser)
3. Side-by-side comparison: LTR vs RTL

**Expected Result:** ✅ dir="rtl" works correctly in all browsers

**Pass Criteria:**
- Auto-detection reliable
- Manual toggle works
- Print preserves RTL
- No browser compatibility issues

---

### Phase 3: Print Tests (2 tests - ~30 minutes)

#### PT-01: All Paper Sizes 🖨️ MEDIUM PRIORITY

**Objective:** Verify invoice prints correctly on all supported paper sizes

**Paper Sizes to Test:**
1. 58mm thermal paper
2. 80mm thermal paper
3. A4 standard paper

**Steps (repeat for each size):**

1. **Prepare Template:**
   ```
   1. Create/edit template
   2. Set Paper Size: [58mm / 80mm / A4]
   3. Configure appropriate content for size
   4. Save template
   ```

2. **Generate Invoice:**
   ```
   1. Create test sale
   2. View invoice
   3. Open print preview (Ctrl+P)
   ```

3. **Verify Print Settings:**
   ```
   - [ ] Page orientation correct
   - [ ] Margins appropriate for paper size
   - [ ] Content fits on page
   - [ ] No content cut off
   - [ ] Page breaks logical (multi-page invoices)
   ```

4. **Print or Save PDF:**
   ```
   1. Select destination: Print to PDF
   2. Save PDF
   3. Open PDF in viewer
   4. Verify output quality
   ```

**Checklist:**

- [ ] **58mm Thermal:**
  - [ ] Width: 58mm (2.28 inches)
  - [ ] Content fits width
  - [ ] Font size readable
  - [ ] Barcode fits (if enabled)
  - [ ] QR code fits
  - [ ] Professional appearance
  - [ ] Print quality acceptable

- [ ] **80mm Thermal:**
  - [ ] Width: 80mm (3.15 inches)
  - [ ] Content fits width
  - [ ] More spacious layout than 58mm
  - [ ] All elements visible
  - [ ] Professional appearance
  - [ ] Print quality acceptable

- [ ] **A4 Standard:**
  - [ ] Size: 210mm x 297mm (8.27" x 11.69")
  - [ ] Content properly scaled
  - [ ] Margins appropriate
  - [ ] Professional appearance
  - [ ] Suitable for formal invoices
  - [ ] Print quality high

**PDF Files to Save:**
1. invoice-58mm.pdf
2. invoice-80mm.pdf
3. invoice-a4.pdf

**Expected Result:** ✅ All paper sizes print correctly with professional appearance

**Pass Criteria:**
- Content fits page
- Readable text
- No cut-off elements
- Professional quality

---

#### PT-02: RTL Print Verification ⭐ HIGH PRIORITY

**Objective:** Verify RTL invoices print correctly

**Steps:**

1. **Prepare RTL Invoice:**
   ```
   1. Use RTL template
   2. Create invoice with Arabic content
   3. View invoice in browser
   4. Verify RTL layout on screen
   ```

2. **Test Print Preview:**
   ```
   1. Press Ctrl+P
   2. Wait for print preview to load
   3. Verify RTL layout preserved
   ```

3. **Check Print Settings:**
   ```
   - [ ] Layout: Portrait
   - [ ] Margins: Default or Custom
   - [ ] Background graphics: On (for colors/borders)
   - [ ] Headers and footers: Off (clean invoice)
   ```

4. **Print to PDF:**
   ```
   1. Destination: Save as PDF
   2. Save as: invoice-rtl.pdf
   3. Open PDF
   4. Verify RTL layout in PDF
   ```

5. **Physical Print Test (if printer available):**
   ```
   1. Select actual printer
   2. Print one copy
   3. Inspect physical output
   ```

**Checklist:**

- [ ] **Screen to Print Consistency:**
  - [ ] RTL layout same in print preview
  - [ ] dir="rtl" effect preserved
  - [ ] No layout shift when printing
  - [ ] Colors preserved (if applicable)

- [ ] **RTL Elements:**
  - [ ] Text aligned right
  - [ ] Table columns in RTL order
  - [ ] Headers/footers mirrored
  - [ ] Spacing correct
  - [ ] Arabic text readable

- [ ] **QR/Barcode:**
  - [ ] QR code not mirrored (correct)
  - [ ] Barcode not mirrored (correct)
  - [ ] Both remain LTR (as expected)
  - [ ] Scannable in print

- [ ] **Print Quality:**
  - [ ] Sharp text
  - [ ] Clean lines
  - [ ] Professional appearance
  - [ ] Production-ready quality

**PDF Files to Save:**
1. invoice-rtl-80mm.pdf
2. invoice-rtl-a4.pdf

**Screenshots to Capture:**
1. Print preview showing RTL
2. Print dialog settings
3. PDF viewer showing RTL invoice

**Expected Result:** ✅ RTL layout preserved perfectly in print with professional quality

**Pass Criteria:**
- RTL maintained in print
- Professional appearance
- QR/Barcode not mirrored
- Production-ready quality

---

### Phase 4: User Acceptance Tests (5 tests - ~90 minutes)

#### UAT-01: English-Only Workflow 🎯 HIGH PRIORITY

**Objective:** Complete end-to-end workflow with English content

**Scenario:** Restaurant cashier creating receipt for English-speaking customer

**Steps:**

1. **Setup:**
   ```
   1. Login as cashier user
   2. Select branch
   3. Ensure English template active
   ```

2. **Create Customer:**
   ```
   - Name: John Smith
   - Phone: +1234567890
   - Email: john@example.com
   ```

3. **Create Sale:**
   ```
   1. Select customer: John Smith
   2. Add items:
      - Burger - Qty: 2 - Price: 25.00
      - Fries - Qty: 2 - Price: 10.00
      - Coke - Qty: 2 - Price: 5.00
   3. Order Type: Dine-In
   4. Payment Method: Card
   5. Amount Paid: 100.00
   6. Complete sale
   ```

4. **View Invoice:**
   ```
   1. Click "View Invoice"
   2. Review all details
   ```

5. **Print Invoice:**
   ```
   1. Click print button or Ctrl+P
   2. Print to PDF or physical printer
   ```

**Validation Checklist:**

- [ ] **Customer Creation:**
  - [ ] Saved successfully
  - [ ] Appears in customer list
  - [ ] Details correct

- [ ] **Sale Creation:**
  - [ ] All items added correctly
  - [ ] Quantities correct
  - [ ] Prices correct
  - [ ] Total calculated correctly
  - [ ] Order type saved
  - [ ] Payment method saved
  - [ ] Change calculated correctly

- [ ] **Invoice Display:**
  - [ ] Customer name visible
  - [ ] All items listed
  - [ ] Quantities correct
  - [ ] Prices formatted (2 decimal places)
  - [ ] Subtotal correct
  - [ ] VAT calculated correctly (15%)
  - [ ] Total correct
  - [ ] Payment details shown
  - [ ] Invoice number generated
  - [ ] Date/time correct
  - [ ] Cashier name shown

- [ ] **Print Output:**
  - [ ] Professional appearance
  - [ ] All information legible
  - [ ] QR code visible
  - [ ] Proper formatting

**Expected Result:** ✅ Complete workflow from customer creation to printed invoice

**Pass Criteria:**
- No errors encountered
- All data persisted correctly
- Invoice accurate
- Professional output

---

#### UAT-02: Arabic-Only Workflow 🎯 HIGH PRIORITY

**Objective:** Complete workflow with Arabic content and RTL layout

**Scenario:** Saudi retail store creating invoice for Arabic customer

**Steps:**

1. **Setup:**
   ```
   1. Login as cashier
   2. Ensure RTL template active
   ```

2. **Create Customer with Full Saudi Address:**
   ```
   - Code: SA-001
   - Name (Arabic): محمد بن عبدالله السعودي
   - Phone: +966501234567
   - Building Number: 7700
   - Street Name: طريق الملك فهد
   - District: العليا
   - City: الرياض
   - Postal Code: 12345
   - Additional Number: 6789
   - Unit Number: مكتب 301
   ```

3. **Create Sale with Arabic Products:**
   ```
   1. Select customer
   2. Add items (use/create Arabic product names):
      - لابتوب سامسونج - Qty: 1 - Price: 3000.00
      - ماوس لاسلكي - Qty: 2 - Price: 150.00
      - كيبورد ميكانيكي - Qty: 1 - Price: 400.00
   3. Order Type: Delivery
   4. Payment Method: Cash
   5. Amount Paid: 4000.00
   6. Complete sale
   ```

4. **View Invoice:**
   ```
   1. Click "View Invoice"
   2. Verify RTL layout
   3. Review Arabic text
   4. Check Saudi address
   ```

5. **Print Invoice:**
   ```
   1. Print to PDF
   2. Verify RTL in PDF
   ```

**Validation Checklist:**

- [ ] **Customer with Saudi Address:**
  - [ ] All 7 address fields saved
  - [ ] PostalCode validation (5 digits): 12345
  - [ ] AdditionalNumber validation (4 digits): 6789
  - [ ] Arabic text saved correctly
  - [ ] Retrievable from database

- [ ] **Sale with Arabic Products:**
  - [ ] Arabic product names display
  - [ ] Characters not reversed
  - [ ] Quantities correct
  - [ ] Calculations correct

- [ ] **RTL Invoice:**
  - [ ] Automatic RTL activation
  - [ ] dir="rtl" applied
  - [ ] Text flows right-to-left
  - [ ] Table columns reversed
  - [ ] Headers aligned right
  - [ ] Professional appearance

- [ ] **Saudi Address Display:**
  - [ ] All 7 fields visible
  - [ ] Building Number: 7700
  - [ ] Street Name: طريق الملك فهد
  - [ ] District: العليا
  - [ ] City: الرياض
  - [ ] Postal Code: 12345
  - [ ] Additional Number: 6789
  - [ ] Unit Number: مكتب 301
  - [ ] Proper formatting

- [ ] **Print Output:**
  - [ ] RTL preserved in PDF
  - [ ] Arabic text correct
  - [ ] Professional quality
  - [ ] Suitable for Saudi customers

**Expected Result:** ✅ Complete Arabic workflow with RTL invoice and Saudi address

**Pass Criteria:**
- Saudi address validation works
- RTL auto-detection works
- Arabic text displays correctly
- Professional output

---

#### UAT-03: Mixed Language Workflow 🎯 HIGH PRIORITY

**Objective:** Handle mixed English-Arabic content

**Scenario:** International business with bilingual invoices

**Steps:**

1. **Create Bilingual Customer:**
   ```
   - Code: MIX-001
   - Name (English): ABC Trading Company
   - Name (Arabic): شركة ABC التجارية
   - Phone: +966501234567
   - Building: 1234
   - Street: King Abdullah Road - طريق الملك عبدالله
   - City: Jeddah
   ```

2. **Create Sale with Mixed Products:**
   ```
   Items:
   - "HP Laptop - جهاز إتش بي" - Qty: 1
   - "Samsung Mouse ماوس" - Qty: 2
   - "Office Chair كرسي مكتب" - Qty: 3
   ```

3. **View Invoice:**
   ```
   1. Verify mixed content display
   2. Check bidirectional text
   ```

**Validation Checklist:**

- [ ] **Bilingual Customer:**
  - [ ] Both English and Arabic names stored
  - [ ] Mixed address displays correctly
  - [ ] No text corruption

- [ ] **Mixed Products:**
  - [ ] English readable
  - [ ] Arabic readable
  - [ ] No character reversal
  - [ ] Natural appearance

- [ ] **Invoice Layout:**
  - [ ] Proper bidirectional handling
  - [ ] Each piece of text in natural direction
  - [ ] No overlap issues
  - [ ] Professional appearance

**Expected Result:** ✅ Smooth handling of mixed language content

**Pass Criteria:**
- Both languages readable
- No text corruption
- Professional appearance

---

#### UAT-04: Barcode Scanning Workflow 📱 MEDIUM PRIORITY (Optional)

**Objective:** Verify barcode functionality end-to-end

**Prerequisites:**
- Barcode scanner (hardware or mobile app)
- Printer or PDF with printed barcode

**Steps:**

1. **Create Invoice with Barcode:**
   ```
   1. Enable barcode in template
   2. Format: CODE128
   3. Create sale
   4. View invoice
   ```

2. **Print Invoice:**
   ```
   1. Print to physical printer OR
   2. Display invoice on screen (for mobile scanner)
   ```

3. **Scan Barcode:**
   ```
   1. Use barcode scanner
   2. Scan invoice barcode
   3. Verify scanned value
   ```

**Validation Checklist:**

- [ ] **Barcode Generation:**
  - [ ] Barcode appears in invoice
  - [ ] Clear and sharp
  - [ ] Correct format (CODE128)

- [ ] **Barcode Value:**
  - [ ] Matches invoice number
  - [ ] Correct format
  - [ ] No extra characters

- [ ] **Scanning:**
  - [ ] Scanner reads barcode successfully
  - [ ] Scanned value matches invoice number
  - [ ] First-time scan success (no retries needed)

- [ ] **Print Quality:**
  - [ ] Barcode scannable from printed page
  - [ ] Acceptable scan rate (>95%)

**Expected Result:** ✅ Barcode scannable with correct invoice number value

**Pass Criteria:**
- Barcode generates correctly
- Scannable on first attempt
- Value matches invoice number

---

#### UAT-05: Complete Customization Workflow 🎨 MEDIUM PRIORITY

**Objective:** Full template customization end-to-end

**Scenario:** Business owner creating branded invoice template

**Steps:**

1. **Create Fully Custom Template:**
   ```
   1. Name: "Premium Branded Invoice"
   2. Paper Size: A4
   3. RTL: Enabled
   4. Customize ALL labels:
      - Header: Custom labels for all fields
      - Customer: Custom field labels
      - Items: Custom column names
      - Summary: Custom labels
      - Footer: Custom messages
   5. Configure barcode:
      - Format: EAN13
      - Custom size: Width: 3, Height: 60
      - Show value: Yes
      - Custom label: "Reference Number"
   6. Configure footer notes:
      - Custom message: "Thank you for choosing us! Visit www.example.com"
   7. Save template
   ```

2. **Test Template:**
   ```
   1. Activate template
   2. Create test sale
   3. View invoice
   ```

3. **Verify Customizations:**
   ```
   - Check all custom labels applied
   - Check barcode configuration
   - Check custom messages
   - Check overall appearance
   ```

4. **Share with Stakeholder:**
   ```
   1. Print to PDF
   2. Review with business owner
   3. Gather feedback
   ```

**Validation Checklist:**

- [ ] **Template Creation:**
  - [ ] All sections configurable
  - [ ] All fields customizable
  - [ ] Changes save correctly
  - [ ] Preview updates in real-time

- [ ] **Label Customization:**
  - [ ] All custom labels applied
  - [ ] No default labels remain
  - [ ] Labels fit properly
  - [ ] Professional appearance

- [ ] **Barcode Customization:**
  - [ ] Format changed successfully
  - [ ] Size adjustments work
  - [ ] Custom label displays
  - [ ] Barcode still scannable

- [ ] **Branding:**
  - [ ] Custom messages display
  - [ ] Professional branded appearance
  - [ ] Suitable for business use
  - [ ] Stakeholder approval

**Expected Result:** ✅ Fully customized, branded invoice template

**Pass Criteria:**
- All customizations applied
- Professional appearance
- Business owner satisfied
- Production-ready

---

### Phase 5: Performance Tests (2 tests - ~30 minutes)

#### PERF-01: Invoice Generation Performance ⚡ LOW PRIORITY

**Objective:** Verify invoice generation performance with large data sets

**Test Scenarios:**

1. **Small Invoice (1-5 items):**
   ```
   1. Create sale with 3 items
   2. Measure time from "View Invoice" click to full render
   3. Expected: <1 second
   ```

2. **Medium Invoice (10-20 items):**
   ```
   1. Create sale with 15 items
   2. Measure render time
   3. Expected: <2 seconds
   ```

3. **Large Invoice (50+ items):**
   ```
   1. Create sale with 50 items (if possible)
   2. Measure render time
   3. Expected: <5 seconds
   ```

**Measurement Methods:**

- **Chrome DevTools:**
  ```
  1. Open DevTools (F12)
  2. Go to Performance tab
  3. Click Record
  4. Click "View Invoice"
  5. Stop recording when fully rendered
  6. Analyze timeline
  ```

- **Manual Timing:**
  ```
  1. Use stopwatch
  2. Click "View Invoice"
  3. Stop when fully rendered (all elements visible)
  4. Record time
  ```

**Metrics to Capture:**

- [ ] **Load Time:** Time to first visual render
- [ ] **Full Render Time:** Time to complete render
- [ ] **Network Time:** API call duration
- [ ] **Render Time:** Browser rendering duration
- [ ] **Total Time:** End-to-end user experience

**Performance Checklist:**

- [ ] **Small Invoice:**
  - [ ] Load time: <500ms
  - [ ] Full render: <1s
  - [ ] Feels instant to user

- [ ] **Medium Invoice:**
  - [ ] Load time: <1s
  - [ ] Full render: <2s
  - [ ] Acceptable performance

- [ ] **Large Invoice:**
  - [ ] Load time: <2s
  - [ ] Full render: <5s
  - [ ] Acceptable for large invoices

- [ ] **User Experience:**
  - [ ] No freezing
  - [ ] No stuttering
  - [ ] Smooth animations (if any)
  - [ ] Loading indicator (if >1s)

**Screenshots to Capture:**
1. Chrome Performance timeline
2. Network tab showing API call
3. Large invoice fully rendered

**Expected Result:** ✅ Acceptable performance across all invoice sizes

**Pass Criteria:**
- Small invoices: <1s
- Medium invoices: <2s
- Large invoices: <5s
- No UI freezing

---

#### PERF-02: Frontend Rendering Performance ⚡ LOW PRIORITY

**Objective:** Verify frontend rendering performance

**Test Scenarios:**

1. **RTL Layout Performance:**
   ```
   1. Switch template from LTR to RTL
   2. Measure re-render time
   3. Expected: <100ms
   ```

2. **Barcode Generation Performance:**
   ```
   1. Enable barcode in template
   2. Measure barcode render time
   3. Expected: <200ms
   ```

3. **QR Code Generation Performance:**
   ```
   1. Generate invoice with ZATCA QR
   2. Measure QR code render time
   3. Expected: <300ms
   ```

4. **Print Preview Performance:**
   ```
   1. Open print preview (Ctrl+P)
   2. Measure time to render print view
   3. Expected: <2s
   ```

**Measurement with Chrome DevTools:**

```
1. Open DevTools → Performance
2. Enable "Screenshots"
3. Record interaction
4. Analyze:
   - Scripting time
   - Rendering time
   - Painting time
   - Total time
```

**Performance Checklist:**

- [ ] **React Rendering:**
  - [ ] Component mount time: <50ms
  - [ ] Re-render time: <50ms
  - [ ] No unnecessary re-renders
  - [ ] Virtual DOM efficient

- [ ] **Browser Rendering:**
  - [ ] Layout calculation: <20ms
  - [ ] Paint time: <30ms
  - [ ] Composite time: <10ms
  - [ ] 60fps maintained

- [ ] **Memory Usage:**
  - [ ] Initial load: <50MB
  - [ ] With invoice: <100MB
  - [ ] No memory leaks
  - [ ] GC pauses acceptable

- [ ] **CPU Usage:**
  - [ ] Peak during render: <80%
  - [ ] Idle after render: <5%
  - [ ] No sustained high usage

**Optimization Opportunities (if performance issues found):**
- [ ] Lazy loading for barcode/QR components
- [ ] Memoization for expensive calculations
- [ ] Virtual scrolling for large item lists
- [ ] Code splitting for invoice builder

**Expected Result:** ✅ Smooth, responsive frontend performance

**Pass Criteria:**
- React components render quickly
- No UI lag
- Memory usage reasonable
- CPU usage acceptable

---

## Test Results Summary Template

After completing all tests, fill out this summary:

### Test Execution Results

**Date Executed:** _________________
**Tester Name:** _________________
**Environment:** Development / Staging / Production
**Total Duration:** _________ hours

### Results Overview

| Category | Total | Passed | Failed | Skipped | Pass Rate |
|----------|-------|--------|--------|---------|-----------|
| Visual/UI Tests | 6 | ___ | ___ | ___ | ___% |
| Browser Compatibility | 3 | ___ | ___ | ___ | ___% |
| Print Tests | 2 | ___ | ___ | ___ | ___% |
| User Acceptance Tests | 5 | ___ | ___ | ___ | ___% |
| Performance Tests | 2 | ___ | ___ | ___ | ___% |
| **TOTAL** | **18** | ___ | ___ | ___ | ___% |

### Critical Issues Found

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Non-Critical Issues Found

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Browser-Specific Issues

**Chrome:** _________________________________________
**Firefox:** _________________________________________
**Edge:** _________________________________________
**Safari:** _________________________________________

### Performance Metrics

**Small Invoice Render Time:** _______ ms
**Large Invoice Render Time:** _______ ms
**Print Preview Load Time:** _______ ms
**Overall Performance Rating:** Excellent / Good / Acceptable / Poor

### User Experience Rating

- **Ease of Use:** ⭐⭐⭐⭐⭐ (1-5)
- **Visual Appeal:** ⭐⭐⭐⭐⭐ (1-5)
- **Performance:** ⭐⭐⭐⭐⭐ (1-5)
- **Overall Satisfaction:** ⭐⭐⭐⭐⭐ (1-5)

### Recommendations

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Production Readiness

- [ ] All critical tests passed
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Browser compatibility verified
- [ ] Print quality verified
- [ ] User acceptance achieved

**APPROVED FOR PRODUCTION:** YES / NO / CONDITIONAL

**Approver Name:** _________________
**Approver Signature:** _________________
**Date:** _________________

---

## Appendix A: Test Data Templates

### Customer Data Templates

**English Customer:**
```json
{
  "code": "ENG-001",
  "nameEn": "John Smith",
  "phone": "+1234567890",
  "email": "john@example.com"
}
```

**Arabic Customer with Full Address:**
```json
{
  "code": "AR-001",
  "nameAr": "محمد بن عبدالله السعودي",
  "phone": "+966501234567",
  "buildingNumber": "7700",
  "streetName": "طريق الملك فهد",
  "district": "العليا",
  "city": "الرياض",
  "postalCode": "12345",
  "additionalNumber": "6789",
  "unitNumber": "مكتب 301"
}
```

### Product Data Templates

**English Products:**
- Laptop Computer - 3000.00 SAR
- Wireless Mouse - 150.00 SAR
- Mechanical Keyboard - 400.00 SAR

**Arabic Products:**
- لابتوب سامسونج - 3000.00 SAR
- ماوس لاسلكي - 150.00 SAR
- كيبورد ميكانيكي - 400.00 SAR

### Sale Data Templates

**Restaurant Sale:**
- 2x Burger @ 25.00 = 50.00
- 2x Fries @ 10.00 = 20.00
- 2x Coke @ 5.00 = 10.00
- Subtotal: 80.00
- VAT (15%): 12.00
- Total: 92.00

---

## Appendix B: Troubleshooting Guide

### Common Issues and Solutions

**Issue:** Invoice not rendering
- **Solution:** Check browser console for errors, verify API response, check authentication

**Issue:** Arabic text appears reversed
- **Solution:** Verify dir="rtl" attribute, check Unicode encoding, test in different browser

**Issue:** Barcode not scanning
- **Solution:** Increase barcode size, ensure print quality, verify barcode format compatibility

**Issue:** Print layout broken
- **Solution:** Check print CSS, verify page size settings, test print preview

**Issue:** RTL layout not applying
- **Solution:** Verify template RTL setting, check Arabic content presence, inspect DOM

**Issue:** Performance slow
- **Solution:** Check network tab, profile with DevTools, verify data size, check memory usage

---

## Appendix C: Contact Information

**Development Team:** _____________________
**QA Team:** _____________________
**Product Owner:** _____________________
**Support:** _____________________

---

**Document Version:** 1.0
**Last Updated:** December 10, 2025
**Next Review:** After UAT completion
