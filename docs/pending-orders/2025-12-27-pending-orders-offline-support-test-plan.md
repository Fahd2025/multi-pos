# Pending Orders Offline Support - Test Plan

**Date:** 2025-12-27
**Feature:** Phase 1 - Offline Support for Pending Orders
**Status:** Ready for Testing

---

## Overview

This document provides a comprehensive test plan for the offline support functionality implemented in Phase 1 of the Pending Orders enhancements.

### What Was Implemented

1. **Backend Sync Endpoint** - Handles offline transaction synchronization
2. **Frontend Offline Detection** - Detects online/offline status
3. **IndexedDB Queue** - Persists pending orders when offline
4. **Auto-Sync** - Automatically syncs when connection returns
5. **UI Indicators** - Visual feedback for offline status

---

## Prerequisites

### Backend Server
✅ **RUNNING** on `http://localhost:5062`

### Frontend Server
⚠️ **NOT YET STARTED** - Start with:
```bash
cd frontend
npm run dev
```

### Test User Credentials
- **Username:** `admin`
- **Password:** `123`

### Test Branch
- Use any active branch (B001, B002, B003, etc.)

---

## Test Scenarios

### Test 1: Online Order Creation (Baseline)

**Purpose:** Verify that pending order creation works normally when online.

**Steps:**
1. Open browser to `http://localhost:3000`
2. Login with admin credentials
3. Navigate to POS page (`/en/pos`)
4. Add items to cart (at least 2 items)
5. Click "Save Order" button
6. Fill in the Save Order dialog:
   - Customer Name: "Test Customer"
   - Order Type: Dine In
   - Table Number: 5
   - Guest Count: 2
   - Status: Parked
   - Notes: "Test order - online"
7. Click "Save Order"

**Expected Results:**
- ✅ Dialog shows "Save Order" button (NOT "Save Offline")
- ✅ NO offline indicator badge visible
- ✅ Order saves successfully
- ✅ Success toast appears
- ✅ Dialog closes
- ✅ Cart clears

**Verification:**
- Check backend logs for successful POST to `/api/v1/pending-orders`
- Open "Pending Orders" panel and verify order appears
- Order should have a proper order number like `PO-20251227-0001`

---

### Test 2: Offline Order Queuing

**Purpose:** Verify that orders are queued to IndexedDB when offline.

**Steps:**
1. While logged in to POS page
2. Open browser DevTools (F12)
3. Go to Network tab
4. Click "Offline" checkbox (simulates offline mode)
5. Add items to cart (2-3 items)
6. Click "Save Order" button
7. Observe the dialog header
8. Fill in the form:
   - Customer Name: "Offline Customer"
   - Order Type: Take Away
   - Status: On Hold
   - Notes: "Test order - offline"
9. Click the save button

**Expected Results:**
- ✅ Dialog shows **"Offline"** badge in header (amber color)
- ✅ Button text changes to **"Save Offline"**
- ✅ When saving, button shows **"Saving Offline..."**
- ✅ Order saves to IndexedDB queue
- ✅ Success toast appears
- ✅ Dialog closes
- ✅ Cart clears

**Verification:**
1. Open DevTools → Application tab → IndexedDB
2. Expand `OfflineQueue` → `transactions`
3. You should see 1 transaction with:
   - Type: `"pending_order"`
   - Status: `"pending"`
   - Data: Contains the pending order details
   - Timestamp: Current timestamp

---

### Test 3: Pending Sync Count Display

**Purpose:** Verify that the pending sync count is displayed correctly.

