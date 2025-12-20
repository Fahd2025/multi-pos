using Backend.Models.DTOs.Branch.DeliveryOrders;
using Backend.Models.Entities.Branch;
using Backend.Services.Branch.DeliveryOrders;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace Backend.Endpoints;

public static class DeliveryOrdersEndpoints
{
    public static IEndpointRouteBuilder MapDeliveryOrdersEndpoints(this IEndpointRouteBuilder app)
    {
        var deliveryOrdersGroup = app.MapGroup("/api/v1/delivery-orders").WithTags("Delivery Orders");

        // POST /api/v1/delivery-orders - Create a new delivery order
        deliveryOrdersGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreateDeliveryOrderDto createDeliveryOrderDto,
                    HttpContext httpContext,
                    IDeliveryOrderService deliveryOrderService
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
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "BRANCH_NOT_FOUND",
                                    message = "Branch context not found",
                                },
                            });
                        }

                        var deliveryOrder = await deliveryOrderService.CreateDeliveryOrderAsync(
                            createDeliveryOrderDto, 
                            userId.Value, 
                            branch.Code
                        );

                        return Results.Created($"/api/v1/delivery-orders/{deliveryOrder.Id}", new
                        {
                            success = true,
                            data = deliveryOrder,
                            message = "Delivery order created successfully",
                        });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new
                        {
                            success = false,
                            error = new { code = "INVALID_OPERATION", message = ex.Message },
                        });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new
                        {
                            success = false,
                            error = new { code = "ERROR", message = ex.Message },
                        });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("CreateDeliveryOrder")
            .WithOpenApi();

        // GET /api/v1/delivery-orders - List delivery orders with filtering
        deliveryOrdersGroup
            .MapGet(
                "",
                async (
                    HttpContext httpContext,
                    IDeliveryOrderService deliveryOrderService,
                    int page = 1,
                    int pageSize = 20,
                    int? status = null,
                    Guid? driverId = null,
                    Guid? orderId = null,
                    string? search = null,
                    DateTime? dateFrom = null,
                    DateTime? dateTo = null
                ) =>
                {
                    try
                    {
                        // Get branch from context
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "BRANCH_NOT_FOUND",
                                    message = "Branch context not found",
                                },
                            });
                        }

                        var statusEnum = status.HasValue ? (DeliveryStatus?)status.Value : null;
                        
                        var deliveryOrders = await deliveryOrderService.GetAllDeliveryOrdersAsync(
                            branch.Code, 
                            statusEnum, 
                            driverId, 
                            orderId, 
                            page,
                            pageSize
                        );

                        // Apply search filter if provided
                        if (!string.IsNullOrEmpty(search))
                        {
                            var searchLower = search.ToLower();
                            deliveryOrders = deliveryOrders.Where(d =>
                                d.OrderTransactionId.ToLower().Contains(searchLower) ||
                                (!string.IsNullOrEmpty(d.CustomerName) && d.CustomerName.ToLower().Contains(searchLower)) ||
                                (!string.IsNullOrEmpty(d.DriverName) && d.DriverName.ToLower().Contains(searchLower)) ||
                                d.DeliveryAddress.ToLower().Contains(searchLower)
                            );
                        }

                        // Apply date filters if provided
                        if (dateFrom.HasValue)
                        {
                            deliveryOrders = deliveryOrders.Where(d => d.CreatedAt >= dateFrom.Value);
                        }

                        if (dateTo.HasValue)
                        {
                            deliveryOrders = deliveryOrders.Where(d => d.CreatedAt <= dateTo.Value);
                        }

                        var deliveryOrdersList = deliveryOrders.ToList();
                        var totalCount = deliveryOrdersList.Count;

                        // Apply pagination if needed
                        var pagedDeliveryOrders = deliveryOrdersList
                            .Skip((page - 1) * pageSize)
                            .Take(pageSize)
                            .ToList();

                        var result = new
                        {
                            success = true,
                            data = pagedDeliveryOrders,
                            pagination = new
                            {
                                page,
                                pageSize,
                                totalItems = totalCount,
                                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                            },
                        };

                        return Results.Ok(result);
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("GetAllDeliveryOrders")
            .WithOpenApi();

        // GET /api/v1/delivery-orders/:id - Get delivery order by ID
        deliveryOrdersGroup
            .MapGet(
                "/{id:guid}",
                async (Guid id, HttpContext httpContext, IDeliveryOrderService deliveryOrderService) =>
                {
                    try
                    {
                        // Get branch from context
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "BRANCH_NOT_FOUND",
                                    message = "Branch context not found",
                                },
                            });
                        }

                        var deliveryOrder = await deliveryOrderService.GetDeliveryOrderByIdAsync(id, branch.Code);

                        if (deliveryOrder == null)
                        {
                            return Results.NotFound(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "DELIVERY_ORDER_NOT_FOUND",
                                    message = $"Delivery order with ID '{id}' does not exist",
                                },
                            });
                        }

                        return Results.Ok(new { success = true, data = deliveryOrder });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("GetDeliveryOrderById")
            .WithOpenApi();

        // PUT /api/v1/delivery-orders/:id - Update delivery order
        deliveryOrdersGroup
            .MapPut(
                "/{id:guid}",
                async (
                    Guid id,
                    [FromBody] UpdateDeliveryOrderDto updateDeliveryOrderDto,
                    HttpContext httpContext,
                    IDeliveryOrderService deliveryOrderService
                ) =>
                {
                    try
                    {
                        // Get branch from context
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "BRANCH_NOT_FOUND",
                                    message = "Branch context not found",
                                },
                            });
                        }

                        var deliveryOrder = await deliveryOrderService.UpdateDeliveryOrderAsync(id, updateDeliveryOrderDto, branch.Code);

                        if (deliveryOrder == null)
                        {
                            return Results.NotFound(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "DELIVERY_ORDER_NOT_FOUND",
                                    message = $"Delivery order with ID '{id}' does not exist",
                                },
                            });
                        }

                        return Results.Ok(new
                        {
                            success = true,
                            data = deliveryOrder,
                            message = "Delivery order updated successfully",
                        });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("UpdateDeliveryOrder")
            .WithOpenApi();

        // DELETE /api/v1/delivery-orders/:id - Delete delivery order
        deliveryOrdersGroup
            .MapDelete(
                "/{id:guid}",
                async (Guid id, HttpContext httpContext, IDeliveryOrderService deliveryOrderService) =>
                {
                    try
                    {
                        // Get branch from context
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "BRANCH_NOT_FOUND",
                                    message = "Branch context not found",
                                },
                            });
                        }

                        var result = await deliveryOrderService.DeleteDeliveryOrderAsync(id, branch.Code);

                        if (!result)
                        {
                            return Results.NotFound(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "DELIVERY_ORDER_NOT_FOUND",
                                    message = $"Delivery order with ID '{id}' does not exist",
                                },
                            });
                        }

                        return Results.Ok(new
                        {
                            success = true,
                            message = "Delivery order deleted successfully",
                        });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("DeleteDeliveryOrder")
            .WithOpenApi();

        // POST /api/v1/delivery-orders/:id/assign-driver - Assign driver to delivery order
        deliveryOrdersGroup
            .MapPost(
                "/{id:guid}/assign-driver",
                async (
                    Guid id,
                    [FromBody] JsonElement body,
                    HttpContext httpContext,
                    IDeliveryOrderService deliveryOrderService
                ) =>
                {
                    try
                    {
                        // Get driver ID from request body
                        if (!body.TryGetProperty("driverId", out var driverIdElement))
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "MISSING_DRIVER_ID",
                                    message = "driverId is required in request body",
                                },
                            });
                        }

                        if (!Guid.TryParse(driverIdElement.GetString(), out Guid driverId))
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "INVALID_DRIVER_ID",
                                    message = "driverId must be a valid GUID",
                                },
                            });
                        }

                        // Get branch from context
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "BRANCH_NOT_FOUND",
                                    message = "Branch context not found",
                                },
                            });
                        }

                        var deliveryOrder = await deliveryOrderService.AssignDriverToDeliveryOrderAsync(id, driverId, branch.Code);

                        if (deliveryOrder == null)
                        {
                            return Results.NotFound(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "DELIVERY_ORDER_NOT_FOUND",
                                    message = $"Delivery order with ID '{id}' does not exist",
                                },
                            });
                        }

                        return Results.Ok(new
                        {
                            success = true,
                            data = deliveryOrder,
                            message = "Driver assigned to delivery order successfully",
                        });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("AssignDriverToDeliveryOrder")
            .WithOpenApi();

        // PUT /api/v1/delivery-orders/:id/status - Update delivery order status
        deliveryOrdersGroup
            .MapPut(
                "/{id:guid}/status",
                async (
                    Guid id,
                    [FromBody] JsonElement body,
                    HttpContext httpContext,
                    IDeliveryOrderService deliveryOrderService
                ) =>
                {
                    try
                    {
                        // Get status from request body
                        if (!body.TryGetProperty("status", out var statusElement))
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "MISSING_STATUS",
                                    message = "status is required in request body",
                                },
                            });
                        }

                        DeliveryStatus newStatus;

                        if (statusElement.ValueKind == JsonValueKind.Number && statusElement.TryGetInt32(out int statusInt))
                        {
                            // Parse from integer value
                            if (!Enum.IsDefined(typeof(DeliveryStatus), statusInt))
                            {
                                return Results.BadRequest(new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "INVALID_STATUS",
                                        message = "status must be a valid DeliveryStatus value",
                                    },
                                });
                            }
                            newStatus = (DeliveryStatus)statusInt;
                        }
                        else if (statusElement.ValueKind == JsonValueKind.String)
                        {
                            // Parse from string value
                            if (!Enum.TryParse<DeliveryStatus>(statusElement.GetString(), true, out newStatus))
                            {
                                return Results.BadRequest(new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "INVALID_STATUS",
                                        message = "status must be a valid DeliveryStatus value",
                                    },
                                });
                            }
                        }
                        else
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "INVALID_STATUS",
                                    message = "status must be a valid DeliveryStatus value (string or number)",
                                },
                            });
                        }

                        // Get branch from context
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "BRANCH_NOT_FOUND",
                                    message = "Branch context not found",
                                },
                            });
                        }

                        var deliveryOrder = await deliveryOrderService.UpdateDeliveryStatusAsync(id, newStatus, branch.Code);

                        if (deliveryOrder == null)
                        {
                            return Results.NotFound(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "DELIVERY_ORDER_NOT_FOUND",
                                    message = $"Delivery order with ID '{id}' does not exist",
                                },
                            });
                        }

                        return Results.Ok(new
                        {
                            success = true,
                            data = deliveryOrder,
                            message = "Delivery order status updated successfully",
                        });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("UpdateDeliveryOrderStatus")
            .WithOpenApi();

        return app;
    }
}