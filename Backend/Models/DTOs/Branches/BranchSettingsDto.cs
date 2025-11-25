using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Branches;

/// <summary>
/// Data transfer object for branch settings (localization and tax configuration)
/// </summary>
public class BranchSettingsDto
{
    [Required(ErrorMessage = "Language is required")]
    [StringLength(10, ErrorMessage = "Language code cannot exceed 10 characters")]
    [RegularExpression(@"^(en|ar)$", ErrorMessage = "Language must be 'en' or 'ar'")]
    public string Language { get; set; } = "en";

    [Required(ErrorMessage = "Currency is required")]
    [StringLength(10, ErrorMessage = "Currency code cannot exceed 10 characters")]
    public string Currency { get; set; } = "USD";

    [Required(ErrorMessage = "Time zone is required")]
    [StringLength(100, ErrorMessage = "Time zone cannot exceed 100 characters")]
    public string TimeZone { get; set; } = "UTC";

    [Required(ErrorMessage = "Date format is required")]
    [StringLength(50, ErrorMessage = "Date format cannot exceed 50 characters")]
    public string DateFormat { get; set; } = "MM/DD/YYYY";

    [Required(ErrorMessage = "Number format is required")]
    [StringLength(50, ErrorMessage = "Number format cannot exceed 50 characters")]
    public string NumberFormat { get; set; } = "en-US";

    [Required(ErrorMessage = "Tax rate is required")]
    [Range(0, 100, ErrorMessage = "Tax rate must be between 0 and 100")]
    public decimal TaxRate { get; set; } = 0;
}
