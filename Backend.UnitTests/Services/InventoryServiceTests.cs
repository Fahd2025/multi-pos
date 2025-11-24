using Backend.Data;
using Backend.Models.DTOs.Inventory;
using Backend.Models.Entities.Branch;
using Backend.Services.Inventory;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.UnitTests.Services;

/// <summary>
/// Unit tests for InventoryService
/// Tests cover product CRUD, category CRUD, stock adjustments, and purchase operations
/// </summary>
public class InventoryServiceTests : IDisposable
{
    private readonly BranchDbContext _context;
    private readonly InventoryService _service;
    private readonly Guid _testUserId = Guid.NewGuid();

    public InventoryServiceTests()
    {
        // Setup in-memory database for testing
        var options = new DbContextOptionsBuilder<BranchDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new BranchDbContext(options);
        _service = new InventoryService(_context);

        // Seed test data
        SeedTestData();
    }

    private void SeedTestData()
    {
        // Create test categories
        var category1 = new Category
        {
            Id = Guid.NewGuid(),
            Code = "CAT001",
            NameEn = "Electronics",
            NameAr = "إلكترونيات",
            DisplayOrder = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = _testUserId
        };

        var category2 = new Category
        {
            Id = Guid.NewGuid(),
            Code = "CAT002",
            NameEn = "Clothing",
            NameAr = "ملابس",
            DisplayOrder = 2,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = _testUserId
        };

        _context.Categories.AddRange(category1, category2);

        // Create test supplier
        var supplier = new Supplier
        {
            Id = Guid.NewGuid(),
            Code = "SUP001",
            NameEn = "Tech Suppliers Inc",
            NameAr = "موردو التقنية",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = _testUserId
        };

        _context.Suppliers.Add(supplier);

        // Create test products
        var product1 = new Product
        {
            Id = Guid.NewGuid(),
            SKU = "PROD001",
            NameEn = "Laptop",
            NameAr = "حاسوب محمول",
            CategoryId = category1.Id,
            SellingPrice = 1000,
            CostPrice = 800,
            StockLevel = 10,
            MinStockThreshold = 5,
            SupplierId = supplier.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = _testUserId
        };

        var product2 = new Product
        {
            Id = Guid.NewGuid(),
            SKU = "PROD002",
            NameEn = "T-Shirt",
            NameAr = "قميص",
            CategoryId = category2.Id,
            SellingPrice = 25,
            CostPrice = 15,
            StockLevel = 3, // Low stock
            MinStockThreshold = 10,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = _testUserId
        };

        _context.Products.AddRange(product1, product2);
        _context.SaveChanges();
    }

    [Fact]
    public async Task CreateProductAsync_ValidProduct_ReturnsProductWithCalculatedValues()
    {
        // Arrange
        var category = await _context.Categories.FirstAsync();
        var dto = new CreateProductDto
        {
            SKU = "NEWPROD001",
            NameEn = "New Product",
            NameAr = "منتج جديد",
            CategoryId = category.Id,
            SellingPrice = 100,
            CostPrice = 75,
            StockLevel = 20,
            MinStockThreshold = 5,
            IsActive = true
        };

        // Act
        var result = await _service.CreateProductAsync(dto, _testUserId);

        // Assert
        result.Should().NotBeNull();
        result.SKU.Should().Be("NEWPROD001");
        result.NameEn.Should().Be("New Product");
        result.StockLevel.Should().Be(20);
        result.HasInventoryDiscrepancy.Should().BeFalse();
    }

    [Fact]
    public async Task CreateProductAsync_DuplicateSKU_ThrowsException()
    {
        // Arrange
        var category = await _context.Categories.FirstAsync();
        var existingProduct = await _context.Products.FirstAsync();
        
        var dto = new CreateProductDto
        {
            SKU = existingProduct.SKU, // Duplicate SKU
            NameEn = "Duplicate Product",
            NameAr = "منتج مكرر",
            CategoryId = category.Id,
            SellingPrice = 100,
            CostPrice = 75,
            StockLevel = 10,
            MinStockThreshold = 5,
            IsActive = true
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.CreateProductAsync(dto, _testUserId));
    }

