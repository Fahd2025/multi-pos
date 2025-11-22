using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Entities.Branch;

public class ProductImage
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ProductId { get; set; }

    [Required]
    [MaxLength(500)]
    public string ImagePath { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string ThumbnailPath { get; set; } = string.Empty;

    [Required]
    public int DisplayOrder { get; set; } = 0;

    [Required]
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public Guid UploadedBy { get; set; }

    // Navigation properties
    public Product Product { get; set; } = null!;
}
