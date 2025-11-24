using Backend.Data;
using Backend.Models.Entities.Branch;
using Backend.Models.Entities.HeadOffice;
using Backend.Utilities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.IntegrationTests;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove the existing DbContext configuration
            var headOfficeDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<HeadOfficeDbContext>)
            );

            if (headOfficeDescriptor != null)
            {
                services.Remove(headOfficeDescriptor);
            }

            // Add in-memory database for testing
            services.AddDbContext<HeadOfficeDbContext>(options =>
            {
                options.UseInMemoryDatabase("TestHeadOfficeDb");
            });

            // Build the service provider
            var serviceProvider = services.BuildServiceProvider();

            // Create a scope to obtain a reference to the database context
            using var scope = serviceProvider.CreateScope();
            var scopedServices = scope.ServiceProvider;
            var headOfficeContext = scopedServices.GetRequiredService<HeadOfficeDbContext>();

            // Ensure the database is created
            headOfficeContext.Database.EnsureCreated();

            // Seed test data
            SeedTestData(headOfficeContext).Wait();
        });
    }

    private async Task SeedTestData(HeadOfficeDbContext context)
    {
        // Clear existing data
        context.Branches.RemoveRange(context.Branches);
        context.Users.RemoveRange(context.Users);
        await context.SaveChangesAsync();

        // Create test branch
        var branch = new Branch
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            LoginName = "test-branch",
            NameEn = "Test Branch",
            NameAr = "فرع تجريبي",
            Code = "TB001",
            TaxRate = 15.0m,
            IsActive = true,
            DatabaseProvider = DatabaseProvider.SQLite,
            DbServer = "localhost",
            DbName = "TestDb",
            DbPort = 0,
            CreatedAt = DateTime.UtcNow
        };
        context.Branches.Add(branch);

        // Create test users
        var admin = new User
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Username = "testadmin",
            Email = "admin@test.com",
            FullNameEn = "Test Admin",
            FullNameAr = "مشرف تجريبي",
            PasswordHash = PasswordHasher.HashPassword("password123"),
            IsHeadOfficeAdmin = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(admin);

        var manager = new User
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Username = "testmanager",
            Email = "manager@test.com",
            FullNameEn = "Test Manager",
            FullNameAr = "مدير تجريبي",
            PasswordHash = PasswordHasher.HashPassword("password123"),
            IsHeadOfficeAdmin = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(manager);

        var cashier = new User
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            Username = "testcashier",
            Email = "cashier@test.com",
            FullNameEn = "Test Cashier",
            FullNameAr = "كاشير تجريبي",
            PasswordHash = PasswordHasher.HashPassword("password123"),
            IsHeadOfficeAdmin = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(cashier);

        // Create branch user associations
        context.BranchUsers.Add(new BranchUser
        {
            BranchId = branch.Id,
            UserId = manager.Id,
            Role = UserRole.Manager,
            AssignedAt = DateTime.UtcNow
        });

        context.BranchUsers.Add(new BranchUser
        {
            BranchId = branch.Id,
            UserId = cashier.Id,
            Role = UserRole.Cashier,
            AssignedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();
    }
}
