using Backend.Data;
using Backend.Models.DTOs.Inventory;
using Backend.Models.Entities.Branch;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Inventory;

/// <summary>
/// Service implementation for inventory management operations
/// </summary>
public class InventoryService : IInventoryService
{
    private readonly BranchDbContext _context;

    public InventoryService(BranchDbContext context)
    {
        _context = context;
    }

    #region Product Operations

    public async Task<(List<ProductDto> Products, int TotalCount)> GetProductsAsync(
        string? searchTerm = null,
        Guid? categoryId = null,
        bool? isActive = null,
        bool? lowStockOnly = null,
        int page = 1,
        int pageSize = 50)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .Include(p => p.ProductImages)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(p =>
                p.NameEn.Contains(searchTerm) ||
                p.NameAr.Contains(searchTerm) ||
                p.SKU.Contains(searchTerm) ||
                (p.Barcode != null && p.Barcode.Contains(searchTerm)));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(p => p.IsActive == isActive.Value);
        }

        if (lowStockOnly == true)
        {
            query = query.Where(p => p.StockLevel <= p.MinStockThreshold);
        }

        var totalCount = await query.CountAsync();

        var products = await query
            .OrderBy(p => p.NameEn)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                SKU = p.SKU,
                NameEn = p.NameEn,
                NameAr = p.NameAr,
                DescriptionEn = p.DescriptionEn,
                DescriptionAr = p.DescriptionAr,
                CategoryId = p.CategoryId,
                CategoryNameEn = p.Category.NameEn,
                CategoryNameAr = p.Category.NameAr,
                SellingPrice = p.SellingPrice,
                CostPrice = p.CostPrice,
                StockLevel = p.StockLevel,
                MinStockThreshold = p.MinStockThreshold,
                HasInventoryDiscrepancy = p.HasInventoryDiscrepancy,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier != null ? p.Supplier.NameEn : null,
                Barcode = p.Barcode,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                CreatedBy = p.CreatedBy,
                ImagePaths = p.ProductImages
                    .OrderBy(i => i.DisplayOrder)
                    .Select(i => i.ImagePath)
                    .ToList()
            })
            .ToListAsync();

        return (products, totalCount);
    }

    public async Task<ProductDto?> GetProductByIdAsync(Guid productId)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .Include(p => p.ProductImages)
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
            return null;

        return new ProductDto
        {
            Id = product.Id,
            SKU = product.SKU,
            NameEn = product.NameEn,
            NameAr = product.NameAr,
            DescriptionEn = product.DescriptionEn,
            DescriptionAr = product.DescriptionAr,
            CategoryId = product.CategoryId,
            CategoryNameEn = product.Category.NameEn,
            CategoryNameAr = product.Category.NameAr,
            SellingPrice = product.SellingPrice,
            CostPrice = product.CostPrice,
            StockLevel = product.StockLevel,
            MinStockThreshold = product.MinStockThreshold,
            HasInventoryDiscrepancy = product.HasInventoryDiscrepancy,
            SupplierId = product.SupplierId,
            SupplierName = product.Supplier?.NameEn,
            Barcode = product.Barcode,
            IsActive = product.IsActive,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,
            CreatedBy = product.CreatedBy,
            ImagePaths = product.ProductImages
                .OrderBy(i => i.DisplayOrder)
                .Select(i => i.ImagePath)
                .ToList()
        };
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductDto dto, Guid userId)
    {
        // Validate category exists
        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
            throw new InvalidOperationException("Category not found");

        // Validate SKU is unique
        var skuExists = await _context.Products
            .AnyAsync(p => p.SKU == dto.SKU);
        if (skuExists)
            throw new InvalidOperationException($"Product with SKU '{dto.SKU}' already exists");

        // Validate supplier exists (if provided)
        if (dto.SupplierId.HasValue)
        {
            var supplierExists = await _context.Suppliers
                .AnyAsync(s => s.Id == dto.SupplierId.Value);
            if (!supplierExists)
                throw new InvalidOperationException("Supplier not found");
        }

        var product = new Product
        {
            Id = Guid.NewGuid(),
            SKU = dto.SKU,
            NameEn = dto.NameEn,
            NameAr = dto.NameAr,
            DescriptionEn = dto.DescriptionEn,
            DescriptionAr = dto.DescriptionAr,
            CategoryId = dto.CategoryId,
            SellingPrice = dto.SellingPrice,
            CostPrice = dto.CostPrice,
            StockLevel = dto.StockLevel,
            MinStockThreshold = dto.MinStockThreshold,
            HasInventoryDiscrepancy = dto.StockLevel < 0,
            SupplierId = dto.SupplierId,
            Barcode = dto.Barcode,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return (await GetProductByIdAsync(product.Id))!;
    }

    public async Task<ProductDto> UpdateProductAsync(Guid productId, UpdateProductDto dto)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null)
            throw new InvalidOperationException("Product not found");

        // Validate category exists
        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
            throw new InvalidOperationException("Category not found");

        // Validate SKU is unique (excluding current product)
        var skuExists = await _context.Products
            .AnyAsync(p => p.SKU == dto.SKU && p.Id != productId);
        if (skuExists)
            throw new InvalidOperationException($"Product with SKU '{dto.SKU}' already exists");

        // Validate supplier exists (if provided)
        if (dto.SupplierId.HasValue)
        {
            var supplierExists = await _context.Suppliers
                .AnyAsync(s => s.Id == dto.SupplierId.Value);
            if (!supplierExists)
                throw new InvalidOperationException("Supplier not found");
        }

        product.SKU = dto.SKU;
        product.NameEn = dto.NameEn;
        product.NameAr = dto.NameAr;
        product.DescriptionEn = dto.DescriptionEn;
        product.DescriptionAr = dto.DescriptionAr;
        product.CategoryId = dto.CategoryId;
        product.SellingPrice = dto.SellingPrice;
        product.CostPrice = dto.CostPrice;
        product.MinStockThreshold = dto.MinStockThreshold;
        product.SupplierId = dto.SupplierId;
        product.Barcode = dto.Barcode;
        product.IsActive = dto.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return (await GetProductByIdAsync(product.Id))!;
    }

    public async Task DeleteProductAsync(Guid productId)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null)
            throw new InvalidOperationException("Product not found");

        // Check if product is used in any sales
        var usedInSales = await _context.SaleLineItems
            .AnyAsync(sli => sli.ProductId == productId);
        if (usedInSales)
            throw new InvalidOperationException("Cannot delete product that has been used in sales");

        // Check if product is used in any purchases
        var usedInPurchases = await _context.PurchaseLineItems
            .AnyAsync(pli => pli.ProductId == productId);
        if (usedInPurchases)
            throw new InvalidOperationException("Cannot delete product that has been used in purchases");

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
    }

    public async Task<ProductDto> AdjustStockAsync(Guid productId, StockAdjustmentDto dto, Guid userId)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null)
            throw new InvalidOperationException("Product not found");

        var oldStockLevel = product.StockLevel;

        switch (dto.AdjustmentType.ToUpperInvariant())
        {
            case "ADD":
                product.StockLevel += dto.AdjustmentQuantity;
                break;
            case "REMOVE":
                product.StockLevel -= dto.AdjustmentQuantity;
                break;
            case "SET":
                product.StockLevel = dto.AdjustmentQuantity;
                break;
            default:
                throw new InvalidOperationException($"Invalid adjustment type: {dto.AdjustmentType}");
        }

        // Flag inventory discrepancy if stock goes negative
        product.HasInventoryDiscrepancy = product.StockLevel < 0;
        product.UpdatedAt = DateTime.UtcNow;

        dto.NewStockLevel = product.StockLevel;

        await _context.SaveChangesAsync();

        // TODO: Log the adjustment for audit trail
        // This would be integrated with the AuditService when implemented

        return (await GetProductByIdAsync(product.Id))!;
    }

    public async Task<List<ProductDto>> GetLowStockProductsAsync()
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .Where(p => p.IsActive && p.StockLevel <= p.MinStockThreshold)
            .OrderBy(p => p.StockLevel)
            .ThenBy(p => p.NameEn)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                SKU = p.SKU,
                NameEn = p.NameEn,
                NameAr = p.NameAr,
                CategoryId = p.CategoryId,
                CategoryNameEn = p.Category.NameEn,
                CategoryNameAr = p.Category.NameAr,
                SellingPrice = p.SellingPrice,
                CostPrice = p.CostPrice,
                StockLevel = p.StockLevel,
                MinStockThreshold = p.MinStockThreshold,
                HasInventoryDiscrepancy = p.HasInventoryDiscrepancy,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier != null ? p.Supplier.NameEn : null,
                IsActive = p.IsActive
            })
            .ToListAsync();

        return products;
    }

    #endregion

    #region Category Operations

    public async Task<List<CategoryDto>> GetCategoriesAsync(bool includeInactive = false)
    {
        var query = _context.Categories.AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(c => c.IsActive);
        }

        var categories = await query
            .Include(c => c.ParentCategory)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.NameEn)
            .ToListAsync();

        // Get product counts for each category
        var categoryCounts = await _context.Products
            .Where(p => p.IsActive)
            .GroupBy(p => p.CategoryId)
            .Select(g => new { CategoryId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CategoryId, x => x.Count);

        return categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Code = c.Code,
            NameEn = c.NameEn,
            NameAr = c.NameAr,
            DescriptionEn = c.DescriptionEn,
            DescriptionAr = c.DescriptionAr,
            ParentCategoryId = c.ParentCategoryId,
            ParentCategoryName = c.ParentCategory?.NameEn,
            ImagePath = c.ImagePath,
            DisplayOrder = c.DisplayOrder,
            IsActive = c.IsActive,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
            CreatedBy = c.CreatedBy,
            ProductCount = categoryCounts.GetValueOrDefault(c.Id, 0)
        }).ToList();
    }

    public async Task<CategoryDto?> GetCategoryByIdAsync(Guid categoryId)
    {
        var category = await _context.Categories
            .Include(c => c.ParentCategory)
            .FirstOrDefaultAsync(c => c.Id == categoryId);

        if (category == null)
            return null;

        var productCount = await _context.Products
            .Where(p => p.CategoryId == categoryId && p.IsActive)
            .CountAsync();

        return new CategoryDto
        {
            Id = category.Id,
            Code = category.Code,
            NameEn = category.NameEn,
            NameAr = category.NameAr,
            DescriptionEn = category.DescriptionEn,
            DescriptionAr = category.DescriptionAr,
            ParentCategoryId = category.ParentCategoryId,
            ParentCategoryName = category.ParentCategory?.NameEn,
            ImagePath = category.ImagePath,
            DisplayOrder = category.DisplayOrder,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt,
            CreatedBy = category.CreatedBy,
            ProductCount = productCount
        };
    }

    public async Task<CategoryDto> CreateCategoryAsync(string code, string nameEn, string nameAr,
        string? descriptionEn, string? descriptionAr, Guid? parentCategoryId,
        int displayOrder, Guid userId)
    {
        // Validate code is unique
        var codeExists = await _context.Categories
            .AnyAsync(c => c.Code == code);
        if (codeExists)
            throw new InvalidOperationException($"Category with code '{code}' already exists");

        // Validate parent category exists (if provided)
        if (parentCategoryId.HasValue)
        {
            var parentExists = await _context.Categories
                .AnyAsync(c => c.Id == parentCategoryId.Value);
            if (!parentExists)
                throw new InvalidOperationException("Parent category not found");
        }

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Code = code,
            NameEn = nameEn,
            NameAr = nameAr,
            DescriptionEn = descriptionEn,
            DescriptionAr = descriptionAr,
            ParentCategoryId = parentCategoryId,
            DisplayOrder = displayOrder,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return (await GetCategoryByIdAsync(category.Id))!;
    }

    public async Task<CategoryDto> UpdateCategoryAsync(Guid categoryId, string code,
        string nameEn, string nameAr, string? descriptionEn, string? descriptionAr,
        Guid? parentCategoryId, int displayOrder)
    {
        var category = await _context.Categories.FindAsync(categoryId);
        if (category == null)
            throw new InvalidOperationException("Category not found");

        // Validate code is unique (excluding current category)
        var codeExists = await _context.Categories
            .AnyAsync(c => c.Code == code && c.Id != categoryId);
        if (codeExists)
            throw new InvalidOperationException($"Category with code '{code}' already exists");

        // Validate parent category exists and prevent circular reference
        if (parentCategoryId.HasValue)
        {
            if (parentCategoryId.Value == categoryId)
                throw new InvalidOperationException("Category cannot be its own parent");

            var parentExists = await _context.Categories
                .AnyAsync(c => c.Id == parentCategoryId.Value);
            if (!parentExists)
                throw new InvalidOperationException("Parent category not found");

            // Check for circular reference by checking if the parent has this category as ancestor
            var isCircular = await IsCircularReferenceAsync(categoryId, parentCategoryId.Value);
            if (isCircular)
                throw new InvalidOperationException("Circular reference detected in category hierarchy");
        }

        category.Code = code;
        category.NameEn = nameEn;
        category.NameAr = nameAr;
        category.DescriptionEn = descriptionEn;
        category.DescriptionAr = descriptionAr;
        category.ParentCategoryId = parentCategoryId;
        category.DisplayOrder = displayOrder;
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return (await GetCategoryByIdAsync(category.Id))!;
    }

    public async Task DeleteCategoryAsync(Guid categoryId)
    {
        var category = await _context.Categories.FindAsync(categoryId);
        if (category == null)
            throw new InvalidOperationException("Category not found");

        // Check if category has products
        var hasProducts = await _context.Products
            .AnyAsync(p => p.CategoryId == categoryId);
        if (hasProducts)
            throw new InvalidOperationException("Cannot delete category that has products");

        // Check if category has child categories
        var hasChildren = await _context.Categories
            .AnyAsync(c => c.ParentCategoryId == categoryId);
        if (hasChildren)
            throw new InvalidOperationException("Cannot delete category that has child categories");

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
    }

    private async Task<bool> IsCircularReferenceAsync(Guid categoryId, Guid potentialParentId)
    {
        var currentParentId = potentialParentId;
        var visited = new HashSet<Guid> { categoryId };

        while (currentParentId != Guid.Empty)
        {
            if (visited.Contains(currentParentId))
                return true;

            visited.Add(currentParentId);

            var parent = await _context.Categories.FindAsync(currentParentId);
            if (parent?.ParentCategoryId == null)
                break;

            currentParentId = parent.ParentCategoryId.Value;
        }

        return false;
    }

    #endregion

    #region Purchase Operations

    public async Task<(List<PurchaseDto> Purchases, int TotalCount)> GetPurchasesAsync(
        Guid? supplierId = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int? paymentStatus = null,
        int page = 1,
        int pageSize = 50)
    {
        var query = _context.Purchases
            .Include(p => p.Supplier)
            .Include(p => p.PurchaseLineItems)
                .ThenInclude(pli => pli.Product)
            .AsQueryable();

        // Apply filters
        if (supplierId.HasValue)
        {
            query = query.Where(p => p.SupplierId == supplierId.Value);
        }

        if (startDate.HasValue)
        {
            query = query.Where(p => p.PurchaseDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(p => p.PurchaseDate <= endDate.Value);
        }

        if (paymentStatus.HasValue)
        {
            query = query.Where(p => p.PaymentStatus == paymentStatus.Value);
        }

        var totalCount = await query.CountAsync();

        var purchases = await query
            .OrderByDescending(p => p.PurchaseDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PurchaseDto
            {
                Id = p.Id,
                PurchaseOrderNumber = p.PurchaseOrderNumber,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier.NameEn,
                PurchaseDate = p.PurchaseDate,
                ReceivedDate = p.ReceivedDate,
                TotalCost = p.TotalCost,
                PaymentStatus = p.PaymentStatus,
                PaymentStatusText = GetPaymentStatusText(p.PaymentStatus),
                AmountPaid = p.AmountPaid,
                InvoiceImagePath = p.InvoiceImagePath,
                Notes = p.Notes,
                CreatedAt = p.CreatedAt,
                CreatedBy = p.CreatedBy,
                LineItems = p.PurchaseLineItems.Select(pli => new PurchaseLineItemDto
                {
                    Id = pli.Id,
                    PurchaseId = pli.PurchaseId,
                    ProductId = pli.ProductId,
                    ProductNameEn = pli.Product.NameEn,
                    ProductNameAr = pli.Product.NameAr,
                    ProductSKU = pli.Product.SKU,
                    Quantity = pli.Quantity,
                    UnitCost = pli.UnitCost,
                    LineTotal = pli.LineTotal
                }).ToList()
            })
            .ToListAsync();

        return (purchases, totalCount);
    }

    public async Task<PurchaseDto?> GetPurchaseByIdAsync(Guid purchaseId)
    {
        var purchase = await _context.Purchases
            .Include(p => p.Supplier)
            .Include(p => p.PurchaseLineItems)
                .ThenInclude(pli => pli.Product)
            .FirstOrDefaultAsync(p => p.Id == purchaseId);

        if (purchase == null)
            return null;

        return new PurchaseDto
        {
            Id = purchase.Id,
            PurchaseOrderNumber = purchase.PurchaseOrderNumber,
            SupplierId = purchase.SupplierId,
            SupplierName = purchase.Supplier.NameEn,
            PurchaseDate = purchase.PurchaseDate,
            ReceivedDate = purchase.ReceivedDate,
            TotalCost = purchase.TotalCost,
            PaymentStatus = purchase.PaymentStatus,
            PaymentStatusText = GetPaymentStatusText(purchase.PaymentStatus),
            AmountPaid = purchase.AmountPaid,
            InvoiceImagePath = purchase.InvoiceImagePath,
            Notes = purchase.Notes,
            CreatedAt = purchase.CreatedAt,
            CreatedBy = purchase.CreatedBy,
            LineItems = purchase.PurchaseLineItems.Select(pli => new PurchaseLineItemDto
            {
                Id = pli.Id,
                PurchaseId = pli.PurchaseId,
                ProductId = pli.ProductId,
                ProductNameEn = pli.Product.NameEn,
                ProductNameAr = pli.Product.NameAr,
                ProductSKU = pli.Product.SKU,
                Quantity = pli.Quantity,
                UnitCost = pli.UnitCost,
                LineTotal = pli.LineTotal
            }).ToList()
        };
    }

    public async Task<PurchaseDto> CreatePurchaseAsync(CreatePurchaseDto dto, Guid userId)
    {
        // Validate supplier exists
        var supplierExists = await _context.Suppliers
            .AnyAsync(s => s.Id == dto.SupplierId);
        if (!supplierExists)
            throw new InvalidOperationException("Supplier not found");

        // Validate purchase order number is unique
        var poExists = await _context.Purchases
            .AnyAsync(p => p.PurchaseOrderNumber == dto.PurchaseOrderNumber);
        if (poExists)
            throw new InvalidOperationException($"Purchase order '{dto.PurchaseOrderNumber}' already exists");

        // Validate all products exist
        var productIds = dto.LineItems.Select(li => li.ProductId).ToList();
        var existingProductIds = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync();

        var missingProductIds = productIds.Except(existingProductIds).ToList();
        if (missingProductIds.Any())
            throw new InvalidOperationException($"Products not found: {string.Join(", ", missingProductIds)}");

        var purchase = new Purchase
        {
            Id = Guid.NewGuid(),
            PurchaseOrderNumber = dto.PurchaseOrderNumber,
            SupplierId = dto.SupplierId,
            PurchaseDate = dto.PurchaseDate,
            ReceivedDate = null,
            PaymentStatus = 0, // Pending
            AmountPaid = 0,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            PurchaseLineItems = new List<PurchaseLineItem>()
        };

        decimal totalCost = 0;

        foreach (var lineItemDto in dto.LineItems)
        {
            var lineTotal = lineItemDto.Quantity * lineItemDto.UnitCost;
            totalCost += lineTotal;

            var lineItem = new PurchaseLineItem
            {
                Id = Guid.NewGuid(),
                PurchaseId = purchase.Id,
                ProductId = lineItemDto.ProductId,
                Quantity = lineItemDto.Quantity,
                UnitCost = lineItemDto.UnitCost,
                LineTotal = lineTotal
            };

            purchase.PurchaseLineItems.Add(lineItem);
        }

        purchase.TotalCost = totalCost;

        _context.Purchases.Add(purchase);
        await _context.SaveChangesAsync();

        return (await GetPurchaseByIdAsync(purchase.Id))!;
    }

    public async Task<PurchaseDto> ReceivePurchaseAsync(Guid purchaseId, Guid userId)
    {
        var purchase = await _context.Purchases
            .Include(p => p.PurchaseLineItems)
            .FirstOrDefaultAsync(p => p.Id == purchaseId);

        if (purchase == null)
            throw new InvalidOperationException("Purchase not found");

        if (purchase.ReceivedDate.HasValue)
            throw new InvalidOperationException("Purchase has already been received");

        // Update inventory for each line item
        foreach (var lineItem in purchase.PurchaseLineItems)
        {
            var product = await _context.Products.FindAsync(lineItem.ProductId);
            if (product != null)
            {
                product.StockLevel += lineItem.Quantity;
                product.HasInventoryDiscrepancy = product.StockLevel < 0;
                product.UpdatedAt = DateTime.UtcNow;
            }
        }

        purchase.ReceivedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return (await GetPurchaseByIdAsync(purchase.Id))!;
    }

    public async Task<int> CheckLowStockAsync(int threshold)
    {
        return await _context.Products
            .Where(p => p.IsActive && p.StockLevel <= threshold)
            .CountAsync();
    }

    private static string GetPaymentStatusText(int status)
    {
        return status switch
        {
            0 => "Pending",
            1 => "Partial",
            2 => "Paid",
            _ => "Unknown"
        };
    }

    #endregion
}
