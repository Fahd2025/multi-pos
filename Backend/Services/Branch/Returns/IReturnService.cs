using Backend.Models.DTOs.Returns;

namespace Backend.Services.Branch.Returns;

/// <summary>
/// Service interface for return and refund operations
/// </summary>
public interface IReturnService
{
    /// <summary>
    /// Create a new return request
    /// </summary>
    Task<ReturnDto> CreateReturnAsync(Guid branchId, CreateReturnDto dto, Guid userId);

    /// <summary>
    /// Validate if a return can be processed based on policy
    /// </summary>
    Task<(bool IsValid, string? ErrorMessage)> ValidateReturnPolicyAsync(Guid branchId, Guid saleId, DateTime returnDate);

    /// <summary>
    /// Approve or reject a return request (Manager only)
    /// </summary>
    Task<ReturnDto> ApproveReturnAsync(Guid returnId, ApproveReturnDto dto, Guid managerId);

    /// <summary>
    /// Process a return and complete the refund
    /// </summary>
    Task<ReturnDto> ProcessReturnAsync(Guid returnId, ProcessReturnDto dto, Guid userId);

    /// <summary>
    /// Get returns with filters and pagination
    /// </summary>
    Task<List<ReturnDto>> GetReturnsAsync(Guid branchId, string? status = null, DateTime? startDate = null, DateTime? endDate = null, int page = 1, int pageSize = 20);

    /// <summary>
    /// Get return by ID
    /// </summary>
    Task<ReturnDto?> GetReturnByIdAsync(Guid returnId);

    /// <summary>
    /// Calculate restocking fee for a return
    /// </summary>
    Task<decimal> CalculateRestockingFeeAsync(Guid returnId);

    /// <summary>
    /// Get the active return policy for a branch
    /// </summary>
    Task<ReturnPolicyDto?> GetActivePolicyAsync(Guid branchId);

    /// <summary>
    /// Update return policy for a branch
    /// </summary>
    Task<ReturnPolicyDto> UpdatePolicyAsync(Guid branchId, UpdateReturnPolicyDto dto, Guid userId);
}
