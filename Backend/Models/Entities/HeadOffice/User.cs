using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.HeadOffice;

public class User
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string FullNameEn { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? FullNameAr { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [Required]
    [MaxLength(10)]
    public string PreferredLanguage { get; set; } = "en";

    [Required]
    public bool IsActive { get; set; } = true;

    [Required]
    public bool IsHeadOfficeAdmin { get; set; } = false;

    public DateTime? LastLoginAt { get; set; }

    public DateTime? LastActivityAt { get; set; }

    [Required]
    public int FailedLoginAttempts { get; set; } = 0;

    public DateTime? LockedUntil { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<BranchUser> BranchUsers { get; set; } = new List<BranchUser>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<UserActivityLog> ActivityLogs { get; set; } = new List<UserActivityLog>();
}
