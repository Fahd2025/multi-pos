# Tasks: Multi-Branch Point of Sale System

**Input**: Design documents from `/specs/001-multi-branch-pos/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included based on the test strategy defined in research.md Section 7

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `Backend/` directory (ASP.NET Core 8.0)
- **Frontend**: `frontend/` directory (Next.js 16)
- **Tests**: `Backend/Tests/` and `frontend/__tests__/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Install Backend NuGet packages per quickstart.md (EF Core, JWT, ImageSharp, Swashbuckle, xUnit, Moq, FluentAssertions)
- [X] T002 [P] Install Frontend NPM packages per quickstart.md (Next.js 16, React 19, Tailwind CSS v4, next-intl, SWR, Zod, React Hook Form, Jest, RTL, MSW)
- [X] T003 [P] Configure TypeScript strict mode in frontend/tsconfig.json
- [X] T004 [P] Configure ESLint and Prettier in frontend/
- [X] T005 [P] Configure Tailwind CSS v4 in frontend/tailwind.config.ts
- [X] T006 [P] Configure Next.js for internationalization in frontend/next.config.js and frontend/i18n.ts
- [X] T007 [P] Create English translation file in frontend/public/locales/en/common.json
- [X] T008 [P] Create Arabic translation file in frontend/public/locales/ar/common.json
- [X] T009 [P] Create Next.js middleware for i18n routing in frontend/middleware.ts
- [X] T010 [P] Configure C# nullable reference types in Backend/Backend.csproj
- [X] T011 [P] Create TypeScript enumerations in frontend/types/enums.ts (InvoiceType, PaymentMethod, DiscountType, DatabaseProvider, UserRole, etc.)
- [X] T012 [P] Create shared constants file in frontend/lib/constants.ts for API routes and static text

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Foundation

- [X] T013 Create HeadOfficeDbContext in Backend/Data/HeadOfficeDbContext.cs with User, Branch, BranchUser, RefreshToken, MainSetting, AuditLog, UserActivityLog entities
- [X] T014 Create BranchDbContext in Backend/Data/BranchDbContext.cs with Category, Product, ProductImage, Sale, SaleLineItem, Customer, Supplier, Purchase, PurchaseLineItem, Expense, ExpenseCategory, Setting, SyncQueue entities
- [X] T015 Create DbContextFactory in Backend/Data/DbContextFactory.cs with multi-provider support (SQLite, MSSQL, PostgreSQL, MySQL)
- [X] T016 Create EF Core migration for HeadOfficeDb using `dotnet ef migrations add InitialCreate --context HeadOfficeDbContext`
- [X] T017 Apply HeadOfficeDb migration using `dotnet ef database update --context HeadOfficeDbContext`

### Entity Models - Head Office

- [X] T018 [P] Create Branch entity in Backend/Models/Entities/HeadOffice/Branch.cs per data-model.md
- [X] T019 [P] Create User entity in Backend/Models/Entities/HeadOffice/User.cs per data-model.md
- [X] T020 [P] Create BranchUser entity in Backend/Models/Entities/HeadOffice/BranchUser.cs per data-model.md
- [X] T021 [P] Create RefreshToken entity in Backend/Models/Entities/HeadOffice/RefreshToken.cs per data-model.md
- [X] T022 [P] Create MainSetting entity in Backend/Models/Entities/HeadOffice/MainSetting.cs per data-model.md
- [X] T023 [P] Create AuditLog entity in Backend/Models/Entities/HeadOffice/AuditLog.cs per data-model.md
- [X] T024 [P] Create UserActivityLog entity in Backend/Models/Entities/HeadOffice/UserActivityLog.cs per data-model.md

### Entity Models - Branch

- [X] T025 [P] Create Category entity in Backend/Models/Entities/Branch/Category.cs per data-model.md
- [X] T026 [P] Create Product entity in Backend/Models/Entities/Branch/Product.cs per data-model.md
- [X] T027 [P] Create ProductImage entity in Backend/Models/Entities/Branch/ProductImage.cs per data-model.md
- [X] T028 [P] Create Sale entity in Backend/Models/Entities/Branch/Sale.cs per data-model.md
- [X] T029 [P] Create SaleLineItem entity in Backend/Models/Entities/Branch/SaleLineItem.cs per data-model.md
- [X] T030 [P] Create Customer entity in Backend/Models/Entities/Branch/Customer.cs per data-model.md
- [X] T031 [P] Create Supplier entity in Backend/Models/Entities/Branch/Supplier.cs per data-model.md
- [X] T032 [P] Create Purchase entity in Backend/Models/Entities/Branch/Purchase.cs per data-model.md
- [X] T033 [P] Create PurchaseLineItem entity in Backend/Models/Entities/Branch/PurchaseLineItem.cs per data-model.md
- [X] T034 [P] Create Expense entity in Backend/Models/Entities/Branch/Expense.cs per data-model.md
- [X] T035 [P] Create ExpenseCategory entity in Backend/Models/Entities/Branch/ExpenseCategory.cs per data-model.md
- [X] T036 [P] Create Setting entity in Backend/Models/Entities/Branch/Setting.cs per data-model.md
- [X] T037 [P] Create SyncQueue entity in Backend/Models/Entities/Branch/SyncQueue.cs per data-model.md

### Authentication & Security Foundation

- [X] T038 Implement IJwtTokenService interface in Backend/Services/Auth/IJwtTokenService.cs
- [X] T039 Implement JwtTokenService in Backend/Services/Auth/JwtTokenService.cs with GenerateAccessToken, GenerateRefreshToken, ValidateRefreshToken, RevokeRefreshToken methods
- [X] T040 Implement IAuthService interface in Backend/Services/Auth/IAuthService.cs
- [X] T041 Implement AuthService in Backend/Services/Auth/AuthService.cs with LoginAsync, LogoutAsync, RefreshTokenAsync, TechnicalLoginAsync methods
- [X] T042 Create PasswordHasher utility in Backend/Utilities/PasswordHasher.cs using BCrypt
- [X] T043 Configure JWT authentication in Backend/Program.cs (AddAuthentication, AddJwtBearer)
- [X] T044 Configure Swagger with JWT bearer authorization in Backend/Program.cs
- [X] T045 Seed default admin user (branch: "all", username: "admin", password: "123") in HeadOfficeDb

### Middleware Foundation

