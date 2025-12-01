using Backend.Models.DTOs.Branch.Customers;
using Backend.Models.DTOs.Branch.Sales;

namespace Backend.Services.Branch.Customers;

/// <summary>
/// Service interface for customer management operations
/// </summary>
public interface ICustomerService
{
    /// <summary>
    /// Get customers with optional search and pagination
    /// </summary>
    /// <param name="searchTerm">Search term for customer code, name, email, or phone</param>
    /// <param name="isActive">Filter by active/inactive status</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <returns>List of customers and total count</returns>
    Task<(List<CustomerDto> Customers, int TotalCount)> GetCustomersAsync(
        string? searchTerm = null,
        bool? isActive = null,
        int page = 1,
        int pageSize = 50);

    /// <summary>
    /// Get a customer by ID
    /// </summary>
    /// <param name="customerId">Customer unique identifier</param>
    /// <returns>Customer details or null if not found</returns>
    Task<CustomerDto?> GetCustomerByIdAsync(Guid customerId);

    /// <summary>
    /// Create a new customer
    /// </summary>
    /// <param name="dto">Customer creation data</param>
    /// <param name="userId">ID of the user creating the customer</param>
    /// <returns>Created customer details</returns>
    Task<CustomerDto> CreateCustomerAsync(CreateCustomerDto dto, Guid userId);

    /// <summary>
    /// Update an existing customer
    /// </summary>
    /// <param name="customerId">Customer unique identifier</param>
    /// <param name="dto">Customer update data</param>
    /// <returns>Updated customer details</returns>
    Task<CustomerDto> UpdateCustomerAsync(Guid customerId, UpdateCustomerDto dto);

    /// <summary>
    /// Delete a customer (soft delete by marking inactive)
    /// </summary>
    /// <param name="customerId">Customer unique identifier</param>
    Task DeleteCustomerAsync(Guid customerId);

    /// <summary>
    /// Get customer purchase history
    /// </summary>
    /// <param name="customerId">Customer unique identifier</param>
    /// <param name="startDate">Optional start date filter</param>
    /// <param name="endDate">Optional end date filter</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Number of items per page</param>
    /// <returns>List of sales and total count</returns>
    Task<(List<SaleDto> Sales, int TotalCount)> GetCustomerPurchaseHistoryAsync(
        Guid customerId,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int page = 1,
        int pageSize = 50);

    /// <summary>
    /// Update customer statistics after a sale
    /// </summary>
    /// <param name="customerId">Customer unique identifier</param>
    /// <param name="saleAmount">Sale total amount</param>
    /// <param name="loyaltyPointsEarned">Loyalty points earned from the sale</param>
    /// <returns>Updated customer details</returns>
    Task<CustomerDto> UpdateCustomerStatsAsync(Guid customerId, decimal saleAmount, int loyaltyPointsEarned = 0);
}
