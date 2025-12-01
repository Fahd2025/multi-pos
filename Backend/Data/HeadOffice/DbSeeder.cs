using Backend.Data.Branch;
using Backend.Data.Shared;
using Backend.Models.Entities.Branch;
using Backend.Models.Entities.HeadOffice;
using BranchEntity = Backend.Models.Entities.HeadOffice.Branch;
using Backend.Utilities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data.HeadOffice;

public static class DbSeeder
{
    public static async Task SeedAsync(HeadOfficeDbContext context)
    {
        // Ensure database is created
        await context.Database.MigrateAsync();

        // Seed default admin user
        if (!await context.Users.AnyAsync())
        {
            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                Username = "admin",
                Email = "admin@multipos.com",
                PasswordHash = PasswordHasher.HashPassword("123"),
                FullNameEn = "System Administrator",
                FullNameAr = "مدير النظام",
                PreferredLanguage = "en",
                IsActive = true,
                IsHeadOfficeAdmin = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            context.Users.Add(adminUser);
            await context.SaveChangesAsync();

            Console.WriteLine("✓ Default admin user created (username: admin, password: 123)");
        }

        // Seed default branches
        if (!await context.Branches.AnyAsync())
        {
            var branch1 = new BranchEntity
            {
                Id = Guid.NewGuid(),
                Code = "B001",
                LoginName = "B001",
                NameEn = "Main Branch",
                NameAr = "الفرع الرئيسي",
                AddressEn = "123 Main Street",
                AddressAr = "123 الشارع الرئيسي",
                Phone = "+1234567890",
                Language = "en",
                Currency = "USD",
                DatabaseProvider = DatabaseProvider.SQLite,
                DbServer = ".",
                DbName = "branch_b001",
                DbPort = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            var branch2 = new BranchEntity
            {
                Id = Guid.NewGuid(),
                Code = "B002",
                LoginName = "B002",
                NameEn = "Downtown Branch",
                NameAr = "فرع وسط المدينة",
                AddressEn = "456 Downtown Ave",
                AddressAr = "456 شارع وسط المدينة",
                Phone = "+1234567891",
                Language = "en",
                Currency = "USD",
                DatabaseProvider = DatabaseProvider.SQLite,
                DbServer = ".",
                DbName = "branch_b002",
                DbPort = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            var branch3 = new BranchEntity
            {
                Id = Guid.NewGuid(),
                Code = "B003",
                LoginName = "B003",
                NameEn = "Mall Branch",
                NameAr = "فرع المول",
                AddressEn = "789 Mall Complex",
                AddressAr = "789 مجمع المول",
                Phone = "+1234567892",
                Language = "en",
                Currency = "USD",
                DatabaseProvider = DatabaseProvider.SQLite,
                DbServer = ".",
                DbName = "branch_b003",
                DbPort = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            context.Branches.AddRange(branch1, branch2, branch3);
            await context.SaveChangesAsync();

            Console.WriteLine("✓ Default branches created (B001, B002, B003)");

            // Assign admin user to all branches
            var adminUser = await context.Users.FirstAsync(u => u.Username == "admin");

            var branchUser1 = new BranchUser
            {
                Id = Guid.NewGuid(),
                UserId = adminUser.Id,
                BranchId = branch1.Id,
                Role = UserRole.Manager,
                IsActive = true,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = adminUser.Id,
            };

            var branchUser2 = new BranchUser
            {
                Id = Guid.NewGuid(),
                UserId = adminUser.Id,
                BranchId = branch2.Id,
                Role = UserRole.Manager,
                IsActive = true,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = adminUser.Id,
            };

            var branchUser3 = new BranchUser
            {
                Id = Guid.NewGuid(),
                UserId = adminUser.Id,
                BranchId = branch3.Id,
                Role = UserRole.Manager,
                IsActive = true,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = adminUser.Id,
            };

            context.BranchUsers.AddRange(branchUser1, branchUser2, branchUser3);
            await context.SaveChangesAsync();

            Console.WriteLine("✓ Admin user assigned to all branches");
        }

        // Seed technical password setting
        if (!await context.MainSettings.AnyAsync(s => s.Key == "TechnicalPassword"))
        {
            var technicalPasswordSetting = new MainSetting
            {
                Id = Guid.NewGuid(),
                Key = "TechnicalPassword",
                Value = PasswordHasher.HashPassword("admin@tech2024"),
                IsEncrypted = false,
                Description = "Technical override password for branch='all' access",
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = Guid.Empty,
            };

            context.MainSettings.Add(technicalPasswordSetting);
            await context.SaveChangesAsync();

            Console.WriteLine("✓ Technical password set (technical password: admin@tech2024)");
        }

        // Seed session timeout setting
        if (!await context.MainSettings.AnyAsync(s => s.Key == "SessionTimeoutMinutes"))
        {
            var sessionTimeoutSetting = new MainSetting
            {
                Id = Guid.NewGuid(),
                Key = "SessionTimeoutMinutes",
                Value = "30",
                IsEncrypted = false,
                Description = "Session inactivity timeout in minutes",
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = Guid.Empty,
            };

            context.MainSettings.Add(sessionTimeoutSetting);
            await context.SaveChangesAsync();

            Console.WriteLine("✓ Session timeout configured (30 minutes)");
        }

        // Seed max failed login attempts setting
        if (!await context.MainSettings.AnyAsync(s => s.Key == "MaxFailedLoginAttempts"))
        {
            var maxFailedLoginSetting = new MainSetting
            {
                Id = Guid.NewGuid(),
                Key = "MaxFailedLoginAttempts",
                Value = "5",
                IsEncrypted = false,
                Description = "Maximum failed login attempts before account lockout",
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = Guid.Empty,
            };

            context.MainSettings.Add(maxFailedLoginSetting);
            await context.SaveChangesAsync();

            Console.WriteLine("✓ Max failed login attempts configured (5 attempts)");
        }

        // Create branch databases
        await CreateBranchDatabasesAsync(context);
    }

    private static async Task CreateBranchDatabasesAsync(HeadOfficeDbContext context)
    {
        Console.WriteLine("\n=== Creating Branch Databases ===");

        var branches = await context.Branches.Where(b => b.IsActive).ToListAsync();
        var dbContextFactory = new DbContextFactory();
        var adminUser = await context.Users.FirstAsync(u => u.Username == "admin");

        foreach (var branch in branches)
        {
            try
            {
                // Ensure Upload directory structure exists for SQLite databases
                if (branch.DatabaseProvider == DatabaseProvider.SQLite)
                {
                    var uploadPath = Path.Combine(
                        "Upload",
                        "Branches",
                        branch.LoginName,
                        "Database"
                    );
                    Directory.CreateDirectory(uploadPath);
                }

                using var branchContext = dbContextFactory.CreateBranchContext(branch);

                // Ensure database is created
                await branchContext.Database.EnsureCreatedAsync();

                Console.WriteLine(
                    $"✓ Branch database created/verified: {branch.Code} ({branch.DbName})"
                );

                // Seed sample data for the branch
                await SeedBranchDataAsync(branchContext, adminUser.Id, branch.Code);
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"✗ Failed to create branch database {branch.Code}: {ex.Message}"
                );
            }
        }

        Console.WriteLine("=== Branch Databases Setup Complete ===\n");
    }

    private static async Task SeedBranchDataAsync(
        BranchDbContext context,
        Guid adminUserId,
        string branchCode
    )
    {
        // Check if data already exists
        if (await context.Categories.AnyAsync())
        {
            Console.WriteLine($"  → Branch {branchCode} already has data, skipping seed");
            return;
        }

        Console.WriteLine($"  → Seeding sample data for branch {branchCode}");

        // Seed Categories
        var categories = new List<Category>
        {
            new Category
            {
                Id = Guid.NewGuid(),
                Code = "CAT001",
                NameEn = "Electronics",
                NameAr = "إلكترونيات",
                DescriptionEn = "Electronic devices and accessories",
                DescriptionAr = "الأجهزة الإلكترونية والملحقات",
                DisplayOrder = 1,
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Category
            {
                Id = Guid.NewGuid(),
                Code = "CAT002",
                NameEn = "Clothing",
                NameAr = "ملابس",
                DescriptionEn = "Men's and women's clothing",
                DescriptionAr = "ملابس رجالية ونسائية",
                DisplayOrder = 2,
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Category
            {
                Id = Guid.NewGuid(),
                Code = "CAT003",
                NameEn = "Food & Beverages",
                NameAr = "أغذية ومشروبات",
                DescriptionEn = "Food items and beverages",
                DescriptionAr = "المواد الغذائية والمشروبات",
                DisplayOrder = 3,
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Category
            {
                Id = Guid.NewGuid(),
                Code = "CAT004",
                NameEn = "Home & Garden",
                NameAr = "المنزل والحديقة",
                DescriptionEn = "Home and garden supplies",
                DescriptionAr = "مستلزمات المنزل والحديقة",
                DisplayOrder = 4,
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Category
            {
                Id = Guid.NewGuid(),
                Code = "CAT005",
                NameEn = "Sports & Outdoors",
                NameAr = "رياضة وأنشطة خارجية",
                DescriptionEn = "Sports equipment and outdoor gear",
                DescriptionAr = "معدات رياضية وأدوات خارجية",
                DisplayOrder = 5,
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
        };

        context.Categories.AddRange(categories);
        await context.SaveChangesAsync();
        Console.WriteLine($"    ✓ Created {categories.Count} categories");

        // Seed Suppliers
        var suppliers = new List<Supplier>
        {
            new Supplier
            {
                Id = Guid.NewGuid(),
                Code = "SUP001",
                NameEn = "TechSupply Co.",
                NameAr = "شركة تك سبلاي",
                Email = "contact@techsupply.com",
                Phone = "+1234567890",
                AddressEn = "123 Tech Street, Silicon Valley",
                AddressAr = "123 شارع التقنية، وادي السيليكون",
                PaymentTerms = "Net 30 days",
                DeliveryTerms = "FOB",
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Supplier
            {
                Id = Guid.NewGuid(),
                Code = "SUP002",
                NameEn = "Fashion Wholesale Ltd.",
                NameAr = "شركة الأزياء بالجملة",
                Email = "info@fashionwholesale.com",
                Phone = "+1234567891",
                AddressEn = "456 Fashion Ave, New York",
                AddressAr = "456 شارع الأزياء، نيويورك",
                PaymentTerms = "Net 45 days",
                DeliveryTerms = "CIF",
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Supplier
            {
                Id = Guid.NewGuid(),
                Code = "SUP003",
                NameEn = "Global Foods Inc.",
                NameAr = "شركة الأغذية العالمية",
                Email = "sales@globalfoods.com",
                Phone = "+1234567892",
                AddressEn = "789 Food Court, Chicago",
                AddressAr = "789 ساحة الطعام، شيكاغو",
                PaymentTerms = "Net 15 days",
                DeliveryTerms = "DDP",
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
        };

        context.Suppliers.AddRange(suppliers);
        await context.SaveChangesAsync();
        Console.WriteLine($"    ✓ Created {suppliers.Count} suppliers");

        // Seed Products
        var products = new List<Product>
        {
            new Product
            {
                Id = Guid.NewGuid(),
                SKU = "PRD001",
                NameEn = "Wireless Mouse",
                NameAr = "ماوس لاسلكي",
                DescriptionEn = "Ergonomic wireless mouse with USB receiver",
                DescriptionAr = "ماوس لاسلكي مريح مع مستقبل USB",
                CategoryId = categories[0].Id, // Electronics
                SupplierId = suppliers[0].Id, // TechSupply Co.
                SellingPrice = 29.99m,
                CostPrice = 15.00m,
                StockLevel = 50,
                MinStockThreshold = 10,
                Barcode = "1234567890123",
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Product
            {
                Id = Guid.NewGuid(),
                SKU = "PRD002",
                NameEn = "USB-C Cable",
                NameAr = "كابل USB-C",
                DescriptionEn = "1.5m USB-C to USB-C cable, fast charging",
                DescriptionAr = "كابل USB-C بطول 1.5 متر، شحن سريع",
                CategoryId = categories[0].Id, // Electronics
                SupplierId = suppliers[0].Id,
                SellingPrice = 12.99m,
                CostPrice = 6.00m,
                StockLevel = 100,
                MinStockThreshold = 20,
                Barcode = "1234567890124",
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Product
            {
                Id = Guid.NewGuid(),
                SKU = "PRD003",
                NameEn = "Cotton T-Shirt",
                NameAr = "تي شيرت قطني",
                DescriptionEn = "100% cotton, available in multiple colors",
                DescriptionAr = "100% قطن، متوفر بألوان متعددة",
                CategoryId = categories[1].Id, // Clothing
                SupplierId = suppliers[1].Id, // Fashion Wholesale
                SellingPrice = 19.99m,
                CostPrice = 8.00m,
                StockLevel = 75,
                MinStockThreshold = 15,
                Barcode = "2234567890123",
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Product
            {
                Id = Guid.NewGuid(),
                SKU = "PRD004",
                NameEn = "Jeans",
                NameAr = "بنطال جينز",
                DescriptionEn = "Classic fit denim jeans",
                DescriptionAr = "بنطال جينز كلاسيكي",
                CategoryId = categories[1].Id, // Clothing
                SupplierId = suppliers[1].Id,
                SellingPrice = 49.99m,
                CostPrice = 25.00m,
                StockLevel = 40,
                MinStockThreshold = 10,
                Barcode = "2234567890124",
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Product
            {
                Id = Guid.NewGuid(),
                SKU = "PRD005",
                NameEn = "Organic Coffee",
                NameAr = "قهوة عضوية",
                DescriptionEn = "Premium organic coffee beans, 250g",
                DescriptionAr = "حبوب قهوة عضوية فاخرة، 250 جرام",
                CategoryId = categories[2].Id, // Food & Beverages
                SupplierId = suppliers[2].Id, // Global Foods
                SellingPrice = 15.99m,
                CostPrice = 8.00m,
                StockLevel = 60,
                MinStockThreshold = 20,
                Barcode = "3234567890123",
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Product
            {
                Id = Guid.NewGuid(),
                SKU = "PRD006",
                NameEn = "Green Tea",
                NameAr = "شاي أخضر",
                DescriptionEn = "Premium green tea, 50 bags",
                DescriptionAr = "شاي أخضر فاخر، 50 كيس",
                CategoryId = categories[2].Id, // Food & Beverages
                SupplierId = suppliers[2].Id,
                SellingPrice = 8.99m,
                CostPrice = 4.00m,
                StockLevel = 80,
                MinStockThreshold = 25,
                Barcode = "3234567890124",
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Product
            {
                Id = Guid.NewGuid(),
                SKU = "PRD007",
                NameEn = "LED Desk Lamp",
                NameAr = "مصباح مكتب LED",
                DescriptionEn = "Adjustable LED desk lamp with USB port",
                DescriptionAr = "مصباح مكتب LED قابل للتعديل مع منفذ USB",
                CategoryId = categories[3].Id, // Home & Garden
                SupplierId = suppliers[0].Id,
                SellingPrice = 39.99m,
                CostPrice = 20.00m,
                StockLevel = 30,
                MinStockThreshold = 8,
                Barcode = "4234567890123",
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Product
            {
                Id = Guid.NewGuid(),
                SKU = "PRD008",
                NameEn = "Yoga Mat",
                NameAr = "سجادة يوغا",
                DescriptionEn = "Non-slip yoga mat with carrying strap",
                DescriptionAr = "سجادة يوغا غير قابلة للانزلاق مع حزام حمل",
                CategoryId = categories[4].Id, // Sports & Outdoors
                SupplierId = suppliers[0].Id,
                SellingPrice = 24.99m,
                CostPrice = 12.00m,
                StockLevel = 45,
                MinStockThreshold = 10,
                Barcode = "5234567890123",
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
        };

        context.Products.AddRange(products);
        await context.SaveChangesAsync();
        Console.WriteLine($"    ✓ Created {products.Count} products");

        // Seed Customers
        var customers = new List<Customer>
        {
            new Customer
            {
                Id = Guid.NewGuid(),
                Code = "CUST001",
                NameEn = "John Smith",
                NameAr = "جون سميث",
                Email = "john.smith@email.com",
                Phone = "+1234567890",
                AddressEn = "123 Main St, Apt 4B",
                AddressAr = "123 الشارع الرئيسي، شقة 4ب",
                TotalPurchases = 0,
                VisitCount = 0,
                LoyaltyPoints = 0,
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Customer
            {
                Id = Guid.NewGuid(),
                Code = "CUST002",
                NameEn = "Sarah Johnson",
                NameAr = "سارة جونسون",
                Email = "sarah.j@email.com",
                Phone = "+1234567891",
                AddressEn = "456 Oak Avenue",
                AddressAr = "456 شارع البلوط",
                TotalPurchases = 0,
                VisitCount = 0,
                LoyaltyPoints = 0,
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Customer
            {
                Id = Guid.NewGuid(),
                Code = "CUST003",
                NameEn = "Michael Brown",
                NameAr = "مايكل براون",
                Email = "m.brown@email.com",
                Phone = "+1234567892",
                AddressEn = "789 Pine Street",
                AddressAr = "789 شارع الصنوبر",
                TotalPurchases = 0,
                VisitCount = 0,
                LoyaltyPoints = 0,
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Customer
            {
                Id = Guid.NewGuid(),
                Code = "CUST004",
                NameEn = "Emily Davis",
                NameAr = "إيميلي ديفيس",
                Email = "emily.d@email.com",
                Phone = "+1234567893",
                AddressEn = "321 Elm Road",
                AddressAr = "321 طريق الدردار",
                TotalPurchases = 0,
                VisitCount = 0,
                LoyaltyPoints = 0,
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
            new Customer
            {
                Id = Guid.NewGuid(),
                Code = "CUST005",
                NameEn = "David Wilson",
                NameAr = "ديفيد ويلسون",
                Email = "david.w@email.com",
                Phone = "+1234567894",
                AddressEn = "654 Maple Lane",
                AddressAr = "654 زقاق القيقب",
                TotalPurchases = 0,
                VisitCount = 0,
                LoyaltyPoints = 0,
                IsActive = true,
                CreatedBy = adminUserId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            },
        };

        context.Customers.AddRange(customers);
        await context.SaveChangesAsync();
        Console.WriteLine($"    ✓ Created {customers.Count} customers");

        Console.WriteLine($"  ✓ Branch {branchCode} seed data complete");
    }
}
