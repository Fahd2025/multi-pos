using Backend.Data.Branch;
using Backend.Data.HeadOffice;
using Backend.Data.Shared;
using Backend.Models.DTOs.Branch.Sales;
using Backend.Models.Entities.Branch;
using BranchEntity = Backend.Models.Entities.HeadOffice.Branch;
using Backend.Models.Entities.HeadOffice;
using Backend.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Branch.Sales;

public class SalesService : ISalesService
{
    private readonly DbContextFactory _dbContextFactory;
    private readonly HeadOfficeDbContext _headOfficeContext;

    public SalesService(DbContextFactory dbContextFactory, HeadOfficeDbContext headOfficeContext)
    {
        _dbContextFactory = dbContextFactory;
        _headOfficeContext = headOfficeContext;
    }

    public async Task<SaleDto> CreateSaleAsync(
        CreateSaleDto createSaleDto,
        Guid cashierId,
        string branchName
    )
    {
        // Get branch information
        var branch = await _headOfficeContext.Branches.FirstOrDefaultAsync(b =>
            b.LoginName == branchName && b.IsActive
        );

        if (branch == null)
        {
            throw new InvalidOperationException("Branch not found");
        }

        using var context = _dbContextFactory.CreateBranchContext(branch);

        // Validate products exist and have sufficient stock
        var productIds = createSaleDto.LineItems.Select(li => li.ProductId).ToList();
        var products = await context
            .Products.Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        if (products.Count != productIds.Count)
        {
            var missingIds = productIds.Except(products.Keys);
            throw new InvalidOperationException(
                $"Product(s) not found: {string.Join(", ", missingIds)}"
            );
        }

        // Validate customer if provided
        Customer? customer = null;
        if (createSaleDto.CustomerId.HasValue)
        {
            customer = await context.Customers.FindAsync(createSaleDto.CustomerId.Value);
            if (customer == null)
            {
                throw new InvalidOperationException("Customer not found");
            }
        }

        // Get branch settings for tax rate
        var taxRateSetting = await context
            .Settings.Where(s => s.Key == "TaxRate")
            .FirstOrDefaultAsync();
        decimal taxRate = taxRateSetting != null ? decimal.Parse(taxRateSetting.Value ?? "0") : branch.TaxRate;

        // Create sale entity
        var sale = new Sale
        {
            Id = Guid.NewGuid(),
            TransactionId = InvoiceNumberGenerator.GenerateTransactionId(),
            InvoiceType = createSaleDto.InvoiceType,
            CustomerId = createSaleDto.CustomerId,
            CashierId = cashierId,
            SaleDate = DateTime.UtcNow,
            PaymentMethod = createSaleDto.PaymentMethod,
            PaymentReference = createSaleDto.PaymentReference,
            Notes = createSaleDto.Notes,
            IsVoided = false,
            CreatedAt = DateTime.UtcNow,
        };

        // Generate invoice number for Standard invoices
        if (createSaleDto.InvoiceType == InvoiceType.Standard)
        {
            sale.InvoiceNumber = await InvoiceNumberGenerator.GenerateInvoiceNumberAsync(
                context,
                branch.Code
            );
        }

        // Create line items and calculate totals
        decimal subtotal = 0;
        decimal totalDiscount = 0;
        var lineItems = new List<SaleLineItem>();

        foreach (var itemDto in createSaleDto.LineItems)
        {
            var product = products[itemDto.ProductId];

            // Calculate discounted unit price
            decimal discountedPrice = itemDto.UnitPrice;
            decimal itemDiscount = 0;

            switch (itemDto.DiscountType)
            {
                case DiscountType.Percentage:
                    if (itemDto.DiscountValue < 0 || itemDto.DiscountValue > 100)
                    {
                        throw new InvalidOperationException(
                            "Percentage discount must be between 0 and 100"
                        );
                    }
                    itemDiscount = itemDto.UnitPrice * (itemDto.DiscountValue / 100);
                    discountedPrice = itemDto.UnitPrice - itemDiscount;
                    break;

                case DiscountType.FixedAmount:
                    if (itemDto.DiscountValue > itemDto.UnitPrice)
                    {
                        throw new InvalidOperationException(
                            "Fixed discount cannot exceed unit price"
                        );
                    }
                    itemDiscount = itemDto.DiscountValue;
                    discountedPrice = itemDto.UnitPrice - itemDto.DiscountValue;
                    break;
            }

            decimal lineTotal = discountedPrice * itemDto.Quantity;
            decimal lineTotalDiscount = itemDiscount * itemDto.Quantity;

            var lineItem = new SaleLineItem
            {
                Id = Guid.NewGuid(),
                SaleId = sale.Id,
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                DiscountType = itemDto.DiscountType,
                DiscountValue = itemDto.DiscountValue,
                DiscountedUnitPrice = discountedPrice,
                LineTotal = lineTotal,
            };

            lineItems.Add(lineItem);
            subtotal += lineTotal;
            totalDiscount += lineTotalDiscount;

            // Update product inventory (last-commit-wins)
            product.StockLevel -= itemDto.Quantity;

            // Flag if inventory went negative
            if (product.StockLevel < 0)
            {
                product.HasInventoryDiscrepancy = true;
            }

            product.UpdatedAt = DateTime.UtcNow;
        }

        // Calculate tax and total
        decimal taxAmount = subtotal * (taxRate / 100);
        decimal total = subtotal + taxAmount;

        sale.Subtotal = subtotal;
        sale.TaxAmount = taxAmount;
        sale.TotalDiscount = totalDiscount;
        sale.Total = total;
        sale.LineItems = lineItems;

        // Update customer stats if customer is linked
        if (customer != null)
        {
            customer.TotalPurchases += total;
            customer.VisitCount += 1;
            customer.LastVisitAt = DateTime.UtcNow;
            customer.UpdatedAt = DateTime.UtcNow;
        }

        // Save to database
        context.Sales.Add(sale);
        await context.SaveChangesAsync();

        // Return DTO
        return await MapToSaleDto(sale, context, branch);
    }

