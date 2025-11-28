namespace Backend.Models.DTOs.Reports;

/// <summary>
/// Request DTO for generating financial reports
/// </summary>
public class FinancialReportRequestDto
{
    /// <summary>
    /// Report start date (default: current month start)
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
    /// Group results by: day, week, month (default: month)
    /// </summary>
    public string? GroupBy { get; set; }
}
