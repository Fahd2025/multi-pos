# Pending Orders UI Specification

**Feature:** POS Pending Orders Management
**Date:** 2025-12-25
**Version:** 1.0
**Status:** Design Phase

---

## 1. Overview

Enhance the POS page with a comprehensive Pending Orders system that allows cashiers to:
- Save incomplete orders for later completion
- Manage multiple pending orders simultaneously
- Retrieve and complete pending orders
- Delete cancelled or unwanted orders

This feature improves workflow efficiency by allowing cashiers to handle multiple customers, park incomplete orders, and manage order queues during busy periods.

---

## 2. User Personas & Use Cases

### Primary Users
- **Cashier**: Creates, retrieves, and manages pending orders
- **Manager**: Views and manages all pending orders (including those from other cashiers)

### Key Use Cases
1. **Save Order for Later**: Customer needs to step away before completing payment
2. **Handle Multiple Customers**: Cashier needs to serve another customer while keeping current order
3. **Table Pre-ordering**: Customer orders items while browsing menu, pays later
4. **Split Bill Preparation**: Prepare multiple orders from same table before processing
5. **Phone Orders**: Take orders over phone for later pickup/completion
6. **Order Queue Management**: Manage multiple pending orders during rush hours

---

## 3. Architecture Integration

### 3.1 Database Schema

**New Entity: `PendingOrder`** (BranchDb)

```csharp
public class PendingOrder
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } // Auto-generated: PO-YYYYMMDD-XXXX

    // Customer Information
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public Guid? CustomerId { get; set; } // FK to Customer (optional)

    // Table Information (optional - for dine-in)
    public Guid? TableId { get; set; }
    public string? TableNumber { get; set; }
    public int? GuestCount { get; set; }

    // Order Details
    public List<PendingOrderItem> Items { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }

    // Metadata
    public string? Notes { get; set; }
    public OrderType OrderType { get; set; } // DineIn, TakeAway, Delivery
    public PendingOrderStatus Status { get; set; } // Draft, Parked, OnHold
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string CreatedByUserId { get; set; } // FK to User
    public string CreatedByUsername { get; set; }

    // Retrieval/Completion
    public DateTime? RetrievedAt { get; set; }
    public DateTime? ExpiresAt { get; set; } // Auto-delete after 24 hours
}

public class PendingOrderItem
{
    public Guid Id { get; set; }
    public Guid PendingOrderId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; }
    public string? ProductSku { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal Discount { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Notes { get; set; } // Special instructions
}

public enum PendingOrderStatus
{
    Draft,      // Being created
    Parked,     // Temporarily saved
    OnHold,     // Waiting for something (customer return, preparation)
    Retrieved   // Being processed (will be deleted after conversion)
}
```

### 3.2 API Endpoints

**Base Path:** `/api/v1/pending-orders`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/pending-orders` | Create/Save pending order | Cashier+ |
| GET | `/api/v1/pending-orders` | List pending orders (with filters) | Cashier+ |
| GET | `/api/v1/pending-orders/{id}` | Get pending order by ID | Cashier+ |
| PUT | `/api/v1/pending-orders/{id}` | Update pending order | Cashier+ |
| DELETE | `/api/v1/pending-orders/{id}` | Delete pending order | Cashier+ |
| POST | `/api/v1/pending-orders/{id}/retrieve` | Mark as retrieved & return data | Cashier+ |
| POST | `/api/v1/pending-orders/{id}/convert-to-sale` | Convert to completed sale | Cashier+ |
| GET | `/api/v1/pending-orders/stats` | Get pending order statistics | Manager+ |

**Query Parameters for List:**
- `status`: Filter by status (Draft, Parked, OnHold)
- `createdBy`: Filter by user (Managers can see all)
- `orderType`: Filter by order type
- `tableNumber`: Filter by table
- `search`: Search by customer name, phone, or order number
- `page`, `pageSize`: Pagination

---

## 4. Frontend Architecture

### 4.1 Component Structure

```
frontend/app/[locale]/(pos)/pos/
├── page.tsx                           # Main POS page (enhanced)
├── components/
│   ├── PendingOrders/
│   │   ├── PendingOrdersPanel.tsx     # Slide-in panel for pending orders
│   │   ├── PendingOrdersList.tsx      # Table/Grid of pending orders
│   │   ├── PendingOrderCard.tsx       # Individual order card
│   │   ├── PendingOrderDialog.tsx     # Dialog for saving order
│   │   ├── RetrieveOrderDialog.tsx    # Dialog for retrieving order
│   │   ├── PendingOrderFilters.tsx    # Filter controls
│   │   └── PendingOrderBadge.tsx      # Badge showing count
│   ├── OrderEntry/
│   │   ├── OrderEntryPanel.tsx        # Main order entry area
│   │   ├── OrderItemsList.tsx         # Current order items
│   │   ├── OrderActions.tsx           # Save/Clear/Complete buttons
│   │   └── OrderSummary.tsx           # Totals summary
│   └── shared/
│       ├── AnimatedPanel.tsx          # Reusable animated panel
│       ├── ConfirmDialog.tsx          # Confirmation dialogs
│       └── EmptyState.tsx             # Empty state component
└── hooks/
    ├── usePendingOrders.ts            # Pending orders API hook
    ├── usePendingOrderSync.ts         # Offline sync for pending orders
    └── useOrderState.ts               # Order state management
