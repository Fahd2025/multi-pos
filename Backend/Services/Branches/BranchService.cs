using Backend.Data;
using Backend.Models.DTOs.Branches;
using Backend.Models.Entities.Branch;
using Backend.Models.Entities.HeadOffice;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services.Branches;

/// <summary>
/// Service implementation for branch management operations
/// </summary>
public class BranchService : IBranchService
{
    private readonly HeadOfficeDbContext _headOfficeContext;
    private readonly DbContextFactory _dbContextFactory;
    private readonly ILogger<BranchService> _logger;

    public BranchService(
        HeadOfficeDbContext headOfficeContext,
        DbContextFactory dbContextFactory,
        ILogger<BranchService> logger
    )
    {
        _headOfficeContext = headOfficeContext;
        _dbContextFactory = dbContextFactory;
        _logger = logger;
    }

    public async Task<(List<BranchDto> Branches, int TotalCount)> GetBranchesAsync(
        int page = 1,
        int pageSize = 20,
        bool? isActive = null,
        string? search = null
    )
    {
        var query = _headOfficeContext.Branches.AsQueryable();

        // Apply filters
        if (isActive.HasValue)
        {
            query = query.Where(b => b.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(
                b =>
                    b.Code.ToLower().Contains(searchLower)
                    || b.NameEn.ToLower().Contains(searchLower)
                    || b.NameAr.Contains(searchLower)
                    || b.LoginName.ToLower().Contains(searchLower)
            );
        }

        var totalCount = await query.CountAsync();

        var branches = await query
            .OrderBy(b => b.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(b => b.BranchUsers)
            .Select(
                b =>
                    new BranchDto
                    {
                        Id = b.Id,
                        Code = b.Code,
                        NameEn = b.NameEn,
                        NameAr = b.NameAr,
                        LoginName = b.LoginName,
                        AddressEn = b.AddressEn,
                        AddressAr = b.AddressAr,
                        Email = b.Email,
                        Phone = b.Phone,
                        Website = b.Website,
                        CRN = b.CRN,
                        TaxNumber = b.TaxNumber,
                        NationalAddress = b.NationalAddress,
                        LogoPath = b.LogoPath,
                        DatabaseProvider = b.DatabaseProvider.ToString(),
                        DbServer = b.DbServer,
                        DbName = b.DbName,
                        DbPort = b.DbPort,
                        DbUsername = b.DbUsername,
                        DbAdditionalParams = b.DbAdditionalParams,
                        Language = b.Language,
                        Currency = b.Currency,
                        TimeZone = b.TimeZone,
                        DateFormat = b.DateFormat,
                        NumberFormat = b.NumberFormat,
                        TaxRate = b.TaxRate,
                        IsActive = b.IsActive,
                        CreatedAt = b.CreatedAt,
                        UpdatedAt = b.UpdatedAt,
                        CreatedBy = b.CreatedBy,
                        UserCount = b.BranchUsers.Count(bu => bu.IsActive),
                    }
            )
            .ToListAsync();

        return (branches, totalCount);
    }

    public async Task<BranchDto?> GetBranchByIdAsync(Guid id)
    {
        var branch = await _headOfficeContext
            .Branches.Include(b => b.BranchUsers)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (branch == null)
        {
            return null;
        }

        return new BranchDto
        {
            Id = branch.Id,
            Code = branch.Code,
            NameEn = branch.NameEn,
            NameAr = branch.NameAr,
            LoginName = branch.LoginName,
            AddressEn = branch.AddressEn,
            AddressAr = branch.AddressAr,
            Email = branch.Email,
            Phone = branch.Phone,
            Website = branch.Website,
            CRN = branch.CRN,
            TaxNumber = branch.TaxNumber,
            NationalAddress = branch.NationalAddress,
            LogoPath = branch.LogoPath,
            DatabaseProvider = branch.DatabaseProvider.ToString(),
            DbServer = branch.DbServer,
            DbName = branch.DbName,
            DbPort = branch.DbPort,
            DbUsername = branch.DbUsername,
            DbAdditionalParams = branch.DbAdditionalParams,
            Language = branch.Language,
            Currency = branch.Currency,
            TimeZone = branch.TimeZone,
            DateFormat = branch.DateFormat,
            NumberFormat = branch.NumberFormat,
            TaxRate = branch.TaxRate,
            IsActive = branch.IsActive,
            CreatedAt = branch.CreatedAt,
            UpdatedAt = branch.UpdatedAt,
            CreatedBy = branch.CreatedBy,
            UserCount = branch.BranchUsers.Count(bu => bu.IsActive),
        };
    }

    public async Task<BranchDto> CreateBranchAsync(CreateBranchDto createBranchDto, Guid createdBy)
    {
        // Check for duplicate code
        if (
            await _headOfficeContext.Branches.AnyAsync(b =>
                b.Code == createBranchDto.Code
            )
        )
        {
            throw new InvalidOperationException($"Branch code '{createBranchDto.Code}' already exists");
        }

        // Check for duplicate login name
        if (
            await _headOfficeContext.Branches.AnyAsync(b =>
                b.LoginName == createBranchDto.LoginName
            )
        )
        {
            throw new InvalidOperationException($"Login name '{createBranchDto.LoginName}' already exists");
        }

        var branch = new Models.Entities.HeadOffice.Branch
        {
            Id = Guid.NewGuid(),
            Code = createBranchDto.Code,
            NameEn = createBranchDto.NameEn,
            NameAr = createBranchDto.NameAr,
            LoginName = createBranchDto.LoginName,
            AddressEn = createBranchDto.AddressEn,
            AddressAr = createBranchDto.AddressAr,
            Email = createBranchDto.Email,
            Phone = createBranchDto.Phone,
            Website = createBranchDto.Website,
            CRN = createBranchDto.CRN,
            TaxNumber = createBranchDto.TaxNumber,
            NationalAddress = createBranchDto.NationalAddress,
            DatabaseProvider = (DatabaseProvider)createBranchDto.DatabaseProvider,
            DbServer = createBranchDto.DbServer,
            DbName = createBranchDto.DbName,
            DbPort = createBranchDto.DbPort,
            DbUsername = createBranchDto.DbUsername,
            DbPassword = createBranchDto.DbPassword, // TODO: Encrypt password
            DbAdditionalParams = createBranchDto.DbAdditionalParams,
            Language = createBranchDto.Language,
            Currency = createBranchDto.Currency,
            TimeZone = createBranchDto.TimeZone,
            DateFormat = createBranchDto.DateFormat,
            NumberFormat = createBranchDto.NumberFormat,
            TaxRate = createBranchDto.TaxRate,
            IsActive = createBranchDto.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = createdBy,
        };

        _headOfficeContext.Branches.Add(branch);
        await _headOfficeContext.SaveChangesAsync();

        _logger.LogInformation("Created branch {BranchCode} ({BranchId}) by user {UserId}", branch.Code, branch.Id, createdBy);

        return new BranchDto
        {
            Id = branch.Id,
            Code = branch.Code,
            NameEn = branch.NameEn,
            NameAr = branch.NameAr,
            LoginName = branch.LoginName,
            AddressEn = branch.AddressEn,
            AddressAr = branch.AddressAr,
            Email = branch.Email,
            Phone = branch.Phone,
            Website = branch.Website,
            CRN = branch.CRN,
            TaxNumber = branch.TaxNumber,
            NationalAddress = branch.NationalAddress,
            LogoPath = branch.LogoPath,
            DatabaseProvider = branch.DatabaseProvider.ToString(),
            DbServer = branch.DbServer,
            DbName = branch.DbName,
            DbPort = branch.DbPort,
            DbUsername = branch.DbUsername,
            DbAdditionalParams = branch.DbAdditionalParams,
            Language = branch.Language,
            Currency = branch.Currency,
            TimeZone = branch.TimeZone,
            DateFormat = branch.DateFormat,
            NumberFormat = branch.NumberFormat,
            TaxRate = branch.TaxRate,
            IsActive = branch.IsActive,
            CreatedAt = branch.CreatedAt,
            UpdatedAt = branch.UpdatedAt,
            CreatedBy = branch.CreatedBy,
            UserCount = 0,
        };
    }

    public async Task<BranchDto> UpdateBranchAsync(Guid id, UpdateBranchDto updateBranchDto)
    {
        var branch = await _headOfficeContext.Branches.FindAsync(id);
        if (branch == null)
        {
            throw new KeyNotFoundException($"Branch with ID {id} not found");
        }

        // Update only provided fields
        if (!string.IsNullOrWhiteSpace(updateBranchDto.NameEn))
        {
            branch.NameEn = updateBranchDto.NameEn;
        }

        if (!string.IsNullOrWhiteSpace(updateBranchDto.NameAr))
        {
            branch.NameAr = updateBranchDto.NameAr;
        }

        if (updateBranchDto.AddressEn != null)
        {
            branch.AddressEn = updateBranchDto.AddressEn;
        }

        if (updateBranchDto.AddressAr != null)
        {
            branch.AddressAr = updateBranchDto.AddressAr;
        }

        if (updateBranchDto.Email != null)
        {
            branch.Email = updateBranchDto.Email;
        }

        if (updateBranchDto.Phone != null)
        {
            branch.Phone = updateBranchDto.Phone;
        }

        if (updateBranchDto.Website != null)
        {
            branch.Website = updateBranchDto.Website;
        }

        if (updateBranchDto.CRN != null)
        {
            branch.CRN = updateBranchDto.CRN;
        }

        if (updateBranchDto.TaxNumber != null)
        {
            branch.TaxNumber = updateBranchDto.TaxNumber;
        }

        if (updateBranchDto.NationalAddress != null)
        {
            branch.NationalAddress = updateBranchDto.NationalAddress;
        }

        if (updateBranchDto.DatabaseProvider.HasValue)
        {
            branch.DatabaseProvider = (DatabaseProvider)updateBranchDto.DatabaseProvider.Value;
            _dbContextFactory.ClearCache(id); // Clear cache when DB config changes
        }

        if (!string.IsNullOrWhiteSpace(updateBranchDto.DbServer))
        {
            branch.DbServer = updateBranchDto.DbServer;
            _dbContextFactory.ClearCache(id);
        }

        if (!string.IsNullOrWhiteSpace(updateBranchDto.DbName))
        {
            branch.DbName = updateBranchDto.DbName;
            _dbContextFactory.ClearCache(id);
        }

        if (updateBranchDto.DbPort.HasValue)
        {
            branch.DbPort = updateBranchDto.DbPort.Value;
            _dbContextFactory.ClearCache(id);
        }

        if (updateBranchDto.DbUsername != null)
        {
            branch.DbUsername = updateBranchDto.DbUsername;
            _dbContextFactory.ClearCache(id);
        }

        if (updateBranchDto.DbPassword != null)
        {
            branch.DbPassword = updateBranchDto.DbPassword; // TODO: Encrypt password
            _dbContextFactory.ClearCache(id);
        }

        if (updateBranchDto.DbAdditionalParams != null)
        {
            branch.DbAdditionalParams = updateBranchDto.DbAdditionalParams;
            _dbContextFactory.ClearCache(id);
        }

        if (updateBranchDto.Language != null)
        {
            branch.Language = updateBranchDto.Language;
        }

        if (updateBranchDto.Currency != null)
        {
            branch.Currency = updateBranchDto.Currency;
        }

        if (updateBranchDto.TimeZone != null)
        {
            branch.TimeZone = updateBranchDto.TimeZone;
        }

        if (updateBranchDto.DateFormat != null)
        {
            branch.DateFormat = updateBranchDto.DateFormat;
        }

        if (updateBranchDto.NumberFormat != null)
        {
            branch.NumberFormat = updateBranchDto.NumberFormat;
        }

        if (updateBranchDto.TaxRate.HasValue)
        {
            branch.TaxRate = updateBranchDto.TaxRate.Value;
        }

        if (updateBranchDto.IsActive.HasValue)
        {
            branch.IsActive = updateBranchDto.IsActive.Value;
        }

        branch.UpdatedAt = DateTime.UtcNow;

        await _headOfficeContext.SaveChangesAsync();

        _logger.LogInformation("Updated branch {BranchCode} ({BranchId})", branch.Code, branch.Id);

        var userCount = await _headOfficeContext
            .BranchUsers.Where(bu => bu.BranchId == id && bu.IsActive)
            .CountAsync();

        return new BranchDto
        {
            Id = branch.Id,
            Code = branch.Code,
            NameEn = branch.NameEn,
            NameAr = branch.NameAr,
            LoginName = branch.LoginName,
            AddressEn = branch.AddressEn,
            AddressAr = branch.AddressAr,
            Email = branch.Email,
            Phone = branch.Phone,
            Website = branch.Website,
            CRN = branch.CRN,
            TaxNumber = branch.TaxNumber,
            NationalAddress = branch.NationalAddress,
            LogoPath = branch.LogoPath,
            DatabaseProvider = branch.DatabaseProvider.ToString(),
            DbServer = branch.DbServer,
            DbName = branch.DbName,
            DbPort = branch.DbPort,
            DbUsername = branch.DbUsername,
            DbAdditionalParams = branch.DbAdditionalParams,
            Language = branch.Language,
            Currency = branch.Currency,
            TimeZone = branch.TimeZone,
            DateFormat = branch.DateFormat,
            NumberFormat = branch.NumberFormat,
            TaxRate = branch.TaxRate,
            IsActive = branch.IsActive,
            CreatedAt = branch.CreatedAt,
            UpdatedAt = branch.UpdatedAt,
            CreatedBy = branch.CreatedBy,
            UserCount = userCount,
        };
    }

    public async Task<bool> DeleteBranchAsync(Guid id)
    {
        var branch = await _headOfficeContext.Branches.FindAsync(id);
        if (branch == null)
        {
            return false;
        }

        // Soft delete by setting IsActive to false
        branch.IsActive = false;
        branch.UpdatedAt = DateTime.UtcNow;

        await _headOfficeContext.SaveChangesAsync();

        _logger.LogInformation("Deleted branch {BranchCode} ({BranchId})", branch.Code, branch.Id);

        return true;
    }

    public async Task<BranchSettingsDto?> GetBranchSettingsAsync(Guid id)
    {
        var branch = await _headOfficeContext.Branches.FindAsync(id);
        if (branch == null)
        {
            return null;
        }

        return new BranchSettingsDto
        {
            Language = branch.Language,
            Currency = branch.Currency,
            TimeZone = branch.TimeZone,
            DateFormat = branch.DateFormat,
            NumberFormat = branch.NumberFormat,
            TaxRate = branch.TaxRate,
        };
    }

    public async Task<BranchSettingsDto> UpdateBranchSettingsAsync(
        Guid id,
        BranchSettingsDto settingsDto
    )
    {
        var branch = await _headOfficeContext.Branches.FindAsync(id);
        if (branch == null)
        {
            throw new KeyNotFoundException($"Branch with ID {id} not found");
        }

        branch.Language = settingsDto.Language;
        branch.Currency = settingsDto.Currency;
        branch.TimeZone = settingsDto.TimeZone;
        branch.DateFormat = settingsDto.DateFormat;
        branch.NumberFormat = settingsDto.NumberFormat;
        branch.TaxRate = settingsDto.TaxRate;
        branch.UpdatedAt = DateTime.UtcNow;

        await _headOfficeContext.SaveChangesAsync();

        _logger.LogInformation("Updated settings for branch {BranchCode} ({BranchId})", branch.Code, branch.Id);

        return settingsDto;
    }

    public async Task<(bool Success, string Message)> TestDatabaseConnectionAsync(Guid id)
    {
        try
        {
            var branch = await _headOfficeContext.Branches.FindAsync(id);
            if (branch == null)
            {
                return (false, $"Branch with ID {id} not found");
            }

            // Create a branch context to test the connection
            using var branchContext = _dbContextFactory.CreateBranchContext(branch);

            // Try to open connection and query database
            var canConnect = await branchContext.Database.CanConnectAsync();

            if (canConnect)
            {
                _logger.LogInformation("Successfully tested database connection for branch {BranchCode}", branch.Code);
                return (true, "Database connection successful");
            }
            else
            {
                _logger.LogWarning("Failed to connect to database for branch {BranchCode}", branch.Code);
                return (false, "Failed to connect to database");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing database connection for branch {BranchId}", id);
            return (false, $"Connection test failed: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Message)> ProvisionBranchDatabaseAsync(Guid id)
    {
        try
        {
            var branch = await _headOfficeContext.Branches.FindAsync(id);
            if (branch == null)
            {
                return (false, $"Branch with ID {id} not found");
            }

            _logger.LogInformation("Starting database provisioning for branch {BranchCode}", branch.Code);

            // Create a branch context
            using var branchContext = _dbContextFactory.CreateBranchContext(branch);

            // Ensure database is created (for SQLite) or exists (for other providers)
            if (branch.DatabaseProvider == DatabaseProvider.SQLite)
            {
                // Create directory if it doesn't exist
                var dbDirectory = Path.GetDirectoryName(
                    Path.Combine(
                        "Upload",
                        "Branches",
                        branch.LoginName,
                        "Database",
                        $"{branch.DbName}.db"
                    )
                );
                if (!string.IsNullOrEmpty(dbDirectory) && !Directory.Exists(dbDirectory))
                {
                    Directory.CreateDirectory(dbDirectory);
                }
            }

            // Create database if it doesn't exist
            await branchContext.Database.EnsureCreatedAsync();

            // Run migrations
            await branchContext.Database.MigrateAsync();

            // Seed sample data
            await SeedBranchDataAsync(branchContext, branch);

            _logger.LogInformation("Successfully provisioned database for branch {BranchCode}", branch.Code);
            return (true, "Database provisioned successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error provisioning database for branch {BranchId}", id);
            return (false, $"Database provisioning failed: {ex.Message}");
        }
    }

    private async Task SeedBranchDataAsync(BranchDbContext context, Models.Entities.HeadOffice.Branch branch)
    {
        // Check if data already exists
        if (await context.Categories.AnyAsync())
        {
            _logger.LogInformation("Sample data already exists for branch {BranchCode}", branch.Code);
            return;
        }

        _logger.LogInformation("Seeding sample data for branch {BranchCode}", branch.Code);

        // Seed sample categories
        var categories = new[]
        {
            new Category
            {
                Id = Guid.NewGuid(),
                NameEn = "Electronics",
                NameAr = "إلكترونيات",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Category
            {
                Id = Guid.NewGuid(),
                NameEn = "Groceries",
                NameAr = "بقالة",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Category
            {
                Id = Guid.NewGuid(),
                NameEn = "Clothing",
                NameAr = "ملابس",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
        };

        context.Categories.AddRange(categories);

        // Seed sample expense categories
        var expenseCategories = new[]
        {
            new ExpenseCategory
            {
                Id = Guid.NewGuid(),
                NameEn = "Rent",
                NameAr = "إيجار",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new ExpenseCategory
            {
                Id = Guid.NewGuid(),
                NameEn = "Utilities",
                NameAr = "مرافق",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new ExpenseCategory
            {
                Id = Guid.NewGuid(),
                NameEn = "Salaries",
                NameAr = "رواتب",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
        };

        context.ExpenseCategories.AddRange(expenseCategories);

        // Seed sample products
        var products = new[]
        {
            new Product
            {
                Id = Guid.NewGuid(),
                SKU = "ELEC-001",
                NameEn = "Laptop",
                NameAr = "حاسوب محمول",
                DescriptionEn = "High-performance laptop",
                DescriptionAr = "حاسوب محمول عالي الأداء",
                CategoryId = categories[0].Id,
                Price = 999.99m,
                Cost = 750.00m,
                StockQuantity = 10,
                MinStockThreshold = 2,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Product
            {
                Id = Guid.NewGuid(),
                SKU = "GROC-001",
                NameEn = "Rice 5kg",
                NameAr = "أرز 5 كجم",
                DescriptionEn = "Premium basmati rice",
                DescriptionAr = "أرز بسمتي فاخر",
                CategoryId = categories[1].Id,
                Price = 15.99m,
                Cost = 10.00m,
                StockQuantity = 50,
                MinStockThreshold = 10,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Product
            {
                Id = Guid.NewGuid(),
                SKU = "CLOT-001",
                NameEn = "T-Shirt",
                NameAr = "قميص",
                DescriptionEn = "Cotton t-shirt",
                DescriptionAr = "قميص قطني",
                CategoryId = categories[2].Id,
                Price = 19.99m,
                Cost = 12.00m,
                StockQuantity = 30,
                MinStockThreshold = 5,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
        };

        context.Products.AddRange(products);

        await context.SaveChangesAsync();

        _logger.LogInformation("Seeded sample data for branch {BranchCode}: 3 categories, 3 expense categories, 3 products", branch.Code);
    }
}
