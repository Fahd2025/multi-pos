namespace Backend.Models.DTOs.Reports;

/// <summary>
/// Inventory report response DTO
/// </summary>
public class InventoryReportDto
{
    public string ReportType { get; set; } = "inventory";
    public DateTime GeneratedAt { get; set; }
    public InventoryReportFiltersDto Filters { get; set; } = new();
    public InventoryReportSummaryDto Summary { get; set; } = new();
    public List<InventoryProductDto> Products { get; set; } = new();
    public List<StockMovementDto> StockMovements { get; set; } = new();
}

public class InventoryReportFiltersDto
{
    public Guid? BranchId { get; set; }
    public string? BranchName { get; set; }
    public Guid? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public bool LowStockOnly { get; set; }
    public bool NegativeStockOnly { get; set; }
}

public class InventoryReportSummaryDto
{
    public int TotalProducts { get; set; }
    public int TotalCategories { get; set; }
    public decimal TotalStockValue { get; set; }
    public int LowStockCount { get; set; }
    public int OutOfStockCount { get; set; }
    public int NegativeStockCount { get; set; }
    public decimal AverageStockValue { get; set; }
}

public class InventoryProductDto
{
    public Guid ProductId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? CategoryName { get; set; }
    public int CurrentStock { get; set; }
    public int MinStockThreshold { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal StockValue { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? LastRestockedAt { get; set; }
    public bool DiscrepancyFlag { get; set; }
}

public class StockMovementDto
{
    public DateTime Date { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int QuantityChange { get; set; }
    public string? ReferenceId { get; set; }
    public string? Notes { get; set; }
}
