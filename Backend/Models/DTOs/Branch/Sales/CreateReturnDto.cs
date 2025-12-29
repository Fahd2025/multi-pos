using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Branch.Sales;

/// <summary>
/// DTO for creating a return (full or partial)
/// </summary>
public class CreateReturnDto
{
    /// <summary>
    /// ID of the original sale to return items from
    /// </summary>
    [Required(ErrorMessage = "Original sale ID is required")]
    public Guid OriginalSaleId { get; set; }

    /// <summary>
    /// Reason for the return
    /// </summary>
    [Required(ErrorMessage = "Return reason is required")]
    [MaxLength(100, ErrorMessage = "Return reason cannot exceed 100 characters")]
    public string ReturnReason { get; set; } = string.Empty;

    /// <summary>
    /// Additional notes about the return
    /// </summary>
    [MaxLength(500, ErrorMessage = "Return notes cannot exceed 500 characters")]
    public string? ReturnNotes { get; set; }

    /// <summary>
    /// Items to be returned
    /// </summary>
    [Required(ErrorMessage = "At least one item must be returned")]
    [MinLength(1, ErrorMessage = "At least one item must be returned")]
    public List<ReturnItemDto> Items { get; set; } = new();
}
