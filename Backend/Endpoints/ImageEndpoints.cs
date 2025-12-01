using Backend.Data.Branch;
using Backend.Data.HeadOffice;
using Backend.Data.Shared;
using Backend.Services.Branch.Images;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Endpoints;

/// <summary>
/// Image management endpoints
/// </summary>
public static class ImageEndpoints
{
    /// <summary>
    /// Maps image endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapImageEndpoints(this IEndpointRouteBuilder app)
    {
        var imagesGroup = app.MapGroup("/api/v1/images").WithTags("Images");

        // POST /api/v1/images/upload - Upload an image for an entity
        imagesGroup
            .MapPost(
                "/upload",
                async (
                    HttpContext httpContext,
                    IImageService imageService,
                    DbContextFactory dbContextFactory,
                    HeadOfficeDbContext headOfficeDbContext
                ) =>
                {
                    try
                    {
                        // Get form data
                        var form = await httpContext.Request.ReadFormAsync();
                        var file = form.Files["image"];

                        if (file == null || file.Length == 0)
                        {
                            return Results.BadRequest(
                                new
                                {
                                    success = false,
                                    error = new { code = "NO_FILE", message = "No image file provided" },
                                }
                            );
                        }

                        // Get parameters
                        var branchName = form["branchName"].ToString();
                        var entityType = form["entityType"].ToString();
                        var entityIdStr = form["entityId"].ToString();

                        if (
                            string.IsNullOrWhiteSpace(branchName)
                            || string.IsNullOrWhiteSpace(entityType)
                            || string.IsNullOrWhiteSpace(entityIdStr)
                        )
                        {
                            return Results.BadRequest(
                                new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "MISSING_PARAMETERS",
                                        message = "branchName, entityType, and entityId are required",
                                    },
                                }
                            );
                        }

                        if (!Guid.TryParse(entityIdStr, out var entityId))
                        {
                            return Results.BadRequest(
                                new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "INVALID_ENTITY_ID",
                                        message = "entityId must be a valid GUID",
                                    },
                                }
                            );
                        }

                        // Upload image
                        using var stream = file.OpenReadStream();
                        var result = await imageService.UploadImageAsync(
                            branchName,
                            entityType,
                            entityId,
                            stream,
                            file.FileName
                        );

                        if (!result.Success)
                        {
                            return Results.BadRequest(
                                new
                                {
                                    success = false,
                                    error = new { code = "UPLOAD_FAILED", message = result.ErrorMessage },
                                }
                            );
                        }

                        // Update the entity's image path field in the database
                        try
                        {
                            var entityTypeLower = entityType.ToLower();

                            // For branch-scoped entities, get the BranchDbContext from the factory
                            if (
                                entityTypeLower == "customers"
                                || entityTypeLower == "suppliers"
                                || entityTypeLower == "expenses"
                                || entityTypeLower == "categories"
                            )
                            {
                                // Get branch from HttpContext
                                var branch =
                                    httpContext.Items["Branch"]
                                    as Backend.Models.Entities.HeadOffice.Branch;
                                if (branch != null)
                                {
                                    using var branchDbContext = dbContextFactory.CreateBranchContext(
                                        branch
                                    );

                                    switch (entityTypeLower)
                                    {
                                        case "customers":
                                            var customer = await branchDbContext.Customers.FindAsync(
                                                entityId
                                            );
                                            if (customer != null)
                                            {
                                                customer.LogoPath = entityId.ToString(); // Store entity ID to reference the image
                                                await branchDbContext.SaveChangesAsync();
                                            }
                                            break;

                                        case "suppliers":
                                            var supplier = await branchDbContext.Suppliers.FindAsync(
                                                entityId
                                            );
                                            if (supplier != null)
                                            {
                                                supplier.LogoPath = entityId.ToString(); // Store entity ID to reference the image
                                                await branchDbContext.SaveChangesAsync();
                                            }
                                            break;

                                        case "expenses":
                                            var expense = await branchDbContext.Expenses.FindAsync(
                                                entityId
                                            );
                                            if (expense != null)
                                            {
                                                expense.ReceiptImagePath = entityId.ToString(); // Store entity ID to reference the image
                                                await branchDbContext.SaveChangesAsync();
                                            }
                                            break;

                                        case "categories":
                                            var category = await branchDbContext.Categories.FindAsync(
                                                entityId
                                            );
                                            if (category != null)
                                            {
                                                category.ImagePath = entityId.ToString(); // Store entity ID to reference the image
                                                await branchDbContext.SaveChangesAsync();
                                            }
                                            break;
                                    }
                                }
                            }
                            else if (entityTypeLower == "branches")
                            {
                                var branchEntity = await headOfficeDbContext.Branches.FindAsync(entityId);
                                if (branchEntity != null)
                                {
                                    // For branches, store the entity ID in LogoPath to reference the image
                                    branchEntity.LogoPath = entityId.ToString();
                                    await headOfficeDbContext.SaveChangesAsync();
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            // Log error but don't fail the request since image was uploaded successfully
                            Console.WriteLine(
                                $"Warning: Could not update {entityType} {entityId} image path: {ex.Message}"
                            );
                        }

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = new
                                {
                                    originalPath = result.OriginalPath,
                                    thumbnailPaths = result.ThumbnailPaths,
                                },
                                message = "Image uploaded successfully",
                            }
                        );
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("UploadImage")
            .WithOpenApi()
            .DisableAntiforgery();

