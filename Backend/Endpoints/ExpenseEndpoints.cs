using Backend.Models.DTOs.Branch.Expenses;
using Backend.Services.Branch.Expenses;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Endpoints;

/// <summary>
/// Expense and expense category endpoints
/// </summary>
public static class ExpenseEndpoints
{
    /// <summary>
    /// Maps expense endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapExpenseEndpoints(this IEndpointRouteBuilder app)
    {
        var expenseGroup = app.MapGroup("/api/v1/expenses").WithTags("Expenses");
        var expenseCategoryGroup = app.MapGroup("/api/v1/expense-categories").WithTags("Expense Categories");

        // GET /api/v1/expenses - Get all expenses with filtering
        expenseGroup
            .MapGet(
                "",
                async (
                    IExpenseService expenseService,
                    Guid? categoryId = null,
                    DateTime? startDate = null,
                    DateTime? endDate = null,
                    int? approvalStatus = null,
                    int page = 1,
                    int pageSize = 50
                ) =>
                {
                    try
                    {
                        var (expenses, totalCount) = await expenseService.GetExpensesAsync(
                            categoryId,
                            startDate,
                            endDate,
                            approvalStatus,
                            page,
                            pageSize
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = expenses,
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
            .WithName("GetExpenses")
            .WithOpenApi();

        // POST /api/v1/expenses - Create a new expense
        expenseGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreateExpenseDto dto,
                    HttpContext httpContext,
                    IExpenseService expenseService
                ) =>
                {
                    try
                    {
                        var userId = httpContext.Items["UserId"] as Guid?;
                        if (!userId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        var expense = await expenseService.CreateExpenseAsync(dto, userId.Value);

                        return Results.Created(
                            $"/api/v1/expenses/{expense.Id}",
                            new
                            {
                                success = true,
                                data = expense,
                                message = "Expense created successfully",
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
            .WithName("CreateExpense")
            .WithOpenApi();

        // PUT /api/v1/expenses/:id - Update an expense
        expenseGroup
            .MapPut(
                "/{id:guid}",
                async (
                    Guid id,
                    [FromBody] CreateExpenseDto dto,
                    IExpenseService expenseService
                ) =>
                {
                    try
                    {
                        var expense = await expenseService.UpdateExpenseAsync(id, dto);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = expense,
                                message = "Expense updated successfully",
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
            .WithName("UpdateExpense")
            .WithOpenApi();

        // DELETE /api/v1/expenses/:id - Delete an expense
        expenseGroup
            .MapDelete(
                "/{id:guid}",
                async (Guid id, IExpenseService expenseService) =>
                {
                    try
                    {
                        await expenseService.DeleteExpenseAsync(id);

                        return Results.Ok(new { success = true, message = "Expense deleted successfully" });
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
            .WithName("DeleteExpense")
            .WithOpenApi();

        // POST /api/v1/expenses/:id/approve - Approve or reject an expense (Manager only)
        expenseGroup
            .MapPost(
                "/{id:guid}/approve",
                async (
                    Guid id,
                    [FromBody] ApproveExpenseRequest request,
                    HttpContext httpContext,
                    IExpenseService expenseService
                ) =>
                {
                    try
                    {
                        var userId = httpContext.Items["UserId"] as Guid?;
                        if (!userId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

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

                        var expense = await expenseService.ApproveExpenseAsync(
                            id,
                            userId.Value,
                            request.Approved
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = expense,
                                message = request.Approved
                                    ? "Expense approved successfully"
                                    : "Expense rejected successfully",
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
            .WithName("ApproveExpense")
            .WithOpenApi();

        // GET /api/v1/expense-categories - Get all expense categories
        expenseCategoryGroup
            .MapGet(
                "",
                async (
                    IExpenseService expenseService,
                    bool includeInactive = false
                ) =>
                {
                    try
                    {
                        var categories = await expenseService.GetExpenseCategoriesAsync(includeInactive);

                        return Results.Ok(new { success = true, data = categories });
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
            .WithName("GetExpenseCategories")
            .WithOpenApi();

        // POST /api/v1/expense-categories - Create a new expense category
        expenseCategoryGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreateExpenseCategoryRequest request,
                    IExpenseService expenseService
                ) =>
                {
                    try
                    {
                        var category = await expenseService.CreateExpenseCategoryAsync(
                            request.Code,
                            request.NameEn,
                            request.NameAr,
                            request.BudgetAllocation
                        );

                        return Results.Created(
                            $"/api/v1/expense-categories/{category.Id}",
                            new
                            {
                                success = true,
                                data = category,
                                message = "Expense category created successfully",
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
            .WithName("CreateExpenseCategory")
            .WithOpenApi();

        return app;
    }
}

/// <summary>
/// Request model for approving or rejecting an expense
/// </summary>
public record ApproveExpenseRequest(bool Approved);

/// <summary>
/// Request model for creating an expense category
/// </summary>
public record CreateExpenseCategoryRequest(
    string Code,
    string NameEn,
    string NameAr,
    decimal? BudgetAllocation
);
