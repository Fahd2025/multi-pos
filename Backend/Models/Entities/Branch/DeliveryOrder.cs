using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models.Entities.Branch;

public class DeliveryOrder
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid OrderId { get; set; } // References the Sale.Id
    
    public Guid? CustomerId { get; set; } // Redundant but kept for convenience
    
    public Guid? DriverId { get; set; } // Driver assigned to this delivery

    [MaxLength(500)]
    public string PickupAddress { get; set; } = string.Empty; // Where to pick up the order

    [Required]
    [MaxLength(500)]
    public string DeliveryAddress { get; set; } = string.Empty; // Destination for delivery

    public string? DeliveryLocation { get; set; } // JSON field for GPS coordinates or detailed location info (stored as text/JSON)

    public DateTime? EstimatedDeliveryTime { get; set; }
    
    public DateTime? ActualDeliveryTime { get; set; }
    
    [Required]
    public DeliveryStatus DeliveryStatus { get; set; } = DeliveryStatus.Pending; // Current status of the delivery

    public DeliveryPriority Priority { get; set; } = DeliveryPriority.Normal; // Delivery priority level

    [MaxLength(1000)]
    public string? SpecialInstructions { get; set; } // Any special instructions for the driver

    public int? EstimatedDeliveryMinutes { get; set; } // Estimated delivery time in minutes

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public Guid CreatedBy { get; set; }

    // Navigation properties
    [ForeignKey("OrderId")]
    public virtual Sale? Sale { get; set; }
    
    [ForeignKey("CustomerId")]
    public virtual Customer? Customer { get; set; }
    
    [ForeignKey("DriverId")]
    public virtual Driver? Driver { get; set; }
}

public enum DeliveryStatus
{
    Pending = 0,      // Order created but not assigned to a driver
    Assigned = 1,     // Driver assigned but not yet out for delivery
    OutForDelivery = 2, // Driver is on the way to delivery location
    Delivered = 3,    // Order has been delivered successfully
    Failed = 4        // Delivery failed (returned, refused, cancelled, etc.)
}

public enum DeliveryPriority
{
    Low = 0,
    Normal = 1,
    High = 2,
    Urgent = 3
}