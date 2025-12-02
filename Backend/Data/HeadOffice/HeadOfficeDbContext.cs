using Backend.Models.Entities.HeadOffice;
using BranchEntity = Backend.Models.Entities.HeadOffice.Branch;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data.HeadOffice;

public class HeadOfficeDbContext : DbContext
{
    public HeadOfficeDbContext(DbContextOptions<HeadOfficeDbContext> options)
        : base(options) { }

    public DbSet<BranchEntity> Branches { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<BranchUser> BranchUsers { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<MainSetting> MainSettings { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<UserActivityLog> UserActivityLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Branch configuration
        modelBuilder.Entity<BranchEntity>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.IsActive);

            entity.Property(e => e.TaxRate).HasPrecision(5, 2);
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.IsActive);

            entity.Property(e => e.PasswordHash).IsRequired();
        });

        // BranchUser configuration
        modelBuilder.Entity<BranchUser>(entity =>
        {
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.BranchId);
            entity.HasIndex(e => new { e.UserId, e.BranchId }).IsUnique();

            entity
                .HasOne(e => e.User)
                .WithMany(u => u.BranchUsers)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(e => e.Branch)
                .WithMany(b => b.BranchUsers)
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // RefreshToken configuration
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiresAt);

            entity
                .HasOne(e => e.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // MainSetting configuration
        modelBuilder.Entity<MainSetting>(entity =>
        {
            entity.HasIndex(e => e.Key).IsUnique();
        });

        // AuditLog configuration
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasIndex(e => e.Timestamp);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.BranchId);
            entity.HasIndex(e => e.EventType);
            entity.HasIndex(e => new { e.EntityType, e.EntityId });
        });

        // UserActivityLog configuration
        modelBuilder.Entity<UserActivityLog>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.Timestamp });

            entity
                .HasOne(e => e.User)
                .WithMany(u => u.ActivityLogs)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
