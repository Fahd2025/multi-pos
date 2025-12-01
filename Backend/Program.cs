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
    await DbSeeder.SeedAsync(context);
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

app.Run();

// Make Program class accessible for integration testing
public partial class Program { }
