namespace Backend.Models.DTOs.Branch.Sales;

/// <summary>
/// Response DTO after successfully processing a return
/// </summary>
public class ReturnResponseDto
{
    /// <summary>
    /// Success message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Return order number (e.g., RET-ORD-20251229-123456-1735467890)
    /// </summary>
    public string ReturnOrderNumber { get; set; } = string.Empty;

    /// <summary>
    /// ID of the created return sale
    /// </summary>
    public Guid ReturnSaleId { get; set; }

    /// <summary>
    /// Total refund amount
    /// </summary>
    public decimal RefundAmount { get; set; }

    /// <summary>
    /// ID of the original sale
    /// </summary>
    public Guid OriginalSaleId { get; set; }

    /// <summary>
    /// Transaction/Invoice ID for the return
    /// </summary>
    public string? ReturnTransactionId { get; set; }

    /// <summary>
    /// Timestamp when the return was processed
    /// </summary>
    public DateTime ReturnDate { get; set; } = DateTime.UtcNow;
}