    [Fact]
    public async Task CreateProductAsync_InvalidCategory_ThrowsException()
    {
        // Arrange
        var dto = new CreateProductDto
        {
            SKU = "NEWPROD002",
            NameEn = "New Product",
            NameAr = "منتج جديد",
            CategoryId = Guid.NewGuid(), // Non-existent category
            SellingPrice = 100,
            CostPrice = 75,
            StockLevel = 10,
            MinStockThreshold = 5,
            IsActive = true
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.CreateProductAsync(dto, _testUserId));
    }

    [Fact]
    public async Task AdjustStockAsync_AddStock_IncreasesStockLevel()
    {
        // Arrange
        var product = await _context.Products.FirstAsync();
        var originalStock = product.StockLevel;
        var dto = new StockAdjustmentDto
        {
            AdjustmentType = "ADD",
            AdjustmentQuantity = 10,
            Reason = "Restock"
        };

        // Act
        var result = await _service.AdjustStockAsync(product.Id, dto, _testUserId);

        // Assert
        result.StockLevel.Should().Be(originalStock + 10);
        result.HasInventoryDiscrepancy.Should().BeFalse();
    }

    [Fact]
    public async Task AdjustStockAsync_RemoveStock_DecreasesStockLevel()
    {
        // Arrange
        var product = await _context.Products.FirstAsync();
        var originalStock = product.StockLevel;
        var dto = new StockAdjustmentDto
        {
            AdjustmentType = "REMOVE",
            AdjustmentQuantity = 5,
            Reason = "Damaged goods"
        };

        // Act
        var result = await _service.AdjustStockAsync(product.Id, dto, _testUserId);

        // Assert
        result.StockLevel.Should().Be(originalStock - 5);
    }

    [Fact]
    public async Task AdjustStockAsync_SetNegativeStock_FlagsInventoryDiscrepancy()
    {
        // Arrange
        var product = await _context.Products.FirstAsync();
        var dto = new StockAdjustmentDto
        {
            AdjustmentType = "SET",
            AdjustmentQuantity = -5,
            Reason = "Inventory correction"
        };

        // Act
        var result = await _service.AdjustStockAsync(product.Id, dto, _testUserId);

        // Assert
        result.StockLevel.Should().Be(-5);
        result.HasInventoryDiscrepancy.Should().BeTrue();
    }

    [Fact]
    public async Task GetLowStockProductsAsync_ReturnsOnlyLowStockProducts()
    {
        // Act
        var result = await _service.GetLowStockProductsAsync();

        // Assert
        result.Should().NotBeEmpty();
        result.Should().OnlyContain(p => p.StockLevel <= p.MinStockThreshold);
        result.Should().OnlyContain(p => p.IsActive);
    }

    [Fact]
    public async Task GetProductsAsync_WithSearchTerm_ReturnsMatchingProducts()
    {
        // Act
        var (products, totalCount) = await _service.GetProductsAsync(searchTerm: "Laptop");

        // Assert
        products.Should().NotBeEmpty();
        products.Should().OnlyContain(p => 
            p.NameEn.Contains("Laptop") || 
            p.NameAr.Contains("Laptop") || 
            p.SKU.Contains("Laptop"));
    }

    [Fact]
    public async Task GetProductsAsync_WithCategoryFilter_ReturnsProductsInCategory()
    {
        // Arrange
        var category = await _context.Categories.FirstAsync();

        // Act
        var (products, totalCount) = await _service.GetProductsAsync(categoryId: category.Id);

        // Assert
        products.Should().NotBeEmpty();
        products.Should().OnlyContain(p => p.CategoryId == category.Id);
    }

    [Fact]
    public async Task GetProductsAsync_WithLowStockFilter_ReturnsLowStockProducts()
    {
        // Act
        var (products, totalCount) = await _service.GetProductsAsync(lowStockOnly: true);

        // Assert
        products.Should().NotBeEmpty();
        products.Should().OnlyContain(p => p.StockLevel <= p.MinStockThreshold);
    }

