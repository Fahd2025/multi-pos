# Phase 15: POS Pending Orders Management - Task Breakdown

**Priority**: P8
**Duration**: 2-3 weeks (with 2 developers)
**Specification**: See `pending-orders-ui-spec.md` for complete UI/UX design

---

## Goal

Enable cashiers to save incomplete orders for later completion, manage multiple pending orders simultaneously, retrieve and complete pending orders, and handle order queues during busy periods. Improves workflow efficiency by allowing cashiers to handle multiple customers and park incomplete orders.

## Independent Test Criteria

Save incomplete order with customer info and items → retrieve pending order from list → merge with current cart or replace → complete sale. Verify offline support, auto-expiry after 24 hours, and permission filtering (cashiers see own orders, managers see all).

---

## Task Breakdown (130 Tasks: T657-T786)

### Tests for Phase 15 (Write First - TDD) - 8 Tasks

- [ ] **T657** [P] [PO] Create PendingOrdersServiceTests in `Backend.UnitTests/Services/PendingOrdersServiceTests.cs` with `CreatePendingOrder_ValidData_ReturnsOrderNumber` test
- [ ] **T658** [P] [PO] Create PendingOrdersServiceTests `SavePendingOrder_MinimalData_Success` test (customer info optional)
- [ ] **T659** [P] [PO] Create PendingOrdersServiceTests `GetPendingOrders_CashierRole_ReturnsOnlyOwnOrders` test
- [ ] **T660** [P] [PO] Create PendingOrdersServiceTests `GetPendingOrders_ManagerRole_ReturnsAllOrders` test
- [ ] **T661** [P] [PO] Create PendingOrdersServiceTests `AutoExpiry_After24Hours_OrdersDeleted` test
- [ ] **T662** [P] [PO] Create pending orders endpoint integration tests in `Backend.IntegrationTests/Endpoints/PendingOrdersEndpointsTests.cs`
- [ ] **T663** [P] [PO] Create offline pending orders tests in `frontend/__tests__/lib/pending-orders-offline.test.ts`
- [ ] **T664** [P] [PO] Create PendingOrdersPanel component test in `frontend/__tests__/components/PendingOrdersPanel.test.tsx`

---

### Database & Entity Models - 6 Tasks

- [ ] **T665** [PO] Create PendingOrder entity in `Backend/Models/Entities/Branch/PendingOrder.cs` with OrderNumber, CustomerName, CustomerPhone, TableId, Items, Totals, Status, CreatedBy, ExpiresAt per `pending-orders-ui-spec.md`
- [ ] **T666** [PO] Create PendingOrderItem entity in `Backend/Models/Entities/Branch/PendingOrderItem.cs` with ProductId, ProductName, Quantity, UnitPrice, Discount, Notes
- [ ] **T667** [PO] Add PendingOrderStatus enum to `Backend/Models/Enums/PendingOrderStatus.cs` (Draft, Parked, OnHold, Retrieved)
- [ ] **T668** [PO] Update `Backend/Data/BranchDbContext.cs` to include DbSet<PendingOrder> and DbSet<PendingOrderItem>
- [ ] **T669** [PO] Create EF Core migration for PendingOrder tables using `dotnet ef migrations add AddPendingOrders --context BranchDbContext`
- [ ] **T670** [PO] Apply migration using `dotnet ef database update --context BranchDbContext`

---

### DTOs - 6 Tasks

- [ ] **T671** [P] [PO] Create PendingOrderDto in `Backend/Models/DTOs/Branch/PendingOrders/PendingOrderDto.cs`
- [ ] **T672** [P] [PO] Create CreatePendingOrderDto in `Backend/Models/DTOs/Branch/PendingOrders/CreatePendingOrderDto.cs`
- [ ] **T673** [P] [PO] Create UpdatePendingOrderDto in `Backend/Models/DTOs/Branch/PendingOrders/UpdatePendingOrderDto.cs`
- [ ] **T674** [P] [PO] Create PendingOrderItemDto in `Backend/Models/DTOs/Branch/PendingOrders/PendingOrderItemDto.cs`
- [ ] **T675** [P] [PO] Create RetrievePendingOrderDto in `Backend/Models/DTOs/Branch/PendingOrders/RetrievePendingOrderDto.cs`
- [ ] **T676** [P] [PO] Create PendingOrderStatsDto in `Backend/Models/DTOs/Branch/PendingOrders/PendingOrderStatsDto.cs`

