using System.Text.Json;
using Backend.Data;
using Backend.Models.DTOs.Sales;
using Backend.Models.Entities.Branch;
using Backend.Services.Sales;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Sync;

/// <summary>
/// Sync service implementation
/// Handles offline transaction synchronization with last-commit-wins conflict resolution
/// </summary>
public class SyncService : ISyncService
{
    private readonly DbContextFactory _dbContextFactory;
    private readonly HeadOfficeDbContext _headOfficeContext;
    private readonly ISalesService _salesService;

    public SyncService(
        DbContextFactory dbContextFactory,
        HeadOfficeDbContext headOfficeContext,
        ISalesService salesService
    )
    {
        _dbContextFactory = dbContextFactory;
        _headOfficeContext = headOfficeContext;
        _salesService = salesService;
    }

    /// <summary>
    /// Process an offline transaction from the sync queue
    /// Routes to appropriate handler based on transaction type
    /// </summary>
    public async Task<string> ProcessOfflineTransactionAsync(
        string transactionType,
        string transactionData,
        string branchId,
        string userId,
        DateTime clientTimestamp
    )
    {
        return transactionType.ToLower() switch
        {
            "sale" => await ProcessOfflineSaleTransactionAsync(
                transactionData,
                userId,
                branchId,
                clientTimestamp
            ),
            "purchase" => throw new NotImplementedException("Purchase sync not yet implemented"),
            "expense" => throw new NotImplementedException("Expense sync not yet implemented"),
            "inventory_adjust" => throw new NotImplementedException(
                "Inventory adjustment sync not yet implemented"
            ),
            _ => throw new InvalidOperationException($"Unknown transaction type: {transactionType}"),
        };
    }

    /// <summary>
    /// Process an offline sale transaction
    /// Handles inventory updates with last-commit-wins conflict resolution
    /// </summary>
    public async Task<Sale> ProcessOfflineSaleAsync(
        CreateSaleDto saleData,
        string userId,
        DateTime clientTimestamp
    )
    {
        if (!Guid.TryParse(userId, out var cashierId))
        {
            throw new InvalidOperationException("Invalid user ID");
        }

        // Get user's branch context
        var user = await _headOfficeContext.Users.Include(u => u.BranchUsers)
            .ThenInclude(bu => bu.Branch)
            .FirstOrDefaultAsync(u => u.Id == cashierId);

        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        var branchUser = user.BranchUsers.FirstOrDefault(bu => bu.IsActive);
        if (branchUser == null || branchUser.Branch == null)
        {
            throw new InvalidOperationException("User has no active branch assignment");
        }

        var branchName = branchUser.Branch.LoginName;

        using var context = _dbContextFactory.CreateBranchContext(branchUser.Branch);

        // Validate products and check inventory
        var productIds = saleData.LineItems.Select(li => li.ProductId).ToList();
        var products = await context.Products.Where(p => productIds.Contains(p.Id))
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
        if (saleData.CustomerId.HasValue)
        {
            customer = await context.Customers.FindAsync(saleData.CustomerId.Value);
            if (customer == null)
            {
                throw new InvalidOperationException("Customer not found");
            }
        }

        // Get branch settings for tax rate
        var taxRateSetting = await context.Settings.Where(s => s.Key == "TaxRate")
            .FirstOrDefaultAsync();
        decimal taxRate = taxRateSetting != null
            ? decimal.Parse(taxRateSetting.Value ?? "0")
            : branchUser.Branch.TaxRate;

        // Create sale entity with client timestamp
        var sale = new Sale
        {
            Id = Guid.NewGuid(),
            TransactionId = Utilities.InvoiceNumberGenerator.GenerateTransactionId(),
            InvoiceType = saleData.InvoiceType,
            CustomerId = saleData.CustomerId,
            CashierId = cashierId,
            SaleDate = clientTimestamp, // Use client timestamp, not server time
            PaymentMethod = saleData.PaymentMethod,
            PaymentReference = saleData.PaymentReference,
            Notes = saleData.Notes,
            IsVoided = false,
            CreatedAt = DateTime.UtcNow,
        };

        // Generate invoice number for Standard invoices
        if (saleData.InvoiceType == InvoiceType.Standard)
        {
            sale.InvoiceNumber = await Utilities.InvoiceNumberGenerator.GenerateInvoiceNumberAsync(
                context,
                branchUser.Branch.Code
            );
        }

        // Create line items and calculate totals
        decimal subtotal = 0;
        decimal totalDiscount = 0;
        var lineItems = new List<SaleLineItem>();
        var inventoryWarnings = new List<string>();

        foreach (var itemDto in saleData.LineItems)
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

            // Update inventory (last-commit-wins)
            product.StockLevel -= itemDto.Quantity;
            product.UpdatedAt = DateTime.UtcNow;

            // Flag inventory discrepancy if stock went negative
            if (product.StockLevel < 0 && !product.HasInventoryDiscrepancy)
            {
                product.HasInventoryDiscrepancy = true;
                inventoryWarnings.Add(
                    $"Product '{product.NameEn}' (SKU: {product.SKU}) has negative stock: {product.StockLevel}"
                );
            }

            context.Products.Update(product);
        }

        // Calculate tax and total
        decimal taxAmount = subtotal * (taxRate / 100);
        decimal total = subtotal + taxAmount;

        sale.Subtotal = subtotal;
        sale.TaxAmount = taxAmount;
        sale.TotalDiscount = totalDiscount;
        sale.Total = total;
        sale.LineItems = lineItems;

        // Add sale to database
        context.Sales.Add(sale);

        // Update customer statistics if customer is linked
        if (customer != null)
        {
            customer.TotalPurchases += total;
            customer.VisitCount += 1;
            customer.LastVisitAt = sale.SaleDate;
            customer.UpdatedAt = DateTime.UtcNow;
            context.Customers.Update(customer);
        }

        // Save changes
        await context.SaveChangesAsync();

        // Log inventory warnings (manager should be alerted)
        if (inventoryWarnings.Any())
        {
            // TODO: Implement manager alert system
            Console.WriteLine($"[INVENTORY WARNING] Sale {sale.TransactionId}:");
            foreach (var warning in inventoryWarnings)
            {
                Console.WriteLine($"  - {warning}");
            }
        }

        return sale;
    }

    /// <summary>
    /// Private helper to process offline sale transaction
    /// Deserializes JSON and calls ProcessOfflineSaleAsync
    /// </summary>
    private async Task<string> ProcessOfflineSaleTransactionAsync(
        string transactionData,
        string userId,
        string branchId,
        DateTime clientTimestamp
    )
    {
        var saleData = JsonSerializer.Deserialize<CreateSaleDto>(
            transactionData,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );

        if (saleData == null)
        {
            throw new InvalidOperationException("Failed to deserialize sale data");
        }

        var sale = await ProcessOfflineSaleAsync(saleData, userId, clientTimestamp);
        return sale.Id.ToString();
    }

    /// <summary>
    /// Get sync status for current branch
    /// </summary>
    public async Task<SyncStatusDto> GetSyncStatusAsync()
    {
        // This is a simple implementation
        // In production, you might track sync status in a dedicated table
        return await Task.FromResult(
            new SyncStatusDto
            {
                PendingCount = 0,
                LastSyncAt = DateTime.UtcNow,
                IsOnline = true,
                RecentErrors = new List<string>(),
            }
        );
    }
}
