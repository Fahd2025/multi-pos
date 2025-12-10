using Backend.Data.Branch;
using Backend.Data.HeadOffice;
using Backend.Data.Shared;
using Backend.Models.DTOs.Branch.Users;
using Backend.Services.Branch.Users;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Endpoints;

/// <summary>
/// API Endpoints for managing branch-specific users
/// Head office admins can access any branch's users by providing branchId
/// Branch users access their own branch's users via JWT context
/// </summary>
public static class UserEndpoints
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var branchUserGroup = app.MapGroup("/api/v1/branch/users")
            .WithTags("Branch Users")
            .RequireAuthorization();

        // GET /api/v1/branch/users - Get all branch users
        branchUserGroup
            .MapGet(
                "",
                async (
                    [FromQuery] bool includeInactive,
                    [FromQuery] Guid? branchId,
                    HttpContext httpContext,
                    HeadOfficeDbContext headOfficeDb,
                    DbContextFactory dbContextFactory,
                    IServiceProvider serviceProvider
                ) =>
                {
                    try
                    {
                        var (service, branch) = await GetUserServiceAsync(branchId, httpContext, headOfficeDb, dbContextFactory, serviceProvider);
                        if (service == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new { code = "NO_BRANCH_CONTEXT", message = "Branch ID required for head office admins" }
                            });
                        }

                        var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;
                        var role = httpContext.Items["Role"] as string;
                        var canViewInactive = role == "Manager" || isHeadOfficeAdmin;

                        if (includeInactive && !canViewInactive)
                        {
                            return Results.Forbid();
                        }

                        var users = await service.GetUsersAsync(includeInactive);
                        return Results.Ok(new { success = true, data = users });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                error = new { code = "ERROR", message = ex.Message }
                            }
                        );
                    }
                }
            )
            .WithName("GetUsers")
            .WithOpenApi();

        // GET /api/v1/branch/users/:id - Get branch user by ID
        branchUserGroup
            .MapGet(
                "/{id:guid}",
                async (
                    Guid id,
                    [FromQuery] Guid? branchId,
                    HttpContext httpContext,
                    HeadOfficeDbContext headOfficeDb,
                    DbContextFactory dbContextFactory,
                    IServiceProvider serviceProvider
                ) =>
                {
                    try
                    {
                        var (service, branch) = await GetUserServiceAsync(branchId, httpContext, headOfficeDb, dbContextFactory, serviceProvider);
                        if (service == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new { code = "NO_BRANCH_CONTEXT", message = "Branch ID required for head office admins" }
                            });
                        }

                        var user = await service.GetUserByIdAsync(id);
                        if (user == null)
                        {
                            return Results.NotFound(
                                new
                                {
                                    success = false,
                                    error = new { code = "NOT_FOUND", message = $"User with ID {id} not found" }
                                }
                            );
                        }

                        return Results.Ok(new { success = true, data = user });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .WithName("GetUserById")
            .WithOpenApi();

        // POST /api/v1/branch/users - Create new branch user (Manager only)
        branchUserGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreateUserDto dto,
                    [FromQuery] Guid? branchId,
                    HttpContext httpContext,
                    HeadOfficeDbContext headOfficeDb,
                    DbContextFactory dbContextFactory,
                    IServiceProvider serviceProvider
                ) =>
                {
                    try
                    {
                        // Only managers and head office admins can create users
                        var role = httpContext.Items["Role"] as string;
                        var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;

                        if (role != "Manager" && !isHeadOfficeAdmin)
                        {
                            return Results.Forbid();
                        }

                        var (service, branch) = await GetUserServiceAsync(branchId, httpContext, headOfficeDb, dbContextFactory, serviceProvider);
                        if (service == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new { code = "NO_BRANCH_CONTEXT", message = "Branch ID required for head office admins" }
                            });
                        }

                        // Get the ID of the user creating this user
                        var createdBy = httpContext.Items["UserId"] as Guid? ?? Guid.Empty;

                        var user = await service.CreateUserAsync(dto, createdBy);
                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = user,
                                message = "Branch user created successfully"
                            }
                        );
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                error = new { code = "VALIDATION_ERROR", message = ex.Message }
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
            .WithName("CreateUser")
            .WithOpenApi();

        // PUT /api/v1/branch/users/:id - Update branch user (Manager only)
        branchUserGroup
            .MapPut(
                "/{id:guid}",
                async (
                    Guid id,
                    [FromBody] UpdateUserDto dto,
                    [FromQuery] Guid? branchId,
                    HttpContext httpContext,
                    HeadOfficeDbContext headOfficeDb,
                    DbContextFactory dbContextFactory,
                    IServiceProvider serviceProvider
                ) =>
                {
                    try
                    {
                        // Only managers and head office admins can update users
                        var role = httpContext.Items["Role"] as string;
                        var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;

                        if (role != "Manager" && !isHeadOfficeAdmin)
                        {
                            return Results.Forbid();
                        }

                        var (service, branch) = await GetUserServiceAsync(branchId, httpContext, headOfficeDb, dbContextFactory, serviceProvider);
                        if (service == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new { code = "NO_BRANCH_CONTEXT", message = "Branch ID required for head office admins" }
                            });
                        }

                        var user = await service.UpdateUserAsync(id, dto);
                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = user,
                                message = "Branch user updated successfully"
                            }
                        );
                    }
                    catch (KeyNotFoundException ex)
                    {
                        return Results.NotFound(
                            new
                            {
                                success = false,
                                error = new { code = "NOT_FOUND", message = ex.Message }
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
            .WithName("UpdateUser")
            .WithOpenApi();

        // DELETE /api/v1/branch/users/:id - Delete branch user (Manager only)
        branchUserGroup
            .MapDelete(
                "/{id:guid}",
                async (
                    Guid id,
                    [FromQuery] Guid? branchId,
                    HttpContext httpContext,
                    HeadOfficeDbContext headOfficeDb,
                    DbContextFactory dbContextFactory,
                    IServiceProvider serviceProvider
                ) =>
                {
                    try
                    {
                        // Only managers and head office admins can delete users
                        var role = httpContext.Items["Role"] as string;
                        var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;

                        if (role != "Manager" && !isHeadOfficeAdmin)
                        {
                            return Results.Forbid();
                        }

                        var (service, branch) = await GetUserServiceAsync(branchId, httpContext, headOfficeDb, dbContextFactory, serviceProvider);
                        if (service == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new { code = "NO_BRANCH_CONTEXT", message = "Branch ID required for head office admins" }
                            });
                        }

                        await service.DeleteUserAsync(id);
                        return Results.Ok(
                            new
                            {
                                success = true,
                                message = "Branch user deleted successfully"
                            }
                        );
                    }
                    catch (KeyNotFoundException ex)
                    {
                        return Results.NotFound(
                            new
                            {
                                success = false,
                                error = new { code = "NOT_FOUND", message = ex.Message }
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
            .WithName("DeleteUser")
            .WithOpenApi();

        // POST /api/v1/branch/users/check-username - Check if username is available
        branchUserGroup
            .MapPost(
                "/check-username",
                async (
                    [FromBody] CheckUsernameRequest request,
                    [FromQuery] Guid? branchId,
                    HttpContext httpContext,
                    HeadOfficeDbContext headOfficeDb,
                    DbContextFactory dbContextFactory,
                    IServiceProvider serviceProvider
                ) =>
                {
                    try
                    {
                        // Only managers and head office admins can check usernames
                        var role = httpContext.Items["Role"] as string;
                        var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;

                        if (role != "Manager" && !isHeadOfficeAdmin)
                        {
                            return Results.Forbid();
                        }

                        var (service, branch) = await GetUserServiceAsync(branchId, httpContext, headOfficeDb, dbContextFactory, serviceProvider);
                        if (service == null)
                        {
                            return Results.BadRequest(new
                            {
                                success = false,
                                error = new { code = "NO_BRANCH_CONTEXT", message = "Branch ID required for head office admins" }
                            });
                        }

                        var isAvailable = await service.IsUsernameAvailableAsync(
                            request.Username,
                            request.ExcludeUserId
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = new { isAvailable }
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
            .WithName("CheckUsername")
            .WithOpenApi();
    }

    /// <summary>
    /// Helper method to get UserService with appropriate context
    /// </summary>
    private static async Task<(UserService?, Backend.Models.Entities.HeadOffice.Branch?)> GetUserServiceAsync(
        Guid? branchId,
        HttpContext httpContext,
        HeadOfficeDbContext headOfficeDb,
        DbContextFactory dbContextFactory,
        IServiceProvider serviceProvider
    )
    {
        var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;
        var contextBranchId = httpContext.Items["BranchId"] as Guid?;

        // Determine which branch to query
        Guid targetBranchId;
        if (branchId.HasValue && isHeadOfficeAdmin)
        {
            // Head office admin accessing a specific branch
            targetBranchId = branchId.Value;
        }
        else if (contextBranchId.HasValue)
        {
            // Branch user accessing their own branch
            targetBranchId = contextBranchId.Value;
        }
        else
        {
            return (null, null);
        }

        // Get branch and create context
        var branch = await headOfficeDb.Branches.FindAsync(targetBranchId);
        if (branch == null)
        {
            return (null, null);
        }

        // Ensure branch database schema is up to date
        using (var scope = serviceProvider.CreateScope())
        {
            var migrationManager = scope.ServiceProvider.GetRequiredService<Backend.Services.Shared.Migrations.IBranchMigrationManager>();
            await migrationManager.ApplyMigrationsAsync(branch.Id);
        }

        var branchContext = dbContextFactory.CreateBranchContext(branch);
        var branchUserService = new UserService(branchContext);

        return (branchUserService, branch);
    }
}

/// <summary>
/// Request model for checking username availability
/// </summary>
public record CheckUsernameRequest(string Username, Guid? ExcludeUserId);
