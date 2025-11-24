# Phase 4 Inventory Management Validation Plan

**Date**: 2025-11-24
**Phase**: Phase 4 - User Story 2 (Inventory Management)
**Tasks Covered**: T138-T143

## Overview

This document provides a comprehensive validation plan for Phase 4 (User Story 2 - Inventory Management). The validation ensures that all inventory management features work correctly including categories, products, stock adjustments, purchases, low stock alerts, and inventory updates from sales.

## Prerequisites

Before running these validation tests:

1. Backend API must be running (`dotnet run` in Backend directory)
2. Frontend must be running (`npm run dev` in frontend directory)
3. Database must be properly migrated and seeded with test data
4. User must be authenticated with appropriate permissions (Manager or Admin role)

## Test Environment Setup

### Test Data Requirements

- At least 2 categories (one parent, one child)
- At least 5 products across different categories
- At least 1 supplier
- At least 1 test user with Manager permissions
- Test products with varying stock levels (including low stock items)

---

## T138: Test Category CRUD Operations

### Objective
Verify that category creation, reading, updating, and deletion work correctly.

### Test Cases

#### Test 1.1: Create New Category
**Steps:**
1. Navigate to Inventory > Categories page
2. Click "Add Category" button
3. Fill in the form:
   - Code: `TEST-CAT-001`
   - Name (English): `Test Electronics`
   - Name (Arabic): `إلكترونيات اختبار`
   - Description (English): `Test category for electronics`
   - Description (Arabic): `فئة اختبار للإلكترونيات`
   - Display Order: `10`
4. Click "Save"

**Expected Result:**
- Category is created successfully
- Success message is displayed
- Category appears in the category list
- Category details match the entered data

#### Test 1.2: Create Category with Parent
**Steps:**
1. Click "Add Category"
2. Fill in form and select an existing category as parent
3. Save

**Expected Result:**
- Category is created with parent relationship
- Hierarchy is displayed correctly in the list

#### Test 1.3: Read Category Details
**Steps:**
1. Click on a category in the list
2. View category details

**Expected Result:**
- All category information is displayed correctly
- Product count is accurate
- Parent category (if any) is shown

#### Test 1.4: Update Category
**Steps:**
1. Select a category
2. Click "Edit"
3. Update Name (English) to `Updated Electronics`
4. Change Display Order to `5`
5. Save

**Expected Result:**
- Category is updated successfully
- Changes are reflected immediately in the list
- Display order affects sorting

#### Test 1.5: Delete Empty Category
**Steps:**
1. Create a new category with no products
2. Click "Delete" on the category
3. Confirm deletion

**Expected Result:**
- Category is deleted successfully
- Category no longer appears in the list

#### Test 1.6: Attempt to Delete Category with Products
**Steps:**
1. Try to delete a category that has products
2. Confirm deletion attempt

**Expected Result:**
- Error message: "Cannot delete category that has products"
- Category is NOT deleted

#### Test 1.7: Attempt to Create Duplicate Category Code
**Steps:**
1. Try to create a category with an existing code
2. Submit form

**Expected Result:**
- Error message: "Category with code 'XXX' already exists"
- Category is NOT created

#### Test 1.8: Prevent Circular Reference in Category Hierarchy
**Steps:**
1. Create Parent Category A
2. Create Child Category B with parent = A
3. Try to edit Category A and set parent = B

**Expected Result:**
- Error message: "Circular reference detected"
- Update is NOT saved

**Status:** ✅ Ready for manual testing

---

## T139: Test Product CRUD Operations with Category Assignment

### Objective
Verify product management including creation, reading, updating, deletion, and category assignment.

### Test Cases

