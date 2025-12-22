using Backend.Models.DTOs.Branch.Tables;

namespace Backend.Services.Branch.Tables;

/// <summary>
/// Service interface for zone management operations
/// </summary>
public interface IZoneService
{
    /// <summary>
    /// Get all zones
    /// </summary>
    Task<IEnumerable<ZoneDto>> GetAllZonesAsync();

    /// <summary>
    /// Get zone by ID
    /// </summary>
    Task<ZoneDto?> GetZoneByIdAsync(int id);

    /// <summary>
    /// Create a new zone
    /// </summary>
    Task<ZoneDto> CreateZoneAsync(CreateZoneDto dto, string userId);

    /// <summary>
    /// Update zone information
    /// </summary>
    Task<ZoneDto> UpdateZoneAsync(int id, UpdateZoneDto dto, string userId);

    /// <summary>
    /// Delete zone (soft delete)
    /// </summary>
    Task<bool> DeleteZoneAsync(int id);
}