- [X] T046 [P] Create ErrorHandlingMiddleware in Backend/Middleware/ErrorHandlingMiddleware.cs for global exception handling
- [X] T047 [P] Create BranchContextMiddleware in Backend/Middleware/BranchContextMiddleware.cs to extract branch from JWT and set HttpContext
- [X] T048 Register middleware in Backend/Program.cs (UseErrorHandling, UseBranchContext)

### Frontend Authentication Foundation

- [X] T049 Create API base client in frontend/services/api.ts with axios configuration and interceptors
- [X] T050 Create AuthService in frontend/services/auth.service.ts with login, logout, refreshToken, getMe methods per contracts/auth.md
- [X] T051 Create useAuth custom hook in frontend/hooks/useAuth.ts for authentication state management
- [X] T052 Create auth helper functions in frontend/lib/auth.ts (token storage, redirect logic)
- [X] T053 Create login page in frontend/app/page.tsx with branch selection, username, password fields
- [X] T054 Create root layout in frontend/app/layout.tsx with font configuration

### Frontend Type Definitions

- [X] T055 [P] Create API types in frontend/types/api.types.ts (LoginRequest, LoginResponse, ApiResponse, PaginationResponse, etc.)
- [X] T056 [P] Create entity types in frontend/types/entities.types.ts matching backend entities

### Shared UI Components (Foundation)

- [X] T057 [P] Create Button component in frontend/components/shared/Button.tsx
- [X] T058 [P] Create Modal component in frontend/components/shared/Modal.tsx
- [X] T059 [P] Create Dialog component in frontend/components/shared/Dialog.tsx
- [X] T060 [P] Create DataTable component in frontend/components/shared/DataTable.tsx with sorting, filtering, pagination
- [X] T061 [P] Create Form components in frontend/components/shared/Form/ (Input, Select, Checkbox, FormError, FormLabel)
- [X] T062 [P] Create Layout components in frontend/components/shared/Layout/ (Header, Sidebar, Footer)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Branch Sales Operations (Priority: P1) 🎯 MVP

**Goal**: Enable branch staff to process sales transactions quickly with product selection, pricing calculation, payment processing, and invoice generation (Touch and Standard invoices). Support both online and offline operation with automatic sync.

**Independent Test**: Complete sale transactions from product selection through payment and invoice generation in both online and offline modes. Test both Touch Sales Invoices (anonymous) and Standard Sales Invoices (with customer). Test offline by disconnecting network, processing sales, reconnecting, and verifying automatic synchronization.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T063 [P] [US1] Create SalesServiceTests in Backend.UnitTests/Services/SalesServiceTests.cs with CreateSale_ValidSale_ReturnsSaleWithCalculatedTotals test
- [X] T064 [P] [US1] Create SalesServiceTests concurrent sales test in Backend.UnitTests/Services/SalesServiceTests.cs for inventory conflict handling
- [X] T065 [P] [US1] Create sales endpoint integration tests in Backend.IntegrationTests/Endpoints/SalesEndpointsTests.cs testing POST /api/v1/sales, GET /api/v1/sales, GET /api/v1/sales/:id
- [X] T066 [P] [US1] Create offline sync tests in frontend/__tests__/lib/offline-sync.test.ts testing queue, sync, retry, chronological ordering
- [X] T067 [P] [US1] Create SalesForm component test in frontend/__tests__/components/SalesForm.test.tsx

### DTOs for User Story 1

- [X] T068 [P] [US1] Create CreateSaleDto in Backend/Models/DTOs/Sales/CreateSaleDto.cs
- [X] T069 [P] [US1] Create SaleDto in Backend/Models/DTOs/Sales/SaleDto.cs
- [X] T070 [P] [US1] Create SaleLineItemDto in Backend/Models/DTOs/Sales/SaleLineItemDto.cs
- [X] T071 [P] [US1] Create VoidSaleDto in Backend/Models/DTOs/Sales/VoidSaleDto.cs

### Backend Services for User Story 1

- [X] T072 [US1] Implement ISalesService interface in Backend/Services/Sales/ISalesService.cs
- [X] T073 [US1] Implement SalesService in Backend/Services/Sales/SalesService.cs with CreateSaleAsync, GetSalesAsync, GetSaleByIdAsync, VoidSaleAsync, GetSalesStatsAsync methods
- [X] T074 [US1] Implement InvoiceNumberGenerator utility in Backend/Utilities/InvoiceNumberGenerator.cs for sequential invoice numbers per branch
- [X] T075 [US1] Add sales business logic: calculate subtotal, tax, discounts, total, update inventory (last-commit-wins), flag negative stock, update customer stats

### API Endpoints for User Story 1

- [X] T076 [US1] Implement POST /api/v1/sales endpoint in Backend/Program.cs per contracts/sales.md
- [X] T077 [US1] Implement GET /api/v1/sales endpoint with filtering and pagination in Backend/Program.cs per contracts/sales.md
- [X] T078 [US1] Implement GET /api/v1/sales/:id endpoint in Backend/Program.cs per contracts/sales.md
- [X] T079 [US1] Implement POST /api/v1/sales/:id/void endpoint in Backend/Program.cs per contracts/sales.md (manager only)
- [X] T080 [US1] Implement GET /api/v1/sales/:id/invoice endpoint in Backend/Program.cs with PDF/HTML/JSON formats
- [X] T081 [US1] Implement GET /api/v1/sales/stats endpoint in Backend/Program.cs per contracts/sales.md

### Frontend Services for User Story 1

- [X] T082 [US1] Create SalesService in frontend/services/sales.service.ts with createSale, getSales, getSaleById, voidSale, getInvoice, getSalesStats methods

### Offline Sync Implementation for User Story 1

- [X] T083 [US1] Create IndexedDB offline queue in frontend/lib/offline-sync.ts with init, add, getPending, syncAll, syncTransaction methods per research.md Section 3
- [X] T084 [US1] Create useOfflineSync hook in frontend/hooks/useOfflineSync.ts to manage sync state and trigger background sync
- [X] T085 [US1] Implement ISyncService interface in Backend/Services/Sync/ISyncService.cs
- [X] T086 [US1] Implement SyncService in Backend/Services/Sync/SyncService.cs with ProcessOfflineTransaction, ProcessOfflineSale methods (last-commit-wins conflict resolution)
- [X] T087 [US1] Implement POST /api/v1/sync/transaction endpoint in Backend/Program.cs per contracts/sync.md
- [X] T088 [US1] Implement POST /api/v1/sync/batch endpoint in Backend/Program.cs for bulk sync
- [X] T089 [US1] Implement GET /api/v1/sync/status endpoint in Backend/Program.cs

### Frontend UI for User Story 1

