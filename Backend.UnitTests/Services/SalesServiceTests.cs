using Backend.Data;
using Backend.Models.DTOs.Branch.Sales;
using Backend.Models.Entities.Branch;
using Backend.Models.Entities.HeadOffice;
using Backend.Services.Branch.Sales;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Backend.UnitTests.Services;

public class SalesServiceTests
{
    private readonly DbContextOptions<HeadOfficeDbContext> _headOfficeOptions;
    private readonly DbContextOptions<BranchDbContext> _branchOptions;

    public SalesServiceTests()
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

    private async Task<(HeadOfficeDbContext headOfficeContext, BranchDbContext branchContext, Branch branch, User cashier, List<Product> products)> SetupTestData()
    {
        var headOfficeContext = CreateHeadOfficeContext();
        var branchContext = CreateBranchContext();

        // Create test branch
        var branch = new Branch
        {
            Id = Guid.NewGuid(),
            LoginName = "branch001",
            NameEn = "Test Branch",
            NameAr = "فرع تجريبي",
            Code = "BR001",
            TaxRate = 15.0m,
            IsActive = true,
            DatabaseProvider = DatabaseProvider.SQLite,
            DbServer = "localhost",
            DbName = "TestDb",
            DbPort = 0,
            CreatedAt = DateTime.UtcNow
        };
        headOfficeContext.Branches.Add(branch);

        // Create test cashier
        var cashier = new User
        {
            Id = Guid.NewGuid(),
            Username = "cashier001",
            Email = "cashier@test.com",
            FullNameEn = "Test Cashier",
            FullNameAr = "كاشير تجريبي",
            PasswordHash = "hashedpassword",
            IsHeadOfficeAdmin = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        headOfficeContext.Users.Add(cashier);

        await headOfficeContext.SaveChangesAsync();

        // Create test products
        var category = new Category
        {
            Id = Guid.NewGuid(),
            NameEn = "Electronics",
            NameAr = "إلكترونيات",
            CreatedAt = DateTime.UtcNow
        };
        branchContext.Categories.Add(category);

        var products = new List<Product>
        {
            new Product
            {
                Id = Guid.NewGuid(),
                SKU = "SKU-A",
                NameEn = "Product A",
                NameAr = "منتج أ",
                Barcode = "PROD001",
                CategoryId = category.Id,
                SellingPrice = 100.00m,
                CostPrice = 50.00m,
                StockLevel = 50,
                MinStockThreshold = 10,
                IsActive = true,
                HasInventoryDiscrepancy = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Id = Guid.NewGuid(),
                SKU = "SKU-B",
                NameEn = "Product B",
                NameAr = "منتج ب",
                Barcode = "PROD002",
                CategoryId = category.Id,
                SellingPrice = 200.00m,
                CostPrice = 100.00m,
                StockLevel = 30,
                MinStockThreshold = 5,
                IsActive = true,
                HasInventoryDiscrepancy = false,
                CreatedAt = DateTime.UtcNow
            }
        };
        branchContext.Products.AddRange(products);

        await branchContext.SaveChangesAsync();

        return (headOfficeContext, branchContext, branch, cashier, products);
    }

    [Fact]
    public async Task CreateSale_ValidSale_ReturnsSaleWithCalculatedTotals()
    {
        // Arrange
        var (headOfficeContext, branchContext, branch, cashier, products) = await SetupTestData();

        var mockDbContextFactory = new Mock<DbContextFactory>();
        mockDbContextFactory
            .Setup(f => f.CreateBranchContext(It.IsAny<Branch>()))
            .Returns(branchContext);

        var salesService = new SalesService(mockDbContextFactory.Object, headOfficeContext);

        var createSaleDto = new CreateSaleDto
        {
            InvoiceType = InvoiceType.Touch,
            PaymentMethod = PaymentMethod.Cash,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = products[0].Id,
                    Quantity = 2,
                    UnitPrice = 100.00m,
                    DiscountType = DiscountType.Percentage,
                    DiscountValue = 10 // 10% discount
                },
                new CreateSaleLineItemDto
                {
                    ProductId = products[1].Id,
                    Quantity = 1,
                    UnitPrice = 200.00m,
                    DiscountType = DiscountType.None,
                    DiscountValue = 0
                }
            }
        };

