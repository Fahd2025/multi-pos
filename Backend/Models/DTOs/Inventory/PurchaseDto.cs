namespace Backend.Models.DTOs.Inventory;

/// <summary>
/// Data transfer object for Purchase entity
/// </summary>
public class PurchaseDto
{
    public Guid Id { get; set; }
    public string PurchaseOrderNumber { get; set; } = string.Empty;
    public Guid SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public DateTime PurchaseDate { get; set; }
    public DateTime? ReceivedDate { get; set; }
    public decimal TotalCost { get; set; }
    public int PaymentStatus { get; set; } // 0=Pending, 1=Partial, 2=Paid
    public string PaymentStatusText { get; set; } = string.Empty;
    public decimal AmountPaid { get; set; }
    public decimal AmountDue => TotalCost - AmountPaid;
    public string? InvoiceImagePath { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public List<PurchaseLineItemDto> LineItems { get; set; } = new();
}

/// <summary>
/// Data transfer object for PurchaseLineItem entity
/// </summary>
public class PurchaseLineItemDto
{
    public Guid Id { get; set; }
    public Guid PurchaseId { get; set; }
    public Guid ProductId { get; set; }
    public string? ProductNameEn { get; set; }
    public string? ProductNameAr { get; set; }
    public string? ProductSKU { get; set; }
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal LineTotal { get; set; }
}

/// <summary>
/// DTO for creating a new purchase
/// </summary>
public class CreatePurchaseDto
{
    public string PurchaseOrderNumber { get; set; } = string.Empty;
    public Guid SupplierId { get; set; }
    public DateTime PurchaseDate { get; set; }
    public string? Notes { get; set; }
    public List<CreatePurchaseLineItemDto> LineItems { get; set; } = new();
}

/// <summary>
/// DTO for creating a purchase line item
/// </summary>
public class CreatePurchaseLineItemDto
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
}
