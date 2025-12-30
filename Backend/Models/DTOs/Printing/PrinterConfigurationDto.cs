using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Printing;

/// <summary>
/// DTO for printer configuration response
/// </summary>
public class PrinterConfigurationDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string PrinterName { get; set; } = string.Empty;
    public string ConnectionType { get; set; } = "USB";
    public string? IpAddress { get; set; }
    public int? Port { get; set; }
    public string? PrinterModel { get; set; }
    public int PaperWidth { get; set; }
    public bool AutoPrint { get; set; }
    public string? HeaderLine1 { get; set; }
    public string? HeaderLine2 { get; set; }
    public string? HeaderLine3 { get; set; }
    public string? TaxNumber { get; set; }
    public string? FooterLine1 { get; set; }
    public string? FooterLine2 { get; set; }
    public string? FooterLine3 { get; set; }
    public bool PrintLogo { get; set; }
    public string? LogoPath { get; set; }
    public bool PrintBarcode { get; set; }
    public bool PrintQrCode { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// DTO for creating/updating printer configuration
/// </summary>
public class UpsertPrinterConfigurationDto
{
    [Required(ErrorMessage = "Printer name is required")]
    [MaxLength(100)]
    public string PrinterName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Connection type is required")]
    [MaxLength(20)]
    public string ConnectionType { get; set; } = "USB";

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    [Range(1, 65535, ErrorMessage = "Port must be between 1 and 65535")]
    public int? Port { get; set; }

    [MaxLength(50)]
    public string? PrinterModel { get; set; }

    [Required]
    [Range(58, 80, ErrorMessage = "Paper width must be 58mm or 80mm")]
    public int PaperWidth { get; set; } = 80;

    public bool AutoPrint { get; set; } = false;

    [MaxLength(200)]
    public string? HeaderLine1 { get; set; }

    [MaxLength(200)]
    public string? HeaderLine2 { get; set; }

    [MaxLength(200)]
    public string? HeaderLine3 { get; set; }

    [MaxLength(100)]
    public string? TaxNumber { get; set; }

    [MaxLength(200)]
    public string? FooterLine1 { get; set; }

    [MaxLength(200)]
    public string? FooterLine2 { get; set; }

    [MaxLength(200)]
    public string? FooterLine3 { get; set; }

    public bool PrintLogo { get; set; } = false;

    [MaxLength(500)]
    public string? LogoPath { get; set; }

    public bool PrintBarcode { get; set; } = true;

    public bool PrintQrCode { get; set; } = false;
}

/// <summary>
/// DTO for print receipt request
/// </summary>
public class PrintReceiptDto
{
    [Required(ErrorMessage = "Sale ID is required")]
    public Guid SaleId { get; set; }

    public int Copies { get; set; } = 1;
}

/// <summary>
/// DTO for test print request
/// </summary>
public class TestPrintDto
{
    public string? TestMessage { get; set; } = "Test Print - POS System";
}

/// <summary>
/// DTO for print response
/// </summary>
public class PrintResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public byte[]? PrintData { get; set; } // ESC/POS byte array for USB printers
    public string? ErrorDetails { get; set; }
}
