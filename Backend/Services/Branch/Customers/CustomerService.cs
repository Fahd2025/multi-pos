using Backend.Data.Branch;
using Backend.Models.DTOs.Branch.Customers;
using Backend.Models.DTOs.Branch.Sales;
using Backend.Models.Entities.Branch;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Branch.Customers;

/// <summary>
/// Service implementation for customer management operations
/// </summary>
public class CustomerService : ICustomerService
{
    private readonly BranchDbContext _context;

    public CustomerService(BranchDbContext context)
    {
        _context = context;
    }

    public async Task<(List<CustomerDto> Customers, int TotalCount)> GetCustomersAsync(
        string? searchTerm = null,
        bool? isActive = null,
        int page = 1,
        int pageSize = 50)
    {
        var query = _context.Customers.AsQueryable();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(c =>
                c.Code.Contains(searchTerm) ||
                c.NameEn.Contains(searchTerm) ||
                (c.NameAr != null && c.NameAr.Contains(searchTerm)) ||
                (c.Email != null && c.Email.Contains(searchTerm)) ||
                (c.Phone != null && c.Phone.Contains(searchTerm)));
        }

        if (isActive.HasValue)
        {
            query = query.Where(c => c.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();

        var customers = await query
            .OrderBy(c => c.NameEn)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CustomerDto
            {
                Id = c.Id,
                Code = c.Code,
                NameEn = c.NameEn,
                NameAr = c.NameAr,
                Email = c.Email,
                Phone = c.Phone,
                AddressEn = c.AddressEn,
                AddressAr = c.AddressAr,
                BuildingNumber = c.BuildingNumber,
                StreetName = c.StreetName,
                District = c.District,
                City = c.City,
                PostalCode = c.PostalCode,
                AdditionalNumber = c.AdditionalNumber,
                UnitNumber = c.UnitNumber,
                LogoPath = c.LogoPath,
                TotalPurchases = c.TotalPurchases,
                VisitCount = c.VisitCount,
                LastVisitAt = c.LastVisitAt,
                LoyaltyPoints = c.LoyaltyPoints,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                CreatedBy = c.CreatedBy
            })
            .ToListAsync();

        return (customers, totalCount);
    }

    public async Task<CustomerDto?> GetCustomerByIdAsync(Guid customerId)
    {
        var customer = await _context.Customers
            .Where(c => c.Id == customerId)
            .Select(c => new CustomerDto
            {
                Id = c.Id,
                Code = c.Code,
                NameEn = c.NameEn,
                NameAr = c.NameAr,
                Email = c.Email,
                Phone = c.Phone,
                AddressEn = c.AddressEn,
                AddressAr = c.AddressAr,
                BuildingNumber = c.BuildingNumber,
                StreetName = c.StreetName,
                District = c.District,
                City = c.City,
                PostalCode = c.PostalCode,
                AdditionalNumber = c.AdditionalNumber,
                UnitNumber = c.UnitNumber,
                LogoPath = c.LogoPath,
                TotalPurchases = c.TotalPurchases,
                VisitCount = c.VisitCount,
                LastVisitAt = c.LastVisitAt,
                LoyaltyPoints = c.LoyaltyPoints,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                CreatedBy = c.CreatedBy
            })
            .FirstOrDefaultAsync();

        return customer;
    }

    public async Task<CustomerDto> CreateCustomerAsync(CreateCustomerDto dto, Guid userId)
    {
        // Check for duplicate customer code
        var existingCustomer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Code == dto.Code);

