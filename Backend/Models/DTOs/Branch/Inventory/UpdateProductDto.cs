using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Branch.Inventory;

/// <summary>
/// DTO for updating an existing product
/// </summary>
public class UpdateProductDto
{
    [Required]
    [StringLength(100)]
    public string SKU { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string NameEn { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string NameAr { get; set; } = string.Empty;

    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }

    [Required]
    public Guid CategoryId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Selling price must be greater than 0")]
    public decimal SellingPrice { get; set; }

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Cost price must be 0 or greater")]
    public decimal CostPrice { get; set; }

    [Range(0, int.MaxValue)]
    public int MinStockThreshold { get; set; } = 10;

    public Guid? SupplierId { get; set; }

    [StringLength(100)]
    public string? Barcode { get; set; }

    public bool IsActive { get; set; } = true;
}
