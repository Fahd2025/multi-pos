using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class Table
{
    public int Id { get; set; }

    [Required]
    public int Number { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Range(1, 100, ErrorMessage = "Capacity must be between 1 and 100 guests")]
    public int Capacity { get; set; }

    // Positioning (percentage-based: 0-100)
    [Required]
    [Range(0, 100)]
    public decimal PositionX { get; set; }

    [Required]
    [Range(0, 100)]
    public decimal PositionY { get; set; }

    [Range(1, 100)]
    public decimal Width { get; set; } = 10; // Default width %

    [Range(1, 100)]
    public decimal Height { get; set; } = 10; // Default height %

    [Range(0, 360)]
    public int Rotation { get; set; } = 0;

    [MaxLength(20)]
    public string Shape { get; set; } = "Rectangle"; // Rectangle, Circle, Square

    public bool IsActive { get; set; } = true;

    // Audit fields
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? DeletedAt { get; set; }

    [Required]
    [MaxLength(100)]
    public string CreatedBy { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string UpdatedBy { get; set; } = string.Empty;

    // Navigation
    public int? ZoneId { get; set; }
    public Zone? Zone { get; set; }
    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
}
