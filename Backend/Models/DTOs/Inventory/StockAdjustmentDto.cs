using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Inventory;

/// <summary>
/// DTO for manual stock adjustments
/// </summary>
public class StockAdjustmentDto
{
    [Required]
    public Guid ProductId { get; set; }

    [Required]
    public int AdjustmentQuantity { get; set; }

    [Required]
    [StringLength(50)]
    public string AdjustmentType { get; set; } = string.Empty; // "Add", "Remove", "Set"

    [StringLength(500)]
    public string? Reason { get; set; }

    public int NewStockLevel { get; set; }
}
