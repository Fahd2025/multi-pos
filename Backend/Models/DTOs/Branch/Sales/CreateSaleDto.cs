using System.ComponentModel.DataAnnotations;
using Backend.Models.Entities.Branch;

namespace Backend.Models.DTOs.Branch.Sales;

public class CreateSaleDto
{
    public Guid? CustomerId { get; set; }

    [Required]
    public InvoiceType InvoiceType { get; set; }

    [MaxLength(50)]
    public string? OrderNumber { get; set; }

    public OrderType? OrderType { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "At least one line item is required")]
    public List<CreateSaleLineItemDto> LineItems { get; set; } = new();

    [Required]
    public PaymentMethod PaymentMethod { get; set; }

    [MaxLength(200)]
    public string? PaymentReference { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Amount paid cannot be negative")]
    public decimal? AmountPaid { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Change returned cannot be negative")]
    public decimal? ChangeReturned { get; set; }

    // Invoice-level discount (applied to entire invoice)
    public DiscountType InvoiceDiscountType { get; set; } = DiscountType.None;

    [Range(0, double.MaxValue, ErrorMessage = "Discount value cannot be negative")]
    public decimal InvoiceDiscountValue { get; set; } = 0;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    // Table information (for dine-in orders)
    public int? TableId { get; set; }
    public int? TableNumber { get; set; }
    public int? GuestCount { get; set; }

    // Delivery information (for delivery orders)
    public CreateDeliveryDto? DeliveryInfo { get; set; }
}

public class CreateDeliveryDto
{
    public Guid? CustomerId { get; set; }

    [MaxLength(500)]
    public string? DeliveryAddress { get; set; }

    [MaxLength(500)]
    public string? PickupAddress { get; set; }

    [MaxLength(1000)]
    public string? SpecialInstructions { get; set; }

    public int? EstimatedDeliveryMinutes { get; set; }

    public int Priority { get; set; } = 1; // 1 = Normal, 2 = High, 3 = Urgent
}

public class CreateSaleLineItemDto
{
    [Required]
    public Guid ProductId { get; set; }

    [MaxLength(100)]
    public string? Barcode { get; set; }

    [MaxLength(50)]
    public string? Unit { get; set; }

    [Required]
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
    public int Quantity { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Unit price must be greater than 0")]
    public decimal UnitPrice { get; set; }

    [Required]
    public DiscountType DiscountType { get; set; } = DiscountType.None;

    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Discount value cannot be negative")]
    public decimal DiscountValue { get; set; } = 0;

    [MaxLength(500)]
    public string? Notes { get; set; }
}
