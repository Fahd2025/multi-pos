# API Authentication Fix - December 24, 2024

## Issue Summary
Customer and table API endpoints were failing with "Failed to load customers" and "Failed to load tables" errors in the accordion sections of TransactionDialogV2.

## Root Cause
The components were using direct `fetch()` API calls instead of the service classes that properly handle authentication. Direct `fetch()` calls don't include the JWT Bearer token required for authenticated endpoints.

## Solution
Replaced all direct `fetch()` calls with service class methods that use the configured axios instance with authentication interceptors.

## Files Modified

### 1. **TransactionDialogV2.tsx**
**Location**: `frontend/components/pos-v2/TransactionDialogV2.tsx`

**Changes**:
- Added imports:
  ```typescript
  import customerService from "@/services/customer.service";
  import tableService from "@/services/table.service";
  ```

- Replaced `loadRecentCustomers()`:
  ```typescript
  // Before
  const response = await fetch("/api/v1/customers?page=1&pageSize=10");
  const result = await response.json();

  // After
  const result = await customerService.getCustomers({ page: 1, pageSize: 10 });
  ```

- Replaced `searchCustomers()`:
  ```typescript
  // Before
  const response = await fetch(`/api/v1/customers?search=${encodeURIComponent(query)}&page=1&pageSize=20`);

  // After
  const result = await customerService.getCustomers({ search: query, page: 1, pageSize: 20 });
  ```

- Replaced `loadTables()`:
  ```typescript
  // Before
  const response = await fetch("/api/v1/tables/status");

  // After
  const result = await tableService.getTablesWithStatus();
  ```

- Fixed `handleSelectCustomer()` to map CustomerDto properties:
  ```typescript
  name: selectedCustomer.nameEn || selectedCustomer.name || "",
  address: selectedCustomer.addressEn || selectedCustomer.address || "",
  ```

- Updated search result rendering to use `result.nameEn` and `result.addressEn`

### 2. **CustomerSearchDialog.tsx**
**Location**: `frontend/components/pos-v2/CustomerSearchDialog.tsx`

**Changes**:
- Added imports:
  ```typescript
  import customerService from "@/services/customer.service";
  import { CustomerDto } from "@/types/api.types";
  ```

- Removed local `Customer` interface, now using `CustomerDto` from api.types
- Updated state: `useState<CustomerDto[]>([])`
- Updated props: `onSelectCustomer: (customer: CustomerDto) => void`
- Replaced fetch calls with service methods
- Updated rendering to use `customer.nameEn` and `customer.addressEn`

### 3. **TableSelectorDialog.tsx**
**Location**: `frontend/components/pos-v2/TableSelectorDialog.tsx`

**Changes**:
- Added import:
  ```typescript
  import tableService from "@/services/table.service";
  ```

- Replaced `loadTables()`:
  ```typescript
  // Before
  const response = await fetch("/api/v1/tables/status");

  // After
  const result = await tableService.getTablesWithStatus();
  ```

## Technical Details

### Authentication Flow
The service classes use a configured axios instance (`services/api.ts`) with request interceptors:

```typescript
// Request interceptor adds auth token
api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
```

### CustomerDto Type Mapping
Backend `CustomerDto` uses bilingual properties:
- `nameEn` / `nameAr` instead of `name`
- `addressEn` / `addressAr` instead of `address`

Components now correctly map these properties when displaying or storing customer data.

## Testing

### Build Status
✅ **Build Successful** - No TypeScript errors
```
✓ Compiled successfully in 4.7s
✓ Generating static pages using 15 workers (4/4) in 605.1ms
```

### Expected Behavior
1. **Customer Search**: Should now load recent customers and search results with proper authentication
2. **Table Selection**: Should now load table status with proper authentication
3. **Accordion Functionality**: All accordion sections remain functional with proper data loading

## API Endpoints Fixed

### Customer Endpoints
- `GET /api/v1/customers?page=1&pageSize=10` - Load recent customers
- `GET /api/v1/customers?search={query}&page=1&pageSize=20` - Search customers

### Table Endpoints
- `GET /api/v1/tables/status` - Load tables with status

All endpoints now receive proper `Authorization: Bearer {token}` headers.

## Next Steps

1. **Test in Browser**: Verify that customer and table data loads correctly in the UI
2. **Check Network Tab**: Confirm Authorization headers are being sent
3. **Monitor Backend Logs**: Ensure requests are being authenticated successfully
4. **Error Handling**: Verify that 401 errors trigger proper token refresh or login redirect

## Related Documentation
- [Accordion Implementation Complete](../ACCORDION_IMPLEMENTATION_COMPLETE.md)
- [Accordion Example](../ACCORDION_EXAMPLE.md)
- Backend API Documentation: `Backend/Program.cs` lines 200-300 (customer/table endpoints)
