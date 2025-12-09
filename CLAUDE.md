# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-POS (Point of Sale) system with a full-stack architecture:

- **Frontend**: Next.js 16 with React 19, TypeScript, and Tailwind CSS v4
- **Backend**: ASP.NET Core 8.0 Web API with minimal API architecture

## Repository Structure

```
multi-pos/
├── frontend/          # Next.js frontend application
│   ├── app/          # Next.js App Router pages and layouts
│   ├── public/       # Static assets
│   └── package.json
├── Backend/          # ASP.NET Core backend API
│   ├── Data/         # DbContexts and database configuration
│   ├── Models/       # Entity models and DTOs
│   ├── Services/     # Business logic services
│   ├── Middleware/   # Custom middleware
│   ├── Utilities/    # Helper utilities
│   ├── Program.cs    # Main API entry point and endpoint definitions
│   └── Backend.csproj
├── specs/            # Project specifications and documentation
│   └── 001-multi-branch-pos/
│       ├── contracts/    # API contracts
│       ├── tasks.md      # Implementation tasks checklist
│       ├── spec.md       # Feature specifications
│       ├── plan.md       # Architecture and design
│       └── data-model.md # Database schema
├── docs/             # Implementation documentation
└── multi-pos.sln     # Visual Studio solution file
```

## Development Commands

### Frontend (Next.js)

Navigate to the `frontend/` directory for all frontend commands:

```bash
cd frontend

# Development
npm run dev          # Start dev server at http://localhost:3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Code quality
npm run lint         # Run ESLint
```

### Backend (.NET)

Navigate to the `Backend/` directory for backend commands:

```bash
cd Backend

# Development
dotnet run           # Run the API (default: https://localhost:5001)
dotnet watch         # Run with hot reload

# Build
dotnet build         # Build the project
dotnet build -c Release  # Build for production

# Testing
dotnet test          # Run tests (when added)

# Solution-level commands (from root)
cd ..
dotnet build multi-pos.sln     # Build entire solution
dotnet run --project Backend   # Run backend from root
```

## Architecture Notes

### Frontend Architecture

- **Framework**: Next.js 16 with App Router (not Pages Router)
- **Styling**: Tailwind CSS v4 with PostCSS
- **Fonts**: Uses Geist Sans and Geist Mono via `next/font/google`
- **Path Aliases**: `@/*` maps to the root directory (configured in `tsconfig.json`)
- **TypeScript**: Strict mode enabled with ES2017 target

Key files:

- `app/layout.tsx` - Root layout with font configuration
- `app/page.tsx` - Homepage
- `app/globals.css` - Global styles and Tailwind directives

### Backend Architecture

- **Framework**: ASP.NET Core 8.0 using minimal API pattern (not controllers)
- **Database**: Multi-provider support (SQLite, MSSQL, PostgreSQL, MySQL) via Entity Framework Core
- **Architecture**: Two-database pattern:
  - **HeadOfficeDb**: Central database for branches, users, and global settings
  - **BranchDb**: Separate database per branch for operational data
- **Authentication**: JWT Bearer token authentication with refresh tokens
- **Authorization**: Role-based access control (HeadOfficeAdmin, Manager, Cashier)
- **API Documentation**: Swagger/OpenAPI enabled in development
- **Pattern**: Endpoints defined inline in `Program.cs` using `app.MapGet()`, `app.MapPost()`, etc.
- **Configuration**: Uses standard ASP.NET Core configuration (`appsettings.json`)

Current endpoints:

- `GET /health` - Health check endpoint
- **Sales Endpoints**:
  - `POST /api/v1/sales` - Create new sale transaction
  - `GET /api/v1/sales` - List sales with filtering and pagination
  - `GET /api/v1/sales/{id}` - Get sale by ID
  - `POST /api/v1/sales/{id}/void` - Void a sale (Manager only)
  - `GET /api/v1/sales/{id}/invoice` - Get printable invoice
  - `GET /api/v1/sales/stats` - Get sales statistics
