using SixLabors.ImageSharp;
using Backend.Utilities;

namespace Backend.Services.Branch.Images;

/// <summary>
/// Service implementation for managing image Upload, storage, and optimization
/// </summary>
public class ImageService : IImageService
{
    private readonly string _uploadBasePath;
    private readonly ILogger<ImageService> _logger;
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public ImageService(IConfiguration configuration, ILogger<ImageService> logger)
    {
        // Normalize the path to use correct OS-specific separators
        var basePath = configuration["ImageStorage:BasePath"] ?? "Upload";
        _uploadBasePath = Path.GetFullPath(basePath);
        _logger = logger;

        // Ensure base directory exists
        if (!Directory.Exists(_uploadBasePath))
        {
            Directory.CreateDirectory(_uploadBasePath);
            _logger.LogInformation("Created upload base directory: {BasePath}", _uploadBasePath);
        }
    }

    public async Task<ImageResult> UploadImageAsync(
        string branchName,
        string entityType,
        Guid entityId,
        Stream imageStream,
        string fileName)
    {
        try
        {
            // Validate file size
            if (imageStream.Length > MaxFileSize)
            {
                return new ImageResult
                {
                    Success = false,
                    ErrorMessage = $"File size exceeds maximum allowed size of {MaxFileSize / (1024 * 1024)}MB"
                };
            }

            // Validate image format
            if (!await ImageOptimizer.IsValidImageAsync(imageStream))
            {
                return new ImageResult
                {
                    Success = false,
                    ErrorMessage = "Invalid image format. Only JPEG, PNG, and WebP are supported."
                };
            }

            // Reset stream position after validation
            imageStream.Position = 0;

            // Load image
            using var image = await Image.LoadAsync(imageStream);

            // Create directory structure
            var entityPath = GetEntityDirectory(branchName, entityType, entityId);
            Directory.CreateDirectory(entityPath);

            // Delete existing images for this entity
            DeleteExistingImages(entityPath);

            // Generate all size variants using entity ID as base filename for consistency
            var baseFileName = entityId.ToString(); // Use entity ID as base filename to ensure consistency
            var generatedPaths = await ImageOptimizer.GenerateAllVariantsAsync(image, entityPath, baseFileName);

            _logger.LogInformation(
                "Successfully uploaded and processed image for {EntityType} {EntityId} in branch {BranchName}",
                entityType, entityId, branchName);

            return new ImageResult
            {
                Success = true,
                OriginalPath = generatedPaths.FirstOrDefault(),
                ThumbnailPaths = generatedPaths.Skip(1).ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image for {EntityType} {EntityId}", entityType, entityId);
            return new ImageResult
            {
                Success = false,
                ErrorMessage = $"Error processing image: {ex.Message}"
            };
        }
    }

    public Task<bool> DeleteImageAsync(string branchName, string entityType, Guid entityId)
    {
        return Task.Run(() =>
        {
            try
            {
            bool deleted = false;

            // First try to delete from the new path (with entityId)
            var newEntityPath = Path.Combine(_uploadBasePath, "Branches", branchName, "Logo", entityId.ToString());
            if (Directory.Exists(newEntityPath))
            {
                Directory.Delete(newEntityPath, recursive: true);
                _logger.LogInformation(
                    "Deleted images from new path for {EntityType} {EntityId} in branch {BranchName}",
                    entityType, entityId, branchName);
                deleted = true;
            }

            // Also try to delete from the old path (for backward compatibility)
            if (entityType.Equals("Logo", StringComparison.OrdinalIgnoreCase) ||
                entityType.Equals("Branches", StringComparison.OrdinalIgnoreCase))
            {
                var oldEntityPath = Path.Combine(_uploadBasePath, "Branches", branchName, "Logo");
                if (Directory.Exists(oldEntityPath))
                {
                    // Delete files that might belong to this entity in the old directory
                    var files = Directory.GetFiles(oldEntityPath);
                    foreach (var file in files)
                    {
                        // If filename contains the entity ID or if it's a general logo directory cleanup
                        if (Path.GetFileNameWithoutExtension(file).Contains(entityId.ToString()))
                        {
                            try
                            {
                                File.Delete(file);
                                _logger.LogInformation(
                                    "Deleted image file {FilePath} for {EntityType} {EntityId}",
                                    file, entityType, entityId);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Failed to delete image file: {FilePath}", file);
                            }
                        }
                    }

                    // If old directory is now empty, remove it
                    if (Directory.GetFiles(oldEntityPath).Length == 0 && Directory.GetDirectories(oldEntityPath).Length == 0)
                    {
                        Directory.Delete(oldEntityPath);
                        _logger.LogInformation("Removed empty logo directory: {Path}", oldEntityPath);
                    }

                    deleted = true;
                }
            }
            else
            {
                // For non-branch entities, use the regular path
                var entityPath = Path.Combine(_uploadBasePath, "Branches", branchName, entityType, entityId.ToString());
                if (Directory.Exists(entityPath))
                {
                    Directory.Delete(entityPath, recursive: true);
                    _logger.LogInformation(
                        "Deleted images for {EntityType} {EntityId} in branch {BranchName}",
                        entityType, entityId, branchName);
                    deleted = true;
                }
            }

                return deleted;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting images for {EntityType} {EntityId}", entityType, entityId);
                return false;
            }
        });
    }

    public string GetImagePath(string branchName, string entityType, Guid entityId, string size)
    {
        var extension = ImageOptimizer.GetOptimizedExtension();
        var pattern = $"*-{size}{extension}";

        // First check the new path (with entityId) to avoid conflicts
        var newEntityPath = Path.Combine(_uploadBasePath, "Branches", branchName, "Logo", entityId.ToString());
        if (Directory.Exists(newEntityPath))
        {
            var files = Directory.GetFiles(newEntityPath, pattern);
            var path = files.FirstOrDefault();
            if (!string.IsNullOrEmpty(path))
                return path;
        }

        // If not found in new path, try the old path (for backward compatibility)
        if (entityType.Equals("Logo", StringComparison.OrdinalIgnoreCase) ||
            entityType.Equals("Branches", StringComparison.OrdinalIgnoreCase))
        {
            var oldEntityPath = Path.Combine(_uploadBasePath, "Branches", branchName, "Logo");
            if (Directory.Exists(oldEntityPath))
            {
                var files = Directory.GetFiles(oldEntityPath, pattern);
                var path = files.FirstOrDefault();
                if (!string.IsNullOrEmpty(path))
                    return path;
            }
        }
        else
        {
            // For non-branch entities, use the regular path
            var entityPath = Path.Combine(_uploadBasePath, "Branches", branchName, entityType, entityId.ToString());
            if (Directory.Exists(entityPath))
            {
                var files = Directory.GetFiles(entityPath, pattern);
                var path = files.FirstOrDefault();
                if (!string.IsNullOrEmpty(path))
                    return path;
            }
        }

        return string.Empty;
    }

    public bool ImageExists(string branchName, string entityType, Guid entityId, string size)
    {
        var imagePath = GetImagePath(branchName, entityType, entityId, size);
        return !string.IsNullOrEmpty(imagePath) && File.Exists(imagePath);
    }

    private string GetEntityDirectory(string branchName, string entityType, Guid entityId)
    {
        // For Branch Logos and Branches, use the entity-specific directory to avoid conflicts
        // New uploads will go to Upload/Branches/{branchCode}/Logo/{branchId}/
        if (entityType.Equals("Logo", StringComparison.OrdinalIgnoreCase) ||
            entityType.Equals("Branches", StringComparison.OrdinalIgnoreCase))
        {
            return Path.Combine(_uploadBasePath, "Branches", branchName, "Logo", entityId.ToString());
        }

        return Path.Combine(_uploadBasePath, "Branches", branchName, entityType, entityId.ToString());
    }

    private void DeleteExistingImages(string directoryPath)
    {
        if (!Directory.Exists(directoryPath))
            return;

        var files = Directory.GetFiles(directoryPath);
        foreach (var file in files)
        {
            try
            {
                File.Delete(file);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete existing image file: {FilePath}", file);
            }
        }
    }

    public async Task<ImageResult> UploadImageWithCustomIdAsync(
        string branchName,
        string entityType,
        Guid entityId,
        Guid imageId,
        Stream imageStream,
        string fileName,
        bool skipDelete = true)
    {
        try
        {
            // Validate file size
            if (imageStream.Length > MaxFileSize)
            {
                return new ImageResult
                {
                    Success = false,
                    ErrorMessage = $"File size exceeds maximum allowed size of {MaxFileSize / (1024 * 1024)}MB"
                };
            }

            // Validate image format
            if (!await ImageOptimizer.IsValidImageAsync(imageStream))
            {
                return new ImageResult
                {
                    Success = false,
                    ErrorMessage = "Invalid image format. Only JPEG, PNG, and WebP are supported."
                };
            }

            // Reset stream position after validation
            imageStream.Position = 0;

            // Load image
            using var image = await Image.LoadAsync(imageStream);

            // Create directory structure (using entityId as the parent folder)
            var entityPath = GetEntityDirectory(branchName, entityType, entityId);
            Directory.CreateDirectory(entityPath);

            // Optionally delete existing images for this specific image ID (not all images in the directory)
            if (!skipDelete)
            {
                DeleteExistingImages(entityPath);
            }

            // Generate all size variants using the specific imageId as base filename
            var baseFileName = imageId.ToString();
            var generatedPaths = await ImageOptimizer.GenerateAllVariantsAsync(image, entityPath, baseFileName);

            _logger.LogInformation(
                "Successfully uploaded and processed image {ImageId} for {EntityType} {EntityId} in branch {BranchName}",
                imageId, entityType, entityId, branchName);

            return new ImageResult
            {
                Success = true,
                OriginalPath = generatedPaths.FirstOrDefault(),
                ThumbnailPaths = generatedPaths.Skip(1).ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image {ImageId} for {EntityType} {EntityId}", imageId, entityType, entityId);
            return new ImageResult
            {
                Success = false,
                ErrorMessage = $"Error processing image: {ex.Message}"
            };
        }
    }
}
