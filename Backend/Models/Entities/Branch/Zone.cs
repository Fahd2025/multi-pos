using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class Zone
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    public int DisplayOrder { get; set; }

    public bool IsActive { get; set; } = true;

    // Audit fields
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    [MaxLength(100)]
    public string CreatedBy { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string UpdatedBy { get; set; } = string.Empty;

    // Navigation
    public ICollection<Table> Tables { get; set; } = new List<Table>();
}
