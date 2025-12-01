using Backend.Models.DTOs.Sync;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Endpoints;

/// <summary>
/// Sync endpoints for offline transaction processing
/// </summary>
public static class SyncEndpoints
{
    /// <summary>
    /// Maps sync endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapSyncEndpoints(this IEndpointRouteBuilder app)
    {
        var syncGroup = app.MapGroup("/api/v1/sync").WithTags("Sync");

        // POST /api/v1/sync/transaction - Process a single offline transaction
        syncGroup
            .MapPost(
                "/transaction",
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
        syncGroup
            .MapPost(
                "/batch",
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
        syncGroup
            .MapGet(
                "/status",
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

        return app;
    }
}
