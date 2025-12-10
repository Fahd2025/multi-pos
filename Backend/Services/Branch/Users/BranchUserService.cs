using Backend.Data.Branch;
using Backend.Models.DTOs.Branch.Users;
using User = Backend.Models.Entities.Branch.User; // Alias
using Backend.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Branch.Users;

/// <summary>
/// Service for managing branch-specific users
/// </summary>
public class UserService : IUserService
{
    private readonly BranchDbContext _context;

    public UserService(BranchDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserDto>> GetUsersAsync(bool includeInactive = false)
    {
        var query = _context.Users.AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(u => u.IsActive);
        }

        var users = await query
            .OrderBy(u => u.FullNameEn)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FullNameEn = u.FullNameEn,
                FullNameAr = u.FullNameAr,
                Phone = u.Phone,
                PreferredLanguage = u.PreferredLanguage,
                Role = u.Role,
                IsActive = u.IsActive,
                LastLoginAt = u.LastLoginAt,
                LastActivityAt = u.LastActivityAt,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            })
            .ToListAsync();

        return users;
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid userId)
    {
        var user = await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FullNameEn = u.FullNameEn,
                FullNameAr = u.FullNameAr,
                Phone = u.Phone,
                PreferredLanguage = u.PreferredLanguage,
                Role = u.Role,
                IsActive = u.IsActive,
                LastLoginAt = u.LastLoginAt,
                LastActivityAt = u.LastActivityAt,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            })
            .FirstOrDefaultAsync();

        return user;
    }

    public async Task<UserDto?> GetUserByUsernameAsync(string username)
    {
        var user = await _context.Users
            .Where(u => u.Username == username)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FullNameEn = u.FullNameEn,
                FullNameAr = u.FullNameAr,
                Phone = u.Phone,
                PreferredLanguage = u.PreferredLanguage,
                Role = u.Role,
                IsActive = u.IsActive,
                LastLoginAt = u.LastLoginAt,
                LastActivityAt = u.LastActivityAt,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            })
            .FirstOrDefaultAsync();

        return user;
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto dto, Guid createdBy)
    {
        // Check if username already exists
        if (!await IsUsernameAvailableAsync(dto.Username))
        {
            throw new InvalidOperationException($"Username '{dto.Username}' is already taken in this branch.");
        }

        // Hash the password
        var passwordHash = PasswordHasher.HashPassword(dto.Password);

        // Create user entity
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = dto.Username,
            PasswordHash = passwordHash,
            Email = dto.Email,
            FullNameEn = dto.FullNameEn,
            FullNameAr = dto.FullNameAr,
            Phone = dto.Phone,
            PreferredLanguage = dto.PreferredLanguage,
            Role = dto.Role,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullNameEn = user.FullNameEn,
            FullNameAr = user.FullNameAr,
            Phone = user.Phone,
            PreferredLanguage = user.PreferredLanguage,
            Role = user.Role,
            IsActive = user.IsActive,
            LastLoginAt = user.LastLoginAt,
            LastActivityAt = user.LastActivityAt,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    public async Task<UserDto> UpdateUserAsync(Guid userId, UpdateUserDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {userId} not found.");
        }

        // Update fields
        if (!string.IsNullOrWhiteSpace(dto.Email))
            user.Email = dto.Email;

        if (!string.IsNullOrWhiteSpace(dto.FullNameEn))
            user.FullNameEn = dto.FullNameEn;

        if (dto.FullNameAr != null)
            user.FullNameAr = dto.FullNameAr;

        if (dto.Phone != null)
            user.Phone = dto.Phone;

        if (!string.IsNullOrWhiteSpace(dto.PreferredLanguage))
            user.PreferredLanguage = dto.PreferredLanguage;

        if (!string.IsNullOrWhiteSpace(dto.Role))
            user.Role = dto.Role;

        if (dto.IsActive.HasValue)
            user.IsActive = dto.IsActive.Value;

        // Update password if provided
        if (!string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            user.PasswordHash = PasswordHasher.HashPassword(dto.NewPassword);
        }

        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullNameEn = user.FullNameEn,
            FullNameAr = user.FullNameAr,
            Phone = user.Phone,
            PreferredLanguage = user.PreferredLanguage,
            Role = user.Role,
            IsActive = user.IsActive,
            LastLoginAt = user.LastLoginAt,
            LastActivityAt = user.LastActivityAt,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    public async Task DeleteUserAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {userId} not found.");
        }

        // Soft delete by setting IsActive = false
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task<bool> IsUsernameAvailableAsync(string username, Guid? excludeUserId = null)
    {
        var query = _context.Users.Where(u => u.Username == username);

        if (excludeUserId.HasValue)
        {
            query = query.Where(u => u.Id != excludeUserId.Value);
        }

        return !await query.AnyAsync();
    }

    public async Task<UserDto?> ValidateCredentialsAsync(string username, string password)
    {
        var user = await _context.Users
            .Where(u => u.Username == username && u.IsActive)
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return null;
        }

        // Verify password
        if (!PasswordHasher.VerifyPassword(password, user.PasswordHash))
        {
            return null;
        }

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullNameEn = user.FullNameEn,
            FullNameAr = user.FullNameAr,
            Phone = user.Phone,
            PreferredLanguage = user.PreferredLanguage,
            Role = user.Role,
            IsActive = user.IsActive,
            LastLoginAt = user.LastLoginAt,
            LastActivityAt = user.LastActivityAt,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    public async Task UpdateLastLoginAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.LastLoginAt = DateTime.UtcNow;
            user.LastActivityAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}
