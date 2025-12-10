using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class Sale
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string TransactionId { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? InvoiceNumber { get; set; }

    [MaxLength(50)]
    public string? OrderNumber { get; set; }

    [Required]
    public InvoiceType InvoiceType { get; set; }

    public OrderType? OrderType { get; set; }

    public Guid? CustomerId { get; set; }

    [Required]
    public Guid CashierId { get; set; }

    public Guid? UserId { get; set; }

    [Required]
    public DateTime SaleDate { get; set; } = DateTime.UtcNow;

    [Required]
    public decimal Subtotal { get; set; }

    [Required]
    public decimal TaxAmount { get; set; }

    [Required]
    public decimal TotalDiscount { get; set; } = 0;

    [Required]
    public decimal Total { get; set; }

    public decimal? AmountPaid { get; set; }

    public decimal? ChangeReturned { get; set; }

    [Required]
    public PaymentMethod PaymentMethod { get; set; }

    [MaxLength(200)]
    public string? PaymentReference { get; set; }

    public string? Notes { get; set; }

    [Required]
    public bool IsVoided { get; set; } = false;

    public DateTime? VoidedAt { get; set; }

    public Guid? VoidedBy { get; set; }

    [MaxLength(500)]
    public string? VoidReason { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Customer? Customer { get; set; }
    public ICollection<SaleLineItem> LineItems { get; set; } = new List<SaleLineItem>();
}

public enum InvoiceType
{
    Touch = 0,
    Standard = 1,
}

public enum PaymentMethod
{
    Cash = 0,
    Card = 1,
    DigitalWallet = 2,
    BankTransfer = 3,
    Multiple = 4,
}

public enum OrderType
{
    TakeOut = 0,
    DineIn = 1,
    Delivery = 2,
}