- **Inventory Endpoints**:
  - `GET /api/v1/categories` - List categories
  - `POST /api/v1/categories` - Create category
  - `PUT /api/v1/categories/{id}` - Update category
  - `DELETE /api/v1/categories/{id}` - Delete category
  - `GET /api/v1/products` - List products with filtering and pagination
  - `POST /api/v1/products` - Create product
  - `PUT /api/v1/products/{id}` - Update product
  - `DELETE /api/v1/products/{id}` - Delete product
  - `POST /api/v1/products/{id}/adjust-stock` - Manual stock adjustment
  - `GET /api/v1/purchases` - List purchase orders
  - `POST /api/v1/purchases` - Create purchase order
  - `POST /api/v1/purchases/{id}/receive` - Mark purchase as received and update inventory

### Project Conventions

- The frontend is a standalone Next.js project with its own `package.json` and `node_modules`
- The backend is a single .NET project within a Visual Studio solution
- Both projects are currently in early setup phase with template/starter code
- No shared code or cross-project dependencies yet established

## TypeScript Configuration

The frontend uses these key TypeScript settings:

- `jsx: "react-jsx"` - Uses the new JSX transform (no need to import React)
- `moduleResolution: "bundler"` - Modern module resolution for bundlers
- `strict: true` - All strict type-checking enabled
- Path alias `@/*` for imports

## Development Workflow

1. **Running both projects**: Open two terminal windows, one for frontend (`cd frontend && npm run dev`) and one for backend (`cd Backend && dotnet watch`)
2. **Adding frontend features**: Create pages/components in the `app/` directory following App Router conventions
3. **Adding backend endpoints**: Define new endpoints in `Backend/Program.cs` following the minimal API pattern
4. **API documentation**: Access Swagger UI at the backend URL + `/swagger` when running in development

## Documentation and Task Tracking Procedures

### When Implementing Tasks

After completing any implementation tasks, you MUST follow these procedures:

1. **Update tasks.md**:
   - Navigate to `specs/001-multi-branch-pos/tasks.md`
   - Mark completed tasks with `[X]` instead of `[ ]`
   - Example: `- [X] T068 [P] [US1] Create CreateSaleDto in Backend/Models/DTOs/Sales/CreateSaleDto.cs`

2. **Create Implementation Documentation**:
   - Create a new file in the `docs/` directory
   - **File naming convention**: `YYYY-MM-DD-{description}.md`
   - Example: `docs/2025-11-23-sales-api-implementation.md`
   - Use today's date as the prefix

3. **Documentation Content**:
   The implementation documentation should include:
   - **Overview**: Summary of what was implemented
   - **Date**: Implementation date and task range (e.g., T068-T081)
   - **Tasks Completed**: Detailed description of each task
   - **Features**: Key features and business logic implemented
   - **API Endpoints**: Request/response examples for new endpoints
   - **Database Changes**: Entity modifications and migrations
   - **Security**: Authentication and authorization details
   - **Testing Notes**: Build status and testing recommendations
   - **Files Created/Modified**: Complete list of affected files
   - **Future Enhancements**: Planned improvements or TODOs

### Example Workflow

```bash
# After implementing tasks T068-T081
1. Update specs/001-multi-branch-pos/tasks.md (mark T068-T081 as [X])
2. Create docs/2025-11-23-sales-api-implementation.md
3. Document all implementation details
```

### Implementation Summary Documentation

**CRITICAL**: After completing any significant implementation work (completing a feature, fixing major bugs, or finishing a development session), you MUST create an implementation summary document in the `docs/` folder.

**When to Create:**
- ✅ After completing a feature or major functionality
- ✅ After completing a significant bug fix or refactoring
- ✅ Before ending a development session where substantial work was done
- ✅ After building and verifying the project successfully

**Mandatory Steps:**
1. **Run the build** first to ensure no errors:
   ```bash
   cd Backend && dotnet build
   # or
   cd frontend && npm run build
   ```

2. **Create summary document** in `docs/` directory:
   - **File naming:** `YYYY-MM-DD-{feature-name}-implementation.md`
   - **Example:** `docs/2025-12-09-invoice-builder-backend-implementation.md`

