# Driver Management System - Implementation Plan

**Date:** 2025-12-31
**Status:** Planning Complete
**Duration:** 6 weeks (6 phases)
**Complexity:** Medium-High

---

## Overview

Implement a driver management system integrated with the existing delivery sales workflow. The system will enable manual driver assignment through a dispatch dashboard, with support for driver performance tracking and touch-optimized interfaces across all device sizes.

**Key Design Decisions:**
- ✅ Status-based workflow (no GPS tracking)
- ✅ Manual driver assignment in dispatch dashboard
- ✅ Delivery orders created without driver assignment in POS
- ✅ Touch-optimized for phones, tablets, and desktop
- ✅ Driver mobile app deferred to Phase 2
- ✅ Focus on admin and dispatch interfaces first

## Current State Analysis

**Already Implemented (30%):**
- ✅ Driver entity with complete schema (`Backend/Models/Entities/Branch/Driver.cs`)
  - Basic info: Code, Name (EN/AR), Phone, Email, Address
  - License: Number, expiry, image path
  - Vehicle: Number, type, color, image path
  - Status: IsActive, IsAvailable
  - Performance: TotalDeliveries, AverageRating
  - Navigation: DeliveryOrders collection
- ✅ Driver CRUD endpoints (5 endpoints in `Backend/Endpoints/DriversEndpoints.cs`)
- ✅ DeliveryOrder entity with driver link (`Backend/Models/Entities/Branch/DeliveryOrder.cs`)
- ✅ Frontend delivery service (`frontend/services/delivery.service.ts`)

**To Implement (70%):**
- ❌ Driver performance tracking entity
- ❌ Admin interface for driver management
- ❌ Dispatch dashboard for manual assignment
- ❌ POS integration (delivery without driver)
- ❌ Extended driver service methods
- ❌ Frontend components and hooks
- ❌ Touch-optimized responsive UI

---

## Phase 1: Backend Foundation (Week 1)

### 1.1 Create DriverPerformance Entity

**File:** `Backend/Models/Entities/Branch/DriverPerformance.cs`

```csharp
public class DriverPerformance
{
    public Guid Id { get; set; }
    public Guid DriverId { get; set; }
    public Guid DeliveryOrderId { get; set; }
    public int DeliveryTimeMinutes { get; set; }
    public decimal? CustomerRating { get; set; } // 1-5 stars
    public string? CustomerFeedback { get; set; }
    public bool OnTime { get; set; }
    public DateTime RecordedAt { get; set; }

    // Navigation
    public Driver Driver { get; set; } = null!;
    public DeliveryOrder DeliveryOrder { get; set; } = null!;
}
```

**Purpose:** Track individual delivery performance for driver evaluation and analytics.

### 1.2 Database Migration

**Commands:**
```bash
cd Backend
dotnet ef migrations add AddDriverPerformanceTracking --context BranchDbContext --output-dir Migrations/Branch
dotnet ef database update --context BranchDbContext
```

**Update:** `Backend/Data/BranchDbContext.cs`
```csharp
public DbSet<DriverPerformance> DriverPerformances { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // ... existing configurations ...

    modelBuilder.Entity<DriverPerformance>(entity =>
    {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.CustomerRating).HasPrecision(3, 2);
        entity.Property(e => e.CustomerFeedback).HasMaxLength(500);

        entity.HasOne(e => e.Driver)
            .WithMany()
            .HasForeignKey(e => e.DriverId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.DeliveryOrder)
            .WithMany()
            .HasForeignKey(e => e.DeliveryOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasIndex(e => e.DriverId);
        entity.HasIndex(e => e.RecordedAt);
    });
}
```

### 1.3 Create Performance DTOs

**File:** `Backend/Models/DTOs/Branch/Drivers/DriverPerformanceDtos.cs`

```csharp
// Response DTO
public class DriverPerformanceDto
{
    public Guid Id { get; set; }
    public Guid DeliveryOrderId { get; set; }
    public string OrderNumber { get; set; } = "";
    public int DeliveryTimeMinutes { get; set; }
    public decimal? CustomerRating { get; set; }
    public string? CustomerFeedback { get; set; }
    public bool OnTime { get; set; }
    public DateTime RecordedAt { get; set; }
}

// Stats aggregate DTO
public class DriverStatsDto
{
    public Guid DriverId { get; set; }
    public int TotalDeliveries { get; set; }
    public int CompletedDeliveries { get; set; }
    public int FailedDeliveries { get; set; }
    public decimal AverageRating { get; set; }
    public int AverageDeliveryTimeMinutes { get; set; }
    public decimal OnTimePercentage { get; set; }
    public int ActiveDeliveries { get; set; }
}

// Create performance record
public class RecordPerformanceDto
{
    public Guid DeliveryOrderId { get; set; }
    public int DeliveryTimeMinutes { get; set; }
    public decimal? CustomerRating { get; set; }
    public string? CustomerFeedback { get; set; }
    public bool OnTime { get; set; }
}
```