        // GET /api/v1/images/{branchName}/{entityType}/{entityId}/{size} - Serve an image
        imagesGroup
            .MapGet(
                "/{branchName}/{entityType}/{entityId:guid}/{size}",
                (
                    HttpContext context,
                    string branchName,
                    string entityType,
                    Guid entityId,
                    string size,
                    IImageService imageService
                ) =>
                {
                    try
                    {
                        // Validate size
                        var validSizes = new[] { "original", "large", "medium", "thumb" };
                        if (!validSizes.Contains(size.ToLower()))
                        {
                            return Results.BadRequest(
                                new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "INVALID_SIZE",
                                        message = $"Size must be one of: {string.Join(", ", validSizes)}",
                                    },
                                }
                            );
                        }

                        // For ProductImages, entityId is the imageId, but files are stored under productId
                        // Check if there's a productId query parameter for multi-image entities
                        string imagePath;
                        if (
                            context.Request.Query.TryGetValue("productId", out var productIdStr)
                            && Guid.TryParse(productIdStr, out var productId)
                        )
                        {
                            // For ProductImages: files are in Products/{productId}/{imageId}-{size}.webp
                            var baseDir = Path.Combine(
                                imageService
                                    .GetType()
                                    .GetField(
                                        "_uploadBasePath",
                                        System.Reflection.BindingFlags.NonPublic
                                            | System.Reflection.BindingFlags.Instance
                                    )
                                    ?.GetValue(imageService) as string
                                    ?? "Upload",
                                "Branches",
                                branchName,
                                entityType,
                                productId.ToString()
                            );

                            var fileExtension = ".webp";
                            var pattern = $"{entityId}-{size}{fileExtension}";
                            var files = Directory.Exists(baseDir)
                                ? Directory.GetFiles(baseDir, pattern)
                                : Array.Empty<string>();
                            imagePath = files.FirstOrDefault() ?? string.Empty;
                        }
                        else
                        {
                            // Standard single-image entities
                            imagePath = imageService.GetImagePath(branchName, entityType, entityId, size);
                        }

                        // Check if image exists
                        if (string.IsNullOrEmpty(imagePath) || !File.Exists(imagePath))
                        {
                            return Results.NotFound(
                                new
                                {
                                    success = false,
                                    error = new { code = "NOT_FOUND", message = "Image file not found" },
                                }
                            );
                        }

                        // Determine content type
                        var extension = Path.GetExtension(imagePath).ToLower();
                        var contentType = extension switch
                        {
                            ".webp" => "image/webp",
                            ".jpg" or ".jpeg" => "image/jpeg",
                            ".png" => "image/png",
                            _ => "application/octet-stream",
                        };

                        // Serve the image file
                        return Results.File(imagePath, contentType, enableRangeProcessing: true);
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .WithName("ServeImage")
            .WithOpenApi();

        // DELETE /api/v1/images/{branchName}/{entityType}/{entityId} - Delete all images for an entity
        imagesGroup
            .MapDelete(
                "/{branchName}/{entityType}/{entityId:guid}",
                async (
                    string branchName,
                    string entityType,
                    Guid entityId,
                    HttpContext httpContext,
                    IImageService imageService,
                    DbContextFactory dbContextFactory,
                    HeadOfficeDbContext headOfficeDbContext
                ) =>
                {
                    try
                    {
                        var success = await imageService.DeleteImageAsync(branchName, entityType, entityId);

                        // For Products, we need to clean up database records even if files don't exist
                        // For other entities, return 404 if files not found
                        if (!success && entityType.ToLower() != "products")
                        {
                            return Results.NotFound(
                                new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "NOT_FOUND",
                                        message = "Images not found or already deleted",
                                    },
                                }
                            );
                        }

                        // Clear the entity's image path field in the database
                        try
                        {
                            var entityTypeLower = entityType.ToLower();

                            // For branch-scoped entities, get the BranchDbContext from the factory
                            if (
                                entityTypeLower == "customers"
                                || entityTypeLower == "suppliers"
                                || entityTypeLower == "expenses"
                                || entityTypeLower == "categories"
                                || entityTypeLower == "products"
                            )
                            {
                                // Get branch from HttpContext
                                var branch =
                                    httpContext.Items["Branch"]
                                    as Backend.Models.Entities.HeadOffice.Branch;
                                if (branch != null)
                                {
                                    using var branchDbContext = dbContextFactory.CreateBranchContext(
                                        branch
                                    );

                                    switch (entityTypeLower)
                                    {
                                        case "customers":
                                            var customer = await branchDbContext.Customers.FindAsync(
                                                entityId
                                            );
                                            if (customer != null)
                                            {
                                                customer.LogoPath = null;
                                                await branchDbContext.SaveChangesAsync();
                                            }
                                            break;

                                        case "suppliers":
                                            var supplier = await branchDbContext.Suppliers.FindAsync(
                                                entityId
                                            );
                                            if (supplier != null)
                                            {
                                                supplier.LogoPath = null;
                                                await branchDbContext.SaveChangesAsync();
                                            }
                                            break;

                                        case "expenses":
                                            var expense = await branchDbContext.Expenses.FindAsync(
                                                entityId
                                            );
                                            if (expense != null)
                                            {
                                                expense.ReceiptImagePath = null;
                                                await branchDbContext.SaveChangesAsync();
                                            }
                                            break;

                                        case "categories":
                                            var category = await branchDbContext.Categories.FindAsync(
                                                entityId
                                            );
                                            if (category != null)
                                            {
                                                category.ImagePath = null;
                                                await branchDbContext.SaveChangesAsync();
                                            }
                                            break;

                                        case "products":
                                            // For products, delete all ProductImage records
                                            var productImages = branchDbContext
                                                .ProductImages.Where(pi => pi.ProductId == entityId)
                                                .ToList();

                                            if (productImages.Any())
                                            {
                                                branchDbContext.ProductImages.RemoveRange(productImages);
                                                await branchDbContext.SaveChangesAsync();
                                            }
                                            break;
                                    }
                                }
                            }
                            else if (entityTypeLower == "branches")
                            {
                                var branchEntity = await headOfficeDbContext.Branches.FindAsync(entityId);
                                if (branchEntity != null)
                                {
                                    branchEntity.LogoPath = null;
                                    await headOfficeDbContext.SaveChangesAsync();
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            // Log error but don't fail the request since image was deleted successfully
                            Console.WriteLine(
                                $"Warning: Could not clear {entityType} {entityId} image path: {ex.Message}"
                            );
                        }

                        return Results.Ok(new { success = true, message = "Images deleted successfully" });
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("DeleteImage")
            .WithOpenApi();

        // PATCH /api/v1/images/products/{productId} - Update product images (keep some, delete others, add new)
        imagesGroup
            .MapPatch(
                "/products/{productId:guid}",
                async (
                    Guid productId,
                    HttpContext httpContext,
                    IImageService imageService,
                    DbContextFactory dbContextFactory
                ) =>
                {
                    try
                    {
                        // Get form data
                        var form = await httpContext.Request.ReadFormAsync();
                        var files = form.Files.GetFiles("images");
                        var branchName = form["branchName"].ToString();
                        var imageIdsToKeepStr = form["imageIdsToKeep"].ToString();

                        if (string.IsNullOrWhiteSpace(branchName))
                        {
                            return Results.BadRequest(
                                new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "MISSING_BRANCH_NAME",
                                        message = "branchName is required",
                                    },
                                }
                            );
                        }

                        // Get branch context
                        var branch =
                            httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.Unauthorized();
                        }

                        using var branchDbContext = dbContextFactory.CreateBranchContext(branch);

                        // Parse imageIds to keep
                        var imageIdsToKeep = new List<Guid>();
                        if (!string.IsNullOrWhiteSpace(imageIdsToKeepStr))
                        {
                            imageIdsToKeep = imageIdsToKeepStr
                                .Split(',')
                                .Where(s => Guid.TryParse(s.Trim(), out _))
                                .Select(s => Guid.Parse(s.Trim()))
                                .ToList();
                        }

                        // Get existing ProductImage records
                        var existingImages = branchDbContext
                            .ProductImages.Where(pi => pi.ProductId == productId)
                            .ToList();

                        // Delete ProductImage records that are NOT in the keep list
                        var imagesToDelete = existingImages
                            .Where(img => !imageIdsToKeep.Contains(img.Id))
                            .ToList();

                        if (imagesToDelete.Any())
                        {
                            // Delete files from disk
                            foreach (var imgToDelete in imagesToDelete)
                            {
                                var baseDir = Path.Combine(
                                    imageService
                                        .GetType()
                                        .GetField(
                                            "_uploadBasePath",
                                            System.Reflection.BindingFlags.NonPublic
                                                | System.Reflection.BindingFlags.Instance
                                        )
                                        ?.GetValue(imageService) as string
                                        ?? "Upload",
                                    "Branches",
                                    branchName,
                                    "Products",
                                    productId.ToString()
                                );

                                if (Directory.Exists(baseDir))
                                {
                                    var filesToDelete = Directory.GetFiles(
                                        baseDir,
                                        $"{imgToDelete.Id}-*.*"
                                    );
                                    foreach (var file in filesToDelete)
                                    {
                                        try
                                        {
                                            File.Delete(file);
                                        }
                                        catch (Exception ex)
                                        {
                                            Console.WriteLine(
                                                $"Warning: Could not delete file {file}: {ex.Message}"
                                            );
                                        }
                                    }
                                }
                            }

                            // Remove from database
                            branchDbContext.ProductImages.RemoveRange(imagesToDelete);
                            await branchDbContext.SaveChangesAsync();
                        }

                        // Upload new images
                        var uploadedImages = new List<object>();
                        if (files != null && files.Count > 0)
                        {
                            // Get the current max display order
                            var maxDisplayOrder = existingImages
                                .Where(img => imageIdsToKeep.Contains(img.Id))
                                .Select(img => img.DisplayOrder)
                                .DefaultIfEmpty(-1)
                                .Max();

                            var displayOrder = maxDisplayOrder + 1;
                            var userId = Guid.Parse(
                                httpContext.User.FindFirst("sub")?.Value ?? Guid.Empty.ToString()
                            );

                            foreach (var file in files)
                            {
                                if (file.Length == 0)
                                    continue;

                                var imageId = Guid.NewGuid();

                                using var stream = file.OpenReadStream();
                                var result = await imageService.UploadImageWithCustomIdAsync(
                                    branchName,
                                    "Products",
                                    productId,
                                    imageId,
                                    stream,
                                    file.FileName,
                                    skipDelete: true
                                );

                                if (!result.Success)
                                {
                                    return Results.BadRequest(
                                        new
                                        {
                                            success = false,
                                            error = new
                                            {
                                                code = "UPLOAD_FAILED",
                                                message = $"Failed to upload {file.FileName}: {result.ErrorMessage}",
                                            },
                                        }
                                    );
                                }

                                var productImage = new Backend.Models.Entities.Branch.ProductImage
                                {
                                    Id = imageId,
                                    ProductId = productId,
                                    ImagePath = imageId.ToString(),
                                    ThumbnailPath = imageId.ToString(),
                                    DisplayOrder = displayOrder++,
                                    UploadedAt = DateTime.UtcNow,
                                    UploadedBy = userId,
                                };

                                branchDbContext.ProductImages.Add(productImage);
                                uploadedImages.Add(
                                    new
                                    {
                                        id = imageId,
                                        imagePath = imageId.ToString(),
                                        thumbnailPath = imageId.ToString(),
                                        displayOrder = productImage.DisplayOrder,
                                    }
                                );
                            }

                            await branchDbContext.SaveChangesAsync();
                        }

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = new
                                {
                                    keptCount = imageIdsToKeep.Count,
                                    deletedCount = imagesToDelete.Count,
                                    uploadedCount = uploadedImages.Count,
                                    uploadedImages = uploadedImages,
                                },
                                message = $"Updated images: kept {imageIdsToKeep.Count}, deleted {imagesToDelete.Count}, uploaded {uploadedImages.Count}",
                            }
                        );
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("UpdateProductImages")
            .WithOpenApi()
            .DisableAntiforgery();

        // POST /api/v1/images/upload-multiple - Upload multiple images for a product
        imagesGroup
            .MapPost(
                "/upload-multiple",
                async (
                    HttpContext httpContext,
                    IImageService imageService,
                    DbContextFactory dbContextFactory
                ) =>
                {
                    try
                    {
                        // Get form data
                        var form = await httpContext.Request.ReadFormAsync();
                        var files = form.Files.GetFiles("images");

                        if (files == null || files.Count == 0)
                        {
                            return Results.BadRequest(
                                new
                                {
                                    success = false,
                                    error = new { code = "NO_FILES", message = "No image files provided" },
                                }
                            );
                        }

                        // Get parameters
                        var branchName = form["branchName"].ToString();
                        var entityType = form["entityType"].ToString();
                        var entityIdStr = form["entityId"].ToString();

                        if (
                            string.IsNullOrWhiteSpace(branchName)
                            || string.IsNullOrWhiteSpace(entityType)
                            || string.IsNullOrWhiteSpace(entityIdStr)
                        )
                        {
                            return Results.BadRequest(
                                new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "MISSING_PARAMETERS",
                                        message = "branchName, entityType, and entityId are required",
                                    },
                                }
                            );
                        }

                        if (!Guid.TryParse(entityIdStr, out var entityId))
                        {
                            return Results.BadRequest(
                                new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "INVALID_ENTITY_ID",
                                        message = "entityId must be a valid GUID",
                                    },
                                }
                            );
                        }

                        // Get branch context
                        var branch =
                            httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.Unauthorized();
                        }

