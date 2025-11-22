# Research & Technology Decisions

**Feature**: Multi-Branch POS System
**Date**: 2025-01-21
**Phase**: 0 - Research & Architecture

## Overview

This document captures research findings and technology decisions for implementing the Multi-Branch POS system. All NEEDS CLARIFICATION items from the Technical Context have been investigated and resolved.

---

## 1. JWT Refresh Token & Session Management Strategy

### Decision

Implement JWT access/refresh token pattern with the following specifications:
- **Access Token**: Short-lived (15 minutes), contains user claims (ID, branch, role)
- **Refresh Token**: Long-lived (7 days), stored securely, used to obtain new access tokens
- **Session Management**: Server-side session tracking with automatic 30-minute inactivity timeout
- **Token Storage**: HttpOnly cookies for web clients (prevents XSS attacks)

### Rationale

- Short-lived access tokens minimize damage from token theft
- Refresh tokens enable seamless user experience without frequent re-authentication
- HttpOnly cookies prevent JavaScript access, mitigating XSS risks
- Server-side session tracking enables forced logout and activity monitoring
- 30-minute inactivity timeout balances security with usability (per requirement FR-043)

### Implementation Approach

**Backend (ASP.NET Core)**:
```csharp
// Use System.IdentityModel.Tokens.Jwt
// Services/Auth/JwtTokenService.cs will handle:
- GenerateAccessToken(User user) → JWT with 15min expiry
- GenerateRefreshToken() → Cryptographically secure random string
- ValidateRefreshToken(string token) → Check DB, expiry, user status
- RevokeRefreshToken(string token) → Mark token as revoked in DB

// Middleware/SessionMiddleware.cs will:
- Track last activity timestamp per user session
- Auto-logout after 30 minutes of inactivity
- Extend session on each authenticated request
```

**Frontend (Next.js)**:
```typescript
// services/auth.service.ts
- Automatically refresh access token when expired (401 response)
- Track user activity (mouse, keyboard events)
- Trigger inactivity warning at 28 minutes
- Auto-logout at 30 minutes
```

**Database Schema**:
```sql
RefreshTokens table:
- Id (GUID)
- UserId (FK)
- Token (string, indexed)
- ExpiresAt (DateTime)
- CreatedAt (DateTime)
- RevokedAt (DateTime, nullable)
- LastActivityAt (DateTime)
```

### Alternatives Considered

1. **Stateless JWT only**: Rejected because cannot force logout or track activity
2. **Session-only (no JWT)**: Rejected because doesn't work well with offline mode
3. **Longer access token expiry**: Rejected due to security concerns

---

## 2. Branch Data Isolation & Security Architecture

### Decision

Implement **application-level multi-tenancy** with physical database separation per branch and row-level security at application layer:

- **Head Office Database**: Single SQLite/SQL Server/PostgreSQL/MySQL database containing branch metadata, user assignments, and global settings
- **Branch Databases**: Separate database per branch (each can use different provider: SQLite, MSSQL, PostgreSQL, MySQL)
- **Database Connection Strategy**: Dynamic connection string resolution based on authenticated user's branch assignment
- **Data Isolation**: Application enforces branch context via middleware; users can only access data for their assigned branch(es)

### Rationale

- Physical database separation provides strongest data isolation (regulatory compliance, data residency)
- Supports requirement for per-branch database provider selection
- Enables independent scaling, backup, and migration per branch
- Simplifies offline sync (branch can have local copy of its own database)
- Application-level security provides flexibility for head office cross-branch access

### Implementation Approach

**Database Architecture**:
```
HeadOfficeDB (Provider: SQLite/MSSQL/PostgreSQL/MySQL)
├── Branches table (Id, Name, ConnectionString, Provider, etc.)
├── BranchUsers table (UserId, BranchId, Role)
├── Users table (shared across system)
├── MainSettings table
└── UserActivityLog table

BranchDB_Branch001 (Provider: SQLite)
├── Categories
├── Products
├── Sales
└── [other branch entities]

BranchDB_Branch002 (Provider: MySQL)
├── Categories
├── Products
└── [same schema, different provider]
```

**Middleware Flow**:
```csharp
// Middleware/BranchContextMiddleware.cs
1. Extract JWT token from request
2. Read user's BranchId from token claims
3. If head office user (BranchId = "all"), allow cross-branch queries
4. Else, resolve branch-specific connection string from HeadOfficeDB
5. Set HttpContext.Items["BranchContext"] with connection details
6. Services use this context to connect to correct branch DB
```