### 1.4 Extend DriverService

**File:** `Backend/Services/Branch/Drivers/IDriverService.cs`

Add methods:
```csharp
// Availability
Task<DriverDto> UpdateDriverAvailabilityAsync(Guid driverId, bool isAvailable, string branchCode);
Task<IEnumerable<DriverDto>> GetAvailableDriversAsync(string branchCode);

// Performance
Task<DriverPerformanceDto> RecordDeliveryPerformanceAsync(RecordPerformanceDto dto, string branchCode);
Task<DriverStatsDto> GetDriverStatsAsync(Guid driverId, DateTime? from, DateTime? to, string branchCode);
Task<IEnumerable<DriverPerformanceDto>> GetDriverPerformanceHistoryAsync(Guid driverId, int page, int pageSize, string branchCode);

// Workload
Task<int> GetDriverActiveDeliveriesCountAsync(Guid driverId, string branchCode);
```

**File:** `Backend/Services/Branch/Drivers/DriverService.cs`

Implement methods:
- `UpdateDriverAvailabilityAsync`: Toggle IsAvailable flag, audit trail
- `GetAvailableDriversAsync`: Filter IsActive=true AND IsAvailable=true
- `RecordDeliveryPerformanceAsync`: Create DriverPerformance record, update Driver.AverageRating
- `GetDriverStatsAsync`: Aggregate performance data with date filtering
- `GetDriverPerformanceHistoryAsync`: Paginated performance list with order details
- `GetDriverActiveDeliveriesCountAsync`: Count DeliveryOrders with status Assigned or OutForDelivery

### 1.5 Extend DriversEndpoints

**File:** `Backend/Endpoints/DriversEndpoints.cs`

Add endpoints:
```csharp
// Availability
group.MapPut("/{id:guid}/availability", UpdateAvailabilityAsync)
    .RequireAuthorization(policy => policy.RequireRole("Admin", "Manager"))
    .WithName("UpdateDriverAvailability");

group.MapGet("/available", GetAvailableDriversAsync)
    .RequireAuthorization()
    .WithName("GetAvailableDrivers");

// Performance
group.MapPost("/performance", RecordPerformanceAsync)
    .RequireAuthorization()
    .WithName("RecordDriverPerformance");

group.MapGet("/{id:guid}/stats", GetDriverStatsAsync)
    .RequireAuthorization()
    .WithName("GetDriverStats");

group.MapGet("/{id:guid}/performance", GetPerformanceHistoryAsync)
    .RequireAuthorization()
    .WithName("GetDriverPerformanceHistory");

// Workload
group.MapGet("/{id:guid}/active-count", GetActiveDeliveriesCountAsync)
    .RequireAuthorization()
    .WithName("GetDriverActiveDeliveriesCount");
```

### 1.6 Extend DeliveryOrderService

**File:** `Backend/Services/Branch/DeliveryOrders/IDeliveryOrderService.cs`

Add methods:
```csharp
Task<IEnumerable<DeliveryOrderDto>> GetUnassignedDeliveriesAsync(string branchCode);
Task<IEnumerable<DeliveryOrderDto>> GetActiveDeliveriesByDriverAsync(Guid driverId, string branchCode);
Task<DeliveryOrderDto> AssignDriverAsync(Guid deliveryOrderId, Guid driverId, Guid userId, string branchCode);
Task<DeliveryOrderDto> UnassignDriverAsync(Guid deliveryOrderId, string reason, Guid userId, string branchCode);
```

**File:** `Backend/Services/Branch/DeliveryOrders/DeliveryOrderService.cs`

Implement methods:
- `GetUnassignedDeliveriesAsync`: Filter DriverId == null, Status = Pending
- `GetActiveDeliveriesByDriverAsync`: Filter by DriverId, Status IN (Assigned, OutForDelivery)
- `AssignDriverAsync`: Update DriverId, set Status = Assigned, validate driver availability
- `UnassignDriverAsync`: Clear DriverId, set Status = Pending, log reason

### 1.7 Extend DeliveryOrderEndpoints

**File:** `Backend/Endpoints/DeliveryOrderEndpoints.cs`