- [X] T090 [US1] Create branch dashboard layout in frontend/app/[locale]/branch/layout.tsx with navigation
- [X] T091 [US1] Create branch home page in frontend/app/[locale]/branch/page.tsx
- [X] T092 [US1] Create sales page in frontend/app/[locale]/branch/sales/page.tsx with product search, line items list, payment section
- [X] T093 [US1] Create ProductSearch component in frontend/components/sales/ProductSearch.tsx
- [X] T094 [US1] Create SaleLineItemsList component in frontend/components/sales/SaleLineItemsList.tsx with quantity, discount controls
- [X] T095 [US1] Create PaymentSection component in frontend/components/sales/PaymentSection.tsx with payment method selection, invoice type selection
- [X] T096 [US1] Create InvoiceDisplay component in frontend/components/sales/InvoiceDisplay.tsx for Touch and Standard invoice formats
- [X] T097 [US1] Create SyncStatusIndicator component in frontend/components/shared/SyncStatusIndicator.tsx (green/yellow/red based on online/syncing/offline status)
- [X] T098 [US1] Add offline detection logic to sales page (navigator.onLine, periodic API ping)
- [X] T099 [US1] Add automatic sync trigger on connectivity restoration

### Integration & Validation for User Story 1

- [ ] T100 [US1] Integrate offline queue with sales page: queue transactions when offline, sync when online
- [ ] T101 [US1] Test sales flow end-to-end: select products → apply discounts → process payment → generate invoice (Touch and Standard)
- [ ] T102 [US1] Test offline mode: disconnect network → create sale → reconnect → verify sync
- [ ] T103 [US1] Test concurrent sales conflict: simulate two cashiers selling last unit → verify last-commit-wins → verify negative inventory flag → verify manager alert
- [ ] T104 [US1] Verify invoice reprinting works for both Touch and Standard formats
- [ ] T105 [US1] Verify sale voiding restores inventory correctly

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Sales can be processed online and offline with automatic sync.

---

## Phase 4: User Story 2 - Inventory Management (Priority: P2)

**Goal**: Enable branch managers to manage product inventory (add products, organize by categories, update stock, track suppliers, record purchases). Proactive inventory control and stockout prevention.

**Independent Test**: Create product categories, add products with stock quantities, record supplier information, track purchase orders. Verify inventory visibility, low stock alerts, and automatic stock updates from sales/purchases.

### Tests for User Story 2

- [ ] T106 [P] [US2] Create InventoryServiceTests in Backend.UnitTests/Services/InventoryServiceTests.cs testing product CRUD and stock adjustments
- [ ] T107 [P] [US2] Create inventory endpoint integration tests in Backend.IntegrationTests/Endpoints/InventoryEndpointsTests.cs

### DTOs for User Story 2

- [X] T108 [P] [US2] Create CategoryDto in Backend/Models/DTOs/Inventory/CategoryDto.cs
- [X] T109 [P] [US2] Create ProductDto in Backend/Models/DTOs/Inventory/ProductDto.cs
- [X] T110 [P] [US2] Create CreateProductDto in Backend/Models/DTOs/Inventory/CreateProductDto.cs
- [X] T111 [P] [US2] Create UpdateProductDto in Backend/Models/DTOs/Inventory/UpdateProductDto.cs
- [X] T112 [P] [US2] Create StockAdjustmentDto in Backend/Models/DTOs/Inventory/StockAdjustmentDto.cs
- [X] T113 [P] [US2] Create PurchaseDto in Backend/Models/DTOs/Inventory/PurchaseDto.cs

### Backend Services for User Story 2

- [X] T114 [US2] Implement IInventoryService interface in Backend/Services/Inventory/IInventoryService.cs
- [X] T115 [US2] Implement InventoryService in Backend/Services/Inventory/InventoryService.cs with GetProductsAsync, CreateProductAsync, UpdateProductAsync, DeleteProductAsync, AdjustStockAsync, GetCategoriesAsync, CreateCategoryAsync, CreatePurchaseAsync, CheckLowStockAsync methods

### API Endpoints for User Story 2

- [X] T116 [US2] Implement GET /api/v1/categories endpoint in Backend/Program.cs
- [X] T117 [US2] Implement POST /api/v1/categories endpoint in Backend/Program.cs
- [X] T118 [US2] Implement PUT /api/v1/categories/:id endpoint in Backend/Program.cs
- [X] T119 [US2] Implement DELETE /api/v1/categories/:id endpoint in Backend/Program.cs
- [X] T120 [US2] Implement GET /api/v1/products endpoint with filtering, search, pagination in Backend/Program.cs per contracts/products.md
- [X] T121 [US2] Implement POST /api/v1/products endpoint in Backend/Program.cs per contracts/products.md
- [X] T122 [US2] Implement PUT /api/v1/products/:id endpoint in Backend/Program.cs per contracts/products.md
- [X] T123 [US2] Implement DELETE /api/v1/products/:id endpoint in Backend/Program.cs per contracts/products.md
- [X] T124 [US2] Implement POST /api/v1/products/:id/adjust-stock endpoint in Backend/Program.cs for manual stock adjustments
- [X] T125 [US2] Implement GET /api/v1/purchases endpoint in Backend/Program.cs
- [X] T126 [US2] Implement POST /api/v1/purchases endpoint in Backend/Program.cs
- [X] T127 [US2] Implement POST /api/v1/purchases/:id/receive endpoint in Backend/Program.cs to mark purchase received and update stock

### Frontend Services for User Story 2

- [ ] T128 [US2] Create InventoryService in frontend/services/inventory.service.ts with product and category CRUD methods

### Frontend UI for User Story 2

- [ ] T129 [US2] Create inventory page in frontend/app/[locale]/branch/inventory/page.tsx with product list, search, filters
- [ ] T130 [US2] Create categories management page in frontend/app/[locale]/branch/inventory/categories/page.tsx
- [ ] T131 [US2] Create product form modal in frontend/components/inventory/ProductFormModal.tsx for add/edit product
- [ ] T132 [US2] Create category form modal in frontend/components/inventory/CategoryFormModal.tsx
- [ ] T133 [US2] Create stock adjustment modal in frontend/components/inventory/StockAdjustmentModal.tsx
- [ ] T134 [US2] Create purchases page in frontend/app/[locale]/branch/purchases/page.tsx
- [ ] T135 [US2] Create purchase form modal in frontend/components/inventory/PurchaseFormModal.tsx
- [ ] T136 [US2] Add low stock badge/indicator to product list
- [ ] T137 [US2] Add inventory dashboard widget showing low stock count, total products, total categories

