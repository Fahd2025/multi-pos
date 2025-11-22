namespace Backend.Models.DTOs.Auth;

public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public UserInfo User { get; set; } = null!;
    public BranchInfo? Branch { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public class UserInfo
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullNameEn { get; set; } = string.Empty;
    public string? FullNameAr { get; set; }
    public string PreferredLanguage { get; set; } = string.Empty;
    public bool IsHeadOfficeAdmin { get; set; }
    public string? Role { get; set; }
}

public class BranchInfo
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string Currency { get; set; } = string.Empty;
}
