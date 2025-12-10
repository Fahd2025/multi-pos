# Role-Based UI Hiding Implementation

**Date**: 2025-11-26
**Task**: T239 - Add role-based UI hiding (hide features not accessible to current user role)
**Phase**: Phase 8 - User Management & Access Control

## Overview

Implemented comprehensive role-based UI hiding to ensure users only see features they're authorized to access. This includes navigation filtering, conditional component rendering, and imperative permission checks.

## User Roles

The system supports the following roles:

```typescript
enum UserRole {
  Cashier = 0, // Basic sales operations
  Manager = 1, // Branch management
  Admin = 2, // Branch admin (same as Manager in most contexts)
}
```

Additionally, there's a special flag `isHeadOfficeAdmin` for head office administrators who have full system access.

## Components Created

### 1. RoleGuard Component

Location: `frontend/components/auth/RoleGuard.tsx`

A declarative component for conditional rendering based on user roles:

```tsx
import { RoleGuard } from '@/components/auth/RoleGuard';
import { UserRole } from '@/types/enums';

// Only show to head office admins
<RoleGuard requireHeadOfficeAdmin>
  <button>Manage Branches</button>
</RoleGuard>

// Only show to managers and above
<RoleGuard requireRole={UserRole.Manager}>
  <button>View Reports</button>
</RoleGuard>

// Show fallback for unauthorized users
<RoleGuard
  requireRole={UserRole.Manager}
  fallback={<p>Manager access required</p>}
>
  <SensitiveContent />
</RoleGuard>

// Custom permission check
<RoleGuard
  requirePermission={(user, branch) => user.email.endsWith('@branch.com')}
>
  <InternalFeature />
</RoleGuard>
```

**Props:**

- `requireHeadOfficeAdmin?: boolean` - Require head office admin role
- `requireRole?: UserRole` - Require specific role level (or higher)
- `requirePermission?: (user, branch) => boolean` - Custom check function
- `fallback?: React.ReactNode` - Content to show if permission denied
- `showLoading?: boolean` - Show loading state while checking auth

### 2. usePermission Hook

Location: `frontend/components/auth/RoleGuard.tsx`

An imperative hook for permission checks in component logic:

```tsx
import { usePermission } from "@/components/auth/RoleGuard";

function MyComponent() {
  const {
    isHeadOfficeAdmin,
    canManage,
    canVoidSales,
    canApproveExpenses,
    canManageInventory,
    canViewReports,
    canViewAuditLogs,
  } = usePermission();

  const handleDelete = () => {
    if (!canManage()) {
      alert("Manager access required");
      return;
    }
    // Proceed with deletion
  };

  return <div>{canViewReports() && <ReportsButton />}</div>;
}
```

**Available Permission Checks:**

- `isHeadOfficeAdmin()` - Check if user is head office admin
- `hasRole(role: UserRole)` - Check if user has specific role or higher
- `canAccessHeadOffice()` - Can access head office features
- `canManage()` - Can manage branch (Manager or Admin)
- `canVoidSales()` - Can void sales transactions
- `canApproveExpenses()` - Can approve expenses
- `canManageInventory()` - Can manage inventory
- `canManageUsers()` - Can manage users (head office only)
- `canViewReports()` - Can view reports
- `canViewAuditLogs()` - Can view audit logs (head office only)

### 3. Updated useAuth Hook

Location: `frontend/hooks/useAuth.ts`

The existing useAuth hook was already complete with:

- `isHeadOfficeAdmin()` - Returns true if user is head office admin
- `hasRole(role: number)` - Returns true if user has role or higher

## Implementation Details

### Navigation Filtering

#### Head Office Layout

File: `frontend/app/[locale]/head-office/layout.tsx`

- Added "Audit Logs" to navigation menu
- Layout already has role check preventing non-admins from accessing

```tsx
const navigation = [
  { name: "Dashboard", href: `/${locale}/head-office`, icon: "📊" },
  { name: "Branches", href: `/${locale}/head-office/branches`, icon: "🏢" },
  { name: "Users", href: `/${locale}/head-office/users`, icon: "👥" },
  { name: "Audit Logs", href: `/${locale}/head-office/audit-logs`, icon: "📋" },
  { name: "Analytics", href: `/${locale}/head-office/analytics`, icon: "📈" },
  { name: "Settings", href: `/${locale}/head-office/settings`, icon: "⚙️" },
];

// Access check
if (user && !user.isHeadOfficeAdmin) {
  return <AccessDeniedMessage />;
}
```

#### Branch Layout

File: `frontend/app/[locale]/branch/layout.tsx`

- Navigation items are filtered based on user role
- Cashiers see: Dashboard, Sales, Customers
- Managers see: All items including Inventory, Purchases, Expenses, Reports, Settings

```tsx
const allNavigationItems = [
  {
    name: "Dashboard",
    href: `/${locale}/branch`,
    icon: "📊",
    requiresRole: false,
  },
  {
    name: "Sales",
    href: `/${locale}/branch/sales`,
    icon: "💳",
    requiresRole: false,
  },
  {
    name: "Inventory",
    href: `/${locale}/branch/inventory`,
    icon: "📦",
    requiresManager: true,
  },
  {
    name: "Purchases",
    href: `/${locale}/branch/purchases`,
    icon: "🛒",
    requiresManager: true,
  },
  {
    name: "Expenses",
    href: `/${locale}/branch/expenses`,
    icon: "💰",
    requiresManager: true,
  },
  {
    name: "Customers",
    href: `/${locale}/branch/customers`,
    icon: "👥",
    requiresRole: false,
  },
  {
    name: "Reports",
    href: `/${locale}/branch/reports`,
    icon: "📈",
    requiresManager: true,
  },
  {
    name: "Settings",
    href: `/${locale}/branch/settings`,
    icon: "⚙️",
    requiresManager: true,
  },
];

// Filter based on role
const navigation = allNavigationItems.filter((item) => {
  if (item.requiresManager) {
    return canManage();
  }
  return true;
});
```

