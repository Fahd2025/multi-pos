# Return Invoice - Test Cases

**Feature:** Return Invoice System
**Version:** 1.0
**Created:** 2025-12-29

---

## Backend Test Cases

### Return Processing Tests

#### TC-B001: Full Return - All Items
**Priority:** High
**Status:** ⏳ Pending

**Preconditions:**
- Sale exists with status "completed"
- Sale has 3 items with quantities [5, 3, 2]

**Steps:**
1. Call POST /api/v1/sales/return
2. Include all items with full quantities
3. Provide return reason

**Expected Result:**
- Return sale created with negative amounts
- Original sale status = "returned"
- All items status = "returned"
- Inventory increased by returned quantities

---

#### TC-B002: Partial Return - Some Items
**Priority:** High
**Status:** ⏳ Pending

**Preconditions:**
- Sale exists with 3 items

**Steps:**
1. Return 2 out of 3 items

**Expected Result:**
- Return sale created
- Original sale status = "completed" (not "returned")
- Returned items status = "returned"
- Non-returned items status = "ordered"

---

#### TC-B003: Partial Quantity Return
**Priority:** High
**Status:** ⏳ Pending

**Preconditions:**
- Sale item has quantity = 5

**Steps:**
1. Return quantity = 2

**Expected Result:**
- Return sale created with qty = -2
- Original item returnQuantity = 2
- Original item status = "partially_returned"
- Inventory increased by 2

---

#### TC-B004: Cannot Exceed Available Quantity
**Priority:** High
**Status:** ⏳ Pending

**Steps:**
1. Attempt to return more than available quantity

**Expected Result:**
- HTTP 400 Bad Request
- Error message about exceeded quantity

---

#### TC-B005: Cannot Return Voided Sale
**Priority:** High
**Status:** ⏳ Pending

**Preconditions:**
- Sale with status = "voided"

**Steps:**
1. Attempt to process return

**Expected Result:**
- HTTP 400 Bad Request
- Error message about voided sale

---

#### TC-B006: Proportional Discount Calculation
**Priority:** Medium
**Status:** ⏳ Pending

**Preconditions:**
- Original sale has 10% discount on $100 subtotal
- Return $50 worth of items

**Expected Result:**
- Return discount = $5 (10% of $50)

---

#### TC-B007: Proportional Tax Calculation
**Priority:** Medium
**Status:** ⏳ Pending

**Preconditions:**
- Original sale has 15% tax on $100 subtotal
- Return $50 worth of items

**Expected Result:**
- Return tax = $7.50 (15% of $50)

---

#### TC-B008: Transaction Rollback on Error
**Priority:** High
**Status:** ⏳ Pending

**Steps:**
1. Trigger database error mid-transaction
2. Verify rollback

**Expected Result:**
- No return sale created
- Original sale unchanged
- Inventory unchanged

---

#### TC-B009: Multiple Returns on Same Sale
**Priority:** High
**Status:** ⏳ Pending

**Preconditions:**
- Sale with item quantity = 10

**Steps:**
1. Return quantity = 3 (first return)
2. Return quantity = 2 (second return)
3. Verify available quantity = 5

**Expected Result:**
- Two return sales created
- Original item returnQuantity = 5
- Original item status = "partially_returned"

---

#### TC-B010: Reference ID Linking
**Priority:** High
**Status:** ⏳ Pending

**Steps:**
1. Create return
2. Verify OriginalSalesId is set correctly
3. Query returns by original sale ID

**Expected Result:**
- Return has correct OriginalSalesId
- GET /api/v1/sales/{id}/returns returns the return

---

## Frontend Test Cases

### Return Dialog Tests

#### TC-F001: Open Return Dialog
**Priority:** High
**Status:** ⏳ Pending

**Steps:**
1. Click return button on sale
2. Verify dialog opens with sale data

**Expected Result:**
- Dialog displays sale details
- All items listed with available quantities

---

#### TC-F002: Item Selection
**Priority:** High
**Status:** ⏳ Pending

**Steps:**
1. Click checkbox on item
2. Verify item is selected

**Expected Result:**
- Checkbox checked
- Quantity stepper appears
- Default quantity = max available

---

#### TC-F003: Quantity Adjustment - Increment
**Priority:** Medium
**Status:** ⏳ Pending

**Steps:**
1. Select item
2. Click increment button

