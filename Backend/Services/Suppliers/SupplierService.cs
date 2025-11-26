using Backend.Data;
using Backend.Models.DTOs.Suppliers;
using Backend.Models.Entities.Branch;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Suppliers;

/// <summary>
/// Service for supplier management operations
/// </summary>
public class SupplierService : ISupplierService
{
    private readonly DbContextFactory _dbContextFactory;

    public SupplierService(DbContextFactory dbContextFactory)
    {
        _dbContextFactory = dbContextFactory;
    }

    public async Task<(List<SupplierDto> Suppliers, int TotalCount)> GetSuppliersAsync(
        Guid branchId,
        bool includeInactive = false,
        string? searchTerm = null,
        int page = 1,
        int pageSize = 50)
    {
        await using var context = _dbContextFactory.CreateBranchDbContext(branchId);

        var query = context.Suppliers
            .Include(s => s.Purchases)
            .AsQueryable();

        // Filter inactive suppliers
        if (!includeInactive)
        {
            query = query.Where(s => s.IsActive);
        }

        // Search filter
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var search = searchTerm.ToLower();
            query = query.Where(s =>
                s.Code.ToLower().Contains(search) ||
                s.NameEn.ToLower().Contains(search) ||
                (s.NameAr != null && s.NameAr.ToLower().Contains(search)) ||
                (s.Email != null && s.Email.ToLower().Contains(search)) ||
                (s.Phone != null && s.Phone.Contains(search))
            );
        }

        var totalCount = await query.CountAsync();

