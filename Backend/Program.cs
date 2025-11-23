using System.Text;
using Backend.Data;
using Backend.Middleware;
using Backend.Services.Auth;
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
builder.Services.AddScoped<Backend.Services.Sales.ISalesService, Backend.Services.Sales.SalesService>();

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

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
    .WithName("HealthCheck")
    .WithOpenApi();

// ============================================
// Sales Endpoints
// ============================================

// POST /api/v1/sales - Create a new sale
app.MapPost(
        "/api/v1/sales",
        async (
            Backend.Models.DTOs.Sales.CreateSaleDto createSaleDto,
            HttpContext httpContext,
            Backend.Services.Sales.ISalesService salesService
        ) =>
        {
            try
            {
                // Get user ID from context
                var userId = httpContext.Items["UserId"] as Guid?;
                if (!userId.HasValue)
                {
                    return Results.Unauthorized();
                }

                // Get branch from context
                var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                if (branch == null)
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new
                            {
                                code = "BRANCH_NOT_FOUND",
                                message = "Branch context not found",
                            },
                        }
                    );
                }

                var sale = await salesService.CreateSaleAsync(
                    createSaleDto,
                    userId.Value,
                    branch.LoginName
                );

                return Results.Created(
                    $"/api/v1/sales/{sale.Id}",
                    new { success = true, data = sale, message = "Sale created successfully" }
                );
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(
                    new
                    {
                        success = false,
                        error = new { code = "INVALID_OPERATION", message = ex.Message },
                    }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("CreateSale")
    .WithOpenApi();

// GET /api/v1/sales - List sales with filtering
app.MapGet(
        "/api/v1/sales",
        async (
            HttpContext httpContext,
            Backend.Services.Sales.ISalesService salesService,
            int page = 1,
            int pageSize = 20,
            DateTime? dateFrom = null,
            DateTime? dateTo = null,
            Guid? customerId = null,
            Guid? cashierId = null,
            Backend.Models.Entities.Branch.InvoiceType? invoiceType = null,
            Backend.Models.Entities.Branch.PaymentMethod? paymentMethod = null,
            bool? isVoided = false,
            string? search = null
        ) =>
        {
            try
            {
                // Get branch from context
                var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                if (branch == null)
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new
                            {
                                code = "BRANCH_NOT_FOUND",
                                message = "Branch context not found",
                            },
                        }
                    );
                }

                var (sales, totalCount) = await salesService.GetSalesAsync(
                    page,
                    pageSize,
                    dateFrom,
                    dateTo,
                    customerId,
                    cashierId,
                    invoiceType,
                    paymentMethod,
                    isVoided,
                    search,
                    branch.LoginName
                );

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = sales,
                        pagination = new
                        {
                            page,
                            pageSize,
                            totalItems = totalCount,
                            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                        },
                    }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new
                    {
                        success = false,
                        error = new { code = "ERROR", message = ex.Message },
                    }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetSales")
    .WithOpenApi();

// GET /api/v1/sales/:id - Get sale by ID
app.MapGet(
        "/api/v1/sales/{id:guid}",
        async (Guid id, HttpContext httpContext, Backend.Services.Sales.ISalesService salesService) =>
        {
            try
            {
                // Get branch from context
                var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                if (branch == null)
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new
                            {
                                code = "BRANCH_NOT_FOUND",
                                message = "Branch context not found",
                            },
                        }
                    );
                }

                var sale = await salesService.GetSaleByIdAsync(id, branch.LoginName);

                if (sale == null)
                {
                    return Results.NotFound(
                        new
                        {
                            success = false,
                            error = new
                            {
                                code = "SALE_NOT_FOUND",
                                message = $"Sale with ID '{id}' does not exist",
                            },
                        }
                    );
                }

                return Results.Ok(new { success = true, data = sale });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new
                    {
                        success = false,
                        error = new { code = "ERROR", message = ex.Message },
                    }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetSaleById")
    .WithOpenApi();