### Integration & Validation for User Story 2

- [ ] T138 [US2] Test category CRUD operations
- [ ] T139 [US2] Test product CRUD operations with category assignment
- [ ] T140 [US2] Test stock adjustment workflow
- [ ] T141 [US2] Test purchase order workflow: create purchase → mark received → verify stock updated
- [ ] T142 [US2] Verify low stock alerts appear when stock < MinStockThreshold
- [ ] T143 [US2] Verify sales (from US1) automatically decrease stock

**Checkpoint**: User Stories 1 AND 2 should both work independently. Sales update inventory, inventory can be managed separately.

---

## Phase 5: User Story 3 - Customer Relationship Management (Priority: P3)

**Goal**: Enable branch staff to maintain customer records, track purchase history, manage loyalty programs. Sales are anonymous by default with optional customer linking.

**Independent Test**: Create customer profiles, optionally associate sales with customers, view purchase history, track customer metrics (total spend, visit count). Verify anonymous sales work without customer.

### Tests for User Story 3

- [ ] T144 [P] [US3] Create CustomerServiceTests in Backend.UnitTests/Services/CustomerServiceTests.cs
- [ ] T145 [P] [US3] Create customer endpoint integration tests in Backend.IntegrationTests/Endpoints/CustomerEndpointsTests.cs

### DTOs for User Story 3

- [ ] T146 [P] [US3] Create CustomerDto in Backend/Models/DTOs/Customers/CustomerDto.cs
- [ ] T147 [P] [US3] Create CreateCustomerDto in Backend/Models/DTOs/Customers/CreateCustomerDto.cs
- [ ] T148 [P] [US3] Create UpdateCustomerDto in Backend/Models/DTOs/Customers/UpdateCustomerDto.cs

### Backend Services for User Story 3

- [ ] T149 [US3] Implement ICustomerService interface in Backend/Services/Customers/ICustomerService.cs
- [ ] T150 [US3] Implement CustomerService in Backend/Services/Customers/CustomerService.cs with GetCustomersAsync, CreateCustomerAsync, UpdateCustomerAsync, DeleteCustomerAsync, GetCustomerPurchaseHistoryAsync, UpdateCustomerStatsAsync methods

### API Endpoints for User Story 3

- [ ] T151 [US3] Implement GET /api/v1/customers endpoint with search, pagination in Backend/Program.cs per contracts/customers.md
- [ ] T152 [US3] Implement POST /api/v1/customers endpoint in Backend/Program.cs per contracts/customers.md
- [ ] T153 [US3] Implement PUT /api/v1/customers/:id endpoint in Backend/Program.cs per contracts/customers.md
- [ ] T154 [US3] Implement DELETE /api/v1/customers/:id endpoint in Backend/Program.cs per contracts/customers.md
- [ ] T155 [US3] Implement GET /api/v1/customers/:id/history endpoint in Backend/Program.cs to retrieve purchase history

### Frontend Services for User Story 3

- [ ] T156 [US3] Create CustomerService in frontend/services/customer.service.ts with CRUD and history methods

### Frontend UI for User Story 3

- [ ] T157 [US3] Create customers page in frontend/app/[locale]/branch/customers/page.tsx with customer list, search
- [ ] T158 [US3] Create customer form modal in frontend/components/customers/CustomerFormModal.tsx
- [ ] T159 [US3] Create customer details page in frontend/app/[locale]/branch/customers/[id]/page.tsx showing profile and purchase history
- [ ] T160 [US3] Add customer search/link component to sales page for linking customer to sale
- [ ] T161 [US3] Add customer analytics widget to dashboard (top customers, total customers, new customers this month)

### Integration & Validation for User Story 3

- [ ] T162 [US3] Test customer CRUD operations
- [ ] T163 [US3] Test customer linking to sale: create sale with customer → verify customer stats updated (TotalPurchases, VisitCount, LastVisitAt)
- [ ] T164 [US3] Test anonymous sale (no customer): verify sale completes without customer
- [ ] T165 [US3] Test customer purchase history display
- [ ] T166 [US3] Verify sale voiding (from US1) decrements customer stats correctly

**Checkpoint**: All three user stories (Sales, Inventory, Customers) should now be independently functional with proper integration.

---

## Phase 6: User Story 4 - Expense Tracking (Priority: P4)

**Goal**: Enable branch managers to record and categorize business expenses (rent, utilities, salaries, supplies) for financial visibility and cost control.

**Independent Test**: Create expense categories, record expense transactions with amounts and dates, view expense reports by category and time period.

### DTOs for User Story 4

- [ ] T167 [P] [US4] Create ExpenseDto in Backend/Models/DTOs/Expenses/ExpenseDto.cs
- [ ] T168 [P] [US4] Create CreateExpenseDto in Backend/Models/DTOs/Expenses/CreateExpenseDto.cs
- [ ] T169 [P] [US4] Create ExpenseCategoryDto in Backend/Models/DTOs/Expenses/ExpenseCategoryDto.cs

### Backend Services for User Story 4

- [ ] T170 [US4] Implement IExpenseService interface in Backend/Services/Expenses/IExpenseService.cs
- [ ] T171 [US4] Implement ExpenseService in Backend/Services/Expenses/ExpenseService.cs with GetExpensesAsync, CreateExpenseAsync, UpdateExpenseAsync, DeleteExpenseAsync, ApproveExpenseAsync, GetExpenseCategoriesAsync, CreateExpenseCategoryAsync methods

### API Endpoints for User Story 4

- [ ] T172 [US4] Implement GET /api/v1/expenses endpoint with filtering by category, date range in Backend/Program.cs per contracts/expenses.md
- [ ] T173 [US4] Implement POST /api/v1/expenses endpoint in Backend/Program.cs per contracts/expenses.md
- [ ] T174 [US4] Implement PUT /api/v1/expenses/:id endpoint in Backend/Program.cs per contracts/expenses.md
- [ ] T175 [US4] Implement DELETE /api/v1/expenses/:id endpoint in Backend/Program.cs per contracts/expenses.md
- [ ] T176 [US4] Implement POST /api/v1/expenses/:id/approve endpoint in Backend/Program.cs (manager only)
- [ ] T177 [US4] Implement GET /api/v1/expense-categories endpoint in Backend/Program.cs
- [ ] T178 [US4] Implement POST /api/v1/expense-categories endpoint in Backend/Program.cs

### Frontend Services for User Story 4

- [ ] T179 [US4] Create ExpenseService in frontend/services/expense.service.ts

