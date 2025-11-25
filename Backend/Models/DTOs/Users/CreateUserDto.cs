using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Users;

/// <summary>
/// DTO for creating a new user
/// </summary>
public class CreateUserDto
{
    [Required(ErrorMessage = "Username is required")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 100 characters")]
    [RegularExpression(@"^[a-zA-Z0-9_\-\.]+$", ErrorMessage = "Username can only contain letters, numbers, underscore, hyphen, and dot")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Full name (English) is required")]
    [StringLength(200, ErrorMessage = "Full name cannot exceed 200 characters")]
    public string FullNameEn { get; set; } = string.Empty;

    [StringLength(200, ErrorMessage = "Full name (Arabic) cannot exceed 200 characters")]
    public string? FullNameAr { get; set; }

    [Phone(ErrorMessage = "Invalid phone number format")]
    [StringLength(50, ErrorMessage = "Phone cannot exceed 50 characters")]
    public string? Phone { get; set; }

    [StringLength(10, ErrorMessage = "Preferred language must be a valid language code")]
    public string PreferredLanguage { get; set; } = "en";

    public bool IsActive { get; set; } = true;

    public bool IsHeadOfficeAdmin { get; set; } = false;

    /// <summary>
    /// Optional: Assign user to branches immediately upon creation
    /// </summary>
    public List<BranchAssignmentDto> BranchAssignments { get; set; } = new();
}

/// <summary>
/// DTO for branch assignment during user creation
/// </summary>
public class BranchAssignmentDto
{
    [Required]
    public Guid BranchId { get; set; }

    [Required]
    [StringLength(50, ErrorMessage = "Role cannot exceed 50 characters")]
    public string Role { get; set; } = string.Empty; // Manager, Cashier, etc.
}
