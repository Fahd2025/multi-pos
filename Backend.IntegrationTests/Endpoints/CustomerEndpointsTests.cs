using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Backend.Data;
using Backend.Models.DTOs.Branch.Customers;
using Backend.Models.Entities.Branch;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Backend.IntegrationTests.Endpoints;

public class CustomerEndpointsTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public CustomerEndpointsTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> GetAuthTokenAsync(string username = "testmanager", string password = "password123")
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
        branchContext.Customers.RemoveRange(branchContext.Customers);
        await branchContext.SaveChangesAsync();

        // Create test customers
        var customer1 = new Customer
        {
            Id = Guid.Parse("88888888-8888-8888-8888-888888888888"),
            Code = "CUST001",
            NameEn = "John Doe",
            NameAr = "جون دو",
            Email = "john.doe@example.com",
            Phone = "+1234567890",
            AddressEn = "123 Main St",
            AddressAr = "شارع الرئيسي 123",
            TotalPurchases = 500.00m,
            VisitCount = 5,
            LoyaltyPoints = 50,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = Guid.Parse("33333333-3333-3333-3333-333333333333")
        };
        branchContext.Customers.Add(customer1);

        var customer2 = new Customer
        {
            Id = Guid.Parse("99999999-9999-9999-9999-999999999999"),
            Code = "CUST002",
            NameEn = "Jane Smith",
            NameAr = "جين سميث",
            Email = "jane.smith@example.com",
            Phone = "+0987654321",
            TotalPurchases = 300.00m,
            VisitCount = 3,
            LoyaltyPoints = 30,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = Guid.Parse("33333333-3333-3333-3333-333333333333")
        };
        branchContext.Customers.Add(customer2);

        await branchContext.SaveChangesAsync();
    }

    [Fact]
    public async Task POST_CreateCustomer_WithValidData_ReturnsCreated()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testmanager");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createCustomerDto = new CreateCustomerDto
        {
            Code = "CUST003",
            NameEn = "Alice Brown",
            NameAr = "أليس براون",
            Email = "alice.brown@example.com",
            Phone = "+1122334455",
            AddressEn = "456 Oak Ave",
            AddressAr = "شارع البلوط 456",
            LoyaltyPoints = 0,
            IsActive = true
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/customers", createCustomerDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var result = await response.Content.ReadFromJsonAsync<CustomerDto>();
        result.Should().NotBeNull();
        result!.Code.Should().Be("CUST003");
        result.NameEn.Should().Be("Alice Brown");
        result.NameAr.Should().Be("أليس براون");
        result.Email.Should().Be("alice.brown@example.com");
        result.Phone.Should().Be("+1122334455");
        result.TotalPurchases.Should().Be(0);
        result.VisitCount.Should().Be(0);
        result.LoyaltyPoints.Should().Be(0);
        result.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task POST_CreateCustomer_WithDuplicateCode_ReturnsBadRequest()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testmanager");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createCustomerDto = new CreateCustomerDto
        {
            Code = "CUST001", // Duplicate code
            NameEn = "Duplicate Customer",
            NameAr = "عميل مكرر",
            IsActive = true
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/customers", createCustomerDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GET_GetCustomers_ReturnsAllCustomers()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testmanager");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/v1/customers");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<List<CustomerDto>>();
        result.Should().NotBeNull();
        result.Should().HaveCountGreaterOrEqualTo(2);
        result.Should().Contain(c => c.Code == "CUST001");
        result.Should().Contain(c => c.Code == "CUST002");
    }

    [Fact]
    public async Task GET_GetCustomers_WithSearch_ReturnsFilteredCustomers()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testmanager");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/v1/customers?search=John");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<List<CustomerDto>>();
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result![0].NameEn.Should().Contain("John");
    }

    [Fact]
    public async Task GET_GetCustomerById_ExistingCustomer_ReturnsCustomer()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testmanager");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var customerId = "88888888-8888-8888-8888-888888888888";

        // Act
        var response = await _client.GetAsync($"/api/v1/customers/{customerId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<CustomerDto>();
        result.Should().NotBeNull();
        result!.Id.Should().Be(Guid.Parse(customerId));
        result.Code.Should().Be("CUST001");
        result.NameEn.Should().Be("John Doe");
    }

    [Fact]
    public async Task GET_GetCustomerById_NonExistingCustomer_ReturnsNotFound()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testmanager");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var nonExistingId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/v1/customers/{nonExistingId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task PUT_UpdateCustomer_WithValidData_ReturnsOk()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testmanager");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var customerId = "88888888-8888-8888-8888-888888888888";
        var updateCustomerDto = new UpdateCustomerDto
        {
            Code = "CUST001",
            NameEn = "John Doe Updated",
            NameAr = "جون دو محدث",
            Email = "john.updated@example.com",
            Phone = "+1234567899",
            AddressEn = "123 Main St Updated",
            AddressAr = "شارع الرئيسي 123 محدث",
            LoyaltyPoints = 100,
            IsActive = true
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/customers/{customerId}", updateCustomerDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<CustomerDto>();
        result.Should().NotBeNull();
        result!.NameEn.Should().Be("John Doe Updated");
        result.Email.Should().Be("john.updated@example.com");
        result.LoyaltyPoints.Should().Be(100);
    }

    [Fact]
    public async Task PUT_UpdateCustomer_NonExistingCustomer_ReturnsNotFound()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testmanager");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var nonExistingId = Guid.NewGuid();
        var updateCustomerDto = new UpdateCustomerDto
        {
            Code = "CUST999",
            NameEn = "Non Existing",
            IsActive = true
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/v1/customers/{nonExistingId}", updateCustomerDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DELETE_DeleteCustomer_ExistingCustomer_ReturnsNoContent()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testmanager");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var customerId = "99999999-9999-9999-9999-999999999999";

        // Act
        var response = await _client.DeleteAsync($"/api/v1/customers/{customerId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify customer is deleted
        var getResponse = await _client.GetAsync($"/api/v1/customers/{customerId}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DELETE_DeleteCustomer_NonExistingCustomer_ReturnsNotFound()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testmanager");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var nonExistingId = Guid.NewGuid();

        // Act
        var response = await _client.DeleteAsync($"/api/v1/customers/{nonExistingId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GET_GetCustomerPurchaseHistory_ExistingCustomer_ReturnsSales()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testmanager");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var customerId = "88888888-8888-8888-8888-888888888888";

        // Act
        var response = await _client.GetAsync($"/api/v1/customers/{customerId}/history");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task POST_CreateCustomer_WithoutAuthentication_ReturnsUnauthorized()
    {
        // Arrange
        var createCustomerDto = new CreateCustomerDto
        {
            Code = "CUST004",
            NameEn = "Test Customer",
            IsActive = true
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/customers", createCustomerDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task POST_CreateCustomer_WithInvalidEmail_ReturnsBadRequest()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testmanager");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createCustomerDto = new CreateCustomerDto
        {
            Code = "CUST005",
            NameEn = "Invalid Email Customer",
            Email = "invalid-email", // Invalid email format
            IsActive = true
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/customers", createCustomerDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GET_GetCustomers_WithPagination_ReturnsPagedResults()
    {
        // Arrange
        await SeedBranchData();
        var token = await GetAuthTokenAsync("testmanager");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/v1/customers?page=1&pageSize=1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<List<CustomerDto>>();
        result.Should().NotBeNull();
        result.Should().HaveCountLessOrEqualTo(1);
    }
}