### Frontend UI for User Story 4

- [ ] T180 [US4] Create expenses page in frontend/app/[locale]/branch/expenses/page.tsx with expense list, filters
- [ ] T181 [US4] Create expense form modal in frontend/components/expenses/ExpenseFormModal.tsx
- [ ] T182 [US4] Create expense categories page in frontend/app/[locale]/branch/expenses/categories/page.tsx
- [ ] T183 [US4] Add expense summary widget to dashboard (total expenses this month, by category breakdown)

### Integration & Validation for User Story 4

- [ ] T184 [US4] Test expense category CRUD
- [ ] T185 [US4] Test expense CRUD operations
- [ ] T186 [US4] Test expense approval workflow
- [ ] T187 [US4] Verify expense reports show correct totals by category and time period

**Checkpoint**: Core branch operations complete (Sales, Inventory, Customers, Expenses all functional).

---

## Phase 7: User Story 5 - Head Office Branch Management (Priority: P5)

**Goal**: Enable head office administrators to manage all branches centrally (create branches, configure settings, manage database connections, oversee branch users). Centralized control and multi-branch scalability.

**Independent Test**: Create branch records, configure branch-specific settings (tax rates, currency, regional preferences), manage branch users, view multi-branch consolidated dashboards.

### DTOs for User Story 5

- [ ] T188 [P] [US5] Create BranchDto in Backend/Models/DTOs/Branches/BranchDto.cs
- [ ] T189 [P] [US5] Create CreateBranchDto in Backend/Models/DTOs/Branches/CreateBranchDto.cs
- [ ] T190 [P] [US5] Create UpdateBranchDto in Backend/Models/DTOs/Branches/UpdateBranchDto.cs
- [ ] T191 [P] [US5] Create BranchSettingsDto in Backend/Models/DTOs/Branches/BranchSettingsDto.cs

### Backend Services for User Story 5

- [ ] T192 [US5] Implement IBranchService interface in Backend/Services/Branches/IBranchService.cs
- [ ] T193 [US5] Implement BranchService in Backend/Services/Branches/BranchService.cs with GetBranchesAsync, CreateBranchAsync, UpdateBranchAsync, DeleteBranchAsync, GetBranchSettingsAsync, UpdateBranchSettingsAsync, TestDatabaseConnectionAsync, ProvisionBranchDatabaseAsync methods
- [ ] T194 [US5] Add branch database provisioning logic: create database using DbContextFactory, run migrations, seed sample data (categories, products, customers, suppliers)

### API Endpoints for User Story 5

- [ ] T195 [US5] Implement GET /api/v1/branches endpoint in Backend/Program.cs (head office admin only) per contracts/branches.md
- [ ] T196 [US5] Implement POST /api/v1/branches endpoint in Backend/Program.cs (head office admin only) per contracts/branches.md
- [ ] T197 [US5] Implement PUT /api/v1/branches/:id endpoint in Backend/Program.cs (head office admin only) per contracts/branches.md
- [ ] T198 [US5] Implement DELETE /api/v1/branches/:id endpoint in Backend/Program.cs (head office admin only) per contracts/branches.md
- [ ] T199 [US5] Implement GET /api/v1/branches/:id/settings endpoint in Backend/Program.cs per contracts/branches.md
- [ ] T200 [US5] Implement PUT /api/v1/branches/:id/settings endpoint in Backend/Program.cs per contracts/branches.md
- [ ] T201 [US5] Implement POST /api/v1/branches/:id/test-connection endpoint in Backend/Program.cs to validate database connection

### Frontend Services for User Story 5

- [ ] T202 [US5] Create BranchService in frontend/services/branch.service.ts

### Frontend UI for User Story 5

- [ ] T203 [US5] Create head office layout in frontend/app/[locale]/head-office/layout.tsx
- [ ] T204 [US5] Create head office home page in frontend/app/[locale]/head-office/page.tsx with multi-branch dashboard (total sales across branches, active branches, total users)
- [ ] T205 [US5] Create branches management page in frontend/app/[locale]/head-office/branches/page.tsx with branch list
- [ ] T206 [US5] Create branch form modal in frontend/components/head-office/BranchFormModal.tsx with database provider selection, connection string builder
- [ ] T207 [US5] Create branch details page in frontend/app/[locale]/head-office/branches/[id]/page.tsx showing branch info, settings, users, database status
- [ ] T208 [US5] Create branch settings form in frontend/components/head-office/BranchSettingsForm.tsx (tax rate, currency, language, date format, timezone)
- [ ] T209 [US5] Create database connection test component in frontend/components/head-office/DatabaseConnectionTest.tsx
- [ ] T210 [US5] Create multi-branch analytics page in frontend/app/[locale]/head-office/analytics/page.tsx with consolidated sales, inventory, revenue charts

### Integration & Validation for User Story 5

- [ ] T211 [US5] Test branch CRUD operations (head office admin)
- [ ] T212 [US5] Test branch database provisioning: create branch → provision database → verify migrations run → verify sample data seeded
- [ ] T213 [US5] Test database connection test with all 4 providers (SQLite, MSSQL, PostgreSQL, MySQL)
- [ ] T214 [US5] Test branch settings update: change tax rate → verify reflected in branch operations
- [ ] T215 [US5] Verify multi-branch dashboard shows consolidated data from all branches

**Checkpoint**: Head office can manage multiple branches with centralized control.

---

## Phase 8: User Story 6 - User Management & Access Control (Priority: P6)

**Goal**: Enable administrators to manage user accounts, assign roles (admin, manager, cashier), control permissions, ensure secure access. RBAC enforcement across all endpoints.

**Independent Test**: Create users with different roles, assign to branches, verify role-based permissions work (cashier cannot void sales, manager can approve expenses, head office admin can create branches).

### DTOs for User Story 6

- [ ] T216 [P] [US6] Create UserDto in Backend/Models/DTOs/Users/UserDto.cs
- [ ] T217 [P] [US6] Create CreateUserDto in Backend/Models/DTOs/Users/CreateUserDto.cs
- [ ] T218 [P] [US6] Create UpdateUserDto in Backend/Models/DTOs/Users/UpdateUserDto.cs
- [ ] T219 [P] [US6] Create AssignBranchDto in Backend/Models/DTOs/Users/AssignBranchDto.cs

### Backend Services for User Story 6