    public async Task<(List<SaleDto> Sales, int TotalCount)> GetSalesAsync(
        int page = 1,
        int pageSize = 20,
        DateTime? dateFrom = null,
        DateTime? dateTo = null,
        Guid? customerId = null,
        Guid? cashierId = null,
        InvoiceType? invoiceType = null,
        PaymentMethod? paymentMethod = null,
        bool? isVoided = false,
        string? search = null,
        string? branchName = null
    )
    {
        var branch = await _headOfficeContext.Branches.FirstOrDefaultAsync(b =>
            b.LoginName == branchName && b.IsActive
        );

        if (branch == null)
        {
            throw new InvalidOperationException("Branch not found");
        }

        using var context = _dbContextFactory.CreateBranchContext(branch);

        var query = context.Sales.Include(s => s.Customer).Include(s => s.LineItems).AsQueryable();

        // Apply filters
        if (dateFrom.HasValue)
        {
            query = query.Where(s => s.SaleDate >= dateFrom.Value);
        }

        if (dateTo.HasValue)
        {
            query = query.Where(s => s.SaleDate <= dateTo.Value);
        }

        if (customerId.HasValue)
        {
            query = query.Where(s => s.CustomerId == customerId.Value);
        }

        if (cashierId.HasValue)
        {
            query = query.Where(s => s.CashierId == cashierId.Value);
        }

        if (invoiceType.HasValue)
        {
            query = query.Where(s => s.InvoiceType == invoiceType.Value);
        }

        if (paymentMethod.HasValue)
        {
            query = query.Where(s => s.PaymentMethod == paymentMethod.Value);
        }

        if (isVoided.HasValue)
        {
            query = query.Where(s => s.IsVoided == isVoided.Value);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(s =>
                s.TransactionId.Contains(search) || (s.InvoiceNumber != null && s.InvoiceNumber.Contains(search))
            );
        }

        // Get total count
        int totalCount = await query.CountAsync();

        // Apply pagination
        var sales = await query
            .OrderByDescending(s => s.SaleDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Map to DTOs
        var saleDtos = new List<SaleDto>();
        foreach (var sale in sales)
        {
            saleDtos.Add(await MapToSaleDto(sale, context, branch));
        }

        return (saleDtos, totalCount);
    }

    public async Task<SaleDto?> GetSaleByIdAsync(Guid id, string branchName)
    {
        var branch = await _headOfficeContext.Branches.FirstOrDefaultAsync(b =>
            b.LoginName == branchName && b.IsActive
        );

        if (branch == null)
        {
            throw new InvalidOperationException("Branch not found");
        }

        using var context = _dbContextFactory.CreateBranchContext(branch);

        var sale = await context
            .Sales.Include(s => s.Customer)
            .Include(s => s.LineItems)
            .ThenInclude(li => li.Product)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sale == null)
        {
            return null;
        }

        return await MapToSaleDto(sale, context, branch);
    }

