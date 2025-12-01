using Backend.Models.DTOs.HeadOffice.Auth;

namespace Backend.Services.HeadOffice.Auth;

public interface IAuthService
{
    /// <summary>
    /// Authenticates a user with username/password and branch selection
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <param name="ipAddress">Client IP address</param>
    /// <param name="userAgent">Client user agent</param>
    /// <returns>Login response with tokens and user info</returns>
    Task<LoginResponse?> LoginAsync(LoginRequest request, string? ipAddress, string? userAgent);

    /// <summary>
    /// Technical login with master password (branch: "all")
    /// </summary>
    /// <param name="username">Username</param>
    /// <param name="password">Password</param>
    /// <param name="technicalPassword">Technical override password</param>
    /// <param name="ipAddress">Client IP address</param>
    /// <param name="userAgent">Client user agent</param>
    /// <returns>Login response with tokens and user info</returns>
    Task<LoginResponse?> TechnicalLoginAsync(
        string username,
        string password,
        string technicalPassword,
        string? ipAddress,
        string? userAgent
    );

    /// <summary>
    /// Refreshes access token using refresh token
    /// </summary>
    /// <param name="request">Refresh token request</param>
    /// <param name="ipAddress">Client IP address</param>
    /// <returns>New login response with refreshed tokens</returns>
    Task<LoginResponse?> RefreshTokenAsync(RefreshTokenRequest request, string? ipAddress);

    /// <summary>
    /// Logs out a user and revokes their refresh token
    /// </summary>
    /// <param name="refreshToken">Refresh token to revoke</param>
    Task LogoutAsync(string refreshToken);

    /// <summary>
    /// Logs out a user from all devices
    /// </summary>
    /// <param name="userId">User ID</param>
    Task LogoutAllAsync(Guid userId);
}
