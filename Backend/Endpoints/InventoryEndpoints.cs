using Backend.Constants;
using Backend.Models.DTOs.Branch.Inventory;
using Backend.Services.Branch.Inventory;
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
        var categoryGroup = app.MapGroup(ApiRoutes.Categories.Group).WithTags("Categories");
        var unitGroup = app.MapGroup(ApiRoutes.Units.Group).WithTags("Units");
        var productGroup = app.MapGroup(ApiRoutes.Products.Group).WithTags("Products");
        var purchaseGroup = app.MapGroup(ApiRoutes.Purchases.Group).WithTags("Purchases");

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

        // GET /api/v1/products/barcode/{barcode} - Get product by barcode
        productGroup
            .MapGet(
                "/barcode/{barcode}",
                async (
                    string barcode,
                    IInventoryService inventoryService
                ) =>
                {
                    try
                    {
                        var product = await inventoryService.GetProductByBarcodeAsync(barcode);

                        if (product == null)
                        {
                            return Results.NotFound(
                                new { success = false, error = new { code = "NOT_FOUND", message = $"Product with barcode '{barcode}' not found" } }
                            );
                        }

                        return Results.Ok(new { success = true, data = product });
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
            .WithName("GetProductByBarcode")
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

                        // Get branch context
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        var branchId = branch?.Id;

                        dto.ProductId = id;
                        var product = await inventoryService.AdjustStockAsync(id, dto, userId.Value, branchId);

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

        // GET /api/v1/products/:id/stock-history - Get stock adjustment history for a product
        productGroup
            .MapGet(
                "/{id:guid}/stock-history",
                async (
                    Guid id,
                    HttpContext httpContext,
                    Backend.Services.HeadOffice.Audit.IAuditService auditService,
                    int page = 1,
                    int pageSize = 50
                ) =>
                {
                    try
                    {
                        var userId = httpContext.Items["UserId"] as Guid?;
                        if (!userId.HasValue)
                        {
                            return Results.Unauthorized();
                        }

                        // Get stock adjustment audit logs for this product
                        var (logs, totalCount) = await auditService.GetAuditLogsAsync(
                            userId: null,
                            branchId: null,
                            eventType: "InventoryManagement",
                            action: "StockAdjustment",
                            fromDate: null,
                            toDate: null,
                            page: page,
                            pageSize: pageSize
                        );

                        // Filter logs for this specific product
                        var productLogs = logs.Where(l => l.EntityId == id).ToList();
                        var productLogsCount = productLogs.Count;

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = productLogs,
                                pagination = new
                                {
                                    page,
                                    pageSize,
                                    totalItems = productLogsCount,
                                    totalPages = (int)Math.Ceiling(productLogsCount / (double)pageSize),
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
            .WithName("GetProductStockHistory")
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
                    string? search = null,
                    string? supplierName = null,
                    string? status = null,
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
                            search,
                            supplierName,
                            status,
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

                        // Get branch from context
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.BadRequest(
                                new
                                {
                                    success = false,
                                    error = new { code = "BRANCH_REQUIRED", message = "Branch context is required" }
                                }
                            );
                        }

                        var purchase = await inventoryService.CreatePurchaseAsync(dto, userId.Value, branch.Code);

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

        // PUT /api/v1/purchases/:id - Update an existing purchase
        purchaseGroup
            .MapPut(
                "/{id:guid}",
                async (
                    Guid id,
                    [FromBody] UpdatePurchaseDto dto,
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

                        var purchase = await inventoryService.UpdatePurchaseAsync(id, dto, userId.Value);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = purchase,
                                message = "Purchase updated successfully",
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
            .WithName("UpdatePurchase")
            .WithOpenApi();

        // DELETE /api/v1/purchases/:id - Delete a purchase
        purchaseGroup
            .MapDelete(
                "/{id:guid}",
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

                        await inventoryService.DeletePurchaseAsync(id, userId.Value);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                message = "Purchase deleted successfully",
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
            .WithName("DeletePurchase")
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

        // ============================================
        // Unit Endpoints
        // ============================================

        // GET /api/v1/units - Get all units
        unitGroup
            .MapGet(
                "",
                async (
                    IInventoryService inventoryService,
                    bool includeInactive = false
                ) =>
                {
                    try
                    {
                        var units = await inventoryService.GetUnitsAsync(includeInactive);
                        return Results.Ok(new { success = true, data = units });
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
            .WithName("GetUnits")
            .WithOpenApi();

        // GET /api/v1/units/base - Get base units only
        unitGroup
            .MapGet(
                "/base",
                async (IInventoryService inventoryService) =>
                {
                    try
                    {
                        var units = await inventoryService.GetBaseUnitsAsync();
                        return Results.Ok(new { success = true, data = units });
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
            .WithName("GetBaseUnits")
            .WithOpenApi();

        // GET /api/v1/units/{id} - Get unit by ID
        unitGroup
            .MapGet(
                "/{id:guid}",
                async (
                    Guid id,
                    IInventoryService inventoryService
                ) =>
                {
                    try
                    {
                        var unit = await inventoryService.GetUnitByIdAsync(id);
                        if (unit == null)
                        {
                            return Results.NotFound(
                                new { success = false, error = new { code = "NOT_FOUND", message = "Unit not found" } }
                            );
                        }
                        return Results.Ok(new { success = true, data = unit });
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
            .WithName("GetUnitById")
            .WithOpenApi();

        // POST /api/v1/units - Create a new unit
        unitGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreateUnitRequest request,
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

                        var unit = await inventoryService.CreateUnitAsync(request, userId.Value);

                        return Results.Created(
                            $"/api/v1/units/{unit.Id}",
                            new
                            {
                                success = true,
                                data = unit,
                                message = "Unit created successfully",
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
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("CreateUnit")
            .WithOpenApi();

        // PUT /api/v1/units/{id} - Update a unit
        unitGroup
            .MapPut(
                "/{id:guid}",
                async (
                    Guid id,
                    [FromBody] UpdateUnitRequest request,
                    IInventoryService inventoryService
                ) =>
                {
                    try
                    {
                        var unit = await inventoryService.UpdateUnitAsync(id, request);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = unit,
                                message = "Unit updated successfully",
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
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("UpdateUnit")
            .WithOpenApi();

        // DELETE /api/v1/units/{id} - Delete a unit
        unitGroup
            .MapDelete(
                "/{id:guid}",
                async (Guid id, IInventoryService inventoryService) =>
                {
                    try
                    {
                        await inventoryService.DeleteUnitAsync(id);
                        return Results.Ok(
                            new { success = true, message = "Unit deleted successfully" }
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
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new { success = false, error = new { code = "ERROR", message = ex.Message } }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("DeleteUnit")
            .WithOpenApi();

        return app;
    }
}
