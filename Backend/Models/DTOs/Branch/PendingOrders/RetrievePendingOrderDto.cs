namespace Backend.Models.DTOs.Branch.PendingOrders;

/// <summary>
/// DTO for retrieving a pending order (same as PendingOrderDto but with explicit purpose)
/// </summary>
public class RetrievePendingOrderDto : PendingOrderDto
{
    /// <summary>
    /// Indicates if this order was just retrieved
    /// </summary>
    public bool WasRetrieved { get; set; }

    /// <summary>
    /// Timestamp when the order was retrieved
    /// </summary>
    public DateTime? RetrievalTimestamp { get; set; }
}
