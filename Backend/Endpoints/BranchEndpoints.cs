using Backend.Models.DTOs.HeadOffice.Branches;
using Backend.Services.HeadOffice.Branches;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Endpoints;

/// <summary>
/// Branch management endpoints (Head Office Admin only)
/// </summary>
public static class BranchEndpoints
{
    /// <summary>
    /// Maps branch endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapBranchEndpoints(this IEndpointRouteBuilder app)
    {
        var branchGroup = app.MapGroup("/api/v1/branches").WithTags("Branches");

        // GET /api/v1/branches - Get all branches with filtering and pagination
        branchGroup
            .MapGet(
                "",
                async (
                    IBranchService branchService,
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
        branchGroup
            .MapGet(
                "/{id:guid}",
                async (
                    Guid id,
                    IBranchService branchService,
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

                        var branch = await branchService.GetBranchByIdAsync(id);

                        if (branch == null)
                        {
                            return Results.NotFound(
                                new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "NOT_FOUND",
                                        message = $"Branch with ID {id} not found",
                                    },
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
        branchGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreateBranchDto dto,
                    IBranchService branchService,
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
        branchGroup
            .MapPut(
                "/{id:guid}",
                async (
                    Guid id,
                    [FromBody] UpdateBranchDto dto,
                    IBranchService branchService,
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
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("UpdateBranch")
            .WithOpenApi();

        // DELETE /api/v1/branches/:id - Delete (soft delete) a branch
        branchGroup
            .MapDelete(
                "/{id:guid}",
                async (
                    Guid id,
                    IBranchService branchService,
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

                        var success = await branchService.DeleteBranchAsync(id);

                        if (!success)
                        {
                            return Results.NotFound(
                                new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "NOT_FOUND",
                                        message = $"Branch with ID {id} not found",
                                    },
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
        branchGroup
            .MapGet(
                "/{id:guid}/settings",
                async (
                    Guid id,
                    IBranchService branchService,
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

                        var settings = await branchService.GetBranchSettingsAsync(id);

                        if (settings == null)
                        {
                            return Results.NotFound(
                                new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "NOT_FOUND",
                                        message = $"Branch with ID {id} not found",
                                    },
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
        branchGroup
            .MapPut(
                "/{id:guid}/settings",
                async (
                    Guid id,
                    [FromBody] BranchSettingsDto dto,
                    IBranchService branchService,
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
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("UpdateBranchSettings")
            .WithOpenApi();

        // POST /api/v1/branches/:id/test-connection - Test branch database connection
        branchGroup
            .MapPost(
                "/{id:guid}/test-connection",
                async (
                    Guid id,
                    IBranchService branchService,
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

        return app;
    }
}
