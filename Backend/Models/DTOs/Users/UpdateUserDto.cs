using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Users;

/// <summary>
/// DTO for updating user information
/// </summary>
public class UpdateUserDto
{
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    public string? Email { get; set; }

    [StringLength(200, ErrorMessage = "Full name cannot exceed 200 characters")]
    public string? FullNameEn { get; set; }

    [StringLength(200, ErrorMessage = "Full name (Arabic) cannot exceed 200 characters")]
    public string? FullNameAr { get; set; }

    [Phone(ErrorMessage = "Invalid phone number format")]
    [StringLength(50, ErrorMessage = "Phone cannot exceed 50 characters")]
    public string? Phone { get; set; }

    [StringLength(10, ErrorMessage = "Preferred language must be a valid language code")]
    public string? PreferredLanguage { get; set; }

    public bool? IsActive { get; set; }

    /// <summary>
    /// Optional: New password (only include if changing password)
    /// </summary>
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
    public string? NewPassword { get; set; }

    /// <summary>
    /// Note: IsHeadOfficeAdmin cannot be changed via this DTO for security reasons
    /// Use a separate endpoint/service method for role elevation
    /// </summary>
}
