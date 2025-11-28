namespace Backend.Models.DTOs.Reports;

/// <summary>
/// Sales report response DTO
/// </summary>
public class SalesReportDto
{
    public string ReportType { get; set; } = "sales";
    public DateTime GeneratedAt { get; set; }
    public DateRangeDto DateRange { get; set; } = new();
    public SalesReportFiltersDto Filters { get; set; } = new();
    public SalesReportSummaryDto Summary { get; set; } = new();
    public List<TimeSeriesDataDto> TimeSeriesData { get; set; } = new();
    public List<TopProductDto> TopProducts { get; set; } = new();
    public List<TopCustomerDto> TopCustomers { get; set; } = new();
}

public class DateRangeDto
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class SalesReportFiltersDto
{
    public Guid? BranchId { get; set; }
    public string? BranchName { get; set; }
    public string? PaymentMethod { get; set; }
    public Guid? CashierId { get; set; }
    public string? CashierName { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
}

public class SalesReportSummaryDto
{
    public int TotalSales { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalTax { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal AverageSaleValue { get; set; }
    public string? TopPaymentMethod { get; set; }
    public Dictionary<string, PaymentMethodStatsDto> SalesByPaymentMethod { get; set; } = new();
}

public class PaymentMethodStatsDto
{
    public int Count { get; set; }
    public decimal Amount { get; set; }
}

public class TimeSeriesDataDto
{
    public string Period { get; set; } = string.Empty;
    public int SalesCount { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalTax { get; set; }
    public decimal AverageSaleValue { get; set; }
}

public class TopProductDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class TopCustomerDto
{
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int PurchaseCount { get; set; }
    public decimal TotalSpent { get; set; }
}
