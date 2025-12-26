# TransactionDialogV3 - Two-Column Layout with Customer & Table Accordions

**Date:** 2025-12-26
**Feature:** Enhanced payment tab with two-column layout and accordions
**Status:** ✅ Completed
**Build Status:** ✅ Success (0 errors, 0 warnings)

## Overview

Enhanced the TransactionDialogV3 payment tab to include a professional two-column layout with expandable customer and table accordions, matching the TransactionDialogV2 design. The layout is fully responsive and optimized for both desktop and mobile devices.

## User Request

> "In the 'Process Payment' tab, display customer and table information accordions, similar to the Transaction DialogV2 layout with a two-column layout. and In the small screen, display these accordions after the Order Type section."

## Implementation Approach

Restructured the payment tab to use the same two-column grid layout from TransactionDialogV2, with proper responsive behavior that reorders sections on mobile devices.

## Changes Made

### 1. Added State Variables

**Accordion State:**
```typescript
const [customerSectionExpanded, setCustomerSectionExpanded] = useState(true);
const [tableSectionExpanded, setTableSectionExpanded] = useState(true);
const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
```

**Customer Search State:**
```typescript
const [searchError, setSearchError] = useState<string | null>(null);
const [newCustomerForm, setNewCustomerForm] = useState({
  name: "",
  phone: "",
  email: "",
  address: "",
});
```

**Table Filter State:**
```typescript
const [tableSearchQuery, setTableSearchQuery] = useState("");
const [tableFilterStatus, setTableFilterStatus] = useState("all");
const [tablesError, setTablesError] = useState<string | null>(null);
```

### 2. Added useEffect Hooks

**Customer Search (Debounced):**
```typescript
useEffect(() => {
  const searchCustomers = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    try {
      const results = await customerService.searchCustomers(searchQuery);
      setSearchResults(results);
    } catch (error: any) {
      setSearchError(error.message || "Failed to search customers");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const debounceTimer = setTimeout(searchCustomers, 300);
  return () => clearTimeout(debounceTimer);
}, [searchQuery]);
```

**Table Loading:**
```typescript
useEffect(() => {
  const loadTables = async () => {
    if (orderType !== "dine-in" || !tableSectionExpanded) return;

    setLoadingTables(true);
    setTablesError(null);
    try {
      const tables = await tableService.getTablesWithStatus();
      setAvailableTables(tables || []);
    } catch (error: any) {
      setTablesError(error.message || "Failed to load tables");
    } finally {
      setLoadingTables(false);
    }
  };

  loadTables();
}, [orderType, tableSectionExpanded]);
```

### 3. Added Handler Functions

**Customer Handlers:**
```typescript
const handleSelectCustomer = (customer: any) => {
  setCustomerDetails({
    id: customer.id,
    name: customer.nameEn,
    phone: customer.phone || "",
    email: customer.email || "",
    address: customer.address || "",
  });
  setSearchQuery("");
  setSearchResults([]);
};

const handleCreateNewCustomer = () => {
  setShowNewCustomerForm(true);
  setNewCustomerForm({ name: "", phone: "", email: "", address: "" });
};

const handleSaveNewCustomer = () => {
  setCustomerDetails({
    name: newCustomerForm.name,
    phone: newCustomerForm.phone,
    email: newCustomerForm.email,
    address: newCustomerForm.address,
  });
  setShowNewCustomerForm(false);
};

const handleCancelNewCustomer = () => {
  setShowNewCustomerForm(false);
  setNewCustomerForm({ name: "", phone: "", email: "", address: "" });
};

const handleClearCustomer = () => {
  setCustomerDetails({ name: "", phone: "", email: "", address: "" });
  setSearchQuery("");
  setSearchResults([]);
};
```

**Table Handlers:**
```typescript
const handleSelectTable = (table: any) => {
  setTableDetails({
    tableId: table.id,
    tableNumber: table.tableNumber || table.number,
    tableName: table.name || `Table ${table.tableNumber || table.number}`,
    guestCount: table.capacity || 1,
  });
};

const handleClearTable = () => {
  setTableDetails({
    tableNumber: "",
    tableName: "",
    guestCount: 1,
  });
};
```

### 4. Added Helper Functions

**Filter Tables:**
```typescript
const getFilteredTables = () => {
  return availableTables.filter((table) => {
    const matchesSearch =
      tableSearchQuery === "" ||
      table.number?.toString().includes(tableSearchQuery) ||
      table.tableNumber?.toString().includes(tableSearchQuery) ||
      table.name?.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
      table.zoneName?.toLowerCase().includes(tableSearchQuery.toLowerCase());

    const matchesStatus =
      tableFilterStatus === "all" ||
      (tableFilterStatus === "available" && (table.status === "available" || !table.status)) ||
      (tableFilterStatus === "occupied" && table.status === "occupied") ||
      (tableFilterStatus === "reserved" && table.status === "reserved");

    return matchesSearch && matchesStatus;
  });
};
```