Add endpoints:
```csharp
group.MapGet("/unassigned", GetUnassignedAsync)
    .RequireAuthorization()
    .WithName("GetUnassignedDeliveries");

group.MapGet("/driver/{driverId:guid}/active", GetActiveByDriverAsync)
    .RequireAuthorization()
    .WithName("GetActiveDeliveriesByDriver");

group.MapPost("/{id:guid}/assign", AssignDriverAsync)
    .RequireAuthorization(policy => policy.RequireRole("Admin", "Manager", "Cashier"))
    .WithName("AssignDriver");

group.MapPost("/{id:guid}/unassign", UnassignDriverAsync)
    .RequireAuthorization(policy => policy.RequireRole("Admin", "Manager"))
    .WithName("UnassignDriver");
```

### 1.8 Register Services

**File:** `Backend/Program.cs`

Ensure services are registered:
```csharp
builder.Services.AddScoped<IDriverService, DriverService>();
builder.Services.AddScoped<IDeliveryOrderService, DeliveryOrderService>();
```

---

## Phase 2: Admin Interface - Driver Management (Week 2)

### 2.1 Frontend Services

**File:** `frontend/services/driver.service.ts`

```typescript
import api from './api';
import type { DriverDto, CreateDriverDto, UpdateDriverDto, DriverStatsDto, DriverPerformanceDto } from '@/types/api.types';

class DriverService {
  private basePath = '/api/v1/drivers';

  async getAll(): Promise<DriverDto[]> {
    const response = await api.get(this.basePath);
    return response.data.data;
  }

  async getById(id: string): Promise<DriverDto> {
    const response = await api.get(`${this.basePath}/${id}`);
    return response.data.data;
  }

  async create(dto: CreateDriverDto): Promise<DriverDto> {
    const response = await api.post(this.basePath, dto);
    return response.data.data;
  }

  async update(id: string, dto: UpdateDriverDto): Promise<DriverDto> {
    const response = await api.put(`${this.basePath}/${id}`, dto);
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<DriverDto> {
    const response = await api.put(`${this.basePath}/${id}/availability`, { isAvailable });
    return response.data.data;
  }

  async getAvailable(): Promise<DriverDto[]> {
    const response = await api.get(`${this.basePath}/available`);
    return response.data.data;
  }

  async getStats(id: string, from?: Date, to?: Date): Promise<DriverStatsDto> {
    const params = new URLSearchParams();
    if (from) params.append('from', from.toISOString());
    if (to) params.append('to', to.toISOString());
    const response = await api.get(`${this.basePath}/${id}/stats?${params}`);
    return response.data.data;
  }

  async getPerformanceHistory(id: string, page = 1, pageSize = 20): Promise<DriverPerformanceDto[]> {
    const response = await api.get(`${this.basePath}/${id}/performance?page=${page}&pageSize=${pageSize}`);
    return response.data.data;
  }

  async getActiveCount(id: string): Promise<number> {
    const response = await api.get(`${this.basePath}/${id}/active-count`);
    return response.data.data;
  }
}

export default new DriverService();
```

### 2.2 Custom Hooks

**File:** `frontend/hooks/useDrivers.ts`

```typescript
import useSWR from 'swr';
import driverService from '@/services/driver.service';

export function useDrivers() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/v1/drivers',
    () => driverService.getAll(),
    { revalidateOnFocus: true, dedupingInterval: 30000 }
  );

  return {
    drivers: data,
    isLoading,
    isError: error,
    mutate
  };
}

export function useDriver(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/v1/drivers/${id}` : null,
    () => id ? driverService.getById(id) : null
  );

  return {
    driver: data,
    isLoading,
    isError: error,
    mutate
  };
}

export function useAvailableDrivers() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/v1/drivers/available',
    () => driverService.getAvailable(),
    { refreshInterval: 10000 } // 10s refresh
  );

  return {
    drivers: data,
    isLoading,
    isError: error,
    mutate
  };
}

export function useDriverStats(id: string | null, from?: Date, to?: Date) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/v1/drivers/${id}/stats` : null,
    () => id ? driverService.getStats(id, from, to) : null
  );

  return {
    stats: data,
    isLoading,
    isError: error,
    mutate
  };
}
```

### 2.3 Type Definitions

**File:** `frontend/types/api.types.ts`

