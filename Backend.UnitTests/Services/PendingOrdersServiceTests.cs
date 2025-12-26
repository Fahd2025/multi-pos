using Xunit;
using Moq;
using FluentAssertions;
using Backend.Services.Branch.PendingOrders;
using Backend.Data;
using Backend.Models.Entities.Branch;
using Backend.Models.DTOs.Branch.PendingOrders;
using Backend.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.UnitTests.Services;

public class PendingOrdersServiceTests
{
    private readonly Mock<ILogger<PendingOrdersService>> _mockLogger;
    private readonly BranchDbContext _context;
    private readonly PendingOrdersService _service;
    private readonly string _testUserId = "test-user-123";
    private readonly string _testUsername = "test_cashier";

    public PendingOrdersServiceTests()
    {
        // Setup in-memory database
        var options = new DbContextOptionsBuilder<BranchDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new BranchDbContext(options);
        _mockLogger = new Mock<ILogger<PendingOrdersService>>();
        _service = new PendingOrdersService(_context, _mockLogger.Object);
    }

    [Fact]
    public async Task CreatePendingOrder_ValidData_ReturnsOrderNumber()
    {
        // Arrange
        var createDto = new CreatePendingOrderDto
        {
            CustomerName = "John Doe",
            CustomerPhone = "(555) 123-4567",
            OrderType = OrderType.DineIn,
            Status = PendingOrderStatus.Parked,
            Items = new List<PendingOrderItemDto>
            {
                new PendingOrderItemDto
                {
                    ProductId = Guid.NewGuid(),
                    ProductName = "Pizza",
                    ProductSku = "PIZZA-001",
                    UnitPrice = 12.99m,
                    Quantity = 2,
                    Discount = 0,
                    TotalPrice = 25.98m
                }
            },
            Subtotal = 25.98m,
            TaxAmount = 2.60m,
            DiscountAmount = 0,
            TotalAmount = 28.58m
        };

        // Act
        var result = await _service.CreatePendingOrderAsync(createDto, _testUserId, _testUsername);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.OrderNumber.Should().MatchRegex(@"^PO-\d{8}-\d{4}$"); // Format: PO-YYYYMMDD-XXXX
        result.Data.CustomerName.Should().Be("John Doe");
        result.Data.TotalAmount.Should().Be(28.58m);
        result.Data.ItemCount.Should().Be(1);
    }

    [Fact]
    public async Task SavePendingOrder_MinimalData_Success()
    {
        // Arrange - Test with minimal data (customer info optional)
        var createDto = new CreatePendingOrderDto
        {
            OrderType = OrderType.TakeAway,
            Status = PendingOrderStatus.Parked,
            Items = new List<PendingOrderItemDto>
            {
                new PendingOrderItemDto
                {
                    ProductId = Guid.NewGuid(),
                    ProductName = "Burger",
                    UnitPrice = 8.99m,
                    Quantity = 1,
                    Discount = 0,
                    TotalPrice = 8.99m
                }
            },
            Subtotal = 8.99m,
            TaxAmount = 0.90m,
            DiscountAmount = 0,
            TotalAmount = 9.89m
        };

        // Act
        var result = await _service.CreatePendingOrderAsync(createDto, _testUserId, _testUsername);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Data!.CustomerName.Should().BeNull(); // Customer name is optional
        result.Data.OrderType.Should().Be(OrderType.TakeAway);
        result.Data.Status.Should().Be(PendingOrderStatus.Parked);
    }

    [Fact]
    public async Task GetPendingOrders_CashierRole_ReturnsOnlyOwnOrders()
    {
        // Arrange - Create orders for different users
        var cashier1Id = "cashier-1";
        var cashier2Id = "cashier-2";

        await CreateTestPendingOrder(cashier1Id, "cashier1");
        await CreateTestPendingOrder(cashier1Id, "cashier1");
        await CreateTestPendingOrder(cashier2Id, "cashier2");

        // Act - Get orders for cashier1 (non-manager role)
        var result = await _service.GetPendingOrdersAsync(
            status: null,
            createdBy: cashier1Id, // Filter by cashier1
            orderType: null,
            search: null,
            page: 1,
            pageSize: 10,
            isManager: false,
            currentUserId: cashier1Id
        );

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Items.Should().HaveCount(2); // Only cashier1's orders
        result.Data.Items.Should().AllSatisfy(o => o.CreatedByUserId.Should().Be(cashier1Id));
    }

    [Fact]
    public async Task GetPendingOrders_ManagerRole_ReturnsAllOrders()
    {
        // Arrange - Create orders for different users
        var cashier1Id = "cashier-1";
        var cashier2Id = "cashier-2";
        var managerId = "manager-1";

        await CreateTestPendingOrder(cashier1Id, "cashier1");
        await CreateTestPendingOrder(cashier2Id, "cashier2");
        await CreateTestPendingOrder(managerId, "manager");

        // Act - Get all orders (manager role)
        var result = await _service.GetPendingOrdersAsync(
            status: null,
            createdBy: null, // No filter - manager sees all
            orderType: null,
            search: null,
            page: 1,
            pageSize: 10,
            isManager: true,
            currentUserId: managerId
        );

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Items.Should().HaveCount(3); // All orders from all cashiers
        result.Data.TotalCount.Should().Be(3);
    }

