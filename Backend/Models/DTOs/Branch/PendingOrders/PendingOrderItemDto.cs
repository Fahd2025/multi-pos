using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Branch.PendingOrders;

/// <summary>
/// DTO for pending order line items
/// </summary>
public class PendingOrderItemDto
{
    public Guid? Id { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    [Required]
    [MaxLength(200)]
    public string ProductName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? ProductSku { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Unit price must be greater than 0")]
    public decimal UnitPrice { get; set; }

    [Required]
    [Range(1, 1000, ErrorMessage = "Quantity must be between 1 and 1000")]
    public int Quantity { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Discount cannot be negative")]
    public decimal Discount { get; set; }

    [Required]
    public decimal TotalPrice { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}
