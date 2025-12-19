using System.ComponentModel.DataAnnotations;
using Backend.Models.Entities.Branch;

namespace Backend.Models.DTOs.Branch.DeliveryOrders;

public class CreateDeliveryOrderDto
{
    [Required]
    public Guid OrderId { get; set; }  // References the Sale.Id

    [Required]
    [MaxLength(500)]
    public string DeliveryAddress { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? PickupAddress { get; set; } // If different from business location

    public string? DeliveryLocation { get; set; } // JSON field for GPS coordinates or detailed location info

    public DateTime? EstimatedDeliveryTime { get; set; }

    public DeliveryPriority Priority { get; set; } = DeliveryPriority.Normal;

    [MaxLength(1000)]
    public string? SpecialInstructions { get; set; }

    public int? EstimatedDeliveryMinutes { get; set; } // Estimated time in minutes
}

public class UpdateDeliveryOrderDto
{
    public Guid? DriverId { get; set; }

    public DeliveryStatus? DeliveryStatus { get; set; }

    public DateTime? EstimatedDeliveryTime { get; set; }

    public DateTime? ActualDeliveryTime { get; set; }

    [MaxLength(500)]
    public string? DeliveryAddress { get; set; }

    [MaxLength(500)]
    public string? PickupAddress { get; set; }

    [MaxLength(1000)]
    public string? SpecialInstructions { get; set; }

    public DeliveryPriority? Priority { get; set; }

    public int? EstimatedDeliveryMinutes { get; set; } // Estimated delivery time in minutes

    [MaxLength(500)]
    public string? DeliveryLocation { get; set; } // JSON field for coordinates
}

public class DeliveryOrderDto
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }
    
    public string OrderTransactionId { get; set; } = string.Empty; // From the related Sale

    public Guid? CustomerId { get; set; }
    
    public string? CustomerName { get; set; }

    public Guid? DriverId { get; set; }
    
    public string? DriverName { get; set; }

    public string PickupAddress { get; set; } = string.Empty;

    public string DeliveryAddress { get; set; } = string.Empty;

    public string? DeliveryLocation { get; set; } // JSON field for coordinates

    public DateTime? EstimatedDeliveryTime { get; set; }
    
    public DateTime? ActualDeliveryTime { get; set; }
    
    public DeliveryStatus DeliveryStatus { get; set; }

    public DeliveryPriority Priority { get; set; }

    public string? SpecialInstructions { get; set; }

    public int ItemsCount { get; set; } // Number of items in the order

    public decimal OrderTotal { get; set; } // Total amount of the order

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