**Expected Result:**
- Quantity increases by 1
- Cannot exceed max available

---

#### TC-F004: Quantity Adjustment - Decrement
**Priority:** Medium
**Status:** ⏳ Pending

**Steps:**
1. Select item with quantity > 1
2. Click decrement button

**Expected Result:**
- Quantity decreases by 1
- Cannot go below 0

---

#### TC-F005: Direct Quantity Input
**Priority:** Medium
**Status:** ⏳ Pending

**Steps:**
1. Type quantity in input field

**Expected Result:**
- Accepts valid numbers
- Rejects invalid input
- Limits to max available

---

#### TC-F006: Return Reason Required
**Priority:** High
**Status:** ⏳ Pending

**Steps:**
1. Select items
2. Click submit without reason

**Expected Result:**
- Error toast displayed
- Form not submitted

---

#### TC-F007: Summary Calculation
**Priority:** High
**Status:** ⏳ Pending

**Steps:**
1. Select items
2. Verify summary calculations

**Expected Result:**
- Correct subtotal
- Correct tax
- Correct discount
- Correct total refund

---

## Touch-Screen Tests

#### TC-T001: Touch Target Size
**Priority:** High
**Status:** ⏳ Pending

**Device:** iPad Pro

**Steps:**
1. Measure all buttons
2. Verify minimum 44x44px

**Expected Result:**
- All targets meet minimum size

---

#### TC-T002: No Accidental Taps
**Priority:** High
**Status:** ⏳ Pending

**Device:** iPhone 14

**Steps:**
1. Rapidly tap buttons
2. Verify single activation

**Expected Result:**
- No double-triggers
- Visual feedback on tap

---

#### TC-T003: Scroll Performance
**Priority:** Medium
**Status:** ⏳ Pending

**Device:** Android Tablet

**Steps:**
1. Open dialog with 50+ items
2. Scroll through list

**Expected Result:**
- Smooth 60fps scrolling
- No lag or jank

---

## Responsive Design Tests

#### TC-R001: Mobile Portrait (375px)
**Priority:** High
**Status:** ⏳ Pending

**Steps:**
1. Open dialog on iPhone SE
2. Verify layout

**Expected Result:**
- Full-screen dialog
- Stacked layout
- All content visible

---

#### TC-R002: Tablet Portrait (768px)
**Priority:** High
**Status:** ⏳ Pending

**Steps:**
1. Open dialog on iPad
2. Verify layout

**Expected Result:**
- Bottom sheet or modal
- 2-column grid where appropriate

---

#### TC-R003: Desktop (1920px)
**Priority:** Medium
**Status:** ⏳ Pending

**Steps:**
1. Open dialog on desktop
2. Verify layout

**Expected Result:**
- Centered modal
- Sidebar for summary
- Efficient use of space

---

## Printing Tests

#### TC-P001: Return Invoice Print
**Priority:** High
**Status:** ⏳ Pending

**Steps:**
1. Process return
2. Print return invoice

**Expected Result:**
- Shows return header
- Shows returned items
- Shows original invoice reference
- Shows refund amount

---

#### TC-P002: Combined Invoice Print
**Priority:** Medium
**Status:** ⏳ Pending

**Steps:**
1. Print combined invoice

**Expected Result:**
- Shows original items
- Shows returned items (highlighted)
- Shows final balance

---

#### TC-P003: 80mm Thermal Printer
**Priority:** High
**Status:** ⏳ Pending

**Device:** Thermal receipt printer

**Steps:**
1. Print return invoice

**Expected Result:**
- Fits 80mm width
- Readable text
- Proper formatting

---

## Accessibility Tests

#### TC-A001: Keyboard Navigation
**Priority:** High
**Status:** ⏳ Pending

**Steps:**
1. Navigate dialog with Tab key
2. Activate with Enter/Space

**Expected Result:**
- Logical tab order
- All controls accessible
- Visible focus indicators

---

#### TC-A002: Screen Reader
**Priority:** Medium
**Status:** ⏳ Pending

**Device:** NVDA / VoiceOver

**Steps:**
1. Navigate with screen reader

**Expected Result:**
- All labels read correctly
- Form validation announced
- Status changes announced

---

## Test Summary

**Total Test Cases:** 32
**Completed:** 0
**Passed:** 0
**Failed:** 0
**Blocked:** 0

---

**Last Updated:** 2025-12-29
