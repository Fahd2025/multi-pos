using Backend.Models.DTOs.Branch.Tables;

namespace Backend.Services.Branch.Tables;

/// <summary>
/// Service interface for table management operations
/// </summary>
public interface ITableService
{
    /// <summary>
    /// Get all tables, optionally filtered by zone
    /// </summary>
    Task<IEnumerable<TableDto>> GetAllTablesAsync(int? zoneId = null);

    /// <summary>
    /// Get tables with current occupancy status
    /// </summary>
    Task<IEnumerable<TableWithStatusDto>> GetTablesWithStatusAsync(int? zoneId = null);

    /// <summary>
    /// Get table by ID
    /// </summary>
    Task<TableDto?> GetTableByIdAsync(int id);

    /// <summary>
    /// Get table by table number
    /// </summary>
    Task<TableDto?> GetTableByNumberAsync(int number);

    /// <summary>
    /// Create a new table
    /// </summary>
    Task<TableDto> CreateTableAsync(CreateTableDto dto, string userId);

    /// <summary>
    /// Update table information
    /// </summary>
    Task<TableDto> UpdateTableAsync(int id, UpdateTableDto dto, string userId);

    /// <summary>
    /// Delete table (soft delete)
    /// </summary>
    Task<bool> DeleteTableAsync(int id);

    /// <summary>
    /// Transfer order from one table to another
    /// </summary>
    Task<bool> TransferOrderAsync(TransferTableDto dto, string userId);

    /// <summary>
    /// Clear/complete table order
    /// </summary>
    Task<bool> ClearTableAsync(int tableNumber, string userId);

    /// <summary>
    /// Assign table to an existing sale
    /// </summary>
    Task<int> AssignTableToSaleAsync(Guid saleId, AssignTableDto dto);
}
