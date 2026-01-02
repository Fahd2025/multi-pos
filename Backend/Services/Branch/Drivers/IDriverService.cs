using Backend.Models.DTOs.Branch.Drivers;
using Backend.Models.Entities.Branch;

namespace Backend.Services.Branch.Drivers;

public interface IDriverService
{
    // Basic CRUD operations
    Task<DriverDto?> GetDriverByIdAsync(Guid id, string branchCode);
    Task<IEnumerable<DriverDto>> GetAllDriversAsync(string branchCode, bool? isActive = null, bool? isAvailable = null);
    Task<DriverDto> CreateDriverAsync(CreateDriverDto createDriverDto, Guid createdById, string branchCode);
    Task<DriverDto?> UpdateDriverAsync(Guid id, UpdateDriverDto updateDriverDto, string branchCode);
    Task<bool> DeleteDriverAsync(Guid id, string branchCode);
    Task<DriverDto?> GetDriverByCodeAsync(string code, string branchCode);

    // Availability management
    Task<DriverDto> UpdateDriverAvailabilityAsync(Guid driverId, bool isAvailable, string branchCode);
    Task<IEnumerable<DriverDto>> GetAvailableDriversAsync(string branchCode);

    // Performance tracking
    Task<DriverPerformanceDto> RecordDeliveryPerformanceAsync(RecordPerformanceDto dto, string branchCode);
    Task<DriverStatsDto> GetDriverStatsAsync(Guid driverId, DateTime? from, DateTime? to, string branchCode);
    Task<IEnumerable<DriverPerformanceDto>> GetDriverPerformanceHistoryAsync(Guid driverId, int page, int pageSize, string branchCode);

    // Workload management
    Task<int> GetDriverActiveDeliveriesCountAsync(Guid driverId, string branchCode);
}