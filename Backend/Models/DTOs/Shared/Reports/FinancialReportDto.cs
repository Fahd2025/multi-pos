namespace Backend.Models.DTOs.Shared.Reports;

/// <summary>
/// Financial report response DTO
/// </summary>
public class FinancialReportDto
{
    public string ReportType { get; set; } = "financial";
    public DateTime GeneratedAt { get; set; }
    public DateRangeDto DateRange { get; set; } = new();
    public FinancialReportFiltersDto Filters { get; set; } = new();
    public FinancialReportSummaryDto Summary { get; set; } = new();
    public RevenueBreakdownDto RevenueBreakdown { get; set; } = new();
    public List<ExpenseCategoryBreakdownDto> ExpenseBreakdown { get; set; } = new();
    public List<FinancialTimeSeriesDto> TimeSeriesData { get; set; } = new();
}

public class FinancialReportFiltersDto
{
    public Guid? BranchId { get; set; }
    public string? BranchName { get; set; }
}

public class FinancialReportSummaryDto
{
    public decimal TotalRevenue { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal ProfitMargin { get; set; }
    public decimal NetProfit { get; set; }
    public decimal TaxCollected { get; set; }
    public decimal AverageDailyRevenue { get; set; }
}

public class RevenueBreakdownDto
{
    public decimal Sales { get; set; }
    public decimal Other { get; set; }
}

public class ExpenseCategoryBreakdownDto
{
    public string CategoryName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal Percentage { get; set; }
}

public class FinancialTimeSeriesDto
{
    public string Period { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public decimal Expenses { get; set; }
    public decimal Profit { get; set; }
    public decimal ProfitMargin { get; set; }
}