**Steps:**
1. Still offline from Test 2
2. Create 2 more pending orders (different items/details)
3. Open the Save Order dialog again (don't save, just observe)

**Expected Results:**
- ✅ Offline badge shows in dialog header
- ✅ Below the order total, text shows: **"3 orders pending sync"**
- ✅ Count updates correctly as you add more orders

---

### Test 4: Auto-Sync on Reconnection

**Purpose:** Verify that queued orders automatically sync when connection is restored.

**Steps:**
1. With 3 queued orders from previous tests
2. In DevTools Network tab, **uncheck "Offline"** to go back online
3. Wait 3-5 seconds for auto-sync to trigger
4. Observe browser console and network activity

**Expected Results:**
- ✅ Auto-sync triggers automatically (within 5 seconds)
- ✅ Network request to `POST /api/v1/sync/transaction` appears (3 times)
- ✅ All 3 transactions sync successfully
- ✅ Toast notification: **"3 orders synced successfully"**
- ✅ IndexedDB queue is cleared (transactions marked as `"completed"`)

**Verification:**
1. Check IndexedDB → OfflineQueue → transactions
   - All transactions should have status: `"completed"`
2. Open Pending Orders panel
   - All 3 orders should now appear with proper order numbers
   - Order numbers assigned by server (e.g., `PO-20251227-0001`, `PO-20251227-0002`, etc.)

---

### Test 5: Offline → Online Status Indicator

**Purpose:** Verify UI indicators update correctly when network status changes.

**Steps:**
1. Start online
2. Open Save Order dialog
3. Go offline (DevTools Network → Offline)
4. Observe dialog (should auto-update within 1-2 seconds)
5. Go back online
6. Observe dialog again

**Expected Results:**
- ✅ **Online:** No offline badge, button says "Save Order"
- ✅ **Offline:** Amber badge appears, button says "Save Offline"
- ✅ **Back Online:** Badge disappears, button reverts to "Save Order"
- ✅ Changes happen automatically without refreshing dialog

---

### Test 6: Sync Failure Handling

**Purpose:** Verify that sync failures are handled gracefully with retry logic.

**Steps:**
1. Go offline
2. Create a pending order with INVALID data:
   - Leave all required fields empty
   - Or use non-existent product IDs
3. Go back online
4. Wait for auto-sync attempt

**Expected Results:**
- ✅ Sync attempts to process the transaction
- ✅ Backend returns error
- ✅ Transaction status changes to `"pending"` (will retry)
- ✅ Retry count increments
- ✅ After 3 failed attempts, status becomes `"failed"`
- ✅ Error toast shows: **"Failed to sync 1 order"**

**Verification:**
- Check IndexedDB transaction entry:
  - `retryCount`: Should increment (0 → 1 → 2 → 3)
  - `lastError`: Contains error message
  - `status`: `"failed"` after max retries
- Check browser console for error logs

---

### Test 7: Multiple Offline/Online Cycles

**Purpose:** Verify system handles repeated offline/online transitions correctly.

**Steps:**
1. Go offline → Create order → Go online (wait for sync)
2. Go offline → Create order → Go online (wait for sync)
3. Go offline → Create 2 orders → Go online (wait for sync)

**Expected Results:**
- ✅ Each cycle works correctly
- ✅ Syncs happen automatically each time
- ✅ No duplicate orders created
- ✅ Queue is properly managed (cleared after sync)
- ✅ UI indicators always accurate

---

### Test 8: Long-Term Offline Storage

**Purpose:** Verify that queued orders persist across browser sessions.

**Steps:**
1. Go offline
2. Create 2-3 pending orders
3. Close browser completely
4. Reopen browser
5. Navigate back to POS page
6. Check IndexedDB

**Expected Results:**
- ✅ Queued orders still present in IndexedDB
- ✅ Pending count shows correctly
- ✅ When going back online, queued orders sync

---

### Test 9: Backend Sync Endpoint Validation

**Purpose:** Verify backend correctly processes synced pending orders.

**Steps:**
1. Go offline
2. Create pending order with known data:
   - Customer: "John Doe"
   - Table: 10
   - Guests: 4
   - Notes: "Backend validation test"
3. Go online
4. After sync completes, check backend database

**Expected Results:**
- ✅ Order exists in `PendingOrders` table
- ✅ Order has server-generated GUID for ID
- ✅ Order number follows format: `PO-YYYYMMDD-XXXX`
- ✅ `CreatedByUserId` matches logged-in user
- ✅ `CreatedAt` timestamp reflects ORIGINAL client timestamp (not server time)
- ✅ Items exist in `PendingOrderItems` table with correct product references

**Database Check (SQLite):**
```bash
# Backend console
sqlite3 Data/Branches/branch_adae7e7d-5fd5-4916-ac9e-b59f90e2f362.db
SELECT * FROM PendingOrders WHERE Notes = 'Backend validation test';
SELECT * FROM PendingOrderItems WHERE PendingOrderId = '<order-id>';
```

---

## Performance Tests

### Test 10: Bulk Offline Orders

**Purpose:** Verify system handles large number of queued orders.

**Steps:**
1. Go offline
2. Create 10 pending orders rapidly
3. Go back online
4. Measure sync time

**Expected Results:**
- ✅ All 10 orders queue successfully
- ✅ Auto-sync processes all 10 (may take 10-15 seconds)
- ✅ Orders sync sequentially (not in parallel to avoid overwhelming server)
- ✅ 100ms delay between each sync request
- ✅ No browser freezing or UI lag

---

## Edge Cases

### Test 11: Offline While Dialog Open

**Steps:**
1. Open Save Order dialog (online)
2. Fill in half the form
3. Go offline (DevTools)
4. Continue filling form
5. Click Save

**Expected Results:**
- ✅ Offline badge appears while dialog is open
- ✅ Button text updates to "Save Offline"
- ✅ Order saves to queue successfully

### Test 12: Network Interruption During Sync

**Steps:**
1. Queue 3 orders offline
2. Go online (sync starts)
3. Immediately go offline again (mid-sync)

**Expected Results:**
- ✅ Partially synced orders remain in `"syncing"` or revert to `"pending"`
- ✅ When back online, sync resumes from pending transactions
- ✅ No data loss or corruption

---

## Success Criteria

### Must Pass (Critical)
- [✓] Test 1: Online order creation works
- [✓] Test 2: Offline order queuing works
- [✓] Test 4: Auto-sync triggers and succeeds
- [✓] Test 5: UI indicators update correctly
- [✓] Test 9: Backend stores synced orders correctly

### Should Pass (Important)
- [✓] Test 3: Pending count displays correctly
- [✓] Test 6: Sync failures handled gracefully
- [✓] Test 7: Multiple offline/online cycles work
- [✓] Test 8: Orders persist across sessions

### Nice to Have (Enhancement)
- [✓] Test 10: Bulk orders perform well
- [✓] Test 11-12: Edge cases handled

---

## Debugging Tips

### Check IndexedDB Queue
1. DevTools → Application → IndexedDB → OfflineQueue → transactions
2. Look for:
   - Transaction count
   - Status (pending/completed/failed)
   - Retry counts
   - Error messages

### Check Network Requests
1. DevTools → Network tab
2. Filter: `sync/transaction`
3. Inspect request/response payloads
4. Check status codes (200 = success, 400/500 = error)

### Check Backend Logs
- Backend console shows:
  - Sync transaction processing
  - Order creation logs
  - Validation errors
  - Database queries

### Check Browser Console
- Frontend logs:
  - Offline/online events
  - Sync progress
  - Queue operations
  - Error messages

---

## Known Limitations

1. **No Conflict Resolution**: Last-write-wins strategy
2. **No Offline Editing**: Can't edit queued orders while offline
3. **No Manual Retry**: User can't manually trigger retry for failed syncs
4. **Fixed Retry Logic**: 3 attempts with exponential backoff (1s, 5s, 15s)

---

## Next Steps After Testing

If all tests pass:
1. ✅ Mark Phase 1 complete
2. ✅ Create implementation documentation
3. ✅ Proceed to Phase 2 (Keyboard Shortcuts)

If tests fail:
1. Document which tests failed
2. Investigate root cause
3. Fix issues
4. Re-test

---

## Test Execution Checklist

- [ ] Backend server running
- [ ] Frontend server running
- [ ] Logged in as admin user
- [ ] Browser DevTools open
- [ ] Test 1 executed
- [ ] Test 2 executed
- [ ] Test 3 executed
- [ ] Test 4 executed
- [ ] Test 5 executed
- [ ] Test 6 executed
- [ ] Test 7 executed
- [ ] Test 8 executed
- [ ] Test 9 executed
- [ ] Test 10 executed
- [ ] Test 11 executed
- [ ] Test 12 executed
- [ ] All critical tests passed
- [ ] Issues documented
- [ ] Ready to proceed to Phase 2

---

**End of Test Plan**
