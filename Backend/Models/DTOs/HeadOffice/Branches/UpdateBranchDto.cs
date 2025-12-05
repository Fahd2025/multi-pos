using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.HeadOffice.Branches;

/// <summary>
/// Data transfer object for updating an existing branch
/// </summary>
public class UpdateBranchDto
{
    [StringLength(200, MinimumLength = 1, ErrorMessage = "English name must be between 1 and 200 characters")]
    public string? NameEn { get; set; }

    [StringLength(200, MinimumLength = 1, ErrorMessage = "Arabic name must be between 1 and 200 characters")]
    public string? NameAr { get; set; }

    [StringLength(500, ErrorMessage = "English address cannot exceed 500 characters")]
    public string? AddressEn { get; set; }

    [StringLength(500, ErrorMessage = "Arabic address cannot exceed 500 characters")]
    public string? AddressAr { get; set; }

    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string? Email { get; set; }

    [Phone(ErrorMessage = "Invalid phone format")]
    [StringLength(50, ErrorMessage = "Phone cannot exceed 50 characters")]
    public string? Phone { get; set; }

    [Url(ErrorMessage = "Invalid website URL")]
    [StringLength(255, ErrorMessage = "Website URL cannot exceed 255 characters")]
    public string? Website { get; set; }

    [StringLength(50, ErrorMessage = "CRN cannot exceed 50 characters")]
    public string? CRN { get; set; }

    [StringLength(50, ErrorMessage = "Tax number cannot exceed 50 characters")]
    public string? TaxNumber { get; set; }

    [StringLength(500, ErrorMessage = "National address cannot exceed 500 characters")]
    public string? NationalAddress { get; set; }

    [Range(0, 3, ErrorMessage = "Database provider must be 0 (SQLite), 1 (MSSQL), 2 (PostgreSQL), or 3 (MySQL)")]
    public int? DatabaseProvider { get; set; }

    [StringLength(255, MinimumLength = 1, ErrorMessage = "Database server must be between 1 and 255 characters")]
    public string? DbServer { get; set; }

    [StringLength(100, MinimumLength = 1, ErrorMessage = "Database name must be between 1 and 100 characters")]
    public string? DbName { get; set; }

    [Range(1, 65535, ErrorMessage = "Database port must be between 1 and 65535")]
    public int? DbPort { get; set; }

    [StringLength(100, ErrorMessage = "Database username cannot exceed 100 characters")]
    public string? DbUsername { get; set; }

    [StringLength(255, ErrorMessage = "Database password cannot exceed 255 characters")]
    public string? DbPassword { get; set; }

    [StringLength(500, ErrorMessage = "Additional database parameters cannot exceed 500 characters")]
    public string? DbAdditionalParams { get; set; }

    public bool? TrustServerCertificate { get; set; }

    [Range(0, 3, ErrorMessage = "SSL mode must be 0 (Disable), 1 (Require), 2 (VerifyCA), or 3 (VerifyFull)")]
    public int? SslMode { get; set; }

    [StringLength(10, ErrorMessage = "Language code cannot exceed 10 characters")]
    [RegularExpression(@"^(en|ar)$", ErrorMessage = "Language must be 'en' or 'ar'")]
    public string? Language { get; set; }

    [StringLength(10, ErrorMessage = "Currency code cannot exceed 10 characters")]
    public string? Currency { get; set; }

    [StringLength(100, ErrorMessage = "Time zone cannot exceed 100 characters")]
    public string? TimeZone { get; set; }

    [StringLength(50, ErrorMessage = "Date format cannot exceed 50 characters")]
    public string? DateFormat { get; set; }

    [StringLength(50, ErrorMessage = "Number format cannot exceed 50 characters")]
    public string? NumberFormat { get; set; }

    [Range(0, 100, ErrorMessage = "Tax rate must be between 0 and 100")]
    public decimal? TaxRate { get; set; }

    public bool? IsActive { get; set; }

    [StringLength(500, ErrorMessage = "Logo path cannot exceed 500 characters")]
    public string? LogoPath { get; set; }
}