#### Test 2.1: Create New Product
**Steps:**
1. Navigate to Inventory > Products page
2. Click "Add Product"
3. Fill in the form:
   - SKU: `TEST-PROD-001`
   - Name (English): `Test Laptop`
   - Name (Arabic): `حاسوب محمول اختبار`
   - Category: Select existing category
   - Selling Price: `1200.00`
   - Cost Price: `950.00`
   - Stock Level: `25`
   - Min Stock Threshold: `10`
   - Barcode: `1234567890123`
   - Active: `Yes`
4. Click "Save"

**Expected Result:**
- Product is created successfully
- All fields are saved correctly
- Product appears in the product list
- Category assignment is correct

#### Test 2.2: Create Product with Supplier
**Steps:**
1. Create product and assign a supplier
2. Save

**Expected Result:**
- Product is created with supplier relationship
- Supplier name is displayed in product details

#### Test 2.3: Read Product Details
**Steps:**
1. Click on a product in the list
2. View all product details

**Expected Result:**
- All product information is displayed
- Category name is shown
- Supplier name (if assigned) is shown
- Stock level is accurate
- Low stock indicator appears if stock <= threshold

#### Test 2.4: Update Product
**Steps:**
1. Select a product
2. Click "Edit"
3. Update Selling Price to `1500.00`
4. Change Category to a different category
5. Update Min Stock Threshold to `15`
6. Save

**Expected Result:**
- Product is updated successfully
- New category assignment is reflected
- Price changes are saved
- Product appears in new category's product list

#### Test 2.5: Update Product - Change Category
**Steps:**
1. Edit a product
2. Change its category to a different one
3. Save

**Expected Result:**
- Product is moved to new category
- Product count in old category decreases
- Product count in new category increases

#### Test 2.6: Delete Unused Product
**Steps:**
1. Create a new product (not used in any sales)
2. Delete the product
3. Confirm deletion

**Expected Result:**
- Product is deleted successfully
- Product no longer appears in the list

#### Test 2.7: Attempt to Delete Product Used in Sales
**Steps:**
1. Find a product that has been sold
2. Try to delete it
3. Confirm deletion

**Expected Result:**
- Error message: "Cannot delete product that has been used in sales"
- Product is NOT deleted

#### Test 2.8: Attempt to Create Product with Duplicate SKU
**Steps:**
1. Try to create a product with an existing SKU
2. Submit form

**Expected Result:**
- Error message: "Product with SKU 'XXX' already exists"
- Product is NOT created

#### Test 2.9: Create Product with Invalid Category
**Steps:**
1. Try to create a product
2. Select a non-existent category (via API or manipulation)
3. Submit

**Expected Result:**
- Error message: "Category not found"
- Product is NOT created

#### Test 2.10: Search Products by Name
**Steps:**
1. Enter "Laptop" in search box
2. Press Search

**Expected Result:**
- Only products with "Laptop" in name (English or Arabic) are shown
- Search is case-insensitive

#### Test 2.11: Search Products by SKU
**Steps:**
1. Enter a product SKU in search box
2. Press Search

**Expected Result:**
- Product with matching SKU is shown

#### Test 2.12: Filter Products by Category
**Steps:**
1. Select a category from category filter
2. Apply filter

**Expected Result:**
- Only products in selected category are shown

#### Test 2.13: Filter Products by Active Status
**Steps:**
1. Filter by Active = true
2. Verify results
3. Filter by Active = false
4. Verify results

**Expected Result:**
- Only products matching the active status are shown

**Status:** ✅ Ready for manual testing

---

## T140: Test Stock Adjustment Workflow

### Objective
Verify manual stock adjustments work correctly and update inventory levels.

### Test Cases

#### Test 3.1: Add Stock (Restock)
**Steps:**
1. Navigate to a product with current stock = 10
2. Click "Adjust Stock"
3. Select Adjustment Type: "Add"
4. Enter Quantity: 20
5. Enter Reason: "Restock from supplier"
6. Save

**Expected Result:**
- Stock level increases to 30 (10 + 20)
- Adjustment is recorded
- No inventory discrepancy flag

