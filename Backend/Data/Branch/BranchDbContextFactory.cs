using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Backend.Data.Branch;

/// <summary>
/// Design-time factory for BranchDbContext to support EF Core migrations
/// </summary>
public class BranchDbContextFactory : IDesignTimeDbContextFactory<BranchDbContext>
{
    public BranchDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<BranchDbContext>();

        // Use SQLite for design-time migrations
        // This creates a temporary database for migration generation
        optionsBuilder.UseSqlite("Data Source=design_time_branch.db");

        return new BranchDbContext(optionsBuilder.Options);
    }
}
