namespace Backend.Models.DTOs.HeadOffice.Branches;

/// <summary>
/// Data transfer object for comprehensive branch settings (branch info, regional, and tax configuration)
/// </summary>
public class BranchSettingsDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;

    // Branch Information
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public AddressDto? AddressEn { get; set; }
    public AddressDto? AddressAr { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? VatNumber { get; set; }
    public string? CommercialRegistrationNumber { get; set; }
    public string? LogoPath { get; set; }
    public string? LogoUrl { get; set; }

    // Regional Settings
    public string TimeZone { get; set; } = "UTC";
    public string Currency { get; set; } = "USD";
    public string Language { get; set; } = "en";
    public string DateFormat { get; set; } = "MM/DD/YYYY";
    public string NumberFormat { get; set; } = "en-US";

    // Tax Settings
    public bool EnableTax { get; set; }
    public decimal TaxRate { get; set; }
    public bool PriceIncludesTax { get; set; }

    // Metadata
    public bool IsActive { get; set; }
    public DateTime UpdatedAt { get; set; }
}