#### Test 3.2: Remove Stock (Damaged Goods)
**Steps:**
1. Navigate to a product with current stock = 30
2. Click "Adjust Stock"
3. Select Adjustment Type: "Remove"
4. Enter Quantity: 5
5. Enter Reason: "Damaged goods"
6. Save

**Expected Result:**
- Stock level decreases to 25 (30 - 5)
- Adjustment is recorded

#### Test 3.3: Set Stock (Physical Count)
**Steps:**
1. Navigate to a product with current stock = 25
2. Click "Adjust Stock"
3. Select Adjustment Type: "Set"
4. Enter Quantity: 50
5. Enter Reason: "Physical inventory count"
6. Save

**Expected Result:**
- Stock level is set to exactly 50
- Previous stock level is overwritten

#### Test 3.4: Set Negative Stock (Discrepancy)
**Steps:**
1. Navigate to a product
2. Click "Adjust Stock"
3. Select Adjustment Type: "Set"
4. Enter Quantity: -10
5. Enter Reason: "Inventory discrepancy found"
6. Save

**Expected Result:**
- Stock level is set to -10
- `HasInventoryDiscrepancy` flag is set to TRUE
- Product is flagged in UI (red indicator)
- Manager receives alert about negative inventory

#### Test 3.5: Remove More Stock Than Available
**Steps:**
1. Navigate to a product with stock = 5
2. Click "Adjust Stock"
3. Select Adjustment Type: "Remove"
4. Enter Quantity: 10
5. Save

**Expected Result:**
- Stock level becomes -5
- Inventory discrepancy flag is set
- Warning is displayed

#### Test 3.6: Verify Adjustment History
**Steps:**
1. Perform multiple stock adjustments
2. View adjustment history for the product

**Expected Result:**
- All adjustments are logged
- Each adjustment shows: type, quantity, reason, user, timestamp

**Status:** ✅ Ready for manual testing

---

## T141: Test Purchase Order Workflow

### Objective
Verify purchase order creation and receiving process, including automatic inventory updates.

### Test Cases

#### Test 4.1: Create Purchase Order
**Steps:**
1. Navigate to Purchases page
2. Click "New Purchase"
3. Fill in form:
   - PO Number: `PO-2024-001`
   - Supplier: Select existing supplier
   - Purchase Date: Today
   - Line Items:
     - Product 1: Quantity = 50, Unit Cost = 75.00
     - Product 2: Quantity = 30, Unit Cost = 25.00
   - Notes: "Test purchase order"
4. Save

**Expected Result:**
- Purchase order is created
- Status = "Pending"
- Total Cost = (50 * 75) + (30 * 25) = 4500.00
- Payment Status = "Pending"
- Amount Paid = 0
- Inventory is NOT yet updated

#### Test 4.2: View Purchase Order Details
**Steps:**
1. Click on the created purchase order
2. View details

**Expected Result:**
- All purchase information is displayed
- Line items show product names, quantities, costs
- Total cost is calculated correctly
- Supplier information is shown

#### Test 4.3: Receive Purchase Order
**Steps:**
1. Note current stock levels of products in PO
   - Product 1 current stock: 20
   - Product 2 current stock: 15
2. Open the purchase order
3. Click "Mark as Received"
4. Confirm

**Expected Result:**
- Purchase status changes to "Received"
- Received Date is set to current timestamp
- Inventory is updated automatically:
   - Product 1 stock: 20 + 50 = 70
   - Product 2 stock: 15 + 30 = 45
- If any product was at negative stock, discrepancy flag is cleared (if stock now >= 0)

#### Test 4.4: Attempt to Receive Purchase Twice
**Steps:**
1. Try to mark an already-received purchase as received again
2. Attempt the operation

**Expected Result:**
- Error message: "Purchase has already been received"
- No duplicate inventory update

#### Test 4.5: Create Purchase with Duplicate PO Number
**Steps:**
1. Try to create a purchase with an existing PO number
2. Submit

