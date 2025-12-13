using Backend.Data.Branch;
using Backend.Data.Shared;
using Backend.Models.Entities.HeadOffice;
using BranchEntity = Backend.Models.Entities.HeadOffice.Branch;
using HeadOfficeUser = Backend.Models.Entities.HeadOffice.User;
using Backend.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data.HeadOffice;

public static class HeadOfficeDbSeeder
{
    public static async Task SeedAsync(HeadOfficeDbContext context)
    {
        // Ensure database is created
        await context.Database.MigrateAsync();

        // Seed default admin user
        if (!await context.Users.AnyAsync())
        {
            var adminUser = new HeadOfficeUser
            {
                Id = Guid.NewGuid(),
                Username = "admin",
                Email = "admin@multipos.com",
                PasswordHash = PasswordHasher.HashPassword("123"),
                FullNameEn = "System Administrator",
                FullNameAr = "مدير النظام",
                PreferredLanguage = "en",
                IsActive = true,
                IsHeadOfficeAdmin = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            context.Users.Add(adminUser);
            await context.SaveChangesAsync();

            Console.WriteLine("✓ Default admin user created (username: admin, password: 123)");
        }

        // Seed default branches
        if (!await context.Branches.AnyAsync())
        {
            var branch1 = new BranchEntity
            {
                Id = Guid.NewGuid(),
                Code = "B001",
                NameEn = "Main Branch",
                NameAr = "الفرع الرئيسي",
                AddressEn = "123 Main Street",
                AddressAr = "123 الشارع الرئيسي",
                Phone = "+1234567890",
                Language = "en",
                Currency = "USD",
                DatabaseProvider = DatabaseProvider.SQLite,
                DbServer = ".",
                DbName = "branch_b001",
                DbPort = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            var branch2 = new BranchEntity
            {
                Id = Guid.NewGuid(),
                Code = "B002",
                NameEn = "Downtown Branch",
                NameAr = "فرع وسط المدينة",
                AddressEn = "456 Downtown Ave",
                AddressAr = "456 شارع وسط المدينة",
                Phone = "+1234567891",
                Language = "en",
                Currency = "USD",
                DatabaseProvider = DatabaseProvider.SQLite,
                DbServer = ".",
                DbName = "branch_b002",
                DbPort = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            var branch3 = new BranchEntity
            {
                Id = Guid.NewGuid(),
                Code = "B003",
                NameEn = "Mall Branch",
                NameAr = "فرع المول",
                AddressEn = "789 Mall Complex",
                AddressAr = "789 مجمع المول",
                Phone = "+1234567892",
                Language = "en",
                Currency = "USD",
                DatabaseProvider = DatabaseProvider.SQLite,
                DbServer = ".",
                DbName = "branch_b003",
                DbPort = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            context.Branches.AddRange(branch1, branch2, branch3);
            await context.SaveChangesAsync();

            Console.WriteLine("✓ Default branches created (B001, B002, B003)");
        }

        // Seed technical password setting
        if (!await context.MainSettings.AnyAsync(s => s.Key == "TechnicalPassword"))
        {
            var technicalPasswordSetting = new MainSetting
            {
                Id = Guid.NewGuid(),
                Key = "TechnicalPassword",
                Value = PasswordHasher.HashPassword("admin@tech2024"),
                IsEncrypted = false,
                Description = "Technical override password for branch='all' access",
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = Guid.Empty,
            };

            context.MainSettings.Add(technicalPasswordSetting);
            await context.SaveChangesAsync();

            Console.WriteLine("✓ Technical password set (technical password: admin@tech2024)");
        }

        // Seed session timeout setting
        if (!await context.MainSettings.AnyAsync(s => s.Key == "SessionTimeoutMinutes"))
        {
            var sessionTimeoutSetting = new MainSetting
            {
                Id = Guid.NewGuid(),
                Key = "SessionTimeoutMinutes",
                Value = "30",
                IsEncrypted = false,
                Description = "Session inactivity timeout in minutes",
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = Guid.Empty,
            };

            context.MainSettings.Add(sessionTimeoutSetting);
            await context.SaveChangesAsync();

            Console.WriteLine("✓ Session timeout configured (30 minutes)");
        }

        // Seed max failed login attempts setting
        if (!await context.MainSettings.AnyAsync(s => s.Key == "MaxFailedLoginAttempts"))
        {
            var maxFailedLoginSetting = new MainSetting
            {
                Id = Guid.NewGuid(),
                Key = "MaxFailedLoginAttempts",
                Value = "5",
                IsEncrypted = false,
                Description = "Maximum failed login attempts before account lockout",
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = Guid.Empty,
            };

            context.MainSettings.Add(maxFailedLoginSetting);
            await context.SaveChangesAsync();

            Console.WriteLine("✓ Max failed login attempts configured (5 attempts)");
        }

        Console.WriteLine("\nℹ Branch databases will be created and seeded by the migration system in Program.cs\n");
    }
}