    [Fact]
    public async Task AutoExpiry_After24Hours_OrdersDeleted()
    {
        // Arrange - Create order and set expiry to past
        var order = new PendingOrder
        {
            Id = Guid.NewGuid(),
            OrderNumber = "PO-20251224-0001",
            OrderType = OrderType.DineIn,
            Status = PendingOrderStatus.Parked,
            CreatedAt = DateTime.UtcNow.AddHours(-25), // Created 25 hours ago
            ExpiresAt = DateTime.UtcNow.AddHours(-1), // Expired 1 hour ago
            CreatedByUserId = _testUserId,
            CreatedByUsername = _testUsername,
            Subtotal = 10.00m,
            TaxAmount = 1.00m,
            TotalAmount = 11.00m,
            Items = new List<PendingOrderItem>()
        };

        await _context.PendingOrders.AddAsync(order);
        await _context.SaveChangesAsync();

        // Act - Call cleanup method
        var deletedCount = await _service.DeleteExpiredOrdersAsync();

        // Assert
        deletedCount.Should().Be(1);
        var remainingOrder = await _context.PendingOrders.FindAsync(order.Id);
        remainingOrder.Should().BeNull(); // Order should be deleted
    }

    [Fact]
    public async Task RetrievePendingOrder_ValidId_ReturnsOrderData()
    {
        // Arrange
        var orderId = await CreateTestPendingOrder(_testUserId, _testUsername);

        // Act
        var result = await _service.RetrievePendingOrderAsync(orderId, _testUserId, isManager: false);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Id.Should().Be(orderId);
        result.Data.Items.Should().NotBeEmpty();
    }

    [Fact]
    public async Task DeletePendingOrder_ValidId_Success()
    {
        // Arrange
        var orderId = await CreateTestPendingOrder(_testUserId, _testUsername);

        // Act
        var result = await _service.DeletePendingOrderAsync(orderId, _testUserId, isManager: false);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();

        var deletedOrder = await _context.PendingOrders.FindAsync(orderId);
        deletedOrder.Should().BeNull();
    }

    [Fact]
    public async Task GetPendingOrders_FilterByStatus_ReturnsFilteredResults()
    {
        // Arrange
        await CreateTestPendingOrder(_testUserId, _testUsername, PendingOrderStatus.Parked);
        await CreateTestPendingOrder(_testUserId, _testUsername, PendingOrderStatus.OnHold);
        await CreateTestPendingOrder(_testUserId, _testUsername, PendingOrderStatus.Parked);

        // Act - Filter by Parked status
        var result = await _service.GetPendingOrdersAsync(
            status: PendingOrderStatus.Parked,
            createdBy: _testUserId,
            orderType: null,
            search: null,
            page: 1,
            pageSize: 10,
            isManager: false,
            currentUserId: _testUserId
        );

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Data!.Items.Should().HaveCount(2);
        result.Data.Items.Should().AllSatisfy(o => o.Status.Should().Be(PendingOrderStatus.Parked));
    }

    [Fact]
    public async Task GetPendingOrders_SearchByCustomerName_ReturnsMatchingOrders()
    {
        // Arrange
        await CreateTestPendingOrder(_testUserId, _testUsername, customerName: "John Doe");
        await CreateTestPendingOrder(_testUserId, _testUsername, customerName: "Jane Smith");
        await CreateTestPendingOrder(_testUserId, _testUsername, customerName: "John Wilson");

        // Act - Search for "John"
        var result = await _service.GetPendingOrdersAsync(
            status: null,
            createdBy: _testUserId,
            orderType: null,
            search: "John",
            page: 1,
            pageSize: 10,
            isManager: false,
            currentUserId: _testUserId
        );

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Data!.Items.Should().HaveCount(2); // "John Doe" and "John Wilson"
        result.Data.Items.Should().AllSatisfy(o =>
            o.CustomerName.Should().Contain("John"));
    }

    [Fact]
    public async Task UpdatePendingOrder_ValidData_Success()
    {
        // Arrange
        var orderId = await CreateTestPendingOrder(_testUserId, _testUsername);
        var updateDto = new UpdatePendingOrderDto
        {
            CustomerName = "Updated Customer",
            CustomerPhone = "(555) 999-8888",
            Status = PendingOrderStatus.OnHold,
            Notes = "Customer will return in 30 minutes"
        };

        // Act
        var result = await _service.UpdatePendingOrderAsync(orderId, updateDto, _testUserId, isManager: false);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Data!.CustomerName.Should().Be("Updated Customer");
        result.Data.Status.Should().Be(PendingOrderStatus.OnHold);
        result.Data.Notes.Should().Be("Customer will return in 30 minutes");
    }

    // Helper method to create test pending order
    private async Task<Guid> CreateTestPendingOrder(
        string userId,
        string username,
        PendingOrderStatus status = PendingOrderStatus.Parked,
        string? customerName = null)
    {
        var order = new PendingOrder
        {
            Id = Guid.NewGuid(),
            OrderNumber = $"PO-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4)}",
            CustomerName = customerName,
            OrderType = OrderType.DineIn,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedByUserId = userId,
            CreatedByUsername = username,
            Subtotal = 25.00m,
            TaxAmount = 2.50m,
            TotalAmount = 27.50m,
            Items = new List<PendingOrderItem>
            {
                new PendingOrderItem
                {
                    Id = Guid.NewGuid(),
                    ProductId = Guid.NewGuid(),
                    ProductName = "Test Product",
                    UnitPrice = 25.00m,
                    Quantity = 1,
                    TotalPrice = 25.00m
                }
            }
        };

        await _context.PendingOrders.AddAsync(order);
        await _context.SaveChangesAsync();

        return order.Id;
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
