using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Branch.Sales;

/// <summary>
/// DTO for updating payment information on an existing sale
/// </summary>
public class UpdateSalePaymentDto
{
    /// <summary>
    /// Payment method (0=Cash, 1=CreditCard, 2=DebitCard, 3=MobilePayment)
    /// </summary>
    [Required]
    public int PaymentMethod { get; set; }

    /// <summary>
    /// Amount paid by customer
    /// </summary>
    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Amount paid must be non-negative")]
    public decimal AmountPaid { get; set; }

    /// <summary>
    /// Change returned to customer (for cash payments)
    /// </summary>
    public decimal? ChangeReturned { get; set; }

    /// <summary>
    /// Discount type (0=None, 1=Percentage, 2=Amount)
    /// </summary>
    public int? DiscountType { get; set; }

    /// <summary>
    /// Discount value
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "Discount value must be non-negative")]
    public decimal? DiscountValue { get; set; }
}
