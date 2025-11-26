# Implementation Plan: Multi-Branch Point of Sale System

**Branch**: `001-multi-branch-pos` | **Date**: 2025-01-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-multi-branch-pos/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a professional multi-branch POS system with head office and branch dashboards. The system supports offline operation with automatic synchronization, bilingual interface (English/Arabic), multiple database providers (SQLite, MSSQL, PostgreSQL, MySQL), and comprehensive sales/inventory/expense management. Technical approach uses ASP.NET Core 8.0 minimal API backend with Entity Framework Core for database abstraction, Next.js 16 frontend with React 19 and Tailwind CSS v4, JWT-based authentication, and local database synchronization for offline capabilities.

## Technical Context

**Language/Version**:

- Backend: C# 12 with ASP.NET Core 8.0
- Frontend: TypeScript (strict mode) with Next.js 16, React 19

**Primary Dependencies**:

- Backend: Entity Framework Core 8.0, ASP.NET Core Identity, System.IdentityModel.Tokens.Jwt, Swashbuckle (OpenAPI), ImageSharp (image optimization), Npgsql/MySql.Data/Microsoft.Data.SqlClient/Microsoft.Data.Sqlite (multi-provider support)
- Frontend: React 19, Next.js 16 (App Router), Tailwind CSS v4, next-intl (internationalization), SWR or React Query (data fetching/caching), Zod (validation), React Hook Form

**Storage**:

- Head Office DB: SQLite (default), configurable to MSSQL/PostgreSQL/MySQL
- Branch DBs: Per-branch configurable (SQLite/MSSQL/PostgreSQL/MySQL)
- Local offline cache: IndexedDB (browser) or SQLite (desktop client if needed)
- File storage: Local filesystem organized as `Upload/Branches/[BranchName]/[EntityType]/[ID]/`

**Testing**:

- Backend: xUnit, Moq (mocking), FluentAssertions, Microsoft.AspNetCore.Mvc.Testing (integration tests)
- Frontend: Jest, React Testing Library, MSW (Mock Service Worker for API mocking)

**Target Platform**:

- Backend: Cross-platform (Windows/Linux/macOS) via .NET 8.0
- Frontend: Modern web browsers (Chrome, Firefox, Safari, Edge - current versions), responsive design for tablets/desktops

**Project Type**: Web application (separate backend API + frontend SPA)

**Performance Goals**:

- Sales transaction completion: <60 seconds for 3-5 products
- API response time: <2 seconds for common operations
- Page load: <3 seconds for dashboards/reports
- Concurrent users: 50+ without degradation
- Offline sync: 100 transactions within 2 minutes of reconnection

**Constraints**:

- Offline-first architecture required for branches
- Bilingual UI (English/Arabic with RTL support)
- Multi-database provider support via EF Core abstraction
- Last-commit-wins conflict resolution
- Client hardware: 4GB RAM, dual-core processor minimum
- Image optimization required (thumbnails, compression)
- Sequential invoice numbering per branch
- 30-minute inactivity timeout
- Must support 50 branches, 500 users initially

**Scale/Scope**:

- 50 branches initially (scalable architecture)
- 500 total users across all branches
- Estimated 10-20 tables per branch database
- 5-10 main API endpoint groups
- 15-20 major UI screens (both head office and branch dashboards)
- Support for 100+ categories, 1000+ products per branch
- Transaction volume: Estimate 100-500 sales/day per branch

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Principle I: Clean Architecture & Separation of Concerns ✅

**Status**: PASS

**Alignment**:

- Backend will use minimal API pattern with domain-based service separation (Sales, Inventory, Users, Branches)
- Frontend follows App Router with clear separation: UI components, API services, business logic hooks
- Data models (EF Core entities) separated from DTOs for API contracts
- Repository/service layer isolation for database access

**No violations detected**

### Principle II: Type Safety & Contract-First Development ✅

**Status**: PASS

**Alignment**:

- TypeScript strict mode enabled
- C# nullable reference types will be enabled
- OpenAPI/Swagger documentation for all endpoints
- Contract-first development: API contracts defined in Phase 1 before implementation
- DTOs for all API inputs/outputs
- Consistent HTTP status codes and API versioning planned

**No violations detected**

### Principle III: Modular Design & Single Responsibility ✅

**Status**: PASS

**Alignment**:

- Backend organized by domain (Sales, Inventory, Customers, Branches, Users, Sync)
- Frontend organized by feature/domain (not by component type)
- Each service class has single responsibility
- Dependency injection for cross-cutting concerns
- Reusable UI components in shared directory

**No violations detected**

### Principle IV: Testing & Quality Assurance ⚠️

**Status**: CONDITIONAL PASS (Test strategy to be defined in Phase 1)

**Alignment**:

