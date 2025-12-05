using Backend.Models.DTOs.Branch.Users;

namespace Backend.Services.Branch.Users;

/// <summary>
/// Service interface for managing branch-specific users
/// Each branch has its own users stored in the branch database
/// </summary>
public interface IBranchUserService
{
    /// <summary>
    /// Get all users for the current branch
    /// </summary>
    Task<List<BranchUserDto>> GetBranchUsersAsync(bool includeInactive = false);

    /// <summary>
    /// Get a specific branch user by ID
    /// </summary>
    Task<BranchUserDto?> GetBranchUserByIdAsync(Guid userId);

    /// <summary>
    /// Get a branch user by username
    /// </summary>
    Task<BranchUserDto?> GetBranchUserByUsernameAsync(string username);

    /// <summary>
    /// Create a new branch user
    /// </summary>
    Task<BranchUserDto> CreateBranchUserAsync(CreateBranchUserDto dto, Guid createdBy);

    /// <summary>
    /// Update an existing branch user
    /// </summary>
    Task<BranchUserDto> UpdateBranchUserAsync(Guid userId, UpdateBranchUserDto dto);

    /// <summary>
    /// Delete a branch user (soft delete by setting IsActive = false)
    /// </summary>
    Task DeleteBranchUserAsync(Guid userId);

    /// <summary>
    /// Validate username is unique within the branch
    /// </summary>
    Task<bool> IsUsernameAvailableAsync(string username, Guid? excludeUserId = null);

    /// <summary>
    /// Validate user credentials for login
    /// </summary>
    Task<BranchUserDto?> ValidateCredentialsAsync(string username, string password);

    /// <summary>
    /// Update last login timestamp
    /// </summary>
    Task UpdateLastLoginAsync(Guid userId);
}
