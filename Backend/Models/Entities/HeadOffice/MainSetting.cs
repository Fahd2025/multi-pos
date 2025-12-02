using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.HeadOffice;

public class MainSetting
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Key { get; set; } = string.Empty;

    public string? Value { get; set; }

    [Required]
    public bool IsEncrypted { get; set; } = false;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Guid UpdatedBy { get; set; }
}