3. **Required Content:**
   - **Overview** - What was implemented
   - **Status** - Completion status and build results
   - **Tasks Completed** - List of all completed tasks (with checkmarks)
   - **Files Created** - Complete list with directory structure
   - **Database Changes** - Migrations, schema changes
   - **API Endpoints** - New endpoints with authorization
   - **Key Features** - Highlights and important functionality
   - **Testing & Validation** - Build status, tests run
   - **Next Steps** - What comes next
   - **Code Statistics** - File counts, LOC estimates

4. **Update CLAUDE.md** if needed:
   - Update "Current Implementation Status" section
   - Add new features to "Key Features Implemented"
   - Update any relevant sections with new information

**Example Summary Structure:**
```markdown
# [Feature Name] - Implementation Summary

**Date:** YYYY-MM-DD
**Phase:** [Phase Name]
**Status:** ✅ Completed / ⚠️ In Progress
**Build Status:** ✅ Success (X errors, Y warnings)

## Overview
[Brief description]

## Completed Tasks (X/Y)
- ✅ Task 1
- ✅ Task 2

## Files Created (N files)
[Directory tree with all created files]

## Database Schema
[SQL schema or migration details]

## API Endpoints
[Table of endpoints with methods and authorization]

## Testing & Validation
[Build output, test results]

## Next Steps
[What's coming next]
```

**This is NOT optional** - Implementation summaries are critical for:
- 📝 Tracking project progress
- 🔍 Code review and auditing
- 📚 Onboarding new developers
- 🐛 Debugging and troubleshooting
- 📊 Project management and reporting

## Important Notes

### Current Implementation Status

**Phase 1: Setup** - ✅ Completed
- All NuGet and NPM packages installed
- TypeScript, ESLint, Prettier configured
- Tailwind CSS v4 configured
- Internationalization (i18n) configured

**Phase 2: Foundational** - ✅ Completed
- HeadOfficeDbContext and BranchDbContext created
- Multi-provider database support (SQLite, MSSQL, PostgreSQL, MySQL)
- All entity models created (Branch, User, Product, Sale, etc.)
- JWT authentication and authorization configured
- Error handling and branch context middleware implemented
- Default admin user seeded (username: "admin", password: "123")

**Phase 3: User Story 1 - Sales Operations** - ✅ Completed
- ✅ Sales DTOs (T068-T071)
- ✅ Sales Service and business logic (T072-T075)
- ✅ Sales API endpoints (T076-T081)
- ✅ Frontend services and offline sync (T082-T089)
- ✅ Frontend UI components (T090-T099)
- ✅ Integration and validation (T100-T105)

**Phase 4: User Story 2 - Inventory Management** - ✅ Completed
- ✅ Unit tests (T106-T107)
- ✅ Inventory DTOs (T108-T113)
- ✅ Inventory Service implementation (T114-T115)
- ✅ Inventory API endpoints (T116-T127)
- ✅ Frontend services and UI (T128-T137)
- ✅ Integration and validation tests (T138-T143)

### Key Features Implemented

- **Multi-branch architecture** with separate databases per branch
- **JWT authentication** with refresh token support
- **Role-based access control** (HeadOfficeAdmin, Manager, Cashier)
- **Sales transaction management** with inventory updates
- **Customer statistics tracking**
- **Invoice generation** (Transaction IDs and Invoice Numbers)
- **Sales analytics and reporting**
- **Inventory management**:
  - Category management with hierarchical structure
  - Product CRUD with category assignment
  - Stock level tracking and adjustments
  - Low stock alerts and thresholds
  - Inventory discrepancy flagging (negative stock)
  - Purchase order management
  - Automatic inventory updates on purchase receipt
  - Supplier management integration
- **Offline sync** with IndexedDB queue and automatic synchronization
- **Comprehensive testing**: 44 automated tests (27 unit + 17 integration) + 59 manual validation tests

### Important Notes

- Frontend and backend run as separate processes
- CORS is configured to allow frontend access
- Database migrations are in the `Backend/Migrations/` directory
- Swagger UI available at `/swagger` in development mode
- All API endpoints require authentication (except `/health`)
- Branch context is automatically extracted from JWT token
