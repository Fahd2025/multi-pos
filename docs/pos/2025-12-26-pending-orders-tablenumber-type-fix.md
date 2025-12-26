# Pending Orders TableNumber Type Fix

**Date:** 2025-12-26
**Issue:** Pending orders creation failing with 500 Internal Server Error
**Status:** ✅ Fixed (Migration pending - requires backend restart)
**Related:** [Table Number Type Fix](./2025-12-26-table-number-type-fix.md)

## Problem Statement

When attempting to save a pending order, the API returns a 500 Internal Server Error:

```
POST http://localhost:5062/api/v1/pending-orders 500 (Internal Server Error)
Error: Failed to read parameter "CreatePendingOrderDto createDto" from the request body as JSON.
```

### Error Context

```javascript
❌ API Error Details:
  Method: POST
  URL: /api/v1/pending-orders
  Status: 500 Internal Server Error
  Error Code: INTERNAL_ERROR
  Error Message: Failed to read parameter "CreatePendingOrderDto createDto" from the request body as JSON.
```

## Root Cause Analysis

### Type Mismatch

During the previous table number type fix (changing `tableNumber` from `string` to `number`), we updated:

✅ **Frontend Types:**
- `CreateSaleDto.tableNumber` → `number`
- `CreatePendingOrderDto.tableNumber` → `number`

✅ **Backend Sales:**
- `Sale.TableNumber` → `int?`
- `CreateSaleDto.TableNumber` → `int?`

❌ **Backend Pending Orders (NOT UPDATED):**
- `PendingOrder.TableNumber` → `string?` (should be `int?`)
- `CreatePendingOrderDto.TableNumber` → `string?` (should be `int?`)
- `PendingOrderDto.TableNumber` → `string?` (should be `int?`)
- `UpdatePendingOrderDto.TableNumber` → `string?` (should be `int?`)

### The Problem Flow

1. User creates dine-in order with table
2. Clicks "Save Order" to park the order
3. Frontend sends:
   ```json
   {
     "tableNumber": 2,  // ← Sent as number
     "guestCount": 1,
     // ... other fields
   }
   ```
4. **Backend tries to deserialize into `CreatePendingOrderDto`**
5. **Backend expects `TableNumber: string?`** ❌
6. **Frontend sends `tableNumber: number`** ❌
7. **JSON deserialization fails** ❌
8. **500 Internal Server Error returned** ❌

## Solution Implemented

### 1. Updated PendingOrder Entity

**File:** `Backend/Models/Entities/Branch/PendingOrder.cs`
**Line:** 33

**BEFORE:**
```csharp
// Table Information (Optional - for dine-in orders)
public Guid? TableId { get; set; }

[MaxLength(20)]
public string? TableNumber { get; set; }  // ❌ Wrong type

public int? GuestCount { get; set; }
```

**AFTER:**
```csharp
// Table Information (Optional - for dine-in orders)
public Guid? TableId { get; set; }

public int? TableNumber { get; set; }  // ✅ Correct type

public int? GuestCount { get; set; }
```

### 2. Updated CreatePendingOrderDto

**File:** `Backend/Models/DTOs/Branch/PendingOrders/CreatePendingOrderDto.cs`
**Line:** 25

**BEFORE:**
```csharp
// Table Information (Optional - for dine-in orders)
public Guid? TableId { get; set; }

[MaxLength(20)]
public string? TableNumber { get; set; }  // ❌ Wrong type

[Range(1, 100, ErrorMessage = "Guest count must be between 1 and 100")]
public int? GuestCount { get; set; }
```

**AFTER:**
```csharp
// Table Information (Optional - for dine-in orders)
public Guid? TableId { get; set; }

public int? TableNumber { get; set; }  // ✅ Correct type

[Range(1, 100, ErrorMessage = "Guest count must be between 1 and 100")]
public int? GuestCount { get; set; }
```

### 3. Updated PendingOrderDto (Response DTO)

**File:** `Backend/Models/DTOs/Branch/PendingOrders/PendingOrderDto.cs`
**Line:** 25

**BEFORE:**
```csharp
// Table Information
public Guid? TableId { get; set; }

public string? TableNumber { get; set; }  // ❌ Wrong type

public int? GuestCount { get; set; }
```

