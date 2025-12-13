using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.HeadOffice;

/// <summary>
/// UserAssignment - DEPRECATED - Kept for backward compatibility only
/// Links central HeadOffice users to branches
/// 
/// NOTE: This entity is deprecated and will be removed in future versions.
/// New system uses BranchUser for branch-specific users with authentication in head office.
/// 
/// Migration Path:
/// - Existing UserAssignments should be migrated to BranchUsers
/// - Head office Users table will be removed
/// - All branch authentication will use BranchUser table
/// </summary>
[Obsolete("This entity is deprecated. Use BranchUser instead for branch user management.")]
public class UserAssignment
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public Guid BranchId { get; set; }

    [Required]
    public UserRole Role { get; set; }

    [Required]
    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public Guid AssignedBy { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Branch Branch { get; set; } = null!;
}
