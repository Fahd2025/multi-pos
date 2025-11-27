using SixLabors.ImageSharp;
using Backend.Utilities;

namespace Backend.Services.Images;

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
        _uploadBasePath = configuration["ImageStorage:BasePath"] ?? "Upload/Branches";
        _logger = logger;

        // Ensure base directory exists
        if (!Directory.Exists(_uploadBasePath))
        {
            Directory.CreateDirectory(_uploadBasePath);
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

            // Generate all size variants
            var baseFileName = Path.GetFileNameWithoutExtension(fileName);
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

    public async Task<bool> DeleteImageAsync(string branchName, string entityType, Guid entityId)
    {
        try
        {
            var entityPath = GetEntityDirectory(branchName, entityType, entityId);

            if (Directory.Exists(entityPath))
            {
                Directory.Delete(entityPath, recursive: true);
                _logger.LogInformation(
                    "Deleted images for {EntityType} {EntityId} in branch {BranchName}",
                    entityType, entityId, branchName);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting images for {EntityType} {EntityId}", entityType, entityId);
            return false;
        }
    }

    public string GetImagePath(string branchName, string entityType, Guid entityId, string size)
    {
        var entityPath = GetEntityDirectory(branchName, entityType, entityId);
        var extension = ImageOptimizer.GetOptimizedExtension();

        // Look for any file with the pattern *-{size}.webp
        var pattern = $"*-{size}{extension}";
        var files = Directory.Exists(entityPath)
            ? Directory.GetFiles(entityPath, pattern)
            : Array.Empty<string>();

        return files.FirstOrDefault() ?? string.Empty;
    }

    public bool ImageExists(string branchName, string entityType, Guid entityId, string size)
    {
        var imagePath = GetImagePath(branchName, entityType, entityId, size);
        return !string.IsNullOrEmpty(imagePath) && File.Exists(imagePath);
    }

    private string GetEntityDirectory(string branchName, string entityType, Guid entityId)
    {
        // Special case for Branch Logos: Upload/Branches/{code}/Logo/
        // We assume branchName passed is the Code, and entityType is "Logo" or "Branches".
        if (entityType.Equals("Logo", StringComparison.OrdinalIgnoreCase))
        {
            return Path.Combine(_uploadBasePath, branchName, entityType);
        }

        // Special case for Branches entity type (for branch logos)
        // Store at Upload/Branches/{code}/Logo/ instead of Upload/Branches/{code}/Branches/{entityId}/
        if (entityType.Equals("Branches", StringComparison.OrdinalIgnoreCase))
        {
            return Path.Combine(_uploadBasePath, branchName, "Logo");
        }

        return Path.Combine(_uploadBasePath, branchName, entityType, entityId.ToString());
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
}
