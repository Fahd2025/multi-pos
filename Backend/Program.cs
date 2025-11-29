using System.Text;
using Backend.Data;
using Backend.Middleware;
using Backend.Services.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
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
    var dbFile = dbPath.Replace("Data Source=", "").Replace("data source=", "").Replace("Datasource=", "").Replace("datasource=", "");
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
    Backend.Services.Sales.ISalesService,
    Backend.Services.Sales.SalesService
>();
builder.Services.AddScoped<Backend.Services.Sync.ISyncService, Backend.Services.Sync.SyncService>();
builder.Services.AddScoped<
    Backend.Services.Inventory.IInventoryService,
    Backend.Services.Inventory.InventoryService
>();
builder.Services.AddScoped<
    Backend.Services.Customers.ICustomerService,
    Backend.Services.Customers.CustomerService
>();
builder.Services.AddScoped<
    Backend.Services.Expenses.IExpenseService,
    Backend.Services.Expenses.ExpenseService
>();
builder.Services.AddScoped<
    Backend.Services.Branches.IBranchService,
    Backend.Services.Branches.BranchService
>();
builder.Services.AddScoped<Backend.Services.Users.IUserService, Backend.Services.Users.UserService>();
builder.Services.AddScoped<Backend.Services.Audit.IAuditService, Backend.Services.Audit.AuditService>();
builder.Services.AddScoped<
    Backend.Services.Suppliers.ISupplierService,
    Backend.Services.Suppliers.SupplierService
>();
builder.Services.AddScoped<Backend.Services.Images.IImageService, Backend.Services.Images.ImageService>();
builder.Services.AddScoped<Backend.Services.Reports.IReportService, Backend.Services.Reports.ReportService>();

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
    var dbFile = connectionString.Replace("Data Source=", "").Replace("data source=", "").Replace("Datasource=", "").Replace("datasource=", "");
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

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
    .WithName("HealthCheck")
    .WithOpenApi();

// ============================================
// Authentication Endpoints
// ============================================

// POST /api/v1/auth/login - Authenticate user
app.MapPost(
        "/api/v1/auth/login",
        async (
            [FromBody] Backend.Models.DTOs.Auth.LoginRequest loginRequest,
            Backend.Services.Auth.IAuthService authService,
            HttpContext httpContext
        ) =>
        {
            try
            {
                // Get client IP and user agent
                var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
                var userAgent = httpContext.Request.Headers.UserAgent.ToString();

                var result = await authService.LoginAsync(loginRequest, ipAddress, userAgent);

                if (result == null)
                {
                    return Results.Unauthorized();
                }

                // Set refresh token as HTTP-only cookie
                httpContext.Response.Cookies.Append(
                    "refreshToken",
                    result.RefreshToken,
                    new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict,
                        Expires = DateTimeOffset.UtcNow.AddDays(7),
                    }
                );

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = new
                        {
                            accessToken = result.AccessToken,
                            accessTokenExpiresIn = 900, // 15 minutes in seconds
                            user = result.User,
                        },
                        message = "Login successful",
                    }
                );
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
            catch (InvalidOperationException ex)
            {
                return Results.NotFound(
                    new
                    {
                        success = false,
                        error = new { code = "BRANCH_NOT_FOUND", message = ex.Message },
                    }
                );
            }
        }
    )
    .WithName("Login")
    .WithOpenApi();

// POST /api/v1/auth/logout - Logout user
app.MapPost(
        "/api/v1/auth/logout",
        async (HttpContext httpContext, Backend.Services.Auth.IAuthService authService) =>
        {
            try
            {
                // Get refresh token from cookie
                var refreshToken = httpContext.Request.Cookies["refreshToken"];

                if (!string.IsNullOrEmpty(refreshToken))
                {
                    await authService.LogoutAsync(refreshToken);
                }

                // Clear refresh token cookie
                httpContext.Response.Cookies.Delete("refreshToken");

                return Results.Ok(new { success = true, message = "Logout successful" });
            }
            catch (Exception)
            {
                // Even if logout fails, clear the cookie
                return Results.Ok(new { success = true, message = "Logout successful" });
            }
        }
    )
    .RequireAuthorization()
    .WithName("Logout")
    .WithOpenApi();

// POST /api/v1/auth/refresh - Refresh access token
app.MapPost(
        "/api/v1/auth/refresh",
        async (HttpContext httpContext, Backend.Services.Auth.IAuthService authService) =>
        {
            try
            {
                // Get refresh token from cookie
                var refreshToken = httpContext.Request.Cookies["refreshToken"];

                if (string.IsNullOrEmpty(refreshToken))
                {
                    return Results.Unauthorized();
                }

                // Get client IP
                var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();

                var request = new Backend.Models.DTOs.Auth.RefreshTokenRequest
                {
                    RefreshToken = refreshToken,
                };

                var result = await authService.RefreshTokenAsync(request, ipAddress);

                if (result == null)
                {
                    return Results.Unauthorized();
                }

                // Set new refresh token as HTTP-only cookie
                httpContext.Response.Cookies.Append(
                    "refreshToken",
                    result.RefreshToken,
                    new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict,
                        Expires = DateTimeOffset.UtcNow.AddDays(7),
                    }
                );

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = new
                        {
                            accessToken = result.AccessToken,
                            accessTokenExpiresIn = 900, // 15 minutes in seconds
                        },
                        message = "Token refreshed successfully",
                    }
                );
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        }
    )
    .WithName("RefreshToken")
    .WithOpenApi();

