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
