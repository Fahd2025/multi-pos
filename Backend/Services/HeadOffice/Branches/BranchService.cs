using Backend.Data.Branch;
using Backend.Data.HeadOffice;
using Backend.Data.Shared;
using Backend.Models.DTOs.HeadOffice.Branches;
using Backend.Models.Entities.Branch; // For Category, Product, etc.
using Backend.Models.Entities.HeadOffice;
using HeadOfficeUser = Backend.Models.Entities.HeadOffice.User;
using Backend.Services.Branch.Images;
using Backend.Services.Shared.Migrations;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Backend.Services.HeadOffice.Branches;

/// <summary>
/// Service implementation for branch management operations
/// </summary>
public class BranchService : IBranchService
{
    private readonly HeadOfficeDbContext _headOfficeContext;
    private readonly DbContextFactory _dbContextFactory;
    private readonly ILogger<BranchService> _logger;
    private readonly IImageService _imageService;
    private readonly IBranchMigrationManager _migrationManager;

    public BranchService(
        HeadOfficeDbContext headOfficeContext,
        DbContextFactory dbContextFactory,
        ILogger<BranchService> logger,
        IImageService imageService,
        IBranchMigrationManager migrationManager
    )
    {
        _headOfficeContext = headOfficeContext;
        _dbContextFactory = dbContextFactory;
        _logger = logger;
        _imageService = imageService;
        _migrationManager = migrationManager;
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
            query = query.Where(b =>
                b.Code.ToLower().Contains(searchLower)
                || b.NameEn.ToLower().Contains(searchLower)
                || b.NameAr.Contains(searchLower)
            );
        }

        var totalCount = await query.CountAsync();

        var branchList = await query
            .OrderBy(b => b.Code)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var branches = new List<BranchDto>();
        foreach (var branch in branchList)
        {
            // Calculate user count from BranchUsers table in head office
            int userCount = 0;

            // Count BranchUsers in head office database
            try
            {
                userCount = await _headOfficeContext.BranchUsers
                    .CountAsync(bu => bu.BranchId == branch.Id && bu.IsActive);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get branch user count for branch {BranchId}", branch.Id);
            }

            branches.Add(new BranchDto
            {
                Id = branch.Id,
                Code = branch.Code,
                NameEn = branch.NameEn,
                NameAr = branch.NameAr,
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
                TrustServerCertificate = branch.TrustServerCertificate,
                SslMode = branch.SslMode.ToString(),
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
            });
        }

