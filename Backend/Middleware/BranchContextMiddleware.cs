using System.Security.Claims;
using Backend.Data.HeadOffice;
using Microsoft.EntityFrameworkCore;

namespace Backend.Middleware;

public class BranchContextMiddleware
{
    private readonly RequestDelegate _next;

    public BranchContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, HeadOfficeDbContext headOfficeContext)
    {
        // Extract branch ID from JWT claims
        var branchIdClaim = context.User.FindFirst("branch_id");

        if (branchIdClaim != null && Guid.TryParse(branchIdClaim.Value, out var branchId))
        {
            Console.WriteLine($"[BranchContext] Found branch_id claim: {branchId}");

            // Load branch from database
            var branch = await headOfficeContext.Branches.FirstOrDefaultAsync(b =>
                b.Id == branchId && b.IsActive
            );

            if (branch != null)
            {
                Console.WriteLine($"[BranchContext] Branch found: {branch.Code} - {branch.NameEn}");
                // Store branch in HttpContext for use in controllers/services
                context.Items["Branch"] = branch;
                context.Items["BranchId"] = branchId;
            }
            else
            {
                Console.WriteLine($"[BranchContext] Branch NOT found or inactive for ID: {branchId}");
            }
        }
        else
        {
            Console.WriteLine("[BranchContext] No branch_id claim found in JWT token");
        }

        // Check if user is head office admin
        var isHeadOfficeAdminClaim = context.User.FindFirst("is_head_office_admin");
        if (
            isHeadOfficeAdminClaim != null
            && bool.TryParse(isHeadOfficeAdminClaim.Value, out var isHeadOfficeAdmin)
        )
        {
            context.Items["IsHeadOfficeAdmin"] = isHeadOfficeAdmin;
        }

        // Store user ID
        var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
        {
            context.Items["UserId"] = userId;
        }

        await _next(context);
    }
}

public static class BranchContextMiddlewareExtensions
{
    public static IApplicationBuilder UseBranchContext(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<BranchContextMiddleware>();
    }
}
