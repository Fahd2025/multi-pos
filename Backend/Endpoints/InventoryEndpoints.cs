using Backend.Models.DTOs.Inventory;
using Backend.Services.Inventory;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Endpoints;

/// <summary>
/// Inventory management endpoints for categories, products, and purchases
/// </summary>
public static class InventoryEndpoints
{
    /// <summary>
    /// Maps inventory endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapInventoryEndpoints(this IEndpointRouteBuilder app)
    {
        var categoryGroup = app.MapGroup("/api/v1/categories").WithTags("Categories");
        var productGroup = app.MapGroup("/api/v1/products").WithTags("Products");
        var purchaseGroup = app.MapGroup("/api/v1/purchases").WithTags("Purchases");

        // ============================================
        // Category Endpoints
        // ============================================

        // GET /api/v1/categories - Get all categories
        categoryGroup
            .MapGet(
                "",
                async (
                    HttpContext httpContext,
                    IInventoryService inventoryService,
                    bool includeInactive = false
                ) =>
                {
                    try
                    {
                        var categories = await inventoryService.GetCategoriesAsync(includeInactive);
                        return Results.Ok(new { success = true, data = categories });
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
            .WithName("GetCategories")
            .WithOpenApi();

        // POST /api/v1/categories - Create a new category
        categoryGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreateCategoryRequest request,
                    HttpContext httpContext,
                    IInventoryService inventoryService
                ) =>
                {
                    try
                    {
                        var userId = httpContext.Items["UserId"] as Guid?;
                        if (!userId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        var category = await inventoryService.CreateCategoryAsync(
                            request.Code,
                            request.NameEn,
                            request.NameAr,
                            request.DescriptionEn,
                            request.DescriptionAr,
                            request.ParentCategoryId,
                            request.DisplayOrder,
                            userId.Value
                        );

                        return Results.Created(
                            $"/api/v1/categories/{category.Id}",
                            new
                            {
                                success = true,
                                data = category,
                                message = "Category created successfully",
                            }
                        );
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                error = new { code = "INVALID_OPERATION", message = ex.Message },
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("CreateCategory")
            .WithOpenApi();

        // PUT /api/v1/categories/:id - Update a category
        categoryGroup
            .MapPut(
                "/{id:guid}",
                async (
                    Guid id,
                    [FromBody] UpdateCategoryRequest request,
                    IInventoryService inventoryService
                ) =>
                {
                    try
                    {
                        var category = await inventoryService.UpdateCategoryAsync(
                            id,
                            request.Code,
                            request.NameEn,
                            request.NameAr,
                            request.DescriptionEn,
                            request.DescriptionAr,
                            request.ParentCategoryId,
                            request.DisplayOrder
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = category,
                                message = "Category updated successfully",
                            }
                        );
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                error = new { code = "INVALID_OPERATION", message = ex.Message },
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("UpdateCategory")
            .WithOpenApi();

        // DELETE /api/v1/categories/:id - Delete a category
        categoryGroup
            .MapDelete(
                "/{id:guid}",
                async (Guid id, IInventoryService inventoryService) =>
                {
                    try
                    {
                        await inventoryService.DeleteCategoryAsync(id);
                        return Results.Ok(
                            new { success = true, message = "Category deleted successfully" }
                        );
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                error = new { code = "INVALID_OPERATION", message = ex.Message },
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("DeleteCategory")
            .WithOpenApi();

        // ============================================
        // Product Endpoints
        // ============================================

        // GET /api/v1/products - Get products with filtering
        productGroup
            .MapGet(
                "",
                async (
                    IInventoryService inventoryService,
                    string? search = null,
                    Guid? categoryId = null,
                    bool? isActive = null,
                    bool? lowStockOnly = null,
                    int page = 1,
                    int pageSize = 50
                ) =>
                {
                    try
                    {
                        var (products, totalCount) = await inventoryService.GetProductsAsync(
                            search,
                            categoryId,
                            isActive,
                            lowStockOnly,
                            page,
                            pageSize
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = products,
                                pagination = new
                                {
                                    page,
                                    pageSize,
                                    totalItems = totalCount,
                                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                                },
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
            .WithName("GetProducts")
            .WithOpenApi();

        // POST /api/v1/products - Create a new product
        productGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreateProductDto dto,
                    HttpContext httpContext,
                    IInventoryService inventoryService
                ) =>
                {
                    try
                    {
                        var userId = httpContext.Items["UserId"] as Guid?;
                        if (!userId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        var product = await inventoryService.CreateProductAsync(dto, userId.Value);

                        return Results.Created(
                            $"/api/v1/products/{product.Id}",
                            new
                            {
                                success = true,
                                data = product,
                                message = "Product created successfully",
                            }
                        );
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                error = new { code = "INVALID_OPERATION", message = ex.Message },
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("CreateProduct")
            .WithOpenApi();

        // PUT /api/v1/products/:id - Update a product
        productGroup
            .MapPut(
                "/{id:guid}",
                async (
                    Guid id,
                    [FromBody] UpdateProductDto dto,
                    IInventoryService inventoryService
                ) =>
                {
                    try
                    {
                        var product = await inventoryService.UpdateProductAsync(id, dto);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = product,
                                message = "Product updated successfully",
                            }
                        );
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                error = new { code = "INVALID_OPERATION", message = ex.Message },
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("UpdateProduct")
            .WithOpenApi();

        // DELETE /api/v1/products/:id - Delete a product
        productGroup
            .MapDelete(
                "/{id:guid}",
                async (Guid id, IInventoryService inventoryService) =>
                {
                    try
                    {
                        await inventoryService.DeleteProductAsync(id);
                        return Results.Ok(new { success = true, message = "Product deleted successfully" });
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                error = new { code = "INVALID_OPERATION", message = ex.Message },
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("DeleteProduct")
            .WithOpenApi();

        // POST /api/v1/products/:id/adjust-stock - Adjust product stock
        productGroup
            .MapPost(
                "/{id:guid}/adjust-stock",
                async (
                    Guid id,
                    [FromBody] StockAdjustmentDto dto,
                    HttpContext httpContext,
                    IInventoryService inventoryService
                ) =>
                {
                    try
                    {
                        var userId = httpContext.Items["UserId"] as Guid?;
                        if (!userId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        dto.ProductId = id;
                        var product = await inventoryService.AdjustStockAsync(id, dto, userId.Value);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = product,
                                message = $"Stock adjusted successfully. New stock level: {dto.NewStockLevel}",
                            }
                        );
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                error = new { code = "INVALID_OPERATION", message = ex.Message },
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("AdjustStock")
            .WithOpenApi();

        // ============================================
        // Purchase Endpoints
        // ============================================

        // GET /api/v1/purchases - Get purchases with filtering
        purchaseGroup
            .MapGet(
                "",
                async (
                    IInventoryService inventoryService,
                    Guid? supplierId = null,
                    DateTime? startDate = null,
                    DateTime? endDate = null,
                    int? paymentStatus = null,
                    int page = 1,
                    int pageSize = 50
                ) =>
                {
                    try
                    {
                        var (purchases, totalCount) = await inventoryService.GetPurchasesAsync(
                            supplierId,
                            startDate,
                            endDate,
                            paymentStatus,
                            page,
                            pageSize
                        );

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = purchases,
                                pagination = new
                                {
                                    page,
                                    pageSize,
                                    totalItems = totalCount,
                                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                                },
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
            .WithName("GetPurchases")
            .WithOpenApi();

        // POST /api/v1/purchases - Create a new purchase
        purchaseGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreatePurchaseDto dto,
                    HttpContext httpContext,
                    IInventoryService inventoryService
                ) =>
                {
                    try
                    {
                        var userId = httpContext.Items["UserId"] as Guid?;
                        if (!userId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        var purchase = await inventoryService.CreatePurchaseAsync(dto, userId.Value);

                        return Results.Created(
                            $"/api/v1/purchases/{purchase.Id}",
                            new
                            {
                                success = true,
                                data = purchase,
                                message = "Purchase created successfully",
                            }
                        );
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                error = new { code = "INVALID_OPERATION", message = ex.Message },
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("CreatePurchase")
            .WithOpenApi();

        // POST /api/v1/purchases/:id/receive - Mark purchase as received and update stock
        purchaseGroup
            .MapPost(
                "/{id:guid}/receive",
                async (
                    Guid id,
                    HttpContext httpContext,
                    IInventoryService inventoryService
                ) =>
                {
                    try
                    {
                        var userId = httpContext.Items["UserId"] as Guid?;
                        if (!userId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        var purchase = await inventoryService.ReceivePurchaseAsync(id, userId.Value);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = purchase,
                                message = "Purchase marked as received and inventory updated successfully",
                            }
                        );
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                error = new { code = "INVALID_OPERATION", message = ex.Message },
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("ReceivePurchase")
            .WithOpenApi();

        return app;
    }
}
