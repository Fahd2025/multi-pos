using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class Product
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string SKU { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string NameEn { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string NameAr { get; set; } = string.Empty;

    public string? DescriptionEn { get; set; }

    public string? DescriptionAr { get; set; }

    [Required]
    public Guid CategoryId { get; set; }

    [Required]
    public decimal SellingPrice { get; set; }

    [Required]
    public decimal CostPrice { get; set; }

    [Required]
    public int StockLevel { get; set; } = 0;

    [Required]
    public int MinStockThreshold { get; set; } = 10;

    [Required]
    public bool HasInventoryDiscrepancy { get; set; } = false;

    public Guid? SupplierId { get; set; }

    [MaxLength(100)]
    public string? Barcode { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public Guid CreatedBy { get; set; }

    // Navigation properties
    public Category Category { get; set; } = null!;
    public Supplier? Supplier { get; set; }
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<SaleLineItem> SaleLineItems { get; set; } = new List<SaleLineItem>();
    public ICollection<PurchaseLineItem> PurchaseLineItems { get; set; } =
        new List<PurchaseLineItem>();
}
