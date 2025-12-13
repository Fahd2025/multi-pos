using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.HeadOffice;

/// <summary>
/// BranchUser - Branch-specific users stored in head office database
/// This is the primary source of truth for branch user authentication
/// Syncs bidirectionally with Branch.User in each branch database
/// </summary>
public class BranchUser
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid BranchId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string FullNameEn { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? FullNameAr { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [Required]
    [MaxLength(10)]
    public string PreferredLanguage { get; set; } = "en"; // en, ar

    /// <summary>
    /// User role within this branch: Manager, Cashier
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Role { get; set; } = "Cashier";

    [Required]
    public bool IsActive { get; set; } = true;

    public DateTime? LastLoginAt { get; set; }

    public DateTime? LastActivityAt { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Last time this record was synced with branch database
    /// </summary>
    public DateTime? SyncedAt { get; set; }

    /// <summary>
    /// User who created this branch user
    /// </summary>
    public Guid CreatedBy { get; set; }

    // Navigation properties
    public Branch Branch { get; set; } = null!;
}
