using Backend.Data;
using Backend.Models.DTOs.Auth;
using Backend.Models.Entities.HeadOffice;
using Backend.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Auth;

public class AuthService : IAuthService
{
    private readonly HeadOfficeDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IConfiguration _configuration;

    public AuthService(
        HeadOfficeDbContext context,
        IJwtTokenService jwtTokenService,
        IConfiguration configuration
    )
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
        _configuration = configuration;
    }

    public async Task<LoginResponse?> LoginAsync(
        LoginRequest request,
        string? ipAddress,
        string? userAgent
    )
    {
        // Find user
        var user = await _context.Users.FirstOrDefaultAsync(u =>
            u.Username == request.Username && u.IsActive
        );

        if (user == null)
        {
            return null;
        }

        // Check if account is locked
        if (user.LockedUntil.HasValue && user.LockedUntil.Value > DateTime.UtcNow)
        {
            return null;
        }

        // Verify password
        if (!PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            // Increment failed login attempts
            user.FailedLoginAttempts++;

            // Lock account after 5 failed attempts
            if (user.FailedLoginAttempts >= 5)
            {
                user.LockedUntil = DateTime.UtcNow.AddMinutes(30);
            }

            await _context.SaveChangesAsync();
            return null;
        }

        // Reset failed login attempts on successful login
        user.FailedLoginAttempts = 0;
        user.LockedUntil = null;
        user.LastLoginAt = DateTime.UtcNow;
        user.LastActivityAt = DateTime.UtcNow;

        // Check if user is head office admin
        if (user.IsHeadOfficeAdmin)
        {
            // Head office admin can access all branches
            return await GenerateLoginResponseAsync(user, null, null, ipAddress, userAgent);
        }

        // Regular user - must select a branch
        if (string.IsNullOrEmpty(request.BranchLoginName))
        {
            return null;
        }

        // Find branch
        var branch = await _context.Branches.FirstOrDefaultAsync(b =>
            b.LoginName == request.BranchLoginName && b.IsActive
        );

        if (branch == null)
        {
            return null;
        }

        // Check if user has access to this branch
        var branchUser = await _context.BranchUsers.FirstOrDefaultAsync(bu =>
            bu.UserId == user.Id && bu.BranchId == branch.Id && bu.IsActive
        );

        if (branchUser == null)
        {
            return null;
        }

        // Generate tokens with branch context
        return await GenerateLoginResponseAsync(
            user,
            branch.Id,
            branchUser.Role.ToString(),
            ipAddress,
            userAgent
        );
    }

    public async Task<LoginResponse?> TechnicalLoginAsync(
        string username,
        string password,
        string technicalPassword,
        string? ipAddress,
        string? userAgent
    )
    {
        // Verify technical password
        var technicalPasswordSetting = await _context.MainSettings.FirstOrDefaultAsync(s =>
            s.Key == "TechnicalPassword"
        );

        if (technicalPasswordSetting == null)
        {
            return null;
        }

        if (!PasswordHasher.VerifyPassword(technicalPassword, technicalPasswordSetting.Value ?? ""))
        {
            return null;
        }

        // Find user
        var user = await _context.Users.FirstOrDefaultAsync(u =>
            u.Username == username && u.IsActive
        );

        if (user == null)
        {
            return null;
        }

        // Verify user password
        if (!PasswordHasher.VerifyPassword(password, user.PasswordHash))
        {
            return null;
        }

        // Technical login grants head office admin access (branch: "all")
        user.LastLoginAt = DateTime.UtcNow;
        user.LastActivityAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GenerateLoginResponseAsync(user, null, "Admin", ipAddress, userAgent);
    }

    public async Task<LoginResponse?> RefreshTokenAsync(
        RefreshTokenRequest request,
        string? ipAddress
    )
    {
        var user = await _jwtTokenService.ValidateRefreshTokenAsync(request.RefreshToken);

        if (user == null)
        {
            return null;
        }

        // Get existing refresh token to check branch context
        var existingToken = await _context.RefreshTokens.FirstOrDefaultAsync(rt =>
            rt.Token == request.RefreshToken
        );

        if (existingToken == null)
        {
            return null;
        }

        // Revoke old token
        await _jwtTokenService.RevokeRefreshTokenAsync(request.RefreshToken);

        // Determine branch context from original token
        // For simplicity, we'll check if user is head office admin or has branch assignments
        Guid? branchId = null;
        string? role = null;

        if (!user.IsHeadOfficeAdmin)
        {
            // Get user's first active branch assignment
            var branchUser = await _context
                .BranchUsers.Include(bu => bu.Branch)
                .Where(bu => bu.UserId == user.Id && bu.IsActive && bu.Branch.IsActive)
                .FirstOrDefaultAsync();

            if (branchUser != null)
            {
                branchId = branchUser.BranchId;
                role = branchUser.Role.ToString();
            }
        }

        // Generate new tokens
        return await GenerateLoginResponseAsync(
            user,
            branchId,
            role,
            ipAddress,
            existingToken.UserAgent
        );
    }

    public async Task LogoutAsync(string refreshToken)
    {
        await _jwtTokenService.RevokeRefreshTokenAsync(refreshToken);
    }

    public async Task LogoutAllAsync(Guid userId)
    {
        await _jwtTokenService.RevokeAllUserTokensAsync(userId);
    }

    private async Task<LoginResponse> GenerateLoginResponseAsync(
        User user,
        Guid? branchId,
        string? role,
        string? ipAddress,
        string? userAgent
    )
    {
        // Generate tokens
        var accessToken = _jwtTokenService.GenerateAccessToken(user, branchId, role);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        // Store refresh token
        var refreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(
                int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7")
            ),
            CreatedAt = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent,
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        // Get branch info if applicable
        BranchInfo? branchInfo = null;
        if (branchId.HasValue)
        {
            var branch = await _context.Branches.FindAsync(branchId.Value);
            if (branch != null)
            {
                branchInfo = new BranchInfo
                {
                    Id = branch.Id,
                    Code = branch.Code,
                    NameEn = branch.NameEn,
                    NameAr = branch.NameAr,
                    Language = branch.Language,
                    Currency = branch.Currency,
                };
            }
        }

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = new UserInfo
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullNameEn = user.FullNameEn,
                FullNameAr = user.FullNameAr,
                PreferredLanguage = user.PreferredLanguage,
                IsHeadOfficeAdmin = user.IsHeadOfficeAdmin,
                Role = role,
            },
            Branch = branchInfo,
            ExpiresAt = refreshTokenEntity.ExpiresAt,
        };
    }
}