---

### Backend Services - 5 Tasks

- [ ] **T677** [PO] Implement IPendingOrdersService interface in `Backend/Services/Branch/PendingOrders/IPendingOrdersService.cs`
- [ ] **T678** [PO] Implement PendingOrdersService in `Backend/Services/Branch/PendingOrders/PendingOrdersService.cs` with CreatePendingOrderAsync, GetPendingOrdersAsync, GetPendingOrderByIdAsync, UpdatePendingOrderAsync, DeletePendingOrderAsync, RetrievePendingOrderAsync, ConvertToSaleAsync, GetPendingOrderStatsAsync methods
- [ ] **T679** [PO] Implement OrderNumberGenerator utility in `Backend/Utilities/OrderNumberGenerator.cs` for PO-YYYYMMDD-XXXX format
- [ ] **T680** [PO] Add pending order business logic: calculate totals, validate items, enforce expiry (24 hours), filter by user role (cashier sees own, manager sees all)
- [ ] **T681** [PO] Implement background job/service for auto-expiry: delete pending orders older than 24 hours

---

### API Endpoints - 8 Tasks

- [ ] **T682** [PO] Implement POST `/api/v1/pending-orders` endpoint in `Backend/Program.cs` (create/save pending order) per `pending-orders-ui-spec.md` Section 3.2
- [ ] **T683** [PO] Implement GET `/api/v1/pending-orders` endpoint with filtering (status, createdBy, orderType, search) and pagination in `Backend/Program.cs`
- [ ] **T684** [PO] Implement GET `/api/v1/pending-orders/:id` endpoint in `Backend/Program.cs`
- [ ] **T685** [PO] Implement PUT `/api/v1/pending-orders/:id` endpoint in `Backend/Program.cs`
- [ ] **T686** [PO] Implement DELETE `/api/v1/pending-orders/:id` endpoint in `Backend/Program.cs`
- [ ] **T687** [PO] Implement POST `/api/v1/pending-orders/:id/retrieve` endpoint in `Backend/Program.cs` (mark as retrieved, return order data)
- [ ] **T688** [PO] Implement POST `/api/v1/pending-orders/:id/convert-to-sale` endpoint in `Backend/Program.cs` (convert pending order to completed sale)
- [ ] **T689** [PO] Implement GET `/api/v1/pending-orders/stats` endpoint in `Backend/Program.cs` (Manager only - total pending, by status, by user)

---

### Frontend Services - 4 Tasks

- [ ] **T690** [PO] Create PendingOrdersService in `frontend/services/pending-orders.service.ts` with createPendingOrder, getPendingOrders, getPendingOrderById, updatePendingOrder, deletePendingOrder, retrievePendingOrder, convertToSale, getStats methods
- [ ] **T691** [PO] Create usePendingOrders hook in `frontend/hooks/usePendingOrders.ts` for state management with React Query
- [ ] **T692** [PO] Create usePendingOrderSync hook in `frontend/hooks/usePendingOrderSync.ts` for offline sync support
- [ ] **T693** [PO] Extend `frontend/lib/offline-sync.ts` to support pending orders queue (save offline, sync when online)

---

### Frontend UI Components - 10 Tasks

**Core Components:**

- [ ] **T694** [P] [PO] Create PendingOrdersPanel component in `frontend/app/[locale]/(pos)/pos/components/PendingOrders/PendingOrdersPanel.tsx` (slide-in panel from right)
- [ ] **T695** [P] [PO] Create PendingOrdersList component in `frontend/app/[locale]/(pos)/pos/components/PendingOrders/PendingOrdersList.tsx` (table/grid of pending orders)
- [ ] **T696** [P] [PO] Create PendingOrderCard component in `frontend/app/[locale]/(pos)/pos/components/PendingOrders/PendingOrderCard.tsx` (individual order card)
- [ ] **T697** [P] [PO] Create PendingOrderBadge component in `frontend/app/[locale]/(pos)/pos/components/PendingOrders/PendingOrderBadge.tsx` (count badge in header)
- [ ] **T698** [P] [PO] Create PendingOrderFilters component in `frontend/app/[locale]/(pos)/pos/components/PendingOrders/PendingOrderFilters.tsx` (status, date, user filters)

**Dialog Components:**

