namespace Backend.Models.DTOs.Branch.Inventory;

/// <summary>
/// Data transfer object for Product Image
/// </summary>
public class ProductImageDto
{
    public Guid Id { get; set; }
    public string ImagePath { get; set; } = string.Empty;
    public string ThumbnailPath { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}
