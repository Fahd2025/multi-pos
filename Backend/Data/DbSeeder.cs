using Backend.Models.Entities.HeadOffice;
using Backend.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(HeadOfficeDbContext context)
    {
        // Ensure database is created
        await context.Database.MigrateAsync();

        // Seed default admin user
        if (!await context.Users.AnyAsync())
        {
            var adminUser = new User
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
    }
}