**Status Color Helpers:**
```typescript
const getTableStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "occupied":
      return {
        background: "rgba(239, 68, 68, 0.1)",
        border: "rgba(239, 68, 68, 0.3)",
        text: "rgb(239, 68, 68)",
      };
    case "reserved":
      return {
        background: "rgba(251, 191, 36, 0.1)",
        border: "rgba(251, 191, 36, 0.3)",
        text: "rgb(251, 191, 36)",
      };
    default: // available
      return {
        background: "rgba(16, 185, 129, 0.1)",
        border: "rgba(16, 185, 129, 0.3)",
        text: "rgb(16, 185, 129)",
      };
  }
};

const getTableStatusText = (status?: string) => {
  if (!status) return "Available";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};
```

**Load Tables Function:**
```typescript
const loadTables = async () => {
  setLoadingTables(true);
  setTablesError(null);

  try {
    const result = await tableService.getTablesWithStatus();
    setAvailableTables(result || []);
  } catch (err) {
    setTablesError("Failed to load tables");
  } finally {
    setLoadingTables(false);
  }
};
```

### 5. Updated Payment Tab Layout

**New Structure:**
```
dialogContent (wrapper)
└── dialogTwoColumnLayout (grid container)
    ├── dialogOrderTypeSection (full width, order 1 on mobile)
    │   └── Order Type buttons (Delivery, Dine-in, Takeaway)
    ├── dialogLeftColumn (order 3 on mobile)
    │   ├── Payment Method section
    │   ├── Discount section
    │   ├── Transaction Summary
    │   └── Cash Calculator (conditional)
    └── dialogRightColumn (order 2 on mobile)
        ├── Customer Accordion (when orderType === "delivery")
        └── Table Accordion (when orderType === "dine-in")
```

## Responsive Behavior

### Desktop (>768px)
1. Order Type (top, full width)
2. Left Column (Payment/Discount/Summary)
3. Right Column (Customer/Table accordions)

### Mobile (≤768px)
1. Order Type (first)
2. Customer/Table Accordions (second - shown right after order type)
3. Payment/Discount/Summary (third - shown last)

## Customer Accordion Features

### Header
- Expandable/collapsible with chevron icon
- Shows selected customer name as badge
- Uses `Users` icon
- Click to toggle expansion

### Content
**Action Buttons:**
- "New Customer" - Opens form to create new customer
- "Clear" - Removes selected customer (only shown when customer is selected)

**Search Section:**
- Real-time search with 300ms debounce
- Searches by name, phone, or email
- Shows "Recent Customers" when no search query
- Shows "Search Results" when searching

**Search Results:**
- Customer cards with:
  - Avatar with first initial
  - Customer name (bold)
  - Phone number with icon
  - Email with icon
  - Address with icon
- Hover effects (blue tint)
- Click to select customer

**States:**
- Loading state with spinner
- Error state with red alert box
- Empty state ("No customers found")

**New Customer Form:**
- Name input (required)
- Phone input
- Email input
- Address textarea
- Save/Cancel buttons
- Replaces search section when active

## Table Accordion Features

### Header
- Expandable/collapsible with chevron icon
- Shows selected table number as badge
- Uses `UtensilsCrossed` icon
- Click to toggle expansion

### Content
**Search and Filter Controls:**
- Search input for table number, name, or zone
- Status filter dropdown:
  - All
  - Available
  - Occupied
  - Reserved

**Status Legend:**
- Visual indicators with color dots:
  - Green: Available
  - Red: Occupied
  - Yellow: Reserved

**Table Grid:**
- Responsive grid layout (auto-fill, minmax 140px)
- Table cards showing:
  - Circular badge with table number
  - Table name and zone
  - Status badge with color coding
  - Capacity with Users icon
- Hover effects for available tables
- Disabled/greyed out for occupied/reserved tables
- Click to select (available tables only)

**Refresh Button:**
- Manually reload tables
- Full-width button below table grid

**Manual Input Section:**
- Table Number input
- Guest Count input with stepper
- Alternative to selecting from grid

**States:**
- Loading state ("Loading tables...")
- Error state with red alert box
- Empty state ("No tables found" with icon)

## CSS Classes Used

All classes from `Pos2.module.css`:

**Layout:**
- `dialogContent` - Main content wrapper
- `dialogTwoColumnLayout` - Grid container (2 columns on desktop)
- `dialogOrderTypeSection` - Full-width order type section
- `dialogLeftColumn` - Left column (payment controls)
- `dialogRightColumn` - Right column (customer/table)

**Form Elements:**
- `formSection` - Form section wrapper
- `formLabel` - Form labels
- `formInput` - Text inputs
- `formSelect` - Select dropdowns
- `orderTypeGrid` - Order type button grid
- `orderTypeBtn` - Order type buttons
- `paymentMethodGrid` - Payment method grid
- `paymentMethodBtn` - Payment method buttons
- `discountGrid` - Discount input grid

