using Backend.Models.Entities.Branch;
using Backend.Models.Enums;

namespace Backend.Models.DTOs.Branch.PendingOrders;

/// <summary>
/// DTO for pending order response
/// </summary>
public class PendingOrderDto
{
    public Guid Id { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    // Customer Information
    public string? CustomerName { get; set; }

    public string? CustomerPhone { get; set; }

    public Guid? CustomerId { get; set; }

    // Table Information
    public Guid? TableId { get; set; }

    public string? TableNumber { get; set; }

    public int? GuestCount { get; set; }

    // Order Details
    public List<PendingOrderItemDto> Items { get; set; } = new();

    public int ItemCount => Items.Count;

    public decimal Subtotal { get; set; }

    public decimal TaxAmount { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal TotalAmount { get; set; }

    // Metadata
    public string? Notes { get; set; }

    public OrderType OrderType { get; set; }

    public PendingOrderStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string CreatedByUserId { get; set; } = string.Empty;

    public string CreatedByUsername { get; set; } = string.Empty;

    public DateTime? RetrievedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Time remaining before order expires (in minutes)
    /// </summary>
    public int MinutesUntilExpiry => (int)(ExpiresAt - DateTime.UtcNow).TotalMinutes;

    /// <summary>
    /// Whether this order is close to expiring (< 30 minutes)
    /// </summary>
    public bool IsCloseToExpiry => MinutesUntilExpiry < 30 && MinutesUntilExpiry > 0;

    /// <summary>
    /// Whether this order has already expired
    /// </summary>
    public bool IsExpired => DateTime.UtcNow > ExpiresAt;
}