Add types (extend existing file):
```typescript
export interface DriverDto {
  id: string;
  code: string;
  nameEn: string;
  nameAr?: string;
  phone: string;
  email?: string;
  address?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  licenseImagePath?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  vehicleColor?: string;
  vehicleImagePath?: string;
  profileImagePath?: string;
  isActive: boolean;
  isAvailable: boolean;
  totalDeliveries: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDriverDto {
  code: string;
  nameEn: string;
  nameAr?: string;
  phone: string;
  email?: string;
  address?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  vehicleColor?: string;
  isAvailable?: boolean;
}

export interface UpdateDriverDto extends CreateDriverDto {
  isActive?: boolean;
}

export interface DriverStatsDto {
  driverId: string;
  totalDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  averageRating: number;
  averageDeliveryTimeMinutes: number;
  onTimePercentage: number;
  activeDeliveries: number;
}

export interface DriverPerformanceDto {
  id: string;
  deliveryOrderId: string;
  orderNumber: string;
  deliveryTimeMinutes: number;
  customerRating?: number;
  customerFeedback?: string;
  onTime: boolean;
  recordedAt: string;
}
```

### 2.4 Admin Page

**File:** `frontend/app/[locale]/branch/drivers/page.tsx`

Main driver management page with list, filters, and add/edit modals. Touch-optimized with 48px minimum targets.

### 2.5 Driver List Component

**File:** `frontend/components/branch/drivers/DriverList.tsx`

Responsive grid (1-4 columns) with search and status filters.

### 2.6 Driver Card Component

**File:** `frontend/components/branch/drivers/DriverCard.tsx`

Touch-optimized card with:
- Profile image with fallback initials
- Name, phone, vehicle info
- Availability toggle (48px height)
- Status badges
- Performance stats
- Edit button (48px × 48px)

### 2.7 Driver Form Modal

**File:** `frontend/components/branch/drivers/DriverFormModal.tsx`

Full-screen modal on mobile, sidebar on desktop. All form fields with 48px min-height inputs.

---

## Phase 3: Dispatch Dashboard - Manual Assignment (Week 3)

### 3.1 Extend Delivery Service

**File:** `frontend/services/delivery.service.ts`

Add assignment methods for unassigned deliveries, active deliveries by driver, and assign/unassign operations.

### 3.2 Custom Hooks

**File:** `frontend/hooks/useDeliveryQueue.ts`

Real-time hooks with 10-second auto-refresh for delivery queue and driver deliveries.

### 3.3 Dispatch Page

**File:** `frontend/app/[locale]/branch/dispatch/page.tsx`

Two-panel layout:
- Left: Pending deliveries queue
- Right: Available drivers list
- Assignment modal for manual selection

### 3.4 Delivery Queue Component

**File:** `frontend/components/branch/dispatch/DeliveryQueue.tsx`

Sorted by priority and creation time, with assign button per delivery.

### 3.5 Available Drivers List Component

**File:** `frontend/components/branch/dispatch/AvailableDriversList.tsx`

Shows available drivers with workload, rating, and vehicle info.

### 3.6 Assignment Modal Component

**File:** `frontend/components/branch/dispatch/AssignmentModal.tsx`

Touch-optimized modal for selecting driver, with confirmation step. Full-screen on mobile, sidebar on desktop.

---

## Phase 4: POS Integration (Week 4)

### 4.1 Update DeliveryForm Component

Remove driver selection from POS - deliveries created without driver assignment.

### 4.2 Update Sales Creation Flow

Ensure delivery orders are created with status "Pending" and no driver assigned.

### 4.3 Update Receipt Template

Add delivery info section showing "Driver assignment pending" status.

---

## Phase 5: Touch Optimization & Responsive Design (Week 5)

### 5.1 Global Touch Styles

WCAG AAA compliance:
- 48px × 48px minimum touch targets
- 12px spacing between elements
- Active state feedback
- Clear focus indicators

### 5.2 Responsive Breakpoints

Support for phones (< 640px), tablets (640-1024px), and desktop (> 1024px).

### 5.3 Mobile-Specific Enhancements

- Bottom sheets for modals on mobile
- Large touch buttons (56px primary, 48px secondary)
- Pull-to-refresh
- Skeleton loaders

---

## Phase 6: Testing & Polish (Week 6)

### 6.1 Backend Testing

- Driver CRUD, availability, performance tracking
- Delivery assignment/unassignment
- Stats calculation

### 6.2 Frontend Testing

Test on multiple devices and screen sizes.

### 6.3 Touch Device Testing

Physical device testing for tap accuracy and gesture support.

### 6.4 Performance Optimization

- Lazy loading
- Image optimization
- Debounced search
- SWR caching

### 6.5 Error Handling

Comprehensive error states with retry options.

---

## Critical Files Summary

### Backend Files to Create (3 files)
1. `Backend/Models/Entities/Branch/DriverPerformance.cs`
2. `Backend/Models/DTOs/Branch/Drivers/DriverPerformanceDtos.cs`
3. `Backend/Migrations/Branch/XXXXXX_AddDriverPerformanceTracking.cs`

