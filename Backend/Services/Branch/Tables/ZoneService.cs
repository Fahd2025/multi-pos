using Backend.Data.Branch;
using Backend.Models.DTOs.Branch.Tables;
using Backend.Models.Entities.Branch;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Services.Branch.Tables;

/// <summary>
/// Service implementation for zone management operations
/// </summary>
public class ZoneService : IZoneService
{
    private readonly BranchDbContext _context;
    private readonly ILogger<ZoneService> _logger;

    public ZoneService(BranchDbContext context, ILogger<ZoneService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<ZoneDto>> GetAllZonesAsync()
    {
        return await _context.Zones
            .Where(z => z.IsActive)
            .OrderBy(z => z.DisplayOrder)
            .Select(z => new ZoneDto
            {
                Id = z.Id,
                Name = z.Name,
                Description = z.Description,
                DisplayOrder = z.DisplayOrder,
                IsActive = z.IsActive,
                TableCount = z.Tables.Count(t => t.IsActive)
            })
            .ToListAsync();
    }

    public async Task<ZoneDto?> GetZoneByIdAsync(int id)
    {
        var zone = await _context.Zones
            .Where(z => z.Id == id && z.IsActive)
            .Select(z => new ZoneDto
            {
                Id = z.Id,
                Name = z.Name,
                Description = z.Description,
                DisplayOrder = z.DisplayOrder,
                IsActive = z.IsActive,
                TableCount = z.Tables.Count(t => t.IsActive)
            })
            .FirstOrDefaultAsync();

        return zone;
    }

    public async Task<ZoneDto> CreateZoneAsync(CreateZoneDto dto, string userId)
    {
        var zone = new Zone
        {
            Name = dto.Name,
            Description = dto.Description,
            DisplayOrder = dto.DisplayOrder,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        _context.Zones.Add(zone);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Zone created: {ZoneName} (ID: {ZoneId}) by user {UserId}",
            zone.Name, zone.Id, userId);

        return new ZoneDto
        {
            Id = zone.Id,
            Name = zone.Name,
            Description = zone.Description,
            DisplayOrder = zone.DisplayOrder,
            IsActive = zone.IsActive,
            TableCount = 0
        };
    }

    public async Task<ZoneDto> UpdateZoneAsync(int id, UpdateZoneDto dto, string userId)
    {
        var zone = await _context.Zones.FindAsync(id);
        if (zone == null)
            throw new KeyNotFoundException($"Zone with ID {id} not found");

        zone.Name = dto.Name;
        zone.Description = dto.Description;
        zone.DisplayOrder = dto.DisplayOrder;
        zone.IsActive = dto.IsActive;
        zone.UpdatedAt = DateTime.UtcNow;
        zone.UpdatedBy = userId;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Zone updated: {ZoneName} (ID: {ZoneId}) by user {UserId}",
            zone.Name, zone.Id, userId);

        return new ZoneDto
        {
            Id = zone.Id,
            Name = zone.Name,
            Description = zone.Description,
            DisplayOrder = zone.DisplayOrder,
            IsActive = zone.IsActive,
            TableCount = await _context.Tables.CountAsync(t => t.ZoneId == id && t.IsActive)
        };
    }

    public async Task<bool> DeleteZoneAsync(int id)
    {
        var zone = await _context.Zones.FindAsync(id);
        if (zone == null)
            return false;

        // Check for tables in this zone
        var hasActiveTables = await _context.Tables
            .AnyAsync(t => t.ZoneId == id && t.IsActive);

        if (hasActiveTables)
        {
            throw new InvalidOperationException("Cannot delete zone with active tables. Please reassign or delete tables first.");
        }

        // Soft delete
        zone.IsActive = false;
        zone.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Zone soft-deleted: {ZoneName} (ID: {ZoneId})", zone.Name, zone.Id);

        return true;
    }
}
