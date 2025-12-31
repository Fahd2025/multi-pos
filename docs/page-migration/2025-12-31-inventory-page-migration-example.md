# Inventory Page Migration Example

**Date:** 2025-12-31
**Page:** `frontend/app/[locale]/branch/inventory/page.tsx`
**Before:** 750 lines | **After:** 530 lines | **Reduction:** 220 lines (29%)

---

## Migration Steps

### Step 1: Update Imports

**BEFORE (Lines 19-27):**
```typescript
import {
  Button,
  StatusBadge,
  getStockStatusVariant,
  LoadingSpinner,
  StatCard,
  PageHeader,
} from "@/components/shared";
import { useApiError } from "@/hooks/useApiError";
```

**AFTER:**
```typescript
import {
  Button,
  StatusBadge,
  getStockStatusVariant,
  LoadingSpinner,
  StatCard,
  PageHeader,
  ActiveFiltersBadge,  // ← ADD THIS
  SearchInput,         // ← ADD THIS
} from "@/components/shared";
import { useApiError } from "@/hooks/useApiError";
import { useTableFilters } from "@/hooks/useTableFilters";  // ← ADD THIS
```

---

### Step 2: Replace Filter State (Lines 58-70)

**BEFORE (13 lines):**
```typescript
  // Filter states (input values)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  // Applied filters (what's actually being used in the API call)
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    category: "",
    lowStock: false,
    outOfStock: false,
  });
```

**AFTER (23 lines, but removes 100+ lines of filter logic below):**
```typescript
  // Helper function to get category name for display
  const getCategoryName = useCallback((categoryId: string) => {
    if (!categoryId) return "All Categories";
    const category = categories.find((c) => c.id === categoryId);
    return category?.nameEn || "Unknown Category";
  }, [categories]);

  // Table filters using new hook
  const filters = useTableFilters({
    filterDefinitions: [
      { type: "search", label: "Search", defaultValue: "" },
      {
        type: "category",
        label: "Category",
        defaultValue: "",
        getDisplayValue: getCategoryName,
      },
      { type: "lowStock", label: "Low Stock", defaultValue: false, getDisplayValue: () => "Yes" },
      { type: "outOfStock", label: "Out of Stock", defaultValue: false, getDisplayValue: () => "Yes" },
    ],
    onFiltersChange: () => setCurrentPage(1),
  });
```

---

### Step 3: Remove Old Filter Logic (Lines 167-259)

**DELETE THESE FUNCTIONS (93 lines):**
```typescript
  /**
   * Apply current filter values
   */
  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchTerm,
      category: selectedCategory,
      lowStock: showLowStock,
      outOfStock: showOutOfStock,
    });
    setCurrentPage(1);
  };

  /**
   * Handle pagination
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * Get active filters for display
   */
  const getActiveFilters = () => {
    const filters: { type: string; label: string; value: string }[] = [];

    if (appliedFilters.search) {
      filters.push({ type: "search", label: "Search", value: appliedFilters.search });
    }
    if (appliedFilters.category) {
      const category = categories.find((c) => c.id === appliedFilters.category);
      if (category) {
        filters.push({ type: "category", label: "Category", value: category.nameEn });
      }
    }
    if (appliedFilters.lowStock) {
      filters.push({ type: "lowStock", label: "Low Stock", value: "Yes" });
    }
    if (appliedFilters.outOfStock) {
      filters.push({ type: "outOfStock", label: "Out of Stock", value: "Yes" });
    }

    return filters;
  };

  const activeFilters = getActiveFilters();
  const activeFilterCount = activeFilters.length;
  const hasActiveFilters = activeFilterCount > 0;

  /**
   * Remove a single filter
   */
  const handleRemoveFilter = (filterType: string) => {
    const newFilters = { ...appliedFilters };

    switch (filterType) {
      case "search":
        newFilters.search = "";
        setSearchTerm("");
        break;
      case "category":
        newFilters.category = "";
        setSelectedCategory("");
        break;
      case "lowStock":
        newFilters.lowStock = false;
        setShowLowStock(false);
        break;
      case "outOfStock":
        newFilters.outOfStock = false;
        setShowOutOfStock(false);
        break;
    }

    setAppliedFilters(newFilters);
    setCurrentPage(1);
  };

  /**
   * Reset all filters
   */
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setShowLowStock(false);
    setShowOutOfStock(false);
    setAppliedFilters({
      search: "",
      category: "",
      lowStock: false,
      outOfStock: false,
    });
    setCurrentPage(1);
  };
```