### Backend Files to Modify (7 files)
4. `Backend/Data/BranchDbContext.cs`
5. `Backend/Services/Branch/Drivers/IDriverService.cs`
6. `Backend/Services/Branch/Drivers/DriverService.cs`
7. `Backend/Endpoints/DriversEndpoints.cs`
8. `Backend/Services/Branch/DeliveryOrders/IDeliveryOrderService.cs`
9. `Backend/Services/Branch/DeliveryOrders/DeliveryOrderService.cs`
10. `Backend/Endpoints/DeliveryOrderEndpoints.cs`

### Frontend Files to Create (15+ files)
11. `frontend/services/driver.service.ts`
12. `frontend/hooks/useDrivers.ts`
13. `frontend/hooks/useDeliveryQueue.ts`
14. `frontend/app/[locale]/branch/drivers/page.tsx`
15. `frontend/app/[locale]/branch/dispatch/page.tsx`
16. `frontend/components/branch/drivers/DriverList.tsx`
17. `frontend/components/branch/drivers/DriverCard.tsx`
18. `frontend/components/branch/drivers/DriverFormModal.tsx`
19. `frontend/components/branch/drivers/DriverStatsCard.tsx`
20. `frontend/components/branch/dispatch/DeliveryQueue.tsx`
21. `frontend/components/branch/dispatch/AvailableDriversList.tsx`
22. `frontend/components/branch/dispatch/AssignmentModal.tsx`
23. `frontend/components/shared/DeliveryStatusBadge.tsx`
24. `frontend/components/shared/PriorityBadge.tsx`

### Frontend Files to Modify (2 files)
25. `frontend/types/api.types.ts`
26. `frontend/services/delivery.service.ts`

---

## Implementation Timeline

| Week | Phase | Key Deliverables |
|------|-------|------------------|
| 1 | Backend Foundation | DriverPerformance entity, migrations, extended services, API endpoints |
| 2 | Admin Interface | Driver management page, CRUD operations, stats display |
| 3 | Dispatch Dashboard | Manual assignment interface, real-time queue, driver workload |
| 4 | POS Integration | Delivery without driver, receipt updates, workflow adjustments |
| 5 | Touch Optimization | Responsive design, touch targets, mobile enhancements |
| 6 | Testing & Polish | Device testing, performance optimization, UAT |

---

## Success Criteria

**Week 2 Checkpoint:**
- ✅ Admin can create/edit/delete drivers
- ✅ Admin can view driver stats
- ✅ Admin can toggle driver availability

**Week 3 Checkpoint:**
- ✅ Dispatcher sees pending deliveries
- ✅ Dispatcher sees available drivers
- ✅ Dispatcher can assign driver to delivery
- ✅ Real-time queue updates every 10 seconds

**Week 4 Checkpoint:**
- ✅ POS creates delivery orders without driver
- ✅ Receipt shows delivery info with pending status
- ✅ End-to-end flow: POS → Delivery → Dispatch → Assign

**Week 6 Final:**
- ✅ All interfaces work on phones, tablets, and desktop
- ✅ Touch targets meet 48px minimum
- ✅ Real-time updates work reliably
- ✅ Performance is smooth on all devices
- ✅ Error handling is comprehensive
- ✅ UAT approved by stakeholders

---

## Navigation & Access

Add to branch menu:
```typescript
{
  label: "Drivers",
  href: "/branch/drivers",
  icon: TruckIcon,
  roles: ["Admin", "Manager"]
},
{
  label: "Dispatch",
  href: "/branch/dispatch",
  icon: ClipboardListIcon,
  roles: ["Admin", "Manager", "Cashier"]
}
```

---

## Future Enhancements (Post-MVP)

**Phase 2 - Driver Mobile App:**
- Driver login and authentication
- View assigned deliveries
- Update delivery status
- Navigation integration
- Push notifications

**Phase 3 - Advanced Features:**
- GPS location tracking
- Embedded maps
- Driver shift management
- Automatic driver assignment
- Route optimization
- Delivery time predictions
- Customer SMS notifications

---

## Notes

- **Manual Assignment:** Dispatcher has full control over driver selection
- **No GPS:** Status-based workflow (Pending → Assigned → Out for Delivery → Delivered)
- **Touch-First:** All components optimized for touchscreens
- **Real-time:** 10-second polling for dispatch, 30-second for admin
- **Scalability:** System supports 10-50 drivers, 100+ deliveries/day
- **Existing Foundation:** 30% already built (Driver entity, basic endpoints)

This plan delivers a production-ready driver management system integrated seamlessly with your existing multi-POS architecture while maintaining simplicity and excellent usability across all device sizes.
