using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.CashDrawer;

/// <summary>
/// DTO for creating a cash transaction (petty cash, deposit, etc.)
/// </summary>
public class CreateCashTransactionDto
{
    /// <summary>
    /// Type of transaction (PettyCash, Deposit, Withdrawal, etc.)
    /// </summary>
    [Required(ErrorMessage = "Transaction type is required")]
    [MaxLength(50, ErrorMessage = "Type cannot exceed 50 characters")]
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Transaction amount (positive for adding cash, negative for removing cash)
    /// </summary>
    [Required(ErrorMessage = "Amount is required")]
    public decimal Amount { get; set; }

    /// <summary>
    /// Reason for the transaction
    /// </summary>
    [Required(ErrorMessage = "Reason is required")]
    [MaxLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Optional reference number (receipt, check number, etc.)
    /// </summary>
    [MaxLength(100, ErrorMessage = "Reference cannot exceed 100 characters")]
    public string? Reference { get; set; }

    /// <summary>
    /// Optional notes
    /// </summary>
    [MaxLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
    public string? Notes { get; set; }
}
