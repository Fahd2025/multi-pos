using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class SaleLineItem
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid SaleId { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    [MaxLength(100)]
    public string? Barcode { get; set; }

    [MaxLength(50)]
    public string? Unit { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    public decimal UnitPrice { get; set; }

    [Required]
    public DiscountType DiscountType { get; set; } = DiscountType.None;

    [Required]
    public decimal DiscountValue { get; set; } = 0;

    [Required]
    public decimal DiscountedUnitPrice { get; set; }

    [Required]
    public decimal LineTotal { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Return Tracking Properties
    [Required]
    public int ReturnQuantity { get; set; } = 0; // How many of this item have been returned

    [Required]
    [MaxLength(50)]
    public string ItemStatus { get; set; } = "ordered"; // ordered, completed, returned, partially_returned

    // Navigation properties
    public Sale Sale { get; set; } = null!;
    public Product Product { get; set; } = null!;
}

public enum DiscountType
{
    None = 0,
    Percentage = 1,
    FixedAmount = 2,
}
