using Backend.Models.DTOs.Branches;

namespace Backend.Services.Branches;

/// <summary>
/// Service interface for branch management operations
/// </summary>
public interface IBranchService
{
    /// <summary>
    /// Retrieves all branches with optional filtering
    /// </summary>
    Task<(List<BranchDto> Branches, int TotalCount)> GetBranchesAsync(
        int page = 1,
        int pageSize = 20,
        bool? isActive = null,
        string? search = null
    );

    /// <summary>
    /// Retrieves a single branch by ID
    /// </summary>
    Task<BranchDto?> GetBranchByIdAsync(Guid id);

    /// <summary>
    /// Creates a new branch and provisions its database
    /// </summary>
    Task<BranchDto> CreateBranchAsync(CreateBranchDto createBranchDto, Guid createdBy);

    /// <summary>
    /// Updates an existing branch
    /// </summary>
    Task<BranchDto> UpdateBranchAsync(Guid id, UpdateBranchDto updateBranchDto);

    /// <summary>
    /// Deletes a branch (soft delete by setting IsActive = false)
    /// </summary>
    Task<bool> DeleteBranchAsync(Guid id);

    /// <summary>
    /// Retrieves branch settings (localization and tax configuration)
    /// </summary>
    Task<BranchSettingsDto?> GetBranchSettingsAsync(Guid id);

    /// <summary>
    /// Updates branch settings
    /// </summary>
    Task<BranchSettingsDto> UpdateBranchSettingsAsync(Guid id, BranchSettingsDto settingsDto);

    /// <summary>
    /// Tests database connection for a branch
    /// </summary>
    Task<(bool Success, string Message)> TestDatabaseConnectionAsync(Guid id);

    /// <summary>
    /// Provisions (creates) branch database, runs migrations, and seeds sample data
    /// </summary>
    Task<(bool Success, string Message)> ProvisionBranchDatabaseAsync(Guid id);
}
