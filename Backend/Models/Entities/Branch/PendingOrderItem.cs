using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

/// <summary>
/// Represents a line item in a pending order
/// </summary>
public class PendingOrderItem
{
    [Key]
    public Guid Id { get; set; }

    public Guid PendingOrderId { get; set; }

    public Guid ProductId { get; set; }

    [Required]
    [MaxLength(200)]
    public string ProductName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? ProductSku { get; set; }

    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    public decimal Discount { get; set; }

    public decimal TotalPrice { get; set; }

    /// <summary>
    /// Special instructions or notes for this item (e.g., "No onions", "Extra cheese")
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation property
    public PendingOrder? PendingOrder { get; set; }
}