- [ ] T220 [US6] Implement IUserService interface in Backend/Services/Users/IUserService.cs
- [ ] T221 [US6] Implement UserService in Backend/Services/Users/UserService.cs with GetUsersAsync, CreateUserAsync, UpdateUserAsync, DeleteUserAsync, DeactivateUserAsync, AssignBranchAsync, RemoveBranchAssignmentAsync, GetUserActivityAsync methods
- [ ] T222 [US6] Implement IAuditService interface in Backend/Services/Audit/IAuditService.cs
- [ ] T223 [US6] Implement AuditService in Backend/Services/Audit/AuditService.cs with LogAsync, LogActivityAsync, GetUserAuditTrailAsync, GetUserRecentActivityAsync methods (circular buffer for activity logs)
- [ ] T224 [US6] Integrate AuditService with all critical operations (sales, inventory changes, user management, branch changes)

### API Endpoints for User Story 6

- [ ] T225 [US6] Implement GET /api/v1/users endpoint in Backend/Program.cs with role-based filtering per contracts/users.md
- [ ] T226 [US6] Implement POST /api/v1/users endpoint in Backend/Program.cs (admin only) per contracts/users.md
- [ ] T227 [US6] Implement PUT /api/v1/users/:id endpoint in Backend/Program.cs per contracts/users.md
- [ ] T228 [US6] Implement DELETE /api/v1/users/:id endpoint in Backend/Program.cs (admin only) per contracts/users.md
- [ ] T229 [US6] Implement POST /api/v1/users/:id/assign-branch endpoint in Backend/Program.cs per contracts/users.md
- [ ] T230 [US6] Implement DELETE /api/v1/users/:id/branches/:branchId endpoint in Backend/Program.cs
- [ ] T231 [US6] Implement GET /api/v1/users/:id/activity endpoint in Backend/Program.cs (last 100 activities)
- [ ] T232 [US6] Implement GET /api/v1/audit/logs endpoint in Backend/Program.cs (admin only) per contracts/audit.md
- [ ] T233 [US6] Implement GET /api/v1/audit/user/:userId endpoint in Backend/Program.cs per contracts/audit.md

### Frontend Services for User Story 6

- [ ] T234 [US6] Create UserService in frontend/services/user.service.ts

### Frontend UI for User Story 6

- [ ] T235 [US6] Create users management page in frontend/app/[locale]/head-office/users/page.tsx (head office admin)
- [ ] T236 [US6] Create user form modal in frontend/components/head-office/UserFormModal.tsx with role selection, branch assignments
- [ ] T237 [US6] Create user details page in frontend/app/[locale]/head-office/users/[id]/page.tsx showing profile, branch assignments, activity log
- [ ] T238 [US6] Create branch users page in frontend/app/[locale]/branch/settings/users/page.tsx (branch manager can view/manage branch users)
- [ ] T239 [US6] Add role-based UI hiding (hide features not accessible to current user role)

### Authorization Enforcement

- [ ] T240 [US6] Add role-based authorization attributes to all endpoints (RequireRole: HeadOfficeAdmin, BranchManager, Cashier)
- [ ] T241 [US6] Test cashier permissions: cannot void sales, cannot manage inventory, cannot view reports
- [ ] T242 [US6] Test manager permissions: can void sales, can manage inventory, can view reports, cannot manage branches
- [ ] T243 [US6] Test head office admin permissions: full access to all features including cross-branch operations

### Integration & Validation for User Story 6

- [ ] T244 [US6] Test user CRUD operations
- [ ] T245 [US6] Test branch assignment workflow: assign user to branch → verify user sees branch in login
- [ ] T246 [US6] Test role enforcement: cashier attempts to void sale → verify 403 Forbidden
- [ ] T247 [US6] Test audit logging: perform critical action → verify audit log entry created with correct details
- [ ] T248 [US6] Test user activity log: perform 150 actions → verify only last 100 retained (circular buffer)

**Checkpoint**: Full RBAC implemented, all user stories respect role-based permissions.

---

## Phase 9: User Story 7 - Supplier Management (Priority: P7)

**Goal**: Enable branch managers to maintain supplier records, track contact information, manage supplier relationships, associate suppliers with purchase orders. Enhanced procurement management.

**Independent Test**: Create supplier profiles, record contact information, link suppliers to purchase transactions, view supplier purchase history.

### DTOs for User Story 7

- [ ] T249 [P] [US7] Create SupplierDto in Backend/Models/DTOs/Suppliers/SupplierDto.cs
- [ ] T250 [P] [US7] Create CreateSupplierDto in Backend/Models/DTOs/Suppliers/CreateSupplierDto.cs
- [ ] T251 [P] [US7] Create UpdateSupplierDto in Backend/Models/DTOs/Suppliers/UpdateSupplierDto.cs

### Backend Services for User Story 7

- [ ] T252 [US7] Implement ISupplierService interface in Backend/Services/Suppliers/ISupplierService.cs
- [ ] T253 [US7] Implement SupplierService in Backend/Services/Suppliers/SupplierService.cs with GetSuppliersAsync, CreateSupplierAsync, UpdateSupplierAsync, DeleteSupplierAsync, GetSupplierPurchaseHistoryAsync methods

### API Endpoints for User Story 7

- [ ] T254 [US7] Implement GET /api/v1/suppliers endpoint in Backend/Program.cs per contracts/suppliers.md
- [ ] T255 [US7] Implement POST /api/v1/suppliers endpoint in Backend/Program.cs per contracts/suppliers.md
- [ ] T256 [US7] Implement PUT /api/v1/suppliers/:id endpoint in Backend/Program.cs per contracts/suppliers.md
- [ ] T257 [US7] Implement DELETE /api/v1/suppliers/:id endpoint in Backend/Program.cs per contracts/suppliers.md
- [ ] T258 [US7] Implement GET /api/v1/suppliers/:id/history endpoint in Backend/Program.cs (purchase history)

### Frontend Services for User Story 7

- [ ] T259 [US7] Create SupplierService in frontend/services/supplier.service.ts

### Frontend UI for User Story 7

- [ ] T260 [US7] Create suppliers page in frontend/app/[locale]/branch/suppliers/page.tsx
- [ ] T261 [US7] Create supplier form modal in frontend/components/suppliers/SupplierFormModal.tsx
- [ ] T262 [US7] Create supplier details page in frontend/app/[locale]/branch/suppliers/[id]/page.tsx with purchase history
- [ ] T263 [US7] Update purchase form to include supplier selection dropdown

### Integration & Validation for User Story 7

- [ ] T264 [US7] Test supplier CRUD operations
- [ ] T265 [US7] Test supplier-purchase linking: create purchase with supplier → verify supplier history shows purchase
- [ ] T266 [US7] Verify products can have default supplier assigned

