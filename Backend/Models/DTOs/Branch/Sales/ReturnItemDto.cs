using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Branch.Sales;

/// <summary>
/// DTO for an item being returned
/// </summary>
public class ReturnItemDto
{
    /// <summary>
    /// ID of the original sale line item being returned
    /// </summary>
    [Required(ErrorMessage = "Sale item ID is required")]
    public Guid SaleItemId { get; set; }

    /// <summary>
    /// Product ID (for validation)
    /// </summary>
    [Required(ErrorMessage = "Product ID is required")]
    public Guid ProductId { get; set; }

    /// <summary>
    /// Quantity to return
    /// </summary>
    [Required(ErrorMessage = "Return quantity is required")]
    [Range(1, int.MaxValue, ErrorMessage = "Return quantity must be at least 1")]
    public int ReturnQuantity { get; set; }

    /// <summary>
    /// Unit price at time of original sale
    /// </summary>
    [Required(ErrorMessage = "Unit price is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Unit price must be greater than 0")]
    public decimal UnitPrice { get; set; }
}
