namespace Backend.Models.DTOs.Suppliers;

/// <summary>
/// DTO for supplier information returned to clients
/// </summary>
public class SupplierDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string? NameAr { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? AddressEn { get; set; }
    public string? AddressAr { get; set; }
    public string? LogoPath { get; set; }
    public string? PaymentTerms { get; set; }
    public string? DeliveryTerms { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// Total number of purchases from this supplier
    /// </summary>
    public int TotalPurchases { get; set; }

    /// <summary>
    /// Total amount spent with this supplier
    /// </summary>
    public decimal TotalSpent { get; set; }

    /// <summary>
    /// Date of last purchase from this supplier
    /// </summary>
    public DateTime? LastPurchaseDate { get; set; }
}
