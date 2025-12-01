using Backend.Data;
using Backend.Models.DTOs.Branch.Customers;
using Backend.Models.Entities.Branch;
using Backend.Models.Entities.HeadOffice;
using Backend.Services.Branch.Customers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Backend.UnitTests.Services;

public class CustomerServiceTests
{
    private readonly DbContextOptions<HeadOfficeDbContext> _headOfficeOptions;
    private readonly DbContextOptions<BranchDbContext> _branchOptions;

    public CustomerServiceTests()
    {
        // Use InMemory database for testing
        _headOfficeOptions = new DbContextOptionsBuilder<HeadOfficeDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestHeadOfficeDb_{Guid.NewGuid()}")
            .Options;

        _branchOptions = new DbContextOptionsBuilder<BranchDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestBranchDb_{Guid.NewGuid()}")
            .Options;
    }

    private HeadOfficeDbContext CreateHeadOfficeContext()
    {
        return new HeadOfficeDbContext(_headOfficeOptions);
    }

    private BranchDbContext CreateBranchContext()
    {
        return new BranchDbContext(_branchOptions);
    }

    private async Task<(HeadOfficeDbContext headOfficeContext, BranchDbContext branchContext, User user)> SetupTestData()
    {
        var headOfficeContext = CreateHeadOfficeContext();
        var branchContext = CreateBranchContext();

        // Create test user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "testuser",
            Email = "test@example.com",
            FullNameEn = "Test User",
            FullNameAr = "مستخدم تجريبي",
            PasswordHash = "hashedpassword",
            IsHeadOfficeAdmin = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        headOfficeContext.Users.Add(user);
        await headOfficeContext.SaveChangesAsync();

        return (headOfficeContext, branchContext, user);
    }

    [Fact]
    public async Task CreateCustomerAsync_ValidCustomer_ReturnsCustomerDto()
    {
        // Arrange
        var (headOfficeContext, branchContext, user) = await SetupTestData();
        var service = new CustomerService(branchContext);

        var createDto = new CreateCustomerDto
        {
            Code = "CUST001",
            NameEn = "John Doe",
            NameAr = "جون دو",
            Email = "john.doe@example.com",
            Phone = "+1234567890",
            AddressEn = "123 Main St",
            AddressAr = "شارع الرئيسي 123",
            LoyaltyPoints = 0,
            IsActive = true
        };

        // Act
        var result = await service.CreateCustomerAsync(createDto, user.Id);

        // Assert
        result.Should().NotBeNull();
        result.Code.Should().Be(createDto.Code);
        result.NameEn.Should().Be(createDto.NameEn);
        result.NameAr.Should().Be(createDto.NameAr);
        result.Email.Should().Be(createDto.Email);
        result.Phone.Should().Be(createDto.Phone);
        result.AddressEn.Should().Be(createDto.AddressEn);
        result.AddressAr.Should().Be(createDto.AddressAr);
        result.LoyaltyPoints.Should().Be(0);
        result.TotalPurchases.Should().Be(0);
        result.VisitCount.Should().Be(0);
        result.IsActive.Should().BeTrue();
        result.CreatedBy.Should().Be(user.Id);

        // Cleanup
        await headOfficeContext.DisposeAsync();
        await branchContext.DisposeAsync();
    }

    [Fact]
    public async Task CreateCustomerAsync_DuplicateCode_ThrowsException()
    {
        // Arrange
        var (headOfficeContext, branchContext, user) = await SetupTestData();
        var service = new CustomerService(branchContext);

        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Code = "CUST001",
            NameEn = "Existing Customer",
            NameAr = "عميل موجود",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = user.Id
        };
        branchContext.Customers.Add(customer);
        await branchContext.SaveChangesAsync();

        var createDto = new CreateCustomerDto
        {
            Code = "CUST001",
            NameEn = "New Customer",
            NameAr = "عميل جديد",
            IsActive = true
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await service.CreateCustomerAsync(createDto, user.Id)
        );

