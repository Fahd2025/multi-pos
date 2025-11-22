# Quickstart Guide: Multi-Branch POS System

**Feature**: Multi-Branch POS System
**Date**: 2025-01-21
**Target Audience**: Developers implementing this feature

## Overview

This guide provides step-by-step instructions to implement the Multi-Branch POS System based on the design artifacts:
- [plan.md](./plan.md) - Implementation plan
- [research.md](./research.md) - Technology decisions
- [data-model.md](./data-model.md) - Database schema
- [contracts/](./contracts/) - API contracts

## Prerequisites

Before starting implementation:

### Development Tools

- **.NET SDK 8.0+**: `dotnet --version` (backend)
- **Node.js 18+**: `node --version` (frontend)
- **Git**: Version control
- **IDE**: Visual Studio Code, Visual Studio, or JetBrains Rider
- **Database Tools**: SQL Server Management Studio, pgAdmin, MySQL Workbench, or DB Browser for SQLite

### Knowledge Requirements

- C# and ASP.NET Core 8.0 (minimal API pattern)
- TypeScript and Next.js 16 (App Router)
- Entity Framework Core 8.0
- React 19 and Tailwind CSS v4
- JWT authentication patterns
- Database design (multi-provider support)

---

## Phase 1: Project Setup & Database Foundation

**Duration**: 2-3 days

### 1.1 Install Backend Dependencies

Navigate to `Backend/` directory and install NuGet packages:

```bash
cd Backend

# Entity Framework Core with multi-provider support
dotnet add package Microsoft.EntityFrameworkCore --version 8.0.0
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.0
dotnet add package Microsoft.EntityFrameworkCore.Sqlite --version 8.0.0
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 8.0.0
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL --version 8.0.0
dotnet add package Pomelo.EntityFrameworkCore.MySql --version 8.0.0

# Authentication & Security
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0.0
dotnet add package System.IdentityModel.Tokens.Jwt --version 7.0.0
dotnet add package BCrypt.Net-Next --version 4.0.3

# Image Processing
dotnet add package SixLabors.ImageSharp --version 3.1.0

# OpenAPI/Swagger
dotnet add package Swashbuckle.AspNetCore --version 6.5.0

# Testing
dotnet add package xUnit --version 2.6.0
dotnet add package Moq --version 4.20.0
dotnet add package FluentAssertions --version 6.12.0
dotnet add package Microsoft.AspNetCore.Mvc.Testing --version 8.0.0
```

### 1.2 Create Database Contexts

Create `Data/HeadOfficeDbContext.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Backend.Models.Entities.HeadOffice;

namespace Backend.Data;

public class HeadOfficeDbContext : DbContext
{
    public HeadOfficeDbContext(DbContextOptions<HeadOfficeDbContext> options)
        : base(options)
    {
    }

    public DbSet<Branch> Branches { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<BranchUser> BranchUsers { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<MainSetting> MainSettings { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<UserActivityLog> UserActivityLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure indexes, relationships, and constraints
        // See data-model.md for complete schema

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.PasswordHash).IsRequired();
        });

        modelBuilder.Entity<Branch>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.LoginName).IsUnique();
        });

        modelBuilder.Entity<BranchUser>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.BranchId }).IsUnique();
        });

        // Add remaining entity configurations...
    }
}
```

Create `Data/BranchDbContext.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Backend.Models.Entities.Branch;

namespace Backend.Data;

public class BranchDbContext : DbContext
{
    public BranchDbContext(DbContextOptions<BranchDbContext> options)
        : base(options)
    {
    }

    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<Sale> Sales { get; set; }
    public DbSet<SaleLineItem> SaleLineItems { get; set; }
    public DbSet<Purchase> Purchases { get; set; }
    public DbSet<PurchaseLineItem> PurchaseLineItems { get; set; }
    public DbSet<Expense> Expenses { get; set; }
    public DbSet<ExpenseCategory> ExpenseCategories { get; set; }
    public DbSet<Setting> Settings { get; set; }
    public DbSet<SyncQueue> SyncQueue { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure branch database entities
        // See data-model.md for complete schema

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasIndex(e => e.SKU).IsUnique();
            entity.Property(e => e.SellingPrice).HasPrecision(18, 2);
            entity.Property(e => e.CostPrice).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Sale>(entity =>
        {
            entity.HasIndex(e => e.TransactionId).IsUnique();
            entity.HasIndex(e => e.InvoiceNumber).IsUnique();
            entity.Property(e => e.Total).HasPrecision(18, 2);
        });

        // Add remaining entity configurations...
    }
}
```

