using System.ComponentModel.DataAnnotations;
using Backend.Models.Entities.Branch;

namespace Backend.Models.DTOs.Branch.Drivers;

public class CreateDriverDto
{
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string NameEn { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? NameAr { get; set; }

    [Required]
    [MaxLength(50)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Email { get; set; }

    [MaxLength(500)]
    public string? AddressEn { get; set; }

    [MaxLength(500)]
    public string? AddressAr { get; set; }

    [Required]
    [MaxLength(50)]
    public string LicenseNumber { get; set; } = string.Empty;

    [Required]
    public DateTime LicenseExpiryDate { get; set; }

    [MaxLength(50)]
    public string? VehicleNumber { get; set; }

    [MaxLength(100)]
    public string? VehicleType { get; set; }

    [MaxLength(50)]
    public string? VehicleColor { get; set; }

    [MaxLength(500)]
    public string? ProfileImagePath { get; set; }

    [MaxLength(500)]
    public string? LicenseImagePath { get; set; }

    [MaxLength(500)]
    public string? VehicleImagePath { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public bool IsAvailable { get; set; } = true;
}

public class UpdateDriverDto
{
    [MaxLength(200)]
    public string? NameEn { get; set; }

    [MaxLength(200)]
    public string? NameAr { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(255)]
    public string? Email { get; set; }

    [MaxLength(500)]
    public string? AddressEn { get; set; }

    [MaxLength(500)]
    public string? AddressAr { get; set; }

    [MaxLength(50)]
    public string? LicenseNumber { get; set; }

    public DateTime? LicenseExpiryDate { get; set; }

    [MaxLength(50)]
    public string? VehicleNumber { get; set; }

    [MaxLength(100)]
    public string? VehicleType { get; set; }

    [MaxLength(50)]
    public string? VehicleColor { get; set; }

    [MaxLength(500)]
    public string? ProfileImagePath { get; set; }

    [MaxLength(500)]
    public string? LicenseImagePath { get; set; }

    [MaxLength(500)]
    public string? VehicleImagePath { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public bool? IsAvailable { get; set; }
}

public class DriverDto
{
    public Guid Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public string NameEn { get; set; } = string.Empty;

    public string? NameAr { get; set; }

    public string Phone { get; set; } = string.Empty;

    public string? Email { get; set; }

    public string? AddressEn { get; set; }

    public string? AddressAr { get; set; }

    public string LicenseNumber { get; set; } = string.Empty;

    public DateTime LicenseExpiryDate { get; set; }

    public string? VehicleNumber { get; set; }

    public string? VehicleType { get; set; }

    public string? VehicleColor { get; set; }

    public string? ProfileImagePath { get; set; }

    public string? LicenseImagePath { get; set; }

    public string? VehicleImagePath { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsAvailable { get; set; } = true;

    public int TotalDeliveries { get; set; } = 0;

    public decimal? AverageRating { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public int ActiveDeliveryOrdersCount { get; set; } = 0;
}