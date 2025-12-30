using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models.Entities.Branch;

/// <summary>
/// Represents a cash transaction during a cash drawer session.
/// Used for petty cash, deposits, withdrawals, etc.
/// </summary>
public class CashTransaction
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The cash drawer this transaction belongs to
    /// </summary>
    [Required]
    public Guid CashDrawerId { get; set; }

    /// <summary>
    /// Type of cash transaction
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Transaction amount (positive for deposits, can be negative for withdrawals)
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    /// <summary>
    /// Reason or description for the transaction
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// User who created the transaction
    /// </summary>
    [Required]
    public Guid CreatedBy { get; set; }

    /// <summary>
    /// When the transaction was created
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Optional reference number (e.g., receipt number, check number)
    /// </summary>
    [MaxLength(100)]
    public string? Reference { get; set; }

    /// <summary>
    /// Optional notes about the transaction
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation properties
    public CashDrawer? CashDrawer { get; set; }
    public User? CreatedByUser { get; set; }
}

/// <summary>
/// Cash transaction type constants
/// </summary>
public static class CashTransactionType
{
    public const string PettyCash = "PettyCash";
    public const string Deposit = "Deposit";
    public const string Withdrawal = "Withdrawal";
    public const string BankDeposit = "BankDeposit";
    public const string CashDrop = "CashDrop";
    public const string Loan = "Loan";
    public const string Other = "Other";
}
