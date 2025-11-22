using Backend.Models.Entities.HeadOffice;

namespace Backend.Services.Auth;

public interface IJwtTokenService
{
    /// <summary>
    /// Generates a JWT access token for the user
    /// </summary>
    /// <param name="user">User entity</param>
    /// <param name="branchId">Branch ID (null for head office admins)</param>
    /// <param name="role">User role for the branch</param>
    /// <returns>JWT access token</returns>
    string GenerateAccessToken(User user, Guid? branchId, string? role);

    /// <summary>
    /// Generates a cryptographically secure refresh token
    /// </summary>
    /// <returns>Refresh token string</returns>
    string GenerateRefreshToken();

    /// <summary>
    /// Validates a refresh token and returns the associated user
    /// </summary>
    /// <param name="token">Refresh token</param>
    /// <returns>User entity if valid, null otherwise</returns>
    Task<User?> ValidateRefreshTokenAsync(string token);

    /// <summary>
    /// Revokes a refresh token
    /// </summary>
    /// <param name="token">Refresh token to revoke</param>
    Task RevokeRefreshTokenAsync(string token);

    /// <summary>
    /// Revokes all refresh tokens for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    Task RevokeAllUserTokensAsync(Guid userId);

    /// <summary>
    /// Cleans up expired refresh tokens
    /// </summary>
    Task CleanupExpiredTokensAsync();
}