```

### 4.2 State Management

```typescript
// Order State Interface
interface OrderState {
  // Current Order
  currentOrder: {
    items: OrderItem[];
    customer: CustomerInfo | null;
    table: TableInfo | null;
    orderType: OrderType;
    notes: string;
    totals: OrderTotals;
  };

  // Pending Orders
  pendingOrders: PendingOrder[];
  pendingOrdersCount: number;
  isLoadingPending: boolean;

  // UI State
  isPendingPanelOpen: boolean;
  isSaveDialogOpen: boolean;
  isRetrieveDialogOpen: boolean;
  selectedPendingOrder: PendingOrder | null;

  // Actions
  addItem: (product: Product, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearOrder: () => void;

  savePendingOrder: (data: SavePendingOrderData) => Promise<void>;
  loadPendingOrders: () => Promise<void>;
  retrievePendingOrder: (id: string) => Promise<void>;
  deletePendingOrder: (id: string) => Promise<void>;
  convertToSale: (id: string) => Promise<Sale>;
}
```

---

## 5. UI/UX Design Specifications

### 5.1 Main POS Layout (Enhanced)

```
┌─────────────────────────────────────────────────────────────┐
│  MULTI-POS - Point of Sale                    [Pending: 5] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────┐  ┌──────────────────────────┐  │
│  │  PRODUCT CATALOG      │  │  CURRENT ORDER           │  │
│  │  [Search...]          │  │                          │  │
│  │                       │  │  Table 5 • 2 Guests      │  │
│  │  ┌────┐ ┌────┐       │  │  Customer: John Doe      │  │
│  │  │ 🍕 │ │ 🍔 │       │  │                          │  │
│  │  │$12 │ │$15 │       │  │  [Pizza]  x2    $24.00   │  │
│  │  └────┘ └────┘       │  │  [Burger] x1    $15.00   │  │
│  │                       │  │  [Fries]  x1    $5.00    │  │
│  │  [Categories...]      │  │                          │  │
│  │                       │  │  ───────────────────────  │  │
│  │                       │  │  Subtotal:      $44.00   │  │
│  │                       │  │  Tax (10%):     $4.40    │  │
│  │                       │  │  Total:         $48.40   │  │
│  │                       │  │                          │  │
│  │                       │  │  [Save Order]  [Clear]   │  │
│  │                       │  │  [💳 Pay Now]            │  │
│  └───────────────────────┘  └──────────────────────────┘  │
│                                                             │
│  [🔙 Tables] [📋 Pending Orders] [⚙️ Settings]            │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Pending Orders Panel (Slide-in from Right)

**Trigger:** Click "Pending Orders" button or badge
**Animation:** Slide in from right with backdrop fade-in (300ms ease-out)

```
┌─────────────────────────────────────────────────────────────┐
│  ◀ Back                PENDING ORDERS                    ✕  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Search orders...]              [Filters ▼] [Sort ▼]      │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 📋 PO-20251225-0001           🟢 Parked     [•••]     │ │
│  │ Customer: Sarah Johnson                               │ │
│  │ Table 3 • 4 Guests • Dine In                          │ │
│  │ 3 items • $67.50                                      │ │
│  │ Created: 10 mins ago by john_cashier                  │ │
│  │                                                       │ │
│  │ [🔄 Retrieve]  [🗑️ Delete]                            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 📋 PO-20251225-0002           🟡 On Hold    [•••]     │ │
│  │ Customer: Mike Chen                                   │ │
│  │ Phone: (555) 123-4567 • Take Away                     │ │
│  │ 2 items • $34.00                                      │ │
│  │ Created: 25 mins ago by sarah_cashier                 │ │
│  │ Note: "Waiting for pickup"                            │ │
│  │                                                       │ │
│  │ [🔄 Retrieve]  [🗑️ Delete]                            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 📋 PO-20251225-0003           🟢 Parked     [•••]     │ │
│  │ Customer: Anonymous                                   │ │
│  │ Walk-in • Take Away                                   │ │
│  │ 1 item • $12.50                                       │ │
│  │ Created: 1 hour ago by john_cashier                   │ │
│  │                                                       │ │
│  │ [🔄 Retrieve]  [🗑️ Delete]                            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Showing 3 of 5 pending orders                              │
│  [Load More...]                                             │
│                                                             │
│  [+ New Order]                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Save Order Dialog

**Trigger:** Click "Save Order" button when items in cart
**Animation:** Fade in backdrop + scale up dialog (200ms ease-out)

```
╔═══════════════════════════════════════════════════════════╗
║                    💾 Save Pending Order                  ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Order Summary: 3 items • $48.40                          ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ Customer Information (Optional)                     │ ║
║  │                                                     │ ║
║  │ Name:    [John Doe___________________]             │ ║
║  │ Phone:   [(555) 123-4567_____________]             │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ Order Type                                          │ ║
║  │ ⦿ Dine In    ○ Take Away    ○ Delivery             │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ Table (Dine In Only)                                │ ║
║  │ [Table 5 ▼]              Guests: [2]               │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ Status                                              │ ║
║  │ ⦿ Parked (Quick save)                               │ ║
║  │ ○ On Hold (Waiting for customer/preparation)       │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ Notes (Optional)                                    │ ║
║  │ [Customer will return in 10 mins_____________]     │ ║
║  │ [_________________________________________]         │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
║                          [Cancel]  [💾 Save Order]        ║
║                                                           ║
║  💡 Tip: Pending orders expire after 24 hours            ║
╚═══════════════════════════════════════════════════════════╝
```

### 5.4 Retrieve Order Dialog

**Trigger:** Click "Retrieve" on a pending order card
**Animation:** Fade in backdrop + slide up dialog (250ms ease-out)

```
╔═══════════════════════════════════════════════════════════╗
║              🔄 Retrieve Pending Order                    ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Order: PO-20251225-0001                                  ║
║  Customer: Sarah Johnson                                  ║
║  Created: 10 mins ago by john_cashier                     ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │ Order Details                                       │ ║
║  │                                                     │ ║
║  │  • Margherita Pizza (Large)      x1      $18.00    │ ║
║  │  • Caesar Salad                  x2      $22.00    │ ║
║  │  • Iced Tea                      x3      $9.00     │ ║
║  │  • Chocolate Cake                x1      $12.50    │ ║
║  │                                                     │ ║
║  │  Subtotal:                               $61.50    │ ║
║  │  Tax (10%):                              $6.15     │ ║
║  │  Total:                                  $67.65    │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
║  📝 Note: "Waiting for appetizers"                        ║
║                                                           ║
║  ⚠️ This will replace your current order                  ║
║                                                           ║
║  What would you like to do?                               ║
║                                                           ║
║  [❌ Cancel]  [➕ Merge with Current]  [🔄 Replace]       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### 5.5 Delete Confirmation Dialog

**Trigger:** Click "Delete" on a pending order
**Animation:** Shake animation on order card + fade in dialog

```
╔═══════════════════════════════════════════════════════════╗
║              ⚠️  Delete Pending Order?                    ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Are you sure you want to delete this pending order?      ║
║                                                           ║
║  Order: PO-20251225-0002                                  ║
║  Customer: Mike Chen                                      ║
║  Total: $34.00 (2 items)                                  ║
║                                                           ║
║  ⚠️ This action cannot be undone                          ║
║                                                           ║
║  Reason for deletion (optional):                          ║
║  [Customer cancelled____________________]                 ║
║                                                           ║
║                          [Cancel]  [🗑️ Delete]            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 6. Visual Design System

### 6.1 Color Palette

```css
/* Status Colors */
--status-parked: #10b981;      /* Green - Ready to retrieve */
--status-onhold: #f59e0b;      /* Amber - Waiting */
--status-draft: #6b7280;       /* Gray - Being created */
--status-retrieved: #3b82f6;   /* Blue - In progress */

/* Action Colors */
--action-retrieve: #3b82f6;    /* Blue */
--action-delete: #ef4444;      /* Red */
--action-save: #10b981;        /* Green */
--action-merge: #8b5cf6;       /* Purple */

/* Background Colors */
--bg-panel: #ffffff;
--bg-card: #f9fafb;
--bg-card-hover: #f3f4f6;
--bg-backdrop: rgba(0, 0, 0, 0.5);
```

### 6.2 Typography

```css
/* Headings */
--text-panel-title: 24px / 700 / 'Geist Sans';
--text-card-title: 16px / 600 / 'Geist Sans';
--text-order-number: 14px / 500 / 'Geist Mono';

/* Body */
--text-body: 14px / 400 / 'Geist Sans';
--text-caption: 12px / 400 / 'Geist Sans';
--text-badge: 11px / 600 / 'Geist Sans';

/* Numbers */
--text-amount: 18px / 700 / 'Geist Mono';
--text-count: 14px / 600 / 'Geist Mono';
```

### 6.3 Spacing & Layout

```css
/* Panel */
--panel-width: 480px;
--panel-padding: 24px;
--panel-border-radius: 0px; /* Slide-in panels are full-height */

/* Cards */
--card-padding: 16px;
--card-gap: 12px;
--card-border-radius: 12px;
--card-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
--card-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.15);

