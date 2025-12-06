using System.Diagnostics;
using Backend.Data.HeadOffice;
using Backend.Data.Shared;
using Backend.Models.DTOs.Shared.Migrations;
using Backend.Models.Entities.HeadOffice;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Shared.Migrations;

public class BranchMigrationManager : IBranchMigrationManager
{
    private readonly HeadOfficeDbContext _headOfficeContext;
    private readonly DbContextFactory _dbContextFactory;
    private readonly MigrationStrategyFactory _strategyFactory;
    private readonly ILogger<BranchMigrationManager> _logger;
    private static readonly SemaphoreSlim _globalLock = new(1, 1);
    private const int MaxRetryAttempts = 3;
    private const int LockTimeoutMinutes = 10;

    public BranchMigrationManager(
        HeadOfficeDbContext headOfficeContext,
        DbContextFactory dbContextFactory,
        MigrationStrategyFactory strategyFactory,
        ILogger<BranchMigrationManager> logger
    )
    {
        _headOfficeContext = headOfficeContext;
        _dbContextFactory = dbContextFactory;
        _strategyFactory = strategyFactory;
        _logger = logger;
    }

    public async Task<MigrationResult> ApplyMigrationsAsync(
        Guid branchId,
        string? targetMigration = null,
        CancellationToken cancellationToken = default
    )
    {
        var stopwatch = Stopwatch.StartNew();
        var result = new MigrationResult();

        try
        {
            // 1. Load branch
            var branch = await _headOfficeContext.Branches
                .FirstOrDefaultAsync(b => b.Id == branchId, cancellationToken);

            if (branch == null)
            {
                result.ErrorMessage = "Branch not found";
                return result;
            }

            _logger.LogInformation("Starting migration process for branch {BranchCode} ({BranchId})", branch.Code, branchId);

            // 2. Acquire distributed lock
            if (!await AcquireMigrationLockAsync(branchId, cancellationToken))
            {
                result.ErrorMessage = "Migration already in progress for this branch";
                _logger.LogWarning("Cannot acquire lock for branch {BranchCode}", branch.Code);
                return result;
            }

            try
            {
                // 3. Get migration strategy for provider
                var strategy = _strategyFactory.GetStrategy(branch.DatabaseProvider);
                _logger.LogInformation("Using {StrategyType} for branch {BranchCode}", strategy.GetType().Name, branch.Code);

                // 4. Create branch context
                using var branchContext = _dbContextFactory.CreateBranchContext(branch);
                var connectionString = branchContext.Database.GetConnectionString();

                if (string.IsNullOrEmpty(connectionString))
                {
                    result.ErrorMessage = "Connection string is null or empty";
                    return result;
                }

                // 5. Validate connection
                if (!await strategy.CanConnectAsync(connectionString))
                {
                    result.ErrorMessage = "Cannot connect to branch database";
                    _logger.LogError("Cannot connect to database for branch {BranchCode}", branch.Code);
                    return result;
                }

                // 6. Ensure database exists
                if (!await strategy.DatabaseExistsAsync(branchContext))
                {
                    _logger.LogInformation("Database does not exist for branch {BranchCode}, creating...", branch.Code);
                    await branchContext.Database.EnsureCreatedAsync(cancellationToken);
                }

                // 7. Get pending migrations
                var pendingMigrations = await strategy.GetPendingMigrationsAsync(branchContext);

                if (!pendingMigrations.Any())
                {
                    _logger.LogInformation("No pending migrations for branch {BranchCode}", branch.Code);
                    result.Success = true;
                    result.ErrorMessage = "No pending migrations";
                    return result;
                }

                _logger.LogInformation(
                    "Applying {Count} migrations to branch {BranchCode}: {Migrations}",
                    pendingMigrations.Count,
                    branch.Code,
                    string.Join(", ", pendingMigrations)
                );

                // 8. Update state to InProgress
                await UpdateMigrationStateAsync(
                    branchId,
                    MigrationStatus.InProgress,
                    null,
                    cancellationToken
                );

                // 9. Apply migrations
                await strategy.ApplyMigrationsAsync(branchContext, cancellationToken);

                // 10. Validate schema integrity
                if (!await strategy.ValidateSchemaIntegrityAsync(branchContext))
                {
                    throw new InvalidOperationException("Schema integrity validation failed after applying migrations");
                }

                // 11. Get applied migrations
                var appliedMigrations = await strategy.GetAppliedMigrationsAsync(branchContext);
                var lastMigration = appliedMigrations.LastOrDefault() ?? string.Empty;

                // 12. Update state to Completed
                await UpdateMigrationStateAsync(
                    branchId,
                    MigrationStatus.Completed,
                    lastMigration,
                    cancellationToken
                );

                result.Success = true;
                result.AppliedMigrations = pendingMigrations;
                result.BranchesProcessed = 1;
                result.BranchesSucceeded = 1;

                _logger.LogInformation(
                    "Successfully applied {Count} migrations to branch {BranchCode}",
                    pendingMigrations.Count,
                    branch.Code
                );
            }
            finally
            {
                // 13. Release lock
                await ReleaseMigrationLockAsync(branchId, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error applying migrations to branch {BranchId}", branchId);

            // Increment retry count
            var state = await GetOrCreateMigrationStateAsync(branchId, cancellationToken);
            var newRetryCount = state.RetryCount + 1;

            var status = newRetryCount >= MaxRetryAttempts
                ? MigrationStatus.RequiresManualIntervention
                : MigrationStatus.Failed;

            await UpdateMigrationStateAsync(
                branchId,
                status,
                null,
                cancellationToken,
                ex.Message,
                newRetryCount
            );

            result.ErrorMessage = ex.Message;
            result.BranchesProcessed = 1;
            result.BranchesFailed = 1;
        }
        finally
        {
            stopwatch.Stop();
            result.Duration = stopwatch.Elapsed;
        }

        return result;
    }

    public async Task<MigrationResult> ApplyMigrationsToAllBranchesAsync(
        CancellationToken cancellationToken = default
    )
    {
        var stopwatch = Stopwatch.StartNew();
        var result = new MigrationResult { Success = true };

        _logger.LogInformation("Starting migration process for all active branches");

        var branches = await _headOfficeContext.Branches
            .Where(b => b.IsActive)
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Found {Count} active branches to process", branches.Count);

        foreach (var branch in branches)
        {
            var branchResult = await ApplyMigrationsAsync(branch.Id, null, cancellationToken);

            result.BranchesProcessed++;

            if (branchResult.Success)
            {
                result.BranchesSucceeded++;
                result.AppliedMigrations.AddRange(
                    branchResult.AppliedMigrations.Select(m => $"[{branch.Code}] {m}")
                );
            }
            else
            {
                result.BranchesFailed++;
                result.Success = false;

                if (string.IsNullOrEmpty(result.ErrorMessage))
                {
                    result.ErrorMessage = $"Failed branches: {branch.Code}";
                }
                else
                {
                    result.ErrorMessage += $", {branch.Code}";
                }
            }
        }

        stopwatch.Stop();
        result.Duration = stopwatch.Elapsed;

        _logger.LogInformation(
            "Completed migration process for all branches: {Succeeded}/{Total} succeeded in {Duration}",
            result.BranchesSucceeded,
            result.BranchesProcessed,
            result.Duration
        );

        return result;
    }

    public async Task<List<string>> GetPendingMigrationsAsync(Guid branchId)
    {
        var branch = await _headOfficeContext.Branches
            .FirstOrDefaultAsync(b => b.Id == branchId);

        if (branch == null)
        {
            throw new InvalidOperationException($"Branch {branchId} not found");
        }

        var strategy = _strategyFactory.GetStrategy(branch.DatabaseProvider);

        using var branchContext = _dbContextFactory.CreateBranchContext(branch);

        return await strategy.GetPendingMigrationsAsync(branchContext);
    }

    public async Task<MigrationHistory> GetMigrationHistoryAsync(Guid branchId)
    {
        var branch = await _headOfficeContext.Branches
            .FirstOrDefaultAsync(b => b.Id == branchId);

        if (branch == null)
        {
            throw new InvalidOperationException($"Branch {branchId} not found");
        }

        var state = await GetOrCreateMigrationStateAsync(branchId, CancellationToken.None);
        var strategy = _strategyFactory.GetStrategy(branch.DatabaseProvider);

        using var branchContext = _dbContextFactory.CreateBranchContext(branch);

        var appliedMigrations = await strategy.GetAppliedMigrationsAsync(branchContext);
        var pendingMigrations = await strategy.GetPendingMigrationsAsync(branchContext);

        return new MigrationHistory
        {
            BranchId = branchId,
            BranchCode = branch.Code,
            AppliedMigrations = appliedMigrations,
            PendingMigrations = pendingMigrations,
            LastMigrationDate = state.LastAttemptAt,
            Status = state.Status.ToString(),
            RetryCount = state.RetryCount,
            ErrorDetails = state.ErrorDetails
        };
    }

    public async Task<bool> ValidateBranchDatabaseAsync(Guid branchId)
    {
        try
        {
            var branch = await _headOfficeContext.Branches
                .FirstOrDefaultAsync(b => b.Id == branchId);

            if (branch == null)
            {
                return false;
            }

            var strategy = _strategyFactory.GetStrategy(branch.DatabaseProvider);

            using var branchContext = _dbContextFactory.CreateBranchContext(branch);

            return await strategy.ValidateSchemaIntegrityAsync(branchContext);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating branch database {BranchId}", branchId);
            return false;
        }
    }

    private async Task<BranchMigrationState> GetOrCreateMigrationStateAsync(
        Guid branchId,
        CancellationToken cancellationToken
    )
    {
        var state = await _headOfficeContext.BranchMigrationStates
            .FirstOrDefaultAsync(s => s.BranchId == branchId, cancellationToken);

        if (state == null)
        {
            state = new BranchMigrationState
            {
                Id = Guid.NewGuid(),
                BranchId = branchId,
                Status = MigrationStatus.Pending,
                LastAttemptAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _headOfficeContext.BranchMigrationStates.Add(state);
            await _headOfficeContext.SaveChangesAsync(cancellationToken);
        }

        return state;
    }

    private async Task<bool> AcquireMigrationLockAsync(Guid branchId, CancellationToken cancellationToken)
    {
        await _globalLock.WaitAsync(cancellationToken);
        try
        {
            var state = await GetOrCreateMigrationStateAsync(branchId, cancellationToken);

            // Check if lock is expired
            if (state.LockExpiresAt.HasValue && state.LockExpiresAt.Value < DateTime.UtcNow)
            {
                _logger.LogWarning("Lock expired for branch {BranchId}, clearing lock", branchId);
                state.LockOwnerId = null;
                state.LockExpiresAt = null;
            }

            // Check if already locked
            if (!string.IsNullOrEmpty(state.LockOwnerId))
            {
                _logger.LogWarning("Branch {BranchId} is already locked by {LockOwnerId}", branchId, state.LockOwnerId);
                return false;
            }

            // Acquire lock
            state.LockOwnerId = Guid.NewGuid().ToString();
            state.LockExpiresAt = DateTime.UtcNow.AddMinutes(LockTimeoutMinutes);
            state.UpdatedAt = DateTime.UtcNow;

            await _headOfficeContext.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Acquired lock for branch {BranchId} with owner {LockOwnerId}", branchId, state.LockOwnerId);
            return true;
        }
        finally
        {
            _globalLock.Release();
        }
    }

    private async Task ReleaseMigrationLockAsync(Guid branchId, CancellationToken cancellationToken)
    {
        await _globalLock.WaitAsync(cancellationToken);
        try
        {
            var state = await _headOfficeContext.BranchMigrationStates
                .FirstOrDefaultAsync(s => s.BranchId == branchId, cancellationToken);

            if (state != null)
            {
                _logger.LogInformation("Releasing lock for branch {BranchId}", branchId);
                state.LockOwnerId = null;
                state.LockExpiresAt = null;
                state.UpdatedAt = DateTime.UtcNow;

                await _headOfficeContext.SaveChangesAsync(cancellationToken);
            }
        }
        finally
        {
            _globalLock.Release();
        }
    }

    private async Task UpdateMigrationStateAsync(
        Guid branchId,
        MigrationStatus status,
        string? lastMigration,
        CancellationToken cancellationToken,
        string? errorDetails = null,
        int? retryCount = null
    )
    {
        var state = await GetOrCreateMigrationStateAsync(branchId, cancellationToken);

        state.Status = status;
        state.LastAttemptAt = DateTime.UtcNow;
        state.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(lastMigration))
        {
            state.LastMigrationApplied = lastMigration;
        }

        if (errorDetails != null)
        {
            state.ErrorDetails = errorDetails;
        }

        if (retryCount.HasValue)
        {
            state.RetryCount = retryCount.Value;
        }
        else if (status == MigrationStatus.Completed)
        {
            // Reset retry count on success
            state.RetryCount = 0;
            state.ErrorDetails = null;
        }

        await _headOfficeContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Updated migration state for branch {BranchId}: Status={Status}, RetryCount={RetryCount}",
            branchId,
            status,
            state.RetryCount
        );
    }
}
