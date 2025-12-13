# Task List: Delivery Management System

## Phase 1: Foundation (Backend & Schemas)

- [ ] Update `SaleDto` and `CreateSaleDto` in `types/api.types.ts` to include delivery fields:
  - `deliveryAddress`
  - `driverId`
  - `estimatedDeliveryTime`
  - `deliveryStatus`
  - `deliveryFee`
- [ ] Create `DriverDto` and related types in `types/api.types.ts`.
- [ ] Define API service methods in `services/sales.service.ts` (or similar):
  - `getDeliveryOrders()`
  - `updateDeliveryStatus()`
  - `assignDriver()`

## Phase 2: UI Implementation (Frontend)

- [ ] Create `DeliveryManagerModal` component structure.
  - [ ] Implement layout (Header, Filter Bar, Content Area).
  - [ ] Create `OrderCard` component for the list/board view.
  - [ ] Implement `DeliveryDetailView` for full order details.
- [ ] Implement `DeliveryFilters` component.
  - [ ] Date range picker.
  - [ ] Status multi-select.
  - [ ] Driver selector.
- [ ] Add new icons to `lucide-react` imports (Truck, MapPin, etc.).
- [ ] Update `StatusBadge` component to support delivery statuses (`Pending`, `Preparing`, `Ready`, `Out for Delivery`, `Delivered`).

## Phase 3: Integration

- [ ] Update `TopBar.tsx` to add "Delivery" button and open `DeliveryManagerModal`.
- [ ] Update `OrderPanel.tsx` to include "Order Type" toggle (Dine-in / Takeaway / Delivery).
  - [ ] Add hidden form or modal for collecting Customer Address during delivery checkout.
- [ ] Integrate API services with `DeliveryManagerModal` to fetch and display real data.
- [ ] Implement "Assign Driver" functionality using the API.

## Phase 4: Polish & Testing

- [ ] Implement animations for modal opening and list updates using `framer-motion` (or CSS).
- [ ] Responsive design checks (Tablet/Desktop).
- [ ] Verify "Print Invoice" includes new delivery details.
- [ ] Manual test: End-to-end delivery flow.