Create `Data/DbContextFactory.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Backend.Models.Entities.HeadOffice;

namespace Backend.Data;

public class DbContextFactory
{
    private readonly IConfiguration _configuration;
    private readonly Dictionary<Guid, DbContextOptions<BranchDbContext>> _branchContextCache;

    public DbContextFactory(IConfiguration configuration)
    {
        _configuration = configuration;
        _branchContextCache = new Dictionary<Guid, DbContextOptions<BranchDbContext>>();
    }

    public BranchDbContext CreateBranchContext(Branch branch)
    {
        if (!_branchContextCache.TryGetValue(branch.Id, out var options))
        {
            options = BuildBranchContextOptions(branch);
            _branchContextCache[branch.Id] = options;
        }

        return new BranchDbContext(options);
    }

    private DbContextOptions<BranchDbContext> BuildBranchContextOptions(Branch branch)
    {
        var builder = new DbContextOptionsBuilder<BranchDbContext>();

        switch (branch.DatabaseProvider)
        {
            case DatabaseProvider.SQLite:
                builder.UseSqlite(branch.ConnectionString);
                break;
            case DatabaseProvider.MSSQL:
                builder.UseSqlServer(branch.ConnectionString);
                break;
            case DatabaseProvider.PostgreSQL:
                builder.UseNpgsql(branch.ConnectionString);
                break;
            case DatabaseProvider.MySQL:
                builder.UseMySql(branch.ConnectionString, ServerVersion.AutoDetect(branch.ConnectionString));
                break;
            default:
                throw new NotSupportedException($"Database provider {branch.DatabaseProvider} is not supported");
        }

        return builder.Options;
    }
}
```

### 1.3 Configure Dependency Injection

Update `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Configure Head Office database (SQLite default, configurable)
builder.Services.AddDbContext<HeadOfficeDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("HeadOfficeDb")));

// Register DbContextFactory for branch databases
builder.Services.AddSingleton<DbContextFactory>();

// Configure JWT authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"]))
        };
    });

builder.Services.AddAuthorization();

// Add services to the container
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
// Add remaining services...

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Multi-Branch POS API",
        Version = "v1"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

// Map endpoints (see API contracts)
// app.MapAuthEndpoints();
// app.MapSalesEndpoints();
// etc.

app.Run();
```

### 1.4 Create EF Core Migrations

```bash
# Create migrations for Head Office DB
dotnet ef migrations add InitialCreate --context HeadOfficeDbContext --output-dir Data/Migrations/HeadOffice

# Apply migration to create database
dotnet ef database update --context HeadOfficeDbContext

# Note: Branch databases are created dynamically when branches are added
```

### 1.5 Install Frontend Dependencies

Navigate to `frontend/` directory:

```bash
cd ../frontend

# Install core dependencies
npm install next@16 react@19 react-dom@19

# Install UI and styling
npm install tailwindcss@4 @tailwindcss/postcss
npm install @headlessui/react @heroicons/react

# Install internationalization
npm install next-intl

# Install data fetching and state management
npm install swr axios

# Install form handling and validation
npm install react-hook-form zod @hookform/resolvers

# Install dev dependencies
npm install --save-dev @types/react @types/react-dom @types/node
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev msw
```

### 1.6 Configure Next.js for Internationalization

Update `next.config.js`:

```javascript
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
};

module.exports = withNextIntl(nextConfig);
```