        // Act
        var result = await salesService.CreateSaleAsync(createSaleDto, cashier.Id, branch.LoginName);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().NotBeEmpty();
        result.TransactionId.Should().NotBeNullOrEmpty();
        result.InvoiceType.Should().Be(InvoiceType.Touch);
        result.InvoiceNumber.Should().BeNull(); // Touch invoices don't have invoice numbers
        result.CashierId.Should().Be(cashier.Id);
        result.LineItems.Should().HaveCount(2);

        // Verify first line item calculations
        var lineItem1 = result.LineItems[0];
        lineItem1.Quantity.Should().Be(2);
        lineItem1.UnitPrice.Should().Be(100.00m);
        lineItem1.DiscountedUnitPrice.Should().Be(90.00m); // 100 - 10% = 90
        lineItem1.LineTotal.Should().Be(180.00m); // 90 * 2 = 180

        // Verify second line item calculations
        var lineItem2 = result.LineItems[1];
        lineItem2.Quantity.Should().Be(1);
        lineItem2.UnitPrice.Should().Be(200.00m);
        lineItem2.DiscountedUnitPrice.Should().Be(200.00m);
        lineItem2.LineTotal.Should().Be(200.00m);

        // Verify totals
        result.Subtotal.Should().Be(380.00m); // 180 + 200
        result.TotalDiscount.Should().Be(20.00m); // 10 * 2
        result.TaxAmount.Should().Be(57.00m); // 380 * 15% = 57
        result.Total.Should().Be(437.00m); // 380 + 57
        result.PaymentMethod.Should().Be(PaymentMethod.Cash);
        result.IsVoided.Should().BeFalse();

        // Verify inventory was updated
        var updatedProduct1 = await branchContext.Products.FindAsync(products[0].Id);
        updatedProduct1.Should().NotBeNull();
        updatedProduct1!.StockLevel.Should().Be(48); // 50 - 2

