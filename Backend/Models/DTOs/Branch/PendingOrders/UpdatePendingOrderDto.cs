using Backend.Models.Entities.Branch;
using Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Branch.PendingOrders;

/// <summary>
/// DTO for updating an existing pending order
/// </summary>
public class UpdatePendingOrderDto
{
    [MaxLength(200)]
    public string? CustomerName { get; set; }

    [MaxLength(20)]
    [Phone(ErrorMessage = "Invalid phone number format")]
    public string? CustomerPhone { get; set; }

    public Guid? CustomerId { get; set; }

    public Guid? TableId { get; set; }

    [MaxLength(20)]
    public string? TableNumber { get; set; }

    [Range(1, 100, ErrorMessage = "Guest count must be between 1 and 100")]
    public int? GuestCount { get; set; }

    public List<PendingOrderItemDto>? Items { get; set; }

    public decimal? Subtotal { get; set; }

    public decimal? TaxAmount { get; set; }

    public decimal? DiscountAmount { get; set; }

    public decimal? TotalAmount { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public OrderType? OrderType { get; set; }

    public PendingOrderStatus? Status { get; set; }
}
