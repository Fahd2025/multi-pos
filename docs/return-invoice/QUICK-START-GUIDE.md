# 🚀 Quick Start Guide - Return Invoice System

**Version:** 1.0
**Date:** 2025-12-29
**Phase:** 1 - Backend Setup
**Estimated Time:** 15-30 minutes

---

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ Backend project built successfully (`dotnet build`)
- ✅ Database server running (SQL Server / SQLite / PostgreSQL)
- ✅ Branch database created and configured
- ✅ API testing tool (Postman, Thunder Client, or curl)
- ✅ Manager/Admin user account created

---

## 🗄️ Step 1: Run Database Migration

### Option A: Using SQL Server Management Studio (SSMS)

1. **Open SSMS** and connect to your database server

2. **Select your branch database**
   ```sql
   USE YourBranchDatabase;
   GO
   ```

3. **Run the migration script**
   - Open file: `docs/return-invoice/implementation/add-return-fields-migration.sql`
   - Execute the entire script (F5)
   - Check for errors in the Messages pane

4. **Verify the migration**
   ```sql
   -- Check Sales table
   SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_NAME = 'Sales'
     AND COLUMN_NAME IN ('IsReturn', 'ReturnDate', 'ReturnReason', 'ReturnNotes', 'OriginalSaleId', 'ReturnApprovedBy')
   ORDER BY ORDINAL_POSITION;

   -- Check SaleLineItem table
   SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_NAME = 'SaleLineItem'
     AND COLUMN_NAME IN ('ReturnQuantity', 'ItemStatus')
   ORDER BY ORDINAL_POSITION;
   ```

   **Expected Results:**
   - Sales: 6 new columns
   - SaleLineItem: 2 new columns

### Option B: Using Command Line (sqlcmd)

```bash
# Connect to your database
sqlcmd -S localhost -d YourBranchDatabase -U sa -P YourPassword

# Run the migration script
:r docs/return-invoice/implementation/add-return-fields-migration.sql
GO

# Exit
EXIT
```

### Option C: Using Entity Framework Migrations

If you prefer EF migrations, create a new migration:

```bash
cd Backend

# Create migration
dotnet ef migrations add AddReturnInvoiceFields --context BranchDbContext

# Review the generated migration in Migrations/ folder

# Apply migration
dotnet ef database update --context BranchDbContext
```

**⚠️ Note:** EF will auto-generate the migration based on your model changes.

---

## 🔧 Step 2: Build and Run the Backend

### Build the Project

```bash
cd Backend

# Clean build
dotnet clean
dotnet build

# Check for errors
# Should see: Build succeeded
```

**Expected Output:**
```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

### Run the API

```bash
# Run the backend
dotnet run

# OR with hot reload
dotnet watch run
```

**Expected Output:**
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:5001
      Now listening on: http://localhost:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

**✅ Backend is ready!** API running at: `https://localhost:5001`

---

## 🧪 Step 3: Test the API Endpoints

### A. Get Authentication Token

First, you need a Manager or Admin token to test the return endpoints.

**Request:**
```http
POST https://localhost:5001/api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password",
  "branchCode": "BRANCH001"
}
```

**Save the token** from the response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "username": "admin",
      "role": "Admin"
    }
  }
}
```

**💡 Tip:** Copy the token value - you'll need it for all subsequent requests.

---

### B. Create a Test Sale

Create a sale that we can later return.

**Request:**
```http
POST https://localhost:5001/api/v1/sales
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "invoiceType": 1,
  "orderType": 1,
  "customerId": null,
  "items": [
    {
      "productId": "PRODUCT_GUID_HERE",
      "quantity": 10,
      "unitPrice": 15.50,
      "discountType": 0,
      "discountValue": 0
    }
  ],
  "paymentMethod": 0,
  "amountPaid": 155.00,
  "notes": "Test sale for return testing"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "a3b2c1d4-e5f6-7890-abcd-ef1234567890",
    "transactionId": "TXN-1735467890123",
    "orderNumber": "ORD-001",
    "total": 155.00,
    "lineItems": [
      {
        "id": "b4c3d2e1-f6e5-8901-bcde-f12345678901",
        "productId": "c5d4e3f2-e7f6-9012-cdef-123456789012",
        "quantity": 10,
        "returnQuantity": 0,
        "itemStatus": "ordered"
      }
    ]
  },
  "message": "Sale created successfully"
}
```

**📝 Save these IDs:**
- `saleId`: a3b2c1d4-e5f6-7890-abcd-ef1234567890
- `saleItemId`: b4c3d2e1-f6e5-8901-bcde-f12345678901
- `productId`: c5d4e3f2-e7f6-9012-cdef-123456789012

---

### C. Check if Sale Can Be Returned

**Request:**
```http
GET https://localhost:5001/api/v1/sales/{saleId}/can-return
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "canReturn": true,
    "saleId": "a3b2c1d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

