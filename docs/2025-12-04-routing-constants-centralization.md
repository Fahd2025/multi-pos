# Routing Constants Centralization

**Date:** 2025-12-04
**Status:** Completed - Constants files created with refactoring examples

## Overview

This document describes the centralization of all hard-coded routing paths (both API routes and page routes) into dedicated constants files. This improves maintainability, reduces errors, and makes routing changes easier to manage across the entire application.

## Summary of Changes

### 1. Backend API Routes Constants

**File:** `Backend/Constants/ApiRoutes.cs`

A new constants file has been created containing all backend API route definitions organized by feature area. The structure uses nested static classes for organization:

```csharp
namespace Backend.Constants;

public static class ApiRoutes
{
    public const string ApiBase = "/api/v1";

    public static class Auth
    {
        public const string Group = $"{ApiBase}/auth";
        public const string Login = "/login";
        public const string Logout = "/logout";
        public const string Refresh = "/refresh";
        public const string Me = "/me";
    }

    public static class Sales { /* ... */ }
    public static class Products { /* ... */ }
    // ... and more
}
```

**Features covered:**

- Health check routes
- Authentication routes
- Sales routes
- Product & Category routes
- Customer routes
- Supplier routes
- Purchase routes
- Expense routes
- Branch routes
- User routes
- Sync routes
- Image routes
- Report routes
- Audit log routes

### 2. Frontend API Routes Constants

**File:** `frontend/lib/constants.ts`

The existing constants file has been **updated** with additional API routes:

**Added routes:**

- `API_ROUTES.BRANCHES.LOOKUP` - For branch lookup dropdown
- `API_ROUTES.IMAGES.UPLOAD_MULTIPLE` - For multi-image upload
- `API_ROUTES.IMAGES.UPDATE_PRODUCT` - For updating product images
- `API_ROUTES.IMAGES.DELETE` - With proper parameters (branchName, entityType, entityId)
- `API_ROUTES.USERS.REMOVE_BRANCH_ASSIGNMENT` - For removing branch assignments

**Structure:**

```typescript
export const API_ROUTES = {
  AUTH: {
    LOGIN: `/api/${API_VERSION}/auth/login`,
    LOGOUT: `/api/${API_VERSION}/auth/logout`,
    REFRESH: `/api/${API_VERSION}/auth/refresh`,
    ME: `/api/${API_VERSION}/auth/me`,
  },
  SALES: {
    BASE: `/api/${API_VERSION}/sales`,
    BY_ID: (id: string) => `/api/${API_VERSION}/sales/${id}`,
    VOID: (id: string) => `/api/${API_VERSION}/sales/${id}/void`,
    INVOICE: (id: string) => `/api/${API_VERSION}/sales/${id}/invoice`,
    STATS: `/api/${API_VERSION}/sales/stats`,
  },
  // ... more routes
};
```

### 3. Frontend Page Routes Constants

**File:** `frontend/lib/routes.ts` _(NEW)_

A comprehensive new file containing all frontend page routes with helper functions:

**Main route groups:**

```typescript
// Authentication routes
export const AUTH_ROUTES = {
  LOGIN: (locale: string) => `/${locale}/login`,
  LOGOUT: (locale: string) => `/${locale}/logout`,
};

// Head Office routes
export const HEAD_OFFICE_ROUTES = {
  DASHBOARD: (locale: string) => `/${locale}/head-office`,
  BRANCHES: (locale: string) => `/${locale}/head-office/branches`,
  BRANCH_DETAIL: (locale: string, id: string) =>
    `/${locale}/head-office/branches/${id}`,
  USERS: (locale: string) => `/${locale}/head-office/users`,
  USER_DETAIL: (locale: string, id: string) =>
    `/${locale}/head-office/users/${id}`,
  ANALYTICS: (locale: string) => `/${locale}/head-office/analytics`,
  AUDIT_LOGS: (locale: string) => `/${locale}/head-office/audit-logs`,
};

// Branch routes
export const BRANCH_ROUTES = {
  DASHBOARD: (locale: string) => `/${locale}/branch`,
  SALES: (locale: string) => `/${locale}/branch/sales`,
  SALE_DETAIL: (locale: string, id: string) => `/${locale}/branch/sales/${id}`,
  POS: (locale: string) => `/${locale}/branch/sales/pos`,
  POS2: (locale: string) => `/${locale}/branch/sales/pos`,
  INVENTORY: (locale: string) => `/${locale}/branch/inventory`,
  CATEGORIES: (locale: string) => `/${locale}/branch/inventory/categories`,
  CUSTOMERS: (locale: string) => `/${locale}/branch/customers`,
  CUSTOMER_DETAIL: (locale: string, id: string) =>
    `/${locale}/branch/customers/${id}`,
  SUPPLIERS: (locale: string) => `/${locale}/branch/suppliers`,
  SUPPLIER_DETAIL: (locale: string, id: string) =>
    `/${locale}/branch/suppliers/${id}`,
  PURCHASES: (locale: string) => `/${locale}/branch/purchases`,
  EXPENSES: (locale: string) => `/${locale}/branch/expenses`,
  EXPENSE_CATEGORIES: (locale: string) =>
    `/${locale}/branch/expense-categories`,
  REPORTS: (locale: string) => `/${locale}/branch/reports`,
  SETTINGS: (locale: string) => `/${locale}/branch/settings`,
  SETTINGS_USERS: (locale: string) => `/${locale}/branch/settings/users`,
};
```

