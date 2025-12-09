namespace Backend.Endpoints;

/// <summary>
/// Branch information endpoints
/// Provides read-only access to current branch details for frontend components
/// </summary>
public static class BranchInfoEndpoints
{
    /// <summary>
    /// Maps branch info endpoints
    /// </summary>
    public static IEndpointRouteBuilder MapBranchInfoEndpoints(this IEndpointRouteBuilder app)
    {
        var branchInfoGroup = app.MapGroup("/api/v1/branch-info").WithTags("Branch Info");

        // GET /api/v1/branch-info - Get current branch information
        branchInfoGroup
            .MapGet(
                "",
                async (HttpContext httpContext) =>
                {
                    try
                    {
                        // Get branch from context (injected by BranchContextMiddleware)
                        var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;
                        if (branch == null)
                        {
                            return Results.BadRequest(
                                new
                                {
                                    success = false,
                                    error = new
                                    {
                                        code = "BRANCH_NOT_FOUND",
                                        message = "Branch information not found in request context."
                                    }
                                }
                            );
                        }

                        // Return branch info (excluding sensitive database connection details)
                        return Results.Ok(
                            new
                            {
                                success = true,
                                data = new
                                {
                                    id = branch.Id,
                                    code = branch.Code,
                                    nameEn = branch.NameEn,
                                    nameAr = branch.NameAr,
                                    addressEn = branch.AddressEn,
                                    addressAr = branch.AddressAr,
                                    email = branch.Email,
                                    phone = branch.Phone,
                                    website = branch.Website,
                                    crn = branch.CRN,
                                    taxNumber = branch.TaxNumber,
                                    nationalAddress = branch.NationalAddress,
                                    logoPath = branch.LogoPath,
                                    language = branch.Language,
                                    currency = branch.Currency,
                                    timeZone = branch.TimeZone,
                                    dateFormat = branch.DateFormat,
                                    numberFormat = branch.NumberFormat,
                                    taxRate = branch.TaxRate,
                                    enableTax = branch.EnableTax,
                                    priceIncludesTax = branch.PriceIncludesTax
                                }
                            }
                        );
                    }
                    catch (Exception ex)
                    {
                        return Results.BadRequest(
                            new
                            {
                                success = false,
                                error = new { code = "ERROR", message = ex.Message }
                            }
                        );
                    }
                }
            )
            .RequireAuthorization()
            .WithName("GetBranchInfo")
            .WithOpenApi();

        return app;
    }
}
