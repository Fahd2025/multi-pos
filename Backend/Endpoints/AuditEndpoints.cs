using Backend.Services.Audit;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Endpoints;

/// <summary>
/// Audit endpoints for tracking and retrieving audit logs
/// </summary>
public static class AuditEndpoints
{
    /// <summary>
    /// Maps audit endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapAuditEndpoints(this IEndpointRouteBuilder app)
    {
        var auditGroup = app.MapGroup("/api/v1/audit").WithTags("Audit");

        // GET /api/v1/audit/logs - Get audit logs (admin only)
        auditGroup
            .MapGet(
                "/logs",
                async (
                    HttpContext httpContext,
                    IAuditService auditService,
                    Guid? userId = null,
                    Guid? branchId = null,
                    string? eventType = null,
                    string? action = null,
                    DateTime? fromDate = null,
                    DateTime? toDate = null,
                    int page = 1,
                    int pageSize = 50
                ) =>
                {
                    try
                    {
                        // Check if user is head office admin
                        if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
                        {
                            return Results.Forbid();
                        }

                        var (logs, totalCount) = await auditService.GetAuditLogsAsync(
                            userId,
                            branchId,
                            eventType,
                            action,
                            fromDate,
                            toDate,
                            page,
                            pageSize
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = new
                                {
                                    logs,
                                    pagination = new
                                    {
                                        page,
                                        pageSize,
                                        totalCount,
                                        totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                                    },
                                },
                            }
                        );
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("GetAuditLogs")
            .WithOpenApi();

        // GET /api/v1/audit/user/:userId - Get user audit trail
        auditGroup
            .MapGet(
                "/user/{userId:guid}",
                async (
                    Guid userId,
                    HttpContext httpContext,
                    IAuditService auditService,
                    DateTime? fromDate = null,
                    DateTime? toDate = null,
                    int page = 1,
                    int pageSize = 50
                ) =>
                {
                    try
                    {
                        var currentUserId = httpContext.Items["UserId"] as Guid?;
                        if (!currentUserId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        // Users can view their own audit trail, or admins can view anyone's
                        var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;
                        if (!isHeadOfficeAdmin && currentUserId.Value != userId)
                        {
                            return Results.Forbid();
                        }

                        var logs = await auditService.GetUserAuditTrailAsync(
                            userId,
                            fromDate,
                            toDate,
                            page,
                            pageSize
                        );

                        return Results.Ok(new { success = true, data = logs });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("GetUserAuditTrail")
            .WithOpenApi();

        return app;
    }
}