        var suppliers = await query
            .OrderBy(s => s.NameEn)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SupplierDto
            {
                Id = s.Id,
                Code = s.Code,
                NameEn = s.NameEn,
                NameAr = s.NameAr,
                Email = s.Email,
                Phone = s.Phone,
                AddressEn = s.AddressEn,
                AddressAr = s.AddressAr,
                LogoPath = s.LogoPath,
                PaymentTerms = s.PaymentTerms,
                DeliveryTerms = s.DeliveryTerms,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt,
                TotalPurchases = s.Purchases.Count,
                TotalSpent = s.Purchases
                    .Where(p => p.Status == Models.Entities.Branch.PaymentStatus.Completed)
                    .Sum(p => p.TotalAmount),
                LastPurchaseDate = s.Purchases
                    .OrderByDescending(p => p.PurchaseDate)
                    .Select(p => (DateTime?)p.PurchaseDate)
                    .FirstOrDefault()
            })
            .ToListAsync();

        return (suppliers, totalCount);
    }

    public async Task<SupplierDto?> GetSupplierByIdAsync(Guid branchId, Guid supplierId)
    {
        await using var context = _dbContextFactory.CreateBranchDbContext(branchId);

        var supplier = await context.Suppliers
            .Include(s => s.Purchases)
            .FirstOrDefaultAsync(s => s.Id == supplierId);

        if (supplier == null)
        {
            return null;
        }

        return new SupplierDto
        {
            Id = supplier.Id,
            Code = supplier.Code,
            NameEn = supplier.NameEn,
            NameAr = supplier.NameAr,
            Email = supplier.Email,
            Phone = supplier.Phone,
            AddressEn = supplier.AddressEn,
            AddressAr = supplier.AddressAr,
            LogoPath = supplier.LogoPath,
            PaymentTerms = supplier.PaymentTerms,
            DeliveryTerms = supplier.DeliveryTerms,
            IsActive = supplier.IsActive,
            CreatedAt = supplier.CreatedAt,
            UpdatedAt = supplier.UpdatedAt,
            TotalPurchases = supplier.Purchases.Count,
            TotalSpent = supplier.Purchases
                .Where(p => p.Status == Models.Entities.Branch.PaymentStatus.Completed)
                .Sum(p => p.TotalAmount),
            LastPurchaseDate = supplier.Purchases
                .OrderByDescending(p => p.PurchaseDate)
                .Select(p => (DateTime?)p.PurchaseDate)
                .FirstOrDefault()
        };
    }

    public async Task<SupplierDto> CreateSupplierAsync(Guid branchId, CreateSupplierDto createDto, Guid createdByUserId)
    {
        await using var context = _dbContextFactory.CreateBranchDbContext(branchId);

        // Check if code already exists
        var existingSupplier = await context.Suppliers
            .FirstOrDefaultAsync(s => s.Code == createDto.Code);

        if (existingSupplier != null)
        {
            throw new InvalidOperationException($"Supplier with code '{createDto.Code}' already exists.");
        }

        var supplier = new Supplier
        {
            Id = Guid.NewGuid(),
            Code = createDto.Code,
            NameEn = createDto.NameEn,
            NameAr = createDto.NameAr,
            Email = createDto.Email,
            Phone = createDto.Phone,
            AddressEn = createDto.AddressEn,
            AddressAr = createDto.AddressAr,
            PaymentTerms = createDto.PaymentTerms,
            DeliveryTerms = createDto.DeliveryTerms,
            IsActive = createDto.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = createdByUserId
        };

        context.Suppliers.Add(supplier);
        await context.SaveChangesAsync();

        return new SupplierDto
        {
            Id = supplier.Id,
            Code = supplier.Code,
            NameEn = supplier.NameEn,
            NameAr = supplier.NameAr,
            Email = supplier.Email,
            Phone = supplier.Phone,
            AddressEn = supplier.AddressEn,
            AddressAr = supplier.AddressAr,
            LogoPath = supplier.LogoPath,
            PaymentTerms = supplier.PaymentTerms,
            DeliveryTerms = supplier.DeliveryTerms,
            IsActive = supplier.IsActive,
            CreatedAt = supplier.CreatedAt,
            UpdatedAt = supplier.UpdatedAt,
            TotalPurchases = 0,
            TotalSpent = 0,
            LastPurchaseDate = null
        };
    }

    public async Task<SupplierDto> UpdateSupplierAsync(Guid branchId, Guid supplierId, UpdateSupplierDto updateDto)
    {
        await using var context = _dbContextFactory.CreateBranchDbContext(branchId);

        var supplier = await context.Suppliers
            .Include(s => s.Purchases)
            .FirstOrDefaultAsync(s => s.Id == supplierId);

        if (supplier == null)
        {
            throw new KeyNotFoundException($"Supplier with ID '{supplierId}' not found.");
        }

        // Check code uniqueness if changed
        if (updateDto.Code != null && updateDto.Code != supplier.Code)
        {
            var existingSupplier = await context.Suppliers
                .FirstOrDefaultAsync(s => s.Code == updateDto.Code && s.Id != supplierId);

            if (existingSupplier != null)
            {
                throw new InvalidOperationException($"Supplier with code '{updateDto.Code}' already exists.");
            }

            supplier.Code = updateDto.Code;
        }

        // Update fields if provided
        if (updateDto.NameEn != null) supplier.NameEn = updateDto.NameEn;
        if (updateDto.NameAr != null) supplier.NameAr = updateDto.NameAr;
        if (updateDto.Email != null) supplier.Email = updateDto.Email;
        if (updateDto.Phone != null) supplier.Phone = updateDto.Phone;
        if (updateDto.AddressEn != null) supplier.AddressEn = updateDto.AddressEn;
        if (updateDto.AddressAr != null) supplier.AddressAr = updateDto.AddressAr;
        if (updateDto.PaymentTerms != null) supplier.PaymentTerms = updateDto.PaymentTerms;
        if (updateDto.DeliveryTerms != null) supplier.DeliveryTerms = updateDto.DeliveryTerms;
        if (updateDto.IsActive.HasValue) supplier.IsActive = updateDto.IsActive.Value;

        supplier.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();

        return new SupplierDto
        {
            Id = supplier.Id,
            Code = supplier.Code,
            NameEn = supplier.NameEn,
            NameAr = supplier.NameAr,
            Email = supplier.Email,
            Phone = supplier.Phone,
            AddressEn = supplier.AddressEn,
            AddressAr = supplier.AddressAr,
            LogoPath = supplier.LogoPath,
            PaymentTerms = supplier.PaymentTerms,
            DeliveryTerms = supplier.DeliveryTerms,
            IsActive = supplier.IsActive,
            CreatedAt = supplier.CreatedAt,
            UpdatedAt = supplier.UpdatedAt,
            TotalPurchases = supplier.Purchases.Count,
            TotalSpent = supplier.Purchases
                .Where(p => p.Status == Models.Entities.Branch.PaymentStatus.Completed)
                .Sum(p => p.TotalAmount),
            LastPurchaseDate = supplier.Purchases
                .OrderByDescending(p => p.PurchaseDate)
                .Select(p => (DateTime?)p.PurchaseDate)
                .FirstOrDefault()
        };
    }

    public async Task DeleteSupplierAsync(Guid branchId, Guid supplierId)
    {
        await using var context = _dbContextFactory.CreateBranchDbContext(branchId);

        var supplier = await context.Suppliers
            .Include(s => s.Purchases)
            .FirstOrDefaultAsync(s => s.Id == supplierId);

        if (supplier == null)
        {
            throw new KeyNotFoundException($"Supplier with ID '{supplierId}' not found.");
        }

        // Check if supplier has purchases
        if (supplier.Purchases.Any())
        {
            // Soft delete - just mark as inactive
            supplier.IsActive = false;
            supplier.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();
        }
        else
        {
            // Hard delete if no purchases
            context.Suppliers.Remove(supplier);
            await context.SaveChangesAsync();
        }
    }

    public async Task<List<Purchase>> GetSupplierPurchaseHistoryAsync(Guid branchId, Guid supplierId, int page = 1, int pageSize = 50)
    {
        await using var context = _dbContextFactory.CreateBranchDbContext(branchId);

        var purchases = await context.Purchases
            .Where(p => p.SupplierId == supplierId)
            .Include(p => p.LineItems)
            .ThenInclude(li => li.Product)
            .OrderByDescending(p => p.PurchaseDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return purchases;
    }
}
