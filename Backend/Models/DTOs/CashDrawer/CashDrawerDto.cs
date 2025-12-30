namespace Backend.Models.DTOs.CashDrawer;

/// <summary>
/// DTO for cash drawer information
/// </summary>
public class CashDrawerDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public Guid OpenedBy { get; set; }
    public string OpenedByUsername { get; set; } = string.Empty;
    public DateTime OpenedAt { get; set; }
    public decimal OpeningBalance { get; set; }
    public Guid? ClosedBy { get; set; }
    public string? ClosedByUsername { get; set; }
    public DateTime? ClosedAt { get; set; }
    public decimal ExpectedCash { get; set; }
    public decimal? ActualCash { get; set; }
    public decimal? Variance { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? DenominationBreakdown { get; set; }
    public string? Notes { get; set; }
    public List<CashTransactionDto> Transactions { get; set; } = new();
    public int SalesCount { get; set; }
    public int TotalTransactionCount { get; set; } // Sales + CashTransactions
}

/// <summary>
/// DTO for cash transaction information
/// </summary>
public class CashTransactionDto
{
    public Guid Id { get; set; }
    public Guid CashDrawerId { get; set; }
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public Guid CreatedBy { get; set; }
    public string CreatedByUsername { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
}
