using Backend.Data.Branch;
using Backend.Models.DTOs.Branch.Drivers;
using Backend.Models.Entities.Branch;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Branch.Drivers;

public class DriverService : IDriverService
{
    private readonly BranchDbContext _context;

    public DriverService(BranchDbContext context)
    {
        _context = context;
    }

    public async Task<DriverDto?> GetDriverByIdAsync(Guid id, string branchCode)
    {
        var driver = await _context.Drivers
            .Where(d => d.Id == id)
            .Select(d => new DriverDto
            {
                Id = d.Id,
                Code = d.Code,
                NameEn = d.NameEn,
                NameAr = d.NameAr,
                Phone = d.Phone,
                Email = d.Email,
                AddressEn = d.AddressEn,
                AddressAr = d.AddressAr,
                LicenseNumber = d.LicenseNumber,
                LicenseExpiryDate = d.LicenseExpiryDate,
                VehicleNumber = d.VehicleNumber,
                VehicleType = d.VehicleType,
                VehicleColor = d.VehicleColor,
                ProfileImagePath = d.ProfileImagePath,
                LicenseImagePath = d.LicenseImagePath,
                VehicleImagePath = d.VehicleImagePath,
                IsActive = d.IsActive,
                IsAvailable = d.IsAvailable,
                TotalDeliveries = d.TotalDeliveries,
                AverageRating = d.AverageRating,
                Notes = d.Notes,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt,
                ActiveDeliveryOrdersCount = _context.DeliveryOrders.Count(deliveryOrder => deliveryOrder.DriverId == d.Id && deliveryOrder.DeliveryStatus != DeliveryStatus.Delivered && deliveryOrder.DeliveryStatus != DeliveryStatus.Failed)
            })
            .FirstOrDefaultAsync();

        return driver;
    }

    public async Task<IEnumerable<DriverDto>> GetAllDriversAsync(string branchCode, bool? isActive = null, bool? isAvailable = null)
    {
        var query = _context.Drivers.AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(d => d.IsActive == isActive.Value);
        }

        if (isAvailable.HasValue)
        {
            query = query.Where(d => d.IsAvailable == isAvailable.Value);
        }

        var drivers = await query
            .Select(d => new DriverDto
            {
                Id = d.Id,
                Code = d.Code,
                NameEn = d.NameEn,
                NameAr = d.NameAr,
                Phone = d.Phone,
                Email = d.Email,
                AddressEn = d.AddressEn,
                AddressAr = d.AddressAr,
                LicenseNumber = d.LicenseNumber,
                LicenseExpiryDate = d.LicenseExpiryDate,
                VehicleNumber = d.VehicleNumber,
                VehicleType = d.VehicleType,
                VehicleColor = d.VehicleColor,
                ProfileImagePath = d.ProfileImagePath,
                LicenseImagePath = d.LicenseImagePath,
                VehicleImagePath = d.VehicleImagePath,
                IsActive = d.IsActive,
                IsAvailable = d.IsAvailable,
                TotalDeliveries = d.TotalDeliveries,
                AverageRating = d.AverageRating,
                Notes = d.Notes,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt,
                ActiveDeliveryOrdersCount = _context.DeliveryOrders.Count(deliveryOrder => deliveryOrder.DriverId == d.Id && deliveryOrder.DeliveryStatus != DeliveryStatus.Delivered && deliveryOrder.DeliveryStatus != DeliveryStatus.Failed)
            })
            .ToListAsync();

