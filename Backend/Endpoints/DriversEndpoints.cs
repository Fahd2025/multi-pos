using Backend.Models.DTOs.Branch.Drivers;
using Backend.Services.Branch.Drivers;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Endpoints;

public static class DriversEndpoints
{
    public static IEndpointRouteBuilder MapDriversEndpoints(this IEndpointRouteBuilder app)
    {
        var driversGroup = app.MapGroup("/api/v1/drivers").WithTags("Drivers");

        // POST /api/v1/drivers - Create a new driver
        driversGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreateDriverDto createDriverDto,
                    HttpContext httpContext,
                    IDriverService driverService
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

                        var driver = await driverService.CreateDriverAsync(createDriverDto, userId.Value, branch.Code);

                        return Results.Created($"/api/v1/drivers/{driver.Id}", new
                        {
                            success = true,
                            data = driver,
                            message = "Driver created successfully",
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
            .WithName("CreateDriver")
            .WithOpenApi();

        // GET /api/v1/drivers - List all drivers with filtering
        driversGroup
            .MapGet(
                "",
                async (
                    HttpContext httpContext,
                    IDriverService driverService,
                    int page = 1,
                    int pageSize = 20,
                    bool? isActive = null,
                    bool? isAvailable = null,
                    string? search = null
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

                        var drivers = await driverService.GetAllDriversAsync(branch.Code, isActive, isAvailable);

                        // Apply search filter if provided
                        if (!string.IsNullOrEmpty(search))
                        {
                            var searchLower = search.ToLower();
                            drivers = drivers.Where(d => 
                                d.NameEn.ToLower().Contains(searchLower) ||
                                d.NameAr?.ToLower().Contains(searchLower) == true ||
                                d.Code.ToLower().Contains(searchLower) ||
                                d.Phone.ToLower().Contains(searchLower) ||
                                d.Email?.ToLower().Contains(searchLower) == true
                            );
                        }

                        var driversList = drivers.ToList();
                        var totalCount = driversList.Count;

                        // Apply pagination
                        var pagedDrivers = driversList
                            .Skip((page - 1) * pageSize)
                            .Take(pageSize)
                            .ToList();

                        return Results.Ok(new
                        {
                            success = true,
                            data = pagedDrivers,
                            pagination = new
                            {
                                page,
                                pageSize,
                                totalItems = totalCount,
                                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                            },
                        });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("GetAllDrivers")
            .WithOpenApi();

        // GET /api/v1/drivers/:id - Get driver by ID
        driversGroup
            .MapGet(
                "/{id:guid}",
                async (Guid id, HttpContext httpContext, IDriverService driverService) =>
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

                        var driver = await driverService.GetDriverByIdAsync(id, branch.Code);

                        if (driver == null)
                        {
                            return Results.NotFound(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "DRIVER_NOT_FOUND",
                                    message = $"Driver with ID '{id}' does not exist",
                                },
                            });
                        }

                        return Results.Ok(new { success = true, data = driver });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("GetDriverById")
            .WithOpenApi();

        // PUT /api/v1/drivers/:id - Update driver
        driversGroup
            .MapPut(
                "/{id:guid}",
                async (
                    Guid id,
                    [FromBody] UpdateDriverDto updateDriverDto,
                    HttpContext httpContext,
                    IDriverService driverService
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

                        var driver = await driverService.UpdateDriverAsync(id, updateDriverDto, branch.Code);

                        if (driver == null)
                        {
                            return Results.NotFound(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "DRIVER_NOT_FOUND",
                                    message = $"Driver with ID '{id}' does not exist",
                                },
                            });
                        }

                        return Results.Ok(new
                        {
                            success = true,
                            data = driver,
                            message = "Driver updated successfully",
                        });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("UpdateDriver")
            .WithOpenApi();

        // DELETE /api/v1/drivers/:id - Soft delete driver (set IsActive to false)
        driversGroup
            .MapDelete(
                "/{id:guid}",
                async (Guid id, HttpContext httpContext, IDriverService driverService) =>
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

                        var result = await driverService.DeleteDriverAsync(id, branch.Code);

                        if (!result)
                        {
                            return Results.NotFound(new
                            {
                                success = false,
                                error = new
                                {
                                    code = "DRIVER_NOT_FOUND",
                                    message = $"Driver with ID '{id}' does not exist",
                                },
                            });
                        }

                        return Results.Ok(new
                        {
                            success = true,
                            message = "Driver deactivated successfully",
                        });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("DeactivateDriver")
            .WithOpenApi();

        // PUT /api/v1/drivers/:id/availability - Update driver availability
        driversGroup
            .MapPut(
                "/{id:guid}/availability",
                async (
                    Guid id,
                    [FromBody] UpdateAvailabilityRequest request,
                    HttpContext httpContext,
                    IDriverService driverService
                ) =>
                {
                    try
                    {
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new { code = "BRANCH_NOT_FOUND", message = "Branch context not found" }
                            });
                        }

                        var driver = await driverService.UpdateDriverAvailabilityAsync(id, request.IsAvailable, branch.Code);

                        return Results.Ok(new
                        {
                            success = true,
                            data = driver,
                            message = $"Driver availability updated to {(request.IsAvailable ? "available" : "unavailable")}"
                        });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.NotFound(new
                        {
                            success = false,
                            error = new { code = "DRIVER_NOT_FOUND", message = ex.Message }
                        });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("UpdateDriverAvailability")
            .WithOpenApi();

        // GET /api/v1/drivers/available - Get available drivers
        driversGroup
            .MapGet(
                "/available",
                async (HttpContext httpContext, IDriverService driverService) =>
                {
                    try
                    {
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new { code = "BRANCH_NOT_FOUND", message = "Branch context not found" }
                            });
                        }

                        var drivers = await driverService.GetAvailableDriversAsync(branch.Code);

                        return Results.Ok(new { success = true, data = drivers });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("GetAvailableDrivers")
            .WithOpenApi();

        // POST /api/v1/drivers/performance - Record delivery performance
        driversGroup
            .MapPost(
                "/performance",
                async (
                    [FromBody] RecordPerformanceDto dto,
                    HttpContext httpContext,
                    IDriverService driverService
                ) =>
                {
                    try
                    {
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new { code = "BRANCH_NOT_FOUND", message = "Branch context not found" }
                            });
                        }

                        var performance = await driverService.RecordDeliveryPerformanceAsync(dto, branch.Code);

                        return Results.Created($"/api/v1/drivers/performance/{performance.Id}", new
                        {
                            success = true,
                            data = performance,
                            message = "Performance recorded successfully"
                        });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(new
                        {
                            success = false,
                            error = new { code = "INVALID_OPERATION", message = ex.Message }
                        });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("RecordDriverPerformance")
            .WithOpenApi();

        // GET /api/v1/drivers/:id/stats - Get driver statistics
        driversGroup
            .MapGet(
                "/{id:guid}/stats",
                async (
                    Guid id,
                    HttpContext httpContext,
                    IDriverService driverService,
                    DateTime? from = null,
                    DateTime? to = null
                ) =>
                {
                    try
                    {
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new { code = "BRANCH_NOT_FOUND", message = "Branch context not found" }
                            });
                        }

                        var stats = await driverService.GetDriverStatsAsync(id, from, to, branch.Code);

                        return Results.Ok(new { success = true, data = stats });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.NotFound(new
                        {
                            success = false,
                            error = new { code = "DRIVER_NOT_FOUND", message = ex.Message }
                        });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("GetDriverStats")
            .WithOpenApi();

        // GET /api/v1/drivers/:id/performance - Get driver performance history
        driversGroup
            .MapGet(
                "/{id:guid}/performance",
                async (
                    Guid id,
                    HttpContext httpContext,
                    IDriverService driverService,
                    int page = 1,
                    int pageSize = 20
                ) =>
                {
                    try
                    {
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new { code = "BRANCH_NOT_FOUND", message = "Branch context not found" }
                            });
                        }

                        var performances = await driverService.GetDriverPerformanceHistoryAsync(id, page, pageSize, branch.Code);

                        return Results.Ok(new { success = true, data = performances });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.NotFound(new
                        {
                            success = false,
                            error = new { code = "DRIVER_NOT_FOUND", message = ex.Message }
                        });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("GetDriverPerformanceHistory")
            .WithOpenApi();

        // GET /api/v1/drivers/:id/active-count - Get active deliveries count
        driversGroup
            .MapGet(
                "/{id:guid}/active-count",
                async (Guid id, HttpContext httpContext, IDriverService driverService) =>
                {
                    try
                    {
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new { code = "BRANCH_NOT_FOUND", message = "Branch context not found" }
                            });
                        }

                        var count = await driverService.GetDriverActiveDeliveriesCountAsync(id, branch.Code);

                        return Results.Ok(new { success = true, data = count });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(new { success = false, error = new { code = "ERROR", message = ex.Message } });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("GetDriverActiveDeliveriesCount")
            .WithOpenApi();

        return app;
    }
}

// Request DTOs for endpoints
public record UpdateAvailabilityRequest(bool IsAvailable);