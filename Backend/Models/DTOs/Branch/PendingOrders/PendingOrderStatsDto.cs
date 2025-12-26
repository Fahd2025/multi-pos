using Backend.Models.Entities.Branch;
using Backend.Models.Enums;

namespace Backend.Models.DTOs.Branch.PendingOrders;

/// <summary>
/// DTO for pending orders statistics (Manager only)
/// </summary>
public class PendingOrderStatsDto
{
    public int TotalPendingOrders { get; set; }

    public Dictionary<PendingOrderStatus, int> OrdersByStatus { get; set; } = new();

    public Dictionary<string, int> OrdersByUser { get; set; } = new();

    public Dictionary<OrderType, int> OrdersByType { get; set; } = new();

    public decimal TotalPendingValue { get; set; }

    public int OrdersExpiringSoon { get; set; } // < 30 minutes

    public int ExpiredOrders { get; set; }

    public DateTime? OldestPendingOrder { get; set; }

    public DateTime? NewestPendingOrder { get; set; }

    public double AveragePendingTimeMinutes { get; set; }
}