// GET /api/v1/auth/me - Get current user info
app.MapGet(
        "/api/v1/auth/me",
        async (HttpContext httpContext, Backend.Data.HeadOfficeDbContext headOfficeDb) =>
        {
            try
            {
                // Get user ID from JWT claims
                var userId = httpContext.Items["UserId"] as Guid?;
                if (!userId.HasValue)
                {
                    return Results.Unauthorized();
                }

                var user = await headOfficeDb
                    .Users.Include(u => u.BranchUsers)
                    .ThenInclude(bu => bu.Branch)
                    .FirstOrDefaultAsync(u => u.Id == userId.Value);

                if (user == null)
                {
                    return Results.NotFound(
                        new
                        {
                            success = false,
                            error = new { code = "USER_NOT_FOUND", message = "User not found" },
                        }
                    );
                }

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = new
                        {
                            id = user.Id,
                            username = user.Username,
                            email = user.Email,
                            fullNameEn = user.FullNameEn,
                            fullNameAr = user.FullNameAr,
                            phone = user.Phone,
                            preferredLanguage = user.PreferredLanguage,
                            isHeadOfficeAdmin = user.IsHeadOfficeAdmin,
                            isActive = user.IsActive,
                            lastLoginAt = user.LastLoginAt,
                            branches = user
                                .BranchUsers.Select(bu => new
                                {
                                    branchId = bu.BranchId,
                                    branchCode = bu.Branch?.Code,
                                    branchNameEn = bu.Branch?.NameEn,
                                    branchNameAr = bu.Branch?.NameAr,
                                    role = bu.Role.ToString(),
                                })
                                .ToList(),
                        },
                    }
                );
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetCurrentUser")
    .WithOpenApi();

// ============================================
// Sales Endpoints
// ============================================

// POST /api/v1/sales - Create a new sale
app.MapPost(
        "/api/v1/sales",
        async (
            [FromBody] Backend.Models.DTOs.Sales.CreateSaleDto createSaleDto,
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
                var branch =
                    httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
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
                    new
                    {
                        success = true,
                        data = sale,
                        message = "Sale created successfully",
                    }
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
                var branch =
                    httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
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
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
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
        async (
            Guid id,
            HttpContext httpContext,
            Backend.Services.Sales.ISalesService salesService
        ) =>
        {
            try
            {
                // Get branch from context
                var branch =
                    httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
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
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
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
            [FromBody] Backend.Models.DTOs.Sales.VoidSaleDto voidSaleDto,
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
                var userRole = httpContext
                    .User.FindFirst(System.Security.Claims.ClaimTypes.Role)
                    ?.Value;
                if (
                    userRole != "Manager"
                    && userRole != "Admin"
                    && httpContext.Items["IsHeadOfficeAdmin"] as bool? != true
                )
                {
                    return Results.Forbid();
                }

                // Get branch from context
                var branch =
                    httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
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

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = sale,
                        message = "Sale voided successfully",
                    }
                );
            }
            catch (InvalidOperationException ex)
            {
                if (ex.Message.Contains("already been voided"))
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new { code = "SALE_ALREADY_VOIDED", message = ex.Message },
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
        async (
            Guid id,
            HttpContext httpContext,
            Backend.Services.Sales.ISalesService salesService,
            string format = "json"
        ) =>
        {
            try
            {
                // Get branch from context
                var branch =
                    httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
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
                                discount = li.DiscountType
                                == Backend.Models.Entities.Branch.DiscountType.Percentage
                                    ? $"{li.DiscountValue}% off"
                                : li.DiscountType
                                == Backend.Models.Entities.Branch.DiscountType.FixedAmount
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
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
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
        async (
            HttpContext httpContext,
            Backend.Services.Sales.ISalesService salesService,
            DateTime? dateFrom = null,
            DateTime? dateTo = null
        ) =>
        {
            try
            {
                // Default to current month if no dates provided
                var from = dateFrom ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
                var to = dateTo ?? DateTime.UtcNow;

                // Get branch from context
                var branch =
                    httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
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
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetSalesStats")
    .WithOpenApi();

// ============================================
// Sync Endpoints
// ============================================

// POST /api/v1/sync/transaction - Process a single offline transaction
app.MapPost(
        "/api/v1/sync/transaction",
        async (
            [FromBody] SyncTransactionRequest request,
            HttpContext httpContext,
            Backend.Services.Sync.ISyncService syncService
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
                var branch =
                    httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
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

                // Deserialize transaction data
                var transactionDataJson = System.Text.Json.JsonSerializer.Serialize(request.Data);

                // Process the transaction
                var entityId = await syncService.ProcessOfflineTransactionAsync(
                    request.Type,
                    transactionDataJson,
                    branch.Id.ToString(),
                    userId.Value.ToString(),
                    request.Timestamp
                );

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = new { entityId, transactionId = request.Id },
                        message = "Transaction synced successfully",
                    }
                );
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(
                    new
                    {
                        success = false,
                        error = new { code = "SYNC_ERROR", message = ex.Message },
                    }
                );
            }
            catch (Exception ex)
            {
                return Results.Problem(detail: ex.Message, statusCode: 500, title: "Sync failed");
            }
        }
    )
    .RequireAuthorization()
    .WithName("SyncTransaction")
    .WithOpenApi();

// POST /api/v1/sync/batch - Process multiple offline transactions
app.MapPost(
        "/api/v1/sync/batch",
        async (
            [FromBody] SyncBatchRequest request,
            HttpContext httpContext,
            Backend.Services.Sync.ISyncService syncService
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
                var branch =
                    httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
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

                var results = new List<object>();

                foreach (var transaction in request.Transactions)
                {
                    try
                    {
                        var transactionDataJson = System.Text.Json.JsonSerializer.Serialize(
                            transaction.Data
                        );

                        var entityId = await syncService.ProcessOfflineTransactionAsync(
                            transaction.Type,
                            transactionDataJson,
                            branch.Id.ToString(),
                            userId.Value.ToString(),
                            transaction.Timestamp
                        );

                        results.Add(
                            new
                            {
                                transactionId = transaction.Id,
                                success = true,
                                entityId,
                            }
                        );
                    }
                    catch (Exception ex)
                    {
                        results.Add(
                            new
                            {
                                transactionId = transaction.Id,
                                success = false,
                                error = ex.Message,
                            }
                        );
                    }
                }

                var successCount = results.Count(r =>
                    r.GetType().GetProperty("success")?.GetValue(r) as bool? == true
                );

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = new
                        {
                            total = request.Transactions.Count,
                            successful = successCount,
                            failed = request.Transactions.Count - successCount,
                            results,
                        },
                        message = $"Batch sync completed: {successCount}/{request.Transactions.Count} successful",
                    }
                );
            }
            catch (Exception ex)
            {
                return Results.Problem(
                    detail: ex.Message,
                    statusCode: 500,
                    title: "Batch sync failed"
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("SyncBatch")
    .WithOpenApi();

// GET /api/v1/sync/status - Get sync status
app.MapGet(
        "/api/v1/sync/status",
        async (HttpContext httpContext, Backend.Services.Sync.ISyncService syncService) =>
        {
            try
            {
                var status = await syncService.GetSyncStatusAsync();

                return Results.Ok(new { success = true, data = status });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetSyncStatus")
    .WithOpenApi();

// ============================================
// Inventory Endpoints
// ============================================

// GET /api/v1/categories - Get all categories
app.MapGet(
        "/api/v1/categories",
        async (
            HttpContext httpContext,
            Backend.Services.Inventory.IInventoryService inventoryService,
            bool includeInactive = false
        ) =>
        {
            try
            {
                var categories = await inventoryService.GetCategoriesAsync(includeInactive);
                return Results.Ok(new { success = true, data = categories });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetCategories")
    .WithOpenApi();

// POST /api/v1/categories - Create a new category
app.MapPost(
        "/api/v1/categories",
        async (
            [FromBody] CreateCategoryRequest request,
            HttpContext httpContext,
            Backend.Services.Inventory.IInventoryService inventoryService
        ) =>
        {
            try
            {
                var userId = httpContext.Items["UserId"] as Guid?;
                if (!userId.HasValue)
                {
                    return Results.Unauthorized();
                }

                var category = await inventoryService.CreateCategoryAsync(
                    request.Code,
                    request.NameEn,
                    request.NameAr,
                    request.DescriptionEn,
                    request.DescriptionAr,
                    request.ParentCategoryId,
                    request.DisplayOrder,
                    userId.Value
                );

                return Results.Created(
                    $"/api/v1/categories/{category.Id}",
                    new
                    {
                        success = true,
                        data = category,
                        message = "Category created successfully",
                    }
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
    .WithName("CreateCategory")
    .WithOpenApi();

// PUT /api/v1/categories/:id - Update a category
app.MapPut(
        "/api/v1/categories/{id:guid}",
        async (
            Guid id,
            [FromBody] UpdateCategoryRequest request,
            Backend.Services.Inventory.IInventoryService inventoryService
        ) =>
        {
            try
            {
                var category = await inventoryService.UpdateCategoryAsync(
                    id,
                    request.Code,
                    request.NameEn,
                    request.NameAr,
                    request.DescriptionEn,
                    request.DescriptionAr,
                    request.ParentCategoryId,
                    request.DisplayOrder
                );

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = category,
                        message = "Category updated successfully",
                    }
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
    .WithName("UpdateCategory")
    .WithOpenApi();

// DELETE /api/v1/categories/:id - Delete a category
app.MapDelete(
        "/api/v1/categories/{id:guid}",
        async (Guid id, Backend.Services.Inventory.IInventoryService inventoryService) =>
        {
            try
            {
                await inventoryService.DeleteCategoryAsync(id);
                return Results.Ok(
                    new { success = true, message = "Category deleted successfully" }
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
    .WithName("DeleteCategory")
    .WithOpenApi();

// GET /api/v1/products - Get products with filtering
app.MapGet(
        "/api/v1/products",
        async (
            Backend.Services.Inventory.IInventoryService inventoryService,
            string? search = null,
            Guid? categoryId = null,
            bool? isActive = null,
            bool? lowStockOnly = null,
            int page = 1,
            int pageSize = 50
        ) =>
        {
            try
            {
                var (products, totalCount) = await inventoryService.GetProductsAsync(
                    search,
                    categoryId,
                    isActive,
                    lowStockOnly,
                    page,
                    pageSize
                );

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = products,
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
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetProducts")
    .WithOpenApi();

// POST /api/v1/products - Create a new product
app.MapPost(
        "/api/v1/products",
        async (
            [FromBody] Backend.Models.DTOs.Inventory.CreateProductDto dto,
            HttpContext httpContext,
            Backend.Services.Inventory.IInventoryService inventoryService
        ) =>
        {
            try
            {
                var userId = httpContext.Items["UserId"] as Guid?;
                if (!userId.HasValue)
                {
                    return Results.Unauthorized();
                }

                var product = await inventoryService.CreateProductAsync(dto, userId.Value);

                return Results.Created(
                    $"/api/v1/products/{product.Id}",
                    new
                    {
                        success = true,
                        data = product,
                        message = "Product created successfully",
                    }
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
    .WithName("CreateProduct")
    .WithOpenApi();

// PUT /api/v1/products/:id - Update a product
app.MapPut(
        "/api/v1/products/{id:guid}",
        async (
            Guid id,
            [FromBody] Backend.Models.DTOs.Inventory.UpdateProductDto dto,
            Backend.Services.Inventory.IInventoryService inventoryService
        ) =>
        {
            try
            {
                var product = await inventoryService.UpdateProductAsync(id, dto);

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = product,
                        message = "Product updated successfully",
                    }
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
    .WithName("UpdateProduct")
    .WithOpenApi();

// DELETE /api/v1/products/:id - Delete a product
app.MapDelete(
        "/api/v1/products/{id:guid}",
        async (Guid id, Backend.Services.Inventory.IInventoryService inventoryService) =>
        {
            try
            {
                await inventoryService.DeleteProductAsync(id);
                return Results.Ok(new { success = true, message = "Product deleted successfully" });
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
    .WithName("DeleteProduct")
    .WithOpenApi();

// POST /api/v1/products/:id/adjust-stock - Adjust product stock
app.MapPost(
        "/api/v1/products/{id:guid}/adjust-stock",
        async (
            Guid id,
            [FromBody] Backend.Models.DTOs.Inventory.StockAdjustmentDto dto,
            HttpContext httpContext,
            Backend.Services.Inventory.IInventoryService inventoryService
        ) =>
        {
            try
            {
                var userId = httpContext.Items["UserId"] as Guid?;
                if (!userId.HasValue)
                {
                    return Results.Unauthorized();
                }

                dto.ProductId = id;
                var product = await inventoryService.AdjustStockAsync(id, dto, userId.Value);

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = product,
                        message = $"Stock adjusted successfully. New stock level: {dto.NewStockLevel}",
                    }
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
    .WithName("AdjustStock")
    .WithOpenApi();

// GET /api/v1/purchases - Get purchases with filtering
app.MapGet(
        "/api/v1/purchases",
        async (
            Backend.Services.Inventory.IInventoryService inventoryService,
            Guid? supplierId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int? paymentStatus = null,
            int page = 1,
            int pageSize = 50
        ) =>
        {
            try
            {
                var (purchases, totalCount) = await inventoryService.GetPurchasesAsync(
                    supplierId,
                    startDate,
                    endDate,
                    paymentStatus,
                    page,
                    pageSize
                );

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = purchases,
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
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetPurchases")
    .WithOpenApi();

// POST /api/v1/purchases - Create a new purchase
app.MapPost(
        "/api/v1/purchases",
        async (
            [FromBody] Backend.Models.DTOs.Inventory.CreatePurchaseDto dto,
            HttpContext httpContext,
            Backend.Services.Inventory.IInventoryService inventoryService
        ) =>
        {
            try
            {
                var userId = httpContext.Items["UserId"] as Guid?;
                if (!userId.HasValue)
                {
                    return Results.Unauthorized();
                }

                var purchase = await inventoryService.CreatePurchaseAsync(dto, userId.Value);

                return Results.Created(
                    $"/api/v1/purchases/{purchase.Id}",
                    new
                    {
                        success = true,
                        data = purchase,
                        message = "Purchase created successfully",
                    }
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
    .WithName("CreatePurchase")
    .WithOpenApi();

// POST /api/v1/purchases/:id/receive - Mark purchase as received and update stock
app.MapPost(
        "/api/v1/purchases/{id:guid}/receive",
        async (
            Guid id,
            HttpContext httpContext,
            Backend.Services.Inventory.IInventoryService inventoryService
        ) =>
        {
            try
            {
                var userId = httpContext.Items["UserId"] as Guid?;
                if (!userId.HasValue)
                {
                    return Results.Unauthorized();
                }

                var purchase = await inventoryService.ReceivePurchaseAsync(id, userId.Value);

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = purchase,
                        message = "Purchase marked as received and inventory updated successfully",
                    }
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
    .WithName("ReceivePurchase")
    .WithOpenApi();

// ============================================
// Customer Endpoints
// ============================================

// GET /api/v1/customers - Get all customers with search and pagination
app.MapGet(
        "/api/v1/customers",
        async (
            Backend.Services.Customers.ICustomerService customerService,
            string? search = null,
            bool? isActive = null,
            int page = 1,
            int pageSize = 50
        ) =>
        {
            try
            {
                var (customers, totalCount) = await customerService.GetCustomersAsync(
                    search,
                    isActive,
                    page,
                    pageSize
                );

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = customers,
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
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetCustomers")
    .WithOpenApi();

// POST /api/v1/customers - Create a new customer
app.MapPost(
        "/api/v1/customers",
        async (
            [FromBody] Backend.Models.DTOs.Customers.CreateCustomerDto dto,
            HttpContext httpContext,
            Backend.Services.Customers.ICustomerService customerService
        ) =>
        {
            try
            {
                var userId = httpContext.Items["UserId"] as Guid?;
                if (!userId.HasValue)
                {
                    return Results.Unauthorized();
                }

                var customer = await customerService.CreateCustomerAsync(dto, userId.Value);

                return Results.Created(
                    $"/api/v1/customers/{customer.Id}",
                    new
                    {
                        success = true,
                        data = customer,
                        message = "Customer created successfully",
                    }
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
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("CreateCustomer")
    .WithOpenApi();

// PUT /api/v1/customers/:id - Update an existing customer
app.MapPut(
        "/api/v1/customers/{id:guid}",
        async (
            Guid id,
            [FromBody] Backend.Models.DTOs.Customers.UpdateCustomerDto dto,
            Backend.Services.Customers.ICustomerService customerService
        ) =>
        {
            try
            {
                var customer = await customerService.UpdateCustomerAsync(id, dto);

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = customer,
                        message = "Customer updated successfully",
                    }
                );
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(
                    new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
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
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("UpdateCustomer")
    .WithOpenApi();

// DELETE /api/v1/customers/:id - Delete (soft delete) a customer
app.MapDelete(
        "/api/v1/customers/{id:guid}",
        async (Guid id, Backend.Services.Customers.ICustomerService customerService) =>
        {
            try
            {
                await customerService.DeleteCustomerAsync(id);

                return Results.Ok(
                    new { success = true, message = "Customer deleted successfully" }
                );
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(
                    new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("DeleteCustomer")
    .WithOpenApi();

// GET /api/v1/customers/:id/history - Get customer purchase history
app.MapGet(
        "/api/v1/customers/{id:guid}/history",
        async (
            Guid id,
            Backend.Services.Customers.ICustomerService customerService,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int page = 1,
            int pageSize = 50
        ) =>
        {
            try
            {
                var (sales, totalCount) = await customerService.GetCustomerPurchaseHistoryAsync(
                    id,
                    startDate,
                    endDate,
                    page,
                    pageSize
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
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(
                    new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetCustomerPurchaseHistory")
    .WithOpenApi();

// ============================================
// Expense Endpoints
// ============================================

// GET /api/v1/expenses - Get all expenses with filtering
app.MapGet(
        "/api/v1/expenses",
        async (
            Backend.Services.Expenses.IExpenseService expenseService,
            Guid? categoryId = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int? approvalStatus = null,
            int page = 1,
            int pageSize = 50
        ) =>
        {
            try
            {
                var (expenses, totalCount) = await expenseService.GetExpensesAsync(
                    categoryId,
                    startDate,
                    endDate,
                    approvalStatus,
                    page,
                    pageSize
                );

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = expenses,
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
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetExpenses")
    .WithOpenApi();

// POST /api/v1/expenses - Create a new expense
app.MapPost(
        "/api/v1/expenses",
        async (
            [FromBody] Backend.Models.DTOs.Expenses.CreateExpenseDto dto,
            HttpContext httpContext,
            Backend.Services.Expenses.IExpenseService expenseService
        ) =>
        {
            try
            {
                var userId = httpContext.Items["UserId"] as Guid?;
                if (!userId.HasValue)
                {
                    return Results.Unauthorized();
                }

                var expense = await expenseService.CreateExpenseAsync(dto, userId.Value);

                return Results.Created(
                    $"/api/v1/expenses/{expense.Id}",
                    new
                    {
                        success = true,
                        data = expense,
                        message = "Expense created successfully",
                    }
                );
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(
                    new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("CreateExpense")
    .WithOpenApi();

// PUT /api/v1/expenses/:id - Update an expense
app.MapPut(
        "/api/v1/expenses/{id:guid}",
        async (
            Guid id,
            [FromBody] Backend.Models.DTOs.Expenses.CreateExpenseDto dto,
            Backend.Services.Expenses.IExpenseService expenseService
        ) =>
        {
            try
            {
                var expense = await expenseService.UpdateExpenseAsync(id, dto);

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = expense,
                        message = "Expense updated successfully",
                    }
                );
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(
                    new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
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
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("UpdateExpense")
    .WithOpenApi();

// DELETE /api/v1/expenses/:id - Delete an expense
app.MapDelete(
        "/api/v1/expenses/{id:guid}",
        async (Guid id, Backend.Services.Expenses.IExpenseService expenseService) =>
        {
            try
            {
                await expenseService.DeleteExpenseAsync(id);

                return Results.Ok(new { success = true, message = "Expense deleted successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(
                    new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
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
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("DeleteExpense")
    .WithOpenApi();

// POST /api/v1/expenses/:id/approve - Approve or reject an expense (Manager only)
app.MapPost(
        "/api/v1/expenses/{id:guid}/approve",
        async (
            Guid id,
            [FromBody] ApproveExpenseRequest request,
            HttpContext httpContext,
            Backend.Services.Expenses.IExpenseService expenseService
        ) =>
        {
            try
            {
                var userId = httpContext.Items["UserId"] as Guid?;
                if (!userId.HasValue)
                {
                    return Results.Unauthorized();
                }

                // Check if user has manager role or higher
                var userRole = httpContext
                    .User.FindFirst(System.Security.Claims.ClaimTypes.Role)
                    ?.Value;
                if (
                    userRole != "Manager"
                    && userRole != "Admin"
                    && httpContext.Items["IsHeadOfficeAdmin"] as bool? != true
                )
                {
                    return Results.Forbid();
                }

                var expense = await expenseService.ApproveExpenseAsync(
                    id,
                    userId.Value,
                    request.Approved
                );

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = expense,
                        message = request.Approved
                            ? "Expense approved successfully"
                            : "Expense rejected successfully",
                    }
                );
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(
                    new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
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
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("ApproveExpense")
    .WithOpenApi();

// GET /api/v1/expense-categories - Get all expense categories
app.MapGet(
        "/api/v1/expense-categories",
        async (
            Backend.Services.Expenses.IExpenseService expenseService,
            bool includeInactive = false
        ) =>
        {
            try
            {
                var categories = await expenseService.GetExpenseCategoriesAsync(includeInactive);

                return Results.Ok(new { success = true, data = categories });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetExpenseCategories")
    .WithOpenApi();

// POST /api/v1/expense-categories - Create a new expense category
app.MapPost(
        "/api/v1/expense-categories",
        async (
            [FromBody] CreateExpenseCategoryRequest request,
            Backend.Services.Expenses.IExpenseService expenseService
        ) =>
        {
            try
            {
                var category = await expenseService.CreateExpenseCategoryAsync(
                    request.Code,
                    request.NameEn,
                    request.NameAr,
                    request.BudgetAllocation
                );

                return Results.Created(
                    $"/api/v1/expense-categories/{category.Id}",
                    new
                    {
                        success = true,
                        data = category,
                        message = "Expense category created successfully",
                    }
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
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("CreateExpenseCategory")
    .WithOpenApi();

// ============================================
// Supplier Endpoints (Manager Only)
// ============================================

// GET /api/v1/suppliers - Get all suppliers with filtering
app.MapGet(
        "/api/v1/suppliers",
        async (
            HttpContext httpContext,
            Backend.Services.Suppliers.ISupplierService supplierService,
            bool includeInactive = false,
            string? searchTerm = null,
            int page = 1,
            int pageSize = 50
        ) =>
        {
            try
            {
                // Check if user has manager role or higher
                var userRole = httpContext
                    .User.FindFirst(System.Security.Claims.ClaimTypes.Role)
                    ?.Value;
                if (
                    userRole != "Manager"
                    && userRole != "Admin"
                    && httpContext.Items["IsHeadOfficeAdmin"] as bool? != true
                )
                {
                    return Results.Forbid();
                }

                // Get branch from context
                var branch =
                    httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
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

                var (suppliers, totalCount) = await supplierService.GetSuppliersAsync(
                    branch.Id,
                    includeInactive,
                    searchTerm,
                    page,
                    pageSize
                );

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = suppliers,
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
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetSuppliers")
    .WithOpenApi();

// POST /api/v1/suppliers - Create a new supplier
app.MapPost(
        "/api/v1/suppliers",
        async (
            [FromBody] Backend.Models.DTOs.Suppliers.CreateSupplierDto createDto,
            HttpContext httpContext,
            Backend.Services.Suppliers.ISupplierService supplierService
        ) =>
        {
            try
            {
                // Check if user has manager role or higher
                var userRole = httpContext
                    .User.FindFirst(System.Security.Claims.ClaimTypes.Role)
                    ?.Value;
                if (
                    userRole != "Manager"
                    && userRole != "Admin"
                    && httpContext.Items["IsHeadOfficeAdmin"] as bool? != true
                )
                {
                    return Results.Forbid();
                }

                // Get user ID from context
                var userId = httpContext.Items["UserId"] as Guid?;
                if (!userId.HasValue)
                {
                    return Results.Unauthorized();
                }

                // Get branch from context
                var branch =
                    httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
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

                var supplier = await supplierService.CreateSupplierAsync(
                    branch.Id,
                    createDto,
                    userId.Value
                );

                return Results.Created(
                    $"/api/v1/suppliers/{supplier.Id}",
                    new
                    {
                        success = true,
                        data = supplier,
                        message = "Supplier created successfully",
                    }
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
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("CreateSupplier")
    .WithOpenApi();

// PUT /api/v1/suppliers/:id - Update a supplier
app.MapPut(
        "/api/v1/suppliers/{id:guid}",
        async (
            Guid id,
            [FromBody] Backend.Models.DTOs.Suppliers.UpdateSupplierDto updateDto,
            HttpContext httpContext,
            Backend.Services.Suppliers.ISupplierService supplierService
        ) =>
        {
            try
            {
                // Check if user has manager role or higher
                var userRole = httpContext
                    .User.FindFirst(System.Security.Claims.ClaimTypes.Role)
                    ?.Value;
                if (
                    userRole != "Manager"
                    && userRole != "Admin"
                    && httpContext.Items["IsHeadOfficeAdmin"] as bool? != true
                )
                {
                    return Results.Forbid();
                }

                // Get branch from context
                var branch =
                    httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
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

                var supplier = await supplierService.UpdateSupplierAsync(branch.Id, id, updateDto);

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = supplier,
                        message = "Supplier updated successfully",
                    }
                );
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(
                    new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
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
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("UpdateSupplier")
    .WithOpenApi();

// DELETE /api/v1/suppliers/:id - Delete a supplier
app.MapDelete(
        "/api/v1/suppliers/{id:guid}",
        async (
            Guid id,
            HttpContext httpContext,
            Backend.Services.Suppliers.ISupplierService supplierService
        ) =>
        {
            try
            {
                // Check if user has manager role or higher
                var userRole = httpContext
                    .User.FindFirst(System.Security.Claims.ClaimTypes.Role)
                    ?.Value;
                if (
                    userRole != "Manager"
                    && userRole != "Admin"
                    && httpContext.Items["IsHeadOfficeAdmin"] as bool? != true
                )
                {
                    return Results.Forbid();
                }

                // Get branch from context
                var branch =
                    httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
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

                await supplierService.DeleteSupplierAsync(branch.Id, id);

                return Results.Ok(
                    new { success = true, message = "Supplier deleted successfully" }
                );
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(
                    new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("DeleteSupplier")
    .WithOpenApi();

// GET /api/v1/suppliers/:id/history - Get purchase history for a supplier
app.MapGet(
        "/api/v1/suppliers/{id:guid}/history",
        async (
            Guid id,
            HttpContext httpContext,
            Backend.Services.Suppliers.ISupplierService supplierService,
            int page = 1,
            int pageSize = 50
        ) =>
        {
            try
            {
                // Check if user has manager role or higher
                var userRole = httpContext
                    .User.FindFirst(System.Security.Claims.ClaimTypes.Role)
                    ?.Value;
                if (
                    userRole != "Manager"
                    && userRole != "Admin"
                    && httpContext.Items["IsHeadOfficeAdmin"] as bool? != true
                )
                {
                    return Results.Forbid();
                }

                // Get branch from context
                var branch =
                    httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
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

                var purchases = await supplierService.GetSupplierPurchaseHistoryAsync(
                    branch.Id,
                    id,
                    page,
                    pageSize
                );

                return Results.Ok(new { success = true, data = purchases });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetSupplierPurchaseHistory")
    .WithOpenApi();

// ============================================
// Branch Management Endpoints (Head Office Admin Only)
// ============================================

// GET /api/v1/branches - Get all branches with filtering and pagination
app.MapGet(
        "/api/v1/branches",
        async (
            Backend.Services.Branches.IBranchService branchService,
            HttpContext httpContext,
            int page = 1,
            int pageSize = 20,
            bool? isActive = null,
            string? search = null
        ) =>
        {
            try
            {
                // Check if user is head office admin
                if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
                {
                    return Results.Forbid();
                }

                var (branches, totalCount) = await branchService.GetBranchesAsync(
                    page,
                    pageSize,
                    isActive,
                    search
                );

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = branches,
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
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetBranches")
    .WithOpenApi();

// GET /api/v1/branches/:id - Get branch by ID
app.MapGet(
        "/api/v1/branches/{id:guid}",
        async (Guid id, Backend.Services.Branches.IBranchService branchService, HttpContext httpContext) =>
        {
            try
            {
                // Check if user is head office admin
                if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
                {
                    return Results.Forbid();
                }

                var branch = await branchService.GetBranchByIdAsync(id);

                if (branch == null)
                {
                    return Results.NotFound(
                        new
                        {
                            success = false,
                            error = new { code = "NOT_FOUND", message = $"Branch with ID {id} not found" },
                        }
                    );
                }

                return Results.Ok(new { success = true, data = branch });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetBranchById")
    .WithOpenApi();

// POST /api/v1/branches - Create a new branch
app.MapPost(
        "/api/v1/branches",
        async (
            [FromBody] Backend.Models.DTOs.Branches.CreateBranchDto dto,
            Backend.Services.Branches.IBranchService branchService,
            HttpContext httpContext
        ) =>
        {
            try
            {
                // Check if user is head office admin
                if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
                {
                    return Results.Forbid();
                }

                var userId = httpContext.Items["UserId"] as Guid?;
                if (!userId.HasValue)
                {
                    return Results.Unauthorized();
                }

                var branch = await branchService.CreateBranchAsync(dto, userId.Value);

                return Results.Created(
                    $"/api/v1/branches/{branch.Id}",
                    new
                    {
                        success = true,
                        data = branch,
                        message = "Branch created successfully",
                    }
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
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("CreateBranch")
    .WithOpenApi();

// PUT /api/v1/branches/:id - Update a branch
app.MapPut(
        "/api/v1/branches/{id:guid}",
        async (
            Guid id,
            [FromBody] Backend.Models.DTOs.Branches.UpdateBranchDto dto,
            Backend.Services.Branches.IBranchService branchService,
            HttpContext httpContext
        ) =>
        {
            try
            {
                // Check if user is head office admin
                if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
                {
                    return Results.Forbid();
                }

                var branch = await branchService.UpdateBranchAsync(id, dto);

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = branch,
                        message = "Branch updated successfully",
                    }
                );
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(
                    new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("UpdateBranch")
    .WithOpenApi();

// DELETE /api/v1/branches/:id - Delete (soft delete) a branch
app.MapDelete(
        "/api/v1/branches/{id:guid}",
        async (Guid id, Backend.Services.Branches.IBranchService branchService, HttpContext httpContext) =>
        {
            try
            {
                // Check if user is head office admin
                if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
                {
                    return Results.Forbid();
                }

                var success = await branchService.DeleteBranchAsync(id);

                if (!success)
                {
                    return Results.NotFound(
                        new
                        {
                            success = false,
                            error = new { code = "NOT_FOUND", message = $"Branch with ID {id} not found" },
                        }
                    );
                }

                return Results.Ok(new { success = true, message = "Branch deleted successfully" });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("DeleteBranch")
    .WithOpenApi();

// GET /api/v1/branches/:id/settings - Get branch settings
app.MapGet(
        "/api/v1/branches/{id:guid}/settings",
        async (Guid id, Backend.Services.Branches.IBranchService branchService, HttpContext httpContext) =>
        {
            try
            {
                // Check if user is head office admin
                if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
                {
                    return Results.Forbid();
                }

                var settings = await branchService.GetBranchSettingsAsync(id);

                if (settings == null)
                {
                    return Results.NotFound(
                        new
                        {
                            success = false,
                            error = new { code = "NOT_FOUND", message = $"Branch with ID {id} not found" },
                        }
                    );
                }

                return Results.Ok(new { success = true, data = settings });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetBranchSettings")
    .WithOpenApi();

// PUT /api/v1/branches/:id/settings - Update branch settings
app.MapPut(
        "/api/v1/branches/{id:guid}/settings",
        async (
            Guid id,
            [FromBody] Backend.Models.DTOs.Branches.BranchSettingsDto dto,
            Backend.Services.Branches.IBranchService branchService,
            HttpContext httpContext
        ) =>
        {
            try
            {
                // Check if user is head office admin
                if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
                {
                    return Results.Forbid();
                }

                var settings = await branchService.UpdateBranchSettingsAsync(id, dto);

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = settings,
                        message = "Branch settings updated successfully",
                    }
                );
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(
                    new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("UpdateBranchSettings")
    .WithOpenApi();

// POST /api/v1/branches/:id/test-connection - Test branch database connection
app.MapPost(
        "/api/v1/branches/{id:guid}/test-connection",
        async (Guid id, Backend.Services.Branches.IBranchService branchService, HttpContext httpContext) =>
        {
            try
            {
                // Check if user is head office admin
                if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
                {
                    return Results.Forbid();
                }

                var (success, message) = await branchService.TestDatabaseConnectionAsync(id);

                if (success)
                {
                    return Results.Ok(new { success = true, message });
                }
                else
                {
                    return Results.BadRequest(
                        new { success = false, error = new { code = "CONNECTION_FAILED", message } }
                    );
                }
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("TestBranchConnection")
    .WithOpenApi();

// ============================================
// User Management Endpoints
// ============================================

// GET /api/v1/users - Get all users with filtering
app.MapGet(
        "/api/v1/users",
        async (
            HttpContext httpContext,
            Backend.Services.Users.IUserService userService,
            bool? includeInactive = false,
            Guid? branchId = null,
            string? role = null,
            string? searchTerm = null,
            int page = 1,
            int pageSize = 50
        ) =>
        {
            try
            {
                // Check if user is head office admin or branch manager
                var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;
                var currentUserId = httpContext.Items["UserId"] as Guid?;

                if (!isHeadOfficeAdmin && branchId == null)
                {
                    return Results.Forbid();
                }

                Backend.Models.Entities.HeadOffice.UserRole? parsedRole = null;
                if (!string.IsNullOrWhiteSpace(role))
                {
                    if (Enum.TryParse<Backend.Models.Entities.HeadOffice.UserRole>(role, true, out var r))
                    {
                        parsedRole = r;
                    }
                }

                var (users, totalCount) = await userService.GetUsersAsync(
                    includeInactive ?? false,
                    branchId,
                    parsedRole,
                    searchTerm,
                    page,
                    pageSize
                );

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = new
                        {
                            users,
                            pagination = new { page, pageSize, totalCount, totalPages = (int)Math.Ceiling((double)totalCount / pageSize) }
                        }
                    }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetUsers")
    .WithOpenApi();

// POST /api/v1/users - Create a new user (admin only)
app.MapPost(
        "/api/v1/users",
        async (
            [FromBody] Backend.Models.DTOs.Users.CreateUserDto createDto,
            Backend.Services.Users.IUserService userService,
            HttpContext httpContext
        ) =>
        {
            try
            {
                // Check if user is head office admin
                if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
                {
                    return Results.Forbid();
                }

                var currentUserId = httpContext.Items["UserId"] as Guid?;
                if (!currentUserId.HasValue)
                {
                    return Results.Unauthorized();
                }

                var user = await userService.CreateUserAsync(createDto, currentUserId.Value);

                return Results.Ok(new { success = true, data = user });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "VALIDATION_ERROR", message = ex.Message } }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("CreateUser")
    .WithOpenApi();

// PUT /api/v1/users/:id - Update user
app.MapPut(
        "/api/v1/users/{id:guid}",
        async (
            Guid id,
            [FromBody] Backend.Models.DTOs.Users.UpdateUserDto updateDto,
            Backend.Services.Users.IUserService userService,
            HttpContext httpContext
        ) =>
        {
            try
            {
                var currentUserId = httpContext.Items["UserId"] as Guid?;
                if (!currentUserId.HasValue)
                {
                    return Results.Unauthorized();
                }

                // Users can update themselves, or admins can update anyone
                var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;
                if (!isHeadOfficeAdmin && currentUserId.Value != id)
                {
                    return Results.Forbid();
                }

                var user = await userService.UpdateUserAsync(id, updateDto, currentUserId.Value);

                return Results.Ok(new { success = true, data = user });
            }
            catch (InvalidOperationException ex)
            {
                return Results.NotFound(
                    new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("UpdateUser")
    .WithOpenApi();

// DELETE /api/v1/users/:id - Delete user (admin only)
app.MapDelete(
        "/api/v1/users/{id:guid}",
        async (Guid id, Backend.Services.Users.IUserService userService, HttpContext httpContext) =>
        {
            try
            {
                // Check if user is head office admin
                if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
                {
                    return Results.Forbid();
                }

                var currentUserId = httpContext.Items["UserId"] as Guid?;
                if (!currentUserId.HasValue)
                {
                    return Results.Unauthorized();
                }

                await userService.DeleteUserAsync(id, currentUserId.Value);

                return Results.Ok(new { success = true, message = "User deactivated successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return Results.NotFound(
                    new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("DeleteUser")
    .WithOpenApi();

// POST /api/v1/users/:id/assign-branch - Assign user to branch
app.MapPost(
        "/api/v1/users/{id:guid}/assign-branch",
        async (
            Guid id,
            [FromBody] Backend.Models.DTOs.Users.AssignBranchDto assignDto,
            Backend.Services.Users.IUserService userService,
            HttpContext httpContext
        ) =>
        {
            try
            {
                // Check if user is head office admin
                if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
                {
                    return Results.Forbid();
                }

                var currentUserId = httpContext.Items["UserId"] as Guid?;
                if (!currentUserId.HasValue)
                {
                    return Results.Unauthorized();
                }

                await userService.AssignBranchAsync(id, assignDto, currentUserId.Value);

                return Results.Ok(new { success = true, message = "User assigned to branch successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "VALIDATION_ERROR", message = ex.Message } }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("AssignUserToBranch")
    .WithOpenApi();

// DELETE /api/v1/users/:id/branches/:branchId - Remove branch assignment
app.MapDelete(
        "/api/v1/users/{id:guid}/branches/{branchId:guid}",
        async (
            Guid id,
            Guid branchId,
            Backend.Services.Users.IUserService userService,
            HttpContext httpContext
        ) =>
        {
            try
            {
                // Check if user is head office admin
                if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
                {
                    return Results.Forbid();
                }

                var currentUserId = httpContext.Items["UserId"] as Guid?;
                if (!currentUserId.HasValue)
                {
                    return Results.Unauthorized();
                }

                await userService.RemoveBranchAssignmentAsync(id, branchId, currentUserId.Value);

                return Results.Ok(new { success = true, message = "Branch assignment removed successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return Results.NotFound(
                    new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("RemoveBranchAssignment")
    .WithOpenApi();

// GET /api/v1/users/:id/activity - Get user activity log
app.MapGet(
        "/api/v1/users/{id:guid}/activity",
        async (Guid id, Backend.Services.Users.IUserService userService, HttpContext httpContext, int? limit = 100) =>
        {
            try
            {
                var currentUserId = httpContext.Items["UserId"] as Guid?;
                if (!currentUserId.HasValue)
                {
                    return Results.Unauthorized();
                }

                // Users can view their own activity, or admins can view anyone's
                var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;
                if (!isHeadOfficeAdmin && currentUserId.Value != id)
                {
                    return Results.Forbid();
                }

                var activities = await userService.GetUserActivityAsync(id, limit ?? 100);

                return Results.Ok(new { success = true, data = activities });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetUserActivity")
    .WithOpenApi();

// ============================================
// Audit Endpoints
// ============================================

// GET /api/v1/audit/logs - Get audit logs (admin only)
app.MapGet(
        "/api/v1/audit/logs",
        async (
            HttpContext httpContext,
            Backend.Services.Audit.IAuditService auditService,
            Guid? userId = null,
            Guid? branchId = null,
            string? eventType = null,
            string? action = null,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            int page = 1,
            int pageSize = 50
        ) =>
        {
            try
            {
                // Check if user is head office admin
                if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
                {
                    return Results.Forbid();
                }

                var (logs, totalCount) = await auditService.GetAuditLogsAsync(
                    userId,
                    branchId,
                    eventType,
                    action,
                    fromDate,
                    toDate,
                    page,
                    pageSize
                );

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = new
                        {
                            logs,
                            pagination = new { page, pageSize, totalCount, totalPages = (int)Math.Ceiling((double)totalCount / pageSize) }
                        }
                    }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetAuditLogs")
    .WithOpenApi();

// GET /api/v1/audit/user/:userId - Get user audit trail
app.MapGet(
        "/api/v1/audit/user/{userId:guid}",
        async (
            Guid userId,
            HttpContext httpContext,
            Backend.Services.Audit.IAuditService auditService,
            DateTime? fromDate = null,
            DateTime? toDate = null,
            int page = 1,
            int pageSize = 50
        ) =>
        {
            try
            {
                var currentUserId = httpContext.Items["UserId"] as Guid?;
                if (!currentUserId.HasValue)
                {
                    return Results.Unauthorized();
                }

                // Users can view their own audit trail, or admins can view anyone's
                var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;
                if (!isHeadOfficeAdmin && currentUserId.Value != userId)
                {
                    return Results.Forbid();
                }

                var logs = await auditService.GetUserAuditTrailAsync(userId, fromDate, toDate, page, pageSize);

                return Results.Ok(new { success = true, data = logs });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetUserAuditTrail")
    .WithOpenApi();

// ============================================
// Image Management Endpoints
// ============================================

// POST /api/v1/images/upload - Upload an image for an entity
app.MapPost(
        "/api/v1/images/upload",
        async (
            HttpContext httpContext,
            Backend.Services.Images.IImageService imageService,
            Backend.Data.DbContextFactory dbContextFactory,
            Backend.Data.HeadOfficeDbContext headOfficeDbContext
        ) =>
        {
            try
            {
                // Get form data
                var form = await httpContext.Request.ReadFormAsync();
                var file = form.Files["image"];

                if (file == null || file.Length == 0)
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new { code = "NO_FILE", message = "No image file provided" },
                        }
                    );
                }

                // Get parameters
                var branchName = form["branchName"].ToString();
                var entityType = form["entityType"].ToString();
                var entityIdStr = form["entityId"].ToString();

                if (string.IsNullOrWhiteSpace(branchName) || string.IsNullOrWhiteSpace(entityType) || string.IsNullOrWhiteSpace(entityIdStr))
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new { code = "MISSING_PARAMETERS", message = "branchName, entityType, and entityId are required" },
                        }
                    );
                }

                if (!Guid.TryParse(entityIdStr, out var entityId))
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new { code = "INVALID_ENTITY_ID", message = "entityId must be a valid GUID" },
                        }
                    );
                }

                // Upload image
                using var stream = file.OpenReadStream();
                var result = await imageService.UploadImageAsync(
                    branchName,
                    entityType,
                    entityId,
                    stream,
                    file.FileName
                );

                if (!result.Success)
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new { code = "UPLOAD_FAILED", message = result.ErrorMessage },
                        }
                    );
                }

                // Update the entity's image path field in the database
                try
                {
                    var entityTypeLower = entityType.ToLower();

                    // For branch-scoped entities, get the BranchDbContext from the factory
                    if (entityTypeLower == "customers" || entityTypeLower == "suppliers" ||
                        entityTypeLower == "expenses" || entityTypeLower == "categories")
                    {
                        // Get branch from HttpContext
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch != null)
                        {
                            using var branchDbContext = dbContextFactory.CreateBranchContext(branch);

                            switch (entityTypeLower)
                            {
                                case "customers":
                                    var customer = await branchDbContext.Customers.FindAsync(entityId);
                                    if (customer != null)
                                    {
                                        customer.LogoPath = entityId.ToString(); // Store entity ID to reference the image
                                        await branchDbContext.SaveChangesAsync();
                                    }
                                    break;

                                case "suppliers":
                                    var supplier = await branchDbContext.Suppliers.FindAsync(entityId);
                                    if (supplier != null)
                                    {
                                        supplier.LogoPath = entityId.ToString(); // Store entity ID to reference the image
                                        await branchDbContext.SaveChangesAsync();
                                    }
                                    break;

                                case "expenses":
                                    var expense = await branchDbContext.Expenses.FindAsync(entityId);
                                    if (expense != null)
                                    {
                                        expense.ReceiptImagePath = entityId.ToString(); // Store entity ID to reference the image
                                        await branchDbContext.SaveChangesAsync();
                                    }
                                    break;

                                case "categories":
                                    var category = await branchDbContext.Categories.FindAsync(entityId);
                                    if (category != null)
                                    {
                                        category.ImagePath = entityId.ToString(); // Store entity ID to reference the image
                                        await branchDbContext.SaveChangesAsync();
                                    }
                                    break;
                            }
                        }
                    }
                    else if (entityTypeLower == "branches")
                    {
                        var branchEntity = await headOfficeDbContext.Branches.FindAsync(entityId);
                        if (branchEntity != null)
                        {
                            // For branches, store the entity ID in LogoPath to reference the image
                            branchEntity.LogoPath = entityId.ToString();
                            await headOfficeDbContext.SaveChangesAsync();
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Log error but don't fail the request since image was uploaded successfully
                    Console.WriteLine($"Warning: Could not update {entityType} {entityId} image path: {ex.Message}");
                }

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = new
                        {
                            originalPath = result.OriginalPath,
                            thumbnailPaths = result.ThumbnailPaths,
                        },
                        message = "Image uploaded successfully",
                    }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("UploadImage")
    .WithOpenApi()
    .DisableAntiforgery();

// GET /api/v1/images/{branchName}/{entityType}/{entityId}/{size} - Serve an image
app.MapGet(
        "/api/v1/images/{branchName}/{entityType}/{entityId:guid}/{size}",
        async (
            HttpContext context,
            string branchName,
            string entityType,
            Guid entityId,
            string size,
            Backend.Services.Images.IImageService imageService
        ) =>
        {
            try
            {
                // Validate size
                var validSizes = new[] { "original", "large", "medium", "thumb" };
                if (!validSizes.Contains(size.ToLower()))
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new { code = "INVALID_SIZE", message = $"Size must be one of: {string.Join(", ", validSizes)}" },
                        }
                    );
                }

                // For ProductImages, entityId is the imageId, but files are stored under productId
                // Check if there's a productId query parameter for multi-image entities
                string imagePath;
                if (context.Request.Query.TryGetValue("productId", out var productIdStr) &&
                    Guid.TryParse(productIdStr, out var productId))
                {
                    // For ProductImages: files are in Products/{productId}/{imageId}-{size}.webp
                    var baseDir = Path.Combine(
                        imageService.GetType().GetField("_uploadBasePath",
                            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                            ?.GetValue(imageService) as string ?? "Upload",
                        "Branches", branchName, entityType, productId.ToString()
                    );

                    var fileExtension = ".webp";
                    var pattern = $"{entityId}-{size}{fileExtension}";
                    var files = Directory.Exists(baseDir) ? Directory.GetFiles(baseDir, pattern) : Array.Empty<string>();
                    imagePath = files.FirstOrDefault() ?? string.Empty;
                }
                else
                {
                    // Standard single-image entities
                    imagePath = imageService.GetImagePath(branchName, entityType, entityId, size);
                }

                // Check if image exists
                if (string.IsNullOrEmpty(imagePath) || !File.Exists(imagePath))
                {
                    return Results.NotFound(
                        new
                        {
                            success = false,
                            error = new { code = "NOT_FOUND", message = "Image file not found" },
                        }
                    );
                }

                // Determine content type
                var extension = Path.GetExtension(imagePath).ToLower();
                var contentType = extension switch
                {
                    ".webp" => "image/webp",
                    ".jpg" or ".jpeg" => "image/jpeg",
                    ".png" => "image/png",
                    _ => "application/octet-stream",
                };

                // Serve the image file
                return Results.File(imagePath, contentType, enableRangeProcessing: true);
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .WithName("ServeImage")
    .WithOpenApi();

// DELETE /api/v1/images/{branchName}/{entityType}/{entityId} - Delete all images for an entity
app.MapDelete(
        "/api/v1/images/{branchName}/{entityType}/{entityId:guid}",
        async (
            string branchName,
            string entityType,
            Guid entityId,
            HttpContext httpContext,
            Backend.Services.Images.IImageService imageService,
            Backend.Data.DbContextFactory dbContextFactory,
            Backend.Data.HeadOfficeDbContext headOfficeDbContext
        ) =>
        {
            try
            {
                var success = await imageService.DeleteImageAsync(branchName, entityType, entityId);

                // For Products, we need to clean up database records even if files don't exist
                // For other entities, return 404 if files not found
                if (!success && entityType.ToLower() != "products")
                {
                    return Results.NotFound(
                        new
                        {
                            success = false,
                            error = new { code = "NOT_FOUND", message = "Images not found or already deleted" },
                        }
                    );
                }

                // Clear the entity's image path field in the database
                try
                {
                    var entityTypeLower = entityType.ToLower();

                    // For branch-scoped entities, get the BranchDbContext from the factory
                    if (entityTypeLower == "customers" || entityTypeLower == "suppliers" ||
                        entityTypeLower == "expenses" || entityTypeLower == "categories" || entityTypeLower == "products")
                    {
                        // Get branch from HttpContext
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch != null)
                        {
                            using var branchDbContext = dbContextFactory.CreateBranchContext(branch);

                            switch (entityTypeLower)
                            {
                                case "customers":
                                    var customer = await branchDbContext.Customers.FindAsync(entityId);
                                    if (customer != null)
                                    {
                                        customer.LogoPath = null;
                                        await branchDbContext.SaveChangesAsync();
                                    }
                                    break;

                                case "suppliers":
                                    var supplier = await branchDbContext.Suppliers.FindAsync(entityId);
                                    if (supplier != null)
                                    {
                                        supplier.LogoPath = null;
                                        await branchDbContext.SaveChangesAsync();
                                    }
                                    break;

                                case "expenses":
                                    var expense = await branchDbContext.Expenses.FindAsync(entityId);
                                    if (expense != null)
                                    {
                                        expense.ReceiptImagePath = null;
                                        await branchDbContext.SaveChangesAsync();
                                    }
                                    break;

                                case "categories":
                                    var category = await branchDbContext.Categories.FindAsync(entityId);
                                    if (category != null)
                                    {
                                        category.ImagePath = null;
                                        await branchDbContext.SaveChangesAsync();
                                    }
                                    break;

                                case "products":
                                    // For products, delete all ProductImage records
                                    var productImages = branchDbContext.ProductImages
                                        .Where(pi => pi.ProductId == entityId)
                                        .ToList();

                                    if (productImages.Any())
                                    {
                                        branchDbContext.ProductImages.RemoveRange(productImages);
                                        await branchDbContext.SaveChangesAsync();
                                    }
                                    break;
                            }
                        }
                    }
                    else if (entityTypeLower == "branches")
                    {
                        var branchEntity = await headOfficeDbContext.Branches.FindAsync(entityId);
                        if (branchEntity != null)
                        {
                            branchEntity.LogoPath = null;
                            await headOfficeDbContext.SaveChangesAsync();
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Log error but don't fail the request since image was deleted successfully
                    Console.WriteLine($"Warning: Could not clear {entityType} {entityId} image path: {ex.Message}");
                }

                return Results.Ok(new { success = true, message = "Images deleted successfully" });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("DeleteImage")
    .WithOpenApi();

// PATCH /api/v1/images/products/{productId} - Update product images (keep some, delete others, add new)
app.MapPatch(
        "/api/v1/images/products/{productId:guid}",
        async (
            Guid productId,
            HttpContext httpContext,
            Backend.Services.Images.IImageService imageService,
            Backend.Data.DbContextFactory dbContextFactory
        ) =>
        {
            try
            {
                // Get form data
                var form = await httpContext.Request.ReadFormAsync();
                var files = form.Files.GetFiles("images");
                var branchName = form["branchName"].ToString();
                var imageIdsToKeepStr = form["imageIdsToKeep"].ToString();

                if (string.IsNullOrWhiteSpace(branchName))
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new { code = "MISSING_BRANCH_NAME", message = "branchName is required" },
                        }
                    );
                }

                // Get branch context
                var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                if (branch == null)
                {
                    return Results.Unauthorized();
                }

                using var branchDbContext = dbContextFactory.CreateBranchContext(branch);

                // Parse imageIds to keep
                var imageIdsToKeep = new List<Guid>();
                if (!string.IsNullOrWhiteSpace(imageIdsToKeepStr))
                {
                    imageIdsToKeep = imageIdsToKeepStr
                        .Split(',')
                        .Where(s => Guid.TryParse(s.Trim(), out _))
                        .Select(s => Guid.Parse(s.Trim()))
                        .ToList();
                }

                // Get existing ProductImage records
                var existingImages = branchDbContext.ProductImages
                    .Where(pi => pi.ProductId == productId)
                    .ToList();

                // Delete ProductImage records that are NOT in the keep list
                var imagesToDelete = existingImages
                    .Where(img => !imageIdsToKeep.Contains(img.Id))
                    .ToList();

                if (imagesToDelete.Any())
                {
                    // Delete files from disk
                    foreach (var imgToDelete in imagesToDelete)
                    {
                        var baseDir = Path.Combine(
                            imageService.GetType().GetField("_uploadBasePath",
                                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                                ?.GetValue(imageService) as string ?? "Upload",
                            "Branches", branchName, "Products", productId.ToString()
                        );

                        if (Directory.Exists(baseDir))
                        {
                            var filesToDelete = Directory.GetFiles(baseDir, $"{imgToDelete.Id}-*.*");
                            foreach (var file in filesToDelete)
                            {
                                try
                                {
                                    File.Delete(file);
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"Warning: Could not delete file {file}: {ex.Message}");
                                }
                            }
                        }
                    }

                    // Remove from database
                    branchDbContext.ProductImages.RemoveRange(imagesToDelete);
                    await branchDbContext.SaveChangesAsync();
                }

                // Upload new images
                var uploadedImages = new List<object>();
                if (files != null && files.Count > 0)
                {
                    // Get the current max display order
                    var maxDisplayOrder = existingImages
                        .Where(img => imageIdsToKeep.Contains(img.Id))
                        .Select(img => img.DisplayOrder)
                        .DefaultIfEmpty(-1)
                        .Max();

                    var displayOrder = maxDisplayOrder + 1;
                    var userId = Guid.Parse(httpContext.User.FindFirst("sub")?.Value ?? Guid.Empty.ToString());

                    foreach (var file in files)
                    {
                        if (file.Length == 0) continue;

                        var imageId = Guid.NewGuid();

                        using var stream = file.OpenReadStream();
                        var result = await imageService.UploadImageWithCustomIdAsync(
                            branchName,
                            "Products",
                            productId,
                            imageId,
                            stream,
                            file.FileName,
                            skipDelete: true
                        );

                        if (!result.Success)
                        {
                            return Results.BadRequest(
                                new
                                {
                                    success = false,
                                    error = new { code = "UPLOAD_FAILED", message = $"Failed to upload {file.FileName}: {result.ErrorMessage}" },
                                }
                            );
                        }

                        var productImage = new Backend.Models.Entities.Branch.ProductImage
                        {
                            Id = imageId,
                            ProductId = productId,
                            ImagePath = imageId.ToString(),
                            ThumbnailPath = imageId.ToString(),
                            DisplayOrder = displayOrder++,
                            UploadedAt = DateTime.UtcNow,
                            UploadedBy = userId
                        };

                        branchDbContext.ProductImages.Add(productImage);
                        uploadedImages.Add(new
                        {
                            id = imageId,
                            imagePath = imageId.ToString(),
                            thumbnailPath = imageId.ToString(),
                            displayOrder = productImage.DisplayOrder
                        });
                    }

                    await branchDbContext.SaveChangesAsync();
                }

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = new
                        {
                            keptCount = imageIdsToKeep.Count,
                            deletedCount = imagesToDelete.Count,
                            uploadedCount = uploadedImages.Count,
                            uploadedImages = uploadedImages
                        },
                        message = $"Updated images: kept {imageIdsToKeep.Count}, deleted {imagesToDelete.Count}, uploaded {uploadedImages.Count}",
                    }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("UpdateProductImages")
    .WithOpenApi()
    .DisableAntiforgery();

// POST /api/v1/images/upload-multiple - Upload multiple images for a product
app.MapPost(
        "/api/v1/images/upload-multiple",
        async (
            HttpContext httpContext,
            Backend.Services.Images.IImageService imageService,
            Backend.Data.DbContextFactory dbContextFactory
        ) =>
        {
            try
            {
                // Get form data
                var form = await httpContext.Request.ReadFormAsync();
                var files = form.Files.GetFiles("images");

                if (files == null || files.Count == 0)
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new { code = "NO_FILES", message = "No image files provided" },
                        }
                    );
                }

                // Get parameters
                var branchName = form["branchName"].ToString();
                var entityType = form["entityType"].ToString();
                var entityIdStr = form["entityId"].ToString();

                if (string.IsNullOrWhiteSpace(branchName) || string.IsNullOrWhiteSpace(entityType) || string.IsNullOrWhiteSpace(entityIdStr))
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new { code = "MISSING_PARAMETERS", message = "branchName, entityType, and entityId are required" },
                        }
                    );
                }

                if (!Guid.TryParse(entityIdStr, out var entityId))
                {
                    return Results.BadRequest(
                        new
                        {
                            success = false,
                            error = new { code = "INVALID_ENTITY_ID", message = "entityId must be a valid GUID" },
                        }
                    );
                }

                // Get branch context
                var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                if (branch == null)
                {
                    return Results.Unauthorized();
                }

                using var branchDbContext = dbContextFactory.CreateBranchContext(branch);

                // Delete all existing ProductImage records for this product
                var existingImages = branchDbContext.ProductImages
                    .Where(pi => pi.ProductId == entityId)
                    .ToList();

                if (existingImages.Any())
                {
                    branchDbContext.ProductImages.RemoveRange(existingImages);
                    await branchDbContext.SaveChangesAsync();
                }

                // Delete all existing image files from disk
                await imageService.DeleteImageAsync(branchName, entityType, entityId);

                // Upload each new image and create ProductImage records
                var uploadedImages = new List<object>();
                var displayOrder = 0;

                foreach (var file in files)
                {
                    if (file.Length == 0) continue;

                    // Generate a unique ID for this image
                    var imageId = Guid.NewGuid();

                    // Upload the image using the custom ID
                    using var stream = file.OpenReadStream();
                    var result = await imageService.UploadImageWithCustomIdAsync(
                        branchName,
                        entityType,
                        entityId,
                        imageId,
                        stream,
                        file.FileName,
                        skipDelete: true // Don't delete on each upload
                    );

                    if (!result.Success)
                    {
                        // If any upload fails, return error
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                error = new { code = "UPLOAD_FAILED", message = $"Failed to upload {file.FileName}: {result.ErrorMessage}" },
                            }
                        );
                    }

                    // Create ProductImage record in database
                    // Note: We need to get the current user ID from the httpContext
                    var userId = Guid.Parse(httpContext.User.FindFirst("sub")?.Value ?? Guid.Empty.ToString());

                    var productImage = new Backend.Models.Entities.Branch.ProductImage
                    {
                        Id = imageId,
                        ProductId = entityId,
                        ImagePath = imageId.ToString(), // Store the imageId for reference
                        ThumbnailPath = imageId.ToString(),
                        DisplayOrder = displayOrder++,
                        UploadedAt = DateTime.UtcNow,
                        UploadedBy = userId
                    };

                    branchDbContext.ProductImages.Add(productImage);

                    uploadedImages.Add(new
                    {
                        id = imageId,
                        imagePath = imageId.ToString(),
                        thumbnailPath = imageId.ToString(),
                        displayOrder = productImage.DisplayOrder
                    });
                }

                // Save all ProductImage records
                await branchDbContext.SaveChangesAsync();

                return Results.Ok(
                    new
                    {
                        success = true,
                        data = new
                        {
                            images = uploadedImages,
                            count = uploadedImages.Count
                        },
                        message = $"Successfully uploaded {uploadedImages.Count} image(s)",
                    }
                );
            }
            catch (Exception ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "ERROR", message = ex.Message } }
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("UploadMultipleImages")
    .WithOpenApi()
    .DisableAntiforgery();

// ============================================
// Reports Endpoints
// ============================================

// GET /api/v1/reports/sales - Generate sales report
app.MapGet(
        "/api/v1/reports/sales",
        async (
            Backend.Services.Reports.IReportService reportService,
            HttpContext httpContext,
            DateTime? startDate,
            DateTime? endDate,
            Guid? branchId,
            Guid? cashierId,
            Guid? customerId,
            string? paymentMethod,
            string? groupBy
        ) =>
        {
            try
            {
                var userId = Guid.Parse(httpContext.User.FindFirst("sub")?.Value ?? string.Empty);
                var userBranchId = httpContext.Items["BranchId"] as Guid?;
                var isHeadOfficeAdmin = bool.Parse(
                    httpContext.User.FindFirst("IsHeadOfficeAdmin")?.Value ?? "false"
                );

                var request = new Backend.Models.DTOs.Reports.SalesReportRequestDto
                {
                    StartDate = startDate,
                    EndDate = endDate,
                    BranchId = branchId,
                    CashierId = cashierId,
                    CustomerId = customerId,
                    PaymentMethod = paymentMethod,
                    GroupBy = groupBy
                };

                var report = await reportService.GenerateSalesReportAsync(
                    request,
                    userBranchId,
                    isHeadOfficeAdmin
                );

                return Results.Ok(new { success = true, data = report });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Results.Forbid();
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "VALIDATION_ERROR", message = ex.Message } }
                );
            }
            catch (Exception ex)
            {
                return Results.Problem(
                    detail: ex.Message,
                    statusCode: 500,
                    title: "Internal Server Error"
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetSalesReport")
    .WithOpenApi();

// GET /api/v1/reports/inventory - Generate inventory report
app.MapGet(
        "/api/v1/reports/inventory",
        async (
            Backend.Services.Reports.IReportService reportService,
            HttpContext httpContext,
            Guid? branchId,
            Guid? categoryId,
            bool? lowStockOnly,
            bool? negativeStockOnly,
            bool? includeMovements,
            DateTime? startDate,
            DateTime? endDate
        ) =>
        {
            try
            {
                var userId = Guid.Parse(httpContext.User.FindFirst("sub")?.Value ?? string.Empty);
                var userBranchId = httpContext.Items["BranchId"] as Guid?;
                var isHeadOfficeAdmin = bool.Parse(
                    httpContext.User.FindFirst("IsHeadOfficeAdmin")?.Value ?? "false"
                );

                var request = new Backend.Models.DTOs.Reports.InventoryReportRequestDto
                {
                    BranchId = branchId,
                    CategoryId = categoryId,
                    LowStockOnly = lowStockOnly ?? false,
                    NegativeStockOnly = negativeStockOnly ?? false,
                    IncludeMovements = includeMovements ?? false,
                    StartDate = startDate,
                    EndDate = endDate
                };

                var report = await reportService.GenerateInventoryReportAsync(
                    request,
                    userBranchId,
                    isHeadOfficeAdmin
                );

                return Results.Ok(new { success = true, data = report });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Results.Forbid();
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "VALIDATION_ERROR", message = ex.Message } }
                );
            }
            catch (Exception ex)
            {
                return Results.Problem(
                    detail: ex.Message,
                    statusCode: 500,
                    title: "Internal Server Error"
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetInventoryReport")
    .WithOpenApi();

// GET /api/v1/reports/financial - Generate financial report
app.MapGet(
        "/api/v1/reports/financial",
        async (
            Backend.Services.Reports.IReportService reportService,
            HttpContext httpContext,
            DateTime? startDate,
            DateTime? endDate,
            Guid? branchId,
            string? groupBy
        ) =>
        {
            try
            {
                var userId = Guid.Parse(httpContext.User.FindFirst("sub")?.Value ?? string.Empty);
                var userBranchId = httpContext.Items["BranchId"] as Guid?;
                var isHeadOfficeAdmin = bool.Parse(
                    httpContext.User.FindFirst("IsHeadOfficeAdmin")?.Value ?? "false"
                );

                var request = new Backend.Models.DTOs.Reports.FinancialReportRequestDto
                {
                    StartDate = startDate,
                    EndDate = endDate,
                    BranchId = branchId,
                    GroupBy = groupBy
                };

                var report = await reportService.GenerateFinancialReportAsync(
                    request,
                    userBranchId,
                    isHeadOfficeAdmin
                );

                return Results.Ok(new { success = true, data = report });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Results.Forbid();
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "VALIDATION_ERROR", message = ex.Message } }
                );
            }
            catch (Exception ex)
            {
                return Results.Problem(
                    detail: ex.Message,
                    statusCode: 500,
                    title: "Internal Server Error"
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("GetFinancialReport")
    .WithOpenApi();

// POST /api/v1/reports/export - Export report to PDF/Excel/CSV
app.MapPost(
        "/api/v1/reports/export",
        async (
            Backend.Services.Reports.IReportService reportService,
            HttpContext httpContext,
            [FromBody] Backend.Models.DTOs.Reports.ExportReportRequestDto request
        ) =>
        {
            try
            {
                var userId = Guid.Parse(httpContext.User.FindFirst("sub")?.Value ?? string.Empty);
                var userBranchId = httpContext.Items["BranchId"] as Guid?;
                var isHeadOfficeAdmin = bool.Parse(
                    httpContext.User.FindFirst("IsHeadOfficeAdmin")?.Value ?? "false"
                );

                var (fileContent, contentType, fileName) = await reportService.ExportReportAsync(
                    request,
                    userBranchId,
                    isHeadOfficeAdmin
                );

                return Results.File(fileContent, contentType, fileName);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Results.Forbid();
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(
                    new { success = false, error = new { code = "VALIDATION_ERROR", message = ex.Message } }
                );
            }
            catch (Exception ex)
            {
                return Results.Problem(
                    detail: ex.Message,
                    statusCode: 500,
                    title: "Internal Server Error"
                );
            }
        }
    )
    .RequireAuthorization()
    .WithName("ExportReport")
    .WithOpenApi();

app.Run();

// ============================================
// Request DTOs for Sync Endpoints
// ============================================

public record SyncTransactionRequest(
    string Id,
    string Type,
    DateTime Timestamp,
    string BranchId,
    string UserId,
    object Data
);

public record SyncBatchRequest(List<SyncTransactionRequest> Transactions);

// ============================================
// Request DTOs for Category Endpoints
// ============================================

public record CreateCategoryRequest(
    string Code,
    string NameEn,
    string NameAr,
    string? DescriptionEn,
    string? DescriptionAr,
    Guid? ParentCategoryId,
    int DisplayOrder
);

public record UpdateCategoryRequest(
    string Code,
    string NameEn,
    string NameAr,
    string? DescriptionEn,
    string? DescriptionAr,
    Guid? ParentCategoryId,
    int DisplayOrder
);

// ============================================
// Request DTOs for Expense Endpoints
// ============================================

public record ApproveExpenseRequest(bool Approved);

public record CreateExpenseCategoryRequest(
    string Code,
    string NameEn,
    string NameAr,
    decimal? BudgetAllocation
);

// Make Program class accessible for integration testing
public partial class Program { }
