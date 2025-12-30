using System.Text.Json;
using Backend.Data.Branch;
using Backend.Models.DTOs.Returns;
using Backend.Models.Entities.Branch;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Branch.Returns;

/// <summary>
/// Service for handling returns and refunds
/// </summary>
public class ReturnService : IReturnService
{
    private readonly BranchDbContext _context;
    private readonly ILogger<ReturnService> _logger;

    public ReturnService(BranchDbContext context, ILogger<ReturnService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ReturnDto> CreateReturnAsync(Guid branchId, CreateReturnDto dto, Guid userId)
    {
        // Validate original sale exists
        var originalSale = await _context.Sales
            .Include(s => s.LineItems)
            .ThenInclude(li => li.Product)
            .Include(s => s.Customer)
            .FirstOrDefaultAsync(s => s.Id == dto.OriginalSaleId);

        if (originalSale == null)
        {
            throw new KeyNotFoundException($"Sale with ID {dto.OriginalSaleId} not found");
        }

        if (originalSale.IsVoided)
        {
            throw new InvalidOperationException("Cannot create return for a voided sale");
        }

        // Validate return policy
        var (isValid, errorMessage) = await ValidateReturnPolicyAsync(branchId, dto.OriginalSaleId, DateTime.UtcNow);
        if (!isValid)
        {
            throw new InvalidOperationException(errorMessage ?? "Return does not meet policy requirements");
        }

        // Validate line items
        foreach (var lineItemDto in dto.LineItems)
        {
            var saleLineItem = originalSale.LineItems.FirstOrDefault(li => li.Id == lineItemDto.SaleLineItemId);
            if (saleLineItem == null)
            {
                throw new InvalidOperationException($"Sale line item {lineItemDto.SaleLineItemId} not found in original sale");
            }

            if (lineItemDto.Quantity > saleLineItem.Quantity)
            {
                throw new InvalidOperationException($"Return quantity {lineItemDto.Quantity} exceeds original quantity {saleLineItem.Quantity}");
            }
        }

        // Get active policy
        var policy = await GetActivePolicyAsync(branchId);
        var requiresApproval = policy?.RequireManagerApproval ?? false;

        // Calculate totals
        decimal subtotal = 0;
        var returnLineItems = new List<ReturnLineItem>();

        foreach (var lineItemDto in dto.LineItems)
        {
            var saleLineItem = originalSale.LineItems.First(li => li.Id == lineItemDto.SaleLineItemId);
            var lineTotal = lineItemDto.Quantity * (saleLineItem.UnitPrice - saleLineItem.DiscountValue);

            returnLineItems.Add(new ReturnLineItem
            {
                SaleLineItemId = lineItemDto.SaleLineItemId,
                ProductId = saleLineItem.ProductId,
                Quantity = lineItemDto.Quantity,
                UnitPrice = saleLineItem.UnitPrice,
                DiscountValue = saleLineItem.DiscountValue,
                Condition = lineItemDto.Condition,
                LineTotal = lineTotal,
                Notes = lineItemDto.Notes
            });

            subtotal += lineTotal;
        }

        // Calculate tax (proportional to original)
        var taxRate = originalSale.Subtotal > 0 ? originalSale.TaxAmount / originalSale.Subtotal : 0;
        var taxAmount = subtotal * taxRate;

        // Calculate restocking fee
        var restockingFeePercent = policy?.RestockingFeePercent ?? 0;
        var restockingFee = subtotal * (restockingFeePercent / 100);

        // Create return
        var returnEntity = new Return
        {
            BranchId = branchId,
            OriginalSaleId = dto.OriginalSaleId,
            CustomerId = originalSale.CustomerId,
            ReturnDate = DateTime.UtcNow,
            Reason = dto.Reason,
            Status = requiresApproval ? ReturnStatus.Pending : ReturnStatus.Approved,
            Subtotal = subtotal,
            TaxAmount = taxAmount,
            RestockingFee = restockingFee,
            Total = subtotal + taxAmount - restockingFee,
            ProcessedBy = userId,
            Notes = dto.Notes,
            ReturnPolicyId = policy?.Id,
            LineItems = returnLineItems
        };

        // If no approval required, auto-approve
        if (!requiresApproval)
        {
            returnEntity.ApprovedBy = userId;
            returnEntity.ApprovedAt = DateTime.UtcNow;
        }

        _context.Returns.Add(returnEntity);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Return {ReturnId} created for sale {SaleId} by user {UserId}. Status: {Status}",
            returnEntity.Id, dto.OriginalSaleId, userId, returnEntity.Status);

        return await MapToDto(returnEntity);
    }