    [Fact]
    public async Task UpdateProductAsync_ValidUpdate_UpdatesProduct()
    {
        // Arrange
        var product = await _context.Products.FirstAsync();
        var category = await _context.Categories.FirstAsync();
        var dto = new UpdateProductDto
        {
            SKU = product.SKU,
            NameEn = "Updated Product Name",
            NameAr = "اسم المنتج المحدث",
            CategoryId = category.Id,
            SellingPrice = 150,
            CostPrice = 100,
            MinStockThreshold = 10,
            IsActive = true
        };

        // Act
        var result = await _service.UpdateProductAsync(product.Id, dto);

        // Assert
        result.NameEn.Should().Be("Updated Product Name");
        result.SellingPrice.Should().Be(150);
        result.CostPrice.Should().Be(100);
    }

    [Fact]
    public async Task DeleteProductAsync_ProductNotUsed_DeletesProduct()
    {
        // Arrange
        var category = await _context.Categories.FirstAsync();
        var product = new Product
        {
            Id = Guid.NewGuid(),
            SKU = "DELETEME",
            NameEn = "To Be Deleted",
            NameAr = "للحذف",
            CategoryId = category.Id,
            SellingPrice = 10,
            CostPrice = 5,
            StockLevel = 0,
            MinStockThreshold = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = _testUserId
        };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Act
        await _service.DeleteProductAsync(product.Id);

        // Assert
        var deletedProduct = await _context.Products.FindAsync(product.Id);
        deletedProduct.Should().BeNull();
    }

    [Fact]
    public async Task CreateCategoryAsync_ValidCategory_ReturnsCategory()
    {
        // Act
        var result = await _service.CreateCategoryAsync(
            code: "NEWCAT001",
            nameEn: "New Category",
            nameAr: "فئة جديدة",
            descriptionEn: "A new category",
            descriptionAr: "فئة جديدة",
            parentCategoryId: null,
            displayOrder: 10,
            userId: _testUserId);

        // Assert
        result.Should().NotBeNull();
        result.Code.Should().Be("NEWCAT001");
        result.NameEn.Should().Be("New Category");
        result.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task CreateCategoryAsync_DuplicateCode_ThrowsException()
    {
        // Arrange
        var existingCategory = await _context.Categories.FirstAsync();

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.CreateCategoryAsync(
                code: existingCategory.Code, // Duplicate code
                nameEn: "Duplicate Category",
                nameAr: "فئة مكررة",
                descriptionEn: null,
                descriptionAr: null,
                parentCategoryId: null,
                displayOrder: 1,
                userId: _testUserId));
    }

    [Fact]
    public async Task UpdateCategoryAsync_WithParentCategory_UpdatesSuccessfully()
    {
        // Arrange
        var category = await _context.Categories.FirstAsync();
        var parentCategory = await _context.Categories.Skip(1).FirstAsync();

        // Act
        var result = await _service.UpdateCategoryAsync(
            categoryId: category.Id,
            code: category.Code,
            nameEn: "Updated Category",
            nameAr: "فئة محدثة",
            descriptionEn: "Updated description",
            descriptionAr: "وصف محدث",
            parentCategoryId: parentCategory.Id,
            displayOrder: 5);

        // Assert
        result.NameEn.Should().Be("Updated Category");
        result.ParentCategoryId.Should().Be(parentCategory.Id);
    }

