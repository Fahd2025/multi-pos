namespace Backend.Models.DTOs.CashDrawer;

/// <summary>
/// DTO for cash drawer reconciliation report
/// </summary>
public class ReconciliationReportDto
{
    public Guid CashDrawerId { get; set; }
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string OpenedByUsername { get; set; } = string.Empty;
    public string? ClosedByUsername { get; set; }

    // Opening information
    public decimal OpeningBalance { get; set; }

    // Sales information
    public decimal TotalCashSales { get; set; }
    public int CashSalesCount { get; set; }

    // Transaction information
    public decimal TotalDeposits { get; set; }
    public decimal TotalWithdrawals { get; set; }
    public decimal TotalPettyCash { get; set; }
    public List<CashTransactionDto> Transactions { get; set; } = new();

    // Expected vs actual
    public decimal ExpectedCash { get; set; }
    public decimal? ActualCash { get; set; }
    public decimal? Variance { get; set; }
    public string? VarianceReason { get; set; }

    // Status
    public string Status { get; set; } = string.Empty;
    public bool RequiresManagerApproval { get; set; }

    // Denomination breakdown
    public string? DenominationBreakdown { get; set; }
    public string? Notes { get; set; }
}
