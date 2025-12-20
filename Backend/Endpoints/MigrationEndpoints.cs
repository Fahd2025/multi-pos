using Backend.Services.Shared.Migrations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Backend.Endpoints;

public static class MigrationEndpoints
{
    public static void MapMigrationEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/migrations")
            .RequireAuthorization()
            .WithTags("Migrations")
            .WithOpenApi();

        // Apply migrations to a specific branch (Admin only)
        group.MapPost("/branches/{branchId:guid}/apply", async (
            Guid branchId,
            IBranchMigrationManager migrationManager,
            string? targetMigration,
            CancellationToken cancellationToken) =>
        {
            var result = await migrationManager.ApplyMigrationsAsync(branchId, targetMigration, cancellationToken);
            return result.Success ? Results.Ok(result) : Results.BadRequest(result);
        })
        .RequireAuthorization(policy => policy.RequireRole("Admin"))
        .WithName("ApplyBranchMigrations")
        .WithSummary("Apply pending migrations to a specific branch")
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(200)
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(400);

        // Apply migrations to all branches (Admin only)
        group.MapPost("/branches/apply-all", async (
            IBranchMigrationManager migrationManager,
            CancellationToken cancellationToken) =>
        {
            var result = await migrationManager.ApplyMigrationsToAllBranchesAsync(cancellationToken);
            return result.Success ? Results.Ok(result) : Results.BadRequest(result);
        })
        .RequireAuthorization(policy => policy.RequireRole("Admin"))
        .WithName("ApplyAllBranchMigrations")
        .WithSummary("Apply pending migrations to all active branches")
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(200)
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(400);

        // Get pending migrations for a branch
        group.MapGet("/branches/{branchId:guid}/pending", async (
            Guid branchId,
            IBranchMigrationManager migrationManager) =>
        {
            var pending = await migrationManager.GetPendingMigrationsAsync(branchId);
            return Results.Ok(new { branchId, pendingMigrations = pending, count = pending.Count });
        })
        .RequireAuthorization(policy => policy.RequireRole("Admin"))
        .WithName("GetPendingMigrations")
        .WithSummary("Get list of pending migrations for a branch")
        .Produces(200);

        // Get migration history for a branch
        group.MapGet("/branches/{branchId:guid}/history", async (
            Guid branchId,
            IBranchMigrationManager migrationManager) =>
        {
            var history = await migrationManager.GetMigrationHistoryAsync(branchId);
            return Results.Ok(history);
        })
        .RequireAuthorization(policy => policy.RequireRole("Admin"))
        .WithName("GetMigrationHistory")
        .WithSummary("Get migration history for a branch")
        .Produces<Models.DTOs.Shared.Migrations.MigrationHistory>(200);

        // Validate branch database
        group.MapGet("/branches/{branchId:guid}/validate", async (
            Guid branchId,
            IBranchMigrationManager migrationManager) =>
        {
            var isValid = await migrationManager.ValidateBranchDatabaseAsync(branchId);
            return Results.Ok(new { branchId, isValid, status = isValid ? "Valid" : "Invalid" });
        })
        .RequireAuthorization(policy => policy.RequireRole("Admin"))
        .WithName("ValidateBranchDatabase")
        .WithSummary("Validate branch database schema integrity")
        .Produces(200);

        // Rollback last migration for a branch (Admin only)
        group.MapPost("/branches/{branchId:guid}/rollback", async (
            Guid branchId,
            IBranchMigrationManager migrationManager,
            CancellationToken cancellationToken) =>
        {
            var result = await migrationManager.RollbackLastMigrationAsync(branchId, cancellationToken);
            return result.Success ? Results.Ok(result) : Results.BadRequest(result);
        })
        .RequireAuthorization(policy => policy.RequireRole("Admin"))
        .WithName("RollbackLastMigration")
        .WithSummary("Rollback the last applied migration for a specific branch")
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(200)
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(400);

        // Rollback last migration for all branches (Admin only)
        group.MapPost("/branches/rollback-all", async (
            IBranchMigrationManager migrationManager,
            CancellationToken cancellationToken) =>
        {
            var result = await migrationManager.RollbackAllBranchesAsync(cancellationToken);
            return result.Success ? Results.Ok(result) : Results.BadRequest(result);
        })
        .RequireAuthorization(policy => policy.RequireRole("Admin"))
        .WithName("RollbackAllBranches")
        .WithSummary("Rollback the last applied migration for all active branches")
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(200)
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(400);

        // Get migration status for all branches
        group.MapGet("/branches/status", async (
            Backend.Data.HeadOffice.HeadOfficeDbContext context) =>
        {
            var states = await context.BranchMigrationStates
                .Include(s => s.Branch)
                .Select(s => new
                {
                    s.BranchId,
                    BranchCode = s.Branch.Code,
                    BranchName = s.Branch.NameEn,
                    s.LastMigrationApplied,
                    Status = s.Status.ToString(),
                    s.LastAttemptAt,
                    s.RetryCount,
                    s.ErrorDetails,
                    IsLocked = s.LockOwnerId != null,
                    s.LockExpiresAt
                })
                .ToListAsync();

            return Results.Ok(states);
        })
        .RequireAuthorization(policy => policy.RequireRole("Admin"))
        .WithName("GetAllMigrationStatus")
        .WithSummary("Get migration status for all branches")
        .Produces(200);

        // Force remove a specific migration from a branch (Admin only)
        group.MapDelete("/branches/{branchId:guid}/force-remove/{migrationId}", async (
            Guid branchId,
            string migrationId,
            IBranchMigrationManager migrationManager,
            CancellationToken cancellationToken) =>
        {
            var result = await migrationManager.ForceRemoveMigrationAsync(branchId, migrationId, cancellationToken);
            return result.Success ? Results.Ok(result) : Results.BadRequest(result);
        })
        .RequireAuthorization(policy => policy.RequireRole("Admin"))
        .WithName("ForceRemoveMigration")
        .WithSummary("Force remove a migration from branch history without running Down() method")
        .WithDescription("WARNING: This bypasses normal rollback. Use only for cleaning up deleted/broken migrations.")
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(200)
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(400);

        // Force remove a specific migration from all branches (Admin only)
        group.MapDelete("/branches/force-remove-all/{migrationId}", async (
            string migrationId,
            IBranchMigrationManager migrationManager,
            CancellationToken cancellationToken) =>
        {
            var result = await migrationManager.ForceRemoveMigrationFromAllBranchesAsync(migrationId, cancellationToken);
            return result.Success ? Results.Ok(result) : Results.BadRequest(result);
        })
        .RequireAuthorization(policy => policy.RequireRole("Admin"))
        .WithName("ForceRemoveAllMigrations")
        .WithSummary("Force remove a migration from all branch databases")
        .WithDescription("WARNING: This bypasses normal rollback. Use only for cleaning up deleted/broken migrations.")
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(200)
        .Produces<Models.DTOs.Shared.Migrations.MigrationResult>(400);
    }
}
