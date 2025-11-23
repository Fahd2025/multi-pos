namespace Backend.Models.DTOs.Sales;

public class SalesStatsDto
{
    public PeriodDto Period { get; set; } = new();
    public decimal TotalSales { get; set; }
    public int TotalTransactions { get; set; }
    public decimal AverageTransactionValue { get; set; }
    public decimal TotalTax { get; set; }
    public decimal TotalDiscounts { get; set; }
    public Dictionary<string, decimal> SalesByPaymentMethod { get; set; } = new();
    public Dictionary<string, decimal> SalesByInvoiceType { get; set; } = new();
    public List<TopProductDto> TopProducts { get; set; } = new();
    public List<TopCashierDto> TopCashiers { get; set; } = new();
    public List<SalesTrendDto> SalesTrend { get; set; } = new();
}

public class PeriodDto
{
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
}

public class TopProductDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class TopCashierDto
{
    public Guid CashierId { get; set; }
    public string CashierName { get; set; } = string.Empty;
    public decimal TotalSales { get; set; }
    public int TransactionCount { get; set; }
}

public class SalesTrendDto
{
    public string Date { get; set; } = string.Empty;
    public decimal Sales { get; set; }
    public int Transactions { get; set; }
}
