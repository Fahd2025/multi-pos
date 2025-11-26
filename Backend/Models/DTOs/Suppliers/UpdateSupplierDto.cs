using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Suppliers;

/// <summary>
/// DTO for updating an existing supplier
/// </summary>
public class UpdateSupplierDto
{
    [StringLength(50, MinimumLength = 1)]
    public string? Code { get; set; }

    [StringLength(200, MinimumLength = 2)]
    public string? NameEn { get; set; }

    [StringLength(200)]
    public string? NameAr { get; set; }

    [EmailAddress]
    [StringLength(255)]
    public string? Email { get; set; }

    [Phone]
    [StringLength(50)]
    public string? Phone { get; set; }

    [StringLength(500)]
    public string? AddressEn { get; set; }

    [StringLength(500)]
    public string? AddressAr { get; set; }

    [StringLength(200)]
    public string? PaymentTerms { get; set; }

    [StringLength(200)]
    public string? DeliveryTerms { get; set; }

    public bool? IsActive { get; set; }
}