                        using var branchDbContext = dbContextFactory.CreateBranchContext(branch);

                        // Delete all existing ProductImage records for this product
                        var existingImages = branchDbContext
                            .ProductImages.Where(pi => pi.ProductId == entityId)
                            .ToList();

                        if (existingImages.Any())
                        {
                            branchDbContext.ProductImages.RemoveRange(existingImages);
                            await branchDbContext.SaveChangesAsync();
                        }

                        // Delete all existing image files from disk
                        await imageService.DeleteImageAsync(branchName, entityType, entityId);

                        // Upload each new image and create ProductImage records
                        var uploadedImages = new List<object>();
                        var displayOrder = 0;

                        foreach (var file in files)
                        {
                            if (file.Length == 0)
                                continue;

                            // Generate a unique ID for this image
                            var imageId = Guid.NewGuid();

                            // Upload the image using the custom ID
                            using var stream = file.OpenReadStream();
                            var result = await imageService.UploadImageWithCustomIdAsync(
                                branchName,
                                entityType,
                                entityId,
                                imageId,
                                stream,
                                file.FileName,
                                skipDelete: true // Don't delete on each upload
                            );

                            if (!result.Success)
                            {
                                // If any upload fails, return error
                                return Results.BadRequest(
                                    new
                                    {
                                        success = false,
                                        error = new
                                        {
                                            code = "UPLOAD_FAILED",
                                            message = $"Failed to upload {file.FileName}: {result.ErrorMessage}",
                                        },
                                    }
                                );
                            }

                            // Create ProductImage record in database
                            // Note: We need to get the current user ID from the httpContext
                            var userId = Guid.Parse(
                                httpContext.User.FindFirst("sub")?.Value ?? Guid.Empty.ToString()
                            );

                            var productImage = new Backend.Models.Entities.Branch.ProductImage
                            {
                                Id = imageId,
                                ProductId = entityId,
                                ImagePath = imageId.ToString(), // Store the imageId for reference
                                ThumbnailPath = imageId.ToString(),
                                DisplayOrder = displayOrder++,
                                UploadedAt = DateTime.UtcNow,
                                UploadedBy = userId,
                            };

                            branchDbContext.ProductImages.Add(productImage);

                            uploadedImages.Add(
                                new
                                {
                                    id = imageId,
                                    imagePath = imageId.ToString(),
                                    thumbnailPath = imageId.ToString(),
                                    displayOrder = productImage.DisplayOrder,
                                }
                            );
                        }

                        // Save all ProductImage records
                        await branchDbContext.SaveChangesAsync();

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = new { images = uploadedImages, count = uploadedImages.Count },
                                message = $"Successfully uploaded {uploadedImages.Count} image(s)",
                            }
                        );
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("UploadMultipleImages")
            .WithOpenApi()
            .DisableAntiforgery();

        return app;
    }
}
