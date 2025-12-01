using Backend.Data;
using Backend.Models.DTOs.Auth;
using Backend.Services.Auth;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Endpoints;

/// <summary>
/// Authentication and authorization endpoints
/// </summary>
public static class AuthEndpoints
{
    /// <summary>
    /// Maps authentication endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var authGroup = app.MapGroup("/api/v1/auth").WithTags("Authentication");

        // POST /api/v1/auth/login - Authenticate user
        authGroup
            .MapPost(
                "/login",
                async (
                    [FromBody] LoginRequest loginRequest,
                    IAuthService authService,
                    HttpContext httpContext
                ) =>
                {
                    try
                    {
                        // Get client IP and user agent
                        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
                        var userAgent = httpContext.Request.Headers.UserAgent.ToString();

                        var result = await authService.LoginAsync(loginRequest, ipAddress, userAgent);

                        if (result == null)
                        {
                            return Results.Unauthorized();
                        }

                        // Set refresh token as HTTP-only cookie
                        httpContext.Response.Cookies.Append(
                            "refreshToken",
                            result.RefreshToken,
                            new CookieOptions
                            {
                                HttpOnly = true,
                                Secure = true,
                                SameSite = SameSiteMode.Strict,
                                Expires = DateTimeOffset.UtcNow.AddDays(7),
                            }
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = new
                                {
                                    accessToken = result.AccessToken,
                                    accessTokenExpiresIn = 900, // 15 minutes in seconds
                                    user = result.User,
                                },
                                message = "Login successful",
                            }
                        );
                    }
                    catch (UnauthorizedAccessException)
                    {
                        return Results.Unauthorized();
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.NotFound(
                            new
                            {
                                success = false,
                                error = new { code = "BRANCH_NOT_FOUND", message = ex.Message },
                            }
                        );
                    }
                }
            )
            .WithName("Login")
            .WithOpenApi();

        // POST /api/v1/auth/logout - Logout user
        authGroup
            .MapPost(
                "/logout",
                async (HttpContext httpContext, IAuthService authService) =>
                {
                    try
                    {
                        // Get refresh token from cookie
                        var refreshToken = httpContext.Request.Cookies["refreshToken"];

                        if (!string.IsNullOrEmpty(refreshToken))
                        {
                            await authService.LogoutAsync(refreshToken);
                        }

                        // Clear refresh token cookie
                        httpContext.Response.Cookies.Delete("refreshToken");

                        return Results.Ok(new { success = true, message = "Logout successful" });
                    }
                    catch (Exception)
                    {
                        // Even if logout fails, clear the cookie
                        return Results.Ok(new { success = true, message = "Logout successful" });
                    }
                }
            )
            .RequireAuthorization()
            .WithName("Logout")
            .WithOpenApi();

        // POST /api/v1/auth/refresh - Refresh access token
        authGroup
            .MapPost(
                "/refresh",
                async (HttpContext httpContext, IAuthService authService) =>
                {
                    try
                    {
                        // Get refresh token from cookie
                        var refreshToken = httpContext.Request.Cookies["refreshToken"];

                        if (string.IsNullOrEmpty(refreshToken))
                        {
                            return Results.Unauthorized();
                        }

                        // Get client IP
                        var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();

                        var request = new RefreshTokenRequest { RefreshToken = refreshToken };

                        var result = await authService.RefreshTokenAsync(request, ipAddress);

                        if (result == null)
                        {
                            return Results.Unauthorized();
                        }

                        // Set new refresh token as HTTP-only cookie
                        httpContext.Response.Cookies.Append(
                            "refreshToken",
                            result.RefreshToken,
                            new CookieOptions
                            {
                                HttpOnly = true,
                                Secure = true,
                                SameSite = SameSiteMode.Strict,
                                Expires = DateTimeOffset.UtcNow.AddDays(7),
                            }
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = new
                                {
                                    accessToken = result.AccessToken,
                                    accessTokenExpiresIn = 900, // 15 minutes in seconds
                                },
                                message = "Token refreshed successfully",
                            }
                        );
                    }
                    catch (UnauthorizedAccessException)
                    {
                        return Results.Unauthorized();
                    }
                }
            )
            .WithName("RefreshToken")
            .WithOpenApi();

        // GET /api/v1/auth/me - Get current user info
        authGroup
            .MapGet(
                "/me",
                async (HttpContext httpContext, HeadOfficeDbContext headOfficeDb) =>
                {
                    try
                    {
                        // Get user ID from JWT claims
                        var userId = httpContext.Items["UserId"] as Guid?;
                        if (!userId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        var user = await headOfficeDb
                            .Users.Include(u => u.BranchUsers)
                            .ThenInclude(bu => bu.Branch)
                            .FirstOrDefaultAsync(u => u.Id == userId.Value);

                        if (user == null)
                        {
                            return Results.NotFound(
                                new
                                {
                                    success = false,
                                    error = new { code = "USER_NOT_FOUND", message = "User not found" },
                                }
                            );
                        }

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = new
                                {
                                    id = user.Id,
                                    username = user.Username,
                                    email = user.Email,
                                    fullNameEn = user.FullNameEn,
                                    fullNameAr = user.FullNameAr,
                                    phone = user.Phone,
                                    preferredLanguage = user.PreferredLanguage,
                                    isHeadOfficeAdmin = user.IsHeadOfficeAdmin,
                                    isActive = user.IsActive,
                                    lastLoginAt = user.LastLoginAt,
                                    branches = user
                                        .BranchUsers.Select(bu => new
                                        {
                                            branchId = bu.BranchId,
                                            branchCode = bu.Branch?.Code,
                                            branchNameEn = bu.Branch?.NameEn,
                                            branchNameAr = bu.Branch?.NameAr,
                                            role = bu.Role.ToString(),
                                        })
                                        .ToList(),
                                },
                            }
                        );
                    }
                    catch (Exception ex)
                    {
                        return Results.Problem(ex.Message);
                    }
                }
            )
            .RequireAuthorization()
            .WithName("GetCurrentUser")
            .WithOpenApi();

        return app;
    }
}
