using Backend.Models.DTOs.Branch.Users;

namespace Backend.Services.Branch.Users;

/// <summary>
/// Service interface for managing branch-specific users
/// Each branch has its own users stored in the branch database
/// </summary>
public interface IUserService
{
    /// <summary>
    /// Get all users for the current branch
    /// </summary>
    Task<List<UserDto>> GetUsersAsync(bool includeInactive = false);

    /// <summary>
    /// Get a specific branch user by ID
    /// </summary>
    Task<UserDto?> GetUserByIdAsync(Guid userId);

    /// <summary>
    /// Get a branch user by username
    /// </summary>
    Task<UserDto?> GetUserByUsernameAsync(string username);

    /// <summary>
    /// Create a new branch user
    /// </summary>
    Task<UserDto> CreateUserAsync(CreateUserDto dto, Guid createdBy);

    /// <summary>
    /// Update an existing branch user
    /// </summary>
    Task<UserDto> UpdateUserAsync(Guid userId, UpdateUserDto dto);

    /// <summary>
    /// Delete a branch user (soft delete by setting IsActive = false)
    /// </summary>
    Task DeleteUserAsync(Guid userId);

    /// <summary>
    /// Validate username is unique within the branch
    /// </summary>
    Task<bool> IsUsernameAvailableAsync(string username, Guid? excludeUserId = null);

    /// <summary>
    /// Validate user credentials for login
    /// </summary>
    Task<UserDto?> ValidateCredentialsAsync(string username, string password);

    /// <summary>
    /// Update last login timestamp
    /// </summary>
    Task UpdateLastLoginAsync(Guid userId);
}