        return (branches, totalCount);
    }

    public async Task<List<BranchLookupDto>> GetBranchLookupAsync()
    {
        return await _headOfficeContext.Branches
            .Where(b => b.IsActive)
            .OrderBy(b => b.Code)
            .Select(b => new BranchLookupDto
            {
                Id = b.Id,
                Code = b.Code,
                NameEn = b.NameEn,
                NameAr = b.NameAr
            })
            .ToListAsync();
    }

    public async Task<BranchDto?> GetBranchByIdAsync(Guid id)
    {
        var branch = await _headOfficeContext
            .Branches.FirstOrDefaultAsync(b => b.Id == id);

        if (branch == null)
        {
            return null;
        }

        // Calculate user count from BranchUsers table in head office
        int userCount = 0;
        try
        {
            userCount = await _headOfficeContext.BranchUsers
                .CountAsync(bu => bu.BranchId == id && bu.IsActive);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get branch user count for branch {BranchId}", id);
        }

        return new BranchDto
        {
            Id = branch.Id,
            Code = branch.Code,
            NameEn = branch.NameEn,
            NameAr = branch.NameAr,
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
            TrustServerCertificate = branch.TrustServerCertificate,
            SslMode = branch.SslMode.ToString(),
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

    public async Task<BranchDto> CreateBranchAsync(CreateBranchDto createBranchDto, Guid createdBy)
    {
        // Check for duplicate code
        if (await _headOfficeContext.Branches.AnyAsync(b => b.Code == createBranchDto.Code))
        {
            throw new InvalidOperationException(
                $"Branch code '{createBranchDto.Code}' already exists"
            );
        }

        var branch = new Models.Entities.HeadOffice.Branch
        {
            Id = Guid.NewGuid(),
            Code = createBranchDto.Code,
            NameEn = createBranchDto.NameEn,
            NameAr = createBranchDto.NameAr,
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
            TrustServerCertificate = createBranchDto.TrustServerCertificate,
            SslMode = (Backend.Models.Entities.HeadOffice.SslMode)createBranchDto.SslMode,
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

        _logger.LogInformation(
            "Created branch {BranchCode} ({BranchId}) by user {UserId}",
            branch.Code,
            branch.Id,
            createdBy
        );

        // Automatically provision database and create default admin
        try
        {
            var (success, message) = await ProvisionBranchDatabaseAsync(branch.Id);
            if (success)
            {
                _logger.LogInformation(
                    "Auto-provisioned database for newly created branch {BranchCode}",
                    branch.Code
                );
            }
            else
            {
                _logger.LogWarning(
                    "Failed to auto-provision database for branch {BranchCode}: {Message}",
                    branch.Code,
                    message
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error auto-provisioning database for branch {BranchCode}",
                branch.Code
            );
        }

        return new BranchDto
        {
            Id = branch.Id,
            Code = branch.Code,
            NameEn = branch.NameEn,
            NameAr = branch.NameAr,
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
            TrustServerCertificate = branch.TrustServerCertificate,
            SslMode = branch.SslMode.ToString(),
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

        // Track if database settings changed
        bool dbSettingsChanged = false;

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
            dbSettingsChanged = true;
        }

        if (!string.IsNullOrWhiteSpace(updateBranchDto.DbServer))
        {
            branch.DbServer = updateBranchDto.DbServer;
            _dbContextFactory.ClearCache(id);
            dbSettingsChanged = true;
        }

        if (!string.IsNullOrWhiteSpace(updateBranchDto.DbName))
        {
            branch.DbName = updateBranchDto.DbName;
            _dbContextFactory.ClearCache(id);
            dbSettingsChanged = true;
        }

        if (updateBranchDto.DbPort.HasValue)
        {
            branch.DbPort = updateBranchDto.DbPort.Value;
            _dbContextFactory.ClearCache(id);
            dbSettingsChanged = true;
        }

        if (updateBranchDto.DbUsername != null)
        {
            branch.DbUsername = updateBranchDto.DbUsername;
            _dbContextFactory.ClearCache(id);
            dbSettingsChanged = true;
        }

        if (updateBranchDto.DbPassword != null)
        {
            branch.DbPassword = updateBranchDto.DbPassword; // TODO: Encrypt password
            _dbContextFactory.ClearCache(id);
            dbSettingsChanged = true;
        }

        if (updateBranchDto.DbAdditionalParams != null)
        {
            branch.DbAdditionalParams = updateBranchDto.DbAdditionalParams;
            _dbContextFactory.ClearCache(id);
            dbSettingsChanged = true;
        }

        if (updateBranchDto.TrustServerCertificate.HasValue)
        {
            branch.TrustServerCertificate = updateBranchDto.TrustServerCertificate.Value;
            _dbContextFactory.ClearCache(id);
            dbSettingsChanged = true;
        }

        if (updateBranchDto.SslMode.HasValue)
        {
            branch.SslMode = (Backend.Models.Entities.HeadOffice.SslMode)
                updateBranchDto.SslMode.Value;
            _dbContextFactory.ClearCache(id);
            dbSettingsChanged = true;
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

        if (updateBranchDto.LogoPath != null)
        {
            branch.LogoPath = updateBranchDto.LogoPath;
        }

        branch.UpdatedAt = DateTime.UtcNow;

        await _headOfficeContext.SaveChangesAsync();

        _logger.LogInformation("Updated branch {BranchCode} ({BranchId})", branch.Code, branch.Id);

        // Auto-provision database if database settings changed
        if (dbSettingsChanged)
        {
            try
            {
                var (success, message) = await ProvisionBranchDatabaseAsync(id);
                if (success)
                {
                    _logger.LogInformation(
                        "Auto-provisioned database for updated branch {BranchCode}",
                        branch.Code
                    );
                }
                else
                {
                    _logger.LogWarning(
                        "Failed to auto-provision database for branch {BranchCode}: {Message}",
                        branch.Code,
                        message
                    );
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error auto-provisioning database for branch {BranchCode}",
                    branch.Code
                );
            }
        }

        var userCount = await _headOfficeContext
            .BranchUsers.Where(bu => bu.BranchId == id && bu.IsActive)
            .CountAsync();

        return new BranchDto
        {
            Id = branch.Id,
            Code = branch.Code,
            NameEn = branch.NameEn,
            NameAr = branch.NameAr,
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
            TrustServerCertificate = branch.TrustServerCertificate,
            SslMode = branch.SslMode.ToString(),
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
        var branch = await _headOfficeContext.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id);
        if (branch == null)
        {
            return null;
        }

        // Determine the logo URL
        string? logoUrl = null;
        if (!string.IsNullOrEmpty(branch.LogoPath))
        {
            // Check if LogoPath is already in the correct URL format (starts with /api/v1/)
            if (branch.LogoPath.StartsWith("/api/v1/"))
            {
                logoUrl = branch.LogoPath;
            }
            // Check if it's an old format (file system path or GUID)
            else if (File.Exists(branch.LogoPath) || Guid.TryParse(branch.LogoPath, out _) || Guid.TryParse(Path.GetFileNameWithoutExtension(branch.LogoPath), out _))
            {
                // Old format detected - clear it (user will need to re-upload)
                _logger.LogWarning("Branch {BranchId} has old logo format: {LogoPath}. Logo will need to be re-uploaded.", id, branch.LogoPath);
                logoUrl = null;
            }
            else
            {
                // Unknown format, return it as-is (might be a full URL)
                logoUrl = branch.LogoPath;
            }
        }

        return new BranchSettingsDto
        {
            Id = branch.Id,
            Code = branch.Code,
            NameEn = branch.NameEn,
            NameAr = branch.NameAr,
            AddressEn = ParseAddress(branch.AddressEn),
            AddressAr = ParseAddress(branch.AddressAr),
            Phone = branch.Phone,
            Email = branch.Email,
            VatNumber = branch.TaxNumber,
            CommercialRegistrationNumber = branch.CRN,
            LogoPath = branch.LogoPath,
            LogoUrl = logoUrl,
            TimeZone = branch.TimeZone,
            Currency = branch.Currency,
            Language = branch.Language,
            DateFormat = branch.DateFormat,
            NumberFormat = branch.NumberFormat,
            EnableTax = branch.EnableTax,
            TaxRate = branch.TaxRate,
            PriceIncludesTax = branch.PriceIncludesTax,
            IsActive = branch.IsActive,
            UpdatedAt = branch.UpdatedAt
        };
    }

    public async Task<BranchSettingsDto> UpdateBranchSettingsAsync(
        Guid id,
        UpdateBranchSettingsDto settingsDto
    )
    {
        var branch = await _headOfficeContext.Branches.FindAsync(id);
        if (branch == null)
        {
            throw new KeyNotFoundException($"Branch with ID {id} not found");
        }

        // Update branch information
        branch.NameEn = settingsDto.NameEn;
        branch.NameAr = settingsDto.NameAr;
        branch.Phone = settingsDto.Phone;
        branch.Email = settingsDto.Email;
        branch.TaxNumber = settingsDto.VatNumber;
        branch.CRN = settingsDto.CommercialRegistrationNumber;

        // Update addresses (serialize structured address to JSON string)
        branch.AddressEn = SerializeAddress(settingsDto.AddressEn);
        branch.AddressAr = SerializeAddress(settingsDto.AddressAr);

        // Update regional settings
        branch.TimeZone = settingsDto.TimeZone;
        branch.Currency = settingsDto.Currency;
        branch.Language = settingsDto.Language;
        branch.DateFormat = settingsDto.DateFormat;
        branch.NumberFormat = settingsDto.NumberFormat;

        // Update tax settings
        branch.EnableTax = settingsDto.EnableTax;
        branch.TaxRate = settingsDto.TaxRate;
        branch.PriceIncludesTax = settingsDto.PriceIncludesTax;

        // Update metadata
        branch.UpdatedAt = DateTime.UtcNow;

        await _headOfficeContext.SaveChangesAsync();

        _logger.LogInformation(
            "Updated settings for branch {BranchCode} ({BranchId})",
            branch.Code,
            branch.Id
        );

        return await GetBranchSettingsAsync(id) ?? throw new InvalidOperationException("Failed to retrieve updated settings");
    }

    public async Task<string> UploadBranchLogoAsync(Guid id, Stream fileStream, string fileName)
    {
        var branch = await _headOfficeContext.Branches.FindAsync(id);
        if (branch == null)
        {
            throw new KeyNotFoundException($"Branch with ID {id} not found");
        }

        // Use the ImageService to upload the logo
        // This will store it in the proper location: Uploads/Branches/{branchCode}/branches/{id}-{size}.webp
        var result = await _imageService.UploadImageAsync(
            branch.Code,
            "branches",
            id,
            fileStream,
            fileName
        );

        if (!result.Success)
        {
            throw new InvalidOperationException($"Failed to upload branch logo: {result.ErrorMessage}");
        }

        // Store the logo path reference (we'll use the image URL pattern)
        branch.LogoPath = $"/api/v1/images/{branch.Code}/branches/{id}/thumb";
        branch.UpdatedAt = DateTime.UtcNow;
        await _headOfficeContext.SaveChangesAsync();

        _logger.LogInformation("Uploaded logo for branch {BranchCode} ({BranchId})", branch.Code, branch.Id);

        return branch.LogoPath;
    }

    private AddressDto? ParseAddress(string? fullAddress)
    {
        if (string.IsNullOrWhiteSpace(fullAddress))
        {
            return null;
        }

        // Try to parse JSON first (if address was saved as structured data)
        try
        {
            var address = JsonSerializer.Deserialize<AddressDto>(fullAddress);
            if (address != null) return address;
        }
        catch
        {
            // Not JSON, treat as plain text
        }

        // Return as short address
        return new AddressDto
        {
            ShortAddress = fullAddress
        };
    }

    private string? SerializeAddress(AddressDto? address)
    {
        if (address == null)
        {
            return null;
        }

        // Serialize as JSON for structured storage
        return JsonSerializer.Serialize(address);
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

            // Force an actual connection attempt by opening the connection and executing a test query
            // This will throw detailed exceptions instead of just returning false
            await using var connection = branchContext.Database.GetDbConnection();
            await connection.OpenAsync();

            // Execute a simple test query to verify the connection works
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT 1";
            await command.ExecuteScalarAsync();

            _logger.LogInformation(
                "Successfully tested database connection for branch {BranchCode}",
                branch.Code
            );
            return (true, "Database connection successful");
        }
        catch (Exception ex)
        {
            // Build detailed error message including inner exceptions
            var errorMessage = ex.Message;
            var innerEx = ex.InnerException;
            while (innerEx != null)
            {
                errorMessage += $" -> {innerEx.Message}";
                innerEx = innerEx.InnerException;
            }

            _logger.LogError(
                ex,
                "Error testing database connection for branch {BranchId}: {ErrorMessage}",
                id,
                errorMessage
            );
            return (false, errorMessage);
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

            _logger.LogInformation(
                "Starting database provisioning for branch {BranchCode}",
                branch.Code
            );

            // Ensure database directory exists for SQLite
            if (branch.DatabaseProvider == DatabaseProvider.SQLite)
            {
                // Create directory if it doesn't exist
                var dbDirectory = Path.GetDirectoryName(
                    Path.Combine(
                        "Upload",
                        "Branches",
                        branch.Code,
                        "Database",
                        $"{branch.DbName}.db"
                    )
                );
                if (!string.IsNullOrEmpty(dbDirectory) && !Directory.Exists(dbDirectory))
                {
                    Directory.CreateDirectory(dbDirectory);
                }
            }

            // Run migrations using the BranchMigrationManager to ensure migration state is tracked
            var migrationResult = await _migrationManager.ApplyMigrationsAsync(id);

            if (!migrationResult.Success)
            {
                _logger.LogError(
                    "Failed to apply migrations for branch {BranchCode}: {ErrorMessage}",
                    branch.Code,
                    migrationResult.ErrorMessage
                );
                return (false, $"Migration failed: {migrationResult.ErrorMessage}");
            }

            _logger.LogInformation(
                "Successfully applied {Count} migrations for branch {BranchCode}",
                migrationResult.AppliedMigrations.Count,
                branch.Code
            );

            // Create a branch context for seeding
            using var branchContext = _dbContextFactory.CreateBranchContext(branch);

            // Seed sample data
            await SeedBranchDataAsync(branchContext, branch);

            // Create default branch admin user
            await CreateDefaultBranchAdminAsync(branch);

            _logger.LogInformation(
                "Successfully provisioned database for branch {BranchCode}",
                branch.Code
            );
            return (true, "Database provisioned successfully with default admin user");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error provisioning database for branch {BranchId}", id);
            return (false, $"Database provisioning failed: {ex.Message}");
        }
    }

    private async Task SeedBranchDataAsync(
        BranchDbContext context,
        Models.Entities.HeadOffice.Branch branch
    )
    {
        // Use the comprehensive seeder for consistency across all database providers
        _logger.LogInformation("Seeding sample data for branch {BranchCode}", branch.Code);
        await Backend.Data.Branch.BranchDbSeeder.SeedAsync(context, branch.CreatedBy, branch.Code);
    }

    private async Task CreateDefaultBranchAdminAsync(Models.Entities.HeadOffice.Branch branch)
    {
        _logger.LogInformation(
            "Creating default admin user for branch {BranchCode}",
            branch.Code
        );

        // Check if admin user already exists for this branch
        var existingBranchUser = await _headOfficeContext.BranchUsers
            .FirstOrDefaultAsync(bu => bu.BranchId == branch.Id && bu.Username == "admin");

        if (existingBranchUser != null)
        {
            _logger.LogInformation(
                "Admin user already exists for branch {BranchCode}",
                branch.Code
            );
            return;
        }

        // Generate a single GUID for the user (used in both databases)
        var userId = Guid.NewGuid();
        var passwordHash = Utilities.PasswordHasher.HashPassword("123");
        var now = DateTime.UtcNow;

        // Create BranchUser in head office database (PRIMARY)
        var branchUser = new BranchUser
        {
            Id = userId,
            BranchId = branch.Id,
            Username = "admin",
            PasswordHash = passwordHash,
            Email = branch.Email ?? "admin@pos.local",
            FullNameEn = "Administrator",
            FullNameAr = "مدير النظام",
            Phone = branch.Phone,
            PreferredLanguage = branch.Language,
            Role = "Manager", // Manager is the highest branch-level role
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
            CreatedBy = branch.CreatedBy,
            SyncedAt = now,
        };

        _headOfficeContext.BranchUsers.Add(branchUser);
        await _headOfficeContext.SaveChangesAsync();

        _logger.LogInformation(
            "Created BranchUser in head office for branch {BranchCode}",
            branch.Code
        );

        // Create User in branch database (SECONDARY - synchronized)
        try
        {
            var branchContext = _dbContextFactory.CreateBranchContext(branch);
            
            var branchDbUser = new Backend.Models.Entities.Branch.User
            {
                Id = userId, // Same ID for tracking
                Username = "admin",
                PasswordHash = passwordHash,
                Email = branch.Email ?? "admin@pos.local",
                FullNameEn = "Administrator",
                FullNameAr = "مدير النظام",
                Phone = branch.Phone,
                PreferredLanguage = branch.Language,
                Role = "Manager",
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = branch.CreatedBy,
            };

            branchContext.Users.Add(branchDbUser);
            await branchContext.SaveChangesAsync();

            _logger.LogInformation(
                "Created User in branch database for branch {BranchCode}",
                branch.Code
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to create admin user in branch database for {BranchCode}. User exists in head office but not in branch DB.",
                branch.Code
            );
            // Don't throw - head office user is created, branch can be synced later
        }

        _logger.LogInformation(
            "Successfully created default admin user (admin/123) for branch {BranchCode}",
            branch.Code
        );
    }
}