    public async Task<(bool IsValid, string? ErrorMessage)> ValidateReturnPolicyAsync(Guid branchId, Guid saleId, DateTime returnDate)
    {
        var sale = await _context.Sales.FindAsync(saleId);
        if (sale == null)
        {
            return (false, "Sale not found");
        }

        var policy = await GetActivePolicyAsync(branchId);
        if (policy == null)
        {
            // No policy means returns are not configured
            return (false, "No return policy configured for this branch");
        }

        // Check return window
        var daysSinceSale = (returnDate - sale.SaleDate).TotalDays;
        if (daysSinceSale > policy.MaxReturnDays)
        {
            return (false, $"Return window has expired. Returns must be made within {policy.MaxReturnDays} days");
        }

        return (true, null);
    }

    public async Task<ReturnDto> ApproveReturnAsync(Guid returnId, ApproveReturnDto dto, Guid managerId)
    {
        var returnEntity = await _context.Returns
            .Include(r => r.LineItems)
            .FirstOrDefaultAsync(r => r.Id == returnId);

        if (returnEntity == null)
        {
            throw new KeyNotFoundException($"Return with ID {returnId} not found");
        }

        if (returnEntity.Status != ReturnStatus.Pending)
        {
            throw new InvalidOperationException($"Return is not in pending status. Current status: {returnEntity.Status}");
        }

        returnEntity.ApprovedBy = managerId;
        returnEntity.ApprovedAt = DateTime.UtcNow;
        returnEntity.Status = dto.Approved ? ReturnStatus.Approved : ReturnStatus.Rejected;

        if (!string.IsNullOrEmpty(dto.Notes))
        {
            returnEntity.Notes = string.IsNullOrEmpty(returnEntity.Notes)
                ? dto.Notes
                : $"{returnEntity.Notes}\n\nManager Notes: {dto.Notes}";
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Return {ReturnId} {Status} by manager {ManagerId}",
            returnId, returnEntity.Status, managerId);

        return await MapToDto(returnEntity);
    }

    public async Task<ReturnDto> ProcessReturnAsync(Guid returnId, ProcessReturnDto dto, Guid userId)
    {
        var returnEntity = await _context.Returns
            .Include(r => r.LineItems)
            .ThenInclude(li => li.Product)
            .Include(r => r.Customer)
            .FirstOrDefaultAsync(r => r.Id == returnId);

        if (returnEntity == null)
        {
            throw new KeyNotFoundException($"Return with ID {returnId} not found");
        }

        if (returnEntity.Status != ReturnStatus.Approved)
        {
            throw new InvalidOperationException($"Return must be approved before processing. Current status: {returnEntity.Status}");
        }

        if (returnEntity.Status == ReturnStatus.Completed)
        {
            throw new InvalidOperationException("Return has already been completed");
        }

        // Update return status
        returnEntity.Status = ReturnStatus.Completed;
        returnEntity.RefundMethod = dto.RefundMethod;
        returnEntity.RefundReference = dto.RefundReference;
        returnEntity.CompletedAt = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(dto.Notes))
        {
            returnEntity.Notes = string.IsNullOrEmpty(returnEntity.Notes)
                ? dto.Notes
                : $"{returnEntity.Notes}\n\nCompletion Notes: {dto.Notes}";
        }

        // Restock items if requested
        if (dto.RestockItems)
        {
            foreach (var lineItem in returnEntity.LineItems)
            {
                var product = lineItem.Product ?? await _context.Products.FindAsync(lineItem.ProductId);
                if (product != null)
                {
                    product.StockLevel += lineItem.Quantity;
                    product.UpdatedAt = DateTime.UtcNow;

                    lineItem.Restocked = true;
                    lineItem.RestockedAt = DateTime.UtcNow;

                    _logger.LogInformation("Restocked product {ProductId}: +{Quantity} units (Return {ReturnId})",
                        product.Id, lineItem.Quantity, returnId);
                }
            }
        }

        // Update customer stats if customer exists
        if (returnEntity.CustomerId.HasValue && returnEntity.Customer != null)
        {
            var customer = returnEntity.Customer;
            customer.TotalPurchases -= returnEntity.Total;
            if (customer.VisitCount > 0)
            {
                customer.VisitCount--;
            }
            customer.UpdatedAt = DateTime.UtcNow;

            _logger.LogInformation("Updated customer {CustomerId} stats for return {ReturnId}",
                customer.Id, returnId);
        }