    [Fact]
    public async Task UpdateCategoryAsync_CircularReference_ThrowsException()
    {
        // Arrange
        var parentCategory = await _context.Categories.FirstAsync();
        var childCategory = new Category
        {
            Id = Guid.NewGuid(),
            Code = "CHILD001",
            NameEn = "Child Category",
            NameAr = "فئة فرعية",
            ParentCategoryId = parentCategory.Id,
            DisplayOrder = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = _testUserId
        };
        _context.Categories.Add(childCategory);
        await _context.SaveChangesAsync();

        // Act & Assert - Try to set parent's parent to child (circular reference)
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.UpdateCategoryAsync(
                categoryId: parentCategory.Id,
                code: parentCategory.Code,
                nameEn: parentCategory.NameEn,
                nameAr: parentCategory.NameAr,
                descriptionEn: null,
                descriptionAr: null,
                parentCategoryId: childCategory.Id, // This creates circular reference
                displayOrder: 1));
    }

    [Fact]
    public async Task DeleteCategoryAsync_CategoryWithProducts_ThrowsException()
    {
        // Arrange
        var category = await _context.Categories.FirstAsync();
        
        // Category already has products from seed data

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.DeleteCategoryAsync(category.Id));
    }

    [Fact]
    public async Task CreatePurchaseAsync_ValidPurchase_ReturnsPurchaseWithLineItems()
    {
        // Arrange
        var supplier = await _context.Suppliers.FirstAsync();
        var products = await _context.Products.Take(2).ToListAsync();
        
        var dto = new CreatePurchaseDto
        {
            PurchaseOrderNumber = "PO-2024-001",
            SupplierId = supplier.Id,
            PurchaseDate = DateTime.UtcNow,
            Notes = "Test purchase order",
            LineItems = products.Select(p => new CreatePurchaseLineItemDto
            {
                ProductId = p.Id,
                Quantity = 10,
                UnitCost = p.CostPrice
            }).ToList()
        };

        // Act
        var result = await _service.CreatePurchaseAsync(dto, _testUserId);

        // Assert
        result.Should().NotBeNull();
        result.PurchaseOrderNumber.Should().Be("PO-2024-001");
        result.LineItems.Should().HaveCount(2);
        result.TotalCost.Should().Be(products.Sum(p => 10 * p.CostPrice));
        result.PaymentStatus.Should().Be(0); // Pending
    }

    [Fact]
    public async Task ReceivePurchaseAsync_ValidPurchase_UpdatesInventory()
    {
        // Arrange
        var supplier = await _context.Suppliers.FirstAsync();
        var product = await _context.Products.FirstAsync();
        var originalStock = product.StockLevel;

        var purchase = new Purchase
        {
            Id = Guid.NewGuid(),
            PurchaseOrderNumber = "PO-TEST-001",
            SupplierId = supplier.Id,
            PurchaseDate = DateTime.UtcNow,
            TotalCost = 1000,
            PaymentStatus = PaymentStatus.Pending,
            AmountPaid = 0,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _testUserId,
            LineItems = new List<PurchaseLineItem>
            {
                new PurchaseLineItem
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    Quantity = 20,
                    UnitCost = 50,
                    LineTotal = 1000
                }
            }
        };
        _context.Purchases.Add(purchase);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.ReceivePurchaseAsync(purchase.Id, _testUserId);

        // Assert
        result.ReceivedDate.Should().NotBeNull();
        
        // Verify inventory was updated
        var updatedProduct = await _context.Products.FindAsync(product.Id);
        updatedProduct!.StockLevel.Should().Be(originalStock + 20);
    }

    [Fact]
    public async Task ReceivePurchaseAsync_AlreadyReceived_ThrowsException()
    {
        // Arrange
        var supplier = await _context.Suppliers.FirstAsync();
        var product = await _context.Products.FirstAsync();

        var purchase = new Purchase
        {
            Id = Guid.NewGuid(),
            PurchaseOrderNumber = "PO-RECEIVED-001",
            SupplierId = supplier.Id,
            PurchaseDate = DateTime.UtcNow,
            ReceivedDate = DateTime.UtcNow, // Already received
            TotalCost = 1000,
            PaymentStatus = PaymentStatus.Pending,
            AmountPaid = 0,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _testUserId,
            LineItems = new List<PurchaseLineItem>()
        };
        _context.Purchases.Add(purchase);
        await _context.SaveChangesAsync();

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await _service.ReceivePurchaseAsync(purchase.Id, _testUserId));
    }

    [Fact]
    public async Task CheckLowStockAsync_ReturnsCorrectCount()
    {
        // Act
        var count = await _service.CheckLowStockAsync(threshold: 10);

        // Assert
        count.Should().BeGreaterThan(0);
        
        // Verify the count matches products with stock <= threshold
        var expectedCount = await _context.Products
            .Where(p => p.IsActive && p.StockLevel <= 10)
            .CountAsync();
        count.Should().Be(expectedCount);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
