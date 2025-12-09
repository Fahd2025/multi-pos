using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class InvoiceTemplate
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public bool IsActive { get; set; } = false;

    [Required]
    public PaperSize PaperSize { get; set; } = PaperSize.Thermal80mm;

    public int? CustomWidth { get; set; } // in mm

    public int? CustomHeight { get; set; } // in mm

    [Required]
    public string Schema { get; set; } = string.Empty; // JSON configuration

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public Guid CreatedBy { get; set; }
}

public enum PaperSize
{
    Thermal58mm = 0,
    Thermal80mm = 1,
    A4 = 2,
    Custom = 3
}
