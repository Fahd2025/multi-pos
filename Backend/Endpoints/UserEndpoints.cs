using Backend.Models.DTOs.HeadOffice.Users;
using Backend.Services.HeadOffice.Users;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Endpoints;

/// <summary>
/// User management endpoints
/// </summary>
public static class UserEndpoints
{
    /// <summary>
    /// Maps user management endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var usersGroup = app.MapGroup("/api/v1/users").WithTags("Users");

        // GET /api/v1/users - Get all users with filtering
        usersGroup
            .MapGet(
                "",
                async (
                    HttpContext httpContext,
                    IUserService userService,
                    bool? includeInactive = false,
                    Guid? branchId = null,
                    string? role = null,
                    string? searchTerm = null,
                    int page = 1,
                    int pageSize = 50
                ) =>
                {
                    try
                    {
                        // Check if user is head office admin or branch manager
                        var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;
                        var currentUserId = httpContext.Items["UserId"] as Guid?;

                        if (!isHeadOfficeAdmin && branchId == null)
                        {
                            return Results.Forbid();
                        }

                        Backend.Models.Entities.HeadOffice.UserRole? parsedRole = null;
                        if (!string.IsNullOrWhiteSpace(role))
                        {
                            if (
                                Enum.TryParse<Backend.Models.Entities.HeadOffice.UserRole>(
                                    role,
                                    true,
                                    out var r
                                )
                            )
                            {
                                parsedRole = r;
                            }
                        }

                        var (users, totalCount) = await userService.GetUsersAsync(
                            includeInactive ?? false,
                            branchId,
                            parsedRole,
                            searchTerm,
                            page,
                            pageSize
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = new
                                {
                                    users,
                                    pagination = new
                                    {
                                        page,
                                        pageSize,
                                        totalCount,
                                        totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                                    },
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
            .WithName("GetUsers")
            .WithOpenApi();

        // POST /api/v1/users - Create a new user (admin only)
        usersGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreateUserDto createDto,
                    IUserService userService,
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

                        var currentUserId = httpContext.Items["UserId"] as Guid?;
                        if (!currentUserId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        var user = await userService.CreateUserAsync(createDto, currentUserId.Value);

                        return Results.Ok(new { success = true, data = user });
                    }
                    catch (InvalidOperationException ex)
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
                        return Results.BadRequest(
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("CreateUser")
            .WithOpenApi();

        // PUT /api/v1/users/:id - Update user
        usersGroup
            .MapPut(
                "/{id:guid}",
                async (
                    Guid id,
                    [FromBody] UpdateUserDto updateDto,
                    IUserService userService,
                    HttpContext httpContext
                ) =>
                {
                    try
                    {
                        var currentUserId = httpContext.Items["UserId"] as Guid?;
                        if (!currentUserId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        // Users can update themselves, or admins can update anyone
                        var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;
                        if (!isHeadOfficeAdmin && currentUserId.Value != id)
                        {
                            return Results.Forbid();
                        }

                        var user = await userService.UpdateUserAsync(id, updateDto, currentUserId.Value);

                        return Results.Ok(new { success = true, data = user });
                    }
                    catch (InvalidOperationException ex)
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
            .WithName("UpdateUser")
            .WithOpenApi();

        // DELETE /api/v1/users/:id - Delete user (admin only)
        usersGroup
            .MapDelete(
                "/{id:guid}",
                async (Guid id, IUserService userService, HttpContext httpContext) =>
                {
                    try
                    {
                        // Check if user is head office admin
                        if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
                        {
                            return Results.Forbid();
                        }

                        var currentUserId = httpContext.Items["UserId"] as Guid?;
                        if (!currentUserId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        await userService.DeleteUserAsync(id, currentUserId.Value);

                        return Results.Ok(
                            new { success = true, message = "User deactivated successfully" }
                        );
                    }
                    catch (InvalidOperationException ex)
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
            .WithName("DeleteUser")
            .WithOpenApi();

        // POST /api/v1/users/:id/assign-branch - Assign user to branch
        usersGroup
            .MapPost(
                "/{id:guid}/assign-branch",
                async (
                    Guid id,
                    [FromBody] AssignBranchDto assignDto,
                    IUserService userService,
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

                        var currentUserId = httpContext.Items["UserId"] as Guid?;
                        if (!currentUserId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        await userService.AssignBranchAsync(id, assignDto, currentUserId.Value);

                        return Results.Ok(
                            new { success = true, message = "User assigned to branch successfully" }
                        );
                    }
                    catch (InvalidOperationException ex)
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
                        return Results.BadRequest(
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("AssignUserToBranch")
            .WithOpenApi();

        // DELETE /api/v1/users/:id/branches/:branchId - Remove branch assignment
        usersGroup
            .MapDelete(
                "/{id:guid}/branches/{branchId:guid}",
                async (
                    Guid id,
                    Guid branchId,
                    IUserService userService,
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

                        var currentUserId = httpContext.Items["UserId"] as Guid?;
                        if (!currentUserId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        await userService.RemoveBranchAssignmentAsync(id, branchId, currentUserId.Value);

                        return Results.Ok(
                            new { success = true, message = "Branch assignment removed successfully" }
                        );
                    }
                    catch (InvalidOperationException ex)
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
            .WithName("RemoveBranchAssignment")
            .WithOpenApi();

        // GET /api/v1/users/:id/activity - Get user activity log
        usersGroup
            .MapGet(
                "/{id:guid}/activity",
                async (
                    Guid id,
                    IUserService userService,
                    HttpContext httpContext,
                    int? limit = 100
                ) =>
                {
                    try
                    {
                        var currentUserId = httpContext.Items["UserId"] as Guid?;
                        if (!currentUserId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        // Users can view their own activity, or admins can view anyone's
                        var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;
                        if (!isHeadOfficeAdmin && currentUserId.Value != id)
                        {
                            return Results.Forbid();
                        }

                        var activities = await userService.GetUserActivityAsync(id, limit ?? 100);

                        return Results.Ok(new { success = true, data = activities });
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
            .WithName("GetUserActivity")
            .WithOpenApi();

        return app;
    }
}