- [ ] **T699** [P] [PO] Create SaveOrderDialog component in `frontend/app/[locale]/(pos)/pos/components/PendingOrders/SaveOrderDialog.tsx` (customer info, order type, status, notes)
- [ ] **T700** [P] [PO] Create RetrieveOrderDialog component in `frontend/app/[locale]/(pos)/pos/components/PendingOrders/RetrieveOrderDialog.tsx` (show order details, merge/replace options)
- [ ] **T701** [P] [PO] Create DeleteOrderDialog component in `frontend/app/[locale]/(pos)/pos/components/PendingOrders/DeleteOrderDialog.tsx` (confirmation with reason)

**Shared Components:**

- [ ] **T702** [P] [PO] Create AnimatedPanel component in `frontend/components/shared/AnimatedPanel.tsx` (reusable slide-in panel with backdrop)
- [ ] **T703** [P] [PO] Create EmptyState component in `frontend/components/shared/EmptyState.tsx` (no pending orders, no search results)

---

### POS Page Integration - 8 Tasks

- [ ] **T704** [PO] Update POS page in `frontend/app/[locale]/(pos)/pos/page.tsx` to integrate pending orders panel
- [ ] **T705** [PO] Add "Pending Orders" button with badge to POS page header
- [ ] **T706** [PO] Add "Save Order" button to POS order actions section
- [ ] **T707** [PO] Implement panel open/close state management
- [ ] **T708** [PO] Implement save order workflow: click "Save Order" → open SaveOrderDialog → save → update badge count
- [ ] **T709** [PO] Implement retrieve order workflow: click "Retrieve" → open RetrieveOrderDialog → merge or replace → load into cart
- [ ] **T710** [PO] Implement delete order workflow: click "Delete" → shake animation → DeleteOrderDialog → confirm → remove from list
- [ ] **T711** [PO] Add keyboard shortcuts: Ctrl+Shift+P (open pending orders panel), Ctrl+S (save current order)

---

### State Management & Order Handling - 5 Tasks

- [ ] **T712** [PO] Create useOrderState hook in `frontend/hooks/useOrderState.ts` for managing current order state (items, customer, table, totals)
- [ ] **T713** [PO] Implement merge order logic: combine pending order items with current cart items
- [ ] **T714** [PO] Implement replace order logic: clear current cart, load pending order items
- [ ] **T715** [PO] Handle order conflict: if cart has items when retrieving, show merge/replace dialog
- [ ] **T716** [PO] Implement auto-save current order before replacing (with confirmation)

---

### Styling & Animations - 7 Tasks

- [ ] **T717** [P] [PO] Implement slide-in animation for panel (slideInRight keyframe, 300ms ease-out)
- [ ] **T718** [P] [PO] Implement dialog scale-up animation (scaleUp keyframe, 200ms ease-out)
- [ ] **T719** [P] [PO] Implement card hover lift animation (cardLift keyframe, transform translateY)
- [ ] **T720** [P] [PO] Implement delete shake animation (shake keyframe)
- [ ] **T721** [P] [PO] Implement success pulse animation (successPulse keyframe with box-shadow)
- [ ] **T722** [P] [PO] Add status color system to Tailwind config (parked: green, onhold: amber, draft: gray)
- [ ] **T723** [P] [PO] Implement reduced motion support (@media prefers-reduced-motion)

---

### Responsive Design & Accessibility - 10 Tasks

- [ ] **T724** [PO] Implement responsive panel width (480px desktop, 400px tablet, 100vw mobile)
- [ ] **T725** [PO] Implement touch optimization (48px minimum touch targets, swipe gestures)
- [ ] **T726** [PO] Add swipe-right-to-close gesture for panel on mobile
- [ ] **T727** [PO] Add swipe-left-on-card-to-delete gesture for mobile
- [ ] **T728** [PO] Implement keyboard navigation (Tab order, Enter to confirm, Escape to close)
- [ ] **T729** [PO] Add ARIA labels to all icons and buttons
- [ ] **T730** [PO] Implement live regions for order count announcements (screen reader)
- [ ] **T731** [PO] Add focus management (auto-focus first element in dialogs, return focus on close)
- [ ] **T732** [PO] Ensure WCAG AA color contrast (4.5:1 for text)
- [ ] **T733** [PO] Add visible focus indicators (2px outline on all focusable elements)

---

### Error Handling & Edge Cases - 8 Tasks