        if (existingCustomer != null)
        {
            throw new InvalidOperationException($"A customer with code '{dto.Code}' already exists.");
        }

        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Code = dto.Code,
            NameEn = dto.NameEn,
            NameAr = dto.NameAr,
            Email = dto.Email,
            Phone = dto.Phone,
            AddressEn = dto.AddressEn,
            AddressAr = dto.AddressAr,
            BuildingNumber = dto.BuildingNumber,
            StreetName = dto.StreetName,
            District = dto.District,
            City = dto.City,
            PostalCode = dto.PostalCode,
            AdditionalNumber = dto.AdditionalNumber,
            UnitNumber = dto.UnitNumber,
            LogoPath = dto.LogoPath,
            TotalPurchases = 0,
            VisitCount = 0,
            LastVisitAt = null,
            LoyaltyPoints = dto.LoyaltyPoints,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return new CustomerDto
        {
            Id = customer.Id,
            Code = customer.Code,
            NameEn = customer.NameEn,
            NameAr = customer.NameAr,
            Email = customer.Email,
            Phone = customer.Phone,
            AddressEn = customer.AddressEn,
            AddressAr = customer.AddressAr,
            BuildingNumber = customer.BuildingNumber,
            StreetName = customer.StreetName,
            District = customer.District,
            City = customer.City,
            PostalCode = customer.PostalCode,
            AdditionalNumber = customer.AdditionalNumber,
            UnitNumber = customer.UnitNumber,
            LogoPath = customer.LogoPath,
            TotalPurchases = customer.TotalPurchases,
            VisitCount = customer.VisitCount,
            LastVisitAt = customer.LastVisitAt,
            LoyaltyPoints = customer.LoyaltyPoints,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt,
            UpdatedAt = customer.UpdatedAt,
            CreatedBy = customer.CreatedBy
        };
    }

    public async Task<CustomerDto> UpdateCustomerAsync(Guid customerId, UpdateCustomerDto dto)
    {
        var customer = await _context.Customers.FindAsync(customerId);

        if (customer == null)
        {
            throw new KeyNotFoundException($"Customer with ID '{customerId}' not found.");
        }

        // Check for duplicate customer code (excluding current customer)
        var existingCustomer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Code == dto.Code && c.Id != customerId);

        if (existingCustomer != null)
        {
            throw new InvalidOperationException($"A customer with code '{dto.Code}' already exists.");
        }

        // Update customer properties
        customer.Code = dto.Code;
        customer.NameEn = dto.NameEn;
        customer.NameAr = dto.NameAr;
        customer.Email = dto.Email;
        customer.Phone = dto.Phone;
        customer.AddressEn = dto.AddressEn;
        customer.AddressAr = dto.AddressAr;
        customer.BuildingNumber = dto.BuildingNumber;
        customer.StreetName = dto.StreetName;
        customer.District = dto.District;
        customer.City = dto.City;
        customer.PostalCode = dto.PostalCode;
        customer.AdditionalNumber = dto.AdditionalNumber;
        customer.UnitNumber = dto.UnitNumber;
        customer.LogoPath = dto.LogoPath;
        customer.LoyaltyPoints = dto.LoyaltyPoints;
        customer.IsActive = dto.IsActive;
        customer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new CustomerDto
        {
            Id = customer.Id,
            Code = customer.Code,
            NameEn = customer.NameEn,
            NameAr = customer.NameAr,
            Email = customer.Email,
            Phone = customer.Phone,
            AddressEn = customer.AddressEn,
            AddressAr = customer.AddressAr,
            BuildingNumber = customer.BuildingNumber,
            StreetName = customer.StreetName,
            District = customer.District,
            City = customer.City,
            PostalCode = customer.PostalCode,
            AdditionalNumber = customer.AdditionalNumber,
            UnitNumber = customer.UnitNumber,
            LogoPath = customer.LogoPath,
            TotalPurchases = customer.TotalPurchases,
            VisitCount = customer.VisitCount,
            LastVisitAt = customer.LastVisitAt,
            LoyaltyPoints = customer.LoyaltyPoints,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt,
            UpdatedAt = customer.UpdatedAt,
            CreatedBy = customer.CreatedBy
        };
    }

    public async Task DeleteCustomerAsync(Guid customerId)
    {
        var customer = await _context.Customers.FindAsync(customerId);

        if (customer == null)
        {
            throw new KeyNotFoundException($"Customer with ID '{customerId}' not found.");
        }

        // Soft delete by marking as inactive
        customer.IsActive = false;
        customer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task<(List<SaleDto> Sales, int TotalCount)> GetCustomerPurchaseHistoryAsync(
        Guid customerId,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int page = 1,
        int pageSize = 50)
    {
        var customer = await _context.Customers.FindAsync(customerId);

        if (customer == null)
        {
            throw new KeyNotFoundException($"Customer with ID '{customerId}' not found.");
        }

        var query = _context.Sales
            .Include(s => s.Customer)
            .Include(s => s.LineItems)
                .ThenInclude(li => li.Product)
            .Where(s => s.CustomerId == customerId);

        // Apply date filters
        if (startDate.HasValue)
        {
            query = query.Where(s => s.CreatedAt >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(s => s.CreatedAt <= endDate.Value);
        }

        var totalCount = await query.CountAsync();

        var sales = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SaleDto
            {
                Id = s.Id,
                TransactionId = s.TransactionId,
                InvoiceNumber = s.InvoiceNumber,
                InvoiceType = s.InvoiceType,
                Subtotal = s.Subtotal,
                TaxAmount = s.TaxAmount,
                TotalDiscount = s.TotalDiscount,
                Total = s.Total,
                PaymentMethod = s.PaymentMethod,
                PaymentMethodName = s.PaymentMethod.ToString(),
                PaymentReference = s.PaymentReference,
                CustomerId = s.CustomerId,
                CustomerName = s.Customer != null ? s.Customer.NameEn : null,
                CashierId = s.CashierId,
                CashierName = string.Empty, // Will need to be populated separately if User info is needed
                SaleDate = s.SaleDate,
                IsVoided = s.IsVoided,
                VoidedAt = s.VoidedAt,
                VoidedBy = s.VoidedBy,
                VoidReason = s.VoidReason,
                Notes = s.Notes,
                CreatedAt = s.CreatedAt,
                LineItems = s.LineItems.Select(li => new SaleLineItemDto
                {
                    Id = li.Id,
                    ProductId = li.ProductId,
                    ProductName = li.Product != null ? li.Product.NameEn : string.Empty,
                    Barcode = li.Barcode,
                    Unit = li.Unit,
                    Quantity = li.Quantity,
                    UnitPrice = li.UnitPrice,
                    DiscountType = li.DiscountType,
                    DiscountValue = li.DiscountValue,
                    DiscountedUnitPrice = li.DiscountedUnitPrice,
                    LineTotal = li.LineTotal,
                    Notes = li.Notes
                }).ToList()
            })
            .ToListAsync();

        return (sales, totalCount);
    }

    public async Task<CustomerDto> UpdateCustomerStatsAsync(Guid customerId, decimal saleAmount, int loyaltyPointsEarned = 0)
    {
        var customer = await _context.Customers.FindAsync(customerId);

        if (customer == null)
        {
            throw new KeyNotFoundException($"Customer with ID '{customerId}' not found.");
        }

        // Update customer statistics
        customer.TotalPurchases += saleAmount;
        customer.VisitCount += 1;
        customer.LastVisitAt = DateTime.UtcNow;
        customer.LoyaltyPoints += loyaltyPointsEarned;
        customer.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new CustomerDto
        {
            Id = customer.Id,
            Code = customer.Code,
            NameEn = customer.NameEn,
            NameAr = customer.NameAr,
            Email = customer.Email,
            Phone = customer.Phone,
            AddressEn = customer.AddressEn,
            AddressAr = customer.AddressAr,
            BuildingNumber = customer.BuildingNumber,
            StreetName = customer.StreetName,
            District = customer.District,
            City = customer.City,
            PostalCode = customer.PostalCode,
            AdditionalNumber = customer.AdditionalNumber,
            UnitNumber = customer.UnitNumber,
            LogoPath = customer.LogoPath,
            TotalPurchases = customer.TotalPurchases,
            VisitCount = customer.VisitCount,
            LastVisitAt = customer.LastVisitAt,
            LoyaltyPoints = customer.LoyaltyPoints,
            IsActive = customer.IsActive,
            CreatedAt = customer.CreatedAt,
            UpdatedAt = customer.UpdatedAt,
            CreatedBy = customer.CreatedBy
        };
    }
}
