using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class Setting
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Key { get; set; } = string.Empty;

    public string? Value { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public Guid UpdatedBy { get; set; }
}
