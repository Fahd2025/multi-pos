using Backend.Models.DTOs.Branch.Customers;
using Backend.Services.Branch.Customers;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Endpoints;

/// <summary>
/// Customer management endpoints
/// </summary>
public static class CustomerEndpoints
{
    /// <summary>
    /// Maps customer endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapCustomerEndpoints(this IEndpointRouteBuilder app)
    {
        var customerGroup = app.MapGroup("/api/v1/customers").WithTags("Customers");

        // GET /api/v1/customers - Get all customers with search and pagination
        customerGroup
            .MapGet(
                "",
                async (
                    ICustomerService customerService,
                    string? search = null,
                    bool? isActive = null,
                    int page = 1,
                    int pageSize = 50
                ) =>
                {
                    try
                    {
                        var (customers, totalCount) = await customerService.GetCustomersAsync(
                            search,
                            isActive,
                            page,
                            pageSize
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = customers,
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
            .WithName("GetCustomers")
            .WithOpenApi();

        // POST /api/v1/customers - Create a new customer
        customerGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreateCustomerDto dto,
                    HttpContext httpContext,
                    ICustomerService customerService
                ) =>
                {
                    try
                    {
                        var userId = httpContext.Items["UserId"] as Guid?;
                        if (!userId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        var customer = await customerService.CreateCustomerAsync(dto, userId.Value);

                        return Results.Created(
                            $"/api/v1/customers/{customer.Id}",
                            new
                            {
                                success = true,
                                data = customer,
                                message = "Customer created successfully",
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
            .WithName("CreateCustomer")
            .WithOpenApi();

        // PUT /api/v1/customers/:id - Update an existing customer
        customerGroup
            .MapPut(
                "/{id:guid}",
                async (
                    Guid id,
                    [FromBody] UpdateCustomerDto dto,
                    ICustomerService customerService
                ) =>
                {
                    try
                    {
                        var customer = await customerService.UpdateCustomerAsync(id, dto);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = customer,
                                message = "Customer updated successfully",
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
            .WithName("UpdateCustomer")
            .WithOpenApi();

        // DELETE /api/v1/customers/:id - Delete (soft delete) a customer
        customerGroup
            .MapDelete(
                "/{id:guid}",
                async (Guid id, ICustomerService customerService) =>
                {
                    try
                    {
                        await customerService.DeleteCustomerAsync(id);

                        return Results.Ok(
                            new { success = true, message = "Customer deleted successfully" }
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
            .WithName("DeleteCustomer")
            .WithOpenApi();

        // GET /api/v1/customers/:id/history - Get customer purchase history
        customerGroup
            .MapGet(
                "/{id:guid}/history",
                async (
                    Guid id,
                    ICustomerService customerService,
                    DateTime? startDate = null,
                    DateTime? endDate = null,
                    int page = 1,
                    int pageSize = 50
                ) =>
                {
                    try
                    {
                        var (sales, totalCount) = await customerService.GetCustomerPurchaseHistoryAsync(
                            id,
                            startDate,
                            endDate,
                            page,
                            pageSize
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = sales,
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
            .WithName("GetCustomerPurchaseHistory")
            .WithOpenApi();

        return app;
    }
}
