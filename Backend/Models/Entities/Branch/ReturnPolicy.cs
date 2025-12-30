using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models.Entities.Branch;

/// <summary>
/// Represents a return policy for a branch.
/// Defines rules and conditions for accepting product returns.
/// </summary>
public class ReturnPolicy
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The branch this policy belongs to
    /// </summary>
    [Required]
    public Guid BranchId { get; set; }

    /// <summary>
    /// Maximum number of days allowed for returns
    /// </summary>
    [Required]
    public int MaxReturnDays { get; set; } = 30;

    /// <summary>
    /// Whether a receipt is required for returns
    /// </summary>
    [Required]
    public bool RequireReceipt { get; set; } = true;

    /// <summary>
    /// Whether manager approval is required for all returns
    /// </summary>
    [Required]
    public bool RequireManagerApproval { get; set; } = false;

    /// <summary>
    /// Allowed product conditions for returns (JSON array)
    /// Example: ["New", "Opened", "Used"]
    /// </summary>
    [Required]
    [Column(TypeName = "nvarchar(max)")]
    public string AllowedConditions { get; set; } = "[\"New\",\"Opened\"]";

    /// <summary>
    /// Restocking fee percentage (0-100)
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal RestockingFeePercent { get; set; } = 0;

    /// <summary>
    /// Allowed refund methods (JSON array)
    /// Example: ["Cash", "Card", "StoreCredit"]
    /// </summary>
    [Required]
    [Column(TypeName = "nvarchar(max)")]
    public string RefundMethods { get; set; } = "[\"Cash\",\"Card\",\"StoreCredit\"]";

    /// <summary>
    /// Whether exchanges are allowed
    /// </summary>
    [Required]
    public bool ExchangeAllowed { get; set; } = true;

    /// <summary>
    /// Whether this policy is currently active
    /// </summary>
    [Required]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Optional notes about the policy
    /// </summary>
    [MaxLength(1000)]
    public string? Notes { get; set; }

    /// <summary>
    /// When the policy was created
    /// </summary>
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When the policy was last updated
    /// </summary>
    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User who created the policy
    /// </summary>
    public Guid? CreatedBy { get; set; }

    /// <summary>
    /// User who last updated the policy
    /// </summary>
    public Guid? UpdatedBy { get; set; }
}

/// <summary>
/// Product condition constants for returns
/// </summary>
public static class ProductCondition
{
    public const string New = "New";
    public const string Opened = "Opened";
    public const string Used = "Used";
    public const string Damaged = "Damaged";
}

/// <summary>
/// Refund method constants
/// </summary>
public static class RefundMethod
{
    public const string Cash = "Cash";
    public const string Card = "Card";
    public const string StoreCredit = "StoreCredit";
    public const string OriginalPayment = "OriginalPayment";
}
