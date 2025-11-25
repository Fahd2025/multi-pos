namespace Backend.Models.DTOs.Expenses;

/// <summary>
/// Data transfer object for expense category information
/// </summary>
public class ExpenseCategoryDto
{
    /// <summary>
    /// Unique category identifier
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Category code (e.g., "RENT", "UTIL")
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Category name (English)
    /// </summary>
    public string NameEn { get; set; } = string.Empty;

    /// <summary>
    /// Category name (Arabic)
    /// </summary>
    public string NameAr { get; set; } = string.Empty;

    /// <summary>
    /// Budget allocation for this category
    /// </summary>
    public decimal? BudgetAllocation { get; set; }

    /// <summary>
    /// Category status
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Record creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Record last update timestamp
    /// </summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Total expenses in this category (optional, calculated)
    /// </summary>
    public decimal? TotalExpenses { get; set; }

    /// <summary>
    /// Count of expenses in this category (optional, calculated)
    /// </summary>
    public int? ExpenseCount { get; set; }
}
