using Backend.Data.HeadOffice;
using Backend.Data.Shared;
using Backend.Models.DTOs.HeadOffice.Auth;
using Backend.Models.Entities.HeadOffice;
using Backend.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.HeadOffice.Auth;

public class AuthService : IAuthService
{
    private readonly HeadOfficeDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IConfiguration _configuration;
    private readonly DbContextFactory _dbContextFactory;

    public AuthService(
        HeadOfficeDbContext context,
        IJwtTokenService jwtTokenService,
        IConfiguration configuration,
        DbContextFactory dbContextFactory
    )
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
        _configuration = configuration;
        _dbContextFactory = dbContextFactory;
    }

    public async Task<LoginResponse?> LoginAsync(
        LoginRequest request,
        string? ipAddress,
        string? userAgent
    )
    {
        // 1. If BranchCode is provided, try to authenticate as Branch User first
        if (!string.IsNullOrEmpty(request.BranchCode))
        {
            var branch = await _context.Branches.FirstOrDefaultAsync(b =>
                b.Code == request.BranchCode && b.IsActive
            );

            if (branch == null)
            {
                return null;
            }

            // Check for BranchUser in Head Office DB (Primary Source)
            var branchUser = await _context.BranchUsers.FirstOrDefaultAsync(bu =>
                bu.BranchId == branch.Id &&
                bu.Username == request.Username &&
                bu.IsActive
            );

            if (branchUser != null)
            {
                // Verify password
                if (!PasswordHasher.VerifyPassword(request.Password, branchUser.PasswordHash))
                {
                    return null;
                }

                // Update LastLoginAt in head office
                branchUser.LastLoginAt = DateTime.UtcNow;
                branchUser.LastActivityAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Fire-and-forget sync to branch DB (async)
                _ = Task.Run(async () =>
                {
                    try
                    {
                        using var branchContext = _dbContextFactory.CreateBranchContext(branch);
                        var branchDbUser = await branchContext.Users.FirstOrDefaultAsync(u => u.Id == branchUser.Id);
                        if (branchDbUser != null)
                        {
                            branchDbUser.LastLoginAt = DateTime.UtcNow;
                            branchDbUser.LastActivityAt = DateTime.UtcNow;
                            await branchContext.SaveChangesAsync();
                        }
                    }
                    catch
                    {
                        // Ignore sync errors for login timestamps
                    }
                });

                // Create a UserInfo object from BranchUser
                var userInfo = new User
                {
                    Id = branchUser.Id,
                    Username = branchUser.Username,
                    Email = branchUser.Email,
                    FullNameEn = branchUser.FullNameEn,
                    FullNameAr = branchUser.FullNameAr,
                    Phone = branchUser.Phone,
                    PreferredLanguage = branchUser.PreferredLanguage,
                    IsActive = branchUser.IsActive,
                    IsHeadOfficeAdmin = false,
                    LastLoginAt = branchUser.LastLoginAt,
                    LastActivityAt = branchUser.LastActivityAt,
                    CreatedAt = branchUser.CreatedAt,
                    UpdatedAt = branchUser.UpdatedAt
                };

                return await GenerateLoginResponseAsync(
                    userInfo,
                    branch.Id,
                    branchUser.Role,
                    ipAddress,
                    userAgent,
                    isBranchUser: true
                );
            }
        }

        // 2. Fallback to Head Office User (Admin) authentication
        // This handles:
        // - Head Office Admin logging into Dashboard (no branch code)
        // - Head Office Admin logging into a specific branch (with branch code)

        var user = await _context.Users.FirstOrDefaultAsync(u =>
            u.Username == request.Username && u.IsActive
        );

        if (user != null)
        {
            // Check if account is locked
            if (user.LockedUntil.HasValue && user.LockedUntil.Value > DateTime.UtcNow)
            {
                return null;
            }

            // Verify password
            if (!PasswordHasher.VerifyPassword(request.Password, user.PasswordHash))
            {
                user.FailedLoginAttempts++;
                if (user.FailedLoginAttempts >= 5)
                {
                    user.LockedUntil = DateTime.UtcNow.AddMinutes(30);
                }
                await _context.SaveChangesAsync();
                return null;
            }

            // Reset failed login attempts
            user.FailedLoginAttempts = 0;
            user.LockedUntil = null;
            user.LastLoginAt = DateTime.UtcNow;
            user.LastActivityAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Handle Branch Selection for Head Office Admin
            if (!string.IsNullOrEmpty(request.BranchCode))
            {
                var branch = await _context.Branches.FirstOrDefaultAsync(b =>
                    b.Code == request.BranchCode && b.IsActive
                );

                if (branch == null) return null;

                // Only Head Office Admins can access branches they are not explicitly assigned to
                // (Since UserAssignments is deprecated, strict checking for regular users would fail here)
                if (user.IsHeadOfficeAdmin)
                {
                    // Ensure admin user exists in the branch database
                    await SyncAdminToBranchAsync(user, branch);

                    return await GenerateLoginResponseAsync(
                        user,
                        branch.Id,
                        "Manager", // Admin gets Manager role
                        ipAddress,
                        userAgent
                    );
                }

                // Regular Head Office users cannot access branches without UserAssignment (which is removed)
                // So they can only login to Head Office Dashboard if allowed
                return null;
            }

            // Head Office Dashboard Login
            if (user.IsHeadOfficeAdmin)
            {
                return await GenerateLoginResponseAsync(
                    user,
                    null,
                    "Admin",
                    ipAddress,
                    userAgent
                );
            }
        }

        return null;
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
            // UserAssignments are deprecated.
            // If we are here, it's either a BranchUser (handled below) or a legacy user.
            // Currently, RefreshToken is linked to HeadOffice User.
            // If this is a BranchUser (who doesn't have a HeadOffice User record but is masquerading as one in the token),
            // they shouldn't have a RefreshToken in the DB anyway because GenerateLoginResponseAsync skips it for isBranchUser=true.

            // So if we found a refresh token in DB, it MUST be a real HeadOffice User.
            // Since we removed UserAssignments, regular Head Office users rely on other means or are deprecated.
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
        string? userAgent,
        bool isBranchUser = false
    )
    {
        // Generate tokens
        var accessToken = _jwtTokenService.GenerateAccessToken(user, branchId, role);
        var refreshToken = _jwtTokenService.GenerateRefreshToken();

        // Store refresh token (only for head office users)
        DateTime expiresAt = DateTime.UtcNow.AddDays(
            int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7")
        );

        if (!isBranchUser)
        {
            var refreshTokenEntity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = refreshToken,
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTime.UtcNow,
                IpAddress = ipAddress,
                UserAgent = userAgent,
            };

            _context.RefreshTokens.Add(refreshTokenEntity);
            await _context.SaveChangesAsync();
        }

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

        // Get user's branch assignments
        var userBranches = new List<UserBranchInfo>();

        // Always add the current branch context if available
        // This applies to both BranchUsers and HeadOfficeAdmins logging into a specific branch
        if (branchInfo != null)
        {
            userBranches.Add(new UserBranchInfo
            {
                BranchId = branchInfo.Id,
                BranchCode = branchInfo.Code,
                BranchNameEn = branchInfo.NameEn,
                BranchNameAr = branchInfo.NameAr,
                Role = role ?? "Cashier"
            });
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
                Branches = userBranches
            },
            Branch = branchInfo,
            ExpiresAt = expiresAt,
        };
    }

    private async Task SyncAdminToBranchAsync(User adminUser, Backend.Models.Entities.HeadOffice.Branch branch)
    {
        try
        {
            using var branchContext = _dbContextFactory.CreateBranchContext(branch);
            var exists = await branchContext.Users.AnyAsync(u => u.Id == adminUser.Id);

            if (!exists)
            {
                var branchDbUser = new Backend.Models.Entities.Branch.User
                {
                    Id = adminUser.Id,
                    Username = adminUser.Username,
                    Email = adminUser.Email,
                    FullNameEn = adminUser.FullNameEn,
                    FullNameAr = adminUser.FullNameAr,
                    PasswordHash = adminUser.PasswordHash,
                    Phone = adminUser.Phone,
                    PreferredLanguage = adminUser.PreferredLanguage,
                    Role = "Manager", // Admins are Managers in branch
                    IsActive = adminUser.IsActive,
                    CreatedAt = adminUser.CreatedAt,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = adminUser.Id
                };

                branchContext.Users.Add(branchDbUser);
                await branchContext.SaveChangesAsync();
            }
            // If exists, we could update details, but let's keep it simple for now.
        }
        catch (Exception)
        {
            // Silently fail to avoid blocking login if branch DB is unreachable
            // But log if possible (not injecting logger here currently)
        }
    }
}
