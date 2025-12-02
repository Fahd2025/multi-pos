using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.HeadOffice;

public class UserActivityLog
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [Required]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string EntityType { get; set; } = string.Empty;

    public Guid? EntityId { get; set; }

    public string? Details { get; set; }

    public Guid? BranchId { get; set; }

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    [MaxLength(500)]
    public string? UserAgent { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
}