**Expected Result:**
- Error message: "Purchase order 'XXX' already exists"
- Purchase is NOT created

#### Test 4.6: Create Purchase with Invalid Supplier
**Steps:**
1. Try to create a purchase with non-existent supplier
2. Submit

**Expected Result:**
- Error message: "Supplier not found"
- Purchase is NOT created

#### Test 4.7: Create Purchase with Invalid Product
**Steps:**
1. Try to create a purchase with non-existent product in line items
2. Submit

**Expected Result:**
- Error message: "Products not found: [product IDs]"
- Purchase is NOT created

#### Test 4.8: Filter Purchases by Supplier
**Steps:**
1. Filter purchases by a specific supplier
2. View results

**Expected Result:**
- Only purchases from selected supplier are shown

#### Test 4.9: Filter Purchases by Date Range
**Steps:**
1. Set date range: Start Date = 2024-01-01, End Date = 2024-12-31
2. Apply filter

**Expected Result:**
- Only purchases within date range are shown

#### Test 4.10: Filter Purchases by Payment Status
**Steps:**
1. Filter by Payment Status = "Pending"
2. View results
3. Filter by Payment Status = "Paid"
4. View results

**Expected Result:**
- Only purchases with matching payment status are shown

**Status:** ✅ Ready for manual testing

---

## T142: Verify Low Stock Alerts

### Objective
Verify that products with stock levels at or below the minimum threshold are properly flagged and alerts are displayed.

### Test Cases

#### Test 5.1: Product at Minimum Threshold Appears in Low Stock List
**Steps:**
1. Find or create a product with:
   - Stock Level = 10
   - Min Stock Threshold = 10
2. Navigate to Low Stock Products page

**Expected Result:**
- Product appears in low stock list
- Low stock badge/indicator is visible

#### Test 5.2: Product Below Threshold Appears in Low Stock List
**Steps:**
1. Create a product with:
   - Stock Level = 5
   - Min Stock Threshold = 10
2. Navigate to Low Stock Products page

**Expected Result:**
- Product appears in low stock list
- Displayed at top (sorted by stock level ascending)

#### Test 5.3: Product Above Threshold Does NOT Appear in Low Stock List
**Steps:**
1. Ensure a product has:
   - Stock Level = 15
   - Min Stock Threshold = 10
2. Navigate to Low Stock Products page

**Expected Result:**
- Product does NOT appear in low stock list

#### Test 5.4: Low Stock Count in Dashboard Widget
**Steps:**
1. Navigate to Branch Dashboard home page
2. View inventory widget

**Expected Result:**
- Widget shows correct count of low stock products
- Clicking widget navigates to low stock products page

#### Test 5.5: Low Stock Badge on Product List
**Steps:**
1. Navigate to Products page
2. View products with low stock

**Expected Result:**
- Low stock products have visible badge/indicator
- Badge color indicates severity (e.g., yellow for at threshold, red for below)

#### Test 5.6: Low Stock Alert After Sale
**Steps:**
1. Create a product with Stock = 11, Threshold = 10
2. Process a sale of 2 units
3. Check low stock list

**Expected Result:**
- Product now appears in low stock list (Stock = 9, below threshold)

#### Test 5.7: Low Stock Alert Cleared After Restock
**Steps:**
1. Find a low stock product (Stock = 5, Threshold = 10)
2. Add stock of 20 units (new stock = 25)
3. Check low stock list

**Expected Result:**
- Product no longer appears in low stock list
- Low stock badge is removed

#### Test 5.8: Filter Low Stock Products
**Steps:**
1. Navigate to Products page
2. Enable "Low Stock Only" filter

**Expected Result:**
- Only products with Stock <= Threshold are shown
- All shown products have low stock indicator

#### Test 5.9: Low Stock Products Sorted by Stock Level
**Steps:**
1. Navigate to Low Stock Products page
2. View order of products

