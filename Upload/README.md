# Upload Directory Structure

This directory contains the upload structure for branch-related files in the Multi-POS system.

## Directory Structure

```
Upload/
└── Branches/
    └── [Branch Login Name]/
        ├── Database/          # Database backups and exports
        ├── Products/          # Product-related files
        │   └── [Product ID]/  # Individual product files (images, docs)
        ├── Categories/        # Category images and documents
        │   └── [Category ID]/ # Individual category files
        ├── Customers/         # Customer-related files
        │   └── [Customer ID]/ # Individual customer files (logos, docs)
        ├── Suppliers/         # Supplier-related files
        │   └── [Supplier ID]/ # Individual supplier files (logos, docs)
        └── Documents/         # General branch documents
```

## Purpose

Each branch has its own dedicated upload directory structure to organize files:

### Database/
- Database backups (SQLite, SQL Server, PostgreSQL, MySQL)
- Database export files
- Migration scripts specific to the branch

### Products/[Product ID]/
- Product images (main image, gallery images)
- Product documentation (manuals, specifications)
- Product certificates or compliance documents

### Categories/[Category ID]/
- Category icons and images
- Category banners
- Category-specific documents

### Customers/[Customer ID]/
- Customer logos
- Customer contracts
- Customer-specific documents
- ID or business license scans (if required)

### Suppliers/[Supplier ID]/
- Supplier logos
- Supplier contracts
- Supplier catalogs
- Certificates and compliance documents

### Documents/
- General branch documents
- Reports and exports
- Branch-specific forms and templates
- Tax documents
- Receipts and invoices

## Usage

### Creating a New Branch Upload Directory

When a new branch is created in the system, create the corresponding upload directory structure:

```bash
mkdir -p Upload/Branches/[LoginName]/{Database,Products,Categories,Customers,Suppliers,Documents}
```

For example, for branch "B004":
```bash
mkdir -p Upload/Branches/B004/{Database,Products,Categories,Customers,Suppliers,Documents}
```

### Uploading Product Images

Product images should be stored in `Upload/Branches/[Branch]/Products/[ProductID]/`:

1. Navigate to the product directory
2. Upload images with descriptive names (e.g., `main.jpg`, `gallery-1.jpg`, `gallery-2.jpg`)
3. Update the product record in the database with the image paths

### Accessing Files

Files can be accessed via API endpoints or direct file system access:

- **API**: `/api/v1/branches/[branch]/files/[category]/[id]/[filename]`
- **Direct**: `Upload/Branches/[Branch]/[Category]/[ID]/[filename]`

## File Naming Conventions

### Product Images
- `main.[ext]` - Main product image
- `gallery-[n].[ext]` - Gallery images (numbered sequentially)
- `thumbnail.[ext]` - Thumbnail image

### Category Images
- `icon.[ext]` - Category icon
- `banner.[ext]` - Category banner
- `thumbnail.[ext]` - Category thumbnail

### Customer/Supplier Files
- `logo.[ext]` - Company logo
- `contract-[date].[ext]` - Contracts with date
- `certificate-[type].[ext]` - Certificates by type

### Database Backups
- `backup-[YYYY-MM-DD-HHmmss].[ext]` - Timestamped backups
- `export-[table]-[YYYY-MM-DD].[ext]` - Table exports with date

## Security Considerations

1. **File Size Limits**: Configure appropriate file size limits for each file type
2. **File Type Validation**: Only allow specific file types (images: jpg, png, gif; documents: pdf, docx)
3. **Access Control**: Ensure users can only access files for branches they're assigned to
4. **Virus Scanning**: Implement virus scanning for uploaded files
5. **Encryption**: Consider encrypting sensitive documents

## Default Branches

The following default branches are pre-created:

- **B001** - Main Branch
- **B002** - Downtown Branch
- **B003** - Mall Branch

## Example: Adding a Product Image

```csharp
// Example backend code for product image upload
var branch = "B001";
var productId = "550e8400-e29b-41d4-a716-446655440000";
var uploadPath = $"Upload/Branches/{branch}/Products/{productId}/";
var fileName = "main.jpg";
var fullPath = Path.Combine(uploadPath, fileName);

// Save file
await using var fileStream = new FileStream(fullPath, FileMode.Create);
await uploadedFile.CopyToAsync(fileStream);

// Update product record
product.ImagePath = $"/uploads/{branch}/products/{productId}/{fileName}";
await dbContext.SaveChangesAsync();
```

## Maintenance

- Regularly clean up orphaned files (files for deleted products/customers/suppliers)
- Implement backup procedures for uploaded files
- Monitor disk usage and implement quotas if necessary
- Consider implementing file retention policies

## Notes

- All directories contain a `.gitkeep` file to ensure they're tracked by Git
- Empty directories will be preserved in version control
- When deploying to production, ensure proper file permissions are set
- Consider using cloud storage (AWS S3, Azure Blob Storage) for production deployments
