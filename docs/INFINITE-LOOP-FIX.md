# Infinite Loop and Flash Bug Fixes

**Date:** 2025-12-07
**Issues Fixed:**
1. Infinite rendering loops causing browser crashes
2. Flash of "Access Denied" message on authorized pages

---

## Issue 1: Infinite Loop - `ERR_INSUFFICIENT_RESOURCES`

### Problem

Multiple pages were crashing with `ERR_INSUFFICIENT_RESOURCES` due to infinite rendering loops.

**Root Cause:** The `canManage()` function from `usePermission()` was included in `useEffect` dependency arrays:

```typescript
// ❌ BAD - Causes infinite loop
const { canManage } = usePermission();

useEffect(() => {
  if (canManage()) {
    loadData();
  }
}, [canManage]); // canManage is a new function on every render
```

Since `canManage` is a function that gets recreated on every render, it causes:
1. useEffect runs → loads data → updates state
2. State update → component re-renders
3. `canManage` is new function reference → useEffect triggers again
4. **Infinite loop** → browser crashes

### Solution

**Removed `canManage` from dependency arrays** in all affected pages:

```typescript
// ✅ GOOD - No infinite loop
useEffect(() => {
  loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Only run once on mount - RoleGuard handles permission
```

### Files Fixed (9 total)

| # | File | Location |
|---|------|----------|
| 1 | Users Page | `frontend/app/[locale]/branch/users/page.tsx` |
| 2 | Expenses Page | `frontend/app/[locale]/branch/expenses/page.tsx` |
| 3 | Suppliers Page | `frontend/app/[locale]/branch/suppliers/page.tsx` |
| 4 | Expense Categories | `frontend/app/[locale]/branch/expense-categories/page.tsx` |
| 5 | Inventory Page | `frontend/app/[locale]/branch/inventory/page.tsx` |
| 6 | Purchases Page | `frontend/app/[locale]/branch/purchases/page.tsx` |
| 7 | Settings Page | `frontend/app/[locale]/branch/settings/page.tsx` |
| 8 | Inventory Categories | `frontend/app/[locale]/branch/inventory/categories/page.tsx` |
| 9 | Supplier Detail | `frontend/app/[locale]/branch/suppliers/[id]/page.tsx` |

### Why This Works

All these pages already use the `<RoleGuard>` component which handles permission checks at the component level. There's no need to check `canManage()` again inside `useEffect`.

---

## Issue 2: Flash of "Access Denied" Message

### Problem

When logging in as an admin or manager, users briefly saw the "Access Denied" message (for ~1 second) before the page content appeared.

**Root Cause:** Race condition in `RoleGuard` component:

1. Page renders with `RoleGuard`
2. `RoleGuard` checks permissions **before** auth state finishes loading
3. Shows "Access Denied" fallback (because auth isn't ready yet)
4. Auth finishes loading
5. `RoleGuard` re-checks and shows correct content
6. **Result:** Flash of unauthorized message

### Original Code

```typescript
// ❌ BAD - Shows fallback during loading
export const RoleGuard: React.FC<RoleGuardProps> = ({
  /* ... */
  showLoading = false, // Default was false
}) => {
  const { isLoading, isAuthenticated, user } = useAuth();

  // Only shows loading if explicitly requested
  if (isLoading && showLoading) {
    return <LoadingIndicator />;
  }

  // This runs while loading, showing fallback prematurely
  if (!isAuthenticated || !user) {
    return <>{fallback}</>; // ⚠️ Shows "Access Denied" during loading
  }

  return <>{children}</>;
};
```

### Solution

**Updated `RoleGuard` to handle loading state properly:**

```typescript
// ✅ GOOD - Never shows fallback during loading
export const RoleGuard: React.FC<RoleGuardProps> = ({
  /* ... */
  showLoading = true,  // Changed default to true
  fullPage = false,    // New prop for full-page loading
}) => {
  const { isLoading, isAuthenticated, user } = useAuth();

  // Always handle loading state first
  if (isLoading) {
    if (showLoading) {
      // Full-page loading for page-level guards
      if (fullPage) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        );
      }
      // Inline loading for component-level guards
      return <div className="animate-pulse h-4 w-16 bg-gray-200 rounded"></div>;
    }
    // Don't show fallback while loading - prevents flash
    return null;
  }

  // Only show fallback after loading is complete
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
```

### Key Changes

1. **`showLoading` default changed to `true`** - Always show loading state by default
2. **New `fullPage` prop** - Better loading experience for page-level guards
3. **Return `null` during loading** - Never show fallback while auth is loading
4. **Loading check happens first** - Before any permission checks

### Usage

```typescript
// For full-page protection (like entire pages)
<RoleGuard
  requireRole={UserRole.Manager}
  fullPage={true}
  fallback={<AccessDenied />}
>
  <PageContent />
</RoleGuard>

// For inline protection (like buttons)
<RoleGuard requireRole={UserRole.Manager}>
  <button>Manager Only Action</button>
</RoleGuard>

// Disable loading indicator if needed
<RoleGuard
  requireRole={UserRole.Manager}
  showLoading={false}
>
  <Content />
</RoleGuard>
```

---

## Testing

### Before Fixes

- ❌ Pages crashed with `ERR_INSUFFICIENT_RESOURCES`
- ❌ "Access Denied" message flashed on authorized pages
- ❌ Poor user experience with loading states

### After Fixes

- ✅ All pages load without crashing
- ✅ No flash of "Access Denied" for authorized users
- ✅ Smooth loading experience with proper indicators
- ✅ Proper access denial for unauthorized users

---

## Files Modified

1. **`frontend/components/auth/RoleGuard.tsx`** - Fixed loading state handling
2. **9 page files** - Removed `canManage` from useEffect dependencies

---

## Best Practices Going Forward

### ✅ DO

```typescript
// Use RoleGuard for permission checks
<RoleGuard requireRole={UserRole.Manager}>
  <ProtectedContent />
</RoleGuard>

// Load data once on mount
useEffect(() => {
  loadData();
}, []);

// Use fullPage for page-level guards
<RoleGuard requireRole={UserRole.Manager} fullPage={true}>
  <PageContent />
</RoleGuard>
```

### ❌ DON'T

```typescript
// Don't put functions in dependency arrays
const { canManage } = usePermission();
useEffect(() => {
  loadData();
}, [canManage]); // ❌ Infinite loop!

// Don't check permissions inside useEffect
useEffect(() => {
  if (canManage()) { // ❌ Unnecessary
    loadData();
  }
}, []);

// Don't disable loading on page-level guards
<RoleGuard showLoading={false}> {/* ❌ May cause flash */}
  <PageContent />
</RoleGuard>
```

---

## Summary

Both issues stemmed from **improper handling of React lifecycle and async operations**:

1. **Infinite Loop:** Function references in dependency arrays
2. **Flash Bug:** Not handling async auth loading properly

The fixes ensure:
- **Stable dependencies** - Only include values that don't change on every render
- **Proper loading states** - Show loading indicators, not error states, during async operations
- **Better UX** - Smooth transitions without flashing error messages
