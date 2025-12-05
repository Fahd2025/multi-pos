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

        // GET /api/v1/branches/lookup - Get active branches for login dropdown (public endpoint)
        branchGroup
            .MapGet(
                "/lookup",
                async (IBranchService branchService) =>
                {
                    try
                    {
                        var branches = await branchService.GetBranchLookupAsync();

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = branches,
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
            .AllowAnonymous()
            .WithName("GetBranchLookup")
            .WithOpenApi();

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
                        // Check if user is head office admin or branch manager of this branch
                        var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;
                        var branchId = httpContext.Items["BranchId"] as Guid?;
                        var role = httpContext.Items["Role"] as string;

                        if (!isHeadOfficeAdmin && (branchId != id || role != "Manager"))
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
                    [FromBody] UpdateBranchSettingsDto dto,
                    IBranchService branchService,
                    HttpContext httpContext
                ) =>
                {
                    try
                    {
                        // Check if user is head office admin or branch manager
                        var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;
                        var branchId = httpContext.Items["BranchId"] as Guid?;
                        var role = httpContext.Items["Role"] as string;

                        if (!isHeadOfficeAdmin && (branchId != id || role != "Manager"))
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

        // POST /api/v1/branches/:id/logo - Upload branch logo
        branchGroup
            .MapPost(
                "/{id:guid}/logo",
                async (
                    Guid id,
                    HttpContext httpContext,
                    IBranchService branchService
                ) =>
                {
                    try
                    {
                        // Check if user is head office admin or branch manager
                        var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;
                        var branchId = httpContext.Items["BranchId"] as Guid?;
                        var role = httpContext.Items["Role"] as string;

                        if (!isHeadOfficeAdmin && (branchId != id || role != "Manager"))
                        {
                            return Results.Forbid();
                        }

                        var file = httpContext.Request.Form.Files.FirstOrDefault();
                        if (file == null || file.Length == 0)
                        {
                            return Results.BadRequest(
                                new { success = false, error = new { code = "NO_FILE", message = "No file uploaded" } }
                            );
                        }

                        // Validate file type
                        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".svg" };
                        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                        if (!allowedExtensions.Contains(fileExtension))
                        {
                            return Results.BadRequest(
                                new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "INVALID_FILE_TYPE",
                                        message = "Only image files are allowed (jpg, jpeg, png, gif, svg)"
                                    }
                                }
                            );
                        }

                        // Validate file size (max 5MB)
                        if (file.Length > 5 * 1024 * 1024)
                        {
                            return Results.BadRequest(
                                new
                                {
                                    success = false,
                                    error = new { code = "FILE_TOO_LARGE", message = "File size must not exceed 5MB" }
                                }
                            );
                        }

                        using var stream = file.OpenReadStream();
                        var logoUrl = await branchService.UploadBranchLogoAsync(id, stream, file.FileName);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = new { logoPath = logoUrl, logoUrl },
                                message = "Logo uploaded successfully"
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
            .DisableAntiforgery()
            .WithName("UploadBranchLogo")
            .WithOpenApi();

        // GET /api/v1/branches/:id/logo - Get branch logo
        branchGroup
            .MapGet(
                "/{id:guid}/logo",
                async (Guid id, IBranchService branchService) =>
                {
                    try
                    {
                        var settings = await branchService.GetBranchSettingsAsync(id);
                        if (settings == null || string.IsNullOrEmpty(settings.LogoPath))
                        {
                            return Results.NotFound(
                                new
                                {
                                    success = false,
                                    error = new { code = "NOT_FOUND", message = "Logo not found" },
                                }
                            );
                        }

                        if (!File.Exists(settings.LogoPath))
                        {
                            return Results.NotFound(
                                new
                                {
                                    success = false,
                                    error = new { code = "FILE_NOT_FOUND", message = "Logo file not found" },
                                }
                            );
                        }

                        var fileExtension = Path.GetExtension(settings.LogoPath).ToLowerInvariant();
                        var contentType = fileExtension switch
                        {
                            ".jpg" or ".jpeg" => "image/jpeg",
                            ".png" => "image/png",
                            ".gif" => "image/gif",
                            ".svg" => "image/svg+xml",
                            _ => "application/octet-stream"
                        };

                        return Results.File(settings.LogoPath, contentType);
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .AllowAnonymous()
            .WithName("GetBranchLogo")
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

        // POST /api/v1/branches/:id/fix-logo-path - Fix legacy logo path format
        branchGroup
            .MapPost(
                "/{id:guid}/fix-logo-path",
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
                                    error = new { code = "NOT_FOUND", message = $"Branch with ID {id} not found" },
                                }
                            );
                        }

                        // Check if logoPath is in old format (just a GUID or file path)
                        if (!string.IsNullOrEmpty(branch.LogoPath) && !branch.LogoPath.StartsWith("/api/v1/"))
                        {
                            // Convert to new format
                            var newLogoPath = $"/api/v1/images/{branch.Code}/branches/{id}/thumb";
                            var updateDto = new UpdateBranchDto { LogoPath = newLogoPath };
                            await branchService.UpdateBranchAsync(id, updateDto);

                            return Results.Ok(
                                new
                                {
                                    success = true,
                                    message = "Logo path updated to new format",
                                    data = new { oldPath = branch.LogoPath, newPath = newLogoPath },
                                }
                            );
                        }
                        else if (string.IsNullOrEmpty(branch.LogoPath))
                        {
                            return Results.Ok(new { success = true, message = "Branch has no logo" });
                        }
                        else
                        {
                            return Results.Ok(
                                new { success = true, message = "Logo path is already in correct format" }
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
            .WithName("FixBranchLogoPath")
            .WithOpenApi();

        return app;
    }
}
