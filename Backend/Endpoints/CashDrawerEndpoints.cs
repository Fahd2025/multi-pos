using Backend.Constants;
using Backend.Models.DTOs.CashDrawer;
using Backend.Services.Branch.CashDrawer;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Endpoints;

/// <summary>
/// Cash drawer management endpoints
/// </summary>
public static class CashDrawerEndpoints
{
    /// <summary>
    /// Maps cash drawer endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapCashDrawerEndpoints(this IEndpointRouteBuilder app)
    {
        var cashDrawerGroup = app.MapGroup("/api/v1/cash-drawer").WithTags("CashDrawer");

        // POST /api/v1/cash-drawer/open - Open a new cash drawer
        cashDrawerGroup
            .MapPost(
                "/open",
                async (
                    [FromBody] OpenDrawerDto dto,
                    HttpContext httpContext,
                    ICashDrawerService cashDrawerService
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

                        var cashDrawer = await cashDrawerService.OpenDrawerAsync(
                            branch.Id,
                            dto,
                            userId.Value
                        );

                        return Results.Created(
                            $"/api/v1/cash-drawer/{cashDrawer.Id}",
                            new
                            {
                                success = true,
                                data = cashDrawer,
                                message = "Cash drawer opened successfully",
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
            .WithName("OpenCashDrawer")
            .WithOpenApi();

        // POST /api/v1/cash-drawer/{id}/close - Close a cash drawer
        cashDrawerGroup
            .MapPost(
                "/{id}/close",
                async (
                    Guid id,
                    [FromBody] CloseDrawerDto dto,
                    HttpContext httpContext,
                    ICashDrawerService cashDrawerService
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

                        var cashDrawer = await cashDrawerService.CloseDrawerAsync(id, dto, userId.Value);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = cashDrawer,
                                message = "Cash drawer closed successfully",
                            }
                        );
                    }
                    catch (KeyNotFoundException ex)
                    {
                        return Results.NotFound(
                            new
                            {
                                success = false,
                                error = new { code = "NOT_FOUND", message = ex.Message },
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
            .WithName("CloseCashDrawer")
            .WithOpenApi();

        // GET /api/v1/cash-drawer/current - Get current open drawer
        cashDrawerGroup
            .MapGet(
                "/current",
                async (
                    HttpContext httpContext,
                    ICashDrawerService cashDrawerService
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

                        var cashDrawer = await cashDrawerService.GetCurrentDrawerAsync(branch.Id);

                        if (cashDrawer == null)
                        {
                            return Results.Ok(
                                new
                                {
                                    success = true,
                                    data = (object?)null,
                                    message = "No open cash drawer found",
                                }
                            );
                        }

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = cashDrawer,
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
            .WithName("GetCurrentCashDrawer")
            .WithOpenApi();

        // GET /api/v1/cash-drawer/{id} - Get cash drawer by ID
        cashDrawerGroup
            .MapGet(
                "/{id}",
                async (
                    Guid id,
                    ICashDrawerService cashDrawerService
                ) =>
                {
                    try
                    {
                        var cashDrawer = await cashDrawerService.GetDrawerByIdAsync(id);

                        if (cashDrawer == null)
                        {
                            return Results.NotFound(
                                new
                                {
                                    success = false,
                                    error = new { code = "NOT_FOUND", message = "Cash drawer not found" },
                                }
                            );
                        }

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = cashDrawer,
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
            .WithName("GetCashDrawerById")
            .WithOpenApi();

        // POST /api/v1/cash-drawer/{id}/transaction - Add a transaction
        cashDrawerGroup
            .MapPost(
                "/{id}/transaction",
                async (
                    Guid id,
                    [FromBody] CreateCashTransactionDto dto,
                    HttpContext httpContext,
                    ICashDrawerService cashDrawerService
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

                        var transaction = await cashDrawerService.AddTransactionAsync(
                            id,
                            dto,
                            userId.Value
                        );

                        return Results.Created(
                            $"/api/v1/cash-drawer/{id}/transaction/{transaction.Id}",
                            new
                            {
                                success = true,
                                data = transaction,
                                message = "Transaction added successfully",
                            }
                        );
                    }
                    catch (KeyNotFoundException ex)
                    {
                        return Results.NotFound(
                            new
                            {
                                success = false,
                                error = new { code = "NOT_FOUND", message = ex.Message },
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
            .WithName("AddCashTransaction")
            .WithOpenApi();

        // GET /api/v1/cash-drawer/history - Get drawer history
        cashDrawerGroup
            .MapGet(
                "/history",
                async (
                    HttpContext httpContext,
                    ICashDrawerService cashDrawerService,
                    DateTime? startDate = null,
                    DateTime? endDate = null,
                    int page = 1,
                    int pageSize = 50
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

                        var history = await cashDrawerService.GetDrawerHistoryAsync(
                            branch.Id,
                            startDate,
                            endDate,
                            page,
                            pageSize
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = history,
                                pagination = new
                                {
                                    page,
                                    pageSize,
                                    totalItems = history.Count,
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
            .WithName("GetCashDrawerHistory")
            .WithOpenApi();

        // GET /api/v1/cash-drawer/{id}/reconciliation - Get reconciliation report
        cashDrawerGroup
            .MapGet(
                "/{id}/reconciliation",
                async (
                    Guid id,
                    ICashDrawerService cashDrawerService
                ) =>
                {
                    try
                    {
                        var report = await cashDrawerService.GetReconciliationReportAsync(id);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = report,
                            }
                        );
                    }
                    catch (KeyNotFoundException ex)
                    {
                        return Results.NotFound(
                            new
                            {
                                success = false,
                                error = new { code = "NOT_FOUND", message = ex.Message },
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
            .WithName("GetCashDrawerReconciliation")
            .WithOpenApi();

        return app;
    }
}
