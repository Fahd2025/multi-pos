using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class Customer
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

    [Required]
    public decimal TotalPurchases { get; set; } = 0;

    [Required]
    public int VisitCount { get; set; } = 0;

    public DateTime? LastVisitAt { get; set; }

    [Required]
    public int LoyaltyPoints { get; set; } = 0;

    [Required]
    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public Guid CreatedBy { get; set; }

    // Navigation properties
    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
}
