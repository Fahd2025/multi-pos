using Backend.Models.DTOs.Returns;
using Backend.Services.Branch.Returns;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Endpoints;

/// <summary>
/// Return and refund management endpoints
/// </summary>
public static class ReturnEndpoints
{
    /// <summary>
    /// Maps return endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapReturnEndpoints(this IEndpointRouteBuilder app)
    {
        var returnGroup = app.MapGroup("/api/v1/returns").WithTags("Returns");

        // POST /api/v1/returns - Create a new return
        returnGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreateReturnDto dto,
                    HttpContext httpContext,
                    IReturnService returnService
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

                        var returnDto = await returnService.CreateReturnAsync(branch.Id, dto, userId.Value);

                        return Results.Created(
                            $"/api/v1/returns/{returnDto.Id}",
                            new
                            {
                                success = true,
                                data = returnDto,
                                message = "Return created successfully",
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
            .WithName("CreateReturn")
            .WithOpenApi();

        // POST /api/v1/returns/{id}/approve - Approve or reject a return
        returnGroup
            .MapPost(
                "/{id}/approve",
                async (
                    Guid id,
                    [FromBody] ApproveReturnDto dto,
                    HttpContext httpContext,
                    IReturnService returnService
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

                        // TODO: Add role check for Manager
                        var returnDto = await returnService.ApproveReturnAsync(id, dto, userId.Value);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = returnDto,
                                message = $"Return {(dto.Approved ? "approved" : "rejected")} successfully",
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
            .WithName("ApproveReturn")
            .WithOpenApi();

        // POST /api/v1/returns/{id}/process - Process a return and complete refund
        returnGroup
            .MapPost(
                "/{id}/process",
                async (
                    Guid id,
                    [FromBody] ProcessReturnDto dto,
                    HttpContext httpContext,
                    IReturnService returnService
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

                        var returnDto = await returnService.ProcessReturnAsync(id, dto, userId.Value);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = returnDto,
                                message = "Return processed successfully",
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
            .WithName("ProcessReturn")
            .WithOpenApi();

        // GET /api/v1/returns - List returns with filtering
        returnGroup
            .MapGet(
                "",
                async (
                    HttpContext httpContext,
                    IReturnService returnService,
                    string? status = null,
                    DateTime? startDate = null,
                    DateTime? endDate = null,
                    int page = 1,
                    int pageSize = 20
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

                        var returns = await returnService.GetReturnsAsync(
                            branch.Id,
                            status,
                            startDate,
                            endDate,
                            page,
                            pageSize
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = returns,
                                pagination = new
                                {
                                    page,
                                    pageSize,
                                    totalItems = returns.Count,
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
            .WithName("GetReturns")
            .WithOpenApi();

        // GET /api/v1/returns/{id} - Get return by ID
        returnGroup
            .MapGet(
                "/{id}",
                async (Guid id, IReturnService returnService) =>
                {
                    try
                    {
                        var returnDto = await returnService.GetReturnByIdAsync(id);

                        if (returnDto == null)
                        {
                            return Results.NotFound(
                                new
                                {
                                    success = false,
                                    error = new { code = "NOT_FOUND", message = "Return not found" },
                                }
                            );
                        }

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = returnDto,
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
            .WithName("GetReturnById")
            .WithOpenApi();

        // GET /api/v1/return-policies - Get active return policy
        returnGroup
            .MapGet(
                "/policy",
                async (HttpContext httpContext, IReturnService returnService) =>
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

                        var policy = await returnService.GetActivePolicyAsync(branch.Id);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = policy,
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
            .WithName("GetReturnPolicy")
            .WithOpenApi();

        // PUT /api/v1/return-policies - Update return policy
        returnGroup
            .MapPut(
                "/policy",
                async (
                    [FromBody] UpdateReturnPolicyDto dto,
                    HttpContext httpContext,
                    IReturnService returnService
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

                        // TODO: Add role check for Manager/Admin
                        var policy = await returnService.UpdatePolicyAsync(branch.Id, dto, userId.Value);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = policy,
                                message = "Return policy updated successfully",
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
            .WithName("UpdateReturnPolicy")
            .WithOpenApi();

        return app;
    }
}