**✅ If `canReturn: true`, proceed to next step!**

---

### D. Process a Partial Return

Return 3 out of 10 items.

**Request:**
```http
POST https://localhost:5001/api/v1/sales/return
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "originalSaleId": "a3b2c1d4-e5f6-7890-abcd-ef1234567890",
  "returnReason": "damaged",
  "returnNotes": "Testing partial return - 3 items damaged",
  "items": [
    {
      "saleItemId": "b4c3d2e1-f6e5-8901-bcde-f12345678901",
      "productId": "c5d4e3f2-e7f6-9012-cdef-123456789012",
      "returnQuantity": 3,
      "unitPrice": 15.50
    }
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Return processed successfully",
    "returnOrderNumber": "RET-ORD-001-1735467890123",
    "returnSaleId": "d6e5f4e3-f8e7-0123-defg-234567890123",
    "refundAmount": 46.50,
    "originalSaleId": "a3b2c1d4-e5f6-7890-abcd-ef1234567890",
    "returnTransactionId": "RTN-1735467890123",
    "returnDate": "2025-12-29T10:30:00Z"
  },
  "message": "Return processed successfully"
}
```

**✅ Success Indicators:**
- `success: true`
- `returnOrderNumber` starts with "RET-"
- `refundAmount` = 46.50 (3 × 15.50)

---

### E. Verify the Original Sale Updated

Check that the original sale now shows partial return.

**Request:**
```http
GET https://localhost:5001/api/v1/sales/{originalSaleId}
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "a3b2c1d4-e5f6-7890-abcd-ef1234567890",
    "status": "partially_returned",
    "lineItems": [
      {
        "id": "b4c3d2e1-f6e5-8901-bcde-f12345678901",
        "quantity": 10,
        "returnQuantity": 3,
        "itemStatus": "partially_returned"
      }
    ]
  }
}
```

**✅ Verify:**
- `status` = "partially_returned"
- `lineItems[0].returnQuantity` = 3
- `lineItems[0].itemStatus` = "partially_returned"

---

### F. Get Return History

**Request:**
```http
GET https://localhost:5001/api/v1/sales/{originalSaleId}/returns
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "d6e5f4e3-f8e7-0123-defg-234567890123",
      "transactionId": "RTN-1735467890123",
      "orderNumber": "RET-ORD-001-1735467890123",
      "isReturn": true,
      "returnDate": "2025-12-29T10:30:00Z",
      "returnReason": "damaged",
      "returnNotes": "Testing partial return - 3 items damaged",
      "originalSaleId": "a3b2c1d4-e5f6-7890-abcd-ef1234567890",
      "total": -46.50,
      "lineItems": [
        {
          "quantity": -3,
          "unitPrice": 15.50,
          "lineTotal": -46.50,
          "itemStatus": "returned"
        }
      ]
    }
  ],
  "count": 1
}
```

**✅ Verify:**
- `count` = 1 (one return processed)
- `isReturn` = true
- `total` = -46.50 (negative value)
- `lineItems[0].quantity` = -3 (negative value)

---

### G. Process Complete Return (Remaining Items)

Return the remaining 7 items.

