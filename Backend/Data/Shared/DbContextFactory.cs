using Backend.Data.Branch;
using Backend.Models.Entities.HeadOffice;
using BranchEntity = Backend.Models.Entities.HeadOffice.Branch;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data.Shared;

public class DbContextFactory
{
    private readonly Dictionary<Guid, DbContextOptions<BranchDbContext>> _branchContextCache;
    private readonly object _cacheLock = new object();

    public DbContextFactory()
    {
        _branchContextCache = new Dictionary<Guid, DbContextOptions<BranchDbContext>>();
    }

    public BranchDbContext CreateBranchContext(BranchEntity branch)
    {
        DbContextOptions<BranchDbContext> options;

        lock (_cacheLock)
        {
            if (!_branchContextCache.TryGetValue(branch.Id, out options!))
            {
                options = BuildBranchContextOptions(branch);
                _branchContextCache[branch.Id] = options;
            }
        }

        return new BranchDbContext(options);
    }

    private DbContextOptions<BranchDbContext> BuildBranchContextOptions(BranchEntity branch)
    {
        var builder = new DbContextOptionsBuilder<BranchDbContext>();

        var connectionString = BuildConnectionString(branch);

        switch (branch.DatabaseProvider)
        {
            case DatabaseProvider.SQLite:
                builder.UseSqlite(connectionString);
                break;

            case DatabaseProvider.MSSQL:
                builder.UseSqlServer(connectionString);
                break;

            case DatabaseProvider.PostgreSQL:
                builder.UseNpgsql(connectionString);
                break;

            case DatabaseProvider.MySQL:
                var serverVersion = ServerVersion.AutoDetect(connectionString);
                builder.UseMySql(connectionString, serverVersion);
                break;

            default:
                throw new NotSupportedException(
                    $"Database provider {branch.DatabaseProvider} is not supported"
                );
        }

        return builder.Options;
    }

    private string BuildConnectionString(BranchEntity branch)
    {
        return branch.DatabaseProvider switch
        {
            DatabaseProvider.SQLite => BuildSqliteConnectionString(branch),

            DatabaseProvider.MSSQL => BuildMsSqlConnectionString(branch),

            DatabaseProvider.PostgreSQL => BuildPostgreSqlConnectionString(branch),

            DatabaseProvider.MySQL => BuildMySqlConnectionString(branch),

            _ => throw new NotSupportedException(
                $"Database provider {branch.DatabaseProvider} is not supported"
            ),
        };
    }

    private string BuildSqliteConnectionString(BranchEntity branch)
    {
        // Store SQLite databases in Backend/Upload/Branches/[Code]/Database/[Code].db
        // We only use the branch code - dbServer and dbName fields are ignored for SQLite
        var uploadPath = Path.Combine(
            "Upload",
            "Branches",
            branch.Code,
            "Database",
            $"{branch.Code}.db"
        );

        // Ensure directory exists
        var dbDirectory = Path.GetDirectoryName(uploadPath);
        if (!string.IsNullOrEmpty(dbDirectory) && !Directory.Exists(dbDirectory))
        {
            Directory.CreateDirectory(dbDirectory);
        }

        return $"Data Source={uploadPath}";
    }

    private string BuildMsSqlConnectionString(BranchEntity branch)
    {
        var parts = new List<string>
        {
            $"Server={branch.DbServer},{branch.DbPort}",
            $"Database={branch.DbName}",
        };

        if (!string.IsNullOrEmpty(branch.DbUsername))
        {
            parts.Add($"User Id={branch.DbUsername}");
            parts.Add($"Password={branch.DbPassword}");
        }
        else
        {
            parts.Add("Integrated Security=true");
        }

        // Add SSL configuration
        if (branch.TrustServerCertificate)
        {
            parts.Add("TrustServerCertificate=True");
        }

        if (!string.IsNullOrEmpty(branch.DbAdditionalParams))
        {
            parts.Add(branch.DbAdditionalParams);
        }

        return string.Join(";", parts);
    }

    private string BuildPostgreSqlConnectionString(BranchEntity branch)
    {
        var parts = new List<string>
        {
            $"Host={branch.DbServer}",
            $"Port={branch.DbPort}",
            $"Database={branch.DbName}",
            $"Username={branch.DbUsername}",
            $"Password={branch.DbPassword}",
        };

        // Add SSL configuration
        var sslMode = branch.SslMode switch
        {
            Models.Entities.HeadOffice.SslMode.Disable => "Disable",
            Models.Entities.HeadOffice.SslMode.Require => "Require",
            Models.Entities.HeadOffice.SslMode.VerifyCA => "VerifyCA",
            Models.Entities.HeadOffice.SslMode.VerifyFull => "VerifyFull",
            _ => "Disable"
        };
        parts.Add($"SSL Mode={sslMode}");

        if (!string.IsNullOrEmpty(branch.DbAdditionalParams))
        {
            parts.Add(branch.DbAdditionalParams);
        }

        return string.Join(";", parts);
    }

    private string BuildMySqlConnectionString(BranchEntity branch)
    {
        var parts = new List<string>
        {
            $"Server={branch.DbServer}",
            $"Port={branch.DbPort}",
            $"Database={branch.DbName}",
            $"Uid={branch.DbUsername}",
            $"Pwd={branch.DbPassword}",
        };

        // Add SSL configuration
        var sslMode = branch.SslMode switch
        {
            Models.Entities.HeadOffice.SslMode.Disable => "None",
            Models.Entities.HeadOffice.SslMode.Require => "Required",
            Models.Entities.HeadOffice.SslMode.VerifyCA => "VerifyCA",
            Models.Entities.HeadOffice.SslMode.VerifyFull => "VerifyFull",
            _ => "None"
        };
        parts.Add($"SSL Mode={sslMode}");

        // Fix for caching_sha2_password authentication method
        // Allows retrieval of public key from server when not using SSL
        parts.Add("AllowPublicKeyRetrieval=True");

        if (!string.IsNullOrEmpty(branch.DbAdditionalParams))
        {
            parts.Add(branch.DbAdditionalParams);
        }

        return string.Join(";", parts);
    }

    public void ClearCache(Guid? branchId = null)
    {
        lock (_cacheLock)
        {
            if (branchId.HasValue)
            {
                _branchContextCache.Remove(branchId.Value);
            }
            else
            {
                _branchContextCache.Clear();
            }
        }
    }
}
