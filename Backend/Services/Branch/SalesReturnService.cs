using Backend.Data.Branch;
using Backend.Models.Entities.Branch;
using Backend.Models.DTOs.Branch.Sales;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Branch;

/// <summary>
/// Service for handling sales return operations
/// </summary>
public class SalesReturnService
{
    private readonly BranchDbContext _context;

    public SalesReturnService(BranchDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Process a return (full or partial) for a sale
    /// </summary>
    public async Task<ReturnResponseDto> ProcessReturnAsync(
        CreateReturnDto request,
        Guid userId)
    {
        // 1. Fetch original sale with items
        var originalSale = await _context.Sales
            .Include(s => s.LineItems)
                .ThenInclude(li => li.Product)
            .Include(s => s.Customer)
            .FirstOrDefaultAsync(s => s.Id == request.OriginalSaleId);

        if (originalSale == null)
        {
            throw new InvalidOperationException("Original sale not found");
        }

        // 2. Validate sale can be returned
        if (originalSale.IsVoided)
        {
            throw new InvalidOperationException("Cannot return a voided sale");
        }

        if (originalSale.IsReturn)
        {
            throw new InvalidOperationException("Cannot return a return invoice");
        }

        // 3. Validate return items
        foreach (var returnItem in request.Items)
        {
            var originalItem = originalSale.LineItems
                .FirstOrDefault(li => li.Id == returnItem.SaleItemId);

            if (originalItem == null)
            {
                throw new InvalidOperationException(
                    $"Sale item {returnItem.SaleItemId} not found in original sale");
            }

            int maxReturnable = originalItem.Quantity - originalItem.ReturnQuantity;
            if (returnItem.ReturnQuantity > maxReturnable)
            {
                throw new InvalidOperationException(
                    $"Cannot return {returnItem.ReturnQuantity} of item {returnItem.SaleItemId}. " +
                    $"Maximum returnable quantity is {maxReturnable}");
            }

            if (returnItem.ReturnQuantity <= 0)
            {
                throw new InvalidOperationException(
                    $"Return quantity must be greater than 0 for item {returnItem.SaleItemId}");
            }
        }

        // 4. Calculate return totals
        decimal returnSubtotal = request.Items.Sum(i => i.UnitPrice * i.ReturnQuantity);

        // Calculate proportional discount and tax
        decimal discountRate = originalSale.Subtotal > 0
            ? originalSale.TotalDiscount / originalSale.Subtotal
            : 0;
        decimal taxRate = originalSale.Subtotal > 0
            ? originalSale.TaxAmount / originalSale.Subtotal
            : 0;

        decimal returnDiscount = returnSubtotal * discountRate;
        decimal returnTax = returnSubtotal * taxRate;
        decimal returnTotal = returnSubtotal - returnDiscount + returnTax;

        // 5. Generate return order/transaction number
        long timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        string returnOrderNumber = $"RET-{originalSale.OrderNumber}-{timestamp}";
        string returnTransactionId = $"RTN-{timestamp}";

        // 6. Start transaction
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Create return sale
            var returnSale = new Sale
            {
                Id = Guid.NewGuid(),
                TransactionId = returnTransactionId,
                InvoiceNumber = null, // Will be generated if needed
                OrderNumber = returnOrderNumber,
                InvoiceType = originalSale.InvoiceType,
                OrderType = originalSale.OrderType,
                CustomerId = originalSale.CustomerId,
                CashierId = userId, // User processing the return
                UserId = userId,
                SaleDate = DateTime.UtcNow,

                // Negative amounts for returns
                Subtotal = -returnSubtotal,
                TaxAmount = -returnTax,
                TotalDiscount = -returnDiscount,
                Total = -returnTotal,

                // Payment info (same as original)
                AmountPaid = null, // Refund amount tracked in Total
                ChangeReturned = null,
                PaymentMethod = originalSale.PaymentMethod,
                PaymentReference = $"Return for {originalSale.TransactionId}",

                Notes = $"Return for invoice {originalSale.OrderNumber}. Reason: {request.ReturnReason}",

                // Void info
                IsVoided = false,

                Status = "completed", // Return is immediately completed
                CompletedAt = DateTime.UtcNow,

                // Table info (if original was dine-in)
                TableId = originalSale.TableId,
                TableNumber = originalSale.TableNumber,
                GuestCount = originalSale.GuestCount,

                // Return specific fields
                IsReturn = true,
                ReturnDate = DateTime.UtcNow,
                ReturnReason = request.ReturnReason,
                ReturnNotes = request.ReturnNotes,
                OriginalSaleId = originalSale.Id,
                ReturnApprovedBy = userId,

                CreatedAt = DateTime.UtcNow
            };

            _context.Sales.Add(returnSale);
            await _context.SaveChangesAsync();

            // Create return line items
            foreach (var returnItem in request.Items)
            {
                var originalItem = originalSale.LineItems
                    .First(li => li.Id == returnItem.SaleItemId);

                var returnLineItem = new SaleLineItem
                {
                    Id = Guid.NewGuid(),
                    SaleId = returnSale.Id,
                    ProductId = returnItem.ProductId,
                    Barcode = originalItem.Barcode,
                    Unit = originalItem.Unit,

                    // Negative quantity for returns
                    Quantity = -returnItem.ReturnQuantity,

                    UnitPrice = returnItem.UnitPrice,
                    DiscountType = originalItem.DiscountType,
                    DiscountValue = originalItem.DiscountValue,
                    DiscountedUnitPrice = originalItem.DiscountedUnitPrice,

                    // Negative line total
                    LineTotal = -(returnItem.UnitPrice * returnItem.ReturnQuantity),

                    Notes = $"Returned from sale {originalSale.OrderNumber}",

                    // Return tracking
                    ReturnQuantity = 0, // This IS the return, so no further returns
                    ItemStatus = "returned"
                };

                _context.SaleLineItems.Add(returnLineItem);

                // Update original line item
                originalItem.ReturnQuantity += returnItem.ReturnQuantity;
                originalItem.ItemStatus = originalItem.ReturnQuantity >= originalItem.Quantity
                    ? "returned"
                    : "partially_returned";

                // Return stock to inventory
                var product = await _context.Products.FindAsync(returnItem.ProductId);
                if (product != null)
                {
                    product.StockLevel += returnItem.ReturnQuantity;
                    product.UpdatedAt = DateTime.UtcNow;
                }
            }

            // Update original sale status if all items fully returned
            bool allFullyReturned = originalSale.LineItems
                .All(li => li.ReturnQuantity >= li.Quantity);

            if (allFullyReturned)
            {
                originalSale.Status = "returned";
            }
            else if (originalSale.LineItems.Any(li => li.ReturnQuantity > 0))
            {
                originalSale.Status = "partially_returned";
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return new ReturnResponseDto
            {
                Message = "Return processed successfully",
                ReturnOrderNumber = returnOrderNumber,
                ReturnSaleId = returnSale.Id,
                RefundAmount = returnTotal,
                OriginalSaleId = originalSale.Id,
                ReturnTransactionId = returnTransactionId,
                ReturnDate = returnSale.ReturnDate ?? DateTime.UtcNow
            };
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Get all returns for a specific sale
    /// </summary>
    public async Task<List<Sale>> GetReturnsForSaleAsync(Guid saleId)
    {
        return await _context.Sales
            .Where(s => s.OriginalSaleId == saleId && s.IsReturn)
            .Include(s => s.LineItems)
                .ThenInclude(li => li.Product)
            .Include(s => s.Customer)
            .OrderByDescending(s => s.ReturnDate)
            .ToListAsync();
    }

    /// <summary>
    /// Check if a sale can be returned (has returnable items)
    /// </summary>
    public async Task<bool> CanReturnSaleAsync(Guid saleId)
    {
        var sale = await _context.Sales
            .Include(s => s.LineItems)
            .FirstOrDefaultAsync(s => s.Id == saleId);

        if (sale == null || sale.IsVoided || sale.IsReturn)
        {
            return false;
        }

        // Check if any items have returnable quantity
        return sale.LineItems.Any(li => li.ReturnQuantity < li.Quantity);
    }
}
