using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class Expense
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ExpenseCategoryId { get; set; }

    [Required]
    public decimal Amount { get; set; }

    [Required]
    public DateTime ExpenseDate { get; set; }

    [Required]
    [MaxLength(500)]
    public string DescriptionEn { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? DescriptionAr { get; set; }

    [Required]
    public PaymentMethod PaymentMethod { get; set; }

    [MaxLength(200)]
    public string? PaymentReference { get; set; }

    [MaxLength(500)]
    public string? ReceiptImagePath { get; set; }

    [Required]
    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;

    public Guid? ApprovedBy { get; set; }

    public DateTime? ApprovedAt { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public Guid CreatedBy { get; set; }

    // Navigation properties
    public ExpenseCategory Category { get; set; } = null!;
}

public enum ApprovalStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}
