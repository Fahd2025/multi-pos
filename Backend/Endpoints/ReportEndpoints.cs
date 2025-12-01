using Backend.Models.DTOs.Shared.Reports;
using Backend.Services.Shared.Reports;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Endpoints;

/// <summary>
/// Reports endpoints for generating sales, inventory, and financial reports
/// </summary>
public static class ReportEndpoints
{
    /// <summary>
    /// Maps report endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapReportEndpoints(this IEndpointRouteBuilder app)
    {
        var reportsGroup = app.MapGroup("/api/v1/reports").WithTags("Reports");

        // GET /api/v1/reports/sales - Generate sales report
        reportsGroup
            .MapGet(
                "/sales",
                async (
                    IReportService reportService,
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

                        var request = new SalesReportRequestDto
                        {
                            StartDate = startDate,
                            EndDate = endDate,
                            BranchId = branchId,
                            CashierId = cashierId,
                            CustomerId = customerId,
                            PaymentMethod = paymentMethod,
                            GroupBy = groupBy,
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
                            new
                            {
                                success = false,
                                error = new { code = "VALIDATION_ERROR", message = ex.Message },
                            }
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
        reportsGroup
            .MapGet(
                "/inventory",
                async (
                    IReportService reportService,
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

                        var request = new InventoryReportRequestDto
                        {
                            BranchId = branchId,
                            CategoryId = categoryId,
                            LowStockOnly = lowStockOnly ?? false,
                            NegativeStockOnly = negativeStockOnly ?? false,
                            IncludeMovements = includeMovements ?? false,
                            StartDate = startDate,
                            EndDate = endDate,
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
                            new
                            {
                                success = false,
                                error = new { code = "VALIDATION_ERROR", message = ex.Message },
                            }
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
        reportsGroup
            .MapGet(
                "/financial",
                async (
                    IReportService reportService,
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

                        var request = new FinancialReportRequestDto
                        {
                            StartDate = startDate,
                            EndDate = endDate,
                            BranchId = branchId,
                            GroupBy = groupBy,
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
                            new
                            {
                                success = false,
                                error = new { code = "VALIDATION_ERROR", message = ex.Message },
                            }
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
        reportsGroup
            .MapPost(
                "/export",
                async (
                    IReportService reportService,
                    HttpContext httpContext,
                    [FromBody] ExportReportRequestDto request
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
                            new
                            {
                                success = false,
                                error = new { code = "VALIDATION_ERROR", message = ex.Message },
                            }
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

        return app;
    }
}