**Helper functions:**

```typescript
// Generate localized route
export const localizeRoute = (locale: string, path: string): string => {
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  return `/${locale}/${cleanPath}`;
};

// Get base path for a route type
export const getBasePath = (locale: string, type: "head-office" | "branch") => {
  return type === "head-office"
    ? HEAD_OFFICE_ROUTES.DASHBOARD(locale)
    : BRANCH_ROUTES.DASHBOARD(locale);
};

// Get navigation items with proper routes
export const getBranchNavigation = (locale: string) => [
  { name: "Dashboard", href: BRANCH_ROUTES.DASHBOARD(locale), icon: "📊" },
  { name: "POS", href: BRANCH_ROUTES.POS(locale), icon: "🛒" },
  // ... more items
];

export const getHeadOfficeNavigation = (locale: string) => [
  { name: "Dashboard", href: HEAD_OFFICE_ROUTES.DASHBOARD(locale), icon: "📊" },
  { name: "Branches", href: HEAD_OFFICE_ROUTES.BRANCHES(locale), icon: "🏢" },
  // ... more items
];
```

## Refactoring Examples

### Backend Endpoint Refactoring

**Before:**

```csharp
namespace Backend.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
            .WithName("HealthCheck")
            .WithOpenApi();

        return app;
    }
}
```

**After:**

```csharp
using Backend.Constants;

namespace Backend.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet(ApiRoutes.Health.Base, () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
            .WithName("HealthCheck")
            .WithOpenApi();

        return app;
    }
}
```

**For grouped endpoints (Auth, Sales, etc.):**

**Before:**

```csharp
public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
{
    var authGroup = app.MapGroup("/api/v1/auth").WithTags("Authentication");

    authGroup.MapPost("/login", async (...) => { /* ... */ });
    authGroup.MapPost("/logout", async (...) => { /* ... */ });
    authGroup.MapPost("/refresh", async (...) => { /* ... */ });
    authGroup.MapGet("/me", async (...) => { /* ... */ });
}
```

**After:**

```csharp
using Backend.Constants;

public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
{
    var authGroup = app.MapGroup(ApiRoutes.Auth.Group).WithTags("Authentication");

    authGroup.MapPost(ApiRoutes.Auth.Login, async (...) => { /* ... */ });
    authGroup.MapPost(ApiRoutes.Auth.Logout, async (...) => { /* ... */ });
    authGroup.MapPost(ApiRoutes.Auth.Refresh, async (...) => { /* ... */ });
    authGroup.MapGet(ApiRoutes.Auth.Me, async (...) => { /* ... */ });
}
```

### Frontend Service Refactoring

**Sales Service - Before:**

```typescript
class SalesService {
  private basePath = "/api/v1/sales";

  async createSale(saleData: CreateSaleDto): Promise<SaleDto> {
    const response = await api.post<ApiResponse<SaleDto>>(
      this.basePath,
      saleData
    );
    return response.data.data!;
  }

  async getSaleById(id: string): Promise<SaleDto> {
    const response = await api.get<ApiResponse<SaleDto>>(
      `${this.basePath}/${id}`
    );
    return response.data.data!;
  }

  async voidSale(id: string, voidData: VoidSaleDto): Promise<SaleDto> {
    const response = await api.post<ApiResponse<SaleDto>>(
      `${this.basePath}/${id}/void`,
      voidData
    );
    return response.data.data!;
  }
}
```

**Sales Service - After:**

