using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.HeadOffice;

public class AuditLog
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public Guid? UserId { get; set; }

    public Guid? BranchId { get; set; }

    [Required]
    [MaxLength(100)]
    public string EventType { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? EntityType { get; set; }

    public Guid? EntityId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Action { get; set; } = string.Empty;

    public string? OldValues { get; set; }

    public string? NewValues { get; set; }

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    [MaxLength(500)]
    public string? UserAgent { get; set; }

    [Required]
    public bool Success { get; set; } = true;

    public string? ErrorMessage { get; set; }
}