**Request:**
```http
POST https://localhost:5001/api/v1/sales/return
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "originalSaleId": "a3b2c1d4-e5f6-7890-abcd-ef1234567890",
  "returnReason": "customer_request",
  "returnNotes": "Testing full return - customer changed mind",
  "items": [
    {
      "saleItemId": "b4c3d2e1-f6e5-8901-bcde-f12345678901",
      "productId": "c5d4e3f2-e7f6-9012-cdef-123456789012",
      "returnQuantity": 7,
      "unitPrice": 15.50
    }
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "returnOrderNumber": "RET-ORD-001-1735467990456",
    "refundAmount": 108.50,
    "originalSaleId": "a3b2c1d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

**✅ Verify:**
- `refundAmount` = 108.50 (7 × 15.50)

---

### H. Verify Full Return Status

**Request:**
```http
GET https://localhost:5001/api/v1/sales/{originalSaleId}
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "returned",
    "lineItems": [
      {
        "quantity": 10,
        "returnQuantity": 10,
        "itemStatus": "returned"
      }
    ]
  }
}
```

**✅ Final Verification:**
- `status` = "returned" (changed from "partially_returned")
- `returnQuantity` = 10 (equals original quantity)
- `itemStatus` = "returned"

---

### I. Verify Return History (2 Returns)

**Request:**
```http
GET https://localhost:5001/api/v1/sales/{originalSaleId}/returns
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "orderNumber": "RET-ORD-001-1735467990456",
      "returnReason": "customer_request",
      "total": -108.50
    },
    {
      "orderNumber": "RET-ORD-001-1735467890123",
      "returnReason": "damaged",
      "total": -46.50
    }
  ],
  "count": 2
}
```

**✅ Verify:**
- `count` = 2 (both returns recorded)
- Total refunds = -155.00 (-46.50 + -108.50)

---

## ✅ Step 4: Verification Checklist

After completing all tests, verify:

### Database Checks

```sql
-- 1. Check return sales were created
SELECT
    Id, OrderNumber, IsReturn, ReturnDate, ReturnReason,
    OriginalSaleId, Total
FROM Sales
WHERE IsReturn = 1
ORDER BY ReturnDate DESC;

-- Expected: 2 rows (both returns)

-- 2. Check original sale status updated
SELECT
    Id, OrderNumber, Status
FROM Sales
WHERE Id = 'YOUR_ORIGINAL_SALE_ID';

-- Expected: Status = 'returned'

-- 3. Check line item return tracking
SELECT
    Id, Quantity, ReturnQuantity, ItemStatus
FROM SaleLineItem
WHERE SaleId = 'YOUR_ORIGINAL_SALE_ID';

-- Expected: ReturnQuantity = 10, ItemStatus = 'returned'

-- 4. Verify inventory was restored
SELECT
    Id, Name, Quantity
FROM Products
WHERE Id = 'YOUR_PRODUCT_ID';

