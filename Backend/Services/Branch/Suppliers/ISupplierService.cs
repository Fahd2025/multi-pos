using Backend.Models.DTOs.Branch.Suppliers;
using Backend.Models.Entities.Branch;

namespace Backend.Services.Branch.Suppliers;

/// <summary>
/// Service interface for supplier management operations
/// </summary>
public interface ISupplierService
{
    /// <summary>
    /// Get all suppliers with optional filtering
    /// </summary>
    /// <param name="branchId">Branch ID (from JWT context)</param>
    /// <param name="includeInactive">Include inactive suppliers</param>
    /// <param name="searchTerm">Search by code, name, email, or phone</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    Task<(List<SupplierDto> Suppliers, int TotalCount)> GetSuppliersAsync(
        Guid branchId,
        bool includeInactive = false,
        string? searchTerm = null,
        int page = 1,
        int pageSize = 50);

    /// <summary>
    /// Get supplier by ID
    /// </summary>
    Task<SupplierDto?> GetSupplierByIdAsync(Guid branchId, Guid supplierId);

    /// <summary>
    /// Create a new supplier
    /// </summary>
    Task<SupplierDto> CreateSupplierAsync(Guid branchId, CreateSupplierDto createDto, Guid createdByUserId);

    /// <summary>
    /// Update supplier information
    /// </summary>
    Task<SupplierDto> UpdateSupplierAsync(Guid branchId, Guid supplierId, UpdateSupplierDto updateDto);

    /// <summary>
    /// Delete supplier (soft delete - deactivate)
    /// </summary>
    Task DeleteSupplierAsync(Guid branchId, Guid supplierId);

    /// <summary>
    /// Get purchase history for a specific supplier
    /// </summary>
    Task<List<Purchase>> GetSupplierPurchaseHistoryAsync(Guid branchId, Guid supplierId, int page = 1, int pageSize = 50);
}
