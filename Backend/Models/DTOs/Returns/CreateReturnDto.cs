using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Returns;

/// <summary>
/// DTO for creating a new return
/// </summary>
public class CreateReturnDto
{
    /// <summary>
    /// Original sale ID being returned
    /// </summary>
    [Required(ErrorMessage = "Original sale ID is required")]
    public Guid OriginalSaleId { get; set; }

    /// <summary>
    /// Reason for the return
    /// </summary>
    [Required(ErrorMessage = "Return reason is required")]
    [MaxLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Items being returned
    /// </summary>
    [Required(ErrorMessage = "At least one item is required")]
    [MinLength(1, ErrorMessage = "At least one item is required")]
    public List<CreateReturnLineItemDto> LineItems { get; set; } = new();

    /// <summary>
    /// Optional notes
    /// </summary>
    [MaxLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
    public string? Notes { get; set; }
}

/// <summary>
/// DTO for creating a return line item
/// </summary>
public class CreateReturnLineItemDto
{
    /// <summary>
    /// Sale line item ID being returned
    /// </summary>
    [Required(ErrorMessage = "Sale line item ID is required")]
    public Guid SaleLineItemId { get; set; }

    /// <summary>
    /// Quantity to return
    /// </summary>
    [Required(ErrorMessage = "Quantity is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
    public int Quantity { get; set; }

    /// <summary>
    /// Condition of the returned item
    /// </summary>
    [Required(ErrorMessage = "Condition is required")]
    [MaxLength(50, ErrorMessage = "Condition cannot exceed 50 characters")]
    public string Condition { get; set; } = "New";

    /// <summary>
    /// Optional notes about this item
    /// </summary>
    [MaxLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
    public string? Notes { get; set; }
}
