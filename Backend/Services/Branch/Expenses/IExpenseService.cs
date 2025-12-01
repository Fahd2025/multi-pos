using Backend.Models.DTOs.Branch.Expenses;

namespace Backend.Services.Branch.Expenses;

/// <summary>
/// Service interface for expense management operations
/// </summary>
public interface IExpenseService
{
    /// <summary>
    /// Get expenses with optional filtering and pagination
    /// </summary>
    /// <param name="categoryId">Filter by category</param>
    /// <param name="startDate">Filter by start date</param>
    /// <param name="endDate">Filter by end date</param>
    /// <param name="approvalStatus">Filter by approval status</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <returns>List of expenses and total count</returns>
    Task<(List<ExpenseDto> Expenses, int TotalCount)> GetExpensesAsync(
        Guid? categoryId = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int? approvalStatus = null,
        int page = 1,
        int pageSize = 50);

    /// <summary>
    /// Get an expense by ID
    /// </summary>
    /// <param name="expenseId">Expense unique identifier</param>
    /// <returns>Expense details or null if not found</returns>
    Task<ExpenseDto?> GetExpenseByIdAsync(Guid expenseId);

    /// <summary>
    /// Create a new expense
    /// </summary>
    /// <param name="dto">Expense creation data</param>
    /// <param name="userId">ID of the user creating the expense</param>
    /// <returns>Created expense details</returns>
    Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto dto, Guid userId);

    /// <summary>
    /// Update an existing expense
    /// </summary>
    /// <param name="expenseId">Expense unique identifier</param>
    /// <param name="dto">Expense update data</param>
    /// <returns>Updated expense details</returns>
    Task<ExpenseDto> UpdateExpenseAsync(Guid expenseId, CreateExpenseDto dto);

    /// <summary>
    /// Delete an expense
    /// </summary>
    /// <param name="expenseId">Expense unique identifier</param>
    Task DeleteExpenseAsync(Guid expenseId);

    /// <summary>
    /// Approve an expense (manager only)
    /// </summary>
    /// <param name="expenseId">Expense unique identifier</param>
    /// <param name="userId">ID of the user approving the expense</param>
    /// <param name="approved">True to approve, false to reject</param>
    /// <returns>Updated expense details</returns>
    Task<ExpenseDto> ApproveExpenseAsync(Guid expenseId, Guid userId, bool approved);

    /// <summary>
    /// Get all expense categories
    /// </summary>
    /// <param name="includeInactive">Include inactive categories</param>
    /// <returns>List of expense categories</returns>
    Task<List<ExpenseCategoryDto>> GetExpenseCategoriesAsync(bool includeInactive = false);

    /// <summary>
    /// Create a new expense category
    /// </summary>
    /// <param name="code">Category code</param>
    /// <param name="nameEn">Category name (English)</param>
    /// <param name="nameAr">Category name (Arabic)</param>
    /// <param name="budgetAllocation">Optional budget allocation</param>
    /// <returns>Created category details</returns>
    Task<ExpenseCategoryDto> CreateExpenseCategoryAsync(string code, string nameEn, string nameAr, decimal? budgetAllocation = null);
}