- [ ] **T734** [PO] Implement error handling for save failures (show error toast, retry option, save to local storage)
- [ ] **T735** [PO] Implement error handling for load failures (show error message, retry button, show cached data)
- [ ] **T736** [PO] Implement error handling for delete failures (show error toast, refresh list)
- [ ] **T737** [PO] Implement error handling for retrieve failures (order no longer available, refresh list)
- [ ] **T738** [PO] Implement offline mode handling (queue operations, show offline indicator, sync when online)
- [ ] **T739** [PO] Implement expired order handling (show warning 30 mins before expiry, auto-delete after 24h)
- [ ] **T740** [PO] Implement empty states (no pending orders, no search results)
- [ ] **T741** [PO] Handle concurrent edits (show warning if order modified by another user, display last updated timestamp)

---

### Performance Optimization - 7 Tasks

- [ ] **T742** [PO] Implement infinite scroll/pagination (load 10 orders initially, load more on scroll)
- [ ] **T743** [PO] Implement debounced search (300ms delay on search input)
- [ ] **T744** [PO] Implement React Query caching (5-minute stale time for orders)
- [ ] **T745** [PO] Implement optimistic updates (update UI immediately, rollback on error)
- [ ] **T746** [PO] Implement virtual scrolling for large lists (>50 orders) using react-virtual
- [ ] **T747** [PO] Memoize order cards with React.memo
- [ ] **T748** [PO] Lazy load PendingOrdersPanel component with React.lazy

---

### Offline Support & Sync - 6 Tasks

- [ ] **T749** [PO] Extend IndexedDB schema to include pendingOrders table
- [ ] **T750** [PO] Implement save pending order to IndexedDB when offline
- [ ] **T751** [PO] Implement background sync for pending orders (when connection restored)
- [ ] **T752** [PO] Implement conflict resolution for offline pending orders (last write wins)
- [ ] **T753** [PO] Show sync indicator when syncing pending orders
- [ ] **T754** [PO] Handle sync failures (retry with exponential backoff, show error notification)

---

### Analytics & Monitoring - 3 Tasks

- [ ] **T755** [P] [PO] Implement analytics event tracking (pending_order_saved, pending_order_retrieved, pending_order_deleted, pending_order_expired)
- [ ] **T756** [P] [PO] Add metrics tracking (average time pending, retrieval rate, deletion rate, expiry rate, peak pending count)
- [ ] **T757** [P] [PO] Add error monitoring for pending orders (API failures, sync failures, client errors)

---

### Integration & Validation - 24 Tasks

- [ ] **T758** [PO] Test save pending order with full customer info: customer name, phone, table, order type, notes
- [ ] **T759** [PO] Test save pending order with minimal data: anonymous customer, no table, no notes
- [ ] **T760** [PO] Test retrieve pending order (replace mode): clear cart → load pending order → verify cart populated
- [ ] **T761** [PO] Test retrieve pending order (merge mode): existing cart items + pending order items → verify combined
- [ ] **T762** [PO] Test delete pending order: confirm dialog → delete → verify removed from list → verify backend deleted
- [ ] **T763** [PO] Test search pending orders: search by customer name → verify filtered results
- [ ] **T764** [PO] Test filter pending orders by status: filter by "Parked" → verify only parked orders shown
- [ ] **T765** [PO] Test filter pending orders by order type: filter by "Dine In" → verify only dine-in orders shown
- [ ] **T766** [PO] Test pending order expiry: create order → mock 24 hours later → verify auto-deleted
- [ ] **T767** [PO] Test expiry warning: create order → mock 23.5 hours later → verify warning shown
- [ ] **T768** [PO] Test manager view all orders: login as manager → verify sees orders from all cashiers
- [ ] **T769** [PO] Test cashier view own orders: login as cashier → verify sees only own orders
- [ ] **T770** [PO] Test offline save: disconnect network → save pending order → verify saved to IndexedDB
- [ ] **T771** [PO] Test offline sync: offline save → reconnect → verify synced to server → verify removed from IndexedDB
- [ ] **T772** [PO] Test convert to sale: retrieve pending order → complete payment → verify converted to sale → verify pending order deleted
- [ ] **T773** [PO] Test panel animations: open panel → verify smooth slide-in → close panel → verify smooth slide-out
- [ ] **T774** [PO] Test keyboard navigation: Tab through all elements → Enter to confirm → Escape to close
- [ ] **T775** [PO] Test screen reader: enable screen reader → verify all labels announced → verify count updates announced
- [ ] **T776** [PO] Test touch gestures on mobile: swipe right to close panel → swipe left on card to delete
- [ ] **T777** [PO] Test responsive design: resize from desktop → tablet → mobile → verify layout adapts
- [ ] **T778** [PO] Test with 100+ pending orders: verify virtual scrolling → verify performance (no lag)
- [ ] **T779** [PO] Test order conflict handling: cart has items → retrieve pending order → verify merge/replace dialog shown
- [ ] **T780** [PO] Test auto-save current order: cart has items → retrieve pending order (replace) → verify current order auto-saved before replacing
- [ ] **T781** [PO] End-to-end test: create order → save as pending → clear cart → add new items → retrieve pending (merge) → verify combined → complete sale

