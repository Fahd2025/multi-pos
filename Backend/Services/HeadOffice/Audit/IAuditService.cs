using Backend.Models.Entities.HeadOffice;

namespace Backend.Services.HeadOffice.Audit;

/// <summary>
/// Service interface for audit logging and activity tracking
/// </summary>
public interface IAuditService
{
    /// <summary>
    /// Log an audit event (permanent retention in AuditLog table)
    /// </summary>
    /// <param name="userId">User who performed the action</param>
    /// <param name="branchId">Branch where action occurred (optional)</param>
    /// <param name="eventType">Type of event (e.g., "UserManagement", "SalesTransaction")</param>
    /// <param name="action">Action performed (e.g., "Create", "Update", "Delete")</param>
    /// <param name="entityType">Type of entity affected (e.g., "User", "Sale")</param>
    /// <param name="entityId">ID of entity affected</param>
    /// <param name="oldValues">Old values (JSON string, optional)</param>
    /// <param name="newValues">New values (JSON string, optional)</param>
    /// <param name="ipAddress">Client IP address</param>
    /// <param name="userAgent">Client user agent</param>
    /// <param name="success">Whether the action succeeded</param>
    /// <param name="errorMessage">Error message if action failed</param>
    Task LogAsync(
        Guid? userId,
        Guid? branchId,
        string eventType,
        string action,
        string? entityType = null,
        Guid? entityId = null,
        string? oldValues = null,
        string? newValues = null,
        string? ipAddress = null,
        string? userAgent = null,
        bool success = true,
        string? errorMessage = null);

    /// <summary>
    /// Log user activity (circular buffer - maintains last 100 activities per user)
    /// </summary>
    /// <param name="userId">User who performed the activity</param>
    /// <param name="action">Action performed</param>
    /// <param name="entityType">Type of entity</param>
    /// <param name="entityId">ID of entity</param>
    /// <param name="details">Additional details (optional)</param>
    /// <param name="branchId">Branch context (optional)</param>
    /// <param name="ipAddress">Client IP address</param>
    /// <param name="userAgent">Client user agent</param>
    Task LogActivityAsync(
        Guid userId,
        string action,
        string entityType,
        Guid? entityId = null,
        string? details = null,
        Guid? branchId = null,
        string? ipAddress = null,
        string? userAgent = null);

    /// <summary>
    /// Get audit trail for a specific user
    /// </summary>
    Task<List<AuditLog>> GetUserAuditTrailAsync(Guid userId, DateTime? fromDate = null, DateTime? toDate = null, int page = 1, int pageSize = 50);

    /// <summary>
    /// Get recent activity for a specific user (last N activities from circular buffer)
    /// </summary>
    Task<List<UserActivityLog>> GetUserRecentActivityAsync(Guid userId, int limit = 100);

    /// <summary>
    /// Get all audit logs with filtering
    /// </summary>
    Task<(List<AuditLog> Logs, int TotalCount)> GetAuditLogsAsync(
        Guid? userId = null,
        Guid? branchId = null,
        string? eventType = null,
        string? action = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int page = 1,
        int pageSize = 50);
}
