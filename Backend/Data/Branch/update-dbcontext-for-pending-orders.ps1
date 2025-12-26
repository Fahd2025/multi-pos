# PowerShell script to update BranchDbContext for Pending Orders
# Run this from the Backend/Data/Branch directory

$dbContextPath = "BranchDbContext.cs"

Write-Host "Updating BranchDbContext for Pending Orders..." -ForegroundColor Cyan

# Read the current content
$content = Get-Content $dbContextPath -Raw

# Check if already updated
if ($content -match "DbSet<PendingOrder>") {
    Write-Host "DbContext already updated! Skipping..." -ForegroundColor Yellow
    exit 0
}

# Add DbSets after Tables DbSet
$dbSetsToAdd = @"
    public DbSet<PendingOrder> PendingOrders { get; set; }
    public DbSet<PendingOrderItem> PendingOrderItems { get; set; }
"@

$content = $content -replace "(public DbSet<Table> Tables \{ get; set; \})", "`$1`n$dbSetsToAdd"

# Add configuration before the last closing brace of OnModelCreating
$configToAdd = @"

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
"@

# Find the last closing brace of OnModelCreating and add configuration before it
$content = $content -replace "(\s+)\}\s*\}\s*$", "$configToAdd`n`$1    }`n}"

# Write back to file
Set-Content $dbContextPath -Value $content -NoNewline

Write-Host "✅ DbContext updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd ../../  (go to Backend root)" -ForegroundColor Yellow
Write-Host "2. dotnet ef migrations add AddPendingOrders --context BranchDbContext" -ForegroundColor Yellow
Write-Host "3. dotnet ef database update --context BranchDbContext" -ForegroundColor Yellow
