using Backend.Data.Branch;
using Backend.Data.HeadOffice;
using Backend.Data.Shared;
using Backend.Models.Entities.Branch;
using Backend.Models.Entities.HeadOffice;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Services.Background;

public class BranchUserSyncService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BranchUserSyncService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromHours(1); // Run every hour

    public BranchUserSyncService(
        IServiceProvider serviceProvider,
        ILogger<BranchUserSyncService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Branch User Sync Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncUsersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while syncing branch users.");
            }

            // Wait for next cycle
            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task SyncUsersAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var headOfficeContext = scope.ServiceProvider.GetRequiredService<HeadOfficeDbContext>();
        var dbContextFactory = scope.ServiceProvider.GetRequiredService<DbContextFactory>();

        // 1. Get all active branches
        var branches = await headOfficeContext.Branches
            .Where(b => b.IsActive)
            .ToListAsync(stoppingToken);

        foreach (var branch in branches)
        {
            if (stoppingToken.IsCancellationRequested) break;

            try
            {
                await SyncBranchUsersAsync(branch, headOfficeContext, dbContextFactory, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to sync users for branch {BranchCode}", branch.Code);
            }
        }
    }

    private async Task SyncBranchUsersAsync(
        Backend.Models.Entities.HeadOffice.Branch branch,
        HeadOfficeDbContext headOfficeContext,
        DbContextFactory dbContextFactory,
        CancellationToken stoppingToken)
    {
        // Get expected users from Head Office
        var expectedUsers = await headOfficeContext.BranchUsers
            .Where(u => u.BranchId == branch.Id)
            .ToListAsync(stoppingToken);

        if (!expectedUsers.Any()) return;

        // Get actual users from Branch DB
        using var branchContext = dbContextFactory.CreateBranchContext(branch);
        var actualUsers = await branchContext.Users.ToListAsync(stoppingToken);

        var actualUserIds = actualUsers.Select(u => u.Id).ToHashSet();

        // Find missing users and insert them
        var missingUsers = expectedUsers.Where(u => !actualUserIds.Contains(u.Id)).ToList();

        if (missingUsers.Any())
        {
            _logger.LogInformation("Found {Count} missing users for branch {BranchCode}. Syncing...", missingUsers.Count, branch.Code);

            foreach (var user in missingUsers)
            {
                var newUser = new Backend.Models.Entities.Branch.User
                {
                    Id = user.Id,
                    Username = user.Username,
                    PasswordHash = user.PasswordHash,
                    Email = user.Email,
                    FullNameEn = user.FullNameEn,
                    FullNameAr = user.FullNameAr,
                    Phone = user.Phone,
                    PreferredLanguage = user.PreferredLanguage,
                    Role = user.Role,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt,
                    LastLoginAt = user.LastLoginAt,
                    LastActivityAt = user.LastActivityAt,
                    CreatedBy = user.CreatedBy
                };

                branchContext.Users.Add(newUser);
            }

            await branchContext.SaveChangesAsync(stoppingToken);
            _logger.LogInformation("Successfully synced missing users for branch {BranchCode}", branch.Code);
        }

        // Check for updates (one-way sync HO -> Branch)
        var actualUsersDict = actualUsers.ToDictionary(u => u.Id);
        bool updatesMade = false;

        foreach (var expectedUser in expectedUsers)
        {
            if (actualUsersDict.TryGetValue(expectedUser.Id, out var actualUser))
            {
                // Compare synced fields
                bool changed = false;

                if (actualUser.Email != expectedUser.Email) { actualUser.Email = expectedUser.Email; changed = true; }
                if (actualUser.FullNameEn != expectedUser.FullNameEn) { actualUser.FullNameEn = expectedUser.FullNameEn; changed = true; }
                if (actualUser.FullNameAr != expectedUser.FullNameAr) { actualUser.FullNameAr = expectedUser.FullNameAr; changed = true; }
                if (actualUser.Phone != expectedUser.Phone) { actualUser.Phone = expectedUser.Phone; changed = true; }
                if (actualUser.PreferredLanguage != expectedUser.PreferredLanguage) { actualUser.PreferredLanguage = expectedUser.PreferredLanguage; changed = true; }
                if (actualUser.Role != expectedUser.Role) { actualUser.Role = expectedUser.Role; changed = true; }
                if (actualUser.IsActive != expectedUser.IsActive) { actualUser.IsActive = expectedUser.IsActive; changed = true; }
                if (actualUser.PasswordHash != expectedUser.PasswordHash) { actualUser.PasswordHash = expectedUser.PasswordHash; changed = true; }

                if (changed)
                {
                    actualUser.UpdatedAt = DateTime.UtcNow;
                    updatesMade = true;
                }
            }
        }

        if (updatesMade)
        {
            await branchContext.SaveChangesAsync(stoppingToken);
            _logger.LogInformation("Updated users for branch {BranchCode}", branch.Code);
        }
    }
}
