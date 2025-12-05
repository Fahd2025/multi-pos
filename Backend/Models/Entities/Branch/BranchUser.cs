namespace Backend.Models.Entities.Branch;

/// <summary>
/// User entity - Branch-specific user accounts
/// Each branch has its own users stored in the branch database
/// Usernames are unique per branch (not globally)
/// Note: This is different from HeadOffice.User which represents central users
/// </summary>
public class User
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullNameEn { get; set; } = string.Empty;
    public string? FullNameAr { get; set; }
    public string? Phone { get; set; }
    public string PreferredLanguage { get; set; } = "en"; // en, ar

    /// <summary>
    /// User role within this branch: Manager, Cashier
    /// </summary>
    public string Role { get; set; } = "Cashier";

    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedBy { get; set; } // HeadOffice User ID who created this user

    // Navigation properties for auditing
    public virtual ICollection<Sale> Sales { get; set; } = new List<Sale>();
}