Create `i18n.ts`:

```typescript
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./public/locales/${locale}/common.json`)).default,
}));
```

Create middleware for i18n routing (`middleware.ts`):

```typescript
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

---

## Phase 2: Authentication Implementation

**Duration**: 3-4 days

### 2.1 Implement JWT Token Service

Create `Services/Auth/JwtTokenService.cs`:

```csharp
public interface IJwtTokenService
{
    string GenerateAccessToken(User user, Branch? branch = null);
    string GenerateRefreshToken();
    Task<RefreshToken> ValidateRefreshToken(string token);
    Task RevokeRefreshToken(string token);
}

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;
    private readonly HeadOfficeDbContext _context;

    public JwtTokenService(IConfiguration configuration, HeadOfficeDbContext context)
    {
        _configuration = configuration;
        _context = context;
    }

    public string GenerateAccessToken(User user, Branch? branch = null)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("isHeadOfficeAdmin", user.IsHeadOfficeAdmin.ToString())
        };

        if (branch != null)
        {
            claims.Add(new Claim("branchId", branch.Id.ToString()));
            claims.Add(new Claim("branchCode", branch.Code));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    // Implement remaining methods...
}
```

### 2.2 Implement Authentication Endpoints

See [contracts/auth.md](./contracts/auth.md) for complete API specification.

Create endpoint mappings in `Program.cs`:

```csharp
app.MapPost("/api/v1/auth/login", async (LoginRequest request, IAuthService authService) =>
{
    var result = await authService.LoginAsync(request.BranchName, request.Username, request.Password);

    if (!result.Success)
        return Results.Unauthorized();

    // Set refresh token in HttpOnly cookie
    var cookieOptions = new CookieOptions
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        MaxAge = TimeSpan.FromDays(7)
    };

    response.Cookies.Append("refreshToken", result.RefreshToken, cookieOptions);

    return Results.Ok(new
    {
        success = true,
        data = new
        {
            accessToken = result.AccessToken,
            accessTokenExpiresIn = 900,
            user = result.User
        },
        message = "Login successful"
    });
});

// Add remaining auth endpoints...
```

### 2.3 Implement Frontend Auth Service

Create `frontend/services/auth.service.ts`:

```typescript
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5001/api/v1';

export interface LoginRequest {
  branchName: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  accessTokenExpiresIn: number;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    preferredLanguage: string;
    isHeadOfficeAdmin: boolean;
    branches: Array<{
      branchId: string;
      branchName: string;
      role: string;
    }>;
  };
}

class AuthService {
  private accessToken: string | null = null;

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await axios.post(`${API_BASE}/auth/login`, credentials, {
      withCredentials: true // Include cookies
    });

    this.accessToken = response.data.data.accessToken;
    return response.data.data;
  }

  async logout(): Promise<void> {
    await axios.post(`${API_BASE}/auth/logout`, {}, {
      withCredentials: true,
      headers: this.getAuthHeaders()
    });

    this.accessToken = null;
  }

  async refreshToken(): Promise<string> {
    const response = await axios.post(`${API_BASE}/auth/refresh`, {}, {
      withCredentials: true
    });

    this.accessToken = response.data.data.accessToken;
    return this.accessToken;
  }

  getAuthHeaders() {
    return this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {};
  }
}

export const authService = new AuthService();
```

---

## Phase 3: Sales Module Implementation

**Duration**: 5-7 days

### 3.1 Implement Sales Service (Backend)

See [data-model.md](./data-model.md) for entity definitions and [contracts/sales.md](./contracts/sales.md) for API contracts.

### 3.2 Implement Sales UI (Frontend)