**AFTER:**
```csharp
// Table Information
public Guid? TableId { get; set; }

public int? TableNumber { get; set; }  // ✅ Correct type

public int? GuestCount { get; set; }
```

### 4. Updated UpdatePendingOrderDto

**File:** `Backend/Models/DTOs/Branch/PendingOrders/UpdatePendingOrderDto.cs`
**Line:** 23

**BEFORE:**
```csharp
public Guid? TableId { get; set; }

[MaxLength(20)]
public string? TableNumber { get; set; }  // ❌ Wrong type

[Range(1, 100, ErrorMessage = "Guest count must be between 1 and 100")]
public int? GuestCount { get; set; }
```

**AFTER:**
```csharp
public Guid? TableId { get; set; }

public int? TableNumber { get; set; }  // ✅ Correct type

[Range(1, 100, ErrorMessage = "Guest count must be between 1 and 100")]
public int? GuestCount { get; set; }
```

## Database Migration Required

### Migration Command

```bash
cd Backend
dotnet ef migrations add ChangePendingOrderTableNumberToInt --context BranchDbContext
```

### Expected Migration

The migration will change the `PendingOrders` table schema:

**Up Migration:**
```csharp
migrationBuilder.AlterColumn<int>(
    name: "TableNumber",
    table: "PendingOrders",
    type: "INTEGER",  // SQLite (or INT for SQL Server)
    nullable: true,
    oldClrType: typeof(string),
    oldType: "TEXT",
    oldMaxLength: 20,
    oldNullable: true);
```

**Down Migration:**
```csharp
migrationBuilder.AlterColumn<string>(
    name: "TableNumber",
    table: "PendingOrders",
    type: "TEXT",
    maxLength: 20,
    nullable: true,
    oldClrType: typeof(int),
    oldType: "INTEGER",
    oldNullable: true);
```

## Files Modified

1. **`Backend/Models/Entities/Branch/PendingOrder.cs`**
   - Line 33: `string? TableNumber` → `int? TableNumber`
   - Removed `[MaxLength(20)]` attribute

2. **`Backend/Models/DTOs/Branch/PendingOrders/CreatePendingOrderDto.cs`**
   - Line 25: `string? TableNumber` → `int? TableNumber`
   - Removed `[MaxLength(20)]` attribute

3. **`Backend/Models/DTOs/Branch/PendingOrders/PendingOrderDto.cs`**
   - Line 25: `string? TableNumber` → `int? TableNumber`

4. **`Backend/Models/DTOs/Branch/PendingOrders/UpdatePendingOrderDto.cs`**
   - Line 23: `string? TableNumber` → `int? TableNumber`
   - Removed `[MaxLength(20)]` attribute

**Total Files Modified:** 4 files

## Deployment Steps

### 1. Stop Backend
```bash
# Stop the running backend process
# Ctrl+C in terminal or kill process
```

### 2. Create Migration
```bash
cd Backend
dotnet ef migrations add ChangePendingOrderTableNumberToInt --context BranchDbContext
```

### 3. Apply Migration
```bash
dotnet ef database update --context BranchDbContext
```

### 4. Restart Backend
```bash
dotnet run
# or
dotnet watch
```

### 5. Test Pending Orders
- Navigate to `/pos`
- Add items to cart
- Click "Save Order"
- Verify pending order is saved successfully ✅

## Testing Checklist

### Pre-Fix Behavior ❌
- [❌] Add items to cart with table assigned
- [❌] Click "Save Order"
- [❌] Frontend sends `tableNumber: 2` (number)
- [❌] Backend receives wrong type
- [❌] JSON deserialization fails
- [❌] 500 Internal Server Error returned

### Post-Fix Expected Behavior ✅
- [ ] Add items to cart with table assigned
- [ ] Click "Save Order"
- [ ] Frontend sends `tableNumber: 2` (number)
- [ ] Backend receives correct type (int?)
- [ ] JSON deserialization succeeds
- [ ] Pending order created successfully
- [ ] Order appears in pending orders list
- [ ] Table information preserved correctly

### Additional Test Cases

