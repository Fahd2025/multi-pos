namespace Backend.Models.DTOs.HeadOffice.Branches;

/// <summary>
/// Data transfer object for Branch entity responses
/// </summary>
public class BranchDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string LoginName { get; set; } = string.Empty;
    public string? AddressEn { get; set; }
    public string? AddressAr { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? CRN { get; set; }
    public string? TaxNumber { get; set; }
    public string? NationalAddress { get; set; }
    public string? LogoPath { get; set; }
    public string DatabaseProvider { get; set; } = string.Empty; // Converted to string for API response
    public string DbServer { get; set; } = string.Empty;
    public string DbName { get; set; } = string.Empty;
    public int DbPort { get; set; }
    public string? DbUsername { get; set; }
    // Note: DbPassword is never returned in responses for security
    public string? DbAdditionalParams { get; set; }
    public bool TrustServerCertificate { get; set; }
    public string SslMode { get; set; } = "Disable"; // Converted to string for API response
    public string Language { get; set; } = "en";
    public string Currency { get; set; } = "USD";
    public string TimeZone { get; set; } = "UTC";
    public string DateFormat { get; set; } = "MM/DD/YYYY";
    public string NumberFormat { get; set; } = "en-US";
    public decimal TaxRate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public int UserCount { get; set; } // Count of users assigned to this branch
}
