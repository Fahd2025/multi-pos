using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Sales;

public class VoidSaleDto
{
    [Required]
    [MaxLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
    public string Reason { get; set; } = string.Empty;
}
