using Backend.Models.DTOs.Branch.Sales;
using Backend.Models.Entities.Branch;

namespace Backend.Services.Branch.Sales;

public interface ISalesService
{
    Task<SaleDto> CreateSaleAsync(CreateSaleDto createSaleDto, Guid cashierId, string branchName);
    Task<(List<SaleDto> Sales, int TotalCount)> GetSalesAsync(
        int page = 1,
        int pageSize = 20,
        DateTime? dateFrom = null,
        DateTime? dateTo = null,
        Guid? customerId = null,
        Guid? cashierId = null,
        InvoiceType? invoiceType = null,
        PaymentMethod? paymentMethod = null,
        bool? isVoided = false,
        string? search = null,
        string? branchName = null
    );
    Task<SaleDto?> GetSaleByIdAsync(Guid id, string branchName);
    Task<SaleDto> VoidSaleAsync(Guid id, string reason, Guid voidedBy, string branchName);
    Task<SalesStatsDto> GetSalesStatsAsync(
        DateTime dateFrom,
        DateTime dateTo,
        string? branchName = null
    );
    Task<SaleDto> UpdateSalePaymentAsync(
        Guid saleId,
        UpdateSalePaymentDto updatePaymentDto,
        string branchName
    );
}
