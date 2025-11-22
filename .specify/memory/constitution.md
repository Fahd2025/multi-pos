<!--
Sync Impact Report:
- Version: 0.0.0 → 1.0.0 (Initial Constitution)
- Rationale: MAJOR version for initial constitution establishment
- Principles Added:
  1. Clean Architecture & Separation of Concerns
  2. Type Safety & Contract-First Development
  3. Modular Design & Single Responsibility
  4. Testing & Quality Assurance
  5. Security & Data Protection
  6. Performance & Scalability
  7. Code Quality & Maintainability
- Sections Added:
  - Technical Standards
  - Development Workflow
  - Governance
- Templates Status:
  ✅ plan-template.md - Constitution Check section aligned
  ✅ spec-template.md - Requirements sections support principles
  ✅ tasks-template.md - Task structure supports modular development
- Follow-up TODOs: None
-->

# Multi-Branch POS System Constitution

## Core Principles

### I. Clean Architecture & Separation of Concerns

The system MUST maintain clear boundaries between layers and responsibilities:

- **Backend (ASP.NET Core)**:
  - Use minimal API pattern with endpoints defined in Program.cs for simple operations
  - Extract complex business logic into separate service classes
  - Separate data models (entities) from DTOs (data transfer objects)
  - Keep database access isolated in repository or service layers
  - NEVER mix presentation logic with business logic

- **Frontend (Next.js)**:
  - Use App Router pattern (not Pages Router)
  - Separate UI components from business logic
  - Keep API calls isolated in service/API layer files
  - Use Server Components by default, Client Components only when needed
  - Implement proper data fetching patterns (server-side where possible)

**Rationale**: Clear separation enables independent testing, easier maintenance, and allows
frontend and backend teams to work in parallel without conflicts.

### II. Type Safety & Contract-First Development

Strong typing and explicit contracts MUST be enforced across the stack:

- **TypeScript (Frontend)**:
  - Strict mode MUST be enabled (already configured)
  - NO usage of `any` type except for well-justified edge cases
  - Define interfaces for all API responses and data structures
  - Use type guards for runtime validation where needed

- **C# (Backend)**:
  - Enable nullable reference types
  - Use DTOs for all API inputs/outputs
  - Leverage ASP.NET Core model validation attributes
  - Generate OpenAPI/Swagger documentation for all endpoints

- **API Contracts**:
  - Document all endpoint contracts before implementation
  - Use consistent HTTP status codes (200, 201, 400, 401, 404, 500)
  - Version APIs when breaking changes are introduced (e.g., /api/v1/)
  - Backend and frontend teams agree on contracts before parallel work begins

**Rationale**: Type safety catches errors at compile time, contracts enable parallel development,
and explicit types serve as living documentation.

### III. Modular Design & Single Responsibility

Code MUST be organized into focused, reusable modules:

- **Backend Modules**:
  - Group related endpoints and services by business domain (e.g., Sales, Inventory, Users)
  - Each service class has ONE clear responsibility
  - Use dependency injection for all cross-cutting concerns
  - Keep Program.cs focused on configuration; extract endpoint mappings when > 50 lines

- **Frontend Modules**:
  - Organize components by feature/domain (not by type)
  - Each component has ONE clear purpose
  - Extract reusable UI components into shared directory
  - Keep components small (<200 lines; extract subcomponents if larger)

