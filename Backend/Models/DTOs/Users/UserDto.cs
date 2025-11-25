namespace Backend.Models.DTOs.Users;

/// <summary>
/// DTO for user information returned to clients
/// </summary>
public class UserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullNameEn { get; set; } = string.Empty;
    public string? FullNameAr { get; set; }
    public string? Phone { get; set; }
    public string PreferredLanguage { get; set; } = "en";
    public bool IsActive { get; set; }
    public bool IsHeadOfficeAdmin { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    /// <summary>
    /// List of branch IDs this user is assigned to
    /// </summary>
    public List<Guid> AssignedBranchIds { get; set; } = new();

    /// <summary>
    /// List of branch details this user is assigned to
    /// </summary>
    public List<UserBranchDto> AssignedBranches { get; set; } = new();
}

/// <summary>
/// DTO for branch assignment information
/// </summary>
public class UserBranchDto
{
    public Guid BranchId { get; set; }
    public string BranchCode { get; set; } = string.Empty;
    public string BranchNameEn { get; set; } = string.Empty;
    public string BranchNameAr { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // Manager, Cashier, etc.
    public DateTime AssignedAt { get; set; }
}
