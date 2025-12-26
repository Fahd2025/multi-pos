namespace Backend.Models.Enums;

/// <summary>
/// Represents the status of a pending order in the POS system
/// </summary>
public enum PendingOrderStatus
{
    /// <summary>
    /// Order is being created (temporary state)
    /// </summary>
    Draft = 0,

    /// <summary>
    /// Order is temporarily saved (quick save)
    /// </summary>
    Parked = 1,

    /// <summary>
    /// Order is waiting for customer or preparation
    /// </summary>
    OnHold = 2,

    /// <summary>
    /// Order has been retrieved and is being processed
    /// </summary>
    Retrieved = 3
}
