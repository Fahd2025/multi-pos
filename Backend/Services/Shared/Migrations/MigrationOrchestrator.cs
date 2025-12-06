namespace Backend.Services.Shared.Migrations;

/// <summary>
/// Background service that periodically checks for pending migrations across all branches
/// </summary>
public class MigrationOrchestrator : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MigrationOrchestrator> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5);
    private readonly TimeSpan _initialDelay = TimeSpan.FromSeconds(30);

    public MigrationOrchestrator(
        IServiceProvider serviceProvider,
        ILogger<MigrationOrchestrator> logger
    )
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Migration Orchestrator started");

        // Initial delay to ensure app is fully started
        await Task.Delay(_initialDelay, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogInformation("Migration Orchestrator: Starting periodic migration check");

                using var scope = _serviceProvider.CreateScope();
                var migrationManager = scope.ServiceProvider.GetRequiredService<IBranchMigrationManager>();

                var result = await migrationManager.ApplyMigrationsToAllBranchesAsync(stoppingToken);

                if (result.Success)
                {
                    _logger.LogInformation(
                        "Migration Orchestrator: Check completed successfully. Processed {Total} branches, {Succeeded} succeeded",
                        result.BranchesProcessed,
                        result.BranchesSucceeded
                    );
                }
                else
                {
                    _logger.LogWarning(
                        "Migration Orchestrator: Check completed with errors. {Failed}/{Total} branches failed: {Error}",
                        result.BranchesFailed,
                        result.BranchesProcessed,
                        result.ErrorMessage
                    );
                }

                // Log applied migrations
                if (result.AppliedMigrations.Any())
                {
                    _logger.LogInformation(
                        "Migration Orchestrator: Applied {Count} migrations: {Migrations}",
                        result.AppliedMigrations.Count,
                        string.Join(", ", result.AppliedMigrations)
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Migration Orchestrator: Error during periodic migration check");
            }

            // Wait for next check interval
            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("Migration Orchestrator stopped");
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Migration Orchestrator is stopping");
        await base.StopAsync(cancellationToken);
    }
}