**Checkpoint**: All 7 user stories implemented and functional independently.

---

## Phase 10: Image Management & Optimization

**Purpose**: Enable image uploads for products, categories, customers, suppliers, branches, expenses with automatic optimization and multi-size generation.

- [ ] T267 [P] Implement IImageService interface in Backend/Services/Images/IImageService.cs
- [ ] T268 [P] Implement ImageService in Backend/Services/Images/ImageService.cs using SixLabors.ImageSharp per research.md Section 5 (UploadImageAsync, DeleteImageAsync, GenerateThumbnails)
- [ ] T269 [P] Create ImageOptimizer utility in Backend/Utilities/ImageOptimizer.cs for WebP conversion and resizing
- [ ] T270 [P] Implement POST /api/v1/images/upload endpoint in Backend/Program.cs with multipart form data support
- [ ] T271 [P] Implement GET /api/v1/images/:branchName/:entityType/:entityId/:size endpoint in Backend/Program.cs to serve images
- [ ] T272 [P] Implement DELETE /api/v1/images/:id endpoint in Backend/Program.cs
- [ ] T273 [P] Create OptimizedImage component in frontend/components/shared/OptimizedImage.tsx with lazy loading and size selection
- [ ] T274 Add image upload to product form (multiple images support)
- [ ] T275 Add image upload to category form (single image)
- [ ] T276 Add image upload to customer form (logo)
- [ ] T277 Add image upload to supplier form (logo)
- [ ] T278 Add image upload to branch form (branch logo)
- [ ] T279 Add image upload to expense form (receipt image)
- [ ] T280 Create Uploads directory structure per plan.md and add to .gitignore
- [ ] T281 Test image upload workflow: upload → verify thumbnails generated → verify images served correctly
- [ ] T282 Test image deletion: delete entity → verify orphaned images cleaned up

---

## Phase 11: Reporting & Analytics

**Purpose**: Enable comprehensive reports for sales, inventory, financial data with export capabilities (PDF, Excel, CSV).

- [ ] T283 [P] Implement IReportService interface in Backend/Services/Reports/IReportService.cs
- [ ] T284 [P] Implement ReportService in Backend/Services/Reports/ReportService.cs with GenerateSalesReport, GenerateInventoryReport, GenerateFinancialReport, ExportReport methods
- [ ] T285 [P] Implement GET /api/v1/reports/sales endpoint in Backend/Program.cs with date range, branch filters per contracts/reports.md
- [ ] T286 [P] Implement GET /api/v1/reports/inventory endpoint in Backend/Program.cs
- [ ] T287 [P] Implement GET /api/v1/reports/financial endpoint in Backend/Program.cs
- [ ] T288 [P] Implement POST /api/v1/reports/export endpoint in Backend/Program.cs (PDF, Excel, CSV generation)
- [ ] T289 Create reports page in frontend/app/[locale]/branch/reports/page.tsx with report type selection, date range picker, filters
- [ ] T290 Create ReportViewer component in frontend/components/reports/ReportViewer.tsx with charts (sales trend, top products, revenue breakdown)
- [ ] T291 Add export buttons for PDF, Excel, CSV
- [ ] T292 Create head office consolidated reports page in frontend/app/[locale]/head-office/analytics/page.tsx (cross-branch reports)
- [ ] T293 Test sales report generation with various filters
- [ ] T294 Test inventory report (low stock, stock movements, product performance)
- [ ] T295 Test financial report (revenue, expenses, profit by period)
- [ ] T296 Test report export in all formats (PDF, Excel, CSV)

---

## Phase 12: Internationalization & Localization

**Purpose**: Full bilingual support (English/Arabic) with RTL layout for Arabic.

- [ ] T297 [P] Populate English translations in frontend/public/locales/en/common.json with all UI text
- [ ] T298 [P] Populate Arabic translations in frontend/public/locales/ar/common.json with all UI text
- [ ] T299 [P] Create useInternationalization hook in frontend/hooks/useInternationalization.ts for language switching
- [ ] T300 Add language switcher component to header/navigation
- [ ] T301 Configure RTL layout for Arabic in Tailwind CSS v4
- [ ] T302 Test language switching: switch to Arabic → verify all text translated, layout RTL
- [ ] T303 Test bilingual data: create product with English/Arabic names → verify displays correctly in both languages
- [ ] T304 Verify date/number formatting respects regional settings (branch timezone, date format, currency format)

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories, performance optimizations, security hardening, final testing.

- [ ] T305 [P] Implement health check endpoint GET /health in Backend/Program.cs
- [ ] T306 [P] Configure CORS properly in Backend/Program.cs (whitelist frontend origin, enable credentials)
- [ ] T307 [P] Add rate limiting middleware to Backend/Program.cs per contracts/README.md (60 req/min public, 300 req/min authenticated)
- [ ] T308 [P] Enable HTTPS redirect and HSTS in Backend/Program.cs for production
- [ ] T309 [P] Configure logging (Serilog or NLog) for structured logging in Backend/Program.cs
- [ ] T310 [P] Add global error boundary to frontend root layout
- [ ] T311 [P] Add loading states to all async operations
- [ ] T312 [P] Add toast notifications for success/error messages
- [ ] T313 [P] Optimize bundle size: code splitting, lazy loading for dashboard widgets
- [ ] T314 [P] Add performance monitoring (optional: Application Insights or similar)
- [ ] T315 Review and clean up console.log statements
- [ ] T316 Review and update CLAUDE.md with final architecture decisions
- [ ] T317 Run security audit: check for SQL injection, XSS, CSRF vulnerabilities
- [ ] T318 Run accessibility audit (WCAG compliance)
- [ ] T319 Run performance audit: Lighthouse score > 90
- [ ] T320 Validate all acceptance scenarios from spec.md across all user stories
- [ ] T321 Run end-to-end smoke test covering critical path: login → create branch → add product → create sale → sync offline → generate report
- [ ] T322 Create deployment documentation in docs/ directory
- [ ] T323 Run quickstart.md validation (follow guide step-by-step to verify it works)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-9)**: All depend on Foundational phase completion
  - US1 (P1): Can start after Foundational - No dependencies on other stories
  - US2 (P2): Can start after Foundational - Integrates with US1 (sales update inventory)
  - US3 (P3): Can start after Foundational - Integrates with US1 (customer stats from sales)
  - US4 (P4): Can start after Foundational - Independent of other stories
  - US5 (P5): Can start after Foundational - Independent of other stories
  - US6 (P6): Can start after Foundational - Affects all stories (RBAC enforcement)
  - US7 (P7): Can start after Foundational - Integrates with US2 (purchases)
