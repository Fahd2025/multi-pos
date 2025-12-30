using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.CashDrawer;

/// <summary>
/// DTO for closing a cash drawer
/// </summary>
public class CloseDrawerDto
{
    /// <summary>
    /// Total cash counted when closing (calculated from denomination breakdown)
    /// </summary>
    [Required(ErrorMessage = "Actual cash amount is required")]
    [Range(0, double.MaxValue, ErrorMessage = "Actual cash must be positive or zero")]
    public decimal ActualCash { get; set; }

    /// <summary>
    /// Breakdown of bills and coins counted
    /// Example: {"bills": {"100": 5, "50": 10, "20": 15}, "coins": {"1": 20, "0.25": 40}}
    /// </summary>
    public DenominationBreakdownDto? DenominationBreakdown { get; set; }

    /// <summary>
    /// Optional notes about closing the drawer
    /// </summary>
    [MaxLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
    public string? Notes { get; set; }
}

/// <summary>
/// DTO for denomination breakdown
/// </summary>
public class DenominationBreakdownDto
{
    /// <summary>
    /// Bills counted: denomination -> count
    /// Example: { "100": 5, "50": 10, "20": 15 }
    /// </summary>
    public Dictionary<string, int> Bills { get; set; } = new();

    /// <summary>
    /// Coins counted: denomination -> count
    /// Example: { "1": 20, "0.5": 10, "0.25": 40 }
    /// </summary>
    public Dictionary<string, int> Coins { get; set; } = new();
}
