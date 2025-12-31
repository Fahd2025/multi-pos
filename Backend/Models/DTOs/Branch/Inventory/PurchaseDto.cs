namespace Backend.Models.DTOs.Branch.Inventory;

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

    // Discount fields
    public string DiscountType { get; set; } = "amount";
    public decimal DiscountValue { get; set; }
    public decimal DiscountAmount { get; set; }

    // Tax fields
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public bool TaxIncluded { get; set; }

    // Totals
    public decimal Subtotal { get; set; }
    public decimal GrandTotal { get; set; }

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

    // Discount fields
    public string DiscountType { get; set; } = "amount";
    public decimal DiscountValue { get; set; } = 0;
    public decimal DiscountAmount { get; set; } = 0;

    // Tax fields
    public decimal TaxRate { get; set; } = 0;
    public decimal TaxAmount { get; set; } = 0;
    public bool TaxIncluded { get; set; } = false;

    // Totals
    public decimal Subtotal { get; set; } = 0;
    public decimal GrandTotal { get; set; } = 0;

    // PHASE 5: Payment tracking
    public int PaymentStatus { get; set; } = 0; // 0=Pending, 1=Partial, 2=Paid
    public decimal AmountPaid { get; set; } = 0;

    // PHASE 6: Invoice image upload (base64 encoded)
    public string? InvoiceImageBase64 { get; set; }
    public string? InvoiceImageFileName { get; set; }
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

/// <summary>
/// DTO for updating an existing purchase
/// </summary>
public class UpdatePurchaseDto
{
    public string PurchaseOrderNumber { get; set; } = string.Empty;
    public Guid SupplierId { get; set; }
    public DateTime PurchaseDate { get; set; }
    public string? Notes { get; set; }
    public List<CreatePurchaseLineItemDto> LineItems { get; set; } = new();

    // Discount fields
    public string DiscountType { get; set; } = "amount";
    public decimal DiscountValue { get; set; } = 0;
    public decimal DiscountAmount { get; set; } = 0;

    // Tax fields
    public decimal TaxRate { get; set; } = 0;
    public decimal TaxAmount { get; set; } = 0;
    public bool TaxIncluded { get; set; } = false;

    // Totals
    public decimal Subtotal { get; set; } = 0;
    public decimal GrandTotal { get; set; } = 0;

    // PHASE 5: Payment tracking
    public int PaymentStatus { get; set; } = 0; // 0=Pending, 1=Partial, 2=Paid
    public decimal AmountPaid { get; set; } = 0;

    // PHASE 6: Invoice image upload (base64 encoded)
    public string? InvoiceImageBase64 { get; set; }
    public string? InvoiceImageFileName { get; set; }
}