    public async Task<SaleDto> VoidSaleAsync(Guid id, string reason, Guid voidedBy, string branchName)
    {
        var branch = await _headOfficeContext.Branches.FirstOrDefaultAsync(b =>
            b.LoginName == branchName && b.IsActive
        );

        if (branch == null)
        {
            throw new InvalidOperationException("Branch not found");
        }

        using var context = _dbContextFactory.CreateBranchContext(branch);

        var sale = await context
            .Sales.Include(s => s.Customer)
            .Include(s => s.LineItems)
            .ThenInclude(li => li.Product)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sale == null)
        {
            throw new InvalidOperationException("Sale not found");
        }

        if (sale.IsVoided)
        {
            throw new InvalidOperationException("Sale has already been voided");
        }

        // Mark sale as voided
        sale.IsVoided = true;
        sale.VoidedAt = DateTime.UtcNow;
        sale.VoidedBy = voidedBy;
        sale.VoidReason = reason;

        // Restore inventory
        foreach (var lineItem in sale.LineItems)
        {
            lineItem.Product.StockLevel += lineItem.Quantity;
            lineItem.Product.UpdatedAt = DateTime.UtcNow;
        }

        // Update customer stats if customer was linked
        if (sale.Customer != null)
        {
            sale.Customer.TotalPurchases -= sale.Total;
            sale.Customer.VisitCount = Math.Max(0, sale.Customer.VisitCount - 1);
            sale.Customer.UpdatedAt = DateTime.UtcNow;
        }

        await context.SaveChangesAsync();