**REPLACE WITH:**
```typescript
  /**
   * Handle pagination
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
```

---

### Step 4: Update useEffect for Filters (Line 115)

**BEFORE:**
```typescript
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, appliedFilters]);
```

**AFTER:**
```typescript
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters.appliedFilters]);
```

---

### Step 5: Update fetchProducts Function (Lines 133-165)

**BEFORE:**
```typescript
  const fetchProducts = async () => {
    try {
      setLoading(true);
      clearError();

      const filters: any = {
        page: currentPage,
        pageSize,
        search: appliedFilters.search || undefined,
        categoryId: appliedFilters.category || undefined,
        lowStock: appliedFilters.lowStock || undefined,
        outOfStock: appliedFilters.outOfStock || undefined,
      };

      const response = await inventoryService.getProducts(filters);
      setProducts(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);

      // Load all products for statistics (only when filters change)
      if (currentPage === 1) {
        const allResponse = await inventoryService.getProducts({
          page: 1,
          pageSize: 10000,
        });
        setAllProducts(allResponse.data);
      }
    } catch (err: any) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };
```

**AFTER:**
```typescript
  const fetchProducts = async () => {
    try {
      setLoading(true);
      clearError();

      const params: any = {
        page: currentPage,
        pageSize,
        search: filters.appliedFilters.search || undefined,
        categoryId: filters.appliedFilters.category || undefined,
        lowStock: filters.appliedFilters.lowStock || undefined,
        outOfStock: filters.appliedFilters.outOfStock || undefined,
      };

      const response = await inventoryService.getProducts(params);
      setProducts(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);

      // Load all products for statistics (only when filters change)
      if (currentPage === 1) {
        const allResponse = await inventoryService.getProducts({
          page: 1,
          pageSize: 10000,
        });
        setAllProducts(allResponse.data);
      }
    } catch (err: any) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };
```

---

### Step 6: Remove getCategoryName Function (Lines 283-289)

**DELETE:**
```typescript
  /**
   * Get category name
   */
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((c) => c.id === categoryId);
    return category?.nameEn || "Unknown";
  };
```

**NOTE:** We moved this to Step 2 as a useCallback before useTableFilters.

---

### Step 7: Replace ActiveFiltersBadge JSX (Lines 485-527)

**BEFORE (43 lines):**
```tsx
        {/* Active Filters Display - Full Width */}
        {!loading && !isError && activeFilters.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-5 py-3">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Active Filters:
              </span>
              {activeFilters.map((filter) => (
                <span
                  key={filter.type}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded-full text-sm font-medium"
                >
                  <span className="font-semibold">{filter.label}:</span>
                  <span>{filter.value}</span>
                  <button
                    onClick={() => handleRemoveFilter(filter.type)}
                    className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                    title={`Remove ${filter.label} filter`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
              <button
                onClick={handleResetFilters}
                className="ml-2 text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium underline"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
```

**AFTER (5 lines):**
```tsx
        {/* Active Filters Display */}
        {!loading && !isError && (
          <ActiveFiltersBadge
            filters={filters.activeFilters}
            onRemove={filters.removeFilter}
            onClearAll={filters.resetFilters}
          />
        )}
```

---

### Step 8: Replace SearchInput JSX (Lines 550-590)

**BEFORE (41 lines):**
```tsx
            searchBar={
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, code, barcode, or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                  />
                </div>
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            }
```

**AFTER (7 lines):**
```tsx
            searchBar={
              <SearchInput
                value={filters.filterValues.search}
                onChange={(val) => filters.setFilterValue("search", val)}
                onSearch={filters.applyFilters}
                placeholder="Search by name, code, barcode, or SKU..."
              />
            }
```