**Expected Result:**
- Products are sorted by stock level ascending
- Products with lowest/negative stock appear first

#### Test 5.10: Inactive Products Excluded from Low Stock
**Steps:**
1. Create a product with:
   - Stock = 2
   - Threshold = 10
   - IsActive = false
2. Check low stock list

**Expected Result:**
- Inactive product does NOT appear in low stock list
- Only active products are considered for alerts

**Status:** ✅ Ready for manual testing

---

## T143: Verify Sales Automatically Decrease Stock

### Objective
Verify that processing a sale correctly decrements product inventory levels.

### Test Cases

#### Test 6.1: Single Product Sale Decreases Stock
**Steps:**
1. Note current stock level of Product A: Stock = 50
2. Process a sale with:
   - Product A, Quantity = 3
   - Payment Method: Cash
3. Complete the sale

**Expected Result:**
- Sale is created successfully
- Product A stock is updated to 47 (50 - 3)
- Stock update happens immediately/atomically with sale

#### Test 6.2: Multiple Products Sale Decreases All Stocks
**Steps:**
1. Note current stock levels:
   - Product A: 40
   - Product B: 25
   - Product C: 60
2. Process a sale with:
   - Product A, Quantity = 5
   - Product B, Quantity = 2
   - Product C, Quantity = 10
3. Complete the sale

**Expected Result:**
- All three products' stocks are updated:
   - Product A: 35 (40 - 5)
   - Product B: 23 (25 - 2)
   - Product C: 50 (60 - 10)

#### Test 6.3: Sale with Large Quantity Decreases Stock Correctly
**Steps:**
1. Product D has Stock = 100
2. Process sale of Product D, Quantity = 75
3. Complete

**Expected Result:**
- Product D stock = 25 (100 - 75)

#### Test 6.4: Sale Causing Negative Stock Sets Discrepancy Flag
**Steps:**
1. Product E has Stock = 5
2. Process sale of Product E, Quantity = 10
3. Complete

**Expected Result:**
- Sale completes (last-commit-wins strategy)
- Product E stock = -5
- `HasInventoryDiscrepancy` flag is set to TRUE
- Manager receives alert about negative inventory
- Product appears in inventory discrepancy report

#### Test 6.5: Voided Sale Restores Stock
**Steps:**
1. Product F has Stock = 30
2. Process sale of Product F, Quantity = 8 (new stock = 22)
3. Void the sale (Manager action)

**Expected Result:**
- Stock is restored to 30 (22 + 8)
- If product was flagged with discrepancy, flag is recalculated

