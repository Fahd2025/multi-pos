using Backend.Models.Entities.Branch;
using Backend.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Branch.PendingOrders;

/// <summary>
/// DTO for creating a new pending order
/// </summary>
public class CreatePendingOrderDto
{
    // Customer Information (Optional)
    [MaxLength(200)]
    public string? CustomerName { get; set; }

    [MaxLength(20)]
    [Phone(ErrorMessage = "Invalid phone number format")]
    public string? CustomerPhone { get; set; }

    public Guid? CustomerId { get; set; }

    // Table Information (Optional - for dine-in orders)
    public Guid? TableId { get; set; }

    [MaxLength(20)]
    public string? TableNumber { get; set; }

    [Range(1, 100, ErrorMessage = "Guest count must be between 1 and 100")]
    public int? GuestCount { get; set; }

    // Order Details
    [Required]
    [MinLength(1, ErrorMessage = "At least one item is required")]
    public List<PendingOrderItemDto> Items { get; set; } = new();

    [Required]
    [Range(0, double.MaxValue)]
    public decimal Subtotal { get; set; }

    [Range(0, double.MaxValue)]
    public decimal TaxAmount { get; set; }

    [Range(0, double.MaxValue)]
    public decimal DiscountAmount { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Total amount must be greater than 0")]
    public decimal TotalAmount { get; set; }

    // Metadata
    [MaxLength(500)]
    public string? Notes { get; set; }

    [Required]
    public OrderType OrderType { get; set; }

    [Required]
    public PendingOrderStatus Status { get; set; } = PendingOrderStatus.Parked;
}