- Backend testing: xUnit for unit/integration tests
- Frontend testing: Jest + React Testing Library
- Test coverage goals: 80%+ for business logic
- Mock external dependencies

**Action Required**: Phase 1 must define specific test scenarios for offline sync, multi-database support, and concurrent conflict resolution

### Principle V: Security & Data Protection ⚠️

**Status**: CONDITIONAL PASS (Security architecture needs research)

**Alignment**:

- JWT authentication planned
- Role-based access control (head office admin, branch manager, cashier)
- Password hashing required
- Input validation and sanitization
- CORS configuration needed
- HTTPS in production

**Unknowns** (to be resolved in Phase 0 research):

- JWT refresh token strategy
- Branch data isolation mechanism (database-level vs application-level)
- Technical password implementation for admin override
- Encryption at rest strategy for sensitive data
- Audit logging architecture for user activity tracking

### Principle VI: Performance & Scalability ⚠️

**Status**: CONDITIONAL PASS (Offline sync architecture needs research)

**Alignment**:

- Async/await for I/O operations
- Caching strategy (in-memory or Redis)
- Database query optimization
- Connection pooling
- Horizontal scaling capability (stateless backend)

**Unknowns** (to be resolved in Phase 0 research):

- Offline sync queue implementation (IndexedDB, local SQLite, or other)
- Conflict resolution implementation details
- Database connection pooling strategy for multi-branch/multi-provider
- Image optimization and thumbnail generation strategy
- Caching strategy for frequently accessed branch settings

### Principle VII: Code Quality & Maintainability ✅

**Status**: PASS

**Alignment**:

- C# coding conventions (PascalCase/camelCase)
- ESLint configured for frontend
- Code reviews required
- Documentation standards (XML comments, JSDoc)
- CLAUDE.md maintained with architecture decisions

**No violations detected**

### Overall Gate Status: ⚠️ CONDITIONAL PASS

**Proceed to Phase 0 with the following clarifications required**:

1. JWT refresh token and session management strategy
2. Branch data isolation and security architecture
3. Offline sync queue and conflict resolution implementation
4. Multi-database connection management and pooling
5. Image storage and optimization pipeline
6. Audit logging and user activity tracking architecture
7. Test strategy for offline scenarios and concurrent operations

**No unjustified violations detected. System can proceed to research phase.**

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
Backend/                              # ASP.NET Core 8.0 API
├── Program.cs                        # Main entry point, minimal API endpoints
├── appsettings.json                  # Configuration (connection strings, JWT settings)
├── appsettings.Development.json      # Dev-specific config
├── Backend.csproj                    # Project file
├── Models/                           # Database entities (EF Core)
│   ├── Entities/
│   │   ├── HeadOffice/              # Head office-specific entities
│   │   │   ├── Branch.cs
│   │   │   ├── BranchUser.cs
│   │   │   ├── MainSetting.cs
│   │   │   └── UserActivityLog.cs
│   │   └── Branch/                  # Branch database entities
│   │       ├── Category.cs
│   │       ├── Product.cs
│   │       ├── ProductImage.cs
│   │       ├── Sale.cs
│   │       ├── SaleLineItem.cs
│   │       ├── Customer.cs
│   │       ├── User.cs
│   │       ├── Supplier.cs
│   │       ├── Purchase.cs
│   │       ├── PurchaseLineItem.cs
│   │       ├── Expense.cs
│   │       ├── ExpenseCategory.cs
│   │       ├── Setting.cs
│   │       └── SyncQueue.cs
│   └── DTOs/                        # Data transfer objects for API
│       ├── Auth/
│       ├── Sales/
│       ├── Inventory/
│       ├── Customers/
│       ├── Branches/
│       └── Sync/
├── Services/                        # Business logic layer
│   ├── Auth/
│   │   ├── IAuthService.cs
│   │   ├── AuthService.cs
│   │   └── JwtTokenService.cs
│   ├── Sales/
│   │   ├── ISalesService.cs
│   │   └── SalesService.cs
│   ├── Inventory/
│   │   ├── IInventoryService.cs
│   │   └── InventoryService.cs
│   ├── Customers/
│   │   ├── ICustomerService.cs
│   │   └── CustomerService.cs
│   ├── Branches/
│   │   ├── IBranchService.cs
│   │   └── BranchService.cs
│   ├── Users/
│   │   ├── IUserService.cs
│   │   └── UserService.cs
│   ├── Sync/
│   │   ├── ISyncService.cs
│   │   └── SyncService.cs
│   └── Images/
│       ├── IImageService.cs
│       └── ImageService.cs
├── Data/                            # Database contexts
│   ├── HeadOfficeDbContext.cs
│   ├── BranchDbContext.cs
│   └── DbContextFactory.cs          # Multi-provider support
├── Middleware/                      # Custom middleware
│   ├── ErrorHandlingMiddleware.cs
│   ├── BranchContextMiddleware.cs   # Determines branch from request
│   └── OfflineQueueMiddleware.cs
├── Utilities/                       # Helper classes
│   ├── PasswordHasher.cs
│   ├── ImageOptimizer.cs
│   └── InvoiceNumberGenerator.cs
└── Tests/                           # Test projects
    ├── Backend.UnitTests/
    │   ├── Services/
    │   └── Utilities/
    └── Backend.IntegrationTests/
        └── Endpoints/

