using Backend.Models.DTOs.Branch.PendingOrders;
using Backend.Models.Enums;
using Backend.Models.Entities.Branch;
using Backend.Services.Branch.PendingOrders;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Endpoints;

/// <summary>
/// Pending Orders management endpoints
/// </summary>
public static class PendingOrdersEndpoints
{
    /// <summary>
    /// Maps pending orders endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapPendingOrdersEndpoints(this IEndpointRouteBuilder app)
    {
        var pendingOrdersGroup = app.MapGroup("/api/v1/pending-orders").WithTags("Pending Orders");

        // POST /api/v1/pending-orders - Create a new pending order
        pendingOrdersGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreatePendingOrderDto createDto,
                    HttpContext httpContext,
                    IPendingOrdersService pendingOrdersService
                ) =>
                {
                    try
                    {
                        // Get user ID and username from claims
                        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                        var username = httpContext.User.FindFirst(ClaimTypes.Name)?.Value;

                        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(username))
                        {
                            return Results.Unauthorized();
                        }

                        var result = await pendingOrdersService.CreatePendingOrderAsync(
                            createDto,
                            userId,
                            username
                        );

                        if (!result.Success)
                        {
                            return Results.BadRequest(result);
                        }

                        return Results.Created(
                            $"/api/v1/pending-orders/{result.Data!.Id}",
                            result
                        );
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                message = "Failed to create pending order",
                                errors = new[] { ex.Message }
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("CreatePendingOrder")
            .WithOpenApi(operation =>
            {
                operation.Summary = "Create a new pending order";
                operation.Description = "Creates a new pending order with items. Order will expire after 24 hours.";
                return operation;
            });

        // GET /api/v1/pending-orders - List pending orders with filtering
        pendingOrdersGroup
            .MapGet(
                "",
                async (
                    HttpContext httpContext,
                    IPendingOrdersService pendingOrdersService,
                    PendingOrderStatus? status = null,
                    string? createdBy = null,
                    OrderType? orderType = null,
                    string? search = null,
                    int page = 1,
                    int pageSize = 10
                ) =>
                {
                    try
                    {
                        // Get current user ID
                        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                        if (string.IsNullOrEmpty(userId))
                        {
                            return Results.Unauthorized();
                        }

                        // Check if user is manager
                        var isManager = httpContext.User.IsInRole("Manager") ||
                                      httpContext.User.IsInRole("Admin") ||
                                      httpContext.User.IsInRole("HeadOfficeAdmin");

                        var result = await pendingOrdersService.GetPendingOrdersAsync(
                            status,
                            createdBy,
                            orderType,
                            search,
                            page,
                            pageSize,
                            isManager,
                            userId
                        );

                        if (!result.Success)
                        {
                            return Results.BadRequest(result);
                        }

                        return Results.Ok(result);
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                message = "Failed to retrieve pending orders",
                                errors = new[] { ex.Message }
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("GetPendingOrders")
            .WithOpenApi(operation =>
            {
                operation.Summary = "Get pending orders";
                operation.Description = "Retrieves pending orders with filtering and pagination. Cashiers see only their own orders, managers see all.";
                return operation;
            });

        // GET /api/v1/pending-orders/{id} - Get pending order by ID
        pendingOrdersGroup
            .MapGet(
                "{id:guid}",
                async (
                    Guid id,
                    HttpContext httpContext,
                    IPendingOrdersService pendingOrdersService
                ) =>
                {
                    try
                    {
                        // Get current user ID
                        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                        if (string.IsNullOrEmpty(userId))
                        {
                            return Results.Unauthorized();
                        }

                        // Check if user is manager
                        var isManager = httpContext.User.IsInRole("Manager") ||
                                      httpContext.User.IsInRole("Admin") ||
                                      httpContext.User.IsInRole("HeadOfficeAdmin");

                        var result = await pendingOrdersService.GetPendingOrderByIdAsync(
                            id,
                            userId,
                            isManager
                        );

                        if (!result.Success)
                        {
                            return Results.NotFound(result);
                        }

                        return Results.Ok(result);
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                message = "Failed to retrieve pending order",
                                errors = new[] { ex.Message }
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("GetPendingOrderById")
            .WithOpenApi(operation =>
            {
                operation.Summary = "Get pending order by ID";
                operation.Description = "Retrieves a specific pending order. Users can only access their own orders unless they are managers.";
                return operation;
            });

        // PUT /api/v1/pending-orders/{id} - Update pending order
        pendingOrdersGroup
            .MapPut(
                "{id:guid}",
                async (
                    Guid id,
                    [FromBody] UpdatePendingOrderDto updateDto,
                    HttpContext httpContext,
                    IPendingOrdersService pendingOrdersService
                ) =>
                {
                    try
                    {
                        // Get current user ID
                        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                        if (string.IsNullOrEmpty(userId))
                        {
                            return Results.Unauthorized();
                        }

                        // Check if user is manager
                        var isManager = httpContext.User.IsInRole("Manager") ||
                                      httpContext.User.IsInRole("Admin") ||
                                      httpContext.User.IsInRole("HeadOfficeAdmin");

                        var result = await pendingOrdersService.UpdatePendingOrderAsync(
                            id,
                            updateDto,
                            userId,
                            isManager
                        );

                        if (!result.Success)
                        {
                            return Results.BadRequest(result);
                        }

                        return Results.Ok(result);
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                message = "Failed to update pending order",
                                errors = new[] { ex.Message }
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("UpdatePendingOrder")
            .WithOpenApi(operation =>
            {
                operation.Summary = "Update pending order";
                operation.Description = "Updates a pending order. Users can only update their own orders unless they are managers.";
                return operation;
            });

        // DELETE /api/v1/pending-orders/{id} - Delete pending order
        pendingOrdersGroup
            .MapDelete(
                "{id:guid}",
                async (
                    Guid id,
                    HttpContext httpContext,
                    IPendingOrdersService pendingOrdersService
                ) =>
                {
                    try
                    {
                        // Get current user ID
                        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                        if (string.IsNullOrEmpty(userId))
                        {
                            return Results.Unauthorized();
                        }

                        // Check if user is manager
                        var isManager = httpContext.User.IsInRole("Manager") ||
                                      httpContext.User.IsInRole("Admin") ||
                                      httpContext.User.IsInRole("HeadOfficeAdmin");

                        var result = await pendingOrdersService.DeletePendingOrderAsync(
                            id,
                            userId,
                            isManager
                        );

                        if (!result.Success)
                        {
                            return Results.BadRequest(result);
                        }

                        return Results.Ok(result);
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                message = "Failed to delete pending order",
                                errors = new[] { ex.Message }
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("DeletePendingOrder")
            .WithOpenApi(operation =>
            {
                operation.Summary = "Delete pending order";
                operation.Description = "Deletes a pending order. Users can only delete their own orders unless they are managers.";
                return operation;
            });

        // POST /api/v1/pending-orders/{id}/retrieve - Retrieve pending order
        pendingOrdersGroup
            .MapPost(
                "{id:guid}/retrieve",
                async (
                    Guid id,
                    HttpContext httpContext,
                    IPendingOrdersService pendingOrdersService
                ) =>
                {
                    try
                    {
                        // Get current user ID
                        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                        if (string.IsNullOrEmpty(userId))
                        {
                            return Results.Unauthorized();
                        }

                        // Check if user is manager
                        var isManager = httpContext.User.IsInRole("Manager") ||
                                      httpContext.User.IsInRole("Admin") ||
                                      httpContext.User.IsInRole("HeadOfficeAdmin");

                        var result = await pendingOrdersService.RetrievePendingOrderAsync(
                            id,
                            userId,
                            isManager
                        );

                        if (!result.Success)
                        {
                            return Results.BadRequest(result);
                        }

                        return Results.Ok(result);
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                message = "Failed to retrieve pending order",
                                errors = new[] { ex.Message }
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("RetrievePendingOrder")
            .WithOpenApi(operation =>
            {
                operation.Summary = "Retrieve pending order";
                operation.Description = "Marks a pending order as retrieved and returns it for processing. Updates status to Retrieved.";
                return operation;
            });

        // POST /api/v1/pending-orders/{id}/convert-to-sale - Convert pending order to sale
        pendingOrdersGroup
            .MapPost(
                "{id:guid}/convert-to-sale",
                async (
                    Guid id,
                    HttpContext httpContext,
                    IPendingOrdersService pendingOrdersService
                ) =>
                {
                    try
                    {
                        // Get current user ID
                        var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                        if (string.IsNullOrEmpty(userId))
                        {
                            return Results.Unauthorized();
                        }

                        var result = await pendingOrdersService.ConvertToSaleAsync(id, userId);

                        if (!result.Success)
                        {
                            return Results.BadRequest(result);
                        }

                        return Results.Ok(result);
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                message = "Failed to convert pending order to sale",
                                errors = new[] { ex.Message }
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("ConvertPendingOrderToSale")
            .WithOpenApi(operation =>
            {
                operation.Summary = "Convert pending order to sale";
                operation.Description = "Converts a pending order to a completed sale and removes the pending order.";
                return operation;
            });

        // GET /api/v1/pending-orders/stats - Get pending orders statistics
        pendingOrdersGroup
            .MapGet(
                "stats",
                async (
                    HttpContext httpContext,
                    IPendingOrdersService pendingOrdersService
                ) =>
                {
                    try
                    {
                        // Check if user is manager
                        var isManager = httpContext.User.IsInRole("Manager") ||
                                      httpContext.User.IsInRole("Admin") ||
                                      httpContext.User.IsInRole("HeadOfficeAdmin");

                        if (!isManager)
                        {
                            return Results.Forbid();
                        }

                        var result = await pendingOrdersService.GetPendingOrderStatsAsync();

                        if (!result.Success)
                        {
                            return Results.BadRequest(result);
                        }

                        return Results.Ok(result);
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                message = "Failed to retrieve pending orders statistics",
                                errors = new[] { ex.Message }
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("GetPendingOrdersStats")
            .WithOpenApi(operation =>
            {
                operation.Summary = "Get pending orders statistics";
                operation.Description = "Retrieves statistics about pending orders. Manager role required.";
                return operation;
            });

        return app;
    }
}
