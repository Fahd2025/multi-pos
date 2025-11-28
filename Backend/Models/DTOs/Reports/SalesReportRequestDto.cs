namespace Backend.Models.DTOs.Reports;

/// <summary>
/// Request DTO for generating sales reports
/// </summary>
public class SalesReportRequestDto
{
    /// <summary>
    /// Report start date (default: 30 days ago)
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// Report end date (default: now)
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Filter by branch ID (Head Office Admin only)
    /// </summary>
    public Guid? BranchId { get; set; }

    /// <summary>
    /// Filter by cashier ID
    /// </summary>
    public Guid? CashierId { get; set; }

    /// <summary>
    /// Filter by customer ID
    /// </summary>
    public Guid? CustomerId { get; set; }

    /// <summary>
    /// Filter by payment method (Cash, Card, Both)
    /// </summary>
    public string? PaymentMethod { get; set; }

    /// <summary>
    /// Group results by: day, week, month (default: day)
    /// </summary>
    public string? GroupBy { get; set; }
}