## Usage Examples

### Example 1: Hiding Action Buttons

```tsx
import { RoleGuard } from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/enums";

function ProductList() {
  return (
    <div>
      {/* Everyone can view products */}
      <ProductTable />

      {/* Only managers can add/edit/delete */}
      <RoleGuard requireRole={UserRole.Manager}>
        <button onClick={handleAddProduct}>Add Product</button>
        <button onClick={handleEditProduct}>Edit Product</button>
        <button onClick={handleDeleteProduct}>Delete Product</button>
      </RoleGuard>
    </div>
  );
}
```

### Example 2: Conditional Features in Sales

```tsx
import { usePermission } from "@/components/auth/RoleGuard";

function SalesPage() {
  const { canVoidSales } = usePermission();

  return (
    <div>
      <SalesList />

      {/* Only managers can void sales */}
      {canVoidSales() && <button onClick={handleVoidSale}>Void Sale</button>}
    </div>
  );
}
```

### Example 3: Imperative Permission Check

```tsx
import { usePermission } from "@/components/auth/RoleGuard";

function ExpenseForm() {
  const { canApproveExpenses } = usePermission();

  const handleSubmit = async (data) => {
    // Save expense
    await saveExpense(data);

    // Auto-approve if user has permission
    if (canApproveExpenses()) {
      await approveExpense(data.id);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Example 4: Higher-Order Component

```tsx
import { withRoleGuard } from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/enums";

// Wrap entire component
const ManagerOnlySettings = withRoleGuard(SettingsPage, {
  requireRole: UserRole.Manager,
});

// Use in routing or parent component
function App() {
  return <ManagerOnlySettings />;
}
```

## Testing Role-Based UI

### Test Scenarios

1. **Cashier User** (role = 0):

   - ✅ Can access: Dashboard, Sales, Customers
   - ❌ Cannot access: Inventory, Purchases, Expenses, Reports, Settings
   - ❌ Cannot void sales
   - ❌ Cannot manage products

2. **Manager User** (role >= 1):

   - ✅ Can access: All branch features
   - ✅ Can void sales
   - ✅ Can approve expenses
   - ✅ Can manage inventory
   - ✅ Can view reports

3. **Head Office Admin**:
   - ✅ Can access: All head office features
   - ✅ Can access: All branch features (when in branch context)
   - ✅ Can manage branches, users, view audit logs

### Manual Testing Steps

1. Login as Cashier:

   ```
   Branch: branch01
   Username: cashier1
   Password: [password]
   ```

   - Verify limited navigation menu
   - Verify no "Delete" or "Void" buttons on sales
   - Verify cannot access /branch/inventory directly

2. Login as Manager:

   ```
   Branch: branch01
   Username: manager1
   Password: [password]
   ```

   - Verify full branch navigation menu
   - Verify "Void Sale" button appears
   - Verify can access all branch pages

3. Login as Head Office Admin:
   ```
   Branch: all
   Username: admin
   Password: 123
   ```
   - Verify can access /head-office routes
   - Verify "Audit Logs" in navigation
   - Verify can manage users and branches

## Performance Considerations

- Permission checks are memoized in hooks
- Navigation filtering happens once per render
- No unnecessary re-renders when permissions don't change
- Uses React context for auth state (via useAuth)

## Security Notes

⚠️ **Important**: UI hiding is NOT a security measure. It only improves UX by hiding features users can't access. All sensitive operations MUST be protected at the API level with proper authorization checks.

The backend already implements role-based authorization:

- JWT tokens include user role and branch context
- Endpoints validate permissions before executing
- Audit logs track all access attempts

## Files Modified

1. **Created:**

   - `frontend/components/auth/RoleGuard.tsx` - Main role guard component and hook

2. **Updated:**

   - `frontend/app/[locale]/head-office/layout.tsx` - Added Audit Logs to navigation
   - `frontend/app/[locale]/branch/layout.tsx` - Added role-based navigation filtering

3. **Existing (No changes needed):**
   - `frontend/hooks/useAuth.ts` - Already had role checking capabilities
   - `frontend/types/enums.ts` - Already defined UserRole enum

## Future Enhancements

Potential improvements for future iterations:

1. **Permission-based routing**: Prevent direct URL access to unauthorized pages
2. **Dynamic permissions**: Load permissions from backend instead of hardcoding
3. **Fine-grained permissions**: Support feature-level permissions (e.g., "can_export_reports")
4. **Permission caching**: Cache permission checks for better performance
5. **Permission inheritance**: Support hierarchical permission structures
6. **Audit permission checks**: Log when users attempt unauthorized access

## Related Documentation

- [Phase 8 Implementation](./2025-11-26-phase-8-audit-ui.md)
- [User Management API](../specs/001-multi-branch-pos/contracts/users.md)
- [Authentication Flow](../specs/001-multi-branch-pos/contracts/auth.md)
- [Tasks List](../specs/001-multi-branch-pos/tasks.md)
