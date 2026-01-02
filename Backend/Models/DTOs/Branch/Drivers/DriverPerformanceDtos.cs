namespace Backend.Models.DTOs.Branch.Drivers;

/// <summary>
/// Response DTO for driver performance records
/// </summary>
public class DriverPerformanceDto
{
    public Guid Id { get; set; }
    public Guid DeliveryOrderId { get; set; }
    public string OrderNumber { get; set; } = "";
    public int DeliveryTimeMinutes { get; set; }
    public decimal? CustomerRating { get; set; }
    public string? CustomerFeedback { get; set; }
    public bool OnTime { get; set; }
    public DateTime RecordedAt { get; set; }
}

/// <summary>
/// Aggregate statistics DTO for driver performance
/// </summary>
public class DriverStatsDto
{
    public Guid DriverId { get; set; }
    public int TotalDeliveries { get; set; }
    public int CompletedDeliveries { get; set; }
    public int FailedDeliveries { get; set; }
    public decimal AverageRating { get; set; }
    public int AverageDeliveryTimeMinutes { get; set; }
    public decimal OnTimePercentage { get; set; }
    public int ActiveDeliveries { get; set; }
}

/// <summary>
/// DTO for creating a new performance record
/// </summary>
public class RecordPerformanceDto
{
    public Guid DeliveryOrderId { get; set; }
    public int DeliveryTimeMinutes { get; set; }
    public decimal? CustomerRating { get; set; }
    public string? CustomerFeedback { get; set; }
    public bool OnTime { get; set; }
}
