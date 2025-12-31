namespace Backend.Models.DTOs.Branch.Inventory;

/// <summary>
/// Data transfer object for Unit entity
/// </summary>
public class UnitDto
{
    public Guid Id { get; set; }

    /// <summary>
    /// Unique code for the unit (e.g., "KG", "LTR", "PCS")
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Unit name in English
    /// </summary>
    public string NameEn { get; set; } = string.Empty;

    /// <summary>
    /// Unit name in Arabic
    /// </summary>
    public string NameAr { get; set; } = string.Empty;

    /// <summary>
    /// Short symbol/abbreviation (e.g., "kg", "L", "pc")
    /// </summary>
    public string? Symbol { get; set; }

    /// <summary>
    /// Whether this is a base unit or a derived unit
    /// </summary>
    public bool IsBaseUnit { get; set; }

    /// <summary>
    /// If this is a derived unit, reference to the base unit ID
    /// </summary>
    public Guid? BaseUnitId { get; set; }

    /// <summary>
    /// Base unit name for display purposes
    /// </summary>
    public string? BaseUnitName { get; set; }

    /// <summary>
    /// Conversion factor to base unit
    /// Example: 1 Kilogram = 1000 Grams, so ConversionFactor = 1000
    /// </summary>
    public decimal? ConversionFactor { get; set; }

    /// <summary>
    /// Whether the unit allows fractional quantities
    /// </summary>
    public bool AllowFractional { get; set; }

    /// <summary>
    /// Number of decimal places to show for this unit
    /// </summary>
    public int DecimalPlaces { get; set; }

    /// <summary>
    /// Display order for sorting in dropdowns
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// Whether this unit is active and available for use
    /// </summary>
    public bool IsActive { get; set; }

    /// <summary>
    /// Additional notes about the unit
    /// </summary>
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid CreatedBy { get; set; }

    /// <summary>
    /// Number of products using this unit
    /// </summary>
    public int ProductCount { get; set; }
}