        // If refund method is store credit, add to customer account
        if (dto.RefundMethod == RefundMethod.StoreCredit && returnEntity.CustomerId.HasValue)
        {
            var customer = returnEntity.Customer ?? await _context.Customers.FindAsync(returnEntity.CustomerId.Value);
            if (customer != null)
            {
                // Note: StoreCredit field should be added to Customer entity in future
                // For now, we'll just log it
                _logger.LogInformation("Store credit of {Amount} should be added to customer {CustomerId}",
                    returnEntity.Total, customer.Id);
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Return {ReturnId} completed by user {UserId}. Refund: {Amount} via {Method}",
            returnId, userId, returnEntity.Total, dto.RefundMethod);

        return await MapToDto(returnEntity);
    }

    public async Task<List<ReturnDto>> GetReturnsAsync(Guid branchId, string? status = null, DateTime? startDate = null, DateTime? endDate = null, int page = 1, int pageSize = 20)
    {
        var query = _context.Returns
            .Include(r => r.OriginalSale)
            .Include(r => r.Customer)
            .Include(r => r.ProcessedByUser)
            .Include(r => r.ApprovedByUser)
            .Include(r => r.LineItems)
            .ThenInclude(li => li.Product)
            .Where(r => r.BranchId == branchId);

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status == status);
        }

        if (startDate.HasValue)
        {
            query = query.Where(r => r.ReturnDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(r => r.ReturnDate <= endDate.Value);
        }

        var returns = await query
            .OrderByDescending(r => r.ReturnDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = new List<ReturnDto>();
        foreach (var returnEntity in returns)
        {
            dtos.Add(await MapToDto(returnEntity));
        }

        return dtos;
    }

    public async Task<ReturnDto?> GetReturnByIdAsync(Guid returnId)
    {
        var returnEntity = await _context.Returns
            .Include(r => r.OriginalSale)
            .Include(r => r.Customer)
            .Include(r => r.ProcessedByUser)
            .Include(r => r.ApprovedByUser)
            .Include(r => r.LineItems)
            .ThenInclude(li => li.Product)
            .FirstOrDefaultAsync(r => r.Id == returnId);

        return returnEntity != null ? await MapToDto(returnEntity) : null;
    }

    public async Task<decimal> CalculateRestockingFeeAsync(Guid returnId)
    {
        var returnEntity = await _context.Returns.FindAsync(returnId);
        if (returnEntity == null)
        {
            throw new KeyNotFoundException($"Return with ID {returnId} not found");
        }

        return returnEntity.RestockingFee;
    }

    public async Task<ReturnPolicyDto?> GetActivePolicyAsync(Guid branchId)
    {
        var policy = await _context.ReturnPolicies
            .Where(p => p.BranchId == branchId && p.IsActive)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();

        if (policy == null)
        {
            return null;
        }

        return new ReturnPolicyDto
        {
            Id = policy.Id,
            BranchId = policy.BranchId,
            MaxReturnDays = policy.MaxReturnDays,
            RequireReceipt = policy.RequireReceipt,
            RequireManagerApproval = policy.RequireManagerApproval,
            AllowedConditions = policy.AllowedConditions,
            RestockingFeePercent = policy.RestockingFeePercent,
            RefundMethods = policy.RefundMethods,
            ExchangeAllowed = policy.ExchangeAllowed,
            IsActive = policy.IsActive,
            Notes = policy.Notes,
            CreatedAt = policy.CreatedAt,
            UpdatedAt = policy.UpdatedAt
        };
    }

    public async Task<ReturnPolicyDto> UpdatePolicyAsync(Guid branchId, UpdateReturnPolicyDto dto, Guid userId)
    {
        // Deactivate existing policies
        var existingPolicies = await _context.ReturnPolicies
            .Where(p => p.BranchId == branchId && p.IsActive)
            .ToListAsync();

        foreach (var policy in existingPolicies)
        {
            policy.IsActive = false;
            policy.UpdatedAt = DateTime.UtcNow;
            policy.UpdatedBy = userId;
        }

        // Create new policy
        var newPolicy = new ReturnPolicy
        {
            BranchId = branchId,
            MaxReturnDays = dto.MaxReturnDays,
            RequireReceipt = dto.RequireReceipt,
            RequireManagerApproval = dto.RequireManagerApproval,
            AllowedConditions = JsonSerializer.Serialize(dto.AllowedConditions),
            RestockingFeePercent = dto.RestockingFeePercent,
            RefundMethods = JsonSerializer.Serialize(dto.RefundMethods),
            ExchangeAllowed = dto.ExchangeAllowed,
            IsActive = true,
            Notes = dto.Notes,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        _context.ReturnPolicies.Add(newPolicy);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Return policy updated for branch {BranchId} by user {UserId}",
            branchId, userId);

        return new ReturnPolicyDto
        {
            Id = newPolicy.Id,
            BranchId = newPolicy.BranchId,
            MaxReturnDays = newPolicy.MaxReturnDays,
            RequireReceipt = newPolicy.RequireReceipt,
            RequireManagerApproval = newPolicy.RequireManagerApproval,
            AllowedConditions = newPolicy.AllowedConditions,
            RestockingFeePercent = newPolicy.RestockingFeePercent,
            RefundMethods = newPolicy.RefundMethods,
            ExchangeAllowed = newPolicy.ExchangeAllowed,
            IsActive = newPolicy.IsActive,
            Notes = newPolicy.Notes,
            CreatedAt = newPolicy.CreatedAt,
            UpdatedAt = newPolicy.UpdatedAt
        };
    }

    // Helper methods
    private async Task<ReturnDto> MapToDto(Return returnEntity)
    {
        // Load related entities if not already loaded
        if (returnEntity.OriginalSale == null)
        {
            returnEntity.OriginalSale = await _context.Sales.FindAsync(returnEntity.OriginalSaleId);
        }
        if (returnEntity.Customer == null && returnEntity.CustomerId.HasValue)
        {
            returnEntity.Customer = await _context.Customers.FindAsync(returnEntity.CustomerId.Value);
        }
        if (returnEntity.ProcessedByUser == null)
        {
            returnEntity.ProcessedByUser = await _context.Users.FindAsync(returnEntity.ProcessedBy);
        }
        if (returnEntity.ApprovedByUser == null && returnEntity.ApprovedBy.HasValue)
        {
            returnEntity.ApprovedByUser = await _context.Users.FindAsync(returnEntity.ApprovedBy.Value);
        }

        var lineItemDtos = new List<ReturnLineItemDto>();
        foreach (var lineItem in returnEntity.LineItems)
        {
            if (lineItem.Product == null)
            {
                lineItem.Product = await _context.Products.FindAsync(lineItem.ProductId);
            }

            lineItemDtos.Add(new ReturnLineItemDto
            {
                Id = lineItem.Id,
                ReturnId = lineItem.ReturnId,
                SaleLineItemId = lineItem.SaleLineItemId,
                ProductId = lineItem.ProductId,
                ProductName = lineItem.Product?.NameEn ?? "Unknown",
                ProductSKU = lineItem.Product?.SKU ?? "",
                Quantity = lineItem.Quantity,
                UnitPrice = lineItem.UnitPrice,
                DiscountValue = lineItem.DiscountValue,
                Condition = lineItem.Condition,
                LineTotal = lineItem.LineTotal,
                Notes = lineItem.Notes,
                Restocked = lineItem.Restocked,
                RestockedAt = lineItem.RestockedAt
            });
        }

        return new ReturnDto
        {
            Id = returnEntity.Id,
            BranchId = returnEntity.BranchId,
            OriginalSaleId = returnEntity.OriginalSaleId,
            OriginalSaleInvoiceNumber = returnEntity.OriginalSale?.InvoiceNumber ?? "",
            CustomerId = returnEntity.CustomerId,
            CustomerName = returnEntity.Customer?.NameEn,
            ReturnDate = returnEntity.ReturnDate,
            Reason = returnEntity.Reason,
            Status = returnEntity.Status,
            Subtotal = returnEntity.Subtotal,
            TaxAmount = returnEntity.TaxAmount,
            RestockingFee = returnEntity.RestockingFee,
            Total = returnEntity.Total,
            RefundMethod = returnEntity.RefundMethod,
            RefundReference = returnEntity.RefundReference,
            ProcessedBy = returnEntity.ProcessedBy,
            ProcessedByUsername = returnEntity.ProcessedByUser?.Username ?? "Unknown",
            ApprovedBy = returnEntity.ApprovedBy,
            ApprovedByUsername = returnEntity.ApprovedByUser?.Username,
            ApprovedAt = returnEntity.ApprovedAt,
            CompletedAt = returnEntity.CompletedAt,
            Notes = returnEntity.Notes,
            ReturnPolicyId = returnEntity.ReturnPolicyId,
            IsExchange = returnEntity.IsExchange,
            ExchangeSaleId = returnEntity.ExchangeSaleId,
            LineItems = lineItemDtos
        };
    }
}
