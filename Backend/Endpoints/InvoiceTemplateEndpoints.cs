using Backend.Models.DTOs.Branch.InvoiceTemplates;
using Backend.Services.Branch;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Endpoints;

/// <summary>
/// Invoice template management endpoints
/// </summary>
public static class InvoiceTemplateEndpoints
{
    /// <summary>
    /// Maps invoice template endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapInvoiceTemplateEndpoints(this IEndpointRouteBuilder app)
    {
        var templateGroup = app.MapGroup("/api/v1/invoice-templates").WithTags("Invoice Templates");

        // GET /api/v1/invoice-templates - Get all templates
        templateGroup
            .MapGet(
                "",
                async (IInvoiceTemplateService templateService) =>
                {
                    try
                    {
                        var templates = await templateService.GetTemplatesAsync();

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = templates
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
            .RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"))
            .WithName("GetInvoiceTemplates")
            .WithOpenApi();

        // GET /api/v1/invoice-templates/active - Get active template
        templateGroup
            .MapGet(
                "/active",
                async (IInvoiceTemplateService templateService) =>
                {
                    try
                    {
                        var template = await templateService.GetActiveTemplateAsync();

                        if (template == null)
                        {
                            return Results.NotFound(
                                new { success = false, error = new { code = "NOT_FOUND", message = "No active template found" } }
                            );
                        }

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = template
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
            .RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin", "Cashier"))
            .WithName("GetActiveInvoiceTemplate")
            .WithOpenApi();

        // GET /api/v1/invoice-templates/:id - Get template by ID
        templateGroup
            .MapGet(
                "/{id:guid}",
                async (Guid id, IInvoiceTemplateService templateService) =>
                {
                    try
                    {
                        var template = await templateService.GetTemplateByIdAsync(id);

                        if (template == null)
                        {
                            return Results.NotFound(
                                new { success = false, error = new { code = "NOT_FOUND", message = $"Template with ID {id} not found" } }
                            );
                        }

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = template
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
            .RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"))
            .WithName("GetInvoiceTemplateById")
            .WithOpenApi();

        // POST /api/v1/invoice-templates - Create new template
        templateGroup
            .MapPost(
                "",
                async (
                    [FromBody] CreateInvoiceTemplateDto dto,
                    IInvoiceTemplateService templateService,
                    ClaimsPrincipal user
                ) =>
                {
                    try
                    {
                        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                        {
                            return Results.Unauthorized();
                        }

                        var template = await templateService.CreateTemplateAsync(dto, userId);

                        return Results.Created(
                            $"/api/v1/invoice-templates/{template.Id}",
                            new
                            {
                                success = true,
                                data = template
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
            .RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"))
            .WithName("CreateInvoiceTemplate")
            .WithOpenApi();

        // PUT /api/v1/invoice-templates/:id - Update template
        templateGroup
            .MapPut(
                "/{id:guid}",
                async (
                    Guid id,
                    [FromBody] UpdateInvoiceTemplateDto dto,
                    IInvoiceTemplateService templateService
                ) =>
                {
                    try
                    {
                        var template = await templateService.UpdateTemplateAsync(id, dto);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = template
                            }
                        );
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.NotFound(
                            new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
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
            .RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"))
            .WithName("UpdateInvoiceTemplate")
            .WithOpenApi();

        // DELETE /api/v1/invoice-templates/:id - Delete template
        templateGroup
            .MapDelete(
                "/{id:guid}",
                async (Guid id, IInvoiceTemplateService templateService) =>
                {
                    try
                    {
                        var deleted = await templateService.DeleteTemplateAsync(id);

                        if (!deleted)
                        {
                            return Results.NotFound(
                                new { success = false, error = new { code = "NOT_FOUND", message = $"Template with ID {id} not found" } }
                            );
                        }

                        return Results.Ok(
                            new
                            {
                                success = true,
                                message = "Template deleted successfully"
                            }
                        );
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(
                            new { success = false, error = new { code = "CANNOT_DELETE_ACTIVE", message = ex.Message } }
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
            .RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"))
            .WithName("DeleteInvoiceTemplate")
            .WithOpenApi();

        // POST /api/v1/invoice-templates/:id/set-active - Set template as active
        templateGroup
            .MapPost(
                "/{id:guid}/set-active",
                async (Guid id, IInvoiceTemplateService templateService) =>
                {
                    try
                    {
                        var template = await templateService.SetActiveTemplateAsync(id);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = template,
                                message = "Template set as active"
                            }
                        );
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.NotFound(
                            new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
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
            .RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"))
            .WithName("SetActiveInvoiceTemplate")
            .WithOpenApi();

        // POST /api/v1/invoice-templates/:id/duplicate - Duplicate template
        templateGroup
            .MapPost(
                "/{id:guid}/duplicate",
                async (
                    Guid id,
                    [FromBody] DuplicateInvoiceTemplateDto dto,
                    IInvoiceTemplateService templateService,
                    ClaimsPrincipal user
                ) =>
                {
                    try
                    {
                        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                        {
                            return Results.Unauthorized();
                        }

                        var template = await templateService.DuplicateTemplateAsync(id, dto.NewName, userId);

                        return Results.Created(
                            $"/api/v1/invoice-templates/{template.Id}",
                            new
                            {
                                success = true,
                                data = template
                            }
                        );
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.NotFound(
                            new { success = false, error = new { code = "NOT_FOUND", message = ex.Message } }
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
            .RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"))
            .WithName("DuplicateInvoiceTemplate")
            .WithOpenApi();

        // POST /api/v1/invoice-templates/preview - Preview template
        templateGroup
            .MapPost(
                "/preview",
                async (
                    [FromBody] CreateInvoiceTemplateDto dto,
                    IInvoiceRenderingService renderingService,
                    ICompanyInfoService companyInfoService
                ) =>
                {
                    try
                    {
                        var companyInfo = await companyInfoService.GetCompanyInfoAsync();

                        if (companyInfo == null)
                        {
                            return Results.BadRequest(
                                new { success = false, error = new { code = "NO_COMPANY_INFO", message = "Company information not configured. Please set up company info first." } }
                            );
                        }

                        var companyInfoEntity = new Models.Entities.Branch.CompanyInfo
                        {
                            Id = companyInfo.Id,
                            CompanyName = companyInfo.CompanyName,
                            CompanyNameAr = companyInfo.CompanyNameAr,
                            LogoUrl = companyInfo.LogoUrl,
                            VatNumber = companyInfo.VatNumber,
                            CommercialRegNumber = companyInfo.CommercialRegNumber,
                            Address = companyInfo.Address,
                            City = companyInfo.City,
                            PostalCode = companyInfo.PostalCode,
                            Phone = companyInfo.Phone,
                            Email = companyInfo.Email,
                            Website = companyInfo.Website
                        };

                        var html = renderingService.RenderPreview(dto.Schema, dto.PaperSize, companyInfoEntity);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = new { html }
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
            .RequireAuthorization(policy => policy.RequireRole("Manager", "HeadOfficeAdmin"))
            .WithName("PreviewInvoiceTemplate")
            .WithOpenApi();

        return app;
    }
}
