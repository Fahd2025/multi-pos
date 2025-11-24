# Upload Structure Implementation

**Date**: 2025-11-24
**Feature**: File Upload Management System
**Status**: Implemented

## Overview

Implemented a comprehensive file upload directory structure to organize and manage branch-related files in the Multi-POS system. The structure provides a standardized way to store database backups, product images, customer/supplier documents, and other branch-specific files.

## Directory Structure

### Root Upload Directory

```
Upload/
└── Branches/
    └── [Branch Login Name]/
        ├── Database/
        ├── Products/
        │   └── [Product ID]/
        ├── Categories/
        │   └── [Category ID]/
        ├── Customers/
        │   └── [Customer ID]/
        ├── Suppliers/
        │   └── [Supplier ID]/
        └── Documents/
```

### Structure Breakdown

#### 1. Database Directory
**Path**: `Upload/Branches/[Branch]/Database/`

**Purpose**: Store database-related files
- Database backups (SQLite .db files, SQL dumps)
- Database exports (CSV, JSON)
- Migration scripts specific to branch
- Database restore points

**Example Files**:
- `backup-2025-11-24-143000.db`
- `export-products-2025-11-24.csv`
- `migration-v2.0.0.sql`

#### 2. Products Directory
**Path**: `Upload/Branches/[Branch]/Products/[ProductID]/`

**Purpose**: Store product-related files organized by Product ID
- Product main images
- Product gallery images
- Product thumbnails
- Product manuals and specifications
- Product certificates

**Example Structure**:
```
Products/
└── 550e8400-e29b-41d4-a716-446655440000/
    ├── main.jpg
    ├── thumbnail.jpg
    ├── gallery-1.jpg
    ├── gallery-2.jpg
    ├── gallery-3.jpg
    ├── manual.pdf
    └── specifications.pdf
```

#### 3. Categories Directory
**Path**: `Upload/Branches/[Branch]/Categories/[CategoryID]/`

**Purpose**: Store category-related images and documents
- Category icons
- Category banners
- Category thumbnails

**Example Structure**:
```
Categories/
└── 660e8400-e29b-41d4-a716-446655440000/
    ├── icon.png
    ├── banner.jpg
    └── thumbnail.jpg
```

#### 4. Customers Directory
**Path**: `Upload/Branches/[Branch]/Customers/[CustomerID]/`

**Purpose**: Store customer-related files
- Customer logos (for business customers)
- Customer contracts
- Customer-specific documents
- ID scans or business licenses (if required)

**Example Structure**:
```
Customers/
└── 770e8400-e29b-41d4-a716-446655440000/
    ├── logo.png
    ├── contract-2025-11-24.pdf
    ├── business-license.pdf
    └── tax-certificate.pdf
```

#### 5. Suppliers Directory
**Path**: `Upload/Branches/[Branch]/Suppliers/[SupplierID]/`

**Purpose**: Store supplier-related files
- Supplier logos
- Supplier contracts
- Product catalogs
- Compliance certificates
- Tax documents

**Example Structure**:
```
Suppliers/
└── 880e8400-e29b-41d4-a716-446655440000/
    ├── logo.png
    ├── contract-2025-11-24.pdf
    ├── catalog-2025.pdf
    ├── certificate-ISO9001.pdf
    └── tax-registration.pdf
```

#### 6. Documents Directory
**Path**: `Upload/Branches/[Branch]/Documents/`

**Purpose**: Store general branch documents
- Branch reports
- Branch forms and templates
- Tax documents
- Receipts and invoices
- Branch-specific policies

**Example Files**:
- `monthly-report-2025-11.pdf`
- `tax-return-2025.pdf`
- `employee-handbook.pdf`

## Implementation Details

### Created Directories

Default branch directories created for seeded branches:
- `Upload/Branches/B001/` - Main Branch
- `Upload/Branches/B002/` - Downtown Branch
- `Upload/Branches/B003/` - Mall Branch

Each with subdirectories:
- Database/
- Products/
- Categories/
- Customers/
- Suppliers/
- Documents/

### Git Tracking

- Added `.gitkeep` files in all directories to ensure they're tracked by Git
- Empty directories will be preserved in version control
- Files uploaded to these directories can be added to `.gitignore` if needed

## Usage Guidelines

### 1. Creating Directory for New Branch

When creating a new branch in the system, automatically create the upload directory structure:

