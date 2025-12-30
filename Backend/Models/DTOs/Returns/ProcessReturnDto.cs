using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Returns;

/// <summary>
/// DTO for processing a return (completing the refund)
/// </summary>
public class ProcessReturnDto
{
    /// <summary>
    /// Refund method (Cash, Card, StoreCredit)
    /// </summary>
    [Required(ErrorMessage = "Refund method is required")]
    [MaxLength(50, ErrorMessage = "Refund method cannot exceed 50 characters")]
    public string RefundMethod { get; set; } = string.Empty;

    /// <summary>
    /// Reference number for the refund (transaction ID, credit note number, etc.)
    /// </summary>
    [MaxLength(100, ErrorMessage = "Reference cannot exceed 100 characters")]
    public string? RefundReference { get; set; }

    /// <summary>
    /// Whether to restock the items
    /// </summary>
    public bool RestockItems { get; set; } = true;

    /// <summary>
    /// Optional notes
    /// </summary>
    [MaxLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
    public string? Notes { get; set; }
}
