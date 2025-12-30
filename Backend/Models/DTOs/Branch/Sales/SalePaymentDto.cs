using System.ComponentModel.DataAnnotations;
using Backend.Models.Entities.Branch;

namespace Backend.Models.DTOs.Branch.Sales;

/// <summary>
/// DTO for a single payment in a sale transaction (supports split payments)
/// </summary>
public class SalePaymentDto
{
    public Guid Id { get; set; }
    public Guid SaleId { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public decimal Amount { get; set; }
    public string? Reference { get; set; }
    public DateTime ProcessedAt { get; set; }
    public Guid ProcessedBy { get; set; }
    public string ProcessedByUsername { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

/// <summary>
/// DTO for creating a payment (used in split payment scenarios)
/// </summary>
public class CreateSalePaymentDto
{
    [Required(ErrorMessage = "Payment method is required")]
    public PaymentMethod PaymentMethod { get; set; }

    [Required(ErrorMessage = "Payment amount is required")]
    [Range(0.01, double.MaxValue, ErrorMessage = "Payment amount must be greater than 0")]
    public decimal Amount { get; set; }

    [MaxLength(100, ErrorMessage = "Reference cannot exceed 100 characters")]
    public string? Reference { get; set; }

    [MaxLength(500, ErrorMessage = "Notes cannot exceed 500 characters")]
    public string? Notes { get; set; }
}
