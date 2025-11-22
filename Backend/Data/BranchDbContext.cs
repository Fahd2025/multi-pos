using Backend.Models.Entities.Branch;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class BranchDbContext : DbContext
{
    public BranchDbContext(DbContextOptions<BranchDbContext> options)
        : base(options) { }

    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<Sale> Sales { get; set; }
    public DbSet<SaleLineItem> SaleLineItems { get; set; }
    public DbSet<Purchase> Purchases { get; set; }
    public DbSet<PurchaseLineItem> PurchaseLineItems { get; set; }
    public DbSet<Expense> Expenses { get; set; }
    public DbSet<ExpenseCategory> ExpenseCategories { get; set; }
    public DbSet<Setting> Settings { get; set; }
    public DbSet<SyncQueue> SyncQueue { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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

            entity.Property(e => e.Subtotal).HasPrecision(18, 2);
            entity.Property(e => e.TaxAmount).HasPrecision(18, 2);
            entity.Property(e => e.TotalDiscount).HasPrecision(18, 2);
            entity.Property(e => e.Total).HasPrecision(18, 2);

            entity
                .HasOne(e => e.Customer)
                .WithMany(c => c.Sales)
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // SaleLineItem configuration
        modelBuilder.Entity<SaleLineItem>(entity =>
        {
            entity.HasIndex(e => e.SaleId);
            entity.HasIndex(e => e.ProductId);

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
    }
}
