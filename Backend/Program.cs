using System.Text;
using Backend.Data.Branch;
using Backend.Data.HeadOffice;
using Backend.Data.Shared;
using Backend.Endpoints;
using Backend.Middleware;
using Backend.Services.HeadOffice.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var allowedOrigins =
            builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[]
            {
                "http://localhost:3000",
            };

        policy.WithOrigins(allowedOrigins).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
    });
});

// Ensure the database directory exists before configuring the DbContext
var dbPath = builder.Configuration.GetConnectionString("HeadOfficeDb");
if (!string.IsNullOrEmpty(dbPath))
{
    var dbFile = dbPath
        .Replace("Data Source=", "")
        .Replace("data source=", "")
        .Replace("Datasource=", "")
        .Replace("datasource=", "");
    var dbDirectory = Path.GetDirectoryName(dbFile);
    if (!string.IsNullOrEmpty(dbDirectory) && !Directory.Exists(dbDirectory))
    {
        Directory.CreateDirectory(dbDirectory);
    }
}

// Configure Database
builder.Services.AddDbContext<HeadOfficeDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("HeadOfficeDb"))
);

// Configure DbContextFactory
builder.Services.AddSingleton<DbContextFactory>();

// Migration Services
builder.Services.AddScoped<Backend.Services.Shared.Migrations.SqliteMigrationStrategy>();
builder.Services.AddScoped<Backend.Services.Shared.Migrations.SqlServerMigrationStrategy>();
builder.Services.AddScoped<Backend.Services.Shared.Migrations.PostgreSqlMigrationStrategy>();
builder.Services.AddScoped<Backend.Services.Shared.Migrations.MySqlMigrationStrategy>();
builder.Services.AddScoped<Backend.Services.Shared.Migrations.MigrationStrategyFactory>();
builder.Services.AddScoped<Backend.Services.Shared.Migrations.IBranchMigrationManager, Backend.Services.Shared.Migrations.BranchMigrationManager>();

// Background Service for automatic migrations
builder.Services.AddHostedService<Backend.Services.Shared.Migrations.MigrationOrchestrator>();
builder.Services.AddHostedService<Backend.Services.Background.BranchUserSyncService>();

// Configure JWT Authentication
var jwtSecretKey =
    builder.Configuration["Jwt:SecretKey"]
    ?? throw new InvalidOperationException("JWT SecretKey not configured");

builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
            ClockSkew = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization();

// Register Services
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<
    Backend.Services.Branch.Sales.ISalesService,
    Backend.Services.Branch.Sales.SalesService
>();
builder.Services.AddScoped<Backend.Services.Shared.Sync.ISyncService, Backend.Services.Shared.Sync.SyncService>();
builder.Services.AddScoped<
    Backend.Services.Branch.Inventory.IInventoryService,
    Backend.Services.Branch.Inventory.InventoryService
>();
builder.Services.AddScoped<
    Backend.Services.Branch.Customers.ICustomerService,
    Backend.Services.Branch.Customers.CustomerService
>();
builder.Services.AddScoped<
    Backend.Services.Branch.Expenses.IExpenseService,
    Backend.Services.Branch.Expenses.ExpenseService
>();
builder.Services.AddScoped<
    Backend.Services.Branch.Images.IImageService,
    Backend.Services.Branch.Images.ImageService
>();
builder.Services.AddScoped<
    Backend.Services.HeadOffice.Branches.IBranchService,
    Backend.Services.HeadOffice.Branches.BranchService
>();
builder.Services.AddScoped<
    Backend.Services.HeadOffice.Users.IUserService,
    Backend.Services.HeadOffice.Users.UserService
>();
builder.Services.AddScoped<
    Backend.Services.HeadOffice.Audit.IAuditService,
    Backend.Services.HeadOffice.Audit.AuditService
>();
builder.Services.AddScoped<
    Backend.Services.Branch.Suppliers.ISupplierService,
    Backend.Services.Branch.Suppliers.SupplierService
>();
builder.Services.AddScoped<
    Backend.Services.Branch.Images.IImageService,
    Backend.Services.Branch.Images.ImageService
>();
builder.Services.AddScoped<
    Backend.Services.Shared.Reports.IReportService,
    Backend.Services.Shared.Reports.ReportService
>();
builder.Services.AddScoped<
    Backend.Services.Branch.Users.IUserService,
    Backend.Services.Branch.Users.UserService
>();
builder.Services.AddScoped<
    Backend.Services.Branch.IZatcaService,
    Backend.Services.Branch.ZatcaService
>();
builder.Services.AddScoped<
    Backend.Services.Branch.IInvoiceRenderingService,
    Backend.Services.Branch.InvoiceRenderingService
>();
builder.Services.AddScoped<
    Backend.Services.Branch.IInvoiceTemplateService,
    Backend.Services.Branch.InvoiceTemplateService
>();
builder.Services.AddScoped<
    Backend.Services.Branch.Drivers.IDriverService,
    Backend.Services.Branch.Drivers.DriverService
>();
builder.Services.AddScoped<
    Backend.Services.Branch.DeliveryOrders.IDeliveryOrderService,
    Backend.Services.Branch.DeliveryOrders.DeliveryOrderService
