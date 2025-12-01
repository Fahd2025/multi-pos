using Backend.Models.DTOs.HeadOffice.Users;
using Backend.Models.Entities.HeadOffice;

namespace Backend.Services.HeadOffice.Users;

/// <summary>
/// Service interface for user management operations
/// </summary>
public interface IUserService
{
    /// <summary>
    /// Get all users with optional filtering
    /// </summary>
    /// <param name="includeInactive">Include inactive users in results</param>
    /// <param name="branchId">Filter by specific branch assignment</param>
    /// <param name="role">Filter by role</param>
    /// <param name="searchTerm">Search by username, email, or full name</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    Task<(List<UserDto> Users, int TotalCount)> GetUsersAsync(
        bool includeInactive = false,
        Guid? branchId = null,
        UserRole? role = null,
        string? searchTerm = null,
        int page = 1,
        int pageSize = 50);

    /// <summary>
    /// Get user by ID
    /// </summary>
    Task<UserDto?> GetUserByIdAsync(Guid userId);

    /// <summary>
    /// Create a new user
    /// </summary>
    Task<UserDto> CreateUserAsync(CreateUserDto createDto, Guid createdByUserId);

    /// <summary>
    /// Update user information
    /// </summary>
    Task<UserDto> UpdateUserAsync(Guid userId, UpdateUserDto updateDto, Guid updatedByUserId);

    /// <summary>
    /// Delete user (soft delete - deactivate)
    /// </summary>
    Task DeleteUserAsync(Guid userId, Guid deletedByUserId);

    /// <summary>
    /// Deactivate user account
    /// </summary>
    Task DeactivateUserAsync(Guid userId, Guid deactivatedByUserId);

    /// <summary>
    /// Assign user to a branch with a specific role
    /// </summary>
    Task AssignBranchAsync(Guid userId, AssignBranchDto assignDto, Guid assignedByUserId);

    /// <summary>
    /// Remove user's branch assignment
    /// </summary>
    Task RemoveBranchAssignmentAsync(Guid userId, Guid branchId, Guid removedByUserId);

    /// <summary>
    /// Get user's activity log (last 100 activities)
    /// </summary>
    Task<List<UserActivityDto>> GetUserActivityAsync(Guid userId, int limit = 100);
}

/// <summary>
/// DTO for user activity log entries
/// </summary>
public class UserActivityDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