```typescript
import { API_ROUTES } from "@/lib/constants";

class SalesService {
  async createSale(saleData: CreateSaleDto): Promise<SaleDto> {
    const response = await api.post<ApiResponse<SaleDto>>(
      API_ROUTES.SALES.BASE,
      saleData
    );
    return response.data.data!;
  }

  async getSaleById(id: string): Promise<SaleDto> {
    const response = await api.get<ApiResponse<SaleDto>>(
      API_ROUTES.SALES.BY_ID(id)
    );
    return response.data.data!;
  }

  async voidSale(id: string, voidData: VoidSaleDto): Promise<SaleDto> {
    const response = await api.post<ApiResponse<SaleDto>>(
      API_ROUTES.SALES.VOID(id),
      voidData
    );
    return response.data.data!;
  }
}
```

### Frontend Page/Component Refactoring

**Before:**

```tsx
import { useRouter } from "next/navigation";

function MyComponent({ locale }: { locale: string }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/${locale}/branch/sales`);
  };

  return (
    <div>
      <Link href={`/${locale}/branch/customers`}>Customers</Link>
      <Link href={`/${locale}/branch/inventory`}>Inventory</Link>
      <button onClick={handleClick}>Go to Sales</button>
    </div>
  );
}
```

**After:**

```tsx
import { useRouter } from "next/navigation";
import { BRANCH_ROUTES } from "@/lib/routes";

function MyComponent({ locale }: { locale: string }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(BRANCH_ROUTES.SALES(locale));
  };

  return (
    <div>
      <Link href={BRANCH_ROUTES.CUSTOMERS(locale)}>Customers</Link>
      <Link href={BRANCH_ROUTES.INVENTORY(locale)}>Inventory</Link>
      <button onClick={handleClick}>Go to Sales</button>
    </div>
  );
}
```

**Layout Navigation - Before:**

```tsx
export default function BranchLayout({ children, params }: Props) {
  const { locale } = use(params);

  const navigation = [
    { name: "Dashboard", href: `/${locale}/branch`, icon: "📊" },
    { name: "POS", href: `/${locale}/branch/sales/pos`, icon: "🛒" },
    { name: "Sales", href: `/${locale}/branch/sales`, icon: "💰" },
    { name: "Inventory", href: `/${locale}/branch/inventory`, icon: "📦" },
    // ... more items
  ];
}
```

**Layout Navigation - After:**

```tsx
import { getBranchNavigation } from "@/lib/routes";

