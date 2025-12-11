using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class Driver
{
    [Key]
    public Guid Id { get; set; }

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

    /// <summary>
    /// Whether the driver is active in the system
    /// </summary>
    [Required]
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Whether the driver is currently available for delivery orders
    /// </summary>
    [Required]
    public bool IsAvailable { get; set; } = true;

    /// <summary>
    /// Total number of completed deliveries
    /// </summary>
    [Required]
    public int TotalDeliveries { get; set; } = 0;

    /// <summary>
    /// Average rating (0.0 to 5.0)
    /// </summary>
    public decimal? AverageRating { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public Guid CreatedBy { get; set; }

    // TODO: Add navigation properties when DeliveryOrder entity is created
    // public ICollection<DeliveryOrder> DeliveryOrders { get; set; } = new List<DeliveryOrder>();
}
