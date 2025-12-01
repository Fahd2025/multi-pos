using Backend.Models.DTOs.Suppliers;
using Backend.Services.Suppliers;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Endpoints;

/// <summary>
/// Supplier management endpoints (Manager Only)
/// </summary>
public static class SupplierEndpoints
{
    /// <summary>
    /// Maps supplier endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapSupplierEndpoints(this IEndpointRouteBuilder app)
    {
        var suppliersGroup = app.MapGroup("/api/v1/suppliers").WithTags("Suppliers");

        // GET /api/v1/suppliers - Get all suppliers with filtering
        suppliersGroup
            .MapGet(
                "",
                async (
                    HttpContext httpContext,
                    ISupplierService supplierService,
                    bool includeInactive = false,
                    string? searchTerm = null,
                    int page = 1,
                    int pageSize = 50
                ) =>
                {
                    try
                    {
                        // Check if user has manager role or higher
                        var userRole = httpContext
                            .User.FindFirst(System.Security.Claims.ClaimTypes.Role)
                            ?.Value;
                        if (
                            userRole != "Manager"
                            && userRole != "Admin"
                            && httpContext.Items["IsHeadOfficeAdmin"] as bool? != true
                        )
                        {
                            return Results.Forbid();
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

                        var (suppliers, totalCount) = await supplierService.GetSuppliersAsync(
                            branch.Id,
                            includeInactive,
                            searchTerm,
                            page,
                            pageSize
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = suppliers,
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
            .WithName("GetSuppliers")
            .WithOpenApi();

        // POST /api/v1/suppliers - Create a new supplier
        suppliersGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreateSupplierDto createDto,
                    HttpContext httpContext,
                    ISupplierService supplierService
                ) =>
                {
                    try
                    {
                        // Check if user has manager role or higher
                        var userRole = httpContext
                            .User.FindFirst(System.Security.Claims.ClaimTypes.Role)
                            ?.Value;
                        if (
                            userRole != "Manager"
                            && userRole != "Admin"
                            && httpContext.Items["IsHeadOfficeAdmin"] as bool? != true
                        )
                        {
                            return Results.Forbid();
                        }

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

                        var supplier = await supplierService.CreateSupplierAsync(
                            branch.Id,
                            createDto,
                            userId.Value
                        );

                        return Results.Created(
                            $"/api/v1/suppliers/{supplier.Id}",
                            new
                            {
                                success = true,
                                data = supplier,
                                message = "Supplier created successfully",
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
            .WithName("CreateSupplier")
            .WithOpenApi();

        // PUT /api/v1/suppliers/:id - Update a supplier
        suppliersGroup
            .MapPut(
                "/{id:guid}",
                async (
                    Guid id,
                    [FromBody] UpdateSupplierDto updateDto,
                    HttpContext httpContext,
                    ISupplierService supplierService
                ) =>
                {
                    try
                    {
                        // Check if user has manager role or higher
                        var userRole = httpContext
                            .User.FindFirst(System.Security.Claims.ClaimTypes.Role)
                            ?.Value;
                        if (
                            userRole != "Manager"
                            && userRole != "Admin"
                            && httpContext.Items["IsHeadOfficeAdmin"] as bool? != true
                        )
                        {
                            return Results.Forbid();
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

                        var supplier = await supplierService.UpdateSupplierAsync(branch.Id, id, updateDto);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = supplier,
                                message = "Supplier updated successfully",
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
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("UpdateSupplier")
            .WithOpenApi();

        // DELETE /api/v1/suppliers/:id - Delete a supplier
        suppliersGroup
            .MapDelete(
                "/{id:guid}",
                async (
                    Guid id,
                    HttpContext httpContext,
                    ISupplierService supplierService
                ) =>
                {
                    try
                    {
                        // Check if user has manager role or higher
                        var userRole = httpContext
                            .User.FindFirst(System.Security.Claims.ClaimTypes.Role)
                            ?.Value;
                        if (
                            userRole != "Manager"
                            && userRole != "Admin"
                            && httpContext.Items["IsHeadOfficeAdmin"] as bool? != true
                        )
                        {
                            return Results.Forbid();
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

                        await supplierService.DeleteSupplierAsync(branch.Id, id);

                        return Results.Ok(
                            new { success = true, message = "Supplier deleted successfully" }
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
            .WithName("DeleteSupplier")
            .WithOpenApi();

        // GET /api/v1/suppliers/:id/history - Get purchase history for a supplier
        suppliersGroup
            .MapGet(
                "/{id:guid}/history",
                async (
                    Guid id,
                    HttpContext httpContext,
                    ISupplierService supplierService,
                    int page = 1,
                    int pageSize = 50
                ) =>
                {
                    try
                    {
                        // Check if user has manager role or higher
                        var userRole = httpContext
                            .User.FindFirst(System.Security.Claims.ClaimTypes.Role)
                            ?.Value;
                        if (
                            userRole != "Manager"
                            && userRole != "Admin"
                            && httpContext.Items["IsHeadOfficeAdmin"] as bool? != true
                        )
                        {
                            return Results.Forbid();
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

                        var purchases = await supplierService.GetSupplierPurchaseHistoryAsync(
                            branch.Id,
                            id,
                            page,
                            pageSize
                        );

                        return Results.Ok(new { success = true, data = purchases });
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
            .WithName("GetSupplierPurchaseHistory")
            .WithOpenApi();

        return app;
    }
}
