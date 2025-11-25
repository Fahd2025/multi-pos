namespace Backend.Models.DTOs.Expenses;

/// <summary>
/// Data transfer object for expense information
/// </summary>
public class ExpenseDto
{
    /// <summary>
    /// Unique expense identifier
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Expense category identifier
    /// </summary>
    public Guid ExpenseCategoryId { get; set; }

    /// <summary>
    /// Category name (English)
    /// </summary>
    public string CategoryNameEn { get; set; } = string.Empty;

    /// <summary>
    /// Category name (Arabic)
    /// </summary>
    public string CategoryNameAr { get; set; } = string.Empty;

    /// <summary>
    /// Expense amount
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Date of the expense
    /// </summary>
    public DateTime ExpenseDate { get; set; }

    /// <summary>
    /// Expense description (English)
    /// </summary>
    public string DescriptionEn { get; set; } = string.Empty;

    /// <summary>
    /// Expense description (Arabic)
    /// </summary>
    public string? DescriptionAr { get; set; }

    /// <summary>
    /// Payment method (0=Cash, 1=Card, 2=BankTransfer, 3=Other)
    /// </summary>
    public int PaymentMethod { get; set; }

    /// <summary>
    /// Payment reference number
    /// </summary>
    public string? PaymentReference { get; set; }

    /// <summary>
    /// Path to receipt image
    /// </summary>
    public string? ReceiptImagePath { get; set; }

    /// <summary>
    /// Approval status (0=Pending, 1=Approved, 2=Rejected)
    /// </summary>
    public int ApprovalStatus { get; set; }

    /// <summary>
    /// User who approved/rejected the expense
    /// </summary>
    public Guid? ApprovedBy { get; set; }

    /// <summary>
    /// Approval timestamp
    /// </summary>
    public DateTime? ApprovedAt { get; set; }

    /// <summary>
    /// Record creation timestamp
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// User who created the expense
    /// </summary>
    public Guid CreatedBy { get; set; }
}
