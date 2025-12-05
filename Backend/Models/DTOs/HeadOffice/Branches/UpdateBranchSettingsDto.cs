using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.HeadOffice.Branches;

/// <summary>
/// Data transfer object for updating comprehensive branch settings
/// </summary>
public class UpdateBranchSettingsDto
{
    // Branch Information
    [Required]
    [MaxLength(200)]
    public string NameEn { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string NameAr { get; set; } = string.Empty;

    public AddressDto? AddressEn { get; set; }
    public AddressDto? AddressAr { get; set; }

    [MaxLength(50)]
    [Phone]
    public string? Phone { get; set; }

    [MaxLength(255)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? VatNumber { get; set; }

    [MaxLength(50)]
    public string? CommercialRegistrationNumber { get; set; }

    // Regional Settings
    [Required]
    [MaxLength(100)]
    public string TimeZone { get; set; } = "UTC";

    [Required]
    [MaxLength(10)]
    public string Currency { get; set; } = "USD";

    [Required]
    [MaxLength(10)]
    public string Language { get; set; } = "en";

    [Required]
    [MaxLength(50)]
    public string DateFormat { get; set; } = "MM/DD/YYYY";

    [Required]
    [MaxLength(50)]
    public string NumberFormat { get; set; } = "en-US";

    // Tax Settings
    public bool EnableTax { get; set; }

    [Range(0, 100)]
    public decimal TaxRate { get; set; }

    public bool PriceIncludesTax { get; set; }
}