Create sales processing page at `frontend/app/[locale]/branch/sales/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { salesService } from '@/services/sales.service';
import { ProductSearch } from '@/components/sales/ProductSearch';
import { SaleLineItemsList } from '@/components/sales/SaleLineItemsList';
import { PaymentSection } from '@/components/sales/PaymentSection';

export default function SalesPage() {
  const [lineItems, setLineItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAddProduct = (product, quantity) => {
    setLineItems(prev => [...prev, { product, quantity }]);
  };

  const handleCompleteSale = async (paymentDetails) => {
    setLoading(true);
    try {
      const sale = await salesService.createSale({
        customerId: null,
        invoiceType: 0, // Touch invoice
        lineItems: lineItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
          discountType: 0,
          discountValue: 0
        })),
        paymentMethod: paymentDetails.method,
        paymentReference: paymentDetails.reference
      });

      // Show success, print invoice
      router.push(`/branch/sales/${sale.id}/invoice`);
    } catch (error) {
      // Handle error (offline queue if no connection)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sales-page">
      <ProductSearch onAddProduct={handleAddProduct} />
      <SaleLineItemsList items={lineItems} />
      <PaymentSection onComplete={handleCompleteSale} loading={loading} />
    </div>
  );
}
```

---

## Phase 4: Offline Sync Implementation

**Duration**: 4-5 days

### 4.1 Implement IndexedDB Queue (Frontend)