```bash
# For branch with LoginName "B004"
mkdir -p Upload/Branches/B004/{Database,Products,Categories,Customers,Suppliers,Documents}
touch Upload/Branches/B004/{Database,Products,Categories,Customers,Suppliers,Documents}/.gitkeep
```

### 2. Storing Product Images

When uploading a product image:

1. Get the branch LoginName and Product ID
2. Create directory if it doesn't exist: `Upload/Branches/[Branch]/Products/[ProductID]/`
3. Save image with standardized name
4. Update product record with image path

**Example Backend Implementation**:

```csharp
// In Backend/Services/Products/ProductService.cs
public async Task<string> UploadProductImageAsync(
    string branchLoginName,
    Guid productId,
    IFormFile imageFile,
    string imageType = "main")
{
    var uploadPath = Path.Combine(
        "Upload",
        "Branches",
        branchLoginName,
        "Products",
        productId.ToString()
    );

    // Create directory if it doesn't exist
    Directory.CreateDirectory(uploadPath);

    // Generate filename
    var extension = Path.GetExtension(imageFile.FileName);
    var fileName = $"{imageType}{extension}";
    var fullPath = Path.Combine(uploadPath, fileName);

    // Save file
    using (var fileStream = new FileStream(fullPath, FileMode.Create))
    {
        await imageFile.CopyToAsync(fileStream);
    }

    // Return relative path for storage in database
    return $"/uploads/{branchLoginName}/products/{productId}/{fileName}";
}
```

### 3. Serving Static Files

Configure ASP.NET Core to serve static files from the Upload directory:

```csharp
// In Backend/Program.cs
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "Upload")),
    RequestPath = "/uploads"
});
```

### 4. Database Backups

Implement automatic database backup to the Database folder:

```csharp
// Example: Backup SQLite database
public async Task BackupBranchDatabaseAsync(string branchLoginName, string dbPath)
{
    var timestamp = DateTime.Now.ToString("yyyy-MM-dd-HHmmss");
    var backupPath = Path.Combine(
        "Upload",
        "Branches",
        branchLoginName,
        "Database",
        $"backup-{timestamp}.db"
    );

    File.Copy(dbPath, backupPath);
}
```

## File Naming Conventions

### Product Images
- **Main Image**: `main.[jpg|png|gif|webp]`
- **Thumbnail**: `thumbnail.[jpg|png|gif|webp]`
- **Gallery Images**: `gallery-1.[ext]`, `gallery-2.[ext]`, etc.

### Category Images
- **Icon**: `icon.[png|svg]`
- **Banner**: `banner.[jpg|png|webp]`
- **Thumbnail**: `thumbnail.[jpg|png]`

### Documents
- **Contracts**: `contract-[YYYY-MM-DD].[pdf|docx]`
- **Certificates**: `certificate-[type].[pdf]`
- **Reports**: `report-[type]-[YYYY-MM].[pdf|xlsx]`

### Database Backups
- **Backup**: `backup-[YYYY-MM-DD-HHmmss].[db|sql|dump]`
- **Export**: `export-[table]-[YYYY-MM-DD].[csv|json|xlsx]`

## Security Considerations

### 1. File Type Validation

Implement strict file type validation:

```csharp
public static class FileValidator
{
    private static readonly Dictionary<string, string[]> AllowedExtensions = new()
    {
        { "image", new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" } },
        { "document", new[] { ".pdf", ".docx", ".xlsx" } },
        { "database", new[] { ".db", ".sql", ".dump" } }
    };

    public static bool IsValidFileType(string fileName, string category)
    {
        var extension = Path.GetExtension(fileName).ToLower();
        return AllowedExtensions.ContainsKey(category) &&
               AllowedExtensions[category].Contains(extension);
    }
}
```

### 2. File Size Limits

Configure appropriate limits:
- **Images**: 5 MB max
- **Documents**: 10 MB max
- **Database backups**: 100 MB max

### 3. Access Control

Implement branch-level access control:
- Users can only access files from branches they're assigned to
- HeadOfficeAdmin can access all branch files
- Cashiers may have limited access to read-only files

### 4. Path Traversal Prevention

Sanitize file paths to prevent directory traversal attacks:

```csharp
public static string SanitizeFilePath(string fileName)
{
    return Path.GetFileName(fileName); // Removes any path components
}
```

## API Endpoints (Future Implementation)

### File Upload Endpoints

