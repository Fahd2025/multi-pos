using Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

/// <summary>
/// Represents a pending (incomplete) order that has been saved for later completion
/// </summary>
public class PendingOrder
{
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Auto-generated order number in format: PO-YYYYMMDD-XXXX
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string OrderNumber { get; set; } = string.Empty;

    // Customer Information (Optional)
    [MaxLength(200)]
    public string? CustomerName { get; set; }

    [MaxLength(20)]
    public string? CustomerPhone { get; set; }

    public Guid? CustomerId { get; set; }

    // Table Information (Optional - for dine-in orders)
    public Guid? TableId { get; set; }

    [MaxLength(20)]
    public string? TableNumber { get; set; }

    public int? GuestCount { get; set; }

    // Order Details
    public List<PendingOrderItem> Items { get; set; } = new();

    public decimal Subtotal { get; set; }

    public decimal TaxAmount { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal TotalAmount { get; set; }

    // Metadata
    [MaxLength(500)]
    public string? Notes { get; set; }

    public OrderType OrderType { get; set; }

    public PendingOrderStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    [Required]
    [MaxLength(100)]
    public string CreatedByUserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string CreatedByUsername { get; set; } = string.Empty;

    // Retrieval/Completion
    public DateTime? RetrievedAt { get; set; }

    /// <summary>
    /// Orders automatically expire and are deleted after 24 hours
    /// </summary>
    public DateTime ExpiresAt { get; set; }
}
