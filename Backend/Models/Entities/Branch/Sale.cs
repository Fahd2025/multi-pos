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

    // Table Management Properties
    public int? TableId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Table number must be positive")]
    public int? TableNumber { get; set; }

    [Range(1, 100, ErrorMessage = "Guest count must be between 1 and 100")]
    public int? GuestCount { get; set; }

    // Order Status
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "open"; // open, completed, cancelled, returned, partially_returned

    public DateTime? CompletedAt { get; set; }

    // Return Management Properties
    [Required]
    public bool IsReturn { get; set; } = false;

    public DateTime? ReturnDate { get; set; }

    [MaxLength(100)]
    public string? ReturnReason { get; set; } // damaged, wrong_item, customer_request, quality_issue, expired, other

    [MaxLength(500)]
    public string? ReturnNotes { get; set; }

    public Guid? OriginalSaleId { get; set; } // Reference to the original sale for returns

    public Guid? ReturnApprovedBy { get; set; } // Manager/User who approved the return

    // Navigation properties
    public Customer? Customer { get; set; }
    public ICollection<SaleLineItem> LineItems { get; set; } = new List<SaleLineItem>();
    public DeliveryOrder? DeliveryOrder { get; set; }
    public Table? Table { get; set; }

    // Self-referencing relationships for returns
    public Sale? OriginalSale { get; set; } // The original sale (if this is a return)
    public ICollection<Sale> ReturnedSales { get; set; } = new List<Sale>(); // Returns made against this sale
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
