using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Returns;

/// <summary>
/// DTO for return policy information
/// </summary>
public class ReturnPolicyDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public int MaxReturnDays { get; set; }
    public bool RequireReceipt { get; set; }
    public bool RequireManagerApproval { get; set; }
    public string AllowedConditions { get; set; } = string.Empty;
    public decimal RestockingFeePercent { get; set; }
    public string RefundMethods { get; set; } = string.Empty;
    public bool ExchangeAllowed { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO for updating return policy
/// </summary>
public class UpdateReturnPolicyDto
{
    [Range(1, 365, ErrorMessage = "Max return days must be between 1 and 365")]
    public int MaxReturnDays { get; set; } = 30;

    public bool RequireReceipt { get; set; } = true;

    public bool RequireManagerApproval { get; set; } = false;

    [Required(ErrorMessage = "Allowed conditions are required")]
    public List<string> AllowedConditions { get; set; } = new() { "New", "Opened" };

    [Range(0, 100, ErrorMessage = "Restocking fee must be between 0 and 100")]
    public decimal RestockingFeePercent { get; set; } = 0;

    [Required(ErrorMessage = "Refund methods are required")]
    [MinLength(1, ErrorMessage = "At least one refund method is required")]
    public List<string> RefundMethods { get; set; } = new() { "Cash", "Card", "StoreCredit" };

    public bool ExchangeAllowed { get; set; } = true;

    [MaxLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
    public string? Notes { get; set; }
}
