using System.ComponentModel.DataAnnotations;
using Backend.Models.Entities.Branch;

namespace Backend.Models.DTOs.Sales;

public class CreateSaleDto
{
    public Guid? CustomerId { get; set; }

    [Required]
    public InvoiceType InvoiceType { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "At least one line item is required")]
    public List<CreateSaleLineItemDto> LineItems { get; set; } = new();

    [Required]
    public PaymentMethod PaymentMethod { get; set; }

    [MaxLength(200)]
    public string? PaymentReference { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class CreateSaleLineItemDto
{
    [Required]
    public Guid ProductId { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
    public int Quantity { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Unit price must be greater than 0")]
    public decimal UnitPrice { get; set; }

    [Required]
    public DiscountType DiscountType { get; set; } = DiscountType.None;

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Discount value cannot be negative")]
    public decimal DiscountValue { get; set; } = 0;
}
