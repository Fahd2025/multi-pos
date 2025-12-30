using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models.Entities.Branch;

/// <summary>
/// Represents a cash drawer session at a branch.
/// Tracks opening/closing balances and cash transactions during the session.
/// </summary>
public class CashDrawer
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The branch this cash drawer belongs to
    /// </summary>
    [Required]
    public Guid BranchId { get; set; }

    /// <summary>
    /// User who opened the cash drawer
    /// </summary>
    [Required]
    public Guid OpenedBy { get; set; }

    /// <summary>
    /// When the cash drawer was opened
    /// </summary>
    [Required]
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Initial cash amount when drawer was opened
    /// </summary>
    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal OpeningBalance { get; set; }

    /// <summary>
    /// User who closed the cash drawer (null if still open)
    /// </summary>
    public Guid? ClosedBy { get; set; }

    /// <summary>
    /// When the cash drawer was closed (null if still open)
    /// </summary>
    public DateTime? ClosedAt { get; set; }

    /// <summary>
    /// Expected closing balance based on opening balance + sales - transactions
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal ExpectedCash { get; set; }

    /// <summary>
    /// Actual cash counted when drawer was closed
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? ActualCash { get; set; }

    /// <summary>
    /// Difference between expected and actual cash (ActualCash - ExpectedCash)
    /// Positive = overage, Negative = shortage
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? Variance { get; set; }

    /// <summary>
    /// Current status of the cash drawer
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = CashDrawerStatus.Open;

    /// <summary>
    /// Denomination breakdown when closing (JSON format)
    /// Example: {"bills": {"100": 5, "50": 10}, "coins": {"1": 20, "0.25": 40}}
    /// </summary>
    [Column(TypeName = "nvarchar(max)")]
    public string? DenominationBreakdown { get; set; }

    /// <summary>
    /// Optional notes about the drawer session
    /// </summary>
    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation properties
    public User? OpenedByUser { get; set; }
    public User? ClosedByUser { get; set; }
    public ICollection<CashTransaction> Transactions { get; set; } = new List<CashTransaction>();
}

/// <summary>
/// Cash drawer status constants
/// </summary>
public static class CashDrawerStatus
{
    public const string Open = "Open";
    public const string Closed = "Closed";
    public const string Reconciled = "Reconciled";
}