```http
POST /api/v1/branches/{branch}/products/{productId}/images
POST /api/v1/branches/{branch}/categories/{categoryId}/images
POST /api/v1/branches/{branch}/customers/{customerId}/files
POST /api/v1/branches/{branch}/suppliers/{supplierId}/files
POST /api/v1/branches/{branch}/documents
```

### File Download Endpoints

```http
GET /api/v1/branches/{branch}/products/{productId}/images/{fileName}
GET /api/v1/branches/{branch}/categories/{categoryId}/images/{fileName}
GET /api/v1/branches/{branch}/customers/{customerId}/files/{fileName}
GET /api/v1/branches/{branch}/suppliers/{supplierId}/files/{fileName}
GET /api/v1/branches/{branch}/documents/{fileName}
```

### File Management Endpoints

```http
GET /api/v1/branches/{branch}/files - List all files
DELETE /api/v1/branches/{branch}/files/{category}/{id}/{fileName} - Delete file
PUT /api/v1/branches/{branch}/files/{category}/{id}/{fileName} - Replace file
```

## Maintenance Tasks

### 1. Cleanup Orphaned Files

Implement periodic cleanup of files for deleted entities:

```csharp
public async Task CleanupOrphanedFilesAsync(string branchLoginName)
{
    // Clean up product images for deleted products
    var productDir = Path.Combine("Upload", "Branches", branchLoginName, "Products");
    var productIds = Directory.GetDirectories(productDir)
        .Select(d => Guid.Parse(Path.GetFileName(d)));

    var existingProductIds = await dbContext.Products
        .Select(p => p.Id)
        .ToListAsync();

    var orphanedIds = productIds.Except(existingProductIds);

    foreach (var orphanedId in orphanedIds)
    {
        var orphanedDir = Path.Combine(productDir, orphanedId.ToString());
        Directory.Delete(orphanedDir, recursive: true);
    }
}
```

### 2. Automated Backups

Schedule daily database backups:

```csharp
// Use a background service or scheduled job
public class DatabaseBackupService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // Backup all branch databases
            await BackupAllBranchDatabasesAsync();

            // Wait 24 hours
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
}
```

### 3. Disk Usage Monitoring

Monitor and report disk usage:

```csharp
public async Task<Dictionary<string, long>> GetBranchStorageUsageAsync()
{
    var usage = new Dictionary<string, long>();
    var branchesDir = Path.Combine("Upload", "Branches");

    foreach (var branchDir in Directory.GetDirectories(branchesDir))
    {
        var branchName = Path.GetFileName(branchDir);
        var totalSize = GetDirectorySize(branchDir);
        usage[branchName] = totalSize;
    }

    return usage;
}
```

## Production Considerations

### 1. Cloud Storage

For production environments, consider using cloud storage:

**AWS S3**:
- Scalable storage
- Built-in CDN via CloudFront
- Automatic backups
- Cost-effective

**Azure Blob Storage**:
- Integration with Azure services
- Geo-replication
- Lifecycle management

**Google Cloud Storage**:
- Global availability
- Strong consistency
- Integrated with Firebase

### 2. CDN Integration

Use a CDN for serving static files:
- Faster delivery globally
- Reduced server load
- Better user experience

### 3. Backup Strategy

Implement 3-2-1 backup rule:
- 3 copies of data
- 2 different storage types
- 1 offsite copy

## Files Created

1. **Upload/Branches/B001/** - Complete directory structure
2. **Upload/Branches/B002/** - Complete directory structure
3. **Upload/Branches/B003/** - Complete directory structure
4. **Upload/README.md** - Comprehensive documentation
5. **docs/2025-11-24-upload-structure.md** - This documentation

## Next Steps

1. **Implement File Upload API Endpoints**
   - Product image upload endpoint
   - Document upload endpoint
   - File validation and security

2. **Implement File Serving**
   - Configure static file serving
   - Implement access control
   - Add CDN support

3. **Add Database Backup Service**
   - Automated daily backups
   - Backup rotation (keep last 7 days)
   - Backup verification

4. **Create File Management UI**
   - Product image uploader
   - Document manager
   - File browser

5. **Implement Cleanup Jobs**
   - Orphaned file cleanup
   - Old backup cleanup
   - Temporary file cleanup

## Conclusion

The upload structure provides a robust, organized system for managing branch-related files. It follows industry best practices for file organization, security, and maintainability. The structure is designed to scale as the system grows and can easily integrate with cloud storage providers for production deployments.
