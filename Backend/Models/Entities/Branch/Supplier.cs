using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class Supplier
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string NameEn { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? NameAr { get; set; }

    [MaxLength(255)]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(500)]
    public string? AddressEn { get; set; }

    [MaxLength(500)]
    public string? AddressAr { get; set; }

    [MaxLength(500)]
    public string? LogoPath { get; set; }

    [MaxLength(200)]
    public string? PaymentTerms { get; set; }

    [MaxLength(200)]
    public string? DeliveryTerms { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public Guid CreatedBy { get; set; }

    // Navigation properties
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<Purchase> Purchases { get; set; } = new List<Purchase>();
}
