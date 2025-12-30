using System.Text.Json;
using Backend.Data.Branch;
using Backend.Data.HeadOffice;
using Backend.Data.Shared;
using Backend.Models.DTOs.Branch.Sales;
using Backend.Models.DTOs.Branch.PendingOrders;
using Backend.Models.DTOs.Branch.Customers;
using Backend.Models.Entities.Branch;
using Backend.Services.Branch.Sales;
using Backend.Services.Branch.PendingOrders;
using Backend.Services.Branch.Customers;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Shared.Sync;

/// <summary>
/// Sync service implementation
/// Handles offline transaction synchronization with last-commit-wins conflict resolution
/// </summary>
public class SyncService : ISyncService
{
    private readonly DbContextFactory _dbContextFactory;
    private readonly HeadOfficeDbContext _headOfficeContext;
    private readonly ISalesService _salesService;
    private readonly IPendingOrdersService _pendingOrdersService;
    private readonly ICustomerService _customerService;

    public SyncService(
        DbContextFactory dbContextFactory,
        HeadOfficeDbContext headOfficeContext,
        ISalesService salesService,
        IPendingOrdersService pendingOrdersService,
        ICustomerService customerService
    )
    {
        _dbContextFactory = dbContextFactory;
        _headOfficeContext = headOfficeContext;
        _salesService = salesService;
        _pendingOrdersService = pendingOrdersService;
        _customerService = customerService;
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
            // Sales operations
            "sale" or "sale_create" => await ProcessOfflineSaleTransactionAsync(
                transactionData,
                userId,
                branchId,
                clientTimestamp
            ),

            // Pending orders
            "pending_order" => await ProcessOfflinePendingOrderTransactionAsync(
                transactionData,
                userId,
                branchId,
                clientTimestamp
            ),

            // Customer operations (Phase 1)
            "customer_create" => await ProcessOfflineCustomerCreateTransactionAsync(
                transactionData,
                userId,
                branchId,
                clientTimestamp
            ),
            "customer_update" => await ProcessOfflineCustomerUpdateTransactionAsync(
                transactionData,
                userId,
                branchId,
                clientTimestamp
            ),
            "customer_delete" => await ProcessOfflineCustomerDeleteTransactionAsync(
                transactionData,
                userId,
                branchId,
                clientTimestamp
            ),

            // Not yet implemented
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
        string branchId,
        DateTime clientTimestamp
    )
    {
        if (!Guid.TryParse(userId, out var cashierId))
        {
            throw new InvalidOperationException("Invalid user ID");
        }

        if (!Guid.TryParse(branchId, out var branchGuid))
        {
            throw new InvalidOperationException("Invalid branch ID");
        }

        // Validate branch existence
        var branch = await _headOfficeContext.Branches.FindAsync(branchGuid);
        if (branch == null)
        {
            throw new InvalidOperationException("Branch not found");
        }

        // Validate user matches the branch
        // Check BranchUser first
        var isBranchUser = await _headOfficeContext.BranchUsers.AnyAsync(bu =>
            bu.Id == cashierId && bu.BranchId == branchGuid && bu.IsActive);

        if (!isBranchUser)
        {
            // Check if it's a Head Office Admin
            var isHeadOfficeAdmin = await _headOfficeContext.Users.AnyAsync(u =>
                u.Id == cashierId && u.IsHeadOfficeAdmin && u.IsActive);

            if (!isHeadOfficeAdmin)
            {
                throw new InvalidOperationException("User not found or not authorized for this branch");
            }
        }

        var branchName = branch.Code;

        using var context = _dbContextFactory.CreateBranchContext(branch);

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
            : branch.TaxRate;

        // Create sale entity with client timestamp
        var sale = new Sale
        {
            Id = Guid.NewGuid(),
            TransactionId = Utilities.InvoiceNumberGenerator.GenerateTransactionId(),
            InvoiceType = saleData.InvoiceType,
            CustomerId = saleData.CustomerId,
            CashierId = cashierId,
            SaleDate = clientTimestamp, // Use client timestamp, not server time
            PaymentMethod = saleData.PaymentMethod ?? Models.Entities.Branch.PaymentMethod.Cash,
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
                branch.Code
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

        var sale = await ProcessOfflineSaleAsync(saleData, userId, branchId, clientTimestamp);
        return sale.Id.ToString();
    }

    /// <summary>
    /// Process an offline pending order transaction
    /// Creates pending order preserving client timestamp
    /// </summary>
    public async Task<PendingOrder> ProcessOfflinePendingOrderAsync(
        CreatePendingOrderDto pendingOrderData,
        string userId,
        string branchId,
        DateTime clientTimestamp
    )
    {
        if (!Guid.TryParse(userId, out var userGuid))
        {
            throw new InvalidOperationException("Invalid user ID");
        }

        if (!Guid.TryParse(branchId, out var branchGuid))
        {
            throw new InvalidOperationException("Invalid branch ID");
        }

        // Validate branch existence
        var branch = await _headOfficeContext.Branches.FindAsync(branchGuid);
        if (branch == null)
        {
            throw new InvalidOperationException("Branch not found");
        }

        // Validate user belongs to branch
        var isBranchUser = await _headOfficeContext.BranchUsers.AnyAsync(bu =>
            bu.Id == userGuid && bu.BranchId == branchGuid && bu.IsActive);

        if (!isBranchUser)
        {
            // Check if it's a Head Office Admin
            var isHeadOfficeAdmin = await _headOfficeContext.Users.AnyAsync(u =>
                u.Id == userGuid && u.IsHeadOfficeAdmin && u.IsActive);

            if (!isHeadOfficeAdmin)
            {
                throw new InvalidOperationException("User not found or not authorized for this branch");
            }
        }

        // Get username from database
        var user = await _headOfficeContext.BranchUsers.FindAsync(userGuid);
        var username = user?.Username ?? "Unknown";

        using var context = _dbContextFactory.CreateBranchContext(branch);

        // Validate products exist
        var productIds = pendingOrderData.Items.Select(i => i.ProductId).Distinct().ToList();
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
        if (pendingOrderData.CustomerId.HasValue)
        {
            var customerExists = await context.Customers.AnyAsync(c => c.Id == pendingOrderData.CustomerId.Value);
            if (!customerExists)
            {
                throw new InvalidOperationException("Customer not found");
            }
        }

        // Generate order number (same logic as service)
        var today = clientTimestamp.Date;
        var todayOrderCount = await context.PendingOrders
            .Where(po => po.CreatedAt.Date == today)
            .CountAsync();

        var orderNumber = $"PO-{today:yyyyMMdd}-{(todayOrderCount + 1):D4}";

        // Create pending order entity
        var pendingOrder = new PendingOrder
        {
            Id = Guid.NewGuid(),
            OrderNumber = orderNumber,
            CustomerName = pendingOrderData.CustomerName,
            CustomerPhone = pendingOrderData.CustomerPhone,
            CustomerId = pendingOrderData.CustomerId,
            TableId = pendingOrderData.TableId,
            TableNumber = pendingOrderData.TableNumber,
            GuestCount = pendingOrderData.GuestCount,
            OrderType = pendingOrderData.OrderType,
            Status = pendingOrderData.Status,
            Subtotal = pendingOrderData.Subtotal,
            TaxAmount = pendingOrderData.TaxAmount,
            DiscountAmount = pendingOrderData.DiscountAmount,
            TotalAmount = pendingOrderData.TotalAmount,
            Notes = pendingOrderData.Notes,
            CreatedByUserId = userGuid.ToString(),
            CreatedByUsername = username,
            CreatedAt = clientTimestamp, // Use client timestamp
            UpdatedAt = clientTimestamp,
            ExpiresAt = clientTimestamp.AddHours(24), // 24-hour expiry
            Items = new List<PendingOrderItem>()
        };

        // Create pending order items
        foreach (var itemDto in pendingOrderData.Items)
        {
            var product = products[itemDto.ProductId];

            var item = new PendingOrderItem
            {
                Id = Guid.NewGuid(),
                PendingOrderId = pendingOrder.Id,
                ProductId = itemDto.ProductId,
                ProductName = product.NameEn,
                ProductSku = product.SKU,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                Discount = itemDto.Discount,
                TotalPrice = itemDto.TotalPrice,
                Notes = itemDto.Notes
            };

            pendingOrder.Items.Add(item);
        }

        // Save pending order
        context.PendingOrders.Add(pendingOrder);
        await context.SaveChangesAsync();

        return pendingOrder;
    }

    /// <summary>
    /// Private helper to process offline pending order transaction
    /// Deserializes JSON and calls ProcessOfflinePendingOrderAsync
    /// </summary>
    private async Task<string> ProcessOfflinePendingOrderTransactionAsync(
        string transactionData,
        string userId,
        string branchId,
        DateTime clientTimestamp
    )
    {
        var pendingOrderData = JsonSerializer.Deserialize<CreatePendingOrderDto>(
            transactionData,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );

        if (pendingOrderData == null)
        {
            throw new InvalidOperationException("Failed to deserialize pending order data");
        }

        var pendingOrder = await ProcessOfflinePendingOrderAsync(
            pendingOrderData,
            userId,
            branchId,
            clientTimestamp
        );

        return pendingOrder.Id.ToString();
    }

    /// <summary>
    /// Process an offline customer creation transaction (Phase 1)
    /// Creates customer with client timestamp preserved
    /// </summary>
    public async Task<Customer> ProcessOfflineCustomerCreateAsync(
        CreateCustomerDto customerData,
        string userId,
        string branchId,
        DateTime clientTimestamp
    )
    {
        if (!Guid.TryParse(userId, out var userGuid))
        {
            throw new InvalidOperationException("Invalid user ID");
        }

        if (!Guid.TryParse(branchId, out var branchGuid))
        {
            throw new InvalidOperationException("Invalid branch ID");
        }

        // Validate branch existence
        var branch = await _headOfficeContext.Branches.FindAsync(branchGuid);
        if (branch == null)
        {
            throw new InvalidOperationException("Branch not found");
        }

        // Validate user belongs to branch
        var isBranchUser = await _headOfficeContext.BranchUsers.AnyAsync(bu =>
            bu.Id == userGuid && bu.BranchId == branchGuid && bu.IsActive);

        if (!isBranchUser)
        {
            // Check if it's a Head Office Admin
            var isHeadOfficeAdmin = await _headOfficeContext.Users.AnyAsync(u =>
                u.Id == userGuid && u.IsHeadOfficeAdmin && u.IsActive);

            if (!isHeadOfficeAdmin)
            {
                throw new InvalidOperationException("User not found or not authorized for this branch");
            }
        }

        using var context = _dbContextFactory.CreateBranchContext(branch);

        // Create customer entity with server-generated ID
        var customer = new Customer
        {
            Id = Guid.NewGuid(), // Server-generated ID (mapped from tempId)
            Code = customerData.Code,
            NameEn = customerData.NameEn,
            NameAr = customerData.NameAr,
            Phone = customerData.Phone,
            Email = customerData.Email,
            AddressEn = customerData.AddressEn,
            AddressAr = customerData.AddressAr,
            BuildingNumber = customerData.BuildingNumber,
            StreetName = customerData.StreetName,
            District = customerData.District,
            City = customerData.City,
            PostalCode = customerData.PostalCode,
            AdditionalNumber = customerData.AdditionalNumber,
            UnitNumber = customerData.UnitNumber,
            LogoPath = customerData.LogoPath,
            LoyaltyPoints = customerData.LoyaltyPoints,
            TotalPurchases = 0,
            VisitCount = 0,
            LastVisitAt = null,
            IsActive = customerData.IsActive,
            CreatedAt = clientTimestamp, // PRESERVE client timestamp
            UpdatedAt = clientTimestamp,
            CreatedBy = userGuid,
        };

        context.Customers.Add(customer);
        await context.SaveChangesAsync();

        return customer;
    }

    /// <summary>
    /// Process an offline customer update transaction (Phase 1)
    /// Updates customer with conflict detection (last-commit-wins)
    /// </summary>
    public async Task<Customer> ProcessOfflineCustomerUpdateAsync(
        UpdateCustomerDto customerData,
        string customerId,
        string userId,
        string branchId,
        DateTime clientTimestamp
    )
    {
        if (!Guid.TryParse(customerId, out var customerGuid))
        {
            throw new InvalidOperationException("Invalid customer ID");
        }

        if (!Guid.TryParse(userId, out var userGuid))
        {
            throw new InvalidOperationException("Invalid user ID");
        }

        if (!Guid.TryParse(branchId, out var branchGuid))
        {
            throw new InvalidOperationException("Invalid branch ID");
        }

        // Validate branch existence
        var branch = await _headOfficeContext.Branches.FindAsync(branchGuid);
        if (branch == null)
        {
            throw new InvalidOperationException("Branch not found");
        }

        using var context = _dbContextFactory.CreateBranchContext(branch);

        // Find customer
        var customer = await context.Customers.FindAsync(customerGuid);
        if (customer == null)
        {
            throw new InvalidOperationException($"Customer not found: {customerId}");
        }

        // Check for conflicts (server version is newer than client version)
        if (customer.UpdatedAt > clientTimestamp)
        {
            // Server version is newer - conflict detected
            // For now: Last-write-wins (apply offline changes)
            // Future enhancement: Return conflict data for user resolution
            Console.WriteLine(
                $"[CONFLICT WARNING] Customer {customer.Id} was modified on server " +
                $"(server: {customer.UpdatedAt}, client: {clientTimestamp}). " +
                "Applying last-write-wins strategy."
            );
        }

        // Apply updates (only update provided fields)
        if (!string.IsNullOrWhiteSpace(customerData.NameEn))
            customer.NameEn = customerData.NameEn;

        if (!string.IsNullOrWhiteSpace(customerData.NameAr))
            customer.NameAr = customerData.NameAr;

        if (!string.IsNullOrWhiteSpace(customerData.Phone))
            customer.Phone = customerData.Phone;

        if (customerData.Email != null)
            customer.Email = customerData.Email;

        if (customerData.AddressEn != null)
            customer.AddressEn = customerData.AddressEn;

        if (customerData.AddressAr != null)
            customer.AddressAr = customerData.AddressAr;

        // Update metadata with client timestamp
        customer.UpdatedAt = clientTimestamp;

        await context.SaveChangesAsync();
        return customer;
    }

    /// <summary>
    /// Process an offline customer deletion transaction (Phase 1)
    /// Soft deletes customer with client timestamp
    /// </summary>
    public async Task ProcessOfflineCustomerDeleteAsync(
        string customerId,
        string userId,
        string branchId,
        DateTime clientTimestamp
    )
    {
        if (!Guid.TryParse(customerId, out var customerGuid))
        {
            throw new InvalidOperationException("Invalid customer ID");
        }

        if (!Guid.TryParse(userId, out var userGuid))
        {
            throw new InvalidOperationException("Invalid user ID");
        }

        if (!Guid.TryParse(branchId, out var branchGuid))
        {
            throw new InvalidOperationException("Invalid branch ID");
        }

        // Validate branch existence
        var branch = await _headOfficeContext.Branches.FindAsync(branchGuid);
        if (branch == null)
        {
            throw new InvalidOperationException("Branch not found");
        }

        using var context = _dbContextFactory.CreateBranchContext(branch);

        // Find customer
        var customer = await context.Customers.FindAsync(customerGuid);
        if (customer == null)
        {
            throw new InvalidOperationException($"Customer not found: {customerId}");
        }

        // Soft delete (deactivate customer)
        customer.IsActive = false;
        customer.UpdatedAt = clientTimestamp; // Use client timestamp

        await context.SaveChangesAsync();
    }

    /// <summary>
    /// Private helper to process offline customer creation transaction
    /// Deserializes JSON and calls ProcessOfflineCustomerCreateAsync
    /// </summary>
    private async Task<string> ProcessOfflineCustomerCreateTransactionAsync(
        string transactionData,
        string userId,
        string branchId,
        DateTime clientTimestamp
    )
    {
        var customerData = JsonSerializer.Deserialize<CreateCustomerDto>(
            transactionData,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );

        if (customerData == null)
        {
            throw new InvalidOperationException("Failed to deserialize customer data");
        }

        var customer = await ProcessOfflineCustomerCreateAsync(
            customerData,
            userId,
            branchId,
            clientTimestamp
        );

        return customer.Id.ToString(); // Return REAL server-generated ID
    }

    /// <summary>
    /// Private helper to process offline customer update transaction
    /// Deserializes JSON and calls ProcessOfflineCustomerUpdateAsync
    /// </summary>
    private async Task<string> ProcessOfflineCustomerUpdateTransactionAsync(
        string transactionData,
        string userId,
        string branchId,
        DateTime clientTimestamp
    )
    {
        // Deserialize with dynamic object to extract customerId
        var jsonDoc = JsonDocument.Parse(transactionData);
        var customerId = jsonDoc.RootElement.GetProperty("id").GetString();

        if (string.IsNullOrEmpty(customerId))
        {
            throw new InvalidOperationException("Customer ID is required for update");
        }

        var customerData = JsonSerializer.Deserialize<UpdateCustomerDto>(
            transactionData,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );

        if (customerData == null)
        {
            throw new InvalidOperationException("Failed to deserialize customer data");
        }

        var customer = await ProcessOfflineCustomerUpdateAsync(
            customerData,
            customerId,
            userId,
            branchId,
            clientTimestamp
        );

        return customer.Id.ToString();
    }

    /// <summary>
    /// Private helper to process offline customer deletion transaction
    /// Deserializes JSON and calls ProcessOfflineCustomerDeleteAsync
    /// </summary>
    private async Task<string> ProcessOfflineCustomerDeleteTransactionAsync(
        string transactionData,
        string userId,
        string branchId,
        DateTime clientTimestamp
    )
    {
        // Deserialize to extract customer ID
        var jsonDoc = JsonDocument.Parse(transactionData);
        var customerId = jsonDoc.RootElement.GetProperty("id").GetString();

        if (string.IsNullOrEmpty(customerId))
        {
            throw new InvalidOperationException("Customer ID is required for deletion");
        }

        await ProcessOfflineCustomerDeleteAsync(customerId, userId, branchId, clientTimestamp);

        return customerId; // Return customer ID
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
