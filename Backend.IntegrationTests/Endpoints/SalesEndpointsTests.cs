using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Backend.Data;
using Backend.Models.DTOs.Sales;
using Backend.Models.Entities.Branch;
using Backend.Services.Auth;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Backend.IntegrationTests.Endpoints;

public class SalesEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public SalesEndpointsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetAuthTokenAsync(string username = "testcashier", string password = "password123")
    {
        var loginRequest = new { branch = "test-branch", username, password };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", loginRequest);
        response.EnsureSuccessStatusCode();

        var loginResponse = await response.Content.ReadFromJsonAsync<JsonElement>();
        return loginResponse.GetProperty("access_token").GetString()!;
    }

    private async Task SeedBranchData()
    {
        using var scope = _factory.Services.CreateScope();
        var dbContextFactory = scope.ServiceProvider.GetRequiredService<DbContextFactory>();
        var headOfficeContext = scope.ServiceProvider.GetRequiredService<HeadOfficeDbContext>();

        var branch = await headOfficeContext.Branches.FindAsync(
            Guid.Parse("11111111-1111-1111-1111-111111111111")
        );

        if (branch == null)
        {
            throw new InvalidOperationException("Test branch not found");
        }

        var branchContext = dbContextFactory.CreateBranchContext(branch);

        // Clear existing data
        branchContext.Products.RemoveRange(branchContext.Products);
        branchContext.Categories.RemoveRange(branchContext.Categories);
        branchContext.Sales.RemoveRange(branchContext.Sales);
        await branchContext.SaveChangesAsync();

        // Create test category
        var category = new Category
        {
            Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            NameEn = "Electronics",
            NameAr = "إلكترونيات",
            CreatedAt = DateTime.UtcNow
        };
        branchContext.Categories.Add(category);

        // Create test products
        var product1 = new Product
        {
            Id = Guid.Parse("66666666-6666-6666-6666-666666666666"),
            SKU = "SKU-LAPTOP",
            NameEn = "Laptop",
            NameAr = "لابتوب",
            Barcode = "LAPTOP001",
            CategoryId = category.Id,
            SellingPrice = 1000.00m,
            CostPrice = 500.00m,
            StockLevel = 10,
            MinStockThreshold = 2,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        branchContext.Products.Add(product1);

        var product2 = new Product
        {
            Id = Guid.Parse("77777777-7777-7777-7777-777777777777"),
            SKU = "SKU-MOUSE",
            NameEn = "Mouse",
            NameAr = "ماوس",
            Barcode = "MOUSE001",
            CategoryId = category.Id,
            SellingPrice = 50.00m,
            CostPrice = 25.00m,
            StockLevel = 50,
            MinStockThreshold = 10,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        branchContext.Products.Add(product2);

        await branchContext.SaveChangesAsync();
    }

    [Fact]
    public async Task POST_CreateSale_WithValidData_ReturnsCreated()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testcashier");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createSaleDto = new CreateSaleDto
        {
            InvoiceType = InvoiceType.Touch,
            PaymentMethod = PaymentMethod.Cash,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                    Quantity = 2,
                    UnitPrice = 1000.00m,
                    DiscountType = DiscountType.Percentage,
                    DiscountValue = 10
                },
                new CreateSaleLineItemDto
                {
                    ProductId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                    Quantity = 1,
                    UnitPrice = 50.00m,
                    DiscountType = DiscountType.None,
                    DiscountValue = 0
                }
            }
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/sales", createSaleDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var result = await response.Content.ReadFromJsonAsync<SaleDto>();
        result.Should().NotBeNull();
        result!.TransactionId.Should().NotBeNullOrEmpty();
        result.LineItems.Should().HaveCount(2);
        result.Subtotal.Should().Be(1850.00m); // (2 * 900) + 50
        result.TaxAmount.Should().Be(277.50m); // 1850 * 15%
        result.Total.Should().Be(2127.50m); // 1850 + 277.50
        result.IsVoided.Should().BeFalse();
    }

    [Fact]
    public async Task POST_CreateSale_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        var createSaleDto = new CreateSaleDto
        {
            InvoiceType = InvoiceType.Touch,
            PaymentMethod = PaymentMethod.Cash,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = Guid.NewGuid(),
                    Quantity = 1,
                    UnitPrice = 100.00m,
                    DiscountType = DiscountType.None,
                    DiscountValue = 0
                }
            }
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/sales", createSaleDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GET_GetSales_WithAuthentication_ReturnsOk()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testcashier");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create a sale first
        var createSaleDto = new CreateSaleDto
        {
            InvoiceType = InvoiceType.Standard,
            PaymentMethod = PaymentMethod.Card,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                    Quantity = 1,
                    UnitPrice = 1000.00m,
                    DiscountType = DiscountType.None,
                    DiscountValue = 0
                }
            }
        };

        await _client.PostAsJsonAsync("/api/v1/sales", createSaleDto);

        // Act
        var response = await _client.GetAsync("/api/v1/sales");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("data").GetArrayLength().Should().BeGreaterThan(0);
        result.GetProperty("totalCount").GetInt32().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GET_GetSales_WithPagination_ReturnsCorrectPage()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testcashier");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create multiple sales
        for (int i = 0; i < 5; i++)
        {
            var createSaleDto = new CreateSaleDto
            {
                InvoiceType = InvoiceType.Touch,
                PaymentMethod = PaymentMethod.Cash,
                LineItems = new List<CreateSaleLineItemDto>
                {
                    new CreateSaleLineItemDto
                    {
                        ProductId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                        Quantity = 1,
                        UnitPrice = 50.00m,
                        DiscountType = DiscountType.None,
                        DiscountValue = 0
                    }
                }
            };

            await _client.PostAsJsonAsync("/api/v1/sales", createSaleDto);
        }

        // Act
        var response = await _client.GetAsync("/api/v1/sales?page=1&pageSize=3");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.GetProperty("data").GetArrayLength().Should().Be(3);
        result.GetProperty("totalCount").GetInt32().Should().Be(5);
        result.GetProperty("page").GetInt32().Should().Be(1);
        result.GetProperty("pageSize").GetInt32().Should().Be(3);
    }

    [Fact]
    public async Task GET_GetSaleById_WithValidId_ReturnsOk()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testcashier");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create a sale
        var createSaleDto = new CreateSaleDto
        {
            InvoiceType = InvoiceType.Touch,
            PaymentMethod = PaymentMethod.Cash,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                    Quantity = 1,
                    UnitPrice = 1000.00m,
                    DiscountType = DiscountType.None,
                    DiscountValue = 0
                }
            }
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/sales", createSaleDto);
        var createdSale = await createResponse.Content.ReadFromJsonAsync<SaleDto>();

        // Act
        var response = await _client.GetAsync($"/api/v1/sales/{createdSale!.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<SaleDto>();
        result.Should().NotBeNull();
        result!.Id.Should().Be(createdSale.Id);
        result.TransactionId.Should().Be(createdSale.TransactionId);
    }

    [Fact]
    public async Task GET_GetSaleById_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var token = await GetAuthTokenAsync("testcashier");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync($"/api/v1/sales/{Guid.NewGuid()}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task POST_VoidSale_AsManager_ReturnsOk()
    {
        // Arrange
        await SeedBranchData();
        var cashierToken = await GetAuthTokenAsync("testcashier");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", cashierToken);

        // Create a sale as cashier
        var createSaleDto = new CreateSaleDto
        {
            InvoiceType = InvoiceType.Standard,
            PaymentMethod = PaymentMethod.Cash,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                    Quantity = 1,
                    UnitPrice = 1000.00m,
                    DiscountType = DiscountType.None,
                    DiscountValue = 0
                }
            }
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/sales", createSaleDto);
        var createdSale = await createResponse.Content.ReadFromJsonAsync<SaleDto>();

        // Switch to manager token
        var managerToken = await GetAuthTokenAsync("testmanager");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", managerToken);

        var voidRequest = new { reason = "Test void reason" };

        // Act
        var response = await _client.PostAsJsonAsync(
            $"/api/v1/sales/{createdSale!.Id}/void",
            voidRequest
        );

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<SaleDto>();
        result.Should().NotBeNull();
        result!.IsVoided.Should().BeTrue();
        result.VoidReason.Should().Be("Test void reason");
    }

    [Fact]
    public async Task GET_GetSalesStats_WithDateRange_ReturnsStats()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testcashier");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Create some sales
        for (int i = 0; i < 3; i++)
        {
            var createSaleDto = new CreateSaleDto
            {
                InvoiceType = InvoiceType.Touch,
                PaymentMethod = PaymentMethod.Cash,
                LineItems = new List<CreateSaleLineItemDto>
                {
                    new CreateSaleLineItemDto
                    {
                        ProductId = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                        Quantity = 1,
                        UnitPrice = 50.00m,
                        DiscountType = DiscountType.None,
                        DiscountValue = 0
                    }
                }
            };

            await _client.PostAsJsonAsync("/api/v1/sales", createSaleDto);
        }

        var dateFrom = DateTime.UtcNow.AddDays(-1).ToString("yyyy-MM-dd");
        var dateTo = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd");

        // Act
        var response = await _client.GetAsync($"/api/v1/sales/stats?dateFrom={dateFrom}&dateTo={dateTo}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<SalesStatsDto>();
        result.Should().NotBeNull();
        result!.TotalTransactions.Should().Be(3);
        result.TotalSales.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task POST_CreateSale_WithStandardInvoice_GeneratesInvoiceNumber()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testcashier");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createSaleDto = new CreateSaleDto
        {
            InvoiceType = InvoiceType.Standard,
            PaymentMethod = PaymentMethod.Card,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                    Quantity = 1,
                    UnitPrice = 1000.00m,
                    DiscountType = DiscountType.None,
                    DiscountValue = 0
                }
            }
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/sales", createSaleDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var result = await response.Content.ReadFromJsonAsync<SaleDto>();
        result.Should().NotBeNull();
        result!.InvoiceNumber.Should().NotBeNullOrEmpty();
        result.InvoiceNumber.Should().StartWith("TB001-"); // Branch code prefix
    }
}
