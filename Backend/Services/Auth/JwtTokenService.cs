using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Backend.Data;
using Backend.Models.Entities.HeadOffice;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Services.Auth;

public class JwtTokenService : IJwtTokenService
{
    private readonly HeadOfficeDbContext _context;
    private readonly IConfiguration _configuration;

    public JwtTokenService(HeadOfficeDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public string GenerateAccessToken(User user, Guid? branchId, string? role)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("preferred_language", user.PreferredLanguage),
            new Claim("is_head_office_admin", user.IsHeadOfficeAdmin.ToString().ToLower()),
        };

        if (branchId.HasValue)
        {
            claims.Add(new Claim("branch_id", branchId.Value.ToString()));
        }

        if (!string.IsNullOrEmpty(role))
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                _configuration["Jwt:SecretKey"]
                    ?? throw new InvalidOperationException("JWT SecretKey not configured")
            )
        );

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
                int.Parse(_configuration["Jwt:AccessTokenExpiryMinutes"] ?? "15")
            ),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public async Task<User?> ValidateRefreshTokenAsync(string token)
    {
        var refreshToken = await _context
            .RefreshTokens.Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == token);

        if (refreshToken == null)
        {
            return null;
        }

        // Check if token is expired
        if (refreshToken.ExpiresAt < DateTime.UtcNow)
        {
            return null;
        }

        // Check if token is revoked
        if (refreshToken.RevokedAt.HasValue)
        {
            return null;
        }

        // Check inactivity timeout (30 minutes)
        var inactivityTimeout = TimeSpan.FromMinutes(30);
        if (DateTime.UtcNow - refreshToken.LastActivityAt > inactivityTimeout)
        {
            return null;
        }

        // Update last activity
        refreshToken.LastActivityAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return refreshToken.User;
    }

    public async Task RevokeRefreshTokenAsync(string token)
    {
        var refreshToken = await _context.RefreshTokens.FirstOrDefaultAsync(rt =>
            rt.Token == token
        );

        if (refreshToken != null)
        {
            refreshToken.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task RevokeAllUserTokensAsync(Guid userId)
    {
        var tokens = await _context
            .RefreshTokens.Where(rt => rt.UserId == userId && rt.RevokedAt == null)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.RevokedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task CleanupExpiredTokensAsync()
    {
        var expiredTokens = await _context
            .RefreshTokens.Where(rt => rt.ExpiresAt < DateTime.UtcNow || rt.RevokedAt != null)
            .ToListAsync();

        _context.RefreshTokens.RemoveRange(expiredTokens);
        await _context.SaveChangesAsync();
    }
}