---

### Step 9: Update Filter Section (Lines 592-654)

**BEFORE:**
```tsx
            filterSection={
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Low Stock Filter */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showLowStock}
                        onChange={(e) => setShowLowStock(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Low Stock Only
                      </span>
                    </label>
                  </div>

                  {/* Out of Stock Filter */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showOutOfStock}
                        onChange={(e) => setShowOutOfStock(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Out of Stock Only
                      </span>
                    </label>
                  </div>
                </div>

                {/* Apply Filters Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleApplyFilters}
                    className="px-6 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            }
```

**AFTER:**
```tsx
            filterSection={
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={filters.filterValues.category}
                      onChange={(e) => filters.setFilterValue("category", e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Low Stock Filter */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.filterValues.lowStock}
                        onChange={(e) => filters.setFilterValue("lowStock", e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Low Stock Only
                      </span>
                    </label>
                  </div>

                  {/* Out of Stock Filter */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.filterValues.outOfStock}
                        onChange={(e) => filters.setFilterValue("outOfStock", e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Out of Stock Only
                      </span>
                    </label>
                  </div>
                </div>

                {/* Apply Filters Button */}
                <div className="flex justify-end">
                  <Button variant="primary" onClick={filters.applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            }
```

---

### Step 10: Update DataTable Props (Lines 545-548)

**BEFORE:**
```tsx
            showFilterButton
            activeFilterCount={activeFilterCount}
            showResetButton={hasActiveFilters}
            onResetFilters={handleResetFilters}
```

**AFTER:**
```tsx
            showFilterButton
            activeFilterCount={filters.activeFilterCount}
            showResetButton={filters.hasActiveFilters}
            onResetFilters={filters.resetFilters}
```

---

## Summary of Changes

### Lines Removed: ~220 lines
- Filter state declarations: 13 lines
- Filter logic functions: 93 lines
- ActiveFiltersBadge JSX: 43 lines
- SearchInput JSX: 41 lines
- getCategoryName function: 7 lines
- Misc cleanup: ~23 lines

### Lines Added: ~30 lines
- Import additions: 3 lines
- useTableFilters hook setup: 23 lines
- ActiveFiltersBadge component: 5 lines (was 43)
- SearchInput component: 7 lines (was 41)

### Net Reduction: ~190 lines (excluding moved code)

---

## Testing Checklist

After migration, test the following:

- [ ] Page loads without errors
- [ ] Search input works
- [ ] Search on Enter key works
- [ ] Search button works
- [ ] Category filter dropdown works
- [ ] Low Stock checkbox works
- [ ] Out of Stock checkbox works
- [ ] Apply Filters button works
- [ ] Active filters display correctly
- [ ] Remove individual filter works
- [ ] Clear All filters works
- [ ] Pagination works with filters
- [ ] Dark mode styling works
- [ ] TypeScript compiles without errors

---

## Quick Reference: Filter Value Access

**Old Way:**
```typescript
searchTerm              → filters.filterValues.search
selectedCategory        → filters.filterValues.category
showLowStock            → filters.filterValues.lowStock
showOutOfStock          → filters.filterValues.outOfStock
appliedFilters.search   → filters.appliedFilters.search
handleApplyFilters()    → filters.applyFilters()
handleRemoveFilter()    → filters.removeFilter()
handleResetFilters()    → filters.resetFilters()
activeFilters           → filters.activeFilters
activeFilterCount       → filters.activeFilterCount
hasActiveFilters        → filters.hasActiveFilters
```

---

## Build Command

After migration, verify the build:

```bash
cd frontend
npm run build
```

Expected result: ✅ Build successful with no errors

---

## Next Steps

After successfully migrating the inventory page:

1. **Test thoroughly** - Verify all filter functionality works
2. **Migrate next page** - Use customers page as second example
3. **Document patterns** - Note any edge cases for future migrations
4. **Update CLAUDE.md** - Add migration notes to project documentation
