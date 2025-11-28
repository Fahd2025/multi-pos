using Backend.Models.DTOs.Reports;

namespace Backend.Services.Reports;

/// <summary>
/// Service interface for generating reports and analytics
/// </summary>
public interface IReportService
{
    /// <summary>
    /// Generates a sales report with optional filters
    /// </summary>
    /// <param name="request">Sales report request parameters</param>
    /// <param name="branchId">Branch ID (required for non-admin users)</param>
    /// <param name="isHeadOfficeAdmin">Whether the user is a head office admin</param>
    /// <returns>Sales report data</returns>
    Task<SalesReportDto> GenerateSalesReportAsync(SalesReportRequestDto request, Guid? branchId, bool isHeadOfficeAdmin);

    /// <summary>
    /// Generates an inventory report with stock levels and movements
    /// </summary>
    /// <param name="request">Inventory report request parameters</param>
    /// <param name="branchId">Branch ID (required for non-admin users)</param>
    /// <param name="isHeadOfficeAdmin">Whether the user is a head office admin</param>
    /// <returns>Inventory report data</returns>
    Task<InventoryReportDto> GenerateInventoryReportAsync(InventoryReportRequestDto request, Guid? branchId, bool isHeadOfficeAdmin);

    /// <summary>
    /// Generates a financial report showing revenue, expenses, and profit
    /// </summary>
    /// <param name="request">Financial report request parameters</param>
    /// <param name="branchId">Branch ID (required for non-admin users)</param>
    /// <param name="isHeadOfficeAdmin">Whether the user is a head office admin</param>
    /// <returns>Financial report data</returns>
    Task<FinancialReportDto> GenerateFinancialReportAsync(FinancialReportRequestDto request, Guid? branchId, bool isHeadOfficeAdmin);

    /// <summary>
    /// Exports a report to the specified format (PDF, Excel, CSV)
    /// </summary>
    /// <param name="request">Export request with report type and format</param>
    /// <param name="branchId">Branch ID (required for non-admin users)</param>
    /// <param name="isHeadOfficeAdmin">Whether the user is a head office admin</param>
    /// <returns>Byte array of the exported file and content type</returns>
    Task<(byte[] FileContent, string ContentType, string FileName)> ExportReportAsync(ExportReportRequestDto request, Guid? branchId, bool isHeadOfficeAdmin);
}
