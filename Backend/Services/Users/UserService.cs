using Backend.Data;
using Backend.Models.DTOs.Users;
using Backend.Models.Entities.HeadOffice;
using Backend.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Users;

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
        var query = _context.Users
            .Include(u => u.BranchUsers)
            .ThenInclude(bu => bu.Branch)
            .AsQueryable();

        // Filter by active status
        if (!includeInactive)
        {
            query = query.Where(u => u.IsActive);
        }

        // Filter by branch
        if (branchId.HasValue)
        {
            query = query.Where(u => u.BranchUsers.Any(bu => bu.BranchId == branchId.Value && bu.IsActive));
        }

        // Filter by role
        if (role.HasValue)
        {
            query = query.Where(u => u.BranchUsers.Any(bu => bu.Role == role.Value && bu.IsActive));
        }

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
        var user = await _context.Users
            .Include(u => u.BranchUsers)
            .ThenInclude(bu => bu.Branch)
            .FirstOrDefaultAsync(u => u.Id == userId);

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

        // Add branch assignments if provided
        foreach (var assignment in createDto.BranchAssignments)
        {
            // Validate branch exists
            var branchExists = await _context.Branches.AnyAsync(b => b.Id == assignment.BranchId);
            if (!branchExists)
            {
                throw new InvalidOperationException($"Branch with ID '{assignment.BranchId}' does not exist");
            }

            // Parse role
            if (!Enum.TryParse<UserRole>(assignment.Role, true, out var parsedRole))
            {
                throw new InvalidOperationException($"Invalid role: '{assignment.Role}'");
            }

            var branchUser = new BranchUser
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                BranchId = assignment.BranchId,
                Role = parsedRole,
                IsActive = true,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = createdByUserId
            };

            _context.BranchUsers.Add(branchUser);
        }

        await _context.SaveChangesAsync();

        // Reload user with branch assignments
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

        // Deactivate all branch assignments
        var branchUsers = await _context.BranchUsers
            .Where(bu => bu.UserId == userId)
            .ToListAsync();

        foreach (var branchUser in branchUsers)
        {
            branchUser.IsActive = false;
        }

        await _context.SaveChangesAsync();
    }

    public async Task DeactivateUserAsync(Guid userId, Guid deactivatedByUserId)
    {
        await DeleteUserAsync(userId, deactivatedByUserId);
    }

    public async Task AssignBranchAsync(Guid userId, AssignBranchDto assignDto, Guid assignedByUserId)
    {
        // Validate user exists
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException($"User with ID '{userId}' not found");
        }

        // Validate branch exists
        var branch = await _context.Branches.FindAsync(assignDto.BranchId);
        if (branch == null)
        {
            throw new InvalidOperationException($"Branch with ID '{assignDto.BranchId}' not found");
        }

        // Parse role
        if (!Enum.TryParse<UserRole>(assignDto.Role, true, out var parsedRole))
        {
            throw new InvalidOperationException($"Invalid role: '{assignDto.Role}'");
        }

        // Check if assignment already exists
        var existingAssignment = await _context.BranchUsers
            .FirstOrDefaultAsync(bu => bu.UserId == userId && bu.BranchId == assignDto.BranchId);

        if (existingAssignment != null)
        {
            // Update existing assignment
            existingAssignment.Role = parsedRole;
            existingAssignment.IsActive = true;
        }
        else
        {
            // Create new assignment
            var branchUser = new BranchUser
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                BranchId = assignDto.BranchId,
                Role = parsedRole,
                IsActive = true,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = assignedByUserId
            };

            _context.BranchUsers.Add(branchUser);
        }

        await _context.SaveChangesAsync();
    }

    public async Task RemoveBranchAssignmentAsync(Guid userId, Guid branchId, Guid removedByUserId)
    {
        var branchUser = await _context.BranchUsers
            .FirstOrDefaultAsync(bu => bu.UserId == userId && bu.BranchId == branchId);

        if (branchUser == null)
        {
            throw new InvalidOperationException($"Branch assignment not found for user '{userId}' and branch '{branchId}'");
        }

        // Soft delete - deactivate assignment
        branchUser.IsActive = false;

        await _context.SaveChangesAsync();
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
            AssignedBranchIds = user.BranchUsers
                .Where(bu => bu.IsActive)
                .Select(bu => bu.BranchId)
                .ToList(),
            AssignedBranches = user.BranchUsers
                .Where(bu => bu.IsActive)
                .Select(bu => new UserBranchDto
                {
                    BranchId = bu.BranchId,
                    BranchCode = bu.Branch.Code,
                    BranchNameEn = bu.Branch.NameEn,
                    BranchNameAr = bu.Branch.NameAr,
                    Role = bu.Role.ToString(),
                    AssignedAt = bu.AssignedAt
                })
                .ToList()
        };

        return dto;
    }
}
