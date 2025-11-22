using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.HeadOffice;

public class BranchUser
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

public enum UserRole
{
    Cashier = 0,
    Manager = 1,
    Admin = 2,
}