        return await MapToSaleDto(sale, context, branch);
    }

    public async Task<SalesStatsDto> GetSalesStatsAsync(
        DateTime dateFrom,
        DateTime dateTo,
        string? branchName = null
    )
    {
        var branch = await _headOfficeContext.Branches.FirstOrDefaultAsync(b =>
            b.LoginName == branchName && b.IsActive
        );

        if (branch == null)
        {
            throw new InvalidOperationException("Branch not found");
        }

        using var context = _dbContextFactory.CreateBranchContext(branch);

        var sales = await context
            .Sales.Include(s => s.LineItems)
            .ThenInclude(li => li.Product)
            .Where(s => s.SaleDate >= dateFrom && s.SaleDate <= dateTo && !s.IsVoided)
            .ToListAsync();

        var stats = new SalesStatsDto
        {
            Period = new PeriodDto
            {
                From = dateFrom.ToString("yyyy-MM-dd"),
                To = dateTo.ToString("yyyy-MM-dd"),
            },
            TotalSales = sales.Sum(s => s.Total),
            TotalTransactions = sales.Count,
            AverageTransactionValue = sales.Any() ? sales.Average(s => s.Total) : 0,
            TotalTax = sales.Sum(s => s.TaxAmount),
            TotalDiscounts = sales.Sum(s => s.TotalDiscount),
            SalesByPaymentMethod = sales
                .GroupBy(s => s.PaymentMethod)
                .ToDictionary(g => g.Key.ToString().ToLower(), g => g.Sum(s => s.Total)),
            SalesByInvoiceType = sales
                .GroupBy(s => s.InvoiceType)
                .ToDictionary(g => g.Key.ToString().ToLower(), g => g.Sum(s => s.Total)),
        };

        // Top products
        var topProducts = sales
            .SelectMany(s => s.LineItems)
            .GroupBy(li => new { li.ProductId, li.Product.NameEn })
            .Select(g => new TopProductDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.NameEn,
                QuantitySold = g.Sum(li => li.Quantity),
                TotalRevenue = g.Sum(li => li.LineTotal),
            })
            .OrderByDescending(p => p.TotalRevenue)
            .Take(10)
            .ToList();

        stats.TopProducts = topProducts;

        // Top cashiers
        var cashierIds = sales.Select(s => s.CashierId).Distinct().ToList();
        var cashiers = await _headOfficeContext
            .Users.Where(u => cashierIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullNameEn);

        var topCashiers = sales
            .GroupBy(s => s.CashierId)
            .Select(g => new TopCashierDto
            {
                CashierId = g.Key,
                CashierName = cashiers.ContainsKey(g.Key) ? cashiers[g.Key] : "Unknown",
                TotalSales = g.Sum(s => s.Total),
                TransactionCount = g.Count(),
            })
            .OrderByDescending(c => c.TotalSales)
            .Take(10)
            .ToList();

        stats.TopCashiers = topCashiers;

        // Sales trend (daily)
        var salesTrend = sales
            .GroupBy(s => s.SaleDate.Date)
            .Select(g => new SalesTrendDto
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                Sales = g.Sum(s => s.Total),
                Transactions = g.Count(),
            })
            .OrderBy(t => t.Date)
            .ToList();

        stats.SalesTrend = salesTrend;

        return stats;
    }

    private async Task<SaleDto> MapToSaleDto(Sale sale, BranchDbContext context, BranchEntity branch)
    {
        // Get cashier name
        var cashier = await _headOfficeContext.Users.FindAsync(sale.CashierId);
        var cashierName = cashier?.FullNameEn ?? "Unknown";

        // Get customer name if applicable
        string? customerName = null;
        if (sale.CustomerId.HasValue)
        {
            if (sale.Customer != null)
            {
                customerName = sale.Customer.NameEn;
            }
            else
            {
                var customer = await context.Customers.FindAsync(sale.CustomerId.Value);
                customerName = customer?.NameEn;
            }
        }
        else
        {
            customerName = sale.InvoiceType == InvoiceType.Touch ? null : "Walk-in Customer";
        }

        // Map line items
        var lineItemDtos = new List<SaleLineItemDto>();
        foreach (var lineItem in sale.LineItems)
        {
            var product = lineItem.Product ?? await context.Products.FindAsync(lineItem.ProductId);

            lineItemDtos.Add(
                new SaleLineItemDto
                {
                    Id = lineItem.Id,
                    ProductId = lineItem.ProductId,
                    ProductName = product?.NameEn ?? "Unknown Product",
                    Quantity = lineItem.Quantity,
                    UnitPrice = lineItem.UnitPrice,
                    DiscountType = lineItem.DiscountType,
                    DiscountValue = lineItem.DiscountValue,
                    DiscountedUnitPrice = lineItem.DiscountedUnitPrice,
                    LineTotal = lineItem.LineTotal,
                }
            );
        }

        return new SaleDto
        {
            Id = sale.Id,
            TransactionId = sale.TransactionId,
            InvoiceNumber = sale.InvoiceNumber,
            InvoiceType = sale.InvoiceType,
            CustomerId = sale.CustomerId,
            CustomerName = customerName,
            CashierId = sale.CashierId,
            CashierName = cashierName,
            SaleDate = sale.SaleDate,
            LineItems = lineItemDtos,
            Subtotal = sale.Subtotal,
            TaxAmount = sale.TaxAmount,
            TotalDiscount = sale.TotalDiscount,
            Total = sale.Total,
            PaymentMethod = sale.PaymentMethod,
            PaymentMethodName = sale.PaymentMethod.ToString(),
            PaymentReference = sale.PaymentReference,
            Notes = sale.Notes,
            IsVoided = sale.IsVoided,
            VoidedAt = sale.VoidedAt,
            VoidedBy = sale.VoidedBy,
            VoidReason = sale.VoidReason,
            CreatedAt = sale.CreatedAt,
        };
    }
}
