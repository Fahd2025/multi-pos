using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

/// <summary>
/// Represents a unit of measurement for products
/// Examples: kg, liter, piece, box, carton, dozen, meter, etc.
/// </summary>
public class Unit
{
    [Key]
    public Guid Id { get; set; }

    /// <summary>
    /// Unique code for the unit (e.g., "KG", "LTR", "PCS")
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Unit name in English (e.g., "Kilogram", "Liter", "Piece")
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string NameEn { get; set; } = string.Empty;

    /// <summary>
    /// Unit name in Arabic (e.g., "كيلوجرام", "لتر", "قطعة")
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
    /// Base units are used for conversion calculations (e.g., gram is base, kilogram is 1000 grams)
    /// </summary>
    [Required]
    public bool IsBaseUnit { get; set; } = false;

    /// <summary>
    /// If this is a derived unit, reference to the base unit
    /// Example: If this is "Kilogram", BaseUnitId points to "Gram"
    /// </summary>
    public Guid? BaseUnitId { get; set; }

    /// <summary>
    /// Conversion factor to base unit
    /// Example: 1 Kilogram = 1000 Grams, so ConversionFactor = 1000
    /// </summary>
    public decimal? ConversionFactor { get; set; }

    /// <summary>
    /// Whether the unit allows fractional quantities
    /// True for weight/volume (0.5 kg), False for discrete items (pieces, boxes)
    /// </summary>
    [Required]
    public bool AllowFractional { get; set; } = false;

    /// <summary>
    /// Number of decimal places to show for this unit
    /// </summary>
    [Required]
    public int DecimalPlaces { get; set; } = 0;

    /// <summary>
    /// Display order for sorting in dropdowns
    /// </summary>
    [Required]
    public int DisplayOrder { get; set; } = 0;

    /// <summary>
    /// Whether this unit is active and available for use
    /// </summary>
    [Required]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Additional notes about the unit
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public Guid CreatedBy { get; set; }

    // Navigation properties
    /// <summary>
    /// Reference to the base unit (if this is a derived unit)
    /// </summary>
    public Unit? BaseUnit { get; set; }

    /// <summary>
    /// Derived units that use this unit as their base
    /// </summary>
    public ICollection<Unit> DerivedUnits { get; set; } = new List<Unit>();

    /// <summary>
    /// Products that use this unit
    /// </summary>
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
