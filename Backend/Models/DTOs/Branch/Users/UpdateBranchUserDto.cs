namespace Backend.Models.DTOs.Branch.Users;

/// <summary>
/// Update Branch User DTO - Request for updating an existing branch user
/// </summary>
public class UpdateUserDto
{
    public string? Email { get; set; }
    public string? FullNameEn { get; set; }
    public string? FullNameAr { get; set; }
    public string? Phone { get; set; }
    public string? PreferredLanguage { get; set; }
    public string? Role { get; set; } // Manager or Cashier
    public bool? IsActive { get; set; }
    public string? NewPassword { get; set; } // Optional - only if changing password
}