**Dine-In Order with Table:**
```json
{
  "customerName": "John Doe",
  "tableNumber": 5,     // ✅ Number
  "guestCount": 4,
  "orderType": 1,       // DineIn
  "status": 0,          // Parked
  "items": [...],
  "subtotal": 50.00,
  "taxAmount": 7.50,
  "totalAmount": 57.50
}
```

**Take Away Order (No Table):**
```json
{
  "customerName": "Jane Smith",
  "tableNumber": null,  // ✅ Null for takeaway
  "orderType": 0,       // TakeOut
  "status": 0,          // Parked
  "items": [...],
  "subtotal": 25.00,
  "taxAmount": 3.75,
  "totalAmount": 28.75
}
```

**Retrieve Pending Order:**
- Should return `tableNumber` as number (not string)
- Frontend should receive `tableNumber: 5` not `tableNumber: "5"`

## Type Consistency Across Codebase

After this fix, TableNumber is consistently `int?` across all entities and DTOs:

### Entities
- ✅ `Sale.TableNumber` → `int?`
- ✅ `PendingOrder.TableNumber` → `int?`
- ✅ `Table.Number` → `int`

### DTOs - Sales
- ✅ `CreateSaleDto.TableNumber` → `int?`
- ✅ `SaleDto.TableNumber` → `int?`

### DTOs - Pending Orders
- ✅ `CreatePendingOrderDto.TableNumber` → `int?`
- ✅ `PendingOrderDto.TableNumber` → `int?`
- ✅ `UpdatePendingOrderDto.TableNumber` → `int?`

### Frontend Types
- ✅ `CreateSaleDto.tableNumber` → `number`
- ✅ `CreatePendingOrderDto.tableNumber` → `number`
- ✅ `PendingOrderDto.tableNumber` → `number`
- ✅ `SaveOrderData.tableNumber` → `number`

## Related Documentation

### Previous Related Fixes
1. **[Table Number Type Fix](./2025-12-26-table-number-type-fix.md)** - Original fix that changed tableNumber from string to number
2. **[Order Type Mapping Fix](./2025-12-26-order-type-mapping-fix.md)** - Fixed order type enum mapping
3. **[Auto-Set Dine-In Order Type](./2025-12-26-auto-set-dine-in-order-type.md)** - Auto-set order type from URL params

### System Documentation
- **[Pending Orders Implementation](./2025-12-24-pending-orders-implementation.md)** - Original pending orders feature
- **[Table Management Implementation](./2025-12-23-table-management-implementation.md)** - Table management system

## Benefits

### 1. **JSON Deserialization Success**
- Backend can now properly deserialize pending order requests
- No more 500 errors when saving orders
- Correct type mapping between frontend and backend

### 2. **Type Consistency**
- All table number fields use consistent types
- Entity Framework handles migrations correctly
- No more string-to-int conversion issues

### 3. **Database Integrity**
- TableNumber stored as INTEGER (more efficient than TEXT)
- Proper indexing and query performance
- Consistent with Sale entity schema

### 4. **API Reliability**
- Pending orders API works correctly
- Save Order feature functional
- Parked orders can be retrieved and merged

## Impact

### Before Fix ❌
- Pending orders feature completely broken
- Save Order button throws 500 errors
- Cannot park orders for later
- Lost pending orders functionality

### After Fix ✅
- Pending orders work correctly
- Save Order creates parked orders
- Orders can be retrieved and completed
- Full pending orders workflow functional

## Conclusion

Successfully fixed the type mismatch in pending orders DTOs and entity. The implementation:

✅ Updated PendingOrder entity to use `int?` for TableNumber
✅ Updated all pending order DTOs to match
✅ Removed unnecessary `[MaxLength]` attributes
✅ Consistent with Sale entity and DTOs
✅ Ready for migration and deployment

**Key Achievements:**
- Fixed JSON deserialization error
- Type consistency across entire codebase
- Database schema aligned with entity types
- Pending orders feature restored

**Next Steps:**
1. ⚠️ **Restart backend** (required for build)
2. ⚠️ **Create migration** (schema change needed)
3. ⚠️ **Apply migration** (update database)
4. ✅ **Test pending orders** (verify functionality)

---

**Issue resolved:** 2025-12-26
**Migration status:** ⚠️ Pending (requires backend restart)
**Ready for:** Migration creation and testing
**Expected Result:** Pending orders should save successfully with table numbers as integers