**Connection Pooling**:
```csharp
// Data/DbContextFactory.cs
- Maintain connection pool per branch database
- Use EF Core's DbContext pooling (services.AddDbContextPool)
- Maximum pool size: 100 connections per branch
- Connection timeout: 30 seconds
```

### Alternatives Considered

1. **Single shared database with BranchId column**: Rejected because doesn't meet data isolation requirements and prevents per-branch provider selection
2. **Schema-based multi-tenancy**: Rejected because not supported by all target database providers (SQLite doesn't have schemas)
3. **Complete physical server separation**: Rejected as over-engineering for initial scope (50 branches)

---

## 3. Offline Sync Queue & Conflict Resolution Implementation

### Decision

Implement **client-side offline queue with last-commit-wins conflict resolution**:

**Offline Queue Storage**:
- **Browser**: IndexedDB for persistent storage across sessions
- **Queue Structure**: Transaction-based with retry logic and error tracking

**Sync Strategy**:
- **Automatic Detection**: Service Worker or polling detects connectivity changes
- **Background Sync**: Web Background Sync API (with polling fallback)
- **Batch Processing**: Process queued transactions in chronological order
- **Conflict Resolution**: Last-commit-wins (per requirement FR-067)

### Rationale

- IndexedDB provides persistent client-side storage (survives browser restarts)
- Transaction-based approach ensures atomic operations
- Last-commit-wins is simple, predictable, and matches requirements
- Background Sync API enables sync even when tab is closed
- Chronological processing preserves operation ordering

### Implementation Approach

**Frontend (Next.js)**:
```typescript
// lib/offline-sync.ts
interface QueuedTransaction {
  id: string;
  type: 'sale' | 'purchase' | 'expense' | 'inventory_adjust';
  timestamp: Date;
  branchId: string;
  userId: string;
  data: any;  // Transaction-specific payload
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
  lastError?: string;
}

// IndexedDB Schema
DB: "OfflineQueue"
ObjectStore: "transactions"
  - keyPath: "id"
  - index: "status"
  - index: "timestamp"

// Sync Process
1. Detect online status (navigator.onLine + periodic API ping)
2. Fetch pending transactions from IndexedDB (status = 'pending')
3. Sort by timestamp (chronological order)
4. For each transaction:
   a. Mark as 'syncing'
   b. POST to /api/sync/transaction
   c. On success: Mark as 'completed', remove from queue
   d. On failure: Increment retryCount, mark as 'pending' or 'failed' (max 3 retries)
5. Update UI sync status indicator
```

**Backend (ASP.NET Core)**:
```csharp
// Services/Sync/SyncService.cs
public async Task<SyncResult> ProcessOfflineTransaction(QueuedTransaction transaction)
{
    // Begin database transaction
    using var dbTransaction = await _context.Database.BeginTransactionAsync();

    try
    {
        switch (transaction.Type)
        {
            case "sale":
                await ProcessOfflineSale(transaction.Data);
                break;
            case "purchase":
                await ProcessOfflinePurchase(transaction.Data);
                break;
            // ... other types
        }

        // Last-commit-wins: Accept transaction even if conflicts
        // Flag inventory if negative after sync
        await _context.SaveChangesAsync();
        await dbTransaction.CommitAsync();

        return SyncResult.Success();
    }
    catch (Exception ex)
    {
        await dbTransaction.RollbackAsync();
        return SyncResult.Failure(ex.Message);
    }
}

// Conflict Detection
private async Task ProcessOfflineSale(SaleData saleData)
{
    // Calculate new inventory levels
    foreach (var lineItem in saleData.LineItems)
    {
        var product = await _context.Products.FindAsync(lineItem.ProductId);
        product.StockLevel -= lineItem.Quantity;

        // Flag if negative (concurrent sales during offline)
        if (product.StockLevel < 0)
        {
            product.HasInventoryDiscrepancy = true;
            await _notificationService.AlertManager(product, "Negative stock detected");
        }
    }
}
```

**Visual Indicators**:
```typescript
// components/shared/SyncStatusIndicator.tsx
- Green: Online, all synced
- Yellow: Syncing (show count of pending transactions)
- Red: Offline (show count of queued transactions)
- Error: Sync failures (allow manual retry)
```

### Alternatives Considered

1. **Server-side conflict resolution with complex merging**: Rejected as over-engineering; requirement explicitly states last-commit-wins
2. **Operational Transformation (OT) or CRDT**: Rejected due to complexity; not needed for POS transactions
3. **Local SQLite sync**: Rejected for browser clients (not available in browsers); IndexedDB is standard
4. **Firebase/Supabase realtime sync**: Rejected to avoid external dependencies

---

## 4. Multi-Database Connection Management & Pooling

### Decision

Use **Entity Framework Core's multi-provider support** with per-branch DbContext pooling:

**Provider Support**:
- SQLite: `Microsoft.EntityFrameworkCore.Sqlite`
- SQL Server: `Microsoft.EntityFrameworkCore.SqlServer`
- PostgreSQL: `Npgsql.EntityFrameworkCore.PostgreSQL`
- MySQL: `Pomelo.EntityFrameworkCore.MySql`

**Connection Strategy**:
- Dynamic provider selection at runtime based on branch configuration
- Connection string builder with field-level inputs (server, database, user, password, port)
- DbContext pooling per branch database (reuse connections)
- Health checks to validate connections before use

### Rationale

- EF Core provides unified API across all four database providers
- Connection pooling significantly improves performance (reuse expensive connections)
- Dynamic provider selection enables per-branch customization
- Health checks prevent cascading failures from database connectivity issues

### Implementation Approach

**Configuration Model**:
```csharp
// Models/Entities/HeadOffice/Branch.cs
public class Branch
{
    public Guid Id { get; set; }
    public string Name { get; set; }

    // Database Configuration (split fields for easier input)
    public DatabaseProvider Provider { get; set; }  // Enum: SQLite, MSSQL, PostgreSQL, MySQL
    public string Server { get; set; }              // e.g., "localhost" or file path for SQLite
    public string DatabaseName { get; set; }
    public int Port { get; set; }                   // Provider-specific default
    public string Username { get; set; }
    public string Password { get; set; }            // Encrypted at rest
    public string AdditionalParams { get; set; }    // e.g., "TrustServerCertificate=true"

    // Derived property
    public string ConnectionString => BuildConnectionString();
}
```

**DbContext Factory**:
```csharp
// Data/DbContextFactory.cs
public class DbContextFactory
{
    private readonly IConfiguration _configuration;
    private readonly Dictionary<Guid, ObjectPool<BranchDbContext>> _contextPools;

    public BranchDbContext CreateDbContext(Branch branch)
    {
        // Check if pool exists for this branch
        if (!_contextPools.ContainsKey(branch.Id))
        {
            // Create new pool for this branch
            var pool = CreateContextPool(branch);
            _contextPools[branch.Id] = pool;
        }

        // Get pooled context
        return _contextPools[branch.Id].Get();
    }

    private ObjectPool<BranchDbContext> CreateContextPool(Branch branch)
    {
        var optionsBuilder = new DbContextOptionsBuilder<BranchDbContext>();

        switch (branch.Provider)
        {
            case DatabaseProvider.SQLite:
                optionsBuilder.UseSqlite(branch.ConnectionString);
                break;
            case DatabaseProvider.MSSQL:
                optionsBuilder.UseSqlServer(branch.ConnectionString);
                break;
            case DatabaseProvider.PostgreSQL:
                optionsBuilder.UseNpgsql(branch.ConnectionString);
                break;
            case DatabaseProvider.MySQL:
                optionsBuilder.UseMySql(branch.ConnectionString, ServerVersion.AutoDetect(branch.ConnectionString));
                break;
        }

        // Enable connection pooling
        optionsBuilder.EnableThreadSafetyChecks(false);  // Pool handles thread safety

        return new DefaultObjectPool<BranchDbContext>(
            new PooledDbContextFactory<BranchDbContext>(optionsBuilder.Options),
            maximumRetained: 100  // Max 100 pooled connections per branch
        );
    }
}
```

**Connection String Builder**:
```csharp
// Utilities/ConnectionStringBuilder.cs
public static string BuildConnectionString(Branch branch)
{
    return branch.Provider switch
    {
        DatabaseProvider.SQLite =>
            $"Data Source={branch.Server}/{branch.DatabaseName}.db",

        DatabaseProvider.MSSQL =>
            $"Server={branch.Server},{branch.Port};Database={branch.DatabaseName};User Id={branch.Username};Password={branch.Password};{branch.AdditionalParams}",

        DatabaseProvider.PostgreSQL =>
            $"Host={branch.Server};Port={branch.Port};Database={branch.DatabaseName};Username={branch.Username};Password={branch.Password};{branch.AdditionalParams}",

        DatabaseProvider.MySQL =>
            $"Server={branch.Server};Port={branch.Port};Database={branch.DatabaseName};Uid={branch.Username};Pwd={branch.Password};{branch.AdditionalParams}",

        _ => throw new NotSupportedException($"Provider {branch.Provider} not supported")
    };
}
```

**Health Checks**:
```csharp
// Program.cs
builder.Services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database");

// Health/DatabaseHealthCheck.cs
public class DatabaseHealthCheck : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context)
    {
        try
        {
            // Test connection to each branch database
            foreach (var branch in _branches)
            {
                using var dbContext = _factory.CreateDbContext(branch);
                await dbContext.Database.CanConnectAsync();
            }
            return HealthCheckResult.Healthy();
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database connection failed", ex);
        }
    }
}
```

### Alternatives Considered

1. **Single database provider for all branches**: Rejected; requirement explicitly supports multiple providers
2. **Manual connection management (no pooling)**: Rejected due to poor performance under concurrent load
3. **Dapper instead of EF Core**: Rejected because would require provider-specific SQL dialects; EF Core abstracts this

---

## 5. Image Storage & Optimization Pipeline

### Decision

Implement **server-side image processing pipeline** with filesystem storage:

**Storage Structure**:
```
Uploads/
└── Branches/
    └── [BranchName]/
        └── [EntityType]/  (Products, Categories, Customers, etc.)
            └── [EntityId]/
                ├── original.jpg     (Full resolution, preserved)
                ├── large.jpg        (1200px max dimension)
                ├── medium.jpg       (600px max dimension)
                └── thumb.jpg        (150px max dimension)
```

**Image Processing**:
- **Library**: SixLabors.ImageSharp (cross-platform, high-performance)
- **Formats**: Accept JPEG, PNG, WebP; convert to WebP for storage (better compression)
- **Quality**: 85% JPEG/WebP quality (good balance of size vs quality)
- **Max Upload Size**: 10MB per image

### Rationale

- Filesystem storage is simple, reliable, and doesn't bloat database
- Multiple sizes enable responsive images (serve appropriate size per device)
- ImageSharp is .NET native, performant, and supports modern formats
- Folder structure provides clear organization and easy backup/migration
- WebP provides 25-30% better compression than JPEG

### Implementation Approach

**Backend Service**:
```csharp
// Services/Images/ImageService.cs
public interface IImageService
{
    Task<ImageResult> UploadImageAsync(string branchName, string entityType, Guid entityId, Stream imageStream, string fileName);
    Task<bool> DeleteImageAsync(string imagePath);
    string GetImagePath(string branchName, string entityType, Guid entityId, ImageSize size);
}

public class ImageService : IImageService
{
    private readonly string _uploadBasePath = "Uploads/Branches";

    public async Task<ImageResult> UploadImageAsync(
        string branchName,
        string entityType,
        Guid entityId,
        Stream imageStream,
        string fileName)
    {
        // Validate image
        using var image = await Image.LoadAsync(imageStream);

        // Create directory structure
        var entityPath = Path.Combine(_uploadBasePath, branchName, entityType, entityId.ToString());
        Directory.CreateDirectory(entityPath);

        // Save original
        var originalPath = Path.Combine(entityPath, "original.jpg");
        await image.SaveAsync(originalPath, new JpegEncoder { Quality = 100 });

        // Generate thumbnails
        await GenerateThumbnail(image, entityPath, "large", 1200);
        await GenerateThumbnail(image, entityPath, "medium", 600);
        await GenerateThumbnail(image, entityPath, "thumb", 150);

        return new ImageResult
        {
            Success = true,
            Path = originalPath,
            Thumbnails = new[] { "large.jpg", "medium.jpg", "thumb.jpg" }
        };
    }

    private async Task GenerateThumbnail(Image image, string basePath, string sizeName, int maxDimension)
    {
        var clone = image.Clone(ctx => {
            ctx.Resize(new ResizeOptions
            {
                Mode = ResizeMode.Max,
                Size = new Size(maxDimension, maxDimension)
            });
        });

        var path = Path.Combine(basePath, $"{sizeName}.jpg");
        await clone.SaveAsync(path, new WebpEncoder { Quality = 85 });
    }
}
```

**API Endpoint**:
```csharp
// Program.cs
app.MapPost("/api/images/upload", async (
    HttpRequest request,
    IImageService imageService,
    [FromQuery] string branchName,
    [FromQuery] string entityType,
    [FromQuery] Guid entityId) =>
{
    var file = request.Form.Files[0];

    // Validate file size
    if (file.Length > 10 * 1024 * 1024)  // 10MB
        return Results.BadRequest("File too large");

    using var stream = file.OpenReadStream();
    var result = await imageService.UploadImageAsync(
        branchName,
        entityType,
        entityId,
        stream,
        file.FileName);

    return Results.Ok(result);
})
.RequireAuthorization()
.DisableAntiforgery();

// Serve images
app.MapGet("/api/images/{branchName}/{entityType}/{entityId}/{size}", (
    string branchName,
    string entityType,
    Guid entityId,
    string size) =>
{
    var path = Path.Combine("Uploads", "Branches", branchName, entityType, entityId.ToString(), $"{size}.jpg");

    if (!File.Exists(path))
        return Results.NotFound();

    return Results.File(path, "image/webp");
});
```

**Frontend Usage**:
```typescript
// components/shared/OptimizedImage.tsx
interface Props {
  branchName: string;
  entityType: string;
  entityId: string;
  alt: string;
  size: 'thumb' | 'medium' | 'large' | 'original';
}

export const OptimizedImage: React.FC<Props> = ({ branchName, entityType, entityId, size, alt }) => {
  const src = `/api/images/${branchName}/${entityType}/${entityId}/${size}`;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"  // Native lazy loading
    />
  );
};
```

### Alternatives Considered

1. **Store images in database as BLOB**: Rejected due to database bloat and poor performance
2. **Cloud storage (S3, Azure Blob)**: Deferred to future enhancement; filesystem simpler for MVP
3. **CDN integration**: Deferred to future enhancement; not needed for 50 branches initially
4. **Client-side image processing**: Rejected because not all clients have processing power; server is consistent

---

## 6. Audit Logging & User Activity Tracking

### Decision

Implement **database-based audit logging** with circular buffer for activity logs:

**Audit Scope**:
- **Security Events**: Login, logout, failed login attempts, password changes, permission changes
- **Business Events**: Sales, refunds, inventory adjustments, expense creation, price changes
- **Admin Actions**: User creation/deletion, branch configuration changes, settings updates

**Storage Strategy**:
- **Audit Logs**: Permanent retention in `AuditLog` table (head office DB)
- **Activity Logs**: Last 100 activities per user in `UserActivityLog` table (circular buffer, per requirement)

### Rationale

- Database storage enables efficient querying and reporting
- Circular buffer for activity logs prevents unbounded growth while meeting requirement
- Permanent audit logs for compliance and security investigations
- Structured data (not log files) enables rich filtering and analytics

### Implementation Approach

**Database Schema**:
```sql
-- Head Office Database
AuditLog:
- Id (GUID, PK)
- Timestamp (DateTime, indexed)
- UserId (FK)
- BranchId (FK, nullable)
- EventType (string) - 'Login', 'Sale', 'InventoryAdjust', etc.
- EntityType (string, nullable) - 'Product', 'User', 'Branch', etc.
- EntityId (GUID, nullable)
- Action (string) - 'Create', 'Update', 'Delete', 'View'
- OldValues (JSON, nullable) - Before state
- NewValues (JSON, nullable) - After state
- IpAddress (string)
- UserAgent (string)

UserActivityLog:
- Id (GUID, PK)
- UserId (FK, indexed)
- Timestamp (DateTime)
- ActivityType (string) - 'Login', 'Logout', 'PageView', etc.
- Description (string)
- BranchId (FK, nullable)
- IpAddress (string)
```

**Middleware**:
```csharp
// Middleware/AuditLoggingMiddleware.cs
public class AuditLoggingMiddleware
{
    public async Task InvokeAsync(HttpContext context, IAuditService auditService)
    {
        // Capture request details
        var userId = context.User.FindFirst("userId")?.Value;
        var branchId = context.Items["BranchId"]?.ToString();
        var ipAddress = context.Connection.RemoteIpAddress?.ToString();
        var userAgent = context.Request.Headers["User-Agent"].ToString();

        // Continue request
        await _next(context);

        // Log after response (don't block request)
        _ = Task.Run(async () =>
        {
            if (ShouldAudit(context.Request.Path))
            {
                await auditService.LogAsync(new AuditEntry
                {
                    UserId = userId,
                    BranchId = branchId,
                    EventType = DetermineEventType(context.Request),
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    Timestamp = DateTime.UtcNow
                });
            }
        });
    }

    private bool ShouldAudit(PathString path)
    {
        // Audit critical endpoints only (not health checks, static files, etc.)
        return path.StartsWithSegments("/api/sales") ||
               path.StartsWithSegments("/api/inventory") ||
               path.StartsWithSegments("/api/auth") ||
               path.StartsWithSegments("/api/branches") ||
               path.StartsWithSegments("/api/users");
    }
}
```

**Service**:
```csharp
// Services/Audit/AuditService.cs
public interface IAuditService
{
    Task LogAsync(AuditEntry entry);
    Task LogActivityAsync(Guid userId, string activityType, string description);
    Task<List<AuditEntry>> GetUserAuditTrailAsync(Guid userId, DateTime? from = null, DateTime? to = null);
    Task<List<UserActivity>> GetUserRecentActivityAsync(Guid userId, int count = 100);
}

public class AuditService : IAuditService
{
    public async Task LogActivityAsync(Guid userId, string activityType, string description)
    {
        // Fetch existing activities for user
        var activities = await _context.UserActivityLogs
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync();

        // Circular buffer: Keep only last 100 (per requirement FR-037)
        if (activities.Count >= 100)
        {
            var toRemove = activities.Skip(99).ToList();
            _context.UserActivityLogs.RemoveRange(toRemove);
        }

        // Add new activity
        _context.UserActivityLogs.Add(new UserActivityLog
        {
            UserId = userId,
            ActivityType = activityType,
            Description = description,
            Timestamp = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
    }
}
```

**Usage in Services**:
```csharp
// Services/Sales/SalesService.cs
public async Task<Sale> CreateSaleAsync(SaleDto saleDto)
{
    var sale = MapToEntity(saleDto);
    _context.Sales.Add(sale);
    await _context.SaveChangesAsync();

    // Log audit trail
    await _auditService.LogAsync(new AuditEntry
    {
        UserId = saleDto.CashierId,
        BranchId = saleDto.BranchId,
        EventType = "Sale",
        EntityType = "Sale",
        EntityId = sale.Id,
        Action = "Create",
        NewValues = JsonSerializer.Serialize(sale)
    });

    return sale;
}
```

### Alternatives Considered

1. **File-based logging (log files)**: Rejected because difficult to query and analyze
2. **Unlimited activity log retention**: Rejected per explicit requirement (last 100 per user)
3. **External logging service (Seq, ELK)**: Deferred to future; database sufficient for MVP
4. **Blockchain-based immutable audit log**: Rejected as over-engineering

---

## 7. Test Strategy for Offline Scenarios & Concurrent Operations

### Decision

Implement **multi-layered testing strategy** with emphasis on offline and concurrency scenarios:

**Test Layers**:
1. **Unit Tests**: Business logic, utilities, conflict resolution algorithms
2. **Integration Tests**: API endpoints, database operations, multi-provider support
3. **Offline Simulation Tests**: IndexedDB queue, sync process, connection interruption
4. **Concurrency Tests**: Simultaneous sales, inventory conflicts, last-commit-wins validation
5. **End-to-End Tests** (Optional for MVP): Critical user journeys across UI and API

### Rationale

- Offline and concurrency are high-risk areas requiring explicit test coverage
- Integration tests validate multi-database provider support works correctly
- Automated tests prevent regressions during development
- Test scenarios directly map to acceptance criteria in feature spec

### Implementation Approach

**Offline Sync Tests (Frontend)**:
```typescript
// __tests__/lib/offline-sync.test.ts
describe('Offline Sync Queue', () => {
  beforeEach(async () => {
    // Setup IndexedDB mock
    await setupIndexedDBMock();
  });

  test('queues sale transaction when offline', async () => {
    // Arrange
    const sale = createMockSale();
    mockNavigatorOnline(false);

    // Act
    const result = await salesService.createSale(sale);

    // Assert
    expect(result.status).toBe('queued');
    const queue = await offlineQueue.getPending();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('sale');
  });

  test('syncs queued transactions when connectivity restored', async () => {
    // Arrange
    await offlineQueue.add(createMockSale());
    await offlineQueue.add(createMockSale());
    mockNavigatorOnline(false);
    mockApiResponses([{ status: 200 }, { status: 200 }]);

    // Act
    mockNavigatorOnline(true);
    await offlineQueue.syncAll();

    // Assert
    const pending = await offlineQueue.getPending();
    expect(pending).toHaveLength(0);
    expect(mockApi).toHaveBeenCalledTimes(2);
  });

  test('retries failed transactions up to 3 times', async () => {
    // Arrange
    const sale = createMockSale();
    await offlineQueue.add(sale);
    mockApiResponses([
      { status: 500 },  // Fail 1
      { status: 500 },  // Fail 2
      { status: 500 },  // Fail 3
      { status: 200 }   // Should not be called (max retries exceeded)
    ]);

    // Act
    await offlineQueue.syncAll();

    // Assert
    expect(mockApi).toHaveBeenCalledTimes(3);
    const failed = await offlineQueue.getFailed();
    expect(failed).toHaveLength(1);
    expect(failed[0].retryCount).toBe(3);
  });

  test('processes transactions in chronological order', async () => {
    // Arrange
    const sale1 = createMockSale({ timestamp: new Date('2025-01-21T10:00:00') });
    const sale2 = createMockSale({ timestamp: new Date('2025-01-21T09:00:00') });
    const sale3 = createMockSale({ timestamp: new Date('2025-01-21T11:00:00') });

    await offlineQueue.add(sale1);
    await offlineQueue.add(sale2);
    await offlineQueue.add(sale3);

    const callOrder: Date[] = [];
    mockApiHandler((data) => {
      callOrder.push(new Date(data.timestamp));
      return { status: 200 };
    });

    // Act
    await offlineQueue.syncAll();

    // Assert
    expect(callOrder).toEqual([
      new Date('2025-01-21T09:00:00'),
      new Date('2025-01-21T10:00:00'),
      new Date('2025-01-21T11:00:00')
    ]);
  });
});
```

**Concurrency Tests (Backend)**:
```csharp
// Backend.IntegrationTests/ConcurrencyTests.cs
[Fact]
public async Task SimultaneousSales_LastCommitWins_FlagsNegativeInventory()
{
    // Arrange
    var product = new Product { Id = Guid.NewGuid(), StockLevel = 5 };
    await _context.Products.AddAsync(product);
    await _context.SaveChangesAsync();

    var sale1 = CreateSale(product.Id, quantity: 4);  // Stock after: 1
    var sale2 = CreateSale(product.Id, quantity: 3);  // Stock after: -2 (conflict!)

    // Act - Execute sales simultaneously
    var tasks = new[]
    {
        _salesService.CreateSaleAsync(sale1),
        _salesService.CreateSaleAsync(sale2)
    };

    var results = await Task.WhenAll(tasks);

    // Assert
    Assert.True(results[0].Success);
    Assert.True(results[1].Success);  // Both succeed (last-commit-wins)

    var updatedProduct = await _context.Products.FindAsync(product.Id);
    Assert.Equal(-2, updatedProduct.StockLevel);  // Negative inventory
    Assert.True(updatedProduct.HasInventoryDiscrepancy);  // Flagged

    // Verify manager notification sent
    var notifications = await _context.Notifications.Where(n => n.ProductId == product.Id).ToListAsync();
    Assert.Single(notifications);
    Assert.Contains("Negative stock", notifications[0].Message);
}

[Fact]
public async Task MultiProviderSupport_AllProvidersWork()
{
    // Arrange
    var providers = new[]
    {
        (DatabaseProvider.SQLite, "Data Source=test_sqlite.db"),
        (DatabaseProvider.MSSQL, "Server=(localdb)\\mssqllocaldb;Database=TestDB"),
        (DatabaseProvider.PostgreSQL, "Host=localhost;Database=test_pg"),
        (DatabaseProvider.MySQL, "Server=localhost;Database=test_mysql")
    };

    foreach (var (provider, connectionString) in providers)
    {
        // Act
        var branch = new Branch
        {
            Provider = provider,
            ConnectionString = connectionString
        };

        var context = _factory.CreateDbContext(branch);
        await context.Database.EnsureCreatedAsync();

        var product = new Product { Name = "Test Product" };
        context.Products.Add(product);
        await context.SaveChangesAsync();

        // Assert
        var retrieved = await context.Products.FirstOrDefaultAsync();
        Assert.NotNull(retrieved);
        Assert.Equal("Test Product", retrieved.Name);

        // Cleanup
        await context.Database.EnsureDeletedAsync();
    }
}
```

**Integration Tests for Offline Sync Backend**:
```csharp
// Backend.IntegrationTests/SyncServiceTests.cs
[Fact]
public async Task ProcessOfflineTransactions_ChronologicalOrder_PreservesInventoryState()
{
    // Arrange
    var product = new Product { Id = Guid.NewGuid(), StockLevel = 10 };
    await _context.Products.AddAsync(product);
    await _context.SaveChangesAsync();

    var transactions = new[]
    {
        new QueuedTransaction { Type = "sale", Timestamp = DateTime.Parse("2025-01-21T10:00"), Data = CreateSaleData(product.Id, 3) },
        new QueuedTransaction { Type = "purchase", Timestamp = DateTime.Parse("2025-01-21T09:00"), Data = CreatePurchaseData(product.Id, 5) },
        new QueuedTransaction { Type = "sale", Timestamp = DateTime.Parse("2025-01-21T11:00"), Data = CreateSaleData(product.Id, 2) }
    };

    // Act
    foreach (var transaction in transactions.OrderBy(t => t.Timestamp))
    {
        await _syncService.ProcessOfflineTransactionAsync(transaction);
    }

    // Assert
    var updatedProduct = await _context.Products.FindAsync(product.Id);
    // Expected: 10 (initial) + 5 (purchase at 09:00) - 3 (sale at 10:00) - 2 (sale at 11:00) = 10
    Assert.Equal(10, updatedProduct.StockLevel);
}
```

**Test Coverage Goals**:
- Services (business logic): 80%+
- Offline queue: 90%+
- Sync service: 90%+
- API endpoints: All happy paths + critical error cases
- Utilities: 80%+

### Alternatives Considered

1. **Manual testing only**: Rejected because offline/concurrency scenarios are complex and error-prone to test manually
2. **End-to-end tests only**: Rejected because too slow for frequent execution; unit/integration tests provide faster feedback
3. **No concurrency testing**: Rejected because inventory conflicts are explicitly called out in requirements

---

## Summary of Decisions

| Area | Decision | Key Technology/Approach |
|------|----------|------------------------|
| Authentication | JWT access/refresh tokens, HttpOnly cookies | System.IdentityModel.Tokens.Jwt |
| Data Isolation | Physical DB per branch, application-level security | EF Core multi-provider |
| Offline Sync | IndexedDB queue, last-commit-wins, background sync | IndexedDB API, Background Sync API |
| Database Support | SQLite, MSSQL, PostgreSQL, MySQL via EF Core | EF Core 8.0 with provider packages |
| Image Storage | Filesystem with multi-size thumbnails | SixLabors.ImageSharp |
| Audit Logging | Database with circular buffer for activity logs | Head Office DB tables |
| Testing | Multi-layer with offline and concurrency focus | xUnit, Jest, Mock Service Worker |

---

## Implementation Priority

1. **Phase 1 (Foundation)**: Database schema, EF Core setup, multi-provider support
2. **Phase 2 (Authentication)**: JWT service, user management, RBAC
3. **Phase 3 (Core Business)**: Sales, inventory, customers (online mode)
4. **Phase 4 (Offline)**: IndexedDB queue, sync service, conflict resolution
5. **Phase 5 (Media)**: Image upload/optimization service
6. **Phase 6 (Audit)**: Audit logging, activity tracking
7. **Phase 7 (Testing)**: Comprehensive test suite

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Database provider incompatibilities | Use EF Core abstractions; test all providers in CI/CD |
| Offline sync data loss | Persistent IndexedDB storage; retry logic with exponential backoff |
| Concurrent inventory conflicts | Last-commit-wins with alerting; manager resolution workflow |
| Image storage growth | Periodic cleanup of orphaned images; compression with WebP |
| Session management complexity | Well-tested JWT library; standard refresh token pattern |
| Multi-branch connection pooling overhead | Pool size tuning; health checks; connection timeout handling |

---

**Phase 0 Complete**: All NEEDS CLARIFICATION items resolved. Ready to proceed to Phase 1 (Design & Contracts).
