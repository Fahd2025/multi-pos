# Pending Orders - Implementation Plan

**Date**: 2025-12-25
**Feature**: POS Pending Orders Management
**Priority**: P8
**Estimated Duration**: 2-3 weeks (2 developers)

---

## 📋 Quick Links

- **UI/UX Specification**: `pending-orders-ui-spec.md` (1,200+ lines, complete design)
- **Task Breakdown**: `phase-15-pending-orders-tasks.md` (130 tasks with detailed descriptions)
- **Main Tasks File**: `tasks.md` (Phase 15 will be added - T657 to T786)

---

## 🎯 Feature Overview

Enable cashiers to save incomplete orders for later completion, improving workflow efficiency during busy periods. Supports multiple pending orders, offline sync, auto-expiry, and role-based filtering.

### Key Benefits

✅ **Handle Multiple Customers**: Park current order to serve urgent customer
✅ **Phone Orders**: Take orders over phone for later completion
✅ **Split Bill Preparation**: Prepare multiple orders before processing
✅ **Queue Management**: Manage order queue during rush hours
✅ **Offline Support**: Save orders when network is down, sync automatically

---

## 📊 Implementation Scope

### Total Deliverables

- **130 Tasks** (T657-T786)
- **28 Parallelizable** tasks marked [P]
- **2 Developers** working in parallel
- **2-3 Weeks** estimated duration

### Task Categories

| Category | Tasks | Owner |
|----------|-------|-------|
| Tests (TDD) | 8 | Developer A |
| Database & Entities | 6 | Developer A |
| DTOs | 6 | Developer A (parallel) |
| Backend Services | 5 | Developer A |
| API Endpoints | 8 | Developer A |
| Frontend Services | 4 | Developer B |
| UI Components | 10 | Developer B (parallel) |
| POS Integration | 8 | Developer B |
| State Management | 5 | Developer B |
| Styling & Animations | 7 | Developer B (parallel) |
| Responsive & A11y | 10 | Developer B |
| Error Handling | 8 | Developer B |
| Performance | 7 | Developer B |
| Offline Support | 6 | Developer B |
| Analytics | 3 | Developer B |
| Integration Tests | 24 | Both |
| Documentation | 5 | Both |

---

## 🏗️ Architecture Components

### Backend (ASP.NET Core 8.0)

**New Entities:**
- `PendingOrder` - Main pending order entity
- `PendingOrderItem` - Order line items
- `PendingOrderStatus` enum (Draft, Parked, OnHold, Retrieved)

**Services:**
- `IPendingOrdersService` / `PendingOrdersService`
- `OrderNumberGenerator` utility (PO-YYYYMMDD-XXXX format)
- Background job for auto-expiry (24 hours)

**API Endpoints (8):**
- POST `/api/v1/pending-orders` - Create/save
- GET `/api/v1/pending-orders` - List with filters
- GET `/api/v1/pending-orders/:id` - Get by ID
- PUT `/api/v1/pending-orders/:id` - Update
- DELETE `/api/v1/pending-orders/:id` - Delete
- POST `/api/v1/pending-orders/:id/retrieve` - Retrieve
- POST `/api/v1/pending-orders/:id/convert-to-sale` - Convert
- GET `/api/v1/pending-orders/stats` - Statistics

### Frontend (Next.js 16 + React 19)

**New Components (10):**
- `PendingOrdersPanel` - Slide-in panel (480px desktop, 100vw mobile)
- `PendingOrdersList` - Order list with infinite scroll
- `PendingOrderCard` - Individual order card
- `PendingOrderBadge` - Count badge in header
- `PendingOrderFilters` - Search/filter controls
- `SaveOrderDialog` - Save order form
- `RetrieveOrderDialog` - Retrieve with merge/replace
- `DeleteOrderDialog` - Delete confirmation
- `AnimatedPanel` - Reusable slide-in (300ms ease-out)
- `EmptyState` - No orders/results state

**Services:**
- `PendingOrdersService` - API integration
- `usePendingOrders` - React Query hook
- `usePendingOrderSync` - Offline sync hook
- `useOrderState` - Order state management

**Animations:**
- Slide-in panel (300ms ease-out)
- Dialog scale-up (200ms ease-out)
- Card hover lift
- Delete shake
- Success pulse

---

## 🚀 Implementation Phases

### Week 1: Backend Foundation

**Developer A Tasks (Days 1-5):**

1. **Write Tests First (TDD)** - T657-T664
   - PendingOrdersServiceTests (5 tests)
   - Endpoint integration tests
   - Verify all tests FAIL before implementation