frontend/                            # Next.js 16 frontend
├── app/                             # App Router
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Landing/login page
│   ├── [locale]/                    # Internationalization wrapper
│   │   ├── head-office/            # Head office dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Head office home
│   │   │   ├── branches/           # Branch management
│   │   │   ├── users/              # User management
│   │   │   ├── settings/           # Global settings
│   │   │   └── analytics/          # Multi-branch analytics
│   │   └── branch/                 # Branch dashboard
│   │       ├── layout.tsx
│   │       ├── page.tsx            # Branch home
│   │       ├── sales/              # Sales processing
│   │       ├── inventory/          # Inventory management
│   │       ├── customers/          # Customer management
│   │       ├── purchases/          # Purchase orders
│   │       ├── expenses/           # Expense tracking
│   │       ├── suppliers/          # Supplier management
│   │       ├── reports/            # Branch reports
│   │       └── settings/           # Branch settings
│   └── api/                        # API route handlers (if needed)
├── components/                      # React components
│   ├── shared/                     # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Dialog.tsx
│   │   ├── DataTable.tsx
│   │   ├── Form/
│   │   └── Layout/
│   ├── sales/                      # Sales-specific components
│   ├── inventory/                  # Inventory-specific components
│   └── dashboard/                  # Dashboard widgets
├── services/                       # API client services
│   ├── api.ts                      # Base API client (axios/fetch)
│   ├── auth.service.ts
│   ├── sales.service.ts
│   ├── inventory.service.ts
│   ├── branch.service.ts
│   └── sync.service.ts
├── lib/                            # Utilities and helpers
│   ├── offline-sync.ts             # Offline queue management
│   ├── validation.ts               # Zod schemas
│   ├── auth.ts                     # Auth helpers
│   └── constants.ts                # App constants
├── hooks/                          # Custom React hooks
│   ├── useAuth.ts
│   ├── useOfflineSync.ts
│   ├── useBranchContext.ts
│   └── useInternationalization.ts
├── types/                          # TypeScript type definitions
│   ├── api.types.ts
│   ├── entities.types.ts
│   └── enums.ts
├── public/                         # Static assets
│   └── locales/                    # Translation files
│       ├── en/
│       │   └── common.json
│       └── ar/
│           └── common.json
├── __tests__/                      # Frontend tests
│   ├── components/
│   ├── services/
│   └── integration/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── middleware.ts                   # Next.js middleware (auth, i18n)

Upload/                            # File storage (gitignored)
└── Branches/
    └── [BranchName]/
        ├── Products/
        │   └── [ProductID]/
        │       ├── original.jpg
        │       └── thumb.jpg
        ├── Categories/
        ├── Customers/
        ├── Suppliers/
        ├── Expenses/
        └── BranchLogo/
