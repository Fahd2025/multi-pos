using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.HeadOffice.Auth;

public class LoginRequest
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    public string? BranchCode { get; set; }
}
