using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.HeadOffice;

public class Branch
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string NameEn { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string NameAr { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? AddressEn { get; set; }

    [MaxLength(500)]
    public string? AddressAr { get; set; }

    [MaxLength(255)]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(255)]
    public string? Website { get; set; }

    [MaxLength(50)]
    public string? CRN { get; set; }

    [MaxLength(50)]
    public string? TaxNumber { get; set; }

    [MaxLength(500)]
    public string? NationalAddress { get; set; }

    [MaxLength(500)]
    public string? LogoPath { get; set; }

    [Required]
    public DatabaseProvider DatabaseProvider { get; set; }

    [Required]
    [MaxLength(255)]
    public string DbServer { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string DbName { get; set; } = string.Empty;

    [Required]
    public int DbPort { get; set; }

    [MaxLength(100)]
    public string? DbUsername { get; set; }

    [MaxLength(255)]
    public string? DbPassword { get; set; }

    [MaxLength(500)]
    public string? DbAdditionalParams { get; set; }

    // SSL/TLS Configuration
    public bool TrustServerCertificate { get; set; } = false; // For MSSQL

    [Required]
    public SslMode SslMode { get; set; } = SslMode.Disable; // For PostgreSQL, MySQL, MariaDB

    [Required]
    [MaxLength(10)]
    public string Language { get; set; } = "en";

    [Required]
    [MaxLength(10)]
    public string Currency { get; set; } = "USD";

    [Required]
    [MaxLength(100)]
    public string TimeZone { get; set; } = "UTC";

    [Required]
    [MaxLength(50)]
    public string DateFormat { get; set; } = "MM/DD/YYYY";

    [Required]
    [MaxLength(50)]
    public string NumberFormat { get; set; } = "en-US";

    [Required]
    public decimal TaxRate { get; set; } = 0;

    [Required]
    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Guid CreatedBy { get; set; }

    // Navigation properties
    public ICollection<BranchUser> BranchUsers { get; set; } = new List<BranchUser>();
}

public enum DatabaseProvider
{
    SQLite = 0,
    MSSQL = 1,
    PostgreSQL = 2,
    MySQL = 3,
}

public enum SslMode
{
    Disable = 0,
    Require = 1,
    VerifyCA = 2,
    VerifyFull = 3,
}
