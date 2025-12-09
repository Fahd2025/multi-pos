using Backend.Models.DTOs.Branch.CompanyInfo;
using Backend.Services.Branch;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Endpoints;

/// <summary>
/// Company information management endpoints
/// </summary>
public static class CompanyInfoEndpoints
{
    /// <summary>
    /// Maps company info endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapCompanyInfoEndpoints(this IEndpointRouteBuilder app)
    {
        var companyInfoGroup = app.MapGroup("/api/v1/company-info").WithTags("Company Info");

        // GET /api/v1/company-info - Get company information
        companyInfoGroup
            .MapGet(
                "",
                async (ICompanyInfoService companyInfoService) =>
                {
                    try
                    {
                        var companyInfo = await companyInfoService.GetCompanyInfoAsync();

                        if (companyInfo == null)
                        {
                            return Results.NotFound(
                                new { success = false, error = new { code = "NOT_FOUND", message = "Company information not configured" } }
                            );
                        }

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = companyInfo
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
            .WithName("GetCompanyInfo")
            .WithOpenApi();

        // PUT /api/v1/company-info - Create or update company information
        companyInfoGroup
            .MapPut(
                "",
                async (
                    [FromBody] UpdateCompanyInfoDto dto,
                    ICompanyInfoService companyInfoService
                ) =>
                {
                    try
                    {
                        var companyInfo = await companyInfoService.UpsertCompanyInfoAsync(dto);

                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = companyInfo,
                                message = "Company information updated successfully"
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
            .WithName("UpsertCompanyInfo")
            .WithOpenApi();

        return app;
    }
}
