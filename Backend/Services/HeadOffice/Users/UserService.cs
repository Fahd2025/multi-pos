using Backend.Data.HeadOffice;
using Backend.Models.DTOs.HeadOffice.Users;
using Backend.Models.Entities.HeadOffice;
using HeadOfficeUser = Backend.Models.Entities.HeadOffice.User; // Alias to avoid ambiguity
using Backend.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.HeadOffice.Users;

/// <summary>
/// Service for user management operations
/// </summary>
public class UserService : IUserService
{
    private readonly HeadOfficeDbContext _context;

    public UserService(HeadOfficeDbContext context)
    {
        _context = context;
    }

    public async Task<(List<UserDto> Users, int TotalCount)> GetUsersAsync(
        bool includeInactive = false,
        Guid? branchId = null,
        UserRole? role = null,
        string? searchTerm = null,
        int page = 1,
        int pageSize = 50)
    {
        var query = _context.Users.AsQueryable();

        // Filter by active status
        if (!includeInactive)
        {
            query = query.Where(u => u.IsActive);
        }

        // BranchId filter is no longer relevant for HeadOffice users via UserAssignments.
        // If we want to filter users who are admins of a branch, we can't do it easily
        // since UserAssignments is removed. Ignoring branchId if passed.

        // Search by username, email, or full name
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var search = searchTerm.ToLower();
            query = query.Where(u =>
                u.Username.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search) ||
                u.FullNameEn.ToLower().Contains(search) ||
                (u.FullNameAr != null && u.FullNameAr.ToLower().Contains(search)));
        }

        // Get total count
        var totalCount = await query.CountAsync();

        // Apply pagination
        var users = await query
            .OrderBy(u => u.Username)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Map to DTOs
        var userDtos = users.Select(MapToDto).ToList();

        return (userDtos, totalCount);
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

        return user != null ? MapToDto(user) : null;
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto createDto, Guid createdByUserId)
    {
        // Check if username already exists
        if (await _context.Users.AnyAsync(u => u.Username == createDto.Username))
        {
            throw new InvalidOperationException($"Username '{createDto.Username}' already exists");
        }

        // Check if email already exists
        if (await _context.Users.AnyAsync(u => u.Email == createDto.Email))
        {
            throw new InvalidOperationException($"Email '{createDto.Email}' already exists");
        }

        // Create new user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = createDto.Username,
            Email = createDto.Email,
            PasswordHash = PasswordHasher.HashPassword(createDto.Password),
            FullNameEn = createDto.FullNameEn,
            FullNameAr = createDto.FullNameAr,
            Phone = createDto.Phone,
            PreferredLanguage = createDto.PreferredLanguage,
            IsActive = createDto.IsActive,
            IsHeadOfficeAdmin = createDto.IsHeadOfficeAdmin,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return (await GetUserByIdAsync(user.Id))!;
    }

    public async Task<UserDto> UpdateUserAsync(Guid userId, UpdateUserDto updateDto, Guid updatedByUserId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException($"User with ID '{userId}' not found");
        }

        // Update email if provided and changed
        if (!string.IsNullOrWhiteSpace(updateDto.Email) && updateDto.Email != user.Email)
        {
            // Check if new email already exists
            if (await _context.Users.AnyAsync(u => u.Email == updateDto.Email && u.Id != userId))
            {
                throw new InvalidOperationException($"Email '{updateDto.Email}' already exists");
            }
            user.Email = updateDto.Email;
        }

        // Update other fields if provided
        if (!string.IsNullOrWhiteSpace(updateDto.FullNameEn))
            user.FullNameEn = updateDto.FullNameEn;

        if (updateDto.FullNameAr != null)
            user.FullNameAr = updateDto.FullNameAr;

        if (updateDto.Phone != null)
            user.Phone = updateDto.Phone;

        if (!string.IsNullOrWhiteSpace(updateDto.PreferredLanguage))
            user.PreferredLanguage = updateDto.PreferredLanguage;

        if (updateDto.IsActive.HasValue)
            user.IsActive = updateDto.IsActive.Value;

        // Update password if provided
        if (!string.IsNullOrWhiteSpace(updateDto.NewPassword))
        {
            user.PasswordHash = PasswordHasher.HashPassword(updateDto.NewPassword);
        }

        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return (await GetUserByIdAsync(userId))!;
    }

    public async Task DeleteUserAsync(Guid userId, Guid deletedByUserId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException($"User with ID '{userId}' not found");
        }

        // Soft delete - deactivate user
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task DeactivateUserAsync(Guid userId, Guid deactivatedByUserId)
    {
        await DeleteUserAsync(userId, deactivatedByUserId);
    }

    public Task AssignBranchAsync(Guid userId, AssignBranchDto assignDto, Guid assignedByUserId)
    {
        // Deprecated - No specific implementation since UserAssignment table is removed
        // Throw exception to indicate this feature is no longer supported
        return Task.FromException(new NotSupportedException("Assigning branches to Head Office users is deprecated. Use Branch User management instead."));
    }

    public Task RemoveBranchAssignmentAsync(Guid userId, Guid branchId, Guid removedByUserId)
    {
        // Deprecated - No specific implementation since UserAssignment table is removed
        return Task.FromException(new NotSupportedException("Branch assignments are deprecated."));
    }

    public async Task<List<UserActivityDto>> GetUserActivityAsync(Guid userId, int limit = 100)
    {
        var activities = await _context.UserActivityLogs
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .Take(limit)
            .ToListAsync();

        return activities.Select(a => new UserActivityDto
        {
            Id = a.Id,
            Action = a.Action,
            EntityType = a.EntityType,
            EntityId = a.EntityId,
            Details = a.Details,
            Timestamp = a.Timestamp,
            IpAddress = a.IpAddress,
            UserAgent = a.UserAgent
        }).ToList();
    }

    /// <summary>
    /// Maps User entity to UserDto
    /// </summary>
    private UserDto MapToDto(User user)
    {
        var dto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullNameEn = user.FullNameEn,
            FullNameAr = user.FullNameAr,
            Phone = user.Phone,
            PreferredLanguage = user.PreferredLanguage,
            IsActive = user.IsActive,
            IsHeadOfficeAdmin = user.IsHeadOfficeAdmin,
            LastLoginAt = user.LastLoginAt,
            LastActivityAt = user.LastActivityAt,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            AssignedBranchIds = new List<Guid>(), // No longer supported
            AssignedBranches = new List<UserBranchDto>() // No longer supported
        };

        return dto;
    }
}
