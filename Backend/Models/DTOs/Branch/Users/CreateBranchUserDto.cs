namespace Backend.Models.DTOs.Branch.Users;

/// <summary>
/// Create Branch User DTO - Request for creating a new branch user
/// </summary>
public class CreateBranchUserDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullNameEn { get; set; } = string.Empty;
    public string? FullNameAr { get; set; }
    public string? Phone { get; set; }
    public string PreferredLanguage { get; set; } = "en";
    public string Role { get; set; } = "Cashier"; // Manager or Cashier
    public bool IsActive { get; set; } = true;
}
