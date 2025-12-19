# Delivery Management System Implementation Plan

## Goal Description

To integrate a comprehensive Delivery Management System into the existing Next.js POS application. This system will enable staff to manage delivery orders directly from the POS interface, including assigning drivers, tracking order status, and filtering orders, while ensuring a premium and responsive user experience.

## Clarifying Questions & Specifications

The following questions (based on your request) have been analyzed. I have provided **Proposed Specifications** for the initial implementation plan. Please review and confirm these assumptions.

1.  **What specific order statuses should be included?**
    - _Proposed Spec_: `Pending`, `Preparing`, `Ready`, `Out for Delivery`, `Delivered`, `Failed`.
2.  **How do you envision the process for assigning a driver? Automated or manual?**
    - _Proposed Spec_: Manual assignment via a dropdown/modal in the Delivery Manager. Future iterations can include auto-assignment logic.
3.  **What types of delivery time calculations are required?**
    - _Proposed Spec_:
      - **Checkout Time**: Timestamp when order is created.
      - **Estimated Delivery Time**: Manual input (e.g., "45 mins") or simple calculation (Time + Standard Prep Time + Standard Travel Time). Real-time traffic (Google Maps API) added in Phase 2.
4.  **What details need to be displayed for each order when printing?**
    - _Proposed Spec_: Customer Name, Phone, Delivery Address, Order Items, Subtotal, Tax, Delivery Fee, Total, Driver Name (if assigned).
5.  **What specific filters are most important?**
    - _Proposed Spec_:
      - **Date Range**: "Today", "Yesterday", Custom Range.
      - **Status**: Multi-select (e.g., see "Ready" and "Out for Delivery").
      - **Driver**: Filter by assigned driver.
6.  **Are there specific icons or color schemes?**
    - _Proposed Spec_: Use the existing HSL color palette.
      - `Pending`: Neutral/Yellow
      - `Preparing`: Blue
      - `Ready`: Green
      - `Out for Delivery`: Orange/Purple
      - `Delivered`: Success Green
      - `Failed`: Red
    - Icons: Use `lucide-react` (Truck, MapPin, User, CheckCircle).
7.  **What devices should the POS system be optimized for?**
    - _Proposed Spec_: Responsive web design focusing on Tablets (iPad) and Desktop monitors. Mobile support for simple status checks.
8.  **Are there any accessibility considerations?**
    - _Proposed Spec_: WCAG 2.1 compliance (color contrast, ARIA labels, keyboard navigation).
9.  **What data source will be used?**
    - _Proposed Spec_: Existing Backend API. We will need to extend `SaleDto` and `CreateSaleDto` or create a parallel `Delivery` entity.
10. **What is the expected volume of orders?**
    - _Proposed Spec_: System designed for typical restaurant delivery volume (up to 100s/day). Pagination and efficient filtering will be implemented.

## Proposed Changes

### Backend (Data & API)

- **Update Data Models**:
  - Extend `Sale` entity to include: `DeliveryAddress`, `DriverId`, `EstimatedDeliveryTime`, `DeliveryStatus`, `DeliveryFee`.
  - Create `Driver` entity (or use specialized `User` role).
- **API Endpoints**:
  - `GET /api/v1/sales/deliveries`: Filterable endpoint for delivery dashboard.
  - `PATCH /api/v1/sales/{id}/delivery-status`: Update status.
  - `PATCH /api/v1/sales/{id}/assign-driver`: Assign driver.

### Frontend (User Interface)

#### [NEW] DeliveryManagerModal

- A full-screen specific modal or overlay accessible from the `TopBar` "Delivery" button.
- **Features**:
  - **Kanban or List View**: To see orders by status.
  - **Filter Bar**: Date, Status, Driver filters.
  - **Order Card**: Shows essential info (Order #, Time, Customer, Status Badge).
  - **Detail View**: Clicking a card opens full details with actions (Assign Driver, Print, Change Status).

#### [MODIFY] OrderPanel.tsx & TopBar.tsx

- **Order Type Selector**: Add toggle for "Dine-in" / "Takeaway" / "Delivery".
- **Delivery Form**: If "Delivery" is selected, prompt for Customer Info (Address, Phone) before checkout.
- **Navigation**: Wire up the `handleDeliveryManagement` button in `TopBar.tsx` to open the new `DeliveryManagerModal`.

#### [MODIFY] Shared Components

- **StatusBadge**: Update to support delivery statuses.
- **Icons**: Import necessary icons (`Truck`, `MapPin`, `Navigation`) from `lucide-react`.

## Technology Recommendations

- **State Management**: React Context or Zustand (if already in use) for managing the "Delivery Dashboard" state.
- **UI Library**: Continue using custom CSS modules (`.module.css`) to match the "Premium" aesthetic. Use `framer-motion` for smooth layout transitions (dragging orders between statuses or simple fade-ins).
- **Date Handling**: `date-fns` for robust time calculations and formatting.
- **Icons**: `lucide-react`.

## Timeline & Milestones

| Phase                    | Duration | Tasks                                                               |
| :----------------------- | :------- | :------------------------------------------------------------------ |
| **1. Foundation**        | 1-2 Days | Backend schema updates, API endpoints for deliveries/drivers.       |
| **2. UI Implementation** | 2-3 Days | Create `DeliveryManagerModal`, Order Cards, Filter logic.           |
| **3. Integration**       | 1-2 Days | Connect UI to API, Update POS `OrderPanel` for delivery creation.   |
| **4. Polish & Testing**  | 1-2 Days | Animations, Responsiveness check, Error handling, Print formatting. |

## Verification Plan

### Automated Tests

- **Unit Tests**: Test generic helper functions (e.g., `calculateDeliveryTime`, filter logic).
- **Component Tests**: Render `DeliveryManagerModal` and verify filter interactions.

### Manual Verification

1.  **Create Delivery Order**: Go to POS > Select Delivery > Add Items > Add Customer Address > Checkout.
2.  **View in Manager**: Open Delivery Manager > Verify new order appears in "Pending".
3.  **Process Order**: Assign Driver > Change Status to "Out for Delivery" > Verify visual update.
4.  **Filters**: Apply "Delivered" filter > Verify only delivered orders show.
5.  **Print**: Click Print > Verify address and driver info appears.
