using Backend.Data;
using Backend.Models.DTOs.Suppliers;
using Backend.Models.Entities.Branch;
using Backend.Models.Entities.HeadOffice;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Suppliers;

/// <summary>
/// Service for supplier management operations
/// </summary>
public class SupplierService : ISupplierService
{
    private readonly DbContextFactory _dbContextFactory;
    private readonly HeadOfficeDbContext _headOfficeContext;

    public SupplierService(DbContextFactory dbContextFactory, HeadOfficeDbContext headOfficeContext)
    {
        _dbContextFactory = dbContextFactory;
        _headOfficeContext = headOfficeContext;
    }

    private async Task<Branch> GetBranchAsync(Guid branchId)
    {
        var branch = await _headOfficeContext.Branches
            .FirstOrDefaultAsync(b => b.Id == branchId && b.IsActive);

        if (branch == null)
        {
            throw new InvalidOperationException($"Branch with ID '{branchId}' not found or inactive.");
        }

        return branch;
    }

    public async Task<(List<SupplierDto> Suppliers, int TotalCount)> GetSuppliersAsync(
        Guid branchId,
        bool includeInactive = false,
        string? searchTerm = null,
        int page = 1,
        int pageSize = 50)
    {
        var branch = await GetBranchAsync(branchId);
        await using var context = _dbContextFactory.CreateBranchContext(branch);

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

        // Load suppliers with their purchases
        var suppliersEntities = await query
            .OrderBy(s => s.NameEn)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Map to DTOs with calculations done client-side (to avoid SQLite decimal Sum issues)
        var suppliers = suppliersEntities.Select(s => new SupplierDto
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
                .Where(p => p.PaymentStatus == PaymentStatus.Paid)
                .Sum(p => p.TotalCost),
            LastPurchaseDate = s.Purchases
                .OrderByDescending(p => p.PurchaseDate)
                .Select(p => (DateTime?)p.PurchaseDate)
                .FirstOrDefault()
        }).ToList();

        return (suppliers, totalCount);
    }

    public async Task<SupplierDto?> GetSupplierByIdAsync(Guid branchId, Guid supplierId)
    {
        var branch = await GetBranchAsync(branchId);
        await using var context = _dbContextFactory.CreateBranchContext(branch);

        var supplier = await context.Suppliers
            .Include(s => s.Purchases)
            .FirstOrDefaultAsync(s => s.Id == supplierId);

        if (supplier == null)
        {
            return null;
        }

        // Calculate purchase statistics client-side to avoid SQLite decimal Sum issues
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
                .Where(p => p.PaymentStatus == PaymentStatus.Paid)
                .Sum(p => p.TotalCost),
            LastPurchaseDate = supplier.Purchases
                .OrderByDescending(p => p.PurchaseDate)
                .Select(p => (DateTime?)p.PurchaseDate)
                .FirstOrDefault()
        };
    }

    public async Task<SupplierDto> CreateSupplierAsync(Guid branchId, CreateSupplierDto createDto, Guid createdByUserId)
    {
        var branch = await GetBranchAsync(branchId);
        await using var context = _dbContextFactory.CreateBranchContext(branch);

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
        var branch = await GetBranchAsync(branchId);
        await using var context = _dbContextFactory.CreateBranchContext(branch);

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

        // Calculate purchase statistics client-side to avoid SQLite decimal Sum issues
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
                .Where(p => p.PaymentStatus == PaymentStatus.Paid)
                .Sum(p => p.TotalCost),
            LastPurchaseDate = supplier.Purchases
                .OrderByDescending(p => p.PurchaseDate)
                .Select(p => (DateTime?)p.PurchaseDate)
                .FirstOrDefault()
        };
    }

    public async Task DeleteSupplierAsync(Guid branchId, Guid supplierId)
    {
        var branch = await GetBranchAsync(branchId);
        await using var context = _dbContextFactory.CreateBranchContext(branch);

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
        var branch = await GetBranchAsync(branchId);
        await using var context = _dbContextFactory.CreateBranchContext(branch);

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