---

### Documentation - 5 Tasks

- [ ] **T782** [P] [PO] Create pending orders user guide in `docs/PENDING_ORDERS_USER_GUIDE.md`
- [ ] **T783** [P] [PO] Add pending orders section to `docs/USER_GUIDE.md`
- [ ] **T784** [P] [PO] Update API documentation with pending orders endpoints
- [ ] **T785** [P] [PO] Create pending orders workflow diagram
- [ ] **T786** [P] [PO] Update CLAUDE.md with pending orders feature status

---

## Summary

**Total Tasks**: 130 tasks (T657-T786)

**Breakdown by Category**:

1. Tests (TDD): 8 tasks
2. Database & Entities: 6 tasks
3. DTOs: 6 tasks
4. Backend Services: 5 tasks
5. API Endpoints: 8 tasks
6. Frontend Services: 4 tasks
7. Frontend Components: 10 tasks
8. POS Integration: 8 tasks
9. State Management: 5 tasks
10. Styling & Animations: 7 tasks
11. Responsive & Accessibility: 10 tasks
12. Error Handling: 8 tasks
13. Performance: 7 tasks
14. Offline Support: 6 tasks
15. Analytics: 3 tasks
16. Integration Testing: 24 tasks
17. Documentation: 5 tasks

**Parallelizable Tasks**: 28 tasks marked [P]

**Team Allocation** (2 developers, 2-3 weeks):

- **Developer A (Backend)**: ~40 tasks
  - Tests, entities, DTOs, services, endpoints, business logic, auto-expiry

- **Developer B (Frontend)**: ~70 tasks
  - Components, UI, animations, responsive design, accessibility, offline sync

- **Shared**: ~20 tasks
  - Integration testing, documentation

---

## Success Metrics

- ✅ Cashiers can save/retrieve orders in <3 seconds
- ✅ Panel animations smooth at 60fps
- ✅ 95%+ offline sync success rate
- ✅ WCAG AA accessibility compliance
- ✅ Works flawlessly on desktop, tablet, and mobile
- ✅ <1% error rate on operations
- ✅ 80%+ adoption rate within 2 weeks

---

## Dependencies

- Requires Phase 2 (Foundation) complete
- Requires Phase 3 (User Story 1 - Sales) complete
- Can be implemented in parallel with other phases
- Integrates with existing POS page and sales workflow

---

## Future Enhancements (Phase 2 - Not in current scope)

- Order templates for frequently ordered combinations
- Customer history integration (show previous pending orders)
- Order sharing/transfer between cashiers
- Bulk actions (delete/retrieve multiple orders at once)
- Timestamped notes on orders (conversation log)
- SMS notifications when order ready
- QR code for customer order retrieval
- Payment links for pending orders
- Voice commands ("Retrieve order for John Doe")
- Smart suggestions based on customer history

---

## Checkpoint

After completing Phase 15, the Pending Orders feature will be fully functional:

✅ Cashiers can save incomplete orders with customer info
✅ Manage multiple pending orders simultaneously
✅ Retrieve and complete orders with merge/replace options
✅ Offline support with automatic sync
✅ Auto-expiry after 24 hours with warnings
✅ Role-based filtering (cashiers see own, managers see all)
✅ Comprehensive error handling and edge case coverage
✅ Smooth animations and responsive design
✅ Full accessibility support (keyboard, screen reader, touch)
✅ Production-ready with analytics and monitoring

The system will significantly improve workflow efficiency during busy periods, allowing cashiers to handle multiple customers and park incomplete orders seamlessly.
