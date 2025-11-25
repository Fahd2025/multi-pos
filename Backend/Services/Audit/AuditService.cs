using Backend.Data;
using Backend.Models.Entities.HeadOffice;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Audit;

/// <summary>
/// Service for audit logging and activity tracking
/// </summary>
public class AuditService : IAuditService
{
    private readonly HeadOfficeDbContext _context;
    private const int MaxActivitiesPerUser = 100; // Circular buffer size

    public AuditService(HeadOfficeDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(
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
        string? errorMessage = null)
    {
        var auditLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            Timestamp = DateTime.UtcNow,
            UserId = userId,
            BranchId = branchId,
            EventType = eventType,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OldValues = oldValues,
            NewValues = newValues,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Success = success,
            ErrorMessage = errorMessage
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();
    }

    public async Task LogActivityAsync(
        Guid userId,
        string action,
        string entityType,
        Guid? entityId = null,
        string? details = null,
        Guid? branchId = null,
        string? ipAddress = null,
        string? userAgent = null)
    {
        // Implement circular buffer: maintain only the last MaxActivitiesPerUser activities per user
        var userActivityCount = await _context.UserActivityLogs
            .Where(a => a.UserId == userId)
            .CountAsync();

        // If we've reached the limit, remove the oldest activity
        if (userActivityCount >= MaxActivitiesPerUser)
        {
            var activitiesToRemove = userActivityCount - MaxActivitiesPerUser + 1;
            var oldestActivities = await _context.UserActivityLogs
                .Where(a => a.UserId == userId)
                .OrderBy(a => a.Timestamp)
                .Take(activitiesToRemove)
                .ToListAsync();

            _context.UserActivityLogs.RemoveRange(oldestActivities);
        }

        // Add new activity
        var activity = new UserActivityLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Timestamp = DateTime.UtcNow,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            BranchId = branchId,
            IpAddress = ipAddress,
            UserAgent = userAgent
        };

        _context.UserActivityLogs.Add(activity);
        await _context.SaveChangesAsync();
    }

    public async Task<List<AuditLog>> GetUserAuditTrailAsync(
        Guid userId,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int page = 1,
        int pageSize = 50)
    {
        var query = _context.AuditLogs
            .Where(a => a.UserId == userId)
            .AsQueryable();

        if (fromDate.HasValue)
        {
            query = query.Where(a => a.Timestamp >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(a => a.Timestamp <= toDate.Value);
        }

        return await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<List<UserActivityLog>> GetUserRecentActivityAsync(Guid userId, int limit = 100)
    {
        return await _context.UserActivityLogs
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.Timestamp)
            .Take(Math.Min(limit, MaxActivitiesPerUser))
            .ToListAsync();
    }

    public async Task<(List<AuditLog> Logs, int TotalCount)> GetAuditLogsAsync(
        Guid? userId = null,
        Guid? branchId = null,
        string? eventType = null,
        string? action = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int page = 1,
        int pageSize = 50)
    {
        var query = _context.AuditLogs.AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(a => a.UserId == userId.Value);
        }

        if (branchId.HasValue)
        {
            query = query.Where(a => a.BranchId == branchId.Value);
        }

        if (!string.IsNullOrWhiteSpace(eventType))
        {
            query = query.Where(a => a.EventType == eventType);
        }

        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(a => a.Action == action);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(a => a.Timestamp >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(a => a.Timestamp <= toDate.Value);
        }

        var totalCount = await query.CountAsync();

        var logs = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (logs, totalCount);
    }
}