        return drivers;
    }

    public async Task<DriverDto> CreateDriverAsync(CreateDriverDto createDriverDto, Guid createdById, string branchCode)
    {
        // Check if driver code already exists
        var existingDriver = await _context.Drivers
            .AnyAsync(d => d.Code == createDriverDto.Code);

        if (existingDriver)
        {
            throw new InvalidOperationException($"Driver with code '{createDriverDto.Code}' already exists");
        }

        var driver = new Driver
        {
            Id = Guid.NewGuid(),
            Code = createDriverDto.Code,
            NameEn = createDriverDto.NameEn,
            NameAr = createDriverDto.NameAr,
            Phone = createDriverDto.Phone,
            Email = createDriverDto.Email,
            AddressEn = createDriverDto.AddressEn,
            AddressAr = createDriverDto.AddressAr,
            LicenseNumber = createDriverDto.LicenseNumber,
            LicenseExpiryDate = createDriverDto.LicenseExpiryDate,
            VehicleNumber = createDriverDto.VehicleNumber,
            VehicleType = createDriverDto.VehicleType,
            VehicleColor = createDriverDto.VehicleColor,
            ProfileImagePath = createDriverDto.ProfileImagePath,
            LicenseImagePath = createDriverDto.LicenseImagePath,
            VehicleImagePath = createDriverDto.VehicleImagePath,
            Notes = createDriverDto.Notes,
            IsActive = true, // New drivers are active by default
            IsAvailable = createDriverDto.IsAvailable,
            TotalDeliveries = 0,
            AverageRating = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = createdById
        };

        _context.Drivers.Add(driver);
        await _context.SaveChangesAsync();

        return new DriverDto
        {
            Id = driver.Id,
            Code = driver.Code,
            NameEn = driver.NameEn,
            NameAr = driver.NameAr,
            Phone = driver.Phone,
            Email = driver.Email,
            AddressEn = driver.AddressEn,
            AddressAr = driver.AddressAr,
            LicenseNumber = driver.LicenseNumber,
            LicenseExpiryDate = driver.LicenseExpiryDate,
            VehicleNumber = driver.VehicleNumber,
            VehicleType = driver.VehicleType,
            VehicleColor = driver.VehicleColor,
            ProfileImagePath = driver.ProfileImagePath,
            LicenseImagePath = driver.LicenseImagePath,
            VehicleImagePath = driver.VehicleImagePath,
            IsActive = driver.IsActive,
            IsAvailable = driver.IsAvailable,
            TotalDeliveries = driver.TotalDeliveries,
            AverageRating = driver.AverageRating,
            Notes = driver.Notes,
            CreatedAt = driver.CreatedAt,
            UpdatedAt = driver.UpdatedAt,
            ActiveDeliveryOrdersCount = 0
        };
    }

    public async Task<DriverDto?> UpdateDriverAsync(Guid id, UpdateDriverDto updateDriverDto, string branchCode)
    {
        var driver = await _context.Drivers.FindAsync(id);
        if (driver == null)
        {
            return null;
        }

        // Update only provided fields
        if (!string.IsNullOrEmpty(updateDriverDto.NameEn))
            driver.NameEn = updateDriverDto.NameEn;
        
        if (!string.IsNullOrEmpty(updateDriverDto.NameAr))
            driver.NameAr = updateDriverDto.NameAr;
        
        if (!string.IsNullOrEmpty(updateDriverDto.Phone))
            driver.Phone = updateDriverDto.Phone;
        
        if (!string.IsNullOrEmpty(updateDriverDto.Email))
            driver.Email = updateDriverDto.Email;
        
        if (!string.IsNullOrEmpty(updateDriverDto.AddressEn))
            driver.AddressEn = updateDriverDto.AddressEn;
        
        if (!string.IsNullOrEmpty(updateDriverDto.AddressAr))
            driver.AddressAr = updateDriverDto.AddressAr;
        
        if (!string.IsNullOrEmpty(updateDriverDto.LicenseNumber))
            driver.LicenseNumber = updateDriverDto.LicenseNumber;
        
        if (updateDriverDto.LicenseExpiryDate.HasValue)
            driver.LicenseExpiryDate = updateDriverDto.LicenseExpiryDate.Value;
        
        if (!string.IsNullOrEmpty(updateDriverDto.VehicleNumber))
            driver.VehicleNumber = updateDriverDto.VehicleNumber;
        
        if (!string.IsNullOrEmpty(updateDriverDto.VehicleType))
            driver.VehicleType = updateDriverDto.VehicleType;
        
        if (!string.IsNullOrEmpty(updateDriverDto.VehicleColor))
            driver.VehicleColor = updateDriverDto.VehicleColor;
        
        if (!string.IsNullOrEmpty(updateDriverDto.ProfileImagePath))
            driver.ProfileImagePath = updateDriverDto.ProfileImagePath;
        
        if (!string.IsNullOrEmpty(updateDriverDto.LicenseImagePath))
            driver.LicenseImagePath = updateDriverDto.LicenseImagePath;
        
        if (!string.IsNullOrEmpty(updateDriverDto.VehicleImagePath))
            driver.VehicleImagePath = updateDriverDto.VehicleImagePath;
        
        if (!string.IsNullOrEmpty(updateDriverDto.Notes))
            driver.Notes = updateDriverDto.Notes;
        
        if (updateDriverDto.IsAvailable.HasValue)
            driver.IsAvailable = updateDriverDto.IsAvailable.Value;

        driver.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new DriverDto
        {
            Id = driver.Id,
            Code = driver.Code,
            NameEn = driver.NameEn,
            NameAr = driver.NameAr,
            Phone = driver.Phone,
            Email = driver.Email,
            AddressEn = driver.AddressEn,
            AddressAr = driver.AddressAr,
            LicenseNumber = driver.LicenseNumber,
            LicenseExpiryDate = driver.LicenseExpiryDate,
            VehicleNumber = driver.VehicleNumber,
            VehicleType = driver.VehicleType,
            VehicleColor = driver.VehicleColor,
            ProfileImagePath = driver.ProfileImagePath,
            LicenseImagePath = driver.LicenseImagePath,
            VehicleImagePath = driver.VehicleImagePath,
            IsActive = driver.IsActive,
            IsAvailable = driver.IsAvailable,
            TotalDeliveries = driver.TotalDeliveries,
            AverageRating = driver.AverageRating,
            Notes = driver.Notes,
            CreatedAt = driver.CreatedAt,
            UpdatedAt = driver.UpdatedAt,
            ActiveDeliveryOrdersCount = _context.DeliveryOrders.Count(deliveryOrder => deliveryOrder.DriverId == driver.Id && deliveryOrder.DeliveryStatus != DeliveryStatus.Delivered && deliveryOrder.DeliveryStatus != DeliveryStatus.Failed)
        };
    }

    public async Task<bool> DeleteDriverAsync(Guid id, string branchCode)
    {
        var driver = await _context.Drivers.FindAsync(id);
        if (driver == null)
        {
            return false;
        }

        // Instead of deleting, set IsActive to false to preserve history
        driver.IsActive = false;
        driver.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<DriverDto?> GetDriverByCodeAsync(string code, string branchCode)
    {
        var driver = await _context.Drivers
            .Where(d => d.Code == code)
            .Select(d => new DriverDto
            {
                Id = d.Id,
                Code = d.Code,
                NameEn = d.NameEn,
                NameAr = d.NameAr,
                Phone = d.Phone,
                Email = d.Email,
                AddressEn = d.AddressEn,
                AddressAr = d.AddressAr,
                LicenseNumber = d.LicenseNumber,
                LicenseExpiryDate = d.LicenseExpiryDate,
                VehicleNumber = d.VehicleNumber,
                VehicleType = d.VehicleType,
                VehicleColor = d.VehicleColor,
                ProfileImagePath = d.ProfileImagePath,
                LicenseImagePath = d.LicenseImagePath,
                VehicleImagePath = d.VehicleImagePath,
                IsActive = d.IsActive,
                IsAvailable = d.IsAvailable,
                TotalDeliveries = d.TotalDeliveries,
                AverageRating = d.AverageRating,
                Notes = d.Notes,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt,
                ActiveDeliveryOrdersCount = _context.DeliveryOrders.Count(deliveryOrder => deliveryOrder.DriverId == d.Id && deliveryOrder.DeliveryStatus != DeliveryStatus.Delivered && deliveryOrder.DeliveryStatus != DeliveryStatus.Failed)
            })
            .FirstOrDefaultAsync();

        return driver;
    }
}