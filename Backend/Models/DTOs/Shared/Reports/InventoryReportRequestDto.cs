namespace Backend.Models.DTOs.Shared.Reports;

/// <summary>
/// Request DTO for generating inventory reports
/// </summary>
public class InventoryReportRequestDto
{
    /// <summary>
    /// Filter by branch ID (Head Office Admin only)
    /// </summary>
    public Guid? BranchId { get; set; }

    /// <summary>
    /// Filter by category ID
    /// </summary>
    public Guid? CategoryId { get; set; }

    /// <summary>
    /// Show only products below minimum stock threshold
    /// </summary>
    public bool LowStockOnly { get; set; }

    /// <summary>
    /// Show only products with negative stock (discrepancies)
    /// </summary>
    public bool NegativeStockOnly { get; set; }

    /// <summary>
    /// Include stock movement details
    /// </summary>
    public bool IncludeMovements { get; set; }

    /// <summary>
    /// Movement start date (if IncludeMovements=true)
    /// </summary>
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// Movement end date (if IncludeMovements=true)
    /// </summary>
    public DateTime? EndDate { get; set; }
}
