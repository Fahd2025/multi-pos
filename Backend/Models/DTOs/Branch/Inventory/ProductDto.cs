namespace Backend.Models.DTOs.Branch.Inventory;

/// <summary>
/// Data transfer object for Product entity
/// </summary>
public class ProductDto
{
    public Guid Id { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public Guid CategoryId { get; set; }
    public string? CategoryNameEn { get; set; }
    public string? CategoryNameAr { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal CostPrice { get; set; }
    public int StockLevel { get; set; }
    public int MinStockThreshold { get; set; }
    public bool HasInventoryDiscrepancy { get; set; }
    public Guid? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public string? Barcode { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public List<ProductImageDto> Images { get; set; } = new();
    public bool IsLowStock => StockLevel <= MinStockThreshold;
}
