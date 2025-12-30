using Backend.Data.HeadOffice;
using Backend.Data.Shared;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data.Branch;

/// <summary>
/// Runtime factory for BranchDbContext that creates contexts based on HTTP context branch information
/// </summary>
public class BranchDbContextRuntimeFactory : IDbContextFactory<BranchDbContext>
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly DbContextFactory _dbContextFactory;
    private readonly HeadOfficeDbContext _headOfficeContext;

    public BranchDbContextRuntimeFactory(
        IHttpContextAccessor httpContextAccessor,
        DbContextFactory dbContextFactory,
        HeadOfficeDbContext headOfficeContext)
    {
        _httpContextAccessor = httpContextAccessor;
        _dbContextFactory = dbContextFactory;
        _headOfficeContext = headOfficeContext;
    }

    public BranchDbContext CreateDbContext()
    {
        var httpContext = _httpContextAccessor.HttpContext;

        // Try to get branch from HttpContext items (set by middleware)
        if (httpContext?.Items["Branch"] is Models.Entities.HeadOffice.Branch branch)
        {
            return _dbContextFactory.CreateBranchContext(branch);
        }

        // Try to get branch ID from claims (for printing service and other background operations)
        var branchIdClaim = httpContext?.User.FindFirst("branch_id")?.Value;
        if (!string.IsNullOrEmpty(branchIdClaim) && Guid.TryParse(branchIdClaim, out var branchId))
        {
            // Load branch from database
            var branchEntity = _headOfficeContext.Branches.Find(branchId);
            if (branchEntity != null)
            {
                return _dbContextFactory.CreateBranchContext(branchEntity);
            }
        }

        throw new InvalidOperationException(
            "Branch context not found. Ensure the request is authenticated and associated with a branch."
        );
    }

    public async Task<BranchDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default)
    {
        var httpContext = _httpContextAccessor.HttpContext;

        // Try to get branch from HttpContext items (set by middleware)
        if (httpContext?.Items["Branch"] is Models.Entities.HeadOffice.Branch branch)
        {
            return _dbContextFactory.CreateBranchContext(branch);
        }

        // Try to get branch ID from claims (for printing service and other background operations)
        var branchIdClaim = httpContext?.User.FindFirst("branch_id")?.Value;
        if (!string.IsNullOrEmpty(branchIdClaim) && Guid.TryParse(branchIdClaim, out var branchId))
        {
            // Load branch from database
            var branchEntity = await _headOfficeContext.Branches.FindAsync(new object[] { branchId }, cancellationToken);
            if (branchEntity != null)
            {
                return _dbContextFactory.CreateBranchContext(branchEntity);
            }
        }

        throw new InvalidOperationException(
            "Branch context not found. Ensure the request is authenticated and associated with a branch."
        );
    }
}
