using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class PrinterConfiguration
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid BranchId { get; set; }

    [Required]
    [MaxLength(100)]
    public string PrinterName { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string ConnectionType { get; set; } = "USB"; // USB, Network, Bluetooth

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    public int? Port { get; set; }

    [MaxLength(50)]
    public string? PrinterModel { get; set; }

    [Required]
    public int PaperWidth { get; set; } = 80; // 58mm or 80mm

    [Required]
    public bool AutoPrint { get; set; } = false;

    // Receipt Header Configuration
    [MaxLength(200)]
    public string? HeaderLine1 { get; set; }

    [MaxLength(200)]
    public string? HeaderLine2 { get; set; }

    [MaxLength(200)]
    public string? HeaderLine3 { get; set; }

    [MaxLength(100)]
    public string? TaxNumber { get; set; }

    // Receipt Footer Configuration
    [MaxLength(200)]
    public string? FooterLine1 { get; set; } = "Thank you for your business!";

    [MaxLength(200)]
    public string? FooterLine2 { get; set; }

    [MaxLength(200)]
    public string? FooterLine3 { get; set; }

    [Required]
    public bool PrintLogo { get; set; } = false;

    [MaxLength(500)]
    public string? LogoPath { get; set; }

    [Required]
    public bool PrintBarcode { get; set; } = true;

    [Required]
    public bool PrintQrCode { get; set; } = false;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}

public enum ConnectionType
{
    USB = 0,
    Network = 1,
    Bluetooth = 2
}