See [research.md](./research.md#3-offline-sync-queue--conflict-resolution-implementation) for detailed architecture.

Create `frontend/lib/offline-sync.ts`:

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface QueuedTransaction {
  id: string;
  type: 'sale' | 'purchase' | 'expense';
  timestamp: Date;
  branchId: string;
  userId: string;
  data: any;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
  lastError?: string;
}

interface OfflineQueueDB extends DBSchema {
  transactions: {
    key: string;
    value: QueuedTransaction;
    indexes: { 'by-status': string; 'by-timestamp': Date };
  };
}

class OfflineQueue {
  private db: IDBPDatabase<OfflineQueueDB> | null = null;

  async init() {
    this.db = await openDB<OfflineQueueDB>('OfflineQueue', 1, {
      upgrade(db) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('by-status', 'status');
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }

  async add(transaction: Omit<QueuedTransaction, 'status' | 'retryCount'>) {
    if (!this.db) await this.init();

    await this.db!.add('transactions', {
      ...transaction,
      status: 'pending',
      retryCount: 0
    });
  }

  async getPending(): Promise<QueuedTransaction[]> {
    if (!this.db) await this.init();

    const tx = this.db!.transaction('transactions', 'readonly');
    const index = tx.store.index('by-timestamp');
    return await index.getAll();
  }

  async syncAll() {
    const pending = await this.getPending();

    for (const transaction of pending) {
      try {
        await this.syncTransaction(transaction);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }

  private async syncTransaction(transaction: QueuedTransaction) {
    // Update status to syncing
    await this.updateStatus(transaction.id, 'syncing');

    try {
      // Send to backend
      const response = await fetch('/api/v1/sync/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getAccessToken()}`
        },
        body: JSON.stringify(transaction)
      });

      if (response.ok) {
        // Mark as completed and remove
        await this.remove(transaction.id);
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      // Increment retry count
      const newRetryCount = transaction.retryCount + 1;

      if (newRetryCount >= 3) {
        await this.updateStatus(transaction.id, 'failed', error.message);
      } else {
        await this.updateRetryCount(transaction.id, newRetryCount);
        await this.updateStatus(transaction.id, 'pending');
      }
    }
  }

  // Implement remaining helper methods...
}

export const offlineQueue = new OfflineQueue();
```

### 4.2 Implement Sync Service (Backend)

See [research.md](./research.md#3-offline-sync-queue--conflict-resolution-implementation) for conflict resolution strategy.

---

## Phase 5: Testing Strategy

### 5.1 Backend Unit Tests

Create `Backend.UnitTests/Services/SalesServiceTests.cs`:

```csharp
public class SalesServiceTests
{
    [Fact]
    public async Task CreateSale_ValidSale_ReturnsSaleWithCalculatedTotals()
    {
        // Arrange
        var mockContext = CreateMockContext();
        var service = new SalesService(mockContext);

        var saleDto = new CreateSaleDto
        {
            LineItems = new[]
            {
                new SaleLineItemDto { ProductId = Guid.NewGuid(), Quantity = 2, UnitPrice = 100 }
            },
            PaymentMethod = PaymentMethod.Cash
        };

        // Act
        var result = await service.CreateSaleAsync(saleDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.Subtotal);
        Assert.True(result.Total > 0);
    }
}
```

### 5.2 Frontend Component Tests

Create `frontend/__tests__/components/SalesForm.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SalesForm } from '@/components/sales/SalesForm';

describe('SalesForm', () => {
  test('adds product to line items', async () => {
    render(<SalesForm />);

    const productSearch = screen.getByPlaceholderText('Search products...');
    fireEvent.change(productSearch, { target: { value: 'Mouse' } });

    // Wait for search results
    const product = await screen.findByText('Wireless Mouse');
    fireEvent.click(product);

    // Verify product added
    expect(screen.getByText('Wireless Mouse')).toBeInTheDocument();
  });
});
```

---

## Implementation Order

Follow this order for systematic development:

1. ✅ **Phase 1**: Database setup, EF Core contexts, migrations (Days 1-3)
2. ✅ **Phase 2**: Authentication (JWT, login/logout, refresh tokens) (Days 4-7)
3. **Phase 3**: Branch management (head office CRUD, database provisioning) (Days 8-12)
4. **Phase 4**: Product & Category management (Days 13-16)
5. **Phase 5**: Sales module (online mode) (Days 17-23)
6. **Phase 6**: Customer management (Days 24-26)
7. **Phase 7**: Offline sync implementation (Days 27-31)
8. **Phase 8**: Purchase orders and suppliers (Days 32-36)
9. **Phase 9**: Expense tracking (Days 37-40)
10. **Phase 10**: Reporting and analytics (Days 41-45)
11. **Phase 11**: Image upload and optimization (Days 46-48)
12. **Phase 12**: Audit logging (Days 49-50)
13. **Phase 13**: Internationalization (English/Arabic) (Days 51-53)
14. **Phase 14**: Testing and bug fixes (Days 54-60)

**Total Estimated Duration**: 60 working days (12 weeks) for MVP

---

## Development Best Practices

### Code Organization

- Follow Constitution principles from [.specify/memory/constitution.md](../../../.specify/memory/constitution.md)
- Keep services focused (Single Responsibility)
- Use dependency injection
- Separate DTOs from entities

### Testing

- Write tests BEFORE implementing complex logic (TDD)
- Aim for 80%+ coverage on business logic
- Test offline scenarios explicitly
- Test concurrent operations

### Git Workflow

- Work on feature branch `001-multi-branch-pos`
- Commit frequently with meaningful messages
- Use conventional commits: `feat(sales): add invoice generation`
- Create PR when feature group complete (e.g., auth, sales)

### Database Migrations

- Never edit existing migrations (create new ones)
- Test migrations on all 4 database providers
- Include sample data seeding for development

---

## Troubleshooting Common Issues

### Issue: EF Core migration fails on MySQL

**Solution**: Ensure connection string includes `GuidFormat=Char36`:

```
Server=localhost;Database=pos_branch;Uid=root;Pwd=password;GuidFormat=Char36;
```

### Issue: CORS errors in frontend

**Solution**: Configure CORS in `Program.cs`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowCredentials()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

app.UseCors();
```

### Issue: JWT token not persisting

**Solution**: Ensure cookies are configured correctly (HttpOnly, Secure, SameSite).

### Issue: IndexedDB not available

**Solution**: Check browser compatibility and HTTPS requirement (IndexedDB requires secure context).

---

## Next Steps

After completing this quickstart:

1. Review [tasks.md](./tasks.md) (generated by `/speckit.tasks` command) for detailed task breakdown
2. Set up CI/CD pipeline for automated testing and deployment
3. Configure staging environment for testing
4. Plan user acceptance testing (UAT) with stakeholders

---

**Happy coding!** Refer to design documents for detailed specifications throughout implementation.