// POST /api/v1/sales/:id/void - Void a sale
app.MapPost(
        "/api/v1/sales/{id:guid}/void",
        async (
            Guid id,
            Backend.Models.DTOs.Sales.VoidSaleDto voidSaleDto,
            HttpContext httpContext,
            Backend.Services.Sales.ISalesService salesService
        ) =>
        {
            try
            {
                // Get user ID from context
                var userId = httpContext.Items["UserId"] as Guid?;
                if (!userId.HasValue)
                {
                    return Results.Unauthorized();
                }

                // Check if user has manager role or higher
                var userRole = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
                if (
                    userRole != "Manager"
                    && userRole != "Admin"
                    && httpContext.Items["IsHeadOfficeAdmin"] as bool? != true
                )
                {
                    return Results.Forbid();
                }

                // Get branch from context
                var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                if (branch == null)
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new
                            {
                                code = "BRANCH_NOT_FOUND",
                                message = "Branch context not found",
                            },
                        }
                    );
                }

                var sale = await salesService.VoidSaleAsync(
                    id,
                    voidSaleDto.Reason,
                    userId.Value,
                    branch.LoginName
                );

                return Results.Ok(new { success = true, data = sale, message = "Sale voided successfully" });
            }
            catch (InvalidOperationException ex)
            {
                if (ex.Message.Contains("already been voided"))
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new
                            {
                                code = "SALE_ALREADY_VOIDED",
                                message = ex.Message,
                            },
                        }
                    );
                }
                return Results.NotFound(
                    new
                    {
                        success = false,
                        error = new { code = "SALE_NOT_FOUND", message = ex.Message },
                    }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("VoidSale")
    .WithOpenApi();

// GET /api/v1/sales/:id/invoice - Get invoice (placeholder for now)
app.MapGet(
        "/api/v1/sales/{id:guid}/invoice",
        async (Guid id, HttpContext httpContext, Backend.Services.Sales.ISalesService salesService, string format = "json") =>
        {
            try
            {
                // Get branch from context
                var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                if (branch == null)
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new
                            {
                                code = "BRANCH_NOT_FOUND",
                                message = "Branch context not found",
                            },
                        }
                    );
                }

                var sale = await salesService.GetSaleByIdAsync(id, branch.LoginName);

                if (sale == null)
                {
                    return Results.NotFound(
                        new
                        {
                            success = false,
                            error = new
                            {
                                code = "SALE_NOT_FOUND",
                                message = $"Sale with ID '{id}' does not exist",
                            },
                        }
                    );
                }

                // For now, return JSON format
                // TODO: Implement PDF and HTML generation in future
                return Results.Ok(
                    new
                    {
                        success = true,
                        data = new
                        {
                            invoiceType = sale.InvoiceType,
                            invoiceNumber = sale.InvoiceNumber,
                            transactionId = sale.TransactionId,
                            branch = new
                            {
                                name = branch.NameEn,
                                address = branch.AddressEn,
                                phone = branch.Phone,
                                email = branch.Email,
                                crn = branch.CRN,
                                taxNumber = branch.TaxNumber,
                            },
                            customer = sale.CustomerId.HasValue
                                ? new { name = sale.CustomerName }
                                : null,
                            cashier = new { name = sale.CashierName },
                            date = sale.SaleDate,
                            lineItems = sale.LineItems.Select(li => new
                            {
                                productName = li.ProductName,
                                quantity = li.Quantity,
                                unitPrice = li.UnitPrice,
                                discount = li.DiscountType == Backend.Models.Entities.Branch.DiscountType.Percentage
                                    ? $"{li.DiscountValue}% off"
                                    : li.DiscountType == Backend.Models.Entities.Branch.DiscountType.FixedAmount
                                        ? $"${li.DiscountValue} off"
                                        : "No discount",
                                lineTotal = li.LineTotal,
                            }),
                            subtotal = sale.Subtotal,
                            taxRate = branch.TaxRate,
                            taxAmount = sale.TaxAmount,
                            totalDiscount = sale.TotalDiscount,
                            total = sale.Total,
                            paymentMethod = sale.PaymentMethodName,
                            notes = sale.Notes,
                        },
                    }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new
                    {
                        success = false,
                        error = new { code = "ERROR", message = ex.Message },
                    }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetInvoice")
    .WithOpenApi();

// GET /api/v1/sales/stats - Get sales statistics
app.MapGet(
        "/api/v1/sales/stats",
        async (HttpContext httpContext, Backend.Services.Sales.ISalesService salesService, DateTime? dateFrom = null, DateTime? dateTo = null) =>
        {
            try
            {
                // Default to current month if no dates provided
                var from = dateFrom ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
                var to = dateTo ?? DateTime.UtcNow;

                // Get branch from context
                var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                if (branch == null)
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new
                            {
                                code = "BRANCH_NOT_FOUND",
                                message = "Branch context not found",
                            },
                        }
                    );
                }

                var stats = await salesService.GetSalesStatsAsync(from, to, branch.LoginName);

                return Results.Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new
                    {
                        success = false,
                        error = new { code = "ERROR", message = ex.Message },
                    }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetSalesStats")
    .WithOpenApi();

app.Run();
