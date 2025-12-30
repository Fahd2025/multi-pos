using Backend.Models.DTOs.CashDrawer;

namespace Backend.Services.Branch.CashDrawer;

/// <summary>
/// Service interface for cash drawer operations
/// </summary>
public interface ICashDrawerService
{
    /// <summary>
    /// Opens a new cash drawer for the branch
    /// </summary>
    Task<CashDrawerDto> OpenDrawerAsync(Guid branchId, OpenDrawerDto dto, Guid userId);

    /// <summary>
    /// Closes the current open cash drawer
    /// </summary>
    Task<CashDrawerDto> CloseDrawerAsync(Guid drawerId, CloseDrawerDto dto, Guid userId);

    /// <summary>
    /// Gets the current open cash drawer for a branch
    /// </summary>
    Task<CashDrawerDto?> GetCurrentDrawerAsync(Guid branchId);

    /// <summary>
    /// Gets a cash drawer by ID
    /// </summary>
    Task<CashDrawerDto?> GetDrawerByIdAsync(Guid drawerId);

    /// <summary>
    /// Adds a cash transaction to the current drawer (petty cash, deposit, etc.)
    /// </summary>
    Task<CashTransactionDto> AddTransactionAsync(Guid drawerId, CreateCashTransactionDto dto, Guid userId);

    /// <summary>
    /// Gets cash drawer history for a branch with optional date range
    /// </summary>
    Task<List<CashDrawerDto>> GetDrawerHistoryAsync(Guid branchId, DateTime? startDate = null, DateTime? endDate = null, int page = 1, int pageSize = 50);

    /// <summary>
    /// Gets the reconciliation report for a cash drawer
    /// </summary>
    Task<ReconciliationReportDto> GetReconciliationReportAsync(Guid drawerId);

    /// <summary>
    /// Updates the expected cash when a cash sale is made
    /// </summary>
    Task UpdateExpectedCashAsync(Guid branchId, decimal amount);
}