export default function BranchLayout({ children, params }: Props) {
  const { locale } = use(params);
  const navigation = getBranchNavigation(locale);

  // navigation is now centrally managed
}
```

## Files Requiring Refactoring

### Backend Files (13 endpoint files)

All files in `Backend/Endpoints/`:

- ✅ `HealthEndpoints.cs` - **DONE** (Example)
- ✅ `AuthEndpoints.cs` - **DONE** (Example)
- `SalesEndpoints.cs` - Needs refactoring
- `InventoryEndpoints.cs` - Needs refactoring
- `CustomerEndpoints.cs` - Needs refactoring
- `SupplierEndpoints.cs` - Needs refactoring
- `ExpenseEndpoints.cs` - Needs refactoring
- `BranchEndpoints.cs` - Needs refactoring
- `UserEndpoints.cs` - Needs refactoring
- `SyncEndpoints.cs` - Needs refactoring
- `ImageEndpoints.cs` - Needs refactoring
- `ReportEndpoints.cs` - Needs refactoring
- `AuditEndpoints.cs` - Needs refactoring

### Frontend Service Files (11 service files)

All files in `frontend/services/`:

- ✅ `auth.service.ts` - **Already using constants**
- `sales.service.ts` - Needs refactoring (uses `basePath`)
- `inventory.service.ts` - Needs refactoring (hard-coded `/api/v1/products`, `/api/v1/categories`, etc.)
- `customer.service.ts` - Needs refactoring (hard-coded `/api/v1/customers`)
- `supplier.service.ts` - Needs refactoring (hard-coded `/api/v1/suppliers`)
- `expense.service.ts` - Needs refactoring (hard-coded `/api/v1/expenses`, `/api/v1/expense-categories`)
- `user.service.ts` - Needs refactoring (hard-coded `/api/v1/users`, `/api/v1/audit`)
- `branch.service.ts` - Needs refactoring (hard-coded `/api/v1/branches`)
- `image.service.ts` - Needs refactoring (hard-coded `/api/v1/images`)
- `report.service.ts` - Needs refactoring (hard-coded `/api/v1/reports`)

### Frontend Page/Component Files (50+ files)

Files with hard-coded page routes found in:

- `frontend/app/[locale]/branch/layout.tsx` - Navigation needs to use `getBranchNavigation()`
- `frontend/app/[locale]/head-office/layout.tsx` - Navigation needs to use `getHeadOfficeNavigation()`
- `frontend/hooks/useAuth.ts` - Router pushes need route constants
- All page files in `frontend/app/[locale]/branch/**/page.tsx`
- All page files in `frontend/app/[locale]/head-office/**/page.tsx`
- Component files with Link or router navigation in `frontend/components/`

**High-priority component files:**

- `frontend/components/branch/sales/SalesTable.tsx`
- `frontend/components/branch/customers/CustomerAnalyticsWidget.tsx`
- `frontend/components/branch/expenses/ExpenseAnalyticsWidget.tsx`
- Various modal and form components

## Benefits

1. **Single Source of Truth**: All routes defined in one place per layer (backend/frontend)
2. **Type Safety**: TypeScript route functions provide compile-time checks
3. **Easier Refactoring**: Change a route in one place, applies everywhere
4. **Reduced Errors**: No typos in hard-coded strings
5. **Better IDE Support**: Autocomplete for route constants
6. **Documentation**: Routes are self-documenting with JSDoc comments
7. **Locale Support**: Built-in locale parameter handling for frontend routes

## Migration Guide

### Backend Migration Steps

1. Add `using Backend.Constants;` to the endpoint file
2. Replace `app.MapGroup("/api/v1/resource")` with `app.MapGroup(ApiRoutes.Resource.Group)`
3. Replace route strings like `"/login"` with `ApiRoutes.Auth.Login`
4. Test the endpoint to ensure it still works

### Frontend Service Migration Steps

1. Import constants: `import { API_ROUTES } from '@/lib/constants';`
2. Replace hard-coded strings with constants:
   - `/api/v1/sales` → `API_ROUTES.SALES.BASE`
   - `/api/v1/sales/${id}` → `API_ROUTES.SALES.BY_ID(id)`
3. Remove `basePath` class properties (no longer needed)
4. Test API calls

### Frontend Page/Component Migration Steps

1. Import route constants: `import { BRANCH_ROUTES, HEAD_OFFICE_ROUTES } from '@/lib/routes';`
2. Replace hard-coded route strings with constants:
   - `\`/${locale}/branch/sales\``→`BRANCH_ROUTES.SALES(locale)`
   - `\`/${locale}/head-office/users/${id}\``→`HEAD_OFFICE_ROUTES.USER_DETAIL(locale, id)`
3. For navigation arrays, use helper functions: `getBranchNavigation(locale)` or `getHeadOfficeNavigation(locale)`
4. Test routing and navigation

## Testing Checklist

After refactoring, verify:

### Backend

- [ ] All endpoints are accessible at their original URLs
- [ ] Swagger documentation updates correctly
- [ ] No build errors
- [ ] Run `dotnet build` successfully

### Frontend

- [ ] All API calls work correctly
- [ ] All page navigations work
- [ ] All links work correctly
- [ ] No TypeScript errors
- [ ] Run `npm run build` successfully
- [ ] Test in both locales (en/ar)

## Next Steps

1. **Backend Refactoring**: Update all remaining endpoint files to use `ApiRoutes` constants
2. **Frontend Service Refactoring**: Update all service files to use `API_ROUTES` constants
3. **Frontend Page Refactoring**: Update all pages and components to use route constants from `routes.ts`
4. **Testing**: Comprehensive testing of all routes and navigation
5. **Code Review**: Review changes for consistency

## Notes

- The constants files are designed to be extensible - new routes can be easily added
- Route constants use functions for dynamic parameters (e.g., `BY_ID(id)`)
- Locale is always the first parameter for frontend page routes
- Backend uses `Group` property for `MapGroup()` calls to maintain clean separation

## Files Created

1. `Backend/Constants/ApiRoutes.cs` - Backend API route constants
2. `frontend/lib/routes.ts` - Frontend page route constants
3. `frontend/lib/constants.ts` - Updated with additional API routes

## Files Modified

1. `Backend/Endpoints/HealthEndpoints.cs` - Example refactoring
2. `Backend/Endpoints/AuthEndpoints.cs` - Example refactoring
3. `frontend/lib/constants.ts` - Added missing API routes
