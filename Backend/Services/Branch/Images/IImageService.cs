namespace Backend.Services.Branch.Images;

/// <summary>
/// Service for managing image Upload, storage, and optimization
/// </summary>
public interface IImageService
{
    /// <summary>
    /// Upload and process an image for an entity
    /// </summary>
    /// <param name="branchName">Name of the branch</param>
    /// <param name="entityType">Type of entity (Products, Categories, etc.)</param>
    /// <param name="entityId">ID of the entity</param>
    /// <param name="imageStream">Image file stream</param>
    /// <param name="fileName">Original file name</param>
    /// <returns>Result containing paths to uploaded image variants</returns>
    Task<ImageResult> UploadImageAsync(
        string branchName,
        string entityType,
        Guid entityId,
        Stream imageStream,
        string fileName);

    /// <summary>
    /// Delete all image variants for an entity
    /// </summary>
    /// <param name="branchName">Name of the branch</param>
    /// <param name="entityType">Type of entity</param>
    /// <param name="entityId">ID of the entity</param>
    /// <returns>True if deletion successful</returns>
    Task<bool> DeleteImageAsync(string branchName, string entityType, Guid entityId);

    /// <summary>
    /// Get the file path for a specific image size
    /// </summary>
    /// <param name="branchName">Name of the branch</param>
    /// <param name="entityType">Type of entity</param>
    /// <param name="entityId">ID of the entity</param>
    /// <param name="size">Image size (original, large, medium, thumb)</param>
    /// <returns>Full file path to the image</returns>
    string GetImagePath(string branchName, string entityType, Guid entityId, string size);

    /// <summary>
    /// Check if an image exists for the given parameters
    /// </summary>
    /// <param name="branchName">Name of the branch</param>
    /// <param name="entityType">Type of entity</param>
    /// <param name="entityId">ID of the entity</param>
    /// <param name="size">Image size</param>
    /// <returns>True if image exists</returns>
    bool ImageExists(string branchName, string entityType, Guid entityId, string size);

    /// <summary>
    /// Upload an image with a custom filename (for multi-image entities like Products)
    /// </summary>
    /// <param name="branchName">Name of the branch</param>
    /// <param name="entityType">Type of entity (Products, etc.)</param>
    /// <param name="entityId">ID of the parent entity (ProductId)</param>
    /// <param name="imageId">Unique ID for this specific image (ProductImage.Id)</param>
    /// <param name="imageStream">Image file stream</param>
    /// <param name="fileName">Original file name</param>
    /// <param name="skipDelete">If true, don't delete existing images before uploading</param>
    /// <returns>Result containing paths to uploaded image variants</returns>
    Task<ImageResult> UploadImageWithCustomIdAsync(
        string branchName,
        string entityType,
        Guid entityId,
        Guid imageId,
        Stream imageStream,
        string fileName,
        bool skipDelete = true);
}

/// <summary>
/// Result of an image upload operation
/// </summary>
public class ImageResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public string? OriginalPath { get; set; }
    public List<string> ThumbnailPaths { get; set; } = new();
}
