using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class Purchase
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string PurchaseOrderNumber { get; set; } = string.Empty;

    [Required]
    public Guid SupplierId { get; set; }

    [Required]
    public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;

    public DateTime? ReceivedDate { get; set; }

    [Required]
    public decimal TotalCost { get; set; }

    [Required]
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    [Required]
    public decimal AmountPaid { get; set; } = 0;

    [MaxLength(500)]
    public string? InvoiceImagePath { get; set; }

    public string? Notes { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public Guid CreatedBy { get; set; }

    // Navigation properties
    public Supplier Supplier { get; set; } = null!;
    public ICollection<PurchaseLineItem> LineItems { get; set; } = new List<PurchaseLineItem>();
}

public enum PaymentStatus
{
    Pending = 0,
    Partial = 1,
    Paid = 2
}
