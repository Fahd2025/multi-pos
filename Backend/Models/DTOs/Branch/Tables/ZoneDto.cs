using System.ComponentModel.DataAnnotations;

namespace Backend.Models.DTOs.Branch.Tables;

/// <summary>
/// DTO for zone information returned to clients
/// </summary>
public class ZoneDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public int TableCount { get; set; }
}

/// <summary>
/// DTO for creating a new zone
/// </summary>
public class CreateZoneDto
{
    [Required(ErrorMessage = "Zone name is required")]
    [MaxLength(50, ErrorMessage = "Zone name must not exceed 50 characters")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200, ErrorMessage = "Description must not exceed 200 characters")]
    public string? Description { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Display order must be non-negative")]
    public int DisplayOrder { get; set; }
}

/// <summary>
/// DTO for updating an existing zone
/// </summary>
public class UpdateZoneDto
{
    [Required(ErrorMessage = "Zone name is required")]
    [MaxLength(50, ErrorMessage = "Zone name must not exceed 50 characters")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200, ErrorMessage = "Description must not exceed 200 characters")]
    public string? Description { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Display order must be non-negative")]
    public int DisplayOrder { get; set; }

    public bool IsActive { get; set; } = true;
}
