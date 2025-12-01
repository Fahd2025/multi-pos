using Backend.Models.DTOs.Branch.Inventory;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace Backend.IntegrationTests.Endpoints;

/// <summary>
/// Integration tests for Inventory API endpoints
/// Tests cover categories, products, purchases, and stock adjustments
/// </summary>
public class InventoryEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private const string BaseUrl = "/api/v1";
    
    // Test data IDs (will be populated during test execution)
    private static Guid? _testCategoryId;
    private static Guid? _testProductId;
    private static Guid? _testSupplierId;

    public InventoryEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        
        // TODO: Add authentication token to requests
        // _client.DefaultRequestHeaders.Authorization = 
        //     new AuthenticationHeaderValue("Bearer", GetTestToken());
    }

    #region Category Endpoints Tests

    [Fact]
    public async Task GetCategories_ReturnsSuccessWithCategories()
    {
        // Act
        var response = await _client.GetAsync($"{BaseUrl}/categories");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var categories = await response.Content.ReadFromJsonAsync<List<CategoryDto>>();
        categories.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateCategory_ValidData_ReturnsCreatedCategory()
    {
        // Arrange
        var newCategory = new
        {
            code = "TEST-CAT-001",
            nameEn = "Test Category",
            nameAr = "فئة اختبار",
            descriptionEn = "Test category description",
            descriptionAr = "وصف فئة الاختبار",
            displayOrder = 1
        };

        // Act
        var response = await _client.PostAsJsonAsync($"{BaseUrl}/categories", newCategory);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var category = await response.Content.ReadFromJsonAsync<CategoryDto>();
        category.Should().NotBeNull();
        category!.Code.Should().Be("TEST-CAT-001");
        category.NameEn.Should().Be("Test Category");
        
        // Store for later tests
        _testCategoryId = category.Id;
    }

    [Fact]
    public async Task UpdateCategory_ValidData_ReturnsUpdatedCategory()
    {
        // Arrange - First create a category
        var createResponse = await _client.PostAsJsonAsync($"{BaseUrl}/categories", new
        {
            code = "UPDATE-TEST-001",
            nameEn = "Original Name",
            nameAr = "الاسم الأصلي",
            displayOrder = 1
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CategoryDto>();

        var updateData = new
        {
            code = "UPDATE-TEST-001",
            nameEn = "Updated Name",
            nameAr = "الاسم المحدث",
            descriptionEn = "Updated description",
            descriptionAr = "وصف محدث",
            displayOrder = 2
        };

        // Act
        var response = await _client.PutAsJsonAsync($"{BaseUrl}/categories/{created!.Id}", updateData);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var updated = await response.Content.ReadFromJsonAsync<CategoryDto>();
        updated!.NameEn.Should().Be("Updated Name");
        updated.DisplayOrder.Should().Be(2);
    }

    [Fact]
    public async Task DeleteCategory_EmptyCategory_ReturnsNoContent()
    {
        // Arrange - Create a category with no products
        var createResponse = await _client.PostAsJsonAsync($"{BaseUrl}/categories", new
        {
            code = "DELETE-TEST-001",
            nameEn = "To Be Deleted",
            nameAr = "للحذف",
            displayOrder = 1
        });
        var created = await createResponse.Content.ReadFromJsonAsync<CategoryDto>();

        // Act
        var response = await _client.DeleteAsync($"{BaseUrl}/categories/{created!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task DeleteCategory_WithProducts_ReturnsBadRequest()
    {
        // Arrange - Create category and product
        var categoryResponse = await _client.PostAsJsonAsync($"{BaseUrl}/categories", new
        {
            code = "CAT-WITH-PROD-001",
            nameEn = "Category With Products",
            nameAr = "فئة بمنتجات",
            displayOrder = 1
        });
        var category = await categoryResponse.Content.ReadFromJsonAsync<CategoryDto>();

        var productResponse = await _client.PostAsJsonAsync($"{BaseUrl}/products", new
        {
            sku = "PROD-IN-CAT-001",
            nameEn = "Product in Category",
            nameAr = "منتج في الفئة",
            categoryId = category!.Id,
            sellingPrice = 100.00,
            costPrice = 75.00,
            stockLevel = 10,
            minStockThreshold = 5,
            isActive = true
        });

        // Act - Try to delete category with products
        var response = await _client.DeleteAsync($"{BaseUrl}/categories/{category.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Product Endpoints Tests

    [Fact]
    public async Task GetProducts_ReturnsSuccessWithPagination()
    {
        // Act
        var response = await _client.GetAsync($"{BaseUrl}/products?page=1&pageSize=10");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.TryGetProperty("products", out var products).Should().BeTrue();
        result.TryGetProperty("totalCount", out var totalCount).Should().BeTrue();
    }

    [Fact]
    public async Task GetProducts_WithSearchTerm_ReturnsFilteredProducts()
    {
        // Act
        var response = await _client.GetAsync($"{BaseUrl}/products?searchTerm=Laptop");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetProducts_WithCategoryFilter_ReturnsProductsInCategory()
    {
        // Arrange - Use existing category
        var categoryResponse = await _client.GetAsync($"{BaseUrl}/categories");
        var categories = await categoryResponse.Content.ReadFromJsonAsync<List<CategoryDto>>();
        var categoryId = categories!.First().Id;

        // Act
        var response = await _client.GetAsync($"{BaseUrl}/products?categoryId={categoryId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetProducts_WithLowStockFilter_ReturnsLowStockProducts()
    {
        // Act
        var response = await _client.GetAsync($"{BaseUrl}/products?lowStockOnly=true");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateProduct_ValidData_ReturnsCreatedProduct()
    {
        // Arrange - Get a category first
        var categoryResponse = await _client.GetAsync($"{BaseUrl}/categories");
        var categories = await categoryResponse.Content.ReadFromJsonAsync<List<CategoryDto>>();
        
        var newProduct = new
        {
            sku = $"TEST-PROD-{Guid.NewGuid().ToString().Substring(0, 8)}",
            nameEn = "Test Product",
            nameAr = "منتج اختبار",
            categoryId = categories!.First().Id,
            sellingPrice = 150.00,
            costPrice = 100.00,
            stockLevel = 20,
            minStockThreshold = 5,
            barcode = "1234567890123",
            isActive = true
        };

        // Act
        var response = await _client.PostAsJsonAsync($"{BaseUrl}/products", newProduct);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var product = await response.Content.ReadFromJsonAsync<ProductDto>();
        product.Should().NotBeNull();
        product!.NameEn.Should().Be("Test Product");
        product.SellingPrice.Should().Be(150.00m);
        product.StockLevel.Should().Be(20);
        
        _testProductId = product.Id;
    }

    [Fact]
    public async Task CreateProduct_DuplicateSKU_ReturnsBadRequest()
    {
        // Arrange - Create a product first
        var categoryResponse = await _client.GetAsync($"{BaseUrl}/categories");
        var categories = await categoryResponse.Content.ReadFromJsonAsync<List<CategoryDto>>();
        
        var sku = $"DUP-SKU-{Guid.NewGuid().ToString().Substring(0, 8)}";
        var product1 = new
        {
            sku,
            nameEn = "First Product",
            nameAr = "المنتج الأول",
            categoryId = categories!.First().Id,
            sellingPrice = 100.00,
            costPrice = 75.00,
            stockLevel = 10,
            minStockThreshold = 5,
            isActive = true
        };
        await _client.PostAsJsonAsync($"{BaseUrl}/products", product1);

        var product2 = new
        {
            sku, // Same SKU
            nameEn = "Second Product",
            nameAr = "المنتج الثاني",
            categoryId = categories.First().Id,
            sellingPrice = 100.00,
            costPrice = 75.00,
            stockLevel = 10,
            minStockThreshold = 5,
            isActive = true
        };

        // Act
        var response = await _client.PostAsJsonAsync($"{BaseUrl}/products", product2);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateProduct_ValidData_ReturnsUpdatedProduct()
    {
        // Arrange - Create a product first
        var categoryResponse = await _client.GetAsync($"{BaseUrl}/categories");
        var categories = await categoryResponse.Content.ReadFromJsonAsync<List<CategoryDto>>();
        
        var createResponse = await _client.PostAsJsonAsync($"{BaseUrl}/products", new
        {
            sku = $"UPD-PROD-{Guid.NewGuid().ToString().Substring(0, 8)}",
            nameEn = "Original Name",
            nameAr = "الاسم الأصلي",
            categoryId = categories!.First().Id,
            sellingPrice = 100.00,
            costPrice = 75.00,
            stockLevel = 10,
            minStockThreshold = 5,
            isActive = true
        });
        var created = await createResponse.Content.ReadFromJsonAsync<ProductDto>();

        var updateData = new
        {
            sku = created!.SKU,
            nameEn = "Updated Product Name",
            nameAr = "اسم المنتج المحدث",
            categoryId = created.CategoryId,
            sellingPrice = 150.00,
            costPrice = 100.00,
            minStockThreshold = 10,
            isActive = true
        };

        // Act
        var response = await _client.PutAsJsonAsync($"{BaseUrl}/products/{created.Id}", updateData);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var updated = await response.Content.ReadFromJsonAsync<ProductDto>();
        updated!.NameEn.Should().Be("Updated Product Name");
        updated.SellingPrice.Should().Be(150.00m);
    }

    [Fact]
    public async Task AdjustStock_AddStock_ReturnsUpdatedProduct()
    {
        // Arrange - Create a product
        var categoryResponse = await _client.GetAsync($"{BaseUrl}/categories");
        var categories = await categoryResponse.Content.ReadFromJsonAsync<List<CategoryDto>>();
        
        var createResponse = await _client.PostAsJsonAsync($"{BaseUrl}/products", new
        {
            sku = $"STK-ADJ-{Guid.NewGuid().ToString().Substring(0, 8)}",
            nameEn = "Stock Adjustment Test",
            nameAr = "اختبار تعديل المخزون",
            categoryId = categories!.First().Id,
            sellingPrice = 100.00,
            costPrice = 75.00,
            stockLevel = 10,
            minStockThreshold = 5,
            isActive = true
        });
        var product = await createResponse.Content.ReadFromJsonAsync<ProductDto>();

        var adjustment = new
        {
            adjustmentType = "ADD",
            adjustmentQuantity = 15,
            reason = "Restock"
        };

        // Act
        var response = await _client.PostAsJsonAsync($"{BaseUrl}/products/{product!.Id}/adjust-stock", adjustment);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var updated = await response.Content.ReadFromJsonAsync<ProductDto>();
        updated!.StockLevel.Should().Be(25); // 10 + 15
    }

    [Fact]
    public async Task AdjustStock_RemoveStock_ReturnsUpdatedProduct()
    {
        // Arrange
        var categoryResponse = await _client.GetAsync($"{BaseUrl}/categories");
        var categories = await categoryResponse.Content.ReadFromJsonAsync<List<CategoryDto>>();
        
        var createResponse = await _client.PostAsJsonAsync($"{BaseUrl}/products", new
        {
            sku = $"STK-REM-{Guid.NewGuid().ToString().Substring(0, 8)}",
            nameEn = "Stock Removal Test",
            nameAr = "اختبار إزالة المخزون",
            categoryId = categories!.First().Id,
            sellingPrice = 100.00,
            costPrice = 75.00,
            stockLevel = 20,
            minStockThreshold = 5,
            isActive = true
        });
        var product = await createResponse.Content.ReadFromJsonAsync<ProductDto>();

        var adjustment = new
        {
            adjustmentType = "REMOVE",
            adjustmentQuantity = 8,
            reason = "Damaged goods"
        };

        // Act
        var response = await _client.PostAsJsonAsync($"{BaseUrl}/products/{product!.Id}/adjust-stock", adjustment);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var updated = await response.Content.ReadFromJsonAsync<ProductDto>();
        updated!.StockLevel.Should().Be(12); // 20 - 8
    }

    [Fact]
    public async Task AdjustStock_SetNegativeStock_FlagsDiscrepancy()
    {
        // Arrange
        var categoryResponse = await _client.GetAsync($"{BaseUrl}/categories");
        var categories = await categoryResponse.Content.ReadFromJsonAsync<List<CategoryDto>>();
        
        var createResponse = await _client.PostAsJsonAsync($"{BaseUrl}/products", new
        {
            sku = $"STK-NEG-{Guid.NewGuid().ToString().Substring(0, 8)}",
            nameEn = "Negative Stock Test",
            nameAr = "اختبار المخزون السالب",
            categoryId = categories!.First().Id,
            sellingPrice = 100.00,
            costPrice = 75.00,
            stockLevel = 5,
            minStockThreshold = 5,
            isActive = true
        });
        var product = await createResponse.Content.ReadFromJsonAsync<ProductDto>();

        var adjustment = new
        {
            adjustmentType = "SET",
            adjustmentQuantity = -3,
            reason = "Inventory correction"
        };

        // Act
        var response = await _client.PostAsJsonAsync($"{BaseUrl}/products/{product!.Id}/adjust-stock", adjustment);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var updated = await response.Content.ReadFromJsonAsync<ProductDto>();
        updated!.StockLevel.Should().Be(-3);
        updated.HasInventoryDiscrepancy.Should().BeTrue();
    }

    #endregion

    #region Purchase Endpoints Tests

    [Fact]
    public async Task GetPurchases_ReturnsSuccessWithPagination()
    {
        // Act
        var response = await _client.GetAsync($"{BaseUrl}/purchases?page=1&pageSize=10");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreatePurchase_ValidData_ReturnsCreatedPurchase()
    {
        // Arrange - Get category, product, and supplier
        var categoryResponse = await _client.GetAsync($"{BaseUrl}/categories");
        var categories = await categoryResponse.Content.ReadFromJsonAsync<List<CategoryDto>>();
        
        // Create a supplier first (assuming supplier endpoint exists)
        // For now, we'll skip this test if supplier management isn't implemented
        
        // TODO: Complete this test when supplier endpoints are available
    }

    [Fact]
    public async Task ReceivePurchase_ValidPurchase_UpdatesInventory()
    {
        // TODO: Implement when purchase workflow is complete
    }

    #endregion
}