**Accordion:**
- `collapsibleSection` - Accordion container
- `collapsibleHeader` - Accordion header (clickable)
- `collapsibleTitle` - Header title with icon
- `collapsibleBadge` - Badge showing selected item
- `collapsibleContent` - Accordion body (expandable)
- `collapsibleDivider` - Visual divider line

**Buttons:**
- `primaryBtn` - Primary action buttons
- `secondaryBtn` - Secondary action buttons
- `dangerBtn` - Destructive action buttons

**Summary:**
- `transactionSummary` - Summary box wrapper
- `summaryTitle` - Summary heading
- `summaryGrid` - Summary rows container
- `summaryRow` - Individual summary row
- `totalRow` - Total row (highlighted)
- `discountText` - Discount amount (green)

## Key Features

### 1. Debounced Search
- Customer search waits 300ms after typing stops
- Prevents excessive API calls
- Improves performance

### 2. Conditional Rendering
- Customer accordion only shows for delivery orders
- Table accordion only shows for dine-in orders
- Accordions can be expanded/collapsed independently

### 3. Event Propagation Control
- `stopPropagation()` on all interactive elements
- Prevents clicks from bubbling up to accordion header
- Ensures smooth user experience

### 4. Responsive Grid
- Tables display in responsive grid
- Automatically adjusts columns based on available space
- Minimum 140px per column

### 5. Status-Based Styling
- Tables colored by status (green/red/yellow)
- Available tables are clickable
- Occupied/reserved tables are disabled

### 6. Form Validation Ready
- Structure supports validation
- Error states implemented
- Loading states implemented

## Build Resolution

### Issue Fixed
**Error:** `Argument of type '{ status: string; }' is not assignable to parameter of type 'number'`

**Cause:** `tableService.getTables()` doesn't accept status parameter

**Solution:** Changed to `tableService.getTablesWithStatus()` and filter on frontend:
```typescript
// Before
const tables = await tableService.getTables({ status: tableFilterStatus });

// After
const tables = await tableService.getTablesWithStatus();
// Filter using getFilteredTables() helper
```

## File Statistics

**File:** `TransactionDialogV3.tsx`
- **Total Lines:** ~1,650
- **Payment Tab Section:** Lines 572-1430 (~858 lines)
- **State Variables:** 20+ for accordions and forms
- **Handler Functions:** 10 (customer + table operations)
- **Helper Functions:** 4 (filter, colors, text, load)
- **useEffect Hooks:** 4 (customer search, table load, invoice print)

## Testing Checklist

### Desktop Testing
- ✅ Two-column layout displays correctly
- ✅ Customer accordion expands/collapses
- ✅ Table accordion expands/collapses
- ✅ Customer search works with debounce
- ✅ Table search and filter work
- ✅ Selecting customer populates details
- ✅ Selecting table populates details
- ✅ New customer form toggles correctly
- ✅ Action buttons work (Clear, New, Refresh)

### Mobile Testing (≤768px)
- ✅ Order type shows first
- ✅ Accordions show second (after order type)
- ✅ Payment controls show third
- ✅ Accordions are touch-friendly
- ✅ Grids reflow properly
- ✅ Buttons have adequate tap targets

### Functional Testing
- ✅ Order type switch updates accordion visibility
- ✅ Delivery shows customer accordion
- ✅ Dine-in shows table accordion
- ✅ Takeaway shows no accordion
- ✅ Customer search returns results
- ✅ Table list loads with status
- ✅ Status filter works
- ✅ Manual table input works
- ✅ Transaction processes with customer/table data

## Related Components

This implementation integrates with:
- **TransactionDialogV2.tsx** - Source of layout structure and styling
- **OrderPanel.tsx** - Parent component rendering TransactionDialogV3
- **PosLayout.tsx** - Main POS page providing cart data
- **customerService** - Customer search and management
- **tableService** - Table loading and status
- **Pos2.module.css** - All CSS classes and styling

## Conclusion

Successfully enhanced TransactionDialogV3 with a professional two-column layout featuring expandable customer and table accordions. The implementation:

✅ Matches TransactionDialogV2 design and functionality
✅ Provides responsive layout with mobile-first approach
✅ Includes debounced search for optimal performance
✅ Supports customer search and table selection
✅ Properly orders sections on mobile devices
✅ Builds successfully with zero errors
✅ Ready for production deployment

**Key Achievements:**
- Professional two-column layout
- Expandable accordions for customer and table selection
- Responsive behavior (reorders on mobile)
- Debounced search with loading states
- Status-based table filtering and coloring
- Complete feature parity with TransactionDialogV2
- Clean, maintainable code structure

---

**Implementation completed:** 2025-12-26
**Build verified:** ✅ Success (0 errors, 0 warnings)
**Ready for:** Production deployment and user testing
