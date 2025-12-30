using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.CashDrawer;

/// <summary>
/// DTO for opening a cash drawer
/// </summary>
public class OpenDrawerDto
{
    /// <summary>
    /// Initial cash amount when opening the drawer
    /// </summary>
    [Required(ErrorMessage = "Opening balance is required")]
    [Range(0, double.MaxValue, ErrorMessage = "Opening balance must be positive")]
    public decimal OpeningBalance { get; set; }

    /// <summary>
    /// Optional notes about opening the drawer
    /// </summary>
    [MaxLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
    public string? Notes { get; set; }
}
