using Backend.Models.DTOs.Branch.Drivers;
using Backend.Models.Entities.Branch;

namespace Backend.Services.Branch.Drivers;

public interface IDriverService
{
    Task<DriverDto?> GetDriverByIdAsync(Guid id, string branchCode);
    Task<IEnumerable<DriverDto>> GetAllDriversAsync(string branchCode, bool? isActive = null, bool? isAvailable = null);
    Task<DriverDto> CreateDriverAsync(CreateDriverDto createDriverDto, Guid createdById, string branchCode);
    Task<DriverDto?> UpdateDriverAsync(Guid id, UpdateDriverDto updateDriverDto, string branchCode);
    Task<bool> DeleteDriverAsync(Guid id, string branchCode);
    Task<DriverDto?> GetDriverByCodeAsync(string code, string branchCode);
}