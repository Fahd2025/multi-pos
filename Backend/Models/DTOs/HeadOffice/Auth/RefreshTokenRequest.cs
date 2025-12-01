using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.HeadOffice.Auth;

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
