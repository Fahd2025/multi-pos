namespace Backend.Models.DTOs.Returns;

/// <summary>
/// DTO for return information
/// </summary>
public class ReturnDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public Guid OriginalSaleId { get; set; }
    public string OriginalSaleInvoiceNumber { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public DateTime ReturnDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal RestockingFee { get; set; }
    public decimal Total { get; set; }
    public string? RefundMethod { get; set; }
    public string? RefundReference { get; set; }
    public Guid ProcessedBy { get; set; }
    public string ProcessedByUsername { get; set; } = string.Empty;
    public Guid? ApprovedBy { get; set; }
    public string? ApprovedByUsername { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Notes { get; set; }
    public Guid? ReturnPolicyId { get; set; }
    public bool IsExchange { get; set; }
    public Guid? ExchangeSaleId { get; set; }
    public List<ReturnLineItemDto> LineItems { get; set; } = new();
}

/// <summary>
/// DTO for return line item information
/// </summary>
public class ReturnLineItemDto
{
    public Guid Id { get; set; }
    public Guid ReturnId { get; set; }
    public Guid SaleLineItemId { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSKU { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountValue { get; set; }
    public string Condition { get; set; } = string.Empty;
    public decimal LineTotal { get; set; }
    public string? Notes { get; set; }
    public bool Restocked { get; set; }
    public DateTime? RestockedAt { get; set; }
}