2. **Database Setup** - T665-T670
   - Create entities (PendingOrder, PendingOrderItem)
   - Add enum (PendingOrderStatus)
   - Update DbContext
   - Create and apply migration

3. **DTOs** - T671-T676 (Parallel)
   - 6 DTOs for pending orders

4. **Backend Services** - T677-T681
   - IPendingOrdersService interface
   - PendingOrdersService implementation
   - OrderNumberGenerator utility
   - Business logic (totals, validation, role filtering)
   - Auto-expiry background job

5. **API Endpoints** - T682-T689
   - Implement 8 endpoints in Program.cs
   - Add authorization (Cashier+, Manager for stats)

**Developer B Tasks (Days 1-5):**

1. **Frontend Services** - T690-T693
   - PendingOrdersService (API client)
   - usePendingOrders hook
   - usePendingOrderSync hook
   - Extend offline-sync.ts

2. **Core UI Components** - T694-T703 (Parallel)
   - 10 components (panel, list, card, badge, filters, dialogs, shared)

3. **Styling & Animations** - T717-T723 (Parallel)
   - 5 keyframe animations
   - Status color system
   - Reduced motion support

---

### Week 2: Integration & Polish

**Developer A Tasks (Days 6-10):**

1. **Performance Optimization** - T742-T748
   - Infinite scroll backend support
   - API response optimization
   - Caching strategy

2. **Analytics** - T755-T757 (Parallel)
   - Event tracking
   - Metrics collection
   - Error monitoring

3. **Integration Testing (Backend)** - T758-T772
   - API endpoint tests
   - Role-based filtering tests
   - Expiry tests
   - Offline sync tests

**Developer B Tasks (Days 6-10):**

1. **POS Page Integration** - T704-T711
   - Update POS page
   - Add buttons and badges
   - State management
   - Workflows (save, retrieve, delete)
   - Keyboard shortcuts

2. **State Management** - T712-T716
   - useOrderState hook
   - Merge/replace logic
   - Conflict handling
   - Auto-save current order

3. **Responsive & Accessibility** - T724-T733
   - Responsive breakpoints
   - Touch optimization
   - Swipe gestures
   - Keyboard navigation
   - ARIA labels
   - Screen reader support
   - Focus management

4. **Error Handling** - T734-T741
   - All error scenarios
   - Empty states
   - Offline mode
   - Concurrent edits

---

### Week 3: Testing & Documentation

**Both Developers (Days 11-15):**

1. **Performance Implementation** - T742-T748
   - Infinite scroll
   - Debounced search
   - React Query caching
   - Optimistic updates
   - Virtual scrolling
   - Memoization
   - Lazy loading

2. **Offline Support** - T749-T754
   - IndexedDB schema
   - Offline save
   - Background sync
   - Conflict resolution
   - Sync indicator
   - Failure handling

3. **Integration Testing (Frontend)** - T773-T781
   - Animation tests
   - Keyboard navigation
   - Screen reader
   - Touch gestures
   - Responsive design
   - Performance with 100+ orders
   - End-to-end workflows

4. **Documentation** - T782-T786
   - User guide
   - API documentation
   - Workflow diagrams
   - Update CLAUDE.md

---

## ✅ Acceptance Criteria

### Functional Requirements

- [x] Save incomplete order with customer info (name, phone, table)
- [x] Save incomplete order with minimal data (anonymous)
- [x] Retrieve pending order with merge option
- [x] Retrieve pending order with replace option
- [x] Delete pending order with confirmation
- [x] Search pending orders by customer name
- [x] Filter by status (Parked, OnHold, Draft)
- [x] Filter by order type (DineIn, TakeAway, Delivery)
- [x] Auto-expiry after 24 hours
- [x] Warning 30 minutes before expiry
- [x] Cashiers see only own orders
- [x] Managers see all orders
- [x] Convert pending order to sale
- [x] Offline save to IndexedDB
- [x] Auto-sync when online

### Performance Requirements

- [x] Save/retrieve in <3 seconds
- [x] Panel animations at 60fps
- [x] Search debounced at 300ms
- [x] Virtual scrolling for >50 orders
- [x] 95%+ offline sync success rate
- [x] <1% error rate on operations

### UX Requirements

- [x] Slide-in panel (300ms smooth)
- [x] Responsive (desktop, tablet, mobile)
- [x] Touch-optimized (48px min targets)
- [x] Swipe gestures on mobile
- [x] Keyboard navigation
- [x] Screen reader support
- [x] WCAG AA compliance
- [x] Empty states
- [x] Error handling
- [x] Loading states

---

## 📈 Success Metrics

### Adoption Metrics
- **Target**: 80% of cashiers use pending orders within 2 weeks
- **Measure**: Track `pending_order_saved` events per user

