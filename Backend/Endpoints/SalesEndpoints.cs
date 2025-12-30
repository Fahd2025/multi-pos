using Backend.Constants;
using Backend.Models.DTOs.Branch.Sales;
using Backend.Models.Entities.Branch;
using Backend.Services.Branch;
using Backend.Services.Branch.Sales;
using Microsoft.AspNetCore.Mvc;

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

                        // Return HTML format for printing
                        if (format.ToLower() == "html")
                        {
                            var html = $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Invoice - {sale.TransactionId}</title>
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
        <p><strong>Transaction ID:</strong> {sale.TransactionId}</p>
        {(string.IsNullOrEmpty(sale.InvoiceNumber) ? "" : $"<p><strong>Invoice #:</strong> {sale.InvoiceNumber}</p>")}
        <p><strong>Date:</strong> {sale.SaleDate:yyyy-MM-dd HH:mm:ss}</p>
        <p><strong>Cashier:</strong> {sale.CashierName}</p>
        {(sale.CustomerId.HasValue ? $"<p><strong>Customer:</strong> {sale.CustomerName}</p>" : "")}
    </div>

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
            {string.Join("", sale.LineItems.Select(li => $@"
            <tr>
                <td>{li.ProductName}</td>
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
            <span>${sale.Subtotal:F2}</span>
        </div>
        {(sale.TotalDiscount > 0 ? $@"
        <div class='totals-row'>
            <span>Discount:</span>
            <span>-${sale.TotalDiscount:F2}</span>
        </div>" : "")}
        {(sale.TaxAmount > 0 ? $@"
        <div class='totals-row'>
            <span>Tax ({branch.TaxRate:F1}%):</span>
            <span>${sale.TaxAmount:F2}</span>
        </div>" : "")}
        <div class='totals-row grand-total'>
            <span>TOTAL:</span>
            <span>${sale.Total:F2}</span>
        </div>
        <div class='totals-row' style='margin-top: 10px;'>
            <span>Payment Method:</span>
            <span>{sale.PaymentMethodName}</span>
        </div>
    </div>

    {(string.IsNullOrEmpty(sale.Notes) ? "" : $@"
    <div class='section'>
        <div class='section-title'>Notes:</div>
        <p style='font-size: 10px;'>{sale.Notes}</p>
    </div>")}

    <div class='footer'>
        <p>Thank you for your business!</p>
        <p>*** {(sale.InvoiceType == InvoiceType.Standard ? "TAX INVOICE" : "SIMPLIFIED INVOICE")} ***</p>
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
                    ISalesService salesService,
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
                            // Get original sale for reference
                            SaleDto? originalSale = null;
                            if (returnSale.OriginalSaleId.HasValue)
                            {
                                originalSale = await salesService.GetSaleByIdAsync(
                                    returnSale.OriginalSaleId.Value,
                                    branch.Code
                                );
                            }

                            var html = $@"
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Return Invoice - {returnSale.TransactionId}</title>
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
        .return-notice {{
            background: #ffebee;
            border: 2px solid #c62828;
            padding: 10px;
            margin: 10px 0;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
        }}
        .section {{
            margin: 10px 0;
        }}
        .section-title {{
            font-weight: bold;
            margin-bottom: 5px;
        }}
        .info-row {{
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
            font-size: 11px;
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
            background: #fff3cd;
        }}
        .refund-notice {{
            background: #e3f2fd;
            border: 1px solid #1976d2;
            padding: 8px;
            margin: 10px 0;
            text-align: center;
            font-size: 11px;
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
            .return-notice {{
                background: white;
            }}
            .totals-row.grand-total {{
                background: white;
            }}
            .refund-notice {{
                background: white;
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

    <div class='return-notice'>
        *** RETURN INVOICE ***
    </div>

    <div class='section'>
        <div class='section-title'>RETURN DETAILS</div>
        <div class='info-row'>
            <span><strong>Return #:</strong></span>
            <span>{returnSale.TransactionId}</span>
        </div>
        {(string.IsNullOrEmpty(returnSale.InvoiceNumber) ? "" : $@"
        <div class='info-row'>
            <span><strong>Invoice #:</strong></span>
            <span>{returnSale.InvoiceNumber}</span>
        </div>")}
        <div class='info-row'>
            <span><strong>Return Date:</strong></span>
            <span>{returnSale.SaleDate:yyyy-MM-dd HH:mm:ss}</span>
        </div>
        <div class='info-row'>
            <span><strong>Processed By:</strong></span>
            <span>{returnSale.CashierName}</span>
        </div>
        {(returnSale.CustomerId.HasValue ? $@"
        <div class='info-row'>
            <span><strong>Customer:</strong></span>
            <span>{returnSale.CustomerName}</span>
        </div>" : "")}
    </div>

    {(originalSale != null ? $@"
    <div class='section'>
        <div class='section-title'>ORIGINAL SALE</div>
        <div class='info-row'>
            <span><strong>Original Invoice:</strong></span>
            <span>{(string.IsNullOrEmpty(originalSale.InvoiceNumber) ? originalSale.TransactionId : originalSale.InvoiceNumber)}</span>
        </div>
        <div class='info-row'>
            <span><strong>Original Date:</strong></span>
            <span>{originalSale.SaleDate:yyyy-MM-dd}</span>
        </div>
    </div>" : "")}

    {(!string.IsNullOrEmpty(returnSale.Notes) ? $@"
    <div class='section'>
        <div class='section-title'>RETURN REASON</div>
        <p style='font-size: 10px; margin: 5px 0;'>{returnSale.Notes}</p>
    </div>" : "")}

    <div class='section'>
        <div class='section-title'>RETURNED ITEMS</div>
    </div>

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
            {string.Join("", returnSale.LineItems.Select(li => $@"
            <tr>
                <td>{li.ProductName}</td>
                <td class='qty'>{Math.Abs(li.Quantity)}</td>
                <td class='price'>${Math.Abs(li.UnitPrice):F2}</td>
                <td class='price'>${Math.Abs(li.LineTotal):F2}</td>
            </tr>"))}
        </tbody>
    </table>

    <div class='totals'>
        <div class='totals-row'>
            <span>Subtotal:</span>
            <span>${Math.Abs(returnSale.Subtotal):F2}</span>
        </div>
        {(returnSale.TotalDiscount > 0 ? $@"
        <div class='totals-row'>
            <span>Discount:</span>
            <span>-${Math.Abs(returnSale.TotalDiscount):F2}</span>
        </div>" : "")}
        {(returnSale.TaxAmount > 0 ? $@"
        <div class='totals-row'>
            <span>Tax ({branch.TaxRate:F1}%):</span>
            <span>${Math.Abs(returnSale.TaxAmount):F2}</span>
        </div>" : "")}
        <div class='totals-row grand-total'>
            <span>REFUND AMOUNT:</span>
            <span>${Math.Abs(returnSale.Total):F2}</span>
        </div>
    </div>

    <div class='refund-notice'>
        <p style='margin: 0;'><strong>REFUND METHOD: {returnSale.PaymentMethodName}</strong></p>
        <p style='margin: 5px 0 0 0;'>Please retain this receipt for your records</p>
    </div>

    <div class='footer'>
        <p>*** RETURN RECEIPT ***</p>
        <p>No refunds on returned items</p>
        <p>Thank you for your understanding</p>
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
