using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Branch.Expenses;

/// <summary>
/// Data transfer object for creating a new expense
/// </summary>
public class CreateExpenseDto
{
    /// <summary>
    /// Expense category identifier
    /// </summary>
    [Required(ErrorMessage = "Expense category is required")]
    public Guid ExpenseCategoryId { get; set; }

    /// <summary>
    /// Expense amount
    /// </summary>
    [Required(ErrorMessage = "Amount is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
    public decimal Amount { get; set; }

    /// <summary>
    /// Date of the expense
    /// </summary>
    [Required(ErrorMessage = "Expense date is required")]
    public DateTime ExpenseDate { get; set; }

    /// <summary>
    /// Expense description (English)
    /// </summary>
    [Required(ErrorMessage = "Description (English) is required")]
    [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string DescriptionEn { get; set; } = string.Empty;

    /// <summary>
    /// Expense description (Arabic)
    /// </summary>
    [StringLength(500, ErrorMessage = "Description (Arabic) cannot exceed 500 characters")]
    public string? DescriptionAr { get; set; }

    /// <summary>
    /// Payment method (0=Cash, 1=Card, 2=BankTransfer, 3=Other)
    /// </summary>
    [Required(ErrorMessage = "Payment method is required")]
    public int PaymentMethod { get; set; }

    /// <summary>
    /// Payment reference number
    /// </summary>
    [StringLength(200, ErrorMessage = "Payment reference cannot exceed 200 characters")]
    public string? PaymentReference { get; set; }

    /// <summary>
    /// Path to receipt image
    /// </summary>
    [StringLength(500, ErrorMessage = "Receipt image path cannot exceed 500 characters")]
    public string? ReceiptImagePath { get; set; }
}
