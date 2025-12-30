using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models.Entities.Branch;

/// <summary>
/// Represents a product return transaction.
/// Links to the original sale and tracks the return process.
/// </summary>
public class Return
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The branch where the return is processed
    /// </summary>
    [Required]
    public Guid BranchId { get; set; }

    /// <summary>
    /// Reference to the original sale being returned
    /// </summary>
    [Required]
    public Guid OriginalSaleId { get; set; }

    /// <summary>
    /// Customer who is returning the items (optional)
    /// </summary>
    public Guid? CustomerId { get; set; }

    /// <summary>
    /// When the return was initiated
    /// </summary>
    [Required]
    public DateTime ReturnDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Reason for the return
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Current status of the return
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = ReturnStatus.Pending;

    /// <summary>
    /// Subtotal of items being returned
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }

    /// <summary>
    /// Tax amount on returned items
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal TaxAmount { get; set; }

    /// <summary>
    /// Restocking fee charged (if any)
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal RestockingFee { get; set; } = 0;

    /// <summary>
    /// Total refund amount (Subtotal + Tax - RestockingFee)
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Total { get; set; }

    /// <summary>
    /// Method used for refund (Cash, Card, StoreCredit)
    /// </summary>
    [MaxLength(50)]
    public string? RefundMethod { get; set; }

    /// <summary>
    /// Reference number for the refund (transaction ID, credit note number, etc.)
    /// </summary>
    [MaxLength(100)]
    public string? RefundReference { get; set; }

    /// <summary>
    /// User who initiated the return
    /// </summary>
    [Required]
    public Guid ProcessedBy { get; set; }

    /// <summary>
    /// Manager who approved the return (if required)
    /// </summary>
    public Guid? ApprovedBy { get; set; }

    /// <summary>
    /// When the return was approved
    /// </summary>
    public DateTime? ApprovedAt { get; set; }

    /// <summary>
    /// When the refund was completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Additional notes about the return
    /// </summary>
    [MaxLength(1000)]
    public string? Notes { get; set; }

    /// <summary>
    /// Return policy ID applied to this return
    /// </summary>
    public Guid? ReturnPolicyId { get; set; }

    /// <summary>
    /// Whether this is an exchange (return + new sale)
    /// </summary>
    public bool IsExchange { get; set; } = false;

    /// <summary>
    /// If exchange, reference to the new sale
    /// </summary>
    public Guid? ExchangeSaleId { get; set; }

    // Navigation properties
    public Sale? OriginalSale { get; set; }
    public Customer? Customer { get; set; }
    public User? ProcessedByUser { get; set; }
    public User? ApprovedByUser { get; set; }
    public ReturnPolicy? ReturnPolicy { get; set; }
    public Sale? ExchangeSale { get; set; }
    public ICollection<ReturnLineItem> LineItems { get; set; } = new List<ReturnLineItem>();
}

/// <summary>
/// Return status constants
/// </summary>
public static class ReturnStatus
{
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
}

/// <summary>
/// Return reason constants
/// </summary>
public static class ReturnReason
{
    public const string Defective = "Defective";
    public const string WrongItem = "WrongItem";
    public const string ChangedMind = "ChangedMind";
    public const string NotAsDescribed = "NotAsDescribed";
    public const string DamagedInShipping = "DamagedInShipping";
    public const string Other = "Other";
}