```

**Structure Decision**: Web application architecture with separate Backend (ASP.NET Core) and frontend (Next.js) projects. Backend uses domain-driven folder organization (Services by domain, Models with Entities/DTOs separation). Frontend uses Next.js App Router with feature-based organization and clear separation of UI, business logic, and API services. File Upload organized hierarchically by branch and entity type for isolation and scalability.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All design decisions align with constitution principles.

---

## Post-Design Constitution Check

**Re-evaluation Date**: 2025-01-21 (After Phase 0 Research & Phase 1 Design)

### Principle I: Clean Architecture & Separation of Concerns ✅

**Status**: PASS

**Design Validation**:

- Backend uses domain-driven service organization (Auth, Sales, Inventory, Branches, Users, Sync)
- Clear separation: Entities (Models/Entities/), DTOs (Models/DTOs/), Services (Services/), Data Access (Data/)
- Frontend follows App Router with feature-based organization: `app/[locale]/{head-office,branch}/{feature}`
- API client services isolated in `services/` directory
- Business logic in custom hooks (`hooks/`)

**No violations introduced during design phase**

### Principle II: Type Safety & Contract-First Development ✅

**Status**: PASS

**Design Validation**:

- All API endpoints documented in OpenAPI format (contracts/ directory)
- TypeScript strict mode maintained
- C# nullable reference types planned
- DTOs defined for all API inputs/outputs in data-model.md
- Enumerations defined for all domain concepts (InvoiceType, PaymentMethod, etc.)

**No violations introduced during design phase**

### Principle III: Modular Design & Single Responsibility ✅

**Status**: PASS

**Design Validation**:

- Each service has single responsibility: AuthService (authentication), SalesService (sales logic), etc.
- Frontend components organized by feature/domain
- Reusable UI components in `components/shared/`
- Project structure documented in plan.md shows clear module boundaries

**No violations introduced during design phase**

### Principle IV: Testing & Quality Assurance ✅

**Status**: PASS (Research complete, test strategy defined)

**Design Validation**:

- Test strategy defined in research.md Section 7
- Unit tests planned for all business logic services
- Integration tests for API endpoints
- Offline sync and concurrency tests explicitly planned
- Test coverage goals: 80%+ for business logic, 90%+ for offline/sync modules
- Testing tools selected: xUnit, Moq, FluentAssertions (backend); Jest, RTL, MSW (frontend)

**Action completed**: Test strategy fully defined in Phase 0 research

### Principle V: Security & Data Protection ✅

**Status**: PASS (Research complete, architecture defined)

**Design Validation**:

- JWT refresh token strategy defined (research.md Section 1)
- Password hashing with BCrypt planned
- Branch data isolation via separate databases (research.md Section 2)
- Technical password for admin override (encrypted in MainSettings)
- Audit logging architecture defined (research.md Section 6)
- RBAC defined in API contracts with role-based endpoint permissions
- Input validation defined in all API contracts

**Unknowns resolved**:

- ✅ JWT refresh token strategy: 15min access token + 7day refresh token + server-side session tracking
- ✅ Branch data isolation: Physical database per branch + application-level security middleware
- ✅ Technical password: Encrypted in MainSettings table, validated against app config
- ✅ Encryption at rest: Database passwords encrypted using ASP.NET Data Protection API
- ✅ Audit logging: Database-based with permanent retention, separate UserActivityLog with circular buffer

### Principle VI: Performance & Scalability ✅

**Status**: PASS (Research complete, architecture defined)

**Design Validation**:

- Offline sync architecture defined (research.md Section 3): IndexedDB + background sync + last-commit-wins
- Database connection pooling strategy defined (research.md Section 4): Per-branch context pools, max 100 connections
- Multi-database provider support via EF Core abstraction
- Image optimization pipeline defined (research.md Section 5): Multiple sizes, WebP format, filesystem storage
- Caching strategy for branch settings (in-memory cache with 5-minute expiry)
- Async/await patterns planned for all I/O operations

**Unknowns resolved**:

- ✅ Offline sync queue: IndexedDB (browser), chronological processing, retry logic with exponential backoff
- ✅ Conflict resolution: Last-commit-wins with inventory discrepancy flagging and manager alerts
- ✅ Multi-database pooling: Per-branch DbContext pools with factory pattern, health checks before use
- ✅ Image optimization: ImageSharp library, multi-size generation (original/large/medium/thumb), WebP compression
- ✅ Caching: In-memory cache for branch settings, Redis optional for multi-server deployments

### Principle VII: Code Quality & Maintainability ✅

**Status**: PASS

**Design Validation**:

- Code organization documented in project structure (plan.md)
- XML/JSDoc comments planned for public APIs
- ESLint configured for frontend, C# conventions for backend
- Quickstart.md guide created for developer onboarding
- All design artifacts documented (plan, research, data-model, contracts, quickstart)

**No violations introduced during design phase**

### Overall Post-Design Gate Status: ✅ PASS

**All Phase 0 clarifications resolved**:

1. ✅ JWT refresh token and session management strategy → Defined in research.md Section 1
2. ✅ Branch data isolation and security architecture → Defined in research.md Section 2
3. ✅ Offline sync queue and conflict resolution implementation → Defined in research.md Section 3
4. ✅ Multi-database connection management and pooling → Defined in research.md Section 4
5. ✅ Image storage and optimization pipeline → Defined in research.md Section 5
6. ✅ Audit logging and user activity tracking architecture → Defined in research.md Section 6
7. ✅ Test strategy for offline scenarios and concurrent operations → Defined in research.md Section 7

**No unjustified complexity introduced**:

- Two-database architecture (head office + per-branch) justified by requirements (branch data isolation, multi-provider support)
- Offline sync queue justified by requirement FR-063 (offline operation support)
- Multi-provider database support justified by requirement FR-033 (configurable database providers)
- Image optimization pipeline justified by performance requirements (responsive images, storage efficiency)

**System ready to proceed to implementation (Phase 2 and beyond)**

---

## Phase 2: Implementation

Phase 2 (implementation) is handled by the `/speckit.tasks` command, which generates `tasks.md` with actionable, dependency-ordered tasks for development.

**Command usage**: `/speckit.tasks`

This planning phase is now complete.