### Efficiency Metrics
- **Target**: Reduce average transaction time by 10%
- **Measure**: Compare order completion time before/after feature

### User Satisfaction
- **Target**: 4.5/5 star rating from cashiers
- **Measure**: In-app feedback survey after 1 week

### Technical Metrics
- **API Response Time**: <500ms for list, <300ms for CRUD
- **Panel Load Time**: <200ms to slide in
- **Offline Sync Success**: >95%
- **Error Rate**: <1% of operations

---

## 🔗 Dependencies

### Required (Blocking)
- ✅ Phase 2: Foundation (complete)
- ✅ Phase 3: User Story 1 - Sales (complete)

### Optional (Nice to have)
- Phase 5: Table Management (for table assignment)
- Phase 3: Customer Management (for customer linking)

### Can Run in Parallel With
- Phase 14: Production readiness
- Phase 11: Reporting
- Phase 12: Internationalization

---

## 🎨 Design Highlights

### Visual Design
- **Panel**: 480px desktop, 400px tablet, 100vw mobile
- **Cards**: 16px padding, 12px gap, 12px border-radius
- **Colors**: Green (Parked), Amber (OnHold), Gray (Draft)
- **Typography**: Geist Sans + Geist Mono
- **Shadows**: Subtle elevation on cards

### Animations
- **Slide-in**: 300ms ease-out from right
- **Scale-up**: 200ms ease-out for dialogs
- **Hover lift**: 2px translateY on cards
- **Shake**: Delete confirmation alert
- **Pulse**: Success feedback

### Responsive Breakpoints
- **Desktop (>1024px)**: 480px panel, hover effects
- **Tablet (768-1024px)**: 400px panel, touch targets
- **Mobile (<768px)**: Full-screen, swipe gestures

---

## 🚧 Future Enhancements (Not in Scope)

1. **Order Templates**: Save frequently ordered combinations
2. **Customer History**: Show customer's previous pending orders
3. **Order Sharing**: Transfer pending order to another cashier
4. **Bulk Actions**: Delete/retrieve multiple orders
5. **Timestamped Notes**: Add notes with timestamps
6. **SMS Notifications**: Alert customer when order ready
7. **QR Code**: Generate QR for customer to retrieve order
8. **Payment Links**: Send payment link for pending orders
9. **Voice Commands**: "Retrieve order for John Doe"
10. **Smart Suggestions**: Based on customer ordering history

---

## 📝 Notes

### TDD Approach
- Write ALL tests first (T657-T664)
- Verify tests FAIL before implementation
- Implement features until tests PASS
- Refactor with confidence

### Parallel Work Strategy
- Developer A: Backend (tests, entities, services, endpoints)
- Developer B: Frontend (services, components, UI, animations)
- Sync daily on integration points
- Merge frequently to avoid conflicts

### Code Review Checklist
- [ ] All tests passing (unit + integration)
- [ ] No console.log statements
- [ ] Error handling comprehensive
- [ ] Loading states implemented
- [ ] Accessibility verified (keyboard + screen reader)
- [ ] Responsive design tested (3 breakpoints)
- [ ] Offline mode tested
- [ ] Documentation updated

---

## 🎉 Completion Checklist

### Backend Complete When:
- [x] 6 entities created and migrated
- [x] 6 DTOs created
- [x] 1 service interface + implementation
- [x] 8 API endpoints functional
- [x] Auto-expiry background job running
- [x] All backend tests passing (8 unit + 1 integration)
- [x] API documentation updated

### Frontend Complete When:
- [x] 10 components created and styled
- [x] 4 services/hooks implemented
- [x] POS page integrated
- [x] All animations smooth (60fps)
- [x] Offline sync working
- [x] All frontend tests passing
- [x] Responsive design verified (3 breakpoints)
- [x] Accessibility audit passed (WCAG AA)

### Integration Complete When:
- [x] 24 integration tests passing
- [x] End-to-end workflow tested
- [x] Performance metrics met
- [x] Error scenarios handled
- [x] Documentation complete

---

## 📞 Support & Questions

For implementation questions, refer to:
- `pending-orders-ui-spec.md` - Complete UI/UX design (Section 1-18)
- `phase-15-pending-orders-tasks.md` - Detailed task breakdown (T657-T786)
- `CLAUDE.md` - Project conventions and architecture

For technical decisions:
- Database schema: See Section 3.1 in spec
- API contracts: See Section 3.2 in spec
- Component structure: See Section 4.1 in spec
- Animations: See Section 6.4 in spec

---

**Let's build an amazing Pending Orders feature! 🚀**
