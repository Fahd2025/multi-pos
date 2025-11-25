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
// Authentication Endpoints
// ============================================

// POST /api/v1/auth/login - Authenticate user
app.MapPost(
        "/api/v1/auth/login",
        async (
            Backend.Models.DTOs.Auth.LoginRequest loginRequest,
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
            SyncTransactionRequest request,
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
            SyncBatchRequest request,
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
            CreateCategoryRequest request,
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
            UpdateCategoryRequest request,
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
            Backend.Models.DTOs.Inventory.CreateProductDto dto,
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
            Backend.Models.DTOs.Inventory.UpdateProductDto dto,
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
            Backend.Models.DTOs.Inventory.StockAdjustmentDto dto,
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
            Backend.Models.DTOs.Inventory.CreatePurchaseDto dto,
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
            Backend.Models.DTOs.Customers.CreateCustomerDto dto,
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
            Backend.Models.DTOs.Customers.UpdateCustomerDto dto,
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

// Make Program class accessible for integration testing
public partial class Program { }
