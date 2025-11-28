using Backend.Data;
using Backend.Models.DTOs.Reports;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace Backend.Services.Reports;

/// <summary>
/// Service implementation for generating reports and analytics
/// </summary>
public class ReportService : IReportService
{
    private readonly DbContextFactory _dbContextFactory;

    public ReportService(DbContextFactory dbContextFactory)
    {
        _dbContextFactory = dbContextFactory;
    }

    /// <summary>
    /// Generates a sales report with optional filters
    /// </summary>
    public async Task<SalesReportDto> GenerateSalesReportAsync(
        SalesReportRequestDto request,
        Guid? branchId,
        bool isHeadOfficeAdmin)
    {
        // Determine which branch to query
        var targetBranchId = isHeadOfficeAdmin && request.BranchId.HasValue
            ? request.BranchId.Value
            : branchId ?? throw new UnauthorizedAccessException("Branch ID is required");

        // Get branch context
        var branchDb = await _dbContextFactory.CreateBranchDbContextAsync(targetBranchId);

        // Set default date range (last 30 days)
        var startDate = request.StartDate ?? DateTime.UtcNow.AddDays(-30);
        var endDate = request.EndDate ?? DateTime.UtcNow;

        // Validate date range
        if (endDate < startDate)
            throw new ArgumentException("End date must be after start date");

        if ((endDate - startDate).TotalDays > 365)
            throw new ArgumentException("Date range cannot exceed 1 year");

        // Build query
        var salesQuery = branchDb.Sales
            .Include(s => s.LineItems)
            .ThenInclude(li => li.Product)
            .Include(s => s.Customer)
            .Where(s => s.SaleDate >= startDate && s.SaleDate <= endDate);

        // Apply filters
        if (request.CashierId.HasValue)
            salesQuery = salesQuery.Where(s => s.CashierId == request.CashierId.Value);

        if (request.CustomerId.HasValue)
            salesQuery = salesQuery.Where(s => s.CustomerId == request.CustomerId.Value);

        if (!string.IsNullOrEmpty(request.PaymentMethod))
            salesQuery = salesQuery.Where(s => s.PaymentMethod == request.PaymentMethod);

        var sales = await salesQuery.ToListAsync();

        // Calculate summary statistics
        var totalSales = sales.Count;
        var totalRevenue = sales.Sum(s => s.TotalAmount);
        var totalTax = sales.Sum(s => s.TaxAmount);
        var totalDiscount = sales.Sum(s => s.DiscountAmount);
        var averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

        // Payment method breakdown
        var paymentMethodStats = sales
            .GroupBy(s => s.PaymentMethod)
            .ToDictionary(
                g => g.Key,
                g => new PaymentMethodStatsDto
                {
                    Count = g.Count(),
                    Amount = g.Sum(s => s.TotalAmount)
                }
            );

        var topPaymentMethod = paymentMethodStats
            .OrderByDescending(pm => pm.Value.Count)
            .FirstOrDefault().Key;

        // Time series data
        var groupBy = request.GroupBy?.ToLower() ?? "day";
        var timeSeriesData = GenerateTimeSeriesData(sales, groupBy, startDate, endDate);

        // Top products
        var topProducts = sales
            .SelectMany(s => s.LineItems)
            .GroupBy(li => new { li.ProductId, li.Product.NameEn })
            .Select(g => new TopProductDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.NameEn,
                QuantitySold = g.Sum(li => li.Quantity),
                TotalRevenue = g.Sum(li => li.TotalPrice)
            })
            .OrderByDescending(p => p.TotalRevenue)
            .Take(10)
            .ToList();

        // Top customers
        var topCustomers = sales
            .Where(s => s.CustomerId.HasValue && s.Customer != null)
            .GroupBy(s => new { s.CustomerId, s.Customer!.NameEn })
            .Select(g => new TopCustomerDto
            {
                CustomerId = g.Key.CustomerId!.Value,
                CustomerName = g.Key.NameEn,
                PurchaseCount = g.Count(),
                TotalSpent = g.Sum(s => s.TotalAmount)
            })
            .OrderByDescending(c => c.TotalSpent)
            .Take(10)
            .ToList();

        // Get branch name
        using var headOfficeDb = _dbContextFactory.CreateHeadOfficeDbContext();
        var branch = await headOfficeDb.Branches.FindAsync(targetBranchId);