#### Test 6.6: Concurrent Sales (Last-Commit-Wins)
**Steps:**
1. Product G has Stock = 1 (only 1 unit left)
2. Simulate two cashiers selling the same product simultaneously:
   - Cashier 1: Sale of 1 unit
   - Cashier 2: Sale of 1 unit (before Cashier 1's transaction completes)
3. Both transactions complete

**Expected Result:**
- Both sales are recorded (no transaction rollback)
- Product G stock = -1
- Inventory discrepancy flag is set
- Manager receives alert about negative inventory
- This is expected behavior (last-commit-wins conflict resolution)

#### Test 6.7: Sale with Quantity = 0 Does Not Decrease Stock
**Steps:**
1. Attempt to create a sale line item with Quantity = 0

**Expected Result:**
- Validation error: Quantity must be greater than 0
- Sale line item is NOT created

#### Test 6.8: Multiple Line Items of Same Product
**Steps:**
1. Product H has Stock = 50
2. Process sale with:
   - Line 1: Product H, Quantity = 5
   - Line 2: Product H, Quantity = 3
3. Complete

**Expected Result:**
- Product H stock = 42 (50 - 5 - 3)
- Both line items are recorded correctly

#### Test 6.9: Stock Update is Atomic with Sale
**Steps:**
1. Monitor database during sale creation
2. Process a sale
3. Verify transaction

**Expected Result:**
- Sale record and inventory updates happen in same transaction
- If sale creation fails, inventory is NOT updated
- No partial updates occur

#### Test 6.10: Stock Update Affects Low Stock Alerts
**Steps:**
1. Product I has Stock = 11, Threshold = 10
2. Product is NOT in low stock list
3. Process sale of 2 units (new stock = 9)
4. Check low stock list

**Expected Result:**
- Product I now appears in low stock list
- Low stock badge is displayed

#### Test 6.11: Offline Sale Syncs and Updates Stock
**Steps:**
1. Product J has Stock = 40
2. Go offline
3. Create offline sale of Product J, Quantity = 5
4. Go online
5. Sync completes

**Expected Result:**
- Sale is synced to server
- Product J stock is updated to 35
- Sync status shows "Completed"

#### Test 6.12: Check Sales History Reflects Stock Changes
**Steps:**
1. View product's sales history
2. Verify quantities

**Expected Result:**
- All sales of the product are listed
- Quantities match the stock decrements

**Status:** ✅ Ready for manual testing

---

## Test Execution Summary

### Overall Status

| Task | Description | Test Cases | Status |
|------|-------------|------------|--------|
| T138 | Category CRUD Operations | 8 | ✅ Ready |
| T139 | Product CRUD Operations | 13 | ✅ Ready |
| T140 | Stock Adjustment Workflow | 6 | ✅ Ready |
| T141 | Purchase Order Workflow | 10 | ✅ Ready |
| T142 | Low Stock Alerts | 10 | ✅ Ready |
| T143 | Sales Decrease Stock | 12 | ✅ Ready |
| **Total** | | **59** | |

### Test Execution Instructions

1. **Environment Setup:**
   ```bash
   # Terminal 1: Start Backend
   cd Backend
   dotnet run

   # Terminal 2: Start Frontend
   cd frontend
   npm run dev
   ```

2. **Run Tests in Order:**
   - Execute T138 (Categories) first, as products depend on categories
   - Execute T139 (Products) second
   - Execute T140 (Stock Adjustments)
   - Execute T141 (Purchases)
   - Execute T142 (Low Stock Alerts) - can run in parallel with others
   - Execute T143 (Sales Integration) last, as it integrates with User Story 1

3. **Recording Results:**
   - Document any failures with screenshots
   - Note any deviations from expected behavior
   - File bug reports for any issues found

### Success Criteria

Phase 4 validation is considered successful when:

1. ✅ All 59 test cases pass
2. ✅ No critical bugs are found
3. ✅ Category hierarchy works correctly
4. ✅ Product CRUD operations work with proper validation
5. ✅ Stock adjustments update inventory correctly
6. ✅ Purchase receiving updates inventory automatically
7. ✅ Low stock alerts appear and clear appropriately
8. ✅ Sales integration properly decrements inventory
9. ✅ Negative stock scenarios are handled with discrepancy flags
10. ✅ Concurrent operations follow last-commit-wins strategy

### Next Steps

After successful validation:

1. Mark tasks T138-T143 as completed in `tasks.md`
2. Create implementation documentation in `docs/` directory
3. Proceed to Phase 5 (User Story 3 - Customer Relationship Management)

---

## Notes

- All tests assume authentication is working (from Phase 2/3)
- Manager or Admin role required for most operations
- Tests should be run in a clean test environment
- Database should be backed up before running destructive tests
- Automated tests (T106, T107) should be run first with `dotnet test`

## Related Documentation

- [tasks.md](../specs/001-multi-branch-pos/tasks.md) - Complete task list
- [plan.md](../specs/001-multi-branch-pos/plan.md) - Technical architecture
- [data-model.md](../specs/001-multi-branch-pos/data-model.md) - Database schema
- [contracts/products.md](../specs/001-multi-branch-pos/contracts/products.md) - Product API specification

