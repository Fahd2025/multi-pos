using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Webp;

namespace Backend.Utilities;

/// <summary>
/// Utility class for image optimization and thumbnail generation
/// </summary>
public static class ImageOptimizer
{
    /// <summary>
    /// Image size configurations for different variants
    /// </summary>
    public static class ImageSizes
    {
        public const string Original = "original";
        public const string Large = "large";
        public const string Medium = "medium";
        public const string Thumb = "thumb";

        public static int GetMaxDimension(string size) => size switch
        {
            Large => 1200,
            Medium => 600,
            Thumb => 150,
            _ => 0 // Original size
        };
    }

    /// <summary>
    /// Resize and optimize an image to the specified dimensions
    /// </summary>
    /// <param name="image">Source image</param>
    /// <param name="maxDimension">Maximum dimension (width or height)</param>
    /// <returns>Resized image</returns>
    public static Image ResizeImage(Image image, int maxDimension)
    {
        if (maxDimension <= 0)
            return image.Clone(ctx => { }); // Return clone of original

        var clone = image.Clone(ctx =>
        {
            ctx.Resize(new ResizeOptions
            {
                Mode = ResizeMode.Max,
                Size = new Size(maxDimension, maxDimension)
            });
        });

        return clone;
    }

    /// <summary>
    /// Save image as WebP format with specified quality
    /// </summary>
    /// <param name="image">Image to save</param>
    /// <param name="path">Destination path</param>
    /// <param name="quality">Quality (0-100)</param>
    public static async Task SaveAsWebPAsync(Image image, string path, int quality = 85)
    {
        var encoder = new WebpEncoder
        {
            Quality = quality
        };

        await image.SaveAsync(path, encoder);
    }

    /// <summary>
    /// Save image as JPEG format with specified quality
    /// </summary>
    /// <param name="image">Image to save</param>
    /// <param name="path">Destination path</param>
    /// <param name="quality">Quality (0-100)</param>
    public static async Task SaveAsJpegAsync(Image image, string path, int quality = 85)
    {
        var encoder = new JpegEncoder
        {
            Quality = quality
        };

        await image.SaveAsync(path, encoder);
    }

    /// <summary>
    /// Validate if the stream contains a valid image
    /// </summary>
    /// <param name="stream">Stream to validate</param>
    /// <returns>True if valid image</returns>
    public static async Task<bool> IsValidImageAsync(Stream stream)
    {
        try
        {
            var originalPosition = stream.Position;
            await Image.IdentifyAsync(stream);
            stream.Position = originalPosition;
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Get the file extension for the optimized format (WebP)
    /// </summary>
    public static string GetOptimizedExtension() => ".webp";

    /// <summary>
    /// Generate all size variants for an image
    /// </summary>
    /// <param name="sourceImage">Source image</param>
    /// <param name="basePath">Base directory path</param>
    /// <param name="baseFileName">Base file name without extension</param>
    /// <returns>List of generated file paths</returns>
    public static async Task<List<string>> GenerateAllVariantsAsync(Image sourceImage, string basePath, string baseFileName)
    {
        var generatedPaths = new List<string>();
        var extension = GetOptimizedExtension();

        // Save original (high quality)
        var originalPath = Path.Combine(basePath, $"{baseFileName}-{ImageSizes.Original}{extension}");
        await SaveAsWebPAsync(sourceImage, originalPath, quality: 95);
        generatedPaths.Add(originalPath);

        // Generate and save thumbnails
        var sizes = new[] { ImageSizes.Large, ImageSizes.Medium, ImageSizes.Thumb };
        foreach (var size in sizes)
        {
            var maxDimension = ImageSizes.GetMaxDimension(size);
            using var resizedImage = ResizeImage(sourceImage, maxDimension);

            var path = Path.Combine(basePath, $"{baseFileName}-{size}{extension}");
            await SaveAsWebPAsync(resizedImage, path);
            generatedPaths.Add(path);
        }

        return generatedPaths;
    }
}
