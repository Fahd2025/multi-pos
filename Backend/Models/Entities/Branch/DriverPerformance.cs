namespace Backend.Models.Entities.Branch;

/// <summary>
/// Tracks individual delivery performance metrics for driver evaluation and analytics
/// </summary>
public class DriverPerformance
{
    /// <summary>
    /// Unique identifier for the performance record
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Foreign key to Driver
    /// </summary>
    public Guid DriverId { get; set; }

    /// <summary>
    /// Foreign key to DeliveryOrder
    /// </summary>
    public Guid DeliveryOrderId { get; set; }

    /// <summary>
    /// Total delivery time in minutes (from assignment to completion)
    /// </summary>
    public int DeliveryTimeMinutes { get; set; }

    /// <summary>
    /// Customer rating (1-5 stars, nullable if not provided)
    /// </summary>
    public decimal? CustomerRating { get; set; }

    /// <summary>
    /// Optional customer feedback text
    /// </summary>
    public string? CustomerFeedback { get; set; }

    /// <summary>
    /// Whether the delivery was completed on time
    /// </summary>
    public bool OnTime { get; set; }

    /// <summary>
    /// Timestamp when the performance was recorded
    /// </summary>
    public DateTime RecordedAt { get; set; }

    // Navigation properties
    /// <summary>
    /// Navigation to Driver entity
    /// </summary>
    public Driver Driver { get; set; } = null!;

    /// <summary>
    /// Navigation to DeliveryOrder entity
    /// </summary>
    public DeliveryOrder DeliveryOrder { get; set; } = null!;
}
