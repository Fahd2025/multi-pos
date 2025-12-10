using Backend.Data.Branch;
using Backend.Data.HeadOffice;
using Backend.Data.Shared;
using Backend.Models.DTOs.HeadOffice.Branches;
using Backend.Models.Entities.Branch; // For Category, Product, etc.
using Backend.Models.Entities.HeadOffice;
using HeadOfficeUser = Backend.Models.Entities.HeadOffice.User;
using Backend.Services.Branch.Images;
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

    public BranchService(
        HeadOfficeDbContext headOfficeContext,
        DbContextFactory dbContextFactory,
        ILogger<BranchService> logger,
        IImageService imageService
    )
    {
        _headOfficeContext = headOfficeContext;
        _dbContextFactory = dbContextFactory;
        _logger = logger;
        _imageService = imageService;
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
            .Include(b => b.UserAssignments)
            .ToListAsync();

        var branches = new List<BranchDto>();
        foreach (var branch in branchList)
        {
            // Calculate total user count: head office users + branch database users
            int userCount = 0;

            // Count head office users assigned to this branch
            int headOfficeUserCount = branch.UserAssignments.Count(bu => bu.IsActive);

            // Count branch database users
            int branchUserCount = 0;
            try
            {
                var branchContext = _dbContextFactory.CreateBranchContext(branch);
                branchUserCount = await branchContext.Users.CountAsync(bu => bu.IsActive);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get branch user count for branch {BranchId}", branch.Id);
            }

            userCount = headOfficeUserCount + branchUserCount;

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
            .Branches.Include(b => b.UserAssignments)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (branch == null)
        {
            return null;
        }

        // Calculate total user count: head office users + branch database users
        int userCount = 0;

        // Count head office users assigned to this branch
        int headOfficeUserCount = branch.UserAssignments.Count(bu => bu.IsActive);

        // Count branch database users
        int branchUserCount = 0;
        try
        {
            var branchContext = _dbContextFactory.CreateBranchContext(branch);
            branchUserCount = await branchContext.Users.CountAsync(bu => bu.IsActive);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get branch user count for branch {BranchId}", id);
        }

        userCount = headOfficeUserCount + branchUserCount;

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
            .UserAssignments.Where(bu => bu.BranchId == id && bu.IsActive)
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

            // Create a branch context
            using var branchContext = _dbContextFactory.CreateBranchContext(branch);

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

            // Run migrations (this will create the database if it doesn't exist)
            await branchContext.Database.MigrateAsync();

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
        // Check if data already exists
        if (await context.Categories.AnyAsync())
        {
            _logger.LogInformation(
                "Sample data already exists for branch {BranchCode}",
                branch.Code
            );
            return;
        }

        _logger.LogInformation("Seeding sample data for branch {BranchCode}", branch.Code);

        // Seed sample categories
        var categories = new[]
        {
            new Category
            {
                Id = Guid.NewGuid(),
                Code = "CAT-001",
                NameEn = "Electronics",
                NameAr = "إلكترونيات",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = branch.CreatedBy,
            },
            new Category
            {
                Id = Guid.NewGuid(),
                Code = "CAT-002",
                NameEn = "Groceries",
                NameAr = "بقالة",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = branch.CreatedBy,
            },
            new Category
            {
                Id = Guid.NewGuid(),
                Code = "CAT-003",
                NameEn = "Clothing",
                NameAr = "ملابس",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = branch.CreatedBy,
            },
        };

        context.Categories.AddRange(categories);

        // Seed sample expense categories
        var expenseCategories = new[]
        {
            new ExpenseCategory
            {
                Id = Guid.NewGuid(),
                Code = "EXP-001",
                NameEn = "Rent",
                NameAr = "إيجار",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new ExpenseCategory
            {
                Id = Guid.NewGuid(),
                Code = "EXP-002",
                NameEn = "Utilities",
                NameAr = "مرافق",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new ExpenseCategory
            {
                Id = Guid.NewGuid(),
                Code = "EXP-003",
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
                SellingPrice = 999.99m,
                CostPrice = 750.00m,
                StockLevel = 10,
                MinStockThreshold = 2,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = branch.CreatedBy,
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
                SellingPrice = 15.99m,
                CostPrice = 10.00m,
                StockLevel = 50,
                MinStockThreshold = 10,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = branch.CreatedBy,
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
                SellingPrice = 19.99m,
                CostPrice = 12.00m,
                StockLevel = 30,
                MinStockThreshold = 5,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = branch.CreatedBy,
            },
        };

        context.Products.AddRange(products);

        // Seed sample suppliers
        var suppliers = new[]
        {
            new Supplier
            {
                Id = Guid.NewGuid(),
                Code = "SUP-001",
                NameEn = "Tech Supplies Inc",
                NameAr = "شركة اللوازم التقنية",
                Email = "contact@techsupplies.com",
                Phone = "+1234567890",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = branch.CreatedBy,
            },
            new Supplier
            {
                Id = Guid.NewGuid(),
                Code = "SUP-002",
                NameEn = "Food Distributors LLC",
                NameAr = "شركة موزعي الأغذية",
                Email = "info@fooddist.com",
                Phone = "+1234567891",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = branch.CreatedBy,
            },
            new Supplier
            {
                Id = Guid.NewGuid(),
                Code = "SUP-003",
                NameEn = "Fashion Wholesale Co",
                NameAr = "شركة الأزياء بالجملة",
                Email = "sales@fashionwholesale.com",
                Phone = "+1234567892",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = branch.CreatedBy,
            },
        };

        context.Suppliers.AddRange(suppliers);

        // Seed sample customers
        var customers = new[]
        {
            new Customer
            {
                Id = Guid.NewGuid(),
                Code = "CUST-001",
                NameEn = "Ahmed Ali",
                NameAr = "أحمد علي",
                Email = "ahmed.ali@example.com",
                Phone = "+9661234567890",
                TotalPurchases = 0,
                VisitCount = 0,
                LastVisitAt = DateTime.UtcNow,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Customer
            {
                Id = Guid.NewGuid(),
                Code = "CUST-002",
                NameEn = "Fatima Hassan",
                NameAr = "فاطمة حسن",
                Email = "fatima.hassan@example.com",
                Phone = "+9661234567891",
                TotalPurchases = 0,
                VisitCount = 0,
                LastVisitAt = DateTime.UtcNow,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Customer
            {
                Id = Guid.NewGuid(),
                Code = "CUST-003",
                NameEn = "Mohammed Ibrahim",
                NameAr = "محمد إبراهيم",
                Email = "mohammed.ibrahim@example.com",
                Phone = "+9661234567892",
                TotalPurchases = 0,
                VisitCount = 0,
                LastVisitAt = DateTime.UtcNow,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
        };

        context.Customers.AddRange(customers);

        await context.SaveChangesAsync();

        _logger.LogInformation(
            "Seeded sample data for branch {BranchCode}: 3 categories, 3 expense categories, 3 products, 3 suppliers, 3 customers",
            branch.Code
        );
    }

    private async Task CreateDefaultBranchAdminAsync(Models.Entities.HeadOffice.Branch branch)
    {
        // Check if an "admin" user already exists
        var existingAdminUser = await _headOfficeContext.Users.FirstOrDefaultAsync(u =>
            u.Username == "admin"
        );

        HeadOfficeUser user;
        if (existingAdminUser != null)
        {
            // Use existing admin user
            user = existingAdminUser;

            // Check if admin is already assigned to this branch
            var existingAssignment = await _headOfficeContext.UserAssignments.AnyAsync(bu =>
                bu.UserId == user.Id && bu.BranchId == branch.Id
            );

            if (existingAssignment)
            {
                _logger.LogInformation(
                    "Admin user already assigned to branch {BranchCode}",
                    branch.Code
                );
                return;
            }

            _logger.LogInformation(
                "Assigning existing admin user to branch {BranchCode}",
                branch.Code
            );
        }
        else
        {
            // Create new admin user
            _logger.LogInformation("Creating admin user for branch {BranchCode}", branch.Code);

            user = new HeadOfficeUser
            {
                Id = Guid.NewGuid(),
                Username = "admin",
                PasswordHash = Utilities.PasswordHasher.HashPassword("123"),
                FullNameEn = "Administrator",
                FullNameAr = "مدير النظام",
                Email = branch.Email ?? "admin@pos.local",
                Phone = branch.Phone,
                IsActive = true,
                IsHeadOfficeAdmin = false, // Branch admin, not head office admin
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _headOfficeContext.Users.Add(user);
            await _headOfficeContext.SaveChangesAsync(); // Save to get the user ID
        }

        // Create branch user assignment with Manager role (highest branch-level role)
        var branchUser = new UserAssignment
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            BranchId = branch.Id,
            Role = UserRole.Manager, // Manager is the highest branch-level role
            IsActive = true,
            AssignedAt = DateTime.UtcNow,
            AssignedBy = branch.CreatedBy,
        };

        _headOfficeContext.UserAssignments.Add(branchUser);
        await _headOfficeContext.SaveChangesAsync();

        _logger.LogInformation(
            "Admin user assigned to branch {BranchCode} with Manager role",
            branch.Code
        );
    }
}