- **Shared Principles**:
  - DRY (Don't Repeat Yourself) - extract common logic into utilities
  - SOLID principles, especially Single Responsibility
  - Functions do ONE thing and do it well
  - Prefer composition over inheritance

**Rationale**: Modular code is easier to understand, test, maintain, and reuse. Single
responsibility prevents feature creep and reduces coupling.

### IV. Testing & Quality Assurance

Quality MUST be maintained through automated testing:

- **Testing Requirements**:
  - Unit tests for complex business logic (backend services, frontend utilities)
  - Integration tests for API endpoints (backend)
  - Component tests for critical UI flows (frontend - using React Testing Library)
  - End-to-end tests for critical user journeys (optional but recommended)

- **Test Coverage Goals**:
  - Business logic: 80%+ coverage
  - API endpoints: All happy paths + critical error cases
  - UI components: Critical user journeys and edge cases

- **Testing Standards**:
  - Backend: Use xUnit or NUnit
  - Frontend: Use Jest + React Testing Library
  - Tests MUST be deterministic (no flaky tests)
  - Mock external dependencies (databases, external APIs)
  - Tests run in CI/CD pipeline before deployment

**Rationale**: Automated testing enables confident refactoring, prevents regressions, and
serves as executable documentation. Testing is NOT optional for production code.

### V. Security & Data Protection

Security MUST be built-in, not bolted-on:

- **Authentication & Authorization**:
  - Use JWT tokens or ASP.NET Core Identity
  - Implement role-based access control (RBAC)
  - NEVER store passwords in plain text (use hashing: bcrypt, Argon2)
  - Implement proper session management

- **Data Protection**:
  - Validate and sanitize ALL user inputs (prevent SQL injection, XSS)
  - Use parameterized queries or ORM (Entity Framework Core)
  - Implement CORS properly (whitelist frontend origin, not wildcard *)
  - Use HTTPS in production (enforce SSL/TLS)
  - Protect sensitive data (PII, payment info) with encryption at rest

- **API Security**:
  - Rate limiting on public endpoints
  - Authentication required for sensitive operations
  - Audit logging for security-critical actions
  - Never expose stack traces in production error responses

**Rationale**: Security breaches damage trust and can have legal/financial consequences.
Multi-branch POS systems handle sensitive customer and business data requiring robust protection.

### VI. Performance & Scalability

The system MUST be designed for multi-branch scalability:

- **Backend Performance**:
  - Use async/await for I/O operations (database, external APIs)
  - Implement caching for frequently accessed data (Redis, in-memory cache)
  - Optimize database queries (avoid N+1 queries, use proper indexes)
  - Connection pooling for database connections
  - Consider message queues for heavy operations (RabbitMQ, Azure Service Bus)

- **Frontend Performance**:
  - Use Next.js Server Components for static content
  - Implement code splitting and lazy loading
  - Optimize images (Next.js Image component)
  - Minimize bundle size (analyze with next/bundle-analyzer)
  - Cache API responses where appropriate (SWR, React Query)

- **Scalability Requirements**:
  - Design for horizontal scaling (stateless backend)
  - Database designed for concurrent access from multiple branches
  - Consider eventual consistency where real-time accuracy not critical
  - Plan for data partitioning/sharding as system grows

**Rationale**: Multi-branch systems must handle concurrent operations from multiple locations.
Poor performance impacts user experience and business operations.

### VII. Code Quality & Maintainability

Code MUST be readable, maintainable, and follow best practices:

- **Code Style**:
  - Backend: Follow C# coding conventions (PascalCase for public members, camelCase for private)
  - Frontend: Use ESLint rules (already configured), run `npm run lint` before commits
  - Consistent formatting (Prettier for frontend, built-in formatter for C#)
  - Meaningful names (no abbreviations unless universally understood)

- **Documentation**:
  - XML comments for public APIs (backend)
  - JSDoc comments for complex functions (frontend)
  - README files for each major feature/module
  - Keep CLAUDE.md updated with architecture decisions

- **Code Reviews**:
  - All code changes require review before merging
  - Check for: correctness, security issues, performance concerns, test coverage
  - Reviewer verifies alignment with constitution principles

- **Refactoring**:
  - Leave code better than you found it (Boy Scout Rule)
  - Address TODO comments promptly (don't accumulate technical debt)
  - Refactor when code becomes hard to understand or change

**Rationale**: Code is read 10x more than written. Maintainable code reduces long-term costs
and enables faster feature development.

## Technical Standards

### Technology Stack (Non-Negotiable)

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Backend**: ASP.NET Core 8.0, C# 12
- **Database**: To be determined based on requirements (SQL Server, PostgreSQL, or MongoDB)
- **API Documentation**: Swagger/OpenAPI (already enabled)
- **Version Control**: Git with conventional commit messages

### Development Environment

- **Node.js**: v18+ (for frontend)
- **.NET SDK**: 8.0+ (for backend)
- **IDE**: Visual Studio Code, Visual Studio, or JetBrains Rider
- **Package Management**: npm (frontend), NuGet (backend)

### Build & Deployment

- Frontend builds with `npm run build` (production-optimized)
- Backend builds with `dotnet build -c Release`
- Environment-specific configuration (appsettings.Development.json, appsettings.Production.json)
- CI/CD pipeline required for production deployments (GitHub Actions, Azure DevOps, or similar)

## Development Workflow

### Feature Development Process

1. **Specification**: Define feature requirements in spec.md (use /speckit.specify)
2. **Planning**: Create implementation plan in plan.md (use /speckit.plan)
3. **Contract Definition**: Define API contracts before implementation
4. **Parallel Development**:
   - Backend implements endpoints per contract
   - Frontend implements UI using mocked API responses
5. **Integration**: Connect frontend to real backend endpoints
6. **Testing**: Write and execute tests per Testing principle (IV)
7. **Review**: Code review ensuring constitution compliance
8. **Deployment**: Merge to main branch, deploy via CI/CD

### Branching Strategy

- `master` branch for production-ready code
- Feature branches: `###-feature-name` format
- Create PR for all changes (no direct commits to master)
- PRs require: passing tests, code review approval, constitution compliance

### Commit Conventions

- Use conventional commits: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Examples:
  - `feat(sales): add invoice creation endpoint`
  - `fix(inventory): correct stock calculation logic`
  - `refactor(frontend): extract product card component`

## Governance

### Constitution Authority

This constitution supersedes all other development practices and preferences. When in doubt,
refer to these principles. All PRs and code reviews MUST verify compliance with this document.

### Amendment Process

Constitution amendments require:
1. Written justification for the change
2. Impact analysis on existing code and templates
3. Update to constitution version (semantic versioning)
4. Update to dependent templates (plan-template.md, spec-template.md, tasks-template.md)
5. Communication to all team members

### Complexity Justification

Any violation of these principles (e.g., skipping tests, introducing unnecessary abstractions,
mixing layers) MUST be documented in the implementation plan with:
- Why it's needed
- What simpler alternatives were considered
- Why those alternatives were rejected
- Plan to remove the complexity in the future (if applicable)

### Compliance Review

- Weekly architecture reviews for ongoing features
- Constitution compliance checklist during code reviews
- Quarterly review of technical debt and principle violations
- Annual constitution review for relevance and updates

### Runtime Guidance

For specific development guidance while working on features, refer to CLAUDE.md for:
- Project structure and file locations
- Development commands and workflows
- Architecture patterns and conventions
- Technology-specific best practices

**Version**: 1.0.0 | **Ratified**: 2025-01-21 | **Last Amended**: 2025-01-21