        // Cleanup
        await headOfficeContext.DisposeAsync();
        await branchContext.DisposeAsync();
    }

    [Fact]
    public async Task GetCustomersAsync_ReturnsAllCustomers()
    {
        // Arrange
        var (headOfficeContext, branchContext, user) = await SetupTestData();
        var service = new CustomerService(branchContext);

        var customers = new List<Customer>
        {
            new Customer
            {
                Id = Guid.NewGuid(),
                Code = "CUST001",
                NameEn = "Customer One",
                NameAr = "العميل الأول",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = user.Id
            },
            new Customer
            {
                Id = Guid.NewGuid(),
                Code = "CUST002",
                NameEn = "Customer Two",
                NameAr = "العميل الثاني",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = user.Id
            }
        };

        branchContext.Customers.AddRange(customers);
        await branchContext.SaveChangesAsync();

        // Act
        var result = await service.GetCustomersAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().Contain(c => c.Code == "CUST001");
        result.Should().Contain(c => c.Code == "CUST002");

        // Cleanup
        await headOfficeContext.DisposeAsync();
        await branchContext.DisposeAsync();
    }

    [Fact]
    public async Task GetCustomerByIdAsync_ExistingCustomer_ReturnsCustomer()
    {
        // Arrange
        var (headOfficeContext, branchContext, user) = await SetupTestData();
        var service = new CustomerService(branchContext);

        var customerId = Guid.NewGuid();
        var customer = new Customer
        {
            Id = customerId,
            Code = "CUST001",
            NameEn = "John Doe",
            NameAr = "جون دو",
            Email = "john.doe@example.com",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = user.Id
        };

        branchContext.Customers.Add(customer);
        await branchContext.SaveChangesAsync();

        // Act
        var result = await service.GetCustomerByIdAsync(customerId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(customerId);
        result.Code.Should().Be("CUST001");
        result.NameEn.Should().Be("John Doe");

        // Cleanup
        await headOfficeContext.DisposeAsync();
        await branchContext.DisposeAsync();
    }

    [Fact]
    public async Task GetCustomerByIdAsync_NonExistingCustomer_ReturnsNull()
    {
        // Arrange
        var (headOfficeContext, branchContext, user) = await SetupTestData();
        var service = new CustomerService(branchContext);

        var nonExistingId = Guid.NewGuid();

        // Act
        var result = await service.GetCustomerByIdAsync(nonExistingId);

        // Assert
        result.Should().BeNull();

        // Cleanup
        await headOfficeContext.DisposeAsync();
        await branchContext.DisposeAsync();
    }

    [Fact]
    public async Task UpdateCustomerAsync_ValidUpdate_ReturnsUpdatedCustomer()
    {
        // Arrange
        var (headOfficeContext, branchContext, user) = await SetupTestData();
        var service = new CustomerService(branchContext);

        var customerId = Guid.NewGuid();
        var customer = new Customer
        {
            Id = customerId,
            Code = "CUST001",
            NameEn = "John Doe",
            NameAr = "جون دو",
            Email = "old.email@example.com",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = user.Id
        };

        branchContext.Customers.Add(customer);
        await branchContext.SaveChangesAsync();

        var updateDto = new UpdateCustomerDto
        {
            Code = "CUST001",
            NameEn = "Jane Doe",
            NameAr = "جين دو",
            Email = "new.email@example.com",
            Phone = "+9876543210",
            LoyaltyPoints = 100,
            IsActive = true
        };

        // Act
        var result = await service.UpdateCustomerAsync(customerId, updateDto);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(customerId);
        result.NameEn.Should().Be("Jane Doe");
        result.NameAr.Should().Be("جين دو");
        result.Email.Should().Be("new.email@example.com");
        result.Phone.Should().Be("+9876543210");
        result.LoyaltyPoints.Should().Be(100);

        // Cleanup
        await headOfficeContext.DisposeAsync();
        await branchContext.DisposeAsync();
    }

    [Fact]
    public async Task UpdateCustomerAsync_NonExistingCustomer_ThrowsException()
    {
        // Arrange
        var (headOfficeContext, branchContext, user) = await SetupTestData();
        var service = new CustomerService(branchContext);

        var nonExistingId = Guid.NewGuid();
        var updateDto = new UpdateCustomerDto
        {
            Code = "CUST001",
            NameEn = "Jane Doe",
            IsActive = true
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await service.UpdateCustomerAsync(nonExistingId, updateDto)
        );

        // Cleanup
        await headOfficeContext.DisposeAsync();
        await branchContext.DisposeAsync();
    }

    [Fact]
    public async Task DeleteCustomerAsync_ExistingCustomer_ReturnsTrue()
    {
        // Arrange
        var (headOfficeContext, branchContext, user) = await SetupTestData();
        var service = new CustomerService(branchContext);

        var customerId = Guid.NewGuid();
        var customer = new Customer
        {
            Id = customerId,
            Code = "CUST001",
            NameEn = "John Doe",
            NameAr = "جون دو",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = user.Id
        };

        branchContext.Customers.Add(customer);
        await branchContext.SaveChangesAsync();

        // Act
        var result = await service.DeleteCustomerAsync(customerId);

        // Assert
        result.Should().BeTrue();

        var deletedCustomer = await branchContext.Customers.FindAsync(customerId);
        deletedCustomer.Should().BeNull();

        // Cleanup
        await headOfficeContext.DisposeAsync();
        await branchContext.DisposeAsync();
    }

    [Fact]
    public async Task DeleteCustomerAsync_NonExistingCustomer_ReturnsFalse()
    {
        // Arrange
        var (headOfficeContext, branchContext, user) = await SetupTestData();
        var service = new CustomerService(branchContext);

        var nonExistingId = Guid.NewGuid();

        // Act
        var result = await service.DeleteCustomerAsync(nonExistingId);

        // Assert
        result.Should().BeFalse();

        // Cleanup
        await headOfficeContext.DisposeAsync();
        await branchContext.DisposeAsync();
    }

    [Fact]
    public async Task UpdateCustomerStatsAsync_ValidSale_UpdatesStatsCorrectly()
    {
        // Arrange
        var (headOfficeContext, branchContext, user) = await SetupTestData();
        var service = new CustomerService(branchContext);

        var customerId = Guid.NewGuid();
        var customer = new Customer
        {
            Id = customerId,
            Code = "CUST001",
            NameEn = "John Doe",
            NameAr = "جون دو",
            TotalPurchases = 100.00m,
            VisitCount = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = user.Id
        };

        branchContext.Customers.Add(customer);
        await branchContext.SaveChangesAsync();

        decimal saleAmount = 50.00m;

        // Act
        await service.UpdateCustomerStatsAsync(customerId, saleAmount);

        // Assert
        var updatedCustomer = await branchContext.Customers.FindAsync(customerId);
        updatedCustomer.Should().NotBeNull();
        updatedCustomer!.TotalPurchases.Should().Be(150.00m);
        updatedCustomer.VisitCount.Should().Be(2);
        updatedCustomer.LastVisitAt.Should().NotBeNull();

        // Cleanup
        await headOfficeContext.DisposeAsync();
        await branchContext.DisposeAsync();
    }

    [Fact]
    public async Task GetCustomerPurchaseHistoryAsync_ReturnsCustomerSales()
    {
        // Arrange
        var (headOfficeContext, branchContext, user) = await SetupTestData();
        var service = new CustomerService(branchContext);

        var customerId = Guid.NewGuid();
        var customer = new Customer
        {
            Id = customerId,
            Code = "CUST001",
            NameEn = "John Doe",
            NameAr = "جون دو",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = user.Id
        };

        branchContext.Customers.Add(customer);

        var sales = new List<Sale>
        {
            new Sale
            {
                Id = Guid.NewGuid(),
                TransactionId = "TXN001",
                CustomerId = customerId,
                CashierId = user.Id,
                SaleDate = DateTime.UtcNow,
                Subtotal = 100.00m,
                TaxAmount = 15.00m,
                Total = 115.00m,
                PaymentMethod = PaymentMethod.Cash,
                InvoiceType = InvoiceType.Standard,
                IsVoided = false,
                CreatedAt = DateTime.UtcNow
            },
            new Sale
            {
                Id = Guid.NewGuid(),
                TransactionId = "TXN002",
                CustomerId = customerId,
                CashierId = user.Id,
                SaleDate = DateTime.UtcNow.AddDays(-1),
                Subtotal = 200.00m,
                TaxAmount = 30.00m,
                Total = 230.00m,
                PaymentMethod = PaymentMethod.Card,
                InvoiceType = InvoiceType.Standard,
                IsVoided = false,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            }
        };

        branchContext.Sales.AddRange(sales);
        await branchContext.SaveChangesAsync();

        // Act
        var result = await service.GetCustomerPurchaseHistoryAsync(customerId);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().Contain(s => s.TransactionId == "TXN001");
        result.Should().Contain(s => s.TransactionId == "TXN002");

        // Cleanup
        await headOfficeContext.DisposeAsync();
        await branchContext.DisposeAsync();
    }
}
