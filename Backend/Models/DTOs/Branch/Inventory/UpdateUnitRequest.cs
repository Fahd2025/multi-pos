using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Branch.Inventory;

/// <summary>
/// Request DTO for updating an existing unit
/// </summary>
public class UpdateUnitRequest
{
    /// <summary>
    /// Unique code for the unit (e.g., "KG", "LTR", "PCS")
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Unit name in English
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string NameEn { get; set; } = string.Empty;

    /// <summary>
    /// Unit name in Arabic
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string NameAr { get; set; } = string.Empty;

    /// <summary>
    /// Short symbol/abbreviation (e.g., "kg", "L", "pc")
    /// </summary>
    [MaxLength(10)]
    public string? Symbol { get; set; }

    /// <summary>
    /// Whether this is a base unit or a derived unit
    /// </summary>
    [Required]
    public bool IsBaseUnit { get; set; } = false;

    /// <summary>
    /// If this is a derived unit, reference to the base unit ID
    /// Required when IsBaseUnit is false
    /// </summary>
    public Guid? BaseUnitId { get; set; }

    /// <summary>
    /// Conversion factor to base unit
    /// Required when IsBaseUnit is false
    /// Example: 1 Kilogram = 1000 Grams, so ConversionFactor = 1000
    /// </summary>
    public decimal? ConversionFactor { get; set; }

    /// <summary>
    /// Whether the unit allows fractional quantities
    /// </summary>
    [Required]
    public bool AllowFractional { get; set; } = false;

    /// <summary>
    /// Number of decimal places to show for this unit (0-4)
    /// </summary>
    [Required]
    [Range(0, 4)]
    public int DecimalPlaces { get; set; } = 0;

    /// <summary>
    /// Display order for sorting in dropdowns
    /// </summary>
    [Required]
    public int DisplayOrder { get; set; } = 0;

    /// <summary>
    /// Additional notes about the unit
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }
}
