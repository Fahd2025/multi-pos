using Backend.Models.DTOs.Branch.Inventory;
using Backend.Models.Entities.Branch;

namespace Backend.Services.Branch.Inventory;

/// <summary>
/// Service interface for inventory management operations
/// </summary>
public interface IInventoryService
{
    // Product operations
    Task<(List<ProductDto> Products, int TotalCount)> GetProductsAsync(
        string? searchTerm = null,
        Guid? categoryId = null,
        bool? isActive = null,
        bool? lowStockOnly = null,
        int page = 1,
        int pageSize = 50);

    Task<ProductDto?> GetProductByIdAsync(Guid productId);
    Task<ProductDto> CreateProductAsync(CreateProductDto dto, Guid userId);
    Task<ProductDto> UpdateProductAsync(Guid productId, UpdateProductDto dto);
    Task DeleteProductAsync(Guid productId);
    Task<ProductDto> AdjustStockAsync(Guid productId, StockAdjustmentDto dto, Guid userId);
    Task<List<ProductDto>> GetLowStockProductsAsync();

    // Category operations
    Task<List<CategoryDto>> GetCategoriesAsync(bool includeInactive = false);
    Task<CategoryDto?> GetCategoryByIdAsync(Guid categoryId);
    Task<CategoryDto> CreateCategoryAsync(string code, string nameEn, string nameAr,
        string? descriptionEn, string? descriptionAr, Guid? parentCategoryId,
        int displayOrder, Guid userId);
    Task<CategoryDto> UpdateCategoryAsync(Guid categoryId, string code, string nameEn,
        string nameAr, string? descriptionEn, string? descriptionAr,
        Guid? parentCategoryId, int displayOrder);
    Task DeleteCategoryAsync(Guid categoryId);

    // Purchase operations
    Task<(List<PurchaseDto> Purchases, int TotalCount)> GetPurchasesAsync(
        Guid? supplierId = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int? paymentStatus = null,
        string? search = null,
        string? supplierName = null,
        string? status = null,
        int page = 1,
        int pageSize = 50);

    Task<PurchaseDto?> GetPurchaseByIdAsync(Guid purchaseId);
    Task<PurchaseDto> CreatePurchaseAsync(CreatePurchaseDto dto, Guid userId);
    Task<PurchaseDto> ReceivePurchaseAsync(Guid purchaseId, Guid userId);
    Task<int> CheckLowStockAsync(int threshold);
}
