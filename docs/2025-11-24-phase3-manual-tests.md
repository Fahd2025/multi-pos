# Phase 3 Manual Testing Guide
## User Story 1 - Sales Operations Integration Tests

**Date**: 2025-11-24
**Test Range**: T102-T105 (Integration & Validation)
**Status**: Testing Phase

---

## Test Prerequisites

### 1. Ensure Backend is Running
```bash
cd Backend
dotnet watch
```
**Expected**: API running on https://localhost:5001

### 2. Ensure Frontend is Running
```bash
cd frontend
npm run dev
```
**Expected**: Frontend running on http://localhost:3000

### 3. Login Credentials
- **Branch**: B001, B002, or B003 (from seeded data)
- **Username**: admin
- **Password**: 123

---

## T102: Test Offline Mode

### Objective
Verify that sales can be created offline and automatically sync when connectivity is restored.

### Test Steps

#### Part A: Create Sale While Online
1. Open browser at http://localhost:3000
2. Login with credentials (branch: B001, username: admin, password: 123)
3. Navigate to Sales page (http://localhost:3000/en/branch/sales)
4. Verify sync status indicator shows "Online" (green)
5. Create a test sale:
   - Search and add product (if products exist)
   - Add quantity
   - Select payment method: Cash
   - Select invoice type: Touch Sales Invoice
   - Click "Complete Sale"
6. Verify sale is immediately saved
7. Note the invoice number

#### Part B: Simulate Offline Mode
1. Open browser DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox (to simulate no connectivity)
4. Verify sync status indicator changes to "Offline" (red/yellow)

#### Part C: Create Sale While Offline
1. While still on Sales page with offline mode enabled
2. Create another test sale:
   - Add products/items
   - Select payment method: Cash
   - Select invoice type: Touch Sales Invoice
   - Click "Complete Sale"
3. **Expected**:
   - Sale is queued to IndexedDB
   - UI shows "Sale queued for sync"
   - Pending count indicator shows "1 pending sync"
4. Open DevTools → Application → IndexedDB → OfflineQueue
5. Verify transaction is stored with status: "pending"

#### Part D: Restore Connectivity and Verify Sync
1. In DevTools Network tab, uncheck "Offline" checkbox
2. **Expected**:
   - Sync status changes to "Syncing" (yellow)
   - Background sync automatically triggers
   - After few seconds, sync status changes to "Online" (green)
   - Pending count becomes "0"
3. Verify transaction in IndexedDB changes status to "completed"
4. Refresh the sales list page
5. Verify offline sale now appears in the sales list with correct data

### Test Result Criteria
- ✅ PASS: Sale created offline is stored in IndexedDB, syncs automatically when online, and appears in sales list
- ❌ FAIL: If sync doesn't trigger, transaction remains pending, or data is lost

---

## T103: Test Concurrent Sales Conflict

### Objective
Verify last-commit-wins conflict resolution when two cashiers sell the last unit of a product.

### Test Steps

#### Setup: Create Low-Stock Product
1. Login as admin
2. Navigate to Inventory (if available) or use database directly
3. Create/update a product with:
   - Name: "Test Product - Low Stock"
   - Stock: 1 unit
   - Price: $10.00

#### Scenario: Simulate Two Cashiers Selling Last Unit
**Note**: This requires either two browser windows or direct API calls

##### Option 1: Two Browser Windows
1. Open two separate browser windows (Window A and Window B)
2. Login to both windows with same branch (B001)
3. Navigate both to Sales page

**Window A**:
1. Add "Test Product - Low Stock" (qty: 1)
2. Select payment method
3. Click "Complete Sale" (DO NOT SUBMIT YET)

**Window B** (while Window A is still preparing):
1. Add "Test Product - Low Stock" (qty: 1)
2. Select payment method
3. Click "Complete Sale" IMMEDIATELY after Window A

**Expected Behavior**:
- First sale succeeds (stock goes from 1 → 0)
- Second sale succeeds (last-commit-wins) but flags negative inventory
- Stock becomes -1 (flagged for manager review)
- Manager receives alert about negative stock

##### Option 2: Direct API Testing
Use Postman or curl to send two concurrent POST requests to `/api/v1/sales`

```bash
# Terminal 1
curl -X POST https://localhost:5001/api/v1/sales \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceType": "TouchSalesInvoice",
    "paymentMethod": "Cash",
    "lineItems": [
      {
        "productId": "PRODUCT_ID",
        "quantity": 1,
        "unitPrice": 10.00
      }
    ]
  }'

# Terminal 2 (run immediately after Terminal 1)
curl -X POST https://localhost:5001/api/v1/sales \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceType": "TouchSalesInvoice",
    "paymentMethod": "Cash",
    "lineItems": [
      {
        "productId": "PRODUCT_ID",
        "quantity": 1,
        "unitPrice": 10.00
      }
    ]
  }'
```

#### Verification
1. Check product stock level → Should be -1
2. Check manager dashboard → Should show low stock alert
3. Both sales should have valid invoice numbers
4. Audit log should record both transactions

### Test Result Criteria
- ✅ PASS: Both sales succeed, inventory goes negative, manager is alerted
- ❌ FAIL: Second sale is rejected, or inventory inconsistency occurs

---

## T104: Verify Invoice Reprinting

### Objective
Verify that invoices can be reprinted for both Touch and Standard formats.

### Test Steps

#### Part A: Create Sales with Different Invoice Types

**Create Touch Sales Invoice**:
1. Navigate to Sales page
2. Create a sale without selecting a customer
3. Select invoice type: "Touch Sales Invoice"
4. Complete sale
5. Note the Invoice Number (e.g., INV-B001-2024-00001)

**Create Standard Sales Invoice**:
1. Create another sale
2. Select/create a customer
3. Select invoice type: "Standard Sales Invoice"
4. Complete sale
5. Note the Invoice Number (e.g., INV-B001-2024-00002)

#### Part B: Test Invoice Reprinting

**Test Touch Invoice Reprint**:
1. Navigate to Sales History/List page
2. Find the Touch Sales Invoice transaction
3. Click "View Invoice" or "Print Invoice"
4. **Expected**:
   - Invoice displays with correct format
   - Shows: Branch name, Invoice number, Date, Items, Quantities, Prices, Subtotal, Tax, Total
   - Does NOT show customer information
   - Available formats: HTML, PDF, JSON

**Test Standard Invoice Reprint**:
1. Navigate to Sales History/List page
2. Find the Standard Sales Invoice transaction
3. Click "View Invoice" or "Print Invoice"
4. **Expected**:
   - Invoice displays with correct format
   - Shows: Branch name, Invoice number, Date, Customer info, Items, Quantities, Prices, Subtotal, Tax, Discount, Total
   - Shows customer: Name, Phone, Email (if available)
   - Available formats: HTML, PDF, JSON

#### Part C: Test Export Formats
1. For each invoice type, test export to:
   - **HTML**: Should display properly formatted invoice
   - **PDF**: Should download invoice as PDF file
   - **JSON**: Should return structured JSON data

### Test Result Criteria
- ✅ PASS: Both invoice types can be reprinted with correct format and data
- ❌ FAIL: Invoice data is missing, format is incorrect, or exports fail

---

## T105: Verify Sale Voiding Restores Inventory

### Objective
Verify that voiding a sale correctly restores product inventory.

### Test Steps

#### Part A: Record Initial State
1. Login as Manager (role required for voiding)
2. Navigate to Inventory
3. Select a product (e.g., "Test Product A")
4. Note the current stock quantity (e.g., Stock: 50 units)

#### Part B: Create Sale
1. Navigate to Sales page
2. Create a sale with "Test Product A":
   - Quantity: 5 units
   - Price: $10.00 each
   - Total: $50.00
3. Complete the sale
4. Note the Invoice Number
5. Verify product stock is reduced:
   - Expected stock: 50 - 5 = 45 units

#### Part C: Void the Sale
1. Navigate to Sales History
2. Find the sale created in Part B
3. Click "Void Sale" button
4. **Expected**:
   - Confirmation dialog appears
   - "Are you sure you want to void this sale? This will restore inventory."
5. Confirm void action
6. Enter void reason (if prompted): "Test void operation"

#### Part D: Verify Inventory Restoration
1. Navigate back to Inventory
2. Find "Test Product A"
3. Verify stock is restored:
   - Expected stock: 45 + 5 = 50 units (original stock)
4. Navigate to Sales History
5. Verify voided sale shows:
   - Status: "Voided"
   - Void reason
   - Voided by: Username
   - Voided at: Timestamp

#### Part E: Verify Voided Sale Cannot Be Voided Again
1. Try to void the same sale again
2. **Expected**:
   - Void button is disabled
   - Or error message: "This sale has already been voided"

#### Part F: Test Customer Stats (if customer was linked)
If the sale had a customer:
1. Check customer profile
2. Verify stats are decremented:
   - TotalPurchases reduced by sale total
   - VisitCount (may or may not decrement, depends on business logic)

### Test Result Criteria
- ✅ PASS: Inventory is correctly restored, sale status is "Voided", stats updated
- ❌ FAIL: Inventory not restored, double voiding possible, or stats incorrect

---

## Test Summary Template

After completing all tests, fill out this summary:

### T102: Offline Mode ☐ PASS ☐ FAIL
**Notes**: _______________________________________

### T103: Concurrent Sales Conflict ☐ PASS ☐ FAIL
**Notes**: _______________________________________

### T104: Invoice Reprinting ☐ PASS ☐ FAIL
**Notes**: _______________________________________

### T105: Sale Voiding ☐ PASS ☐ FAIL
**Notes**: _______________________________________

### Overall Phase 3 Status
- **All Tests Pass**: ☐ Ready for Phase 4
- **Some Tests Fail**: ☐ Needs fixes before proceeding

---

## Common Issues & Troubleshooting

### Issue: IndexedDB Not Initialized
**Solution**:
- Check browser console for errors
- Ensure you're using a modern browser (Chrome, Firefox, Edge)
- Clear browser cache and try again

### Issue: Sync Doesn't Trigger After Going Online
**Solution**:
- Check Network tab for API errors
- Verify backend `/api/v1/sync/transaction` endpoint is accessible
- Check browser console for sync errors
- Manually trigger sync by calling `syncAll()` from DevTools console

### Issue: JWT Token Expired
**Solution**:
- Logout and login again
- Check token expiration time in backend configuration
- Verify refresh token logic is working

### Issue: Product Stock Not Found
**Solution**:
- Ensure products are seeded in the database
- Check BranchDb has product records
- Use Swagger UI to manually create products via API

---

## Next Steps After Phase 3 Completion

Once all tests pass:
1. ✅ Mark tasks T102-T105 as [X] in tasks.md
2. ✅ Create implementation documentation in docs/
3. ✅ Commit changes with message: "feat: Complete Phase 3 - Sales Operations (T102-T105)"
4. 🚀 Proceed to Phase 4: User Story 2 - Inventory Management

---

## Notes
- These are manual tests because they involve user interaction, network simulation, and visual verification
- Automated E2E tests can be added later using Playwright or Cypress
- Document any bugs found during testing in the issue tracker