        return new SalesReportDto
        {
            ReportType = "sales",
            GeneratedAt = DateTime.UtcNow,
            DateRange = new DateRangeDto
            {
                StartDate = startDate,
                EndDate = endDate
            },
            Filters = new SalesReportFiltersDto
            {
                BranchId = targetBranchId,
                BranchName = branch?.NameEn,
                PaymentMethod = request.PaymentMethod,
                CashierId = request.CashierId,
                CustomerId = request.CustomerId
            },
            Summary = new SalesReportSummaryDto
            {
                TotalSales = totalSales,
                TotalRevenue = totalRevenue,
                TotalTax = totalTax,
                TotalDiscount = totalDiscount,
                AverageSaleValue = averageSaleValue,
                TopPaymentMethod = topPaymentMethod,
                SalesByPaymentMethod = paymentMethodStats
            },
            TimeSeriesData = timeSeriesData,
            TopProducts = topProducts,
            TopCustomers = topCustomers
        };
    }

    /// <summary>
    /// Generates an inventory report with stock levels and movements
    /// </summary>
    public async Task<InventoryReportDto> GenerateInventoryReportAsync(
        InventoryReportRequestDto request,
        Guid? branchId,
        bool isHeadOfficeAdmin)
    {
        // Determine which branch to query
        var targetBranchId = isHeadOfficeAdmin && request.BranchId.HasValue
            ? request.BranchId.Value
            : branchId ?? throw new UnauthorizedAccessException("Branch ID is required");

        // Get branch context
        var branchDb = await _dbContextFactory.CreateBranchDbContextAsync(targetBranchId);

        // Build query
        var productsQuery = branchDb.Products
            .Include(p => p.Category)
            .AsQueryable();

        // Apply filters
        if (request.CategoryId.HasValue)
            productsQuery = productsQuery.Where(p => p.CategoryId == request.CategoryId.Value);

        if (request.LowStockOnly)
            productsQuery = productsQuery.Where(p => p.StockQuantity < p.MinStockThreshold);

        if (request.NegativeStockOnly)
            productsQuery = productsQuery.Where(p => p.StockQuantity < 0);

        var products = await productsQuery.ToListAsync();

        // Calculate summary statistics
        var totalProducts = products.Count;
        var totalCategories = products.Select(p => p.CategoryId).Distinct().Count();
        var totalStockValue = products.Sum(p => p.StockQuantity * p.UnitPrice);
        var lowStockCount = products.Count(p => p.StockQuantity < p.MinStockThreshold && p.StockQuantity >= 0);
        var outOfStockCount = products.Count(p => p.StockQuantity == 0);
        var negativeStockCount = products.Count(p => p.StockQuantity < 0);
        var averageStockValue = totalProducts > 0 ? totalStockValue / totalProducts : 0;

        // Map products to DTOs
        var productDtos = products.Select(p => new InventoryProductDto
        {
            ProductId = p.Id,
            Sku = p.SKU,
            ProductName = p.NameEn,
            CategoryName = p.Category?.NameEn,
            CurrentStock = p.StockQuantity,
            MinStockThreshold = p.MinStockThreshold,
            UnitPrice = p.UnitPrice,
            StockValue = p.StockQuantity * p.UnitPrice,
            Status = GetStockStatus(p.StockQuantity, p.MinStockThreshold),
            LastRestockedAt = p.UpdatedAt,
            DiscrepancyFlag = p.StockQuantity < 0
        }).ToList();

        // Stock movements (if requested)
        var stockMovements = new List<StockMovementDto>();
        if (request.IncludeMovements)
        {
            var startDate = request.StartDate ?? DateTime.UtcNow.AddDays(-30);
            var endDate = request.EndDate ?? DateTime.UtcNow;

            // Get sales movements
            var salesMovements = await branchDb.Sales
                .Where(s => s.SaleDate >= startDate && s.SaleDate <= endDate)
                .SelectMany(s => s.LineItems.Select(li => new StockMovementDto
                {
                    Date = s.SaleDate,
                    ProductId = li.ProductId,
                    ProductName = li.Product.NameEn,
                    Type = "Sale",
                    QuantityChange = -li.Quantity,
                    ReferenceId = s.Id.ToString(),
                    Notes = "Sold via POS"
                }))
                .ToListAsync();

            // Get purchase movements
            var purchaseMovements = await branchDb.Purchases
                .Where(p => p.OrderDate >= startDate && p.OrderDate <= endDate && p.ReceivedAt.HasValue)
                .SelectMany(p => p.LineItems.Select(li => new StockMovementDto
                {
                    Date = p.ReceivedAt!.Value,
                    ProductId = li.ProductId,
                    ProductName = li.Product.NameEn,
                    Type = "Purchase",
                    QuantityChange = li.Quantity,
                    ReferenceId = p.Id.ToString(),
                    Notes = $"Restocked from {p.Supplier?.NameEn ?? "Supplier"}"
                }))
                .ToListAsync();

            stockMovements = salesMovements.Concat(purchaseMovements)
                .OrderByDescending(m => m.Date)
                .ToList();
        }

        // Get branch and category names
        using var headOfficeDb = _dbContextFactory.CreateHeadOfficeDbContext();
        var branch = await headOfficeDb.Branches.FindAsync(targetBranchId);
        var category = request.CategoryId.HasValue
            ? await branchDb.Categories.FindAsync(request.CategoryId.Value)
            : null;

        return new InventoryReportDto
        {
            ReportType = "inventory",
            GeneratedAt = DateTime.UtcNow,
            Filters = new InventoryReportFiltersDto
            {
                BranchId = targetBranchId,
                BranchName = branch?.NameEn,
                CategoryId = request.CategoryId,
                CategoryName = category?.NameEn,
                LowStockOnly = request.LowStockOnly,
                NegativeStockOnly = request.NegativeStockOnly
            },
            Summary = new InventoryReportSummaryDto
            {
                TotalProducts = totalProducts,
                TotalCategories = totalCategories,
                TotalStockValue = totalStockValue,
                LowStockCount = lowStockCount,
                OutOfStockCount = outOfStockCount,
                NegativeStockCount = negativeStockCount,
                AverageStockValue = averageStockValue
            },
            Products = productDtos,
            StockMovements = stockMovements
        };
    }

    /// <summary>
    /// Generates a financial report showing revenue, expenses, and profit
    /// </summary>
    public async Task<FinancialReportDto> GenerateFinancialReportAsync(
        FinancialReportRequestDto request,
        Guid? branchId,
        bool isHeadOfficeAdmin)
    {
        // Determine which branch to query
        var targetBranchId = isHeadOfficeAdmin && request.BranchId.HasValue
            ? request.BranchId.Value
            : branchId ?? throw new UnauthorizedAccessException("Branch ID is required");

        // Get branch context
        var branchDb = await _dbContextFactory.CreateBranchDbContextAsync(targetBranchId);

        // Set default date range (current month)
        var now = DateTime.UtcNow;
        var startDate = request.StartDate ?? new DateTime(now.Year, now.Month, 1);
        var endDate = request.EndDate ?? now;

        // Validate date range
        if (endDate < startDate)
            throw new ArgumentException("End date must be after start date");

        if ((endDate - startDate).TotalDays > 365)
            throw new ArgumentException("Date range cannot exceed 1 year");

        // Get sales (revenue)
        var sales = await branchDb.Sales
            .Where(s => s.SaleDate >= startDate && s.SaleDate <= endDate)
            .ToListAsync();

        var totalRevenue = sales.Sum(s => s.TotalAmount);
        var taxCollected = sales.Sum(s => s.TaxAmount);

        // Get expenses
        var expenses = await branchDb.Expenses
            .Include(e => e.Category)
            .Where(e => e.ExpenseDate >= startDate && e.ExpenseDate <= endDate)
            .ToListAsync();

        var totalExpenses = expenses.Sum(e => e.Amount);

        // Calculate profit metrics
        var grossProfit = totalRevenue - totalExpenses;
        var profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        var netProfit = grossProfit; // Simplified (no additional deductions in current model)

        var daysDiff = (endDate - startDate).TotalDays;
        var averageDailyRevenue = daysDiff > 0 ? totalRevenue / (decimal)daysDiff : 0;

        // Revenue breakdown (simplified - all from sales)
        var revenueBreakdown = new RevenueBreakdownDto
        {
            Sales = totalRevenue,
            Other = 0
        };

        // Expense breakdown by category
        var expenseBreakdown = expenses
            .GroupBy(e => e.Category?.NameEn ?? "Uncategorized")
            .Select(g => new ExpenseCategoryBreakdownDto
            {
                CategoryName = g.Key,
                TotalAmount = g.Sum(e => e.Amount),
                Percentage = totalExpenses > 0 ? (g.Sum(e => e.Amount) / totalExpenses) * 100 : 0
            })
            .OrderByDescending(e => e.TotalAmount)
            .ToList();

        // Time series data
        var groupBy = request.GroupBy?.ToLower() ?? "month";
        var timeSeriesData = GenerateFinancialTimeSeriesData(sales, expenses, groupBy, startDate, endDate);

        // Get branch name
        using var headOfficeDb = _dbContextFactory.CreateHeadOfficeDbContext();
        var branch = await headOfficeDb.Branches.FindAsync(targetBranchId);

        return new FinancialReportDto
        {
            ReportType = "financial",
            GeneratedAt = DateTime.UtcNow,
            DateRange = new DateRangeDto
            {
                StartDate = startDate,
                EndDate = endDate
            },
            Filters = new FinancialReportFiltersDto
            {
                BranchId = targetBranchId,
                BranchName = branch?.NameEn
            },
            Summary = new FinancialReportSummaryDto
            {
                TotalRevenue = totalRevenue,
                TotalExpenses = totalExpenses,
                GrossProfit = grossProfit,
                ProfitMargin = profitMargin,
                NetProfit = netProfit,
                TaxCollected = taxCollected,
                AverageDailyRevenue = averageDailyRevenue
            },
            RevenueBreakdown = revenueBreakdown,
            ExpenseBreakdown = expenseBreakdown,
            TimeSeriesData = timeSeriesData
        };
    }

    /// <summary>
    /// Exports a report to the specified format (PDF, Excel, CSV)
    /// </summary>
    public async Task<(byte[] FileContent, string ContentType, string FileName)> ExportReportAsync(
        ExportReportRequestDto request,
        Guid? branchId,
        bool isHeadOfficeAdmin)
    {
        // Validate request
        if (string.IsNullOrEmpty(request.ReportType))
            throw new ArgumentException("Report type is required");

        if (string.IsNullOrEmpty(request.Format))
            throw new ArgumentException("Export format is required");

        var validFormats = new[] { "pdf", "excel", "csv" };
        if (!validFormats.Contains(request.Format.ToLower()))
            throw new ArgumentException("Invalid export format. Must be pdf, excel, or csv");

        // Generate report data based on type
        object reportData;
        switch (request.ReportType.ToLower())
        {
            case "sales":
                var salesRequest = new SalesReportRequestDto
                {
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    BranchId = GetFilterValue<Guid?>(request.Filters, "branchId"),
                    PaymentMethod = GetFilterValue<string>(request.Filters, "paymentMethod"),
                    CashierId = GetFilterValue<Guid?>(request.Filters, "cashierId"),
                    CustomerId = GetFilterValue<Guid?>(request.Filters, "customerId"),
                    GroupBy = GetFilterValue<string>(request.Filters, "groupBy")
                };
                reportData = await GenerateSalesReportAsync(salesRequest, branchId, isHeadOfficeAdmin);
                break;

            case "inventory":
                var inventoryRequest = new InventoryReportRequestDto
                {
                    BranchId = GetFilterValue<Guid?>(request.Filters, "branchId"),
                    CategoryId = GetFilterValue<Guid?>(request.Filters, "categoryId"),
                    LowStockOnly = GetFilterValue<bool>(request.Filters, "lowStockOnly"),
                    NegativeStockOnly = GetFilterValue<bool>(request.Filters, "negativeStockOnly"),
                    IncludeMovements = GetFilterValue<bool>(request.Filters, "includeMovements"),
                    StartDate = request.StartDate,
                    EndDate = request.EndDate
                };
                reportData = await GenerateInventoryReportAsync(inventoryRequest, branchId, isHeadOfficeAdmin);
                break;

            case "financial":
                var financialRequest = new FinancialReportRequestDto
                {
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    BranchId = GetFilterValue<Guid?>(request.Filters, "branchId"),
                    GroupBy = GetFilterValue<string>(request.Filters, "groupBy")
                };
                reportData = await GenerateFinancialReportAsync(financialRequest, branchId, isHeadOfficeAdmin);
                break;

            default:
                throw new ArgumentException($"Invalid report type: {request.ReportType}");
        }

        // Export based on format
        var format = request.Format.ToLower();
        var dateStamp = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var fileName = $"{request.ReportType}-report-{dateStamp}";

        return format switch
        {
            "pdf" => (
                GeneratePdfExport(reportData, request.Options),
                "application/pdf",
                $"{fileName}.pdf"
            ),
            "excel" => (
                GenerateExcelExport(reportData, request.Options),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"{fileName}.xlsx"
            ),
            "csv" => (
                GenerateCsvExport(reportData, request.Options),
                "text/csv",
                $"{fileName}.csv"
            ),
            _ => throw new ArgumentException($"Invalid format: {format}")
        };
    }

    #region Helper Methods

    private List<TimeSeriesDataDto> GenerateTimeSeriesData(
        List<Backend.Models.Entities.Branch.Sale> sales,
        string groupBy,
        DateTime startDate,
        DateTime endDate)
    {
        return groupBy switch
        {
            "day" => sales.GroupBy(s => s.SaleDate.Date)
                .Select(g => new TimeSeriesDataDto
                {
                    Period = g.Key.ToString("yyyy-MM-dd"),
                    SalesCount = g.Count(),
                    TotalRevenue = g.Sum(s => s.TotalAmount),
                    TotalTax = g.Sum(s => s.TaxAmount),
                    AverageSaleValue = g.Average(s => s.TotalAmount)
                })
                .OrderBy(t => t.Period)
                .ToList(),

            "week" => sales.GroupBy(s => GetWeekOfYear(s.SaleDate))
                .Select(g => new TimeSeriesDataDto
                {
                    Period = g.Key,
                    SalesCount = g.Count(),
                    TotalRevenue = g.Sum(s => s.TotalAmount),
                    TotalTax = g.Sum(s => s.TaxAmount),
                    AverageSaleValue = g.Average(s => s.TotalAmount)
                })
                .OrderBy(t => t.Period)
                .ToList(),

            "month" => sales.GroupBy(s => new { s.SaleDate.Year, s.SaleDate.Month })
                .Select(g => new TimeSeriesDataDto
                {
                    Period = $"{g.Key.Year}-{g.Key.Month:D2}",
                    SalesCount = g.Count(),
                    TotalRevenue = g.Sum(s => s.TotalAmount),
                    TotalTax = g.Sum(s => s.TaxAmount),
                    AverageSaleValue = g.Average(s => s.TotalAmount)
                })
                .OrderBy(t => t.Period)
                .ToList(),

            _ => throw new ArgumentException($"Invalid groupBy value: {groupBy}")
        };
    }

    private List<FinancialTimeSeriesDto> GenerateFinancialTimeSeriesData(
        List<Backend.Models.Entities.Branch.Sale> sales,
        List<Backend.Models.Entities.Branch.Expense> expenses,
        string groupBy,
        DateTime startDate,
        DateTime endDate)
    {
        return groupBy switch
        {
            "day" => Enumerable.Range(0, (int)(endDate - startDate).TotalDays + 1)
                .Select(offset => startDate.AddDays(offset).Date)
                .Select(date => {
                    var dayRevenue = sales.Where(s => s.SaleDate.Date == date).Sum(s => s.TotalAmount);
                    var dayExpenses = expenses.Where(e => e.ExpenseDate.Date == date).Sum(e => e.Amount);
                    var dayProfit = dayRevenue - dayExpenses;
                    return new FinancialTimeSeriesDto
                    {
                        Period = date.ToString("yyyy-MM-dd"),
                        Revenue = dayRevenue,
                        Expenses = dayExpenses,
                        Profit = dayProfit,
                        ProfitMargin = dayRevenue > 0 ? (dayProfit / dayRevenue) * 100 : 0
                    };
                })
                .ToList(),

            "week" => sales.Select(s => GetWeekOfYear(s.SaleDate)).Distinct()
                .Select(week => {
                    var weekRevenue = sales.Where(s => GetWeekOfYear(s.SaleDate) == week).Sum(s => s.TotalAmount);
                    var weekExpenses = expenses.Where(e => GetWeekOfYear(e.ExpenseDate) == week).Sum(e => e.Amount);
                    var weekProfit = weekRevenue - weekExpenses;
                    return new FinancialTimeSeriesDto
                    {
                        Period = week,
                        Revenue = weekRevenue,
                        Expenses = weekExpenses,
                        Profit = weekProfit,
                        ProfitMargin = weekRevenue > 0 ? (weekProfit / weekRevenue) * 100 : 0
                    };
                })
                .OrderBy(t => t.Period)
                .ToList(),

            "month" => sales.Select(s => new { s.SaleDate.Year, s.SaleDate.Month }).Distinct()
                .Select(month => {
                    var monthRevenue = sales.Where(s => s.SaleDate.Year == month.Year && s.SaleDate.Month == month.Month)
                        .Sum(s => s.TotalAmount);
                    var monthExpenses = expenses.Where(e => e.ExpenseDate.Year == month.Year && e.ExpenseDate.Month == month.Month)
                        .Sum(e => e.Amount);
                    var monthProfit = monthRevenue - monthExpenses;
                    return new FinancialTimeSeriesDto
                    {
                        Period = $"{month.Year}-{month.Month:D2}",
                        Revenue = monthRevenue,
                        Expenses = monthExpenses,
                        Profit = monthProfit,
                        ProfitMargin = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0
                    };
                })
                .OrderBy(t => t.Period)
                .ToList(),

            _ => throw new ArgumentException($"Invalid groupBy value: {groupBy}")
        };
    }

    private string GetStockStatus(int currentStock, int minThreshold)
    {
        if (currentStock < 0) return "Negative Stock";
        if (currentStock == 0) return "Out of Stock";
        if (currentStock < minThreshold) return "Low Stock";
        return "In Stock";
    }

    private string GetWeekOfYear(DateTime date)
    {
        var culture = System.Globalization.CultureInfo.CurrentCulture;
        var weekNum = culture.Calendar.GetWeekOfYear(date, System.Globalization.CalendarWeekRule.FirstDay, DayOfWeek.Monday);
        return $"{date.Year}-W{weekNum:D2}";
    }

    private T GetFilterValue<T>(Dictionary<string, object>? filters, string key)
    {
        if (filters == null || !filters.ContainsKey(key))
            return default!;

        var value = filters[key];
        if (value is T typedValue)
            return typedValue;

        // Try to convert
        try
        {
            return (T)Convert.ChangeType(value, typeof(T));
        }
        catch
        {
            return default!;
        }
    }

    private byte[] GeneratePdfExport(object reportData, ExportOptionsDto? options)
    {
        // NOTE: This is a placeholder. In production, use a library like QuestPDF, iTextSharp, or PdfSharpCore
        // For now, return a simple text representation
        var content = $"PDF Export - Report Generated at {DateTime.UtcNow}\n\n{System.Text.Json.JsonSerializer.Serialize(reportData, new System.Text.Json.JsonSerializerOptions { WriteIndented = true })}";
        return Encoding.UTF8.GetBytes(content);
    }

    private byte[] GenerateExcelExport(object reportData, ExportOptionsDto? options)
    {
        // NOTE: This is a placeholder. In production, use a library like EPPlus, NPOI, or ClosedXML
        // For now, return a simple text representation
        var content = $"Excel Export - Report Generated at {DateTime.UtcNow}\n\n{System.Text.Json.JsonSerializer.Serialize(reportData, new System.Text.Json.JsonSerializerOptions { WriteIndented = true })}";
        return Encoding.UTF8.GetBytes(content);
    }

    private byte[] GenerateCsvExport(object reportData, ExportOptionsDto? options)
    {
        // NOTE: This is a placeholder. In production, properly format as CSV
        // For now, return a simple text representation
        var delimiter = options?.Delimiter ?? ",";
        var includeHeaders = options?.IncludeHeaders ?? true;

        var content = $"CSV Export{delimiter}Report Generated at {DateTime.UtcNow}\n\n{System.Text.Json.JsonSerializer.Serialize(reportData, new System.Text.Json.JsonSerializerOptions { WriteIndented = true })}";
        return Encoding.UTF8.GetBytes(content);
    }

    #endregion
}
