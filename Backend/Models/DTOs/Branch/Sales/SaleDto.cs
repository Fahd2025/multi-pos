using Backend.Models.Entities.Branch;

namespace Backend.Models.DTOs.Branch.Sales;

public class SaleDto
{
    public Guid Id { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public string? InvoiceNumber { get; set; }
    public string? OrderNumber { get; set; }
    public InvoiceType InvoiceType { get; set; }
    public OrderType? OrderType { get; set; }
    public string? OrderTypeName { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public Guid CashierId { get; set; }
    public string CashierName { get; set; } = string.Empty;
    public DateTime SaleDate { get; set; }
    public List<SaleLineItemDto> LineItems { get; set; } = new();
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal Total { get; set; }
    public decimal? AmountPaid { get; set; }
    public decimal? ChangeReturned { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string PaymentMethodName { get; set; } = string.Empty;
    public string? PaymentReference { get; set; }
    public string? Notes { get; set; }
    public bool IsVoided { get; set; }
    public DateTime? VoidedAt { get; set; }
    public Guid? VoidedBy { get; set; }
    public string? VoidReason { get; set; }
    public DateTime CreatedAt { get; set; }
}
