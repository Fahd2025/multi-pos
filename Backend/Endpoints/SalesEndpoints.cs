using Backend.Constants;
using Backend.Data.HeadOffice;
using Backend.Data.Shared;
using Backend.Models.DTOs.Branch.Sales;
using Backend.Models.Entities.Branch;
using Backend.Services.Branch;
using Backend.Services.Branch.Sales;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Endpoints;

/// <summary>
/// Sales transaction endpoints
/// </summary>
public static class SalesEndpoints
{
    /// <summary>
    /// Maps sales endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapSalesEndpoints(this IEndpointRouteBuilder app)
    {
        var salesGroup = app.MapGroup(ApiRoutes.Sales.Group).WithTags("Sales");

        // POST /api/v1/sales - Create a new sale
        salesGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreateSaleDto createSaleDto,
                    HttpContext httpContext,
                    ISalesService salesService
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
                            branch.Code
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
        salesGroup
            .MapGet(
                "",
                async (
                    HttpContext httpContext,
                    ISalesService salesService,
                    int page = 1,
                    int pageSize = 20,
                    DateTime? dateFrom = null,
                    DateTime? dateTo = null,
                    Guid? customerId = null,
                    Guid? cashierId = null,
                    InvoiceType? invoiceType = null,
                    PaymentMethod? paymentMethod = null,
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
                            branch.Code
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
        salesGroup
            .MapGet(
                "/{id:guid}",
                async (Guid id, HttpContext httpContext, ISalesService salesService) =>
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

                        var sale = await salesService.GetSaleByIdAsync(id, branch.Code);

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
        salesGroup
            .MapPost(
                "/{id:guid}/void",
                async (
                    Guid id,
                    [FromBody] VoidSaleDto voidSaleDto,
                    HttpContext httpContext,
                    ISalesService salesService
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
                            branch.Code
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

        // GET /api/v1/sales/:id/invoice - Get invoice in various formats
        salesGroup
            .MapGet(
                "/{id:guid}/invoice",
                async (
                    Guid id,
                    HttpContext httpContext,
                    DbContextFactory dbContextFactory,
                    HeadOfficeDbContext headOfficeContext,
                    ISalesService salesService,
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

                        // For HTML format, fetch the Sale entity directly to access DeliveryOrder
                        Sale? saleEntity = null;
                        if (format.ToLower() == "html")
                        {
                            using var context = dbContextFactory.CreateBranchContext(branch);
                            saleEntity = await context.Sales
                                .Include(s => s.Customer)
                                .Include(s => s.LineItems)
                                .ThenInclude(li => li.Product)
                                .Include(s => s.DeliveryOrder)
                                .FirstOrDefaultAsync(s => s.Id == id);

                            if (saleEntity == null)
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
                        }

                        // For JSON format, use the DTO
                        var sale = saleEntity == null ? await salesService.GetSaleByIdAsync(id, branch.Code) : null;

                        if (sale == null && saleEntity == null)
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

                        // Return HTML format for printing
                        if (format.ToLower() == "html")
                        {
                            // Get cashier name
                            var cashier = await headOfficeContext.Users.FindAsync(saleEntity!.CashierId);
                            var cashierName = cashier?.FullNameEn ?? "Unknown";

                            var html = $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Invoice - {saleEntity.TransactionId}</title>
    <style>
        body {{
            font-family: 'Courier New', monospace;
            max-width: 80mm;
            margin: 0 auto;
            padding: 10px;
            font-size: 12px;
        }}
        .header {{
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
        }}
        .header h1 {{
            margin: 0;
            font-size: 18px;
        }}
        .header p {{
            margin: 2px 0;
            font-size: 10px;
        }}
        .section {{
            margin: 10px 0;
        }}
        .section-title {{
            font-weight: bold;
            margin-bottom: 5px;
        }}
        .line-items {{
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }}
        .line-items th {{
            text-align: left;
            border-bottom: 1px solid #000;
            padding: 5px 0;
        }}
        .line-items td {{
            padding: 5px 0;
        }}
        .line-items .qty {{
            text-align: center;
            width: 30px;
        }}
        .line-items .price {{
            text-align: right;
            width: 60px;
        }}
        .totals {{
            border-top: 1px solid #000;
            padding-top: 10px;
            margin-top: 10px;
        }}
        .totals-row {{
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
        }}
        .totals-row.grand-total {{
            font-weight: bold;
            font-size: 14px;
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 5px;
        }}
        .footer {{
            text-align: center;
            border-top: 2px dashed #000;
            padding-top: 10px;
            margin-top: 20px;
            font-size: 10px;
        }}
        @media print {{
            body {{
                max-width: 100%;
            }}
        }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>{branch.NameEn}</h1>
        <p>{branch.AddressEn}</p>
        <p>Phone: {branch.Phone}</p>
        {(string.IsNullOrEmpty(branch.Email) ? "" : $"<p>Email: {branch.Email}</p>")}
        {(string.IsNullOrEmpty(branch.TaxNumber) ? "" : $"<p>Tax #: {branch.TaxNumber}</p>")}
        {(string.IsNullOrEmpty(branch.CRN) ? "" : $"<p>CRN: {branch.CRN}</p>")}
    </div>

    <div class='section'>
        <div class='section-title'>SALES RECEIPT</div>
        <p><strong>Transaction ID:</strong> {saleEntity.TransactionId}</p>
        {(string.IsNullOrEmpty(saleEntity.InvoiceNumber) ? "" : $"<p><strong>Invoice #:</strong> {saleEntity.InvoiceNumber}</p>")}
        <p><strong>Date:</strong> {saleEntity.SaleDate:yyyy-MM-dd HH:mm:ss}</p>
        <p><strong>Cashier:</strong> {cashierName}</p>
        {(saleEntity.CustomerId.HasValue && saleEntity.Customer != null ? $"<p><strong>Customer:</strong> {saleEntity.Customer.NameEn}</p>" : "")}
    </div>

    {(saleEntity.DeliveryOrder != null ? $@"
    <div class='section' style='background-color: #fffbe6; padding: 8px; border-left: 3px solid #faad14; margin: 10px 0;'>
        <div class='section-title' style='color: #d46b08;'>🚚 DELIVERY INFORMATION</div>
        <p style='font-size: 10px;'><strong>Status:</strong> {(saleEntity.DeliveryOrder.DriverId == null ? "⏳ Awaiting driver assignment" : "✓ Assigned to driver")}</p>
        {(saleEntity.DeliveryOrder.DriverId != null ? $"<p style='font-size: 10px;'><strong>Driver:</strong> Assigned</p>" : "")}
        <p style='font-size: 10px;'><strong>Address:</strong> {saleEntity.DeliveryOrder.DeliveryAddress}</p>
        {(!string.IsNullOrEmpty(saleEntity.DeliveryOrder.SpecialInstructions) ? $"<p style='font-size: 10px;'><strong>Instructions:</strong> {saleEntity.DeliveryOrder.SpecialInstructions}</p>" : "")}
    </div>" : "")}

    <table class='line-items'>
        <thead>
            <tr>
                <th>Item</th>
                <th class='qty'>Qty</th>
                <th class='price'>Price</th>
                <th class='price'>Total</th>
            </tr>
        </thead>
        <tbody>
            {string.Join("", saleEntity.LineItems.Select(li => $@"
            <tr>
                <td>{li.Product?.NameEn ?? "Unknown Product"}</td>
                <td class='qty'>{li.Quantity}</td>
                <td class='price'>${li.UnitPrice:F2}</td>
                <td class='price'>${li.LineTotal:F2}</td>
            </tr>
            {(li.DiscountType != DiscountType.None ? $@"
            <tr>
                <td colspan='4' style='font-size: 10px; padding-left: 10px;'>
                    Discount: {(li.DiscountType == DiscountType.Percentage ? $"{li.DiscountValue}% off" : $"${li.DiscountValue:F2} off")}
                </td>
            </tr>" : "")}"))}
        </tbody>
    </table>

    <div class='totals'>
        <div class='totals-row'>
            <span>Subtotal:</span>
            <span>${saleEntity.Subtotal:F2}</span>
        </div>
        {(saleEntity.TotalDiscount > 0 ? $@"
        <div class='totals-row'>
            <span>Discount:</span>
            <span>-${saleEntity.TotalDiscount:F2}</span>
        </div>" : "")}
        {(saleEntity.TaxAmount > 0 ? $@"
        <div class='totals-row'>
            <span>Tax ({branch.TaxRate:F1}%):</span>
            <span>${saleEntity.TaxAmount:F2}</span>
        </div>" : "")}
        <div class='totals-row grand-total'>
            <span>TOTAL:</span>
            <span>${saleEntity.Total:F2}</span>
        </div>
        <div class='totals-row' style='margin-top: 10px;'>
            <span>Payment Method:</span>
            <span>{saleEntity.PaymentMethod}</span>
        </div>
    </div>

    {(string.IsNullOrEmpty(saleEntity.Notes) ? "" : $@"
    <div class='section'>
        <div class='section-title'>Notes:</div>
        <p style='font-size: 10px;'>{saleEntity.Notes}</p>
    </div>")}

    <div class='footer'>
        <p>Thank you for your business!</p>
        <p>*** {(saleEntity.InvoiceType == InvoiceType.Standard ? "TAX INVOICE" : "SIMPLIFIED INVOICE")} ***</p>
    </div>
</body>
</html>";

                            return Results.Content(html, "text/html");
                        }

                        // Return JSON format (default)
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
                                        discount = li.DiscountType == DiscountType.Percentage
                                            ? $"{li.DiscountValue}% off"
                                        : li.DiscountType == DiscountType.FixedAmount
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
        salesGroup
            .MapGet(
                "/stats",
                async (
                    HttpContext httpContext,
                    ISalesService salesService,
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

                        var stats = await salesService.GetSalesStatsAsync(from, to, branch.Code);

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

        // PUT /api/v1/sales/:id/payment - Update payment for an existing sale
        salesGroup
            .MapPut(
                "/{id:guid}/payment",
                async (
                    Guid id,
                    [FromBody] UpdateSalePaymentDto updatePaymentDto,
                    HttpContext httpContext,
                    ISalesService salesService
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

                        var sale = await salesService.UpdateSalePaymentAsync(
                            id,
                            updatePaymentDto,
                            branch.Code
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = sale,
                                message = "Payment updated successfully",
                            }
                        );
                    }
                    catch (KeyNotFoundException ex)
                    {
                        return Results.NotFound(
                            new
                            {
                                success = false,
                                error = new
                                {
                                    code = "SALE_NOT_FOUND",
                                    message = ex.Message,
                                },
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
            .WithName("UpdateSalePayment")
            .WithOpenApi();

        // POST /api/v1/sales/return - Process a return (full or partial)
        salesGroup
            .MapPost(
                "/return",
                async (
                    [FromBody] CreateReturnDto createReturnDto,
                    HttpContext httpContext,
                    SalesReturnService returnService
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

                        // Check if user has manager role or higher (returns require approval)
                        var userRole = httpContext
                            .User.FindFirst(System.Security.Claims.ClaimTypes.Role)
                            ?.Value;
                        if (
                            userRole != "Manager"
                            && userRole != "Admin"
                            && httpContext.Items["IsHeadOfficeAdmin"] as bool? != true
                        )
                        {
                            return Results.StatusCode(403); // Forbidden - returns require manager approval
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

                        var result = await returnService.ProcessReturnAsync(
                            createReturnDto,
                            userId.Value
                        );

                        return Results.Created(
                            $"/api/v1/sales/{result.ReturnSaleId}",
                            new
                            {
                                success = true,
                                data = result,
                                message = "Return processed successfully",
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
            .WithName("CreateSaleReturn")
            .WithOpenApi();

        // GET /api/v1/sales/{id:guid}/returns - Get all returns for a sale
        salesGroup
            .MapGet(
                "/{id:guid}/returns",
                async (Guid id, HttpContext httpContext, SalesReturnService returnService) =>
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

                        var returns = await returnService.GetReturnsForSaleAsync(id);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = returns,
                                count = returns.Count,
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
            .WithName("GetSaleReturns")
            .WithOpenApi();

        // GET /api/v1/sales/{id:guid}/can-return - Check if a sale can be returned
        salesGroup
            .MapGet(
                "/{id:guid}/can-return",
                async (Guid id, HttpContext httpContext, SalesReturnService returnService) =>
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

                        var canReturn = await returnService.CanReturnSaleAsync(id);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = new { canReturn, saleId = id },
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
            .WithName("CanReturnSale")
            .WithOpenApi();

        // GET /api/v1/sales/{id:guid}/return-invoice - Get printable return invoice
        salesGroup
            .MapGet(
                "/{id:guid}/return-invoice",
                async (
                    Guid id,
                    HttpContext httpContext,
                    DbContextFactory dbContextFactory,
                    ISalesService salesService,
                    IInvoiceTemplateService templateService,
                    IInvoiceRenderingService renderingService,
                    string format = "html"
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

                        // Get the return sale (this is already a return transaction)
                        var returnSale = await salesService.GetSaleByIdAsync(id, branch.Code);

                        if (returnSale == null)
                        {
                            return Results.NotFound(
                                new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "RETURN_NOT_FOUND",
                                        message = $"Return sale with ID '{id}' does not exist",
                                    },
                                }
                            );
                        }

                        // Verify this is actually a return
                        if (!returnSale.IsReturn)
                        {
                            return Results.BadRequest(
                                new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "NOT_A_RETURN",
                                        message = "The specified sale is not a return transaction",
                                    },
                                }
                            );
                        }

                        // Return HTML format for printing
                        if (format.ToLower() == "html")
                        {
                            // Get the active return template
                            var template = await templateService.GetActiveTemplateByTypeAsync(TemplateType.Return);
                            if (template == null)
                            {
                                return Results.BadRequest(
                                    new
                                    {
                                        success = false,
                                        error = new
                                        {
                                            code = "NO_ACTIVE_RETURN_TEMPLATE",
                                            message = "No active return invoice template found. Please configure a return template in the invoice builder.",
                                        },
                                    }
                                );
                            }

                            // Fetch the sale entity with all necessary relationships
                            using var context = dbContextFactory.CreateBranchContext(branch);
                            var saleEntity = await context.Sales
                                .Include(s => s.Customer)
                                .Include(s => s.LineItems)
                                    .ThenInclude(li => li.Product)
                                .FirstOrDefaultAsync(s => s.Id == id);

                            if (saleEntity == null)
                            {
                                return Results.NotFound(
                                    new
                                    {
                                        success = false,
                                        error = new
                                        {
                                            code = "RETURN_NOT_FOUND",
                                            message = $"Return sale with ID '{id}' does not exist",
                                        },
                                    }
                                );
                            }

                            // Generate ZATCA QR code (placeholder for now)
                            var zatcaQRCode = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

                            // Find template entity
                            var templateEntity = await context.InvoiceTemplates.FindAsync(template.Id);
                            if (templateEntity == null)
                            {
                                return Results.BadRequest(
                                    new
                                    {
                                        success = false,
                                        error = new
                                        {
                                            code = "TEMPLATE_NOT_FOUND",
                                            message = "Invoice template not found in database",
                                        },
                                    }
                                );
                            }

                            // Render the invoice using the template
                            var html = renderingService.RenderInvoice(templateEntity, saleEntity, branch, zatcaQRCode);

                            return Results.Content(html, "text/html");
                        }


                        // Return JSON format (default)
                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = new
                                {
                                    returnId = returnSale.Id,
                                    transactionId = returnSale.TransactionId,
                                    invoiceNumber = returnSale.InvoiceNumber,
                                    returnDate = returnSale.SaleDate,
                                    originalSaleId = returnSale.OriginalSaleId,
                                    refundAmount = Math.Abs(returnSale.Total),
                                    items = returnSale.LineItems.Select(li => new
                                    {
                                        productName = li.ProductName,
                                        quantity = Math.Abs(li.Quantity),
                                        unitPrice = Math.Abs(li.UnitPrice),
                                        total = Math.Abs(li.LineTotal)
                                    }),
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
            .WithName("GetReturnInvoice")
            .WithOpenApi();

        return app;
    }
}
