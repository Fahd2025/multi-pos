using Backend.Models.Entities.Branch;
using User = Backend.Models.Entities.Branch.User; // Alias to avoid confusion with HeadOffice.User
using Microsoft.EntityFrameworkCore;

namespace Backend.Data.Branch;

public class BranchDbContext : DbContext
{
    public BranchDbContext(DbContextOptions<BranchDbContext> options)
        : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<Sale> Sales { get; set; }
    public DbSet<SaleLineItem> SaleLineItems { get; set; }
    public DbSet<SalePayment> SalePayments { get; set; }
    public DbSet<Purchase> Purchases { get; set; }
    public DbSet<PurchaseLineItem> PurchaseLineItems { get; set; }
    public DbSet<Expense> Expenses { get; set; }
    public DbSet<ExpenseCategory> ExpenseCategories { get; set; }
    public DbSet<Setting> Settings { get; set; }
    public DbSet<SyncQueue> SyncQueue { get; set; }
    public DbSet<InvoiceTemplate> InvoiceTemplates { get; set; }
    public DbSet<Driver> Drivers { get; set; }
    public DbSet<Unit> Units { get; set; }
    public DbSet<DeliveryOrder> DeliveryOrders { get; set; }
    public DbSet<Zone> Zones { get; set; }
    public DbSet<Table> Tables { get; set; }
    public DbSet<PendingOrder> PendingOrders { get; set; }
    public DbSet<PendingOrderItem> PendingOrderItems { get; set; }
    public DbSet<CashDrawer> CashDrawers { get; set; }
    public DbSet<CashTransaction> CashTransactions { get; set; }
    public DbSet<ReturnPolicy> ReturnPolicies { get; set; }
    public DbSet<Return> Returns { get; set; }
    public DbSet<ReturnLineItem> ReturnLineItems { get; set; }
    public DbSet<PrinterConfiguration> PrinterConfigurations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration (Branch-specific users)
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users"); // Table name
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.Role);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.LastLoginAt);
        });

        // Category configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.ParentCategoryId);
            entity.HasIndex(e => e.IsActive);

            entity
                .HasOne(e => e.ParentCategory)
                .WithMany(c => c.SubCategories)
                .HasForeignKey(e => e.ParentCategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Product configuration
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasIndex(e => e.SKU).IsUnique();
            entity.HasIndex(e => e.CategoryId);
            entity.HasIndex(e => e.SupplierId);
            entity.HasIndex(e => e.UnitId);
            entity.HasIndex(e => e.Barcode);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.StockLevel);

            entity.Property(e => e.SellingPrice).HasPrecision(18, 2);
            entity.Property(e => e.CostPrice).HasPrecision(18, 2);

            entity
                .HasOne(e => e.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(e => e.Supplier)
                .WithMany(s => s.Products)
                .HasForeignKey(e => e.SupplierId)
                .OnDelete(DeleteBehavior.SetNull);

            entity
                .HasOne(e => e.Unit)
                .WithMany(u => u.Products)
                .HasForeignKey(e => e.UnitId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ProductImage configuration
        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasIndex(e => e.ProductId);

            entity
                .HasOne(e => e.Product)
                .WithMany(p => p.Images)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Customer configuration
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.Phone);
            entity.HasIndex(e => e.IsActive);

            entity.Property(e => e.TotalPurchases).HasPrecision(18, 2);

            // Define the relationship to DeliveryOrders
            entity.HasMany(c => c.DeliveryOrders)
                  .WithOne(d => d.Customer)
                  .HasForeignKey(d => d.CustomerId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Supplier configuration
        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.IsActive);
        });

        // Sale configuration
        modelBuilder.Entity<Sale>(entity =>
        {
            entity.HasIndex(e => e.TransactionId).IsUnique();
            entity.HasIndex(e => e.InvoiceNumber).IsUnique();
            entity.HasIndex(e => e.CustomerId);
            entity.HasIndex(e => e.CashierId);
            entity.HasIndex(e => e.SaleDate);
            entity.HasIndex(e => e.IsVoided);
            entity.HasIndex(e => e.OrderType); // Index for OrderType to improve queries for delivery orders
            entity.HasIndex(e => e.TableId); // Index for table queries
            entity.HasIndex(e => e.Status); // Index for status filtering

            // Return Management Indexes
            entity.HasIndex(e => e.IsReturn); // Index for filtering return invoices
            entity.HasIndex(e => e.OriginalSaleId); // Index for finding returns for a specific sale
            entity.HasIndex(e => e.ReturnDate); // Index for return date queries

            entity.Property(e => e.Subtotal).HasPrecision(18, 2);
            entity.Property(e => e.TaxAmount).HasPrecision(18, 2);
            entity.Property(e => e.TotalDiscount).HasPrecision(18, 2);
            entity.Property(e => e.Total).HasPrecision(18, 2);
            entity.Property(e => e.AmountPaid).HasPrecision(18, 2);
            entity.Property(e => e.ChangeReturned).HasPrecision(18, 2);

            entity
                .HasOne(e => e.Customer)
                .WithMany(c => c.Sales)
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);

            // Define the relationship to DeliveryOrder (one-to-one)
            entity.HasOne(s => s.DeliveryOrder)
                  .WithOne(d => d.Sale)
                  .HasForeignKey<DeliveryOrder>(d => d.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Define the relationship to Table
            entity
                .HasOne(e => e.Table)
                .WithMany(t => t.Sales)
                .HasForeignKey(e => e.TableId)
                .OnDelete(DeleteBehavior.SetNull);

            // Self-referencing relationship for returns
            entity
                .HasOne(e => e.OriginalSale)
                .WithMany(s => s.ReturnedSales)
                .HasForeignKey(e => e.OriginalSaleId)
                .OnDelete(DeleteBehavior.NoAction); // Prevent cascade delete
        });

        // SaleLineItem configuration
        modelBuilder.Entity<SaleLineItem>(entity =>
        {
            entity.HasIndex(e => e.SaleId);
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.ItemStatus); // Index for item status filtering

            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.DiscountValue).HasPrecision(18, 2);
            entity.Property(e => e.DiscountedUnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.LineTotal).HasPrecision(18, 2);

            entity
                .HasOne(e => e.Sale)
                .WithMany(s => s.LineItems)
                .HasForeignKey(e => e.SaleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(e => e.Product)
                .WithMany(p => p.SaleLineItems)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // SalePayment configuration (Split Payment Support)
        modelBuilder.Entity<SalePayment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.SaleId);
            entity.HasIndex(e => e.PaymentMethod);
            entity.HasIndex(e => e.ProcessedAt);
            entity.HasIndex(e => e.ProcessedBy);

            entity.Property(e => e.Amount).HasPrecision(18, 2);

            // Relationships
            entity
                .HasOne(e => e.Sale)
                .WithMany(s => s.Payments)
                .HasForeignKey(e => e.SaleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(e => e.ProcessedByUser)
                .WithMany()
                .HasForeignKey(e => e.ProcessedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Purchase configuration
        modelBuilder.Entity<Purchase>(entity =>
        {
            entity.HasIndex(e => e.PurchaseOrderNumber).IsUnique();
            entity.HasIndex(e => e.SupplierId);
            entity.HasIndex(e => e.PurchaseDate);
            entity.HasIndex(e => e.PaymentStatus);

            entity.Property(e => e.TotalCost).HasPrecision(18, 2);
            entity.Property(e => e.AmountPaid).HasPrecision(18, 2);

            entity
                .HasOne(e => e.Supplier)
                .WithMany(s => s.Purchases)
                .HasForeignKey(e => e.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // PurchaseLineItem configuration
        modelBuilder.Entity<PurchaseLineItem>(entity =>
        {
            entity.HasIndex(e => e.PurchaseId);
            entity.HasIndex(e => e.ProductId);

            entity.Property(e => e.UnitCost).HasPrecision(18, 2);
            entity.Property(e => e.LineTotal).HasPrecision(18, 2);

            entity
                .HasOne(e => e.Purchase)
                .WithMany(p => p.LineItems)
                .HasForeignKey(e => e.PurchaseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(e => e.Product)
                .WithMany(p => p.PurchaseLineItems)
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ExpenseCategory configuration
        modelBuilder.Entity<ExpenseCategory>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.IsActive);

            entity.Property(e => e.BudgetAllocation).HasPrecision(18, 2);
        });

        // Expense configuration
        modelBuilder.Entity<Expense>(entity =>
        {
            entity.HasIndex(e => e.ExpenseCategoryId);
            entity.HasIndex(e => e.ExpenseDate);
            entity.HasIndex(e => e.ApprovalStatus);

            entity.Property(e => e.Amount).HasPrecision(18, 2);

            entity
                .HasOne(e => e.Category)
                .WithMany(c => c.Expenses)
                .HasForeignKey(e => e.ExpenseCategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Setting configuration
        modelBuilder.Entity<Setting>(entity =>
        {
            entity.HasIndex(e => e.Key).IsUnique();
        });

        // SyncQueue configuration
        modelBuilder.Entity<SyncQueue>(entity =>
        {
            entity.HasIndex(e => e.SyncId).IsUnique();
            entity.HasIndex(e => e.SyncStatus);
            entity.HasIndex(e => e.Timestamp);
        });

        // InvoiceTemplate configuration
        modelBuilder.Entity<InvoiceTemplate>(entity =>
        {
            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.CreatedAt);
        });

        // Driver configuration
        modelBuilder.Entity<Driver>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.Phone);
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.LicenseNumber);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.IsAvailable);

            entity.Property(e => e.AverageRating).HasPrecision(3, 2);

            // Define the relationship to DeliveryOrders
            entity.HasMany(d => d.DeliveryOrders)
                  .WithOne(d => d.Driver)
                  .HasForeignKey(d => d.DriverId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Unit configuration
        modelBuilder.Entity<Unit>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.BaseUnitId);
            entity.HasIndex(e => e.DisplayOrder);

            entity.Property(e => e.ConversionFactor).HasPrecision(18, 6);

            // Self-referencing relationship for base unit
            entity
                .HasOne(e => e.BaseUnit)
                .WithMany(u => u.DerivedUnits)
                .HasForeignKey(e => e.BaseUnitId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // DeliveryOrder configuration
        modelBuilder.Entity<DeliveryOrder>(entity =>
        {
            entity.HasIndex(e => e.OrderId).IsUnique(false); // Multiple delivery orders could theoretically reference the same sale
            entity.HasIndex(e => e.CustomerId);
            entity.HasIndex(e => e.DriverId);
            entity.HasIndex(e => e.DeliveryStatus);
            entity.HasIndex(e => e.EstimatedDeliveryTime);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.Priority);

            entity
                .HasOne(e => e.Customer)
                .WithMany(c => c.DeliveryOrders) // A customer can have multiple delivery orders
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);

            entity
                .HasOne(e => e.Driver)
                .WithMany(d => d.DeliveryOrders) // A driver can handle multiple delivery orders
                .HasForeignKey(e => e.DriverId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.Property(e => e.EstimatedDeliveryMinutes);
        });

        // Zone configuration
        modelBuilder.Entity<Zone>(entity =>
        {
            entity.HasKey(z => z.Id);
            entity.HasIndex(z => z.DisplayOrder);
            entity.HasIndex(z => z.IsActive);
            entity.Property(z => z.Name).IsRequired().HasMaxLength(50);
        });

        // Table configuration
        modelBuilder.Entity<Table>(entity =>
        {
            entity.HasKey(t => t.Id);

            // Unique table number per branch (since each branch has separate DB)
            entity.HasIndex(t => t.Number).IsUnique();
            entity.HasIndex(t => t.ZoneId);
            entity.HasIndex(t => t.IsActive);

            // Precision for positioning (0.00 to 100.00)
            entity.Property(t => t.PositionX).HasPrecision(5, 2);
            entity.Property(t => t.PositionY).HasPrecision(5, 2);
            entity.Property(t => t.Width).HasPrecision(5, 2);
            entity.Property(t => t.Height).HasPrecision(5, 2);

            // Zone relationship
            entity
                .HasOne(t => t.Zone)
                .WithMany(z => z.Tables)
                .HasForeignKey(t => t.ZoneId)
                .OnDelete(DeleteBehavior.SetNull);

            // Sales relationship (already defined in Sale entity)
        });
        // PendingOrder configuration
        modelBuilder.Entity<PendingOrder>(entity =>
        {
            entity.HasIndex(e => e.OrderNumber).IsUnique();
            entity.HasIndex(e => e.CreatedByUserId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.OrderType);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.ExpiresAt);
            entity.HasIndex(e => e.CustomerName);
            entity.HasIndex(e => e.TableNumber);

            entity.Property(e => e.Subtotal).HasPrecision(18, 2);
            entity.Property(e => e.TaxAmount).HasPrecision(18, 2);
            entity.Property(e => e.DiscountAmount).HasPrecision(18, 2);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
        });

        // PendingOrderItem configuration
        modelBuilder.Entity<PendingOrderItem>(entity =>
        {
            entity.HasIndex(e => e.PendingOrderId);
            entity.HasIndex(e => e.ProductId);

            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.Discount).HasPrecision(18, 2);
            entity.Property(e => e.TotalPrice).HasPrecision(18, 2);

            entity
                .HasOne(e => e.PendingOrder)
                .WithMany(p => p.Items)
                .HasForeignKey(e => e.PendingOrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CashDrawer configuration
        modelBuilder.Entity<CashDrawer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.BranchId);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.OpenedAt);
            entity.HasIndex(e => e.ClosedAt);
            entity.HasIndex(e => e.OpenedBy);

            entity.Property(e => e.OpeningBalance).HasPrecision(18, 2);
            entity.Property(e => e.ExpectedCash).HasPrecision(18, 2);
            entity.Property(e => e.ActualCash).HasPrecision(18, 2);
            entity.Property(e => e.Variance).HasPrecision(18, 2);

            // Relationships
            entity
                .HasOne(e => e.OpenedByUser)
                .WithMany()
                .HasForeignKey(e => e.OpenedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(e => e.ClosedByUser)
                .WithMany()
                .HasForeignKey(e => e.ClosedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasMany(e => e.Transactions)
                .WithOne(t => t.CashDrawer)
                .HasForeignKey(t => t.CashDrawerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CashTransaction configuration
        modelBuilder.Entity<CashTransaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.CashDrawerId);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.CreatedBy);

            entity.Property(e => e.Amount).HasPrecision(18, 2);

            // Relationships
            entity
                .HasOne(e => e.CashDrawer)
                .WithMany(cd => cd.Transactions)
                .HasForeignKey(e => e.CashDrawerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ReturnPolicy configuration
        modelBuilder.Entity<ReturnPolicy>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.BranchId);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.CreatedAt);

            entity.Property(e => e.RestockingFeePercent).HasPrecision(5, 2);
        });

        // Return configuration
        modelBuilder.Entity<Return>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.BranchId);
            entity.HasIndex(e => e.OriginalSaleId);
            entity.HasIndex(e => e.CustomerId);
            entity.HasIndex(e => e.ReturnDate);
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.ProcessedBy);

            entity.Property(e => e.Subtotal).HasPrecision(18, 2);
            entity.Property(e => e.TaxAmount).HasPrecision(18, 2);
            entity.Property(e => e.RestockingFee).HasPrecision(18, 2);
            entity.Property(e => e.Total).HasPrecision(18, 2);

            // Relationships
            entity
                .HasOne(e => e.OriginalSale)
                .WithMany()
                .HasForeignKey(e => e.OriginalSaleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(e => e.Customer)
                .WithMany()
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);

            entity
                .HasOne(e => e.ProcessedByUser)
                .WithMany()
                .HasForeignKey(e => e.ProcessedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(e => e.ApprovedByUser)
                .WithMany()
                .HasForeignKey(e => e.ApprovedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(e => e.ReturnPolicy)
                .WithMany()
                .HasForeignKey(e => e.ReturnPolicyId)
                .OnDelete(DeleteBehavior.SetNull);

            entity
                .HasOne(e => e.ExchangeSale)
                .WithMany()
                .HasForeignKey(e => e.ExchangeSaleId)
                .OnDelete(DeleteBehavior.SetNull);

            entity
                .HasMany(e => e.LineItems)
                .WithOne(li => li.Return)
                .HasForeignKey(li => li.ReturnId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ReturnLineItem configuration
        modelBuilder.Entity<ReturnLineItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ReturnId);
            entity.HasIndex(e => e.SaleLineItemId);
            entity.HasIndex(e => e.ProductId);

            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.DiscountValue).HasPrecision(18, 2);
            entity.Property(e => e.LineTotal).HasPrecision(18, 2);

            // Relationships
            entity
                .HasOne(e => e.Return)
                .WithMany(r => r.LineItems)
                .HasForeignKey(e => e.ReturnId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(e => e.SaleLineItem)
                .WithMany()
                .HasForeignKey(e => e.SaleLineItemId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // PrinterConfiguration configuration
        modelBuilder.Entity<PrinterConfiguration>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.BranchId);
            entity.HasIndex(e => e.ConnectionType);

            // Typically one printer per branch, but could have multiple
            entity.Property(e => e.PrinterName).IsRequired();
            entity.Property(e => e.ConnectionType).IsRequired();
        });
    }
}