/* Spacing */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
```

### 6.4 Animations

```css
/* Panel Slide In (from right) */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Dialog Scale Up */
@keyframes scaleUp {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Card Hover Lift */
@keyframes cardLift {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-2px);
  }
}

/* Delete Shake */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

/* Success Pulse */
@keyframes successPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
}

/* Loading Spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 7. Interaction Patterns

### 7.1 Main POS Flow with Pending Orders

```
┌─────────────┐
│  Add Items  │
│  to Cart    │
└──────┬──────┘
       │
       ├─────────┐
       │         │
       ▼         ▼
┌──────────┐  ┌──────────────┐
│ Complete │  │ Save Pending │
│ Sale Now │  │    Order     │
└────┬─────┘  └──────┬───────┘
     │               │
     ▼               ▼
┌─────────┐    ┌──────────────┐
│ Payment │    │ Save Dialog  │
│ Process │    │ (Metadata)   │
└─────────┘    └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │ Order Saved  │
               │ Cart Cleared │
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────┐
               │ Badge Count  │
               │   Updates    │
               └──────────────┘
```

### 7.2 Retrieve Order Flow

```
┌───────────────┐
│ Click Pending │
│ Orders Badge  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Panel Slides  │
│  In (300ms)   │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Browse Orders │
│ (Search/Filter)│
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Click Retrieve│
│   on Order    │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Show Order    │
│   Details     │
└───────┬───────┘
        │
        ├─────────┬─────────┐
        ▼         ▼         ▼
   ┌────────┐ ┌───────┐ ┌────────┐
   │ Cancel │ │ Merge │ │Replace │
   └────────┘ └───┬───┘ └───┬────┘
                  │         │
                  ▼         ▼
            ┌──────────────────┐
            │ Load into Cart   │
            │ Panel Closes     │
            │ Success Toast    │
            └──────────────────┘
```

### 7.3 Delete Order Flow

```
┌───────────────┐
│ Click Delete  │
│   on Order    │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Card Shakes   │
│   (Alert)     │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Confirmation  │
│    Dialog     │
└───────┬───────┘
        │
        ├─────────┐
        ▼         ▼
   ┌────────┐ ┌────────┐
   │ Cancel │ │ Confirm│
   └────────┘ └───┬────┘
                  │
                  ▼
            ┌──────────────┐
            │ API Delete   │
            │ Fade Out Card│
            │ Update Count │
            │ Show Toast   │
            └──────────────┘
```

---

## 8. Responsive Design Specifications

### 8.1 Desktop (>1024px)

- **Panel Width**: 480px (fixed, slide from right)
- **Card Layout**: Single column, full width
- **Actions**: Inline buttons (Retrieve + Delete)
- **Hover Effects**: Enabled (card lift, button highlights)

### 8.2 Tablet (768px - 1024px)

- **Panel Width**: 400px (slide from right)
- **Card Layout**: Single column
- **Actions**: Inline buttons (smaller)
- **Touch Optimization**: Larger hit areas (48px minimum)

### 8.3 Mobile (<768px)

- **Panel Width**: 100vw (full screen overlay)
- **Card Layout**: Single column with compact padding
- **Actions**: Full-width stacked buttons
- **Bottom Sheet**: Alternative to slide-in panel
- **Swipe Gestures**: Swipe left on card to reveal delete

```
Mobile Card Layout:
┌─────────────────────────────────┐
│ 📋 PO-20251225-0001  🟢 Parked │
├─────────────────────────────────┤
│ Sarah Johnson                   │
│ Table 3 • 4 Guests              │
│ $67.50 • 10 mins ago            │
├─────────────────────────────────┤
│ [🔄 Retrieve Order]             │
│ [🗑️ Delete]                     │
└─────────────────────────────────┘
```

### 8.4 Touchscreen Optimization

- **Minimum Touch Target**: 48x48px
- **Gesture Support**:
  - Swipe right to close panel
  - Swipe left on card to reveal delete
  - Long press for context menu
  - Pull to refresh order list
- **Visual Feedback**:
  - Active state on touch (scale 0.98)
  - Ripple effect on buttons
  - Loading spinner on async actions

---

## 9. Error Handling & Edge Cases

### 9.1 Error States

| Error Scenario | User Message | Recovery Action |
|----------------|--------------|-----------------|
| **Save Failed** | "Failed to save order. Please try again." | Retry button, save to local storage |
| **Load Failed** | "Unable to load pending orders." | Retry button, show cached data |
| **Delete Failed** | "Could not delete order. It may have been already deleted." | Refresh list |
| **Retrieve Failed** | "Order no longer available." | Refresh list |
| **Network Offline** | "You're offline. Order saved locally and will sync when online." | Queue for sync |
| **Expired Order** | "This order has expired (>24h) and was auto-deleted." | Remove from list |
| **Permission Denied** | "You don't have permission to access this order." | Hide/disable action |

### 9.2 Empty States

**No Pending Orders:**
```
┌─────────────────────────────────┐
│                                 │
│         📋                      │
│    No Pending Orders            │
│                                 │
│    Orders you save will         │
│    appear here                  │
│                                 │
│    [+ Create Order]             │
│                                 │
└─────────────────────────────────┘
```

**No Search Results:**
```
┌─────────────────────────────────┐
│         🔍                      │
│    No orders found              │
│                                 │
│    Try adjusting your           │
│    search or filters            │
│                                 │
│    [Clear Filters]              │
└─────────────────────────────────┘
```

### 9.3 Edge Cases

1. **Current Order Conflict**:
   - If cart has items when retrieving: Show merge/replace dialog
   - Auto-save current order before replacing (with confirmation)

2. **Concurrent Edits**:
   - Show warning if order was modified by another user
   - Display last updated timestamp
   - Option to view changes or force override

3. **Expired Orders**:
   - Auto-delete after 24 hours
   - Show warning 30 mins before expiry
   - Allow extending expiry (Manager only)

4. **Offline Sync**:
   - Save to IndexedDB when offline
   - Show sync indicator when online
   - Conflict resolution: Last write wins (with notification)

5. **Permission Changes**:
   - If user role changes mid-session, reload orders
   - Hide orders created by other cashiers (unless Manager)

---

## 10. Accessibility (a11y) Requirements

### 10.1 Keyboard Navigation

- **Tab Order**: Logical flow through all interactive elements
- **Shortcuts**:
  - `Ctrl+Shift+P`: Open Pending Orders panel
  - `Escape`: Close panel/dialog
  - `Enter`: Confirm action
  - `Delete`: Delete selected order (with confirmation)
  - `/`: Focus search input

### 10.2 Screen Reader Support

- **ARIA Labels**: All icons and buttons have descriptive labels
- **Live Regions**: Announce order count changes, toast messages
- **Semantic HTML**: Proper heading hierarchy, landmarks
- **Focus Management**:
  - Auto-focus first interactive element in dialogs
  - Return focus to trigger element on close
  - Focus trap within modals

### 10.3 Visual Accessibility

- **Color Contrast**: WCAG AA compliant (4.5:1 for text)
- **Focus Indicators**: Visible 2px outline on all focusable elements
- **Icon + Text**: Never rely on color alone (use icons + labels)
- **Font Size**: Minimum 14px, scalable up to 200%
- **Reduced Motion**: Respect `prefers-reduced-motion` media query

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. Performance Optimization

### 11.1 Data Loading Strategy

- **Initial Load**: Fetch only first 10 orders (sorted by recent)
- **Infinite Scroll**: Load 10 more on scroll to bottom
- **Caching**: Cache orders in React Query with 5-minute stale time
- **Optimistic Updates**: Update UI immediately, rollback on error
- **Debounced Search**: 300ms delay on search input

### 11.2 Rendering Optimization

- **Virtual Scrolling**: Use `react-virtual` for large lists (>50 orders)
- **Memoization**: Memoize order cards with `React.memo`
- **Code Splitting**: Lazy load panel component
- **Image Optimization**: Use Next.js Image component for product images

### 11.3 Offline Support

- **Service Worker**: Cache pending orders API responses
- **IndexedDB**: Store pending orders locally
- **Background Sync**: Sync when connection restored
- **Optimistic UI**: Show success immediately, queue sync

---

## 12. Testing Strategy

### 12.1 Unit Tests

- ✅ Save pending order with valid data
- ✅ Save pending order with minimal data (customer optional)
- ✅ Retrieve pending order (replace mode)
- ✅ Retrieve pending order (merge mode)
- ✅ Delete pending order with confirmation
- ✅ Filter orders by status
- ✅ Search orders by customer name
- ✅ Calculate totals correctly
- ✅ Handle expired orders

### 12.2 Integration Tests

- ✅ Save order → Load list → Verify order appears
- ✅ Retrieve order → Verify cart populated
- ✅ Delete order → Verify removed from list
- ✅ Offline save → Go online → Verify synced
- ✅ Create order → Expire (mock time) → Verify auto-deleted
- ✅ Multiple users → Verify permission filtering

### 12.3 E2E Tests (Playwright/Cypress)

1. **Complete Flow**:
   - Add items to cart
   - Save as pending order
   - Clear cart
   - Add different items
   - Retrieve pending order (merge)
   - Complete sale

2. **Manager Flow**:
   - Login as Manager
   - View all pending orders (from all cashiers)
   - Delete expired orders
   - Generate pending orders report

3. **Offline Flow**:
   - Go offline
   - Save pending order
   - Verify saved to IndexedDB
   - Go online
   - Verify synced to server

### 12.4 Manual Testing Checklist

- [ ] Panel animations smooth on all screen sizes
- [ ] Touch gestures work on iPad/tablets
- [ ] Keyboard shortcuts functional
- [ ] Screen reader announces order count
- [ ] High contrast mode displays correctly
- [ ] Print preview works (if implemented)
- [ ] Multiple browser tabs sync (real-time updates)
- [ ] Long customer names don't break layout
- [ ] Large order (50+ items) loads quickly
- [ ] Network failure shows appropriate error

---

## 13. Analytics & Monitoring

### 13.1 Events to Track

| Event | Trigger | Data |
|-------|---------|------|
| `pending_order_saved` | Order saved | order_type, item_count, total_amount, status |
| `pending_order_retrieved` | Order retrieved | retrieval_mode (replace/merge), time_pending |
| `pending_order_deleted` | Order deleted | deletion_reason, time_pending |
| `pending_order_expired` | Auto-deleted | time_pending |
| `pending_orders_panel_opened` | Panel opened | orders_count |
| `pending_order_search` | Search performed | search_term, results_count |
| `pending_order_converted` | Converted to sale | time_pending, payment_method |

### 13.2 Metrics to Monitor

- **Average Time Pending**: How long orders stay pending
- **Retrieval Rate**: % of pending orders that get completed
- **Deletion Rate**: % of pending orders that get deleted
- **Expiry Rate**: % of orders that expire (>24h)
- **Peak Pending Count**: Max concurrent pending orders
- **Conversion Time**: Time from save to sale completion
- **Offline Save Rate**: % of orders saved offline

### 13.3 Error Monitoring

- **API Failures**: Track failed save/retrieve/delete operations
- **Sync Failures**: Monitor offline sync errors
- **Performance Issues**: Track slow API responses (>2s)
- **Client Errors**: Log JavaScript errors in panel/dialogs

---

## 14. Future Enhancements (Phase 2)

### 14.1 Advanced Features

1. **Order Templates**: Save frequently ordered combinations
2. **Customer History**: Show customer's previous pending orders
3. **Order Sharing**: Transfer pending order to another cashier
4. **Bulk Actions**: Delete/retrieve multiple orders
5. **Order Notes**: Add timestamps notes (e.g., "Called customer at 2:30 PM")
6. **Reminders**: Set alerts for pending orders
7. **Export**: Download pending orders as CSV/PDF
8. **Analytics Dashboard**: Manager view of pending order trends

### 14.2 Integration Enhancements

1. **Kitchen Display**: Send pending orders to kitchen
2. **SMS Notifications**: Alert customer when order ready
3. **QR Code**: Generate QR for customer to retrieve order
4. **Payment Links**: Send payment link for pending orders
5. **Loyalty Integration**: Apply loyalty points on retrieval
6. **CRM Integration**: Sync customer data with CRM

### 14.3 UX Improvements

1. **Drag & Drop**: Reorder pending orders by priority
2. **Color Coding**: Custom colors for different order types
3. **Tags**: Add custom tags (VIP, Rush, Delayed)
4. **Voice Commands**: "Retrieve order for John Doe"
5. **Smart Suggestions**: "Customer X usually orders Y"
6. **Collaborative Editing**: Multiple cashiers edit same order

---

## 15. Implementation Phases

### Phase 1: Core Functionality (MVP) - Week 1

**Backend:**
- [x] Create PendingOrder entity and migration
- [x] Implement PendingOrdersService
- [x] Create API endpoints (CRUD + retrieve)
- [ ] Add authorization middleware
- [ ] Write unit tests

**Frontend:**
- [ ] Create PendingOrdersPanel component
- [ ] Implement save/retrieve/delete dialogs
- [ ] Add pending orders API hooks
- [ ] Integrate with main POS page
- [ ] Add offline sync (IndexedDB)

**Testing:**
- [ ] Unit tests (backend + frontend)
- [ ] Integration tests
- [ ] Basic E2E flow

### Phase 2: Enhanced UX - Week 2

- [ ] Add search and filtering
- [ ] Implement animations
- [ ] Add empty states and error handling
- [ ] Optimize for mobile/touchscreen
- [ ] Add keyboard shortcuts
- [ ] Accessibility audit

### Phase 3: Advanced Features - Week 3

- [ ] Order expiry automation
- [ ] Manager analytics view
- [ ] Merge orders functionality
- [ ] Bulk actions
- [ ] Advanced filtering
- [ ] Performance optimization (virtual scrolling)

### Phase 4: Polish & Launch - Week 4

- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] User training materials
- [ ] Production deployment
- [ ] Monitoring setup

---

## 16. Success Metrics

### 16.1 Adoption Metrics

- **Target**: 80% of cashiers use pending orders within 2 weeks
- **Measure**: Track `pending_order_saved` events per user

### 16.2 Efficiency Metrics

- **Target**: Reduce average transaction time by 15%
- **Measure**: Compare order completion time before/after feature

### 16.3 User Satisfaction

- **Target**: 4.5/5 star rating from cashiers
- **Measure**: In-app feedback survey after 1 week

### 16.4 Technical Metrics

- **API Response Time**: <500ms for list, <300ms for CRUD
- **Panel Load Time**: <200ms to slide in
- **Offline Sync Success Rate**: >95%
- **Error Rate**: <1% of operations

---

## 17. Appendix

### 17.1 API Contract Examples

**POST `/api/v1/pending-orders`**

```json
{
  "customerName": "Sarah Johnson",
  "customerPhone": "(555) 123-4567",
  "tableId": "uuid",
  "tableNumber": "5",
  "guestCount": 4,
  "orderType": "DineIn",
  "status": "Parked",
  "notes": "Waiting for dessert menu",
  "items": [
    {
      "productId": "uuid",
      "productName": "Margherita Pizza",
      "productSku": "PIZZA-001",
      "unitPrice": 18.00,
      "quantity": 1,
      "discount": 0,
      "totalPrice": 18.00,
      "notes": "Extra cheese"
    }
  ],
  "subtotal": 61.50,
  "taxAmount": 6.15,
  "discountAmount": 0,
  "totalAmount": 67.65
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "PO-20251225-0001",
    "customerName": "Sarah Johnson",
    "status": "Parked",
    "totalAmount": 67.65,
    "itemCount": 4,
    "createdAt": "2025-12-25T14:30:00Z",
    "expiresAt": "2025-12-26T14:30:00Z"
  }
}
```

### 17.2 Component Props Interfaces

```typescript
interface PendingOrdersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRetrieve: (order: PendingOrder, mode: 'replace' | 'merge') => void;
  onDelete: (orderId: string) => Promise<void>;
}

interface PendingOrderCardProps {
  order: PendingOrder;
  onRetrieve: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}

interface SaveOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrder: OrderState;
  onSave: (data: SavePendingOrderData) => Promise<void>;
}
```

### 17.3 Toast Notifications

```typescript
// Success Messages
toast.success("Order saved successfully! (PO-20251225-0001)");
toast.success("Order retrieved and loaded into cart");
toast.success("Order deleted");
toast.success("Changes synced to server");

// Error Messages
toast.error("Failed to save order. Please try again.");
toast.error("Order not found. It may have been deleted.");
toast.error("You're offline. Order will sync when online.");

// Warning Messages
toast.warning("Order expires in 30 minutes");
toast.warning("Your current order will be replaced");

// Info Messages
toast.info("Order saved locally. Will sync when online.");
toast.info("Merged 3 items from pending order");
```

---

## 18. Glossary

| Term | Definition |
|------|------------|
| **Pending Order** | An incomplete order saved for later completion |
| **Parked Order** | A pending order temporarily saved (quick save) |
| **On Hold Order** | A pending order waiting for customer or preparation |
| **Order Number** | Auto-generated ID in format PO-YYYYMMDD-XXXX |
| **Retrieve** | Load a pending order into the current cart |
| **Merge** | Combine pending order items with current cart items |
| **Replace** | Clear current cart and load pending order |
| **Expiry** | Automatic deletion after 24 hours |
| **Offline Sync** | Queue operations when offline, sync when online |

---

## Conclusion

This specification provides a comprehensive blueprint for implementing the Pending Orders feature in your multi-POS system. The design prioritizes:

✅ **User Experience**: Intuitive workflows with minimal clicks
✅ **Performance**: Fast loading, smooth animations, offline support
✅ **Accessibility**: Keyboard navigation, screen reader support
✅ **Scalability**: Handles hundreds of pending orders efficiently
✅ **Error Handling**: Graceful degradation and recovery
✅ **Responsive Design**: Works on all devices and screen sizes

**Next Steps:**
1. Review and approve this specification
2. Create technical tasks in `tasks.md`
3. Begin Phase 1 implementation
4. Set up monitoring and analytics
5. Plan user training and rollout

**Questions or feedback?** Please review sections 4-10 carefully and provide any architectural or UX concerns before implementation begins.