-- Expected: Quantity increased by 10
```

### API Functionality

- [x] Can authenticate as Manager/Admin
- [x] Can create a test sale
- [x] Can check if sale is returnable
- [x] Can process partial return
- [x] Original sale updates to "partially_returned"
- [x] Can process second return (remaining items)
- [x] Original sale updates to "returned"
- [x] Can fetch return history
- [x] Return history shows all returns

### Business Logic

- [x] Cannot return voided sales
- [x] Cannot return more than available quantity
- [x] Cannot return a return invoice
- [x] Inventory automatically updates (stock increases)
- [x] Status automatically updates (ordered → partially_returned → returned)
- [x] Refund amounts calculated correctly
- [x] Manager authorization enforced

---

## 🐛 Troubleshooting

### Error: "Unauthorized" (401)

**Cause:** Missing or invalid token

**Solution:**
1. Get a fresh token from `/api/v1/auth/login`
2. Ensure you're using a Manager or Admin account
3. Check token is included in `Authorization: Bearer {token}` header

---

### Error: "Forbidden" (403)

**Cause:** User doesn't have Manager/Admin role

**Solution:**
1. Check user role: `SELECT Role FROM Users WHERE Id = 'YOUR_USER_ID'`
2. Update role if needed: `UPDATE Users SET Role = 'Manager' WHERE Id = 'YOUR_USER_ID'`
3. Get a new token after role change

---

### Error: "Original sale not found"

**Cause:** Invalid sale ID

**Solution:**
1. Verify sale exists: `SELECT * FROM Sales WHERE Id = 'YOUR_SALE_ID'`
2. Use correct GUID format (no curly braces in URL)
3. Ensure you're querying the correct branch database

---

### Error: "Cannot return X, max returnable quantity is Y"

**Cause:** Trying to return more than available

**Solution:**
1. Check current return quantity: `SELECT ReturnQuantity FROM SaleLineItem WHERE Id = 'ITEM_ID'`
2. Calculate available: `Available = Quantity - ReturnQuantity`
3. Adjust your return request accordingly

---

### Error: "Cannot return a voided sale"

**Cause:** Sale status is "voided"

**Solution:**
1. Use a different sale (non-voided)
2. If this is a test, create a new sale

---

### Database Migration Failed

**Cause:** Various reasons

**Solution:**
1. **Check SQL syntax errors** in the Messages pane
2. **Verify table names** match your schema (Sales vs Sale)
3. **Check permissions** - ensure you can ALTER TABLE
4. **Rollback if needed:**
   ```sql
   -- Use the rollback script at bottom of migration file
   -- Uncomment and run
   ```
5. **Re-run migration** after fixing issues

---

### Build Errors

**Cause:** Compilation errors

**Solution:**
```bash
# Clean and rebuild
dotnet clean
dotnet build

# Check for missing dependencies
dotnet restore

# Verify all files saved
# Check for syntax errors in new files
```

---

### API Not Responding

**Cause:** Backend not running or port conflict

**Solution:**
1. **Check if backend is running:**
   ```bash
   dotnet run
   ```

2. **Check port availability:**
   ```bash
   # Windows
   netstat -ano | findstr :5001

   # Linux/Mac
   lsof -i :5001
   ```

3. **Try different port** in `launchSettings.json` if needed

---

## 📊 Expected Results Summary

| Test | Expected Result |
|------|-----------------|
| Database Migration | 9 new fields added |
| Build | Succeeds with 0 errors |
| Authentication | Token received |
| Create Sale | Sale created, status = "completed" |
| Check Returnable | canReturn = true |
| Partial Return | Refund = $46.50, status = "partially_returned" |
| Full Return | Refund = $108.50, status = "returned" |
| Return History | 2 returns listed |
| Inventory | Quantity increased by 10 |

---

## 🎯 Success Criteria

You've successfully completed the quick start when:

✅ Database migration applied without errors
✅ Backend builds and runs successfully
✅ All 9 API tests pass
✅ Database shows correct statuses
✅ Inventory properly restored
✅ Return history tracked correctly

---

## 📅 Next Steps

After successful testing:

1. **✅ Mark Phase 1 as complete** - Backend is production-ready!
2. **🚀 Start Phase 2** - Frontend Components
3. **📖 Review** - [Frontend implementation plan](planning/2025-12-29-return-invoice-implementation-plan.md#4-frontend-component-architecture)
4. **💻 Build** - ReturnInvoiceDialog component

---

## 💡 Pro Tips

1. **Save Test Data** - Keep your test sale IDs in a notepad for reuse
2. **Use Postman Collections** - Create a collection for all return endpoints
3. **Environment Variables** - Store base URL and token in Postman environment
4. **Database Snapshots** - Create a backup before migration for easy rollback
5. **Swagger UI** - Access at `https://localhost:5001/swagger` for interactive testing

---

## 📞 Need Help?

- **Documentation:** See `docs/return-invoice/planning/` for detailed specs
- **Test Cases:** Check `docs/return-invoice/testing/test-cases.md`
- **Implementation Log:** Review `docs/return-invoice/implementation/phase-1-backend-setup.md`

---

**Quick Start Guide Version:** 1.0
**Last Updated:** 2025-12-29
**Status:** Ready for Production Testing

🎉 **Congratulations! Your Return Invoice backend is ready!**