>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<BranchDbContext>(provider =>
{
    var httpContextAccessor = provider.GetRequiredService<IHttpContextAccessor>();
    var dbContextFactory = provider.GetRequiredService<DbContextFactory>();
    var httpContext = httpContextAccessor.HttpContext;

    if (httpContext?.Items["Branch"] is Backend.Models.Entities.HeadOffice.Branch branch)
    {
        return dbContextFactory.CreateBranchContext(branch);
    }

    // If we are here, it means we are trying to inject BranchDbContext outside of a branch context
    // This might happen if a service is resolved before the middleware runs or in a background task
    // For now, we throw an exception to make it explicit
    throw new InvalidOperationException(
        "Branch context not found. Ensure the request is authenticated and associated with a branch."
    );
});

// Configure JSON options for minimal APIs
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.SerializerOptions.PropertyNameCaseInsensitive = true;

    // Add custom converters for Guid to handle string-to-Guid conversion
    options.SerializerOptions.Converters.Add(new Backend.Utilities.StringToGuidConverter());
    options.SerializerOptions.Converters.Add(new Backend.Utilities.StringToNullableGuidConverter());
});

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "Multi-Branch POS API",
            Version = "v1",
            Description = "API for Multi-Branch Point of Sale System",
        }
    );

    // Add JWT authentication to Swagger
    c.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Description =
                "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer",
        }
    );

    c.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer",
                    },
                },
                Array.Empty<string>()
            },
        }
    );
});

var app = builder.Build();

// Ensure the database directory exists before seeding
var connectionString = builder.Configuration.GetConnectionString("HeadOfficeDb");
if (!string.IsNullOrEmpty(connectionString))
{
    var dbFile = connectionString
        .Replace("Data Source=", "")
        .Replace("data source=", "")
        .Replace("Datasource=", "")
        .Replace("datasource=", "");
    var dbDirectory = Path.GetDirectoryName(dbFile);
    if (!string.IsNullOrEmpty(dbDirectory) && !Directory.Exists(dbDirectory))
    {
        Directory.CreateDirectory(dbDirectory);
    }
}

// Seed database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<HeadOfficeDbContext>();

    // Ensure HeadOffice database is migrated
    await context.Database.MigrateAsync();

    // Seed default data
    await DbSeeder.SeedAsync(context);

    // Use new migration system for branch databases
    var migrationManager = scope.ServiceProvider.GetRequiredService<Backend.Services.Shared.Migrations.IBranchMigrationManager>();
    var result = await migrationManager.ApplyMigrationsToAllBranchesAsync();

    if (!result.Success)
    {
        app.Logger.LogWarning(
            "Some branch migrations failed: {Error}. Background service will retry automatically.",
            result.ErrorMessage
        );
    }
    else
    {
        app.Logger.LogInformation(
            "Successfully migrated {Count} branch databases",
            result.BranchesSucceeded
        );

        // Seed branch data after successful migrations
        var branches = await context.Branches.Where(b => b.IsActive).ToListAsync();
        var dbContextFactory = new Backend.Data.Shared.DbContextFactory();
        var adminUser = await context.Users.FirstAsync(u => u.Username == "admin");

        foreach (var branch in branches)
        {
            try
            {
                using var branchContext = dbContextFactory.CreateBranchContext(branch);
                await Backend.Data.Branch.BranchDbSeeder.SeedAsync(branchContext, adminUser.Id, branch.Code);
                await Backend.Data.Branch.InvoiceTemplateSeeder.SeedAsync(branchContext, adminUser.Id);
                app.Logger.LogInformation("Seeded data for branch {BranchCode}", branch.Code);
            }
            catch (Exception ex)
            {
                app.Logger.LogError(ex, "Failed to seed data for branch {BranchCode}: {ErrorMessage}", branch.Code, ex.Message);
                Console.WriteLine($"✗ Seeding failed for {branch.Code}: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"  Inner exception: {ex.InnerException.Message}");
                }
            }
        }
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Multi-Branch POS API v1");
    });
}

// Global error handling middleware (must be first)
app.UseErrorHandling();

app.UseHttpsRedirection();

// CORS
app.UseCors();

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Branch context middleware (after authentication)
app.UseBranchContext();

// ============================================
// Map API Endpoints
// ============================================

// Health check
app.MapHealthEndpoints();

// Authentication
app.MapAuthEndpoints();

// Sales
app.MapSalesEndpoints();

// Sync
app.MapSyncEndpoints();

// Inventory (Categories, Products, Purchases)
app.MapInventoryEndpoints();

// Customers
app.MapCustomerEndpoints();

// Expenses
app.MapExpenseEndpoints();

// Suppliers
app.MapSupplierEndpoints();

// Branches (Head Office Admin only)
app.MapBranchEndpoints();

// Users
app.MapUserEndpoints();

// Audit
app.MapAuditEndpoints();

// Images
app.MapImageEndpoints();

// Reports
app.MapReportEndpoints();

// Migrations (HeadOfficeAdmin only)
app.MapMigrationEndpoints();

// Invoice Templates
app.MapInvoiceTemplateEndpoints();

// Branch Info
app.MapBranchInfoEndpoints();

// Drivers
app.MapDriversEndpoints();

// Delivery Orders
app.MapDeliveryOrdersEndpoints();

app.Run();

// Make Program class accessible for integration testing
public partial class Program { }