- **Image Management (Phase 10)**: Can start after Foundational - Affects US2, US3, US4, US5, US7
- **Reporting (Phase 11)**: Depends on US1, US2, US3, US4 (needs data to report)
- **Internationalization (Phase 12)**: Can start after Foundational - Affects all UI
- **Polish (Phase 13)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation → Authentication → Sales (standalone MVP)
- **User Story 2 (P2)**: Foundation → US2 implementation → Integrates with US1 inventory updates
- **User Story 3 (P3)**: Foundation → US3 implementation → Integrates with US1 customer stats
- **User Story 4 (P4)**: Foundation → US4 implementation (standalone)
- **User Story 5 (P5)**: Foundation → US5 implementation (standalone)
- **User Story 6 (P6)**: Foundation → US6 implementation → Affects all stories RBAC
- **User Story 7 (P7)**: Foundation → US7 implementation → Integrates with US2 purchases

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- DTOs before services
- Services before endpoints
- Backend endpoints before frontend services
- Frontend services before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- Phase 1 (Setup): ALL tasks T001-T012 can run in parallel
- Phase 2 (Foundation): Entity models (T018-T037) can run in parallel within each database (Head Office vs Branch)
- Within each user story: Tests, DTOs, parallel service implementations
- User stories can be worked on in parallel by different team members after Foundation is complete

---

## Parallel Example: User Story 1 (Sales)

```bash
# Launch all tests for User Story 1 together (write tests first):
Task T063: "Create SalesServiceTests in Backend.UnitTests/Services/SalesServiceTests.cs"
Task T064: "Create concurrent sales test for inventory conflicts"
Task T065: "Create sales endpoint integration tests"
Task T066: "Create offline sync tests in frontend"
Task T067: "Create SalesForm component test"

# Launch all DTOs for User Story 1 together:
Task T068: "Create CreateSaleDto in Backend/Models/DTOs/Sales/CreateSaleDto.cs"
Task T069: "Create SaleDto in Backend/Models/DTOs/Sales/SaleDto.cs"
Task T070: "Create SaleLineItemDto in Backend/Models/DTOs/Sales/SaleLineItemDto.cs"
Task T071: "Create VoidSaleDto in Backend/Models/DTOs/Sales/VoidSaleDto.cs"

# Frontend UI components can run in parallel:
Task T093: "Create ProductSearch component in frontend/components/sales/ProductSearch.tsx"
Task T094: "Create SaleLineItemsList component"
Task T095: "Create PaymentSection component"
Task T096: "Create InvoiceDisplay component"
Task T097: "Create SyncStatusIndicator component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T012)
2. Complete Phase 2: Foundational (T013-T062) - CRITICAL foundation
3. Complete Phase 3: User Story 1 (T063-T105) - Sales with offline sync
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready - Working POS with sales processing!

**Estimated Duration**: 15-20 days for MVP

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (5-7 days)
2. Add User Story 1 (Sales) → Test independently → Deploy/Demo (MVP!) (10-12 days)
3. Add User Story 2 (Inventory) → Test independently → Deploy/Demo (6-8 days)
4. Add User Story 3 (Customers) → Test independently → Deploy/Demo (4-5 days)
5. Add User Story 4 (Expenses) → Test independently → Deploy/Demo (3-4 days)
6. Add User Story 5 (Head Office) → Test independently → Deploy/Demo (8-10 days)
7. Add User Story 6 (User Management/RBAC) → Test independently → Deploy/Demo (6-8 days)
8. Add User Story 7 (Suppliers) → Test independently → Deploy/Demo (3-4 days)
9. Add Image Management → Deploy/Demo (4-5 days)
10. Add Reporting → Deploy/Demo (5-6 days)
11. Add Internationalization → Deploy/Demo (3-4 days)
12. Polish & Security → Final deployment (5-7 days)

**Total Estimated Duration**: 60-75 working days (12-15 weeks) for complete system

### Parallel Team Strategy

With multiple developers (3-4 team members):

1. **Team completes Setup + Foundational together** (5-7 days)
2. **Once Foundational is done**:
   - Developer A: User Story 1 (Sales + Offline Sync) (10-12 days)
   - Developer B: User Story 2 (Inventory) (6-8 days) → User Story 7 (Suppliers) (3-4 days)
   - Developer C: User Story 3 (Customers) (4-5 days) → User Story 4 (Expenses) (3-4 days)
   - Developer D: User Story 5 (Head Office) (8-10 days) → User Story 6 (RBAC) (6-8 days)
3. **Integration Phase**: Team merges and integrates all user stories (3-5 days)
4. **Enhancement Phase**:
   - Developer A: Image Management (4-5 days)
   - Developer B: Reporting (5-6 days)
   - Developer C: Internationalization (3-4 days)
   - Developer D: Testing & Polish (5-7 days)

**Parallel Timeline**: 30-40 working days (6-8 weeks) with 4 developers

---

## Task Summary

**Total Tasks**: 323 tasks
**By Phase**:
- Phase 1 (Setup): 12 tasks
- Phase 2 (Foundation): 50 tasks
- Phase 3 (US1 - Sales): 43 tasks
- Phase 4 (US2 - Inventory): 38 tasks
- Phase 5 (US3 - Customers): 22 tasks
- Phase 6 (US4 - Expenses): 16 tasks
- Phase 7 (US5 - Head Office): 27 tasks
- Phase 8 (US6 - User Management): 33 tasks
- Phase 9 (US7 - Suppliers): 17 tasks
- Phase 10 (Image Management): 16 tasks
- Phase 11 (Reporting): 14 tasks
- Phase 12 (Internationalization): 8 tasks
- Phase 13 (Polish): 19 tasks

**Parallelizable Tasks**: 127 tasks marked [P]

**MVP Scope** (User Story 1 only): 62 tasks (Setup + Foundation + US1)

**Independent Test Criteria Met**: Each user story can be tested independently with clear acceptance scenarios from spec.md

**Format Validation**: ✅ All tasks follow checklist format with ID, [P] marker (where applicable), [Story] label (for user story phases), and file paths

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Write tests first (TDD approach) - verify they fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Follow quickstart.md for detailed implementation guidance on each task
- Refer to research.md for technology decisions and architecture patterns
- Refer to data-model.md for complete entity schema definitions
- Refer to contracts/ for API endpoint specifications