        var updatedProduct2 = await branchContext.Products.FindAsync(products[1].Id);
        updatedProduct2.Should().NotBeNull();
        updatedProduct2!.StockLevel.Should().Be(29); // 30 - 1
    }

    [Fact]
    public async Task CreateSale_WithFixedAmountDiscount_CalculatesCorrectly()
    {
        // Arrange
        var (headOfficeContext, branchContext, branch, cashier, products) = await SetupTestData();

        var mockDbContextFactory = new Mock<DbContextFactory>();
        mockDbContextFactory
            .Setup(f => f.CreateBranchContext(It.IsAny<Branch>()))
            .Returns(branchContext);

        var salesService = new SalesService(mockDbContextFactory.Object, headOfficeContext);

        var createSaleDto = new CreateSaleDto
        {
            InvoiceType = InvoiceType.Standard,
            PaymentMethod = PaymentMethod.Card,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = products[0].Id,
                    Quantity = 1,
                    UnitPrice = 100.00m,
                    DiscountType = DiscountType.FixedAmount,
                    DiscountValue = 15.00m // Fixed 15 discount
                }
            }
        };

        // Act
        var result = await salesService.CreateSaleAsync(createSaleDto, cashier.Id, branch.LoginName);

        // Assert
        result.Should().NotBeNull();
        result.InvoiceType.Should().Be(InvoiceType.Standard);
        result.InvoiceNumber.Should().NotBeNullOrEmpty(); // Standard invoices should have invoice numbers

        var lineItem = result.LineItems[0];
        lineItem.DiscountedUnitPrice.Should().Be(85.00m); // 100 - 15
        lineItem.LineTotal.Should().Be(85.00m);

        result.Subtotal.Should().Be(85.00m);
        result.TotalDiscount.Should().Be(15.00m);
        result.TaxAmount.Should().Be(12.75m); // 85 * 15%
        result.Total.Should().Be(97.75m); // 85 + 12.75
    }

    [Fact]
    public async Task CreateSale_WithCustomer_UpdatesCustomerStats()
    {
        // Arrange
        var (headOfficeContext, branchContext, branch, cashier, products) = await SetupTestData();

        // Add a test customer
        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            NameEn = "Test Customer",
            NameAr = "عميل تجريبي",
            Phone = "1234567890",
            TotalPurchases = 0,
            VisitCount = 0,
            CreatedAt = DateTime.UtcNow
        };
        branchContext.Customers.Add(customer);
        await branchContext.SaveChangesAsync();

        var mockDbContextFactory = new Mock<DbContextFactory>();
        mockDbContextFactory
            .Setup(f => f.CreateBranchContext(It.IsAny<Branch>()))
            .Returns(branchContext);

        var salesService = new SalesService(mockDbContextFactory.Object, headOfficeContext);

        var createSaleDto = new CreateSaleDto
        {
            CustomerId = customer.Id,
            InvoiceType = InvoiceType.Standard,
            PaymentMethod = PaymentMethod.Cash,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = products[0].Id,
                    Quantity = 1,
                    UnitPrice = 100.00m,
                    DiscountType = DiscountType.None,
                    DiscountValue = 0
                }
            }
        };

        // Act
        var result = await salesService.CreateSaleAsync(createSaleDto, cashier.Id, branch.LoginName);

        // Assert
        result.Should().NotBeNull();
        result.CustomerId.Should().Be(customer.Id);

        // Verify customer stats were updated
        var updatedCustomer = await branchContext.Customers.FindAsync(customer.Id);
        updatedCustomer.Should().NotBeNull();
        updatedCustomer!.TotalPurchases.Should().Be(115.00m); // 100 + 15% tax
        updatedCustomer.VisitCount.Should().Be(1);
        updatedCustomer.LastVisitAt.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateSale_InsufficientStock_StillProcessesButFlagsDiscrepancy()
    {
        // Arrange
        var (headOfficeContext, branchContext, branch, cashier, products) = await SetupTestData();

        var mockDbContextFactory = new Mock<DbContextFactory>();
        mockDbContextFactory
            .Setup(f => f.CreateBranchContext(It.IsAny<Branch>()))
            .Returns(branchContext);

        var salesService = new SalesService(mockDbContextFactory.Object, headOfficeContext);

        // Try to sell more than available stock (last-commit-wins)
        var createSaleDto = new CreateSaleDto
        {
            InvoiceType = InvoiceType.Touch,
            PaymentMethod = PaymentMethod.Cash,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = products[0].Id,
                    Quantity = 100, // More than the 50 in stock
                    UnitPrice = 100.00m,
                    DiscountType = DiscountType.None,
                    DiscountValue = 0
                }
            }
        };

        // Act
        var result = await salesService.CreateSaleAsync(createSaleDto, cashier.Id, branch.LoginName);

        // Assert
        result.Should().NotBeNull();
        result.LineItems[0].Quantity.Should().Be(100);

        // Verify inventory went negative and was flagged
        var updatedProduct = await branchContext.Products.FindAsync(products[0].Id);
        updatedProduct.Should().NotBeNull();
        updatedProduct!.StockLevel.Should().Be(-50); // 50 - 100 = -50
        updatedProduct.HasInventoryDiscrepancy.Should().BeTrue(); // Should be flagged
    }

    [Fact]
    public async Task CreateSale_InvalidProduct_ThrowsException()
    {
        // Arrange
        var (headOfficeContext, branchContext, branch, cashier, products) = await SetupTestData();

        var mockDbContextFactory = new Mock<DbContextFactory>();
        mockDbContextFactory
            .Setup(f => f.CreateBranchContext(It.IsAny<Branch>()))
            .Returns(branchContext);

        var salesService = new SalesService(mockDbContextFactory.Object, headOfficeContext);

        var createSaleDto = new CreateSaleDto
        {
            InvoiceType = InvoiceType.Touch,
            PaymentMethod = PaymentMethod.Cash,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = Guid.NewGuid(), // Non-existent product
                    Quantity = 1,
                    UnitPrice = 100.00m,
                    DiscountType = DiscountType.None,
                    DiscountValue = 0
                }
            }
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => salesService.CreateSaleAsync(createSaleDto, cashier.Id, branch.LoginName)
        );
    }

    [Fact]
    public async Task CreateSale_InvalidPercentageDiscount_ThrowsException()
    {
        // Arrange
        var (headOfficeContext, branchContext, branch, cashier, products) = await SetupTestData();

        var mockDbContextFactory = new Mock<DbContextFactory>();
        mockDbContextFactory
            .Setup(f => f.CreateBranchContext(It.IsAny<Branch>()))
            .Returns(branchContext);

        var salesService = new SalesService(mockDbContextFactory.Object, headOfficeContext);

        var createSaleDto = new CreateSaleDto
        {
            InvoiceType = InvoiceType.Touch,
            PaymentMethod = PaymentMethod.Cash,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = products[0].Id,
                    Quantity = 1,
                    UnitPrice = 100.00m,
                    DiscountType = DiscountType.Percentage,
                    DiscountValue = 150 // Invalid: > 100%
                }
            }
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => salesService.CreateSaleAsync(createSaleDto, cashier.Id, branch.LoginName)
        );
    }

    [Fact]
    public async Task CreateSale_FixedDiscountGreaterThanPrice_ThrowsException()
    {
        // Arrange
        var (headOfficeContext, branchContext, branch, cashier, products) = await SetupTestData();

        var mockDbContextFactory = new Mock<DbContextFactory>();
        mockDbContextFactory
            .Setup(f => f.CreateBranchContext(It.IsAny<Branch>()))
            .Returns(branchContext);

        var salesService = new SalesService(mockDbContextFactory.Object, headOfficeContext);

        var createSaleDto = new CreateSaleDto
        {
            InvoiceType = InvoiceType.Touch,
            PaymentMethod = PaymentMethod.Cash,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = products[0].Id,
                    Quantity = 1,
                    UnitPrice = 100.00m,
                    DiscountType = DiscountType.FixedAmount,
                    DiscountValue = 150.00m // Invalid: > unit price
                }
            }
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => salesService.CreateSaleAsync(createSaleDto, cashier.Id, branch.LoginName)
        );
    }

    [Fact]
    public async Task VoidSale_ValidSale_RestoresInventoryAndCustomerStats()
    {
        // Arrange
        var (headOfficeContext, branchContext, branch, cashier, products) = await SetupTestData();

        // Add a test customer
        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            NameEn = "Test Customer",
            NameAr = "عميل تجريبي",
            Phone = "1234567890",
            TotalPurchases = 0,
            VisitCount = 0,
            CreatedAt = DateTime.UtcNow
        };
        branchContext.Customers.Add(customer);
        await branchContext.SaveChangesAsync();

        var mockDbContextFactory = new Mock<DbContextFactory>();
        mockDbContextFactory
            .Setup(f => f.CreateBranchContext(It.IsAny<Branch>()))
            .Returns(branchContext);

        var salesService = new SalesService(mockDbContextFactory.Object, headOfficeContext);

        // Create a sale first
        var createSaleDto = new CreateSaleDto
        {
            CustomerId = customer.Id,
            InvoiceType = InvoiceType.Standard,
            PaymentMethod = PaymentMethod.Cash,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = products[0].Id,
                    Quantity = 5,
                    UnitPrice = 100.00m,
                    DiscountType = DiscountType.None,
                    DiscountValue = 0
                }
            }
        };

        var sale = await salesService.CreateSaleAsync(createSaleDto, cashier.Id, branch.LoginName);

        // Record initial values
        var productBeforeVoid = await branchContext.Products.FindAsync(products[0].Id);
        var stockBeforeVoid = productBeforeVoid!.StockLevel;

        var customerBeforeVoid = await branchContext.Customers.FindAsync(customer.Id);
        var totalPurchasesBeforeVoid = customerBeforeVoid!.TotalPurchases;
        var visitCountBeforeVoid = customerBeforeVoid.VisitCount;

        // Act - Void the sale
        var result = await salesService.VoidSaleAsync(sale.Id, "Test void reason", cashier.Id, branch.LoginName);

        // Assert
        result.Should().NotBeNull();
        result.IsVoided.Should().BeTrue();
        result.VoidReason.Should().Be("Test void reason");
        result.VoidedBy.Should().Be(cashier.Id);
        result.VoidedAt.Should().NotBeNull();

        // Verify inventory was restored
        var productAfterVoid = await branchContext.Products.FindAsync(products[0].Id);
        productAfterVoid!.StockLevel.Should().Be(stockBeforeVoid + 5); // Restored

        // Verify customer stats were reverted
        var customerAfterVoid = await branchContext.Customers.FindAsync(customer.Id);
        customerAfterVoid!.TotalPurchases.Should().Be(0); // Back to 0
        customerAfterVoid.VisitCount.Should().Be(0); // Back to 0
    }

    [Fact]
    public async Task GetSalesAsync_WithFilters_ReturnsFilteredResults()
    {
        // Arrange
        var (headOfficeContext, branchContext, branch, cashier, products) = await SetupTestData();

        var mockDbContextFactory = new Mock<DbContextFactory>();
        mockDbContextFactory
            .Setup(f => f.CreateBranchContext(It.IsAny<Branch>()))
            .Returns(branchContext);

        var salesService = new SalesService(mockDbContextFactory.Object, headOfficeContext);

        // Create multiple sales
        for (int i = 0; i < 5; i++)
        {
            var createSaleDto = new CreateSaleDto
            {
                InvoiceType = i % 2 == 0 ? InvoiceType.Touch : InvoiceType.Standard,
                PaymentMethod = i % 2 == 0 ? PaymentMethod.Cash : PaymentMethod.Card,
                LineItems = new List<CreateSaleLineItemDto>
                {
                    new CreateSaleLineItemDto
                    {
                        ProductId = products[0].Id,
                        Quantity = 1,
                        UnitPrice = 100.00m,
                        DiscountType = DiscountType.None,
                        DiscountValue = 0
                    }
                }
            };

            await salesService.CreateSaleAsync(createSaleDto, cashier.Id, branch.LoginName);
        }

        // Act - Filter by payment method
        var (sales, totalCount) = await salesService.GetSalesAsync(
            page: 1,
            pageSize: 10,
            paymentMethod: PaymentMethod.Cash,
            branchName: branch.LoginName
        );

        // Assert
        sales.Should().HaveCount(3); // 3 cash sales
        totalCount.Should().Be(3);
        sales.All(s => s.PaymentMethod == PaymentMethod.Cash).Should().BeTrue();
    }

    [Fact]
    public async Task CreateSale_ConcurrentSalesWithLastCommitWins_HandleInventoryConflict()
    {
        // Arrange
        var (headOfficeContext, branchContext, branch, cashier, products) = await SetupTestData();

        // Set product with only 1 item in stock
        var product = products[0];
        product.StockLevel = 1;
        branchContext.Products.Update(product);
        await branchContext.SaveChangesAsync();

        var mockDbContextFactory = new Mock<DbContextFactory>();
        mockDbContextFactory
            .Setup(f => f.CreateBranchContext(It.IsAny<Branch>()))
            .Returns(branchContext);

        var salesService = new SalesService(mockDbContextFactory.Object, headOfficeContext);

        // Create two sales that will compete for the last item (simulating concurrent cashiers)
        var createSaleDto1 = new CreateSaleDto
        {
            InvoiceType = InvoiceType.Touch,
            PaymentMethod = PaymentMethod.Cash,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = product.Id,
                    Quantity = 1,
                    UnitPrice = 100.00m,
                    DiscountType = DiscountType.None,
                    DiscountValue = 0
                }
            }
        };

        var createSaleDto2 = new CreateSaleDto
        {
            InvoiceType = InvoiceType.Touch,
            PaymentMethod = PaymentMethod.Cash,
            LineItems = new List<CreateSaleLineItemDto>
            {
                new CreateSaleLineItemDto
                {
                    ProductId = product.Id,
                    Quantity = 1,
                    UnitPrice = 100.00m,
                    DiscountType = DiscountType.None,
                    DiscountValue = 0
                }
            }
        };

        // Act - Create both sales (simulating concurrent transactions)
        var sale1 = await salesService.CreateSaleAsync(createSaleDto1, cashier.Id, branch.LoginName);
        var sale2 = await salesService.CreateSaleAsync(createSaleDto2, cashier.Id, branch.LoginName);

        // Assert
        // Both sales should succeed (last-commit-wins strategy)
        sale1.Should().NotBeNull();
        sale2.Should().NotBeNull();

        // Verify the product inventory went negative
        var updatedProduct = await branchContext.Products.FindAsync(product.Id);
        updatedProduct.Should().NotBeNull();
        updatedProduct!.StockLevel.Should().Be(-1); // 1 - 1 - 1 = -1

        // Verify the inventory discrepancy flag was set
        updatedProduct.HasInventoryDiscrepancy.Should().BeTrue();
    }

    [Fact]
    public async Task CreateSale_MultipleConcurrentSales_AccuratelyTracksNegativeInventory()
    {
        // Arrange
        var (headOfficeContext, branchContext, branch, cashier, products) = await SetupTestData();

        // Set product with 5 items in stock
        var product = products[0];
        product.StockLevel = 5;
        product.HasInventoryDiscrepancy = false;
        branchContext.Products.Update(product);
        await branchContext.SaveChangesAsync();

        var mockDbContextFactory = new Mock<DbContextFactory>();
        mockDbContextFactory
            .Setup(f => f.CreateBranchContext(It.IsAny<Branch>()))
            .Returns(branchContext);

        var salesService = new SalesService(mockDbContextFactory.Object, headOfficeContext);

        // Act - Create 10 concurrent sales of 1 item each
        var tasks = new List<Task<SaleDto>>();
        for (int i = 0; i < 10; i++)
        {
            var createSaleDto = new CreateSaleDto
            {
                InvoiceType = InvoiceType.Touch,
                PaymentMethod = PaymentMethod.Cash,
                LineItems = new List<CreateSaleLineItemDto>
                {
                    new CreateSaleLineItemDto
                    {
                        ProductId = product.Id,
                        Quantity = 1,
                        UnitPrice = 100.00m,
                        DiscountType = DiscountType.None,
                        DiscountValue = 0
                    }
                }
            };

            // Execute sales sequentially to simulate realistic timing
            tasks.Add(salesService.CreateSaleAsync(createSaleDto, cashier.Id, branch.LoginName));
        }

        var results = await Task.WhenAll(tasks);

        // Assert
        // All 10 sales should succeed
        results.Should().HaveCount(10);
        results.All(r => r != null).Should().BeTrue();

        // Verify the product inventory
        var updatedProduct = await branchContext.Products.FindAsync(product.Id);
        updatedProduct.Should().NotBeNull();
        updatedProduct!.StockLevel.Should().Be(-5); // 5 - 10 = -5

        // Verify the inventory discrepancy flag is set
        updatedProduct.HasInventoryDiscrepancy.Should().BeTrue();

        // Verify all sales are recorded in the database
        var allSales = await branchContext.Sales.CountAsync();
        allSales.Should().Be(10);
    }
}
