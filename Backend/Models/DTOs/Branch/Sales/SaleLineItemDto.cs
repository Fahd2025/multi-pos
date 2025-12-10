using Backend.Models.Entities.Branch;

namespace Backend.Models.DTOs.Branch.Sales;

public class SaleLineItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string? Unit { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal DiscountedUnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    public string? Notes { get; set; }
}
