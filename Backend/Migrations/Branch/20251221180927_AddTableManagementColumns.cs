using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations.Branch
{
    /// <inheritdoc />
    public partial class AddTableManagementColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var provider = migrationBuilder.ActiveProvider;

            // ============================================================
            // STEP 1: Create Zones and Tables tables (provider-specific, idempotent)
            // ============================================================

            if (provider?.Contains("MySql", StringComparison.OrdinalIgnoreCase) == true)
            {
                // MySQL
                migrationBuilder.Sql(@"
                    CREATE TABLE IF NOT EXISTS Zones (
                        Id INT AUTO_INCREMENT PRIMARY KEY,
                        Name VARCHAR(50) NOT NULL,
                        Description VARCHAR(200),
                        DisplayOrder INT NOT NULL,
                        IsActive TINYINT(1) NOT NULL DEFAULT 1,
                        CreatedAt DATETIME NOT NULL,
                        UpdatedAt DATETIME NOT NULL,
                        CreatedBy VARCHAR(100) NOT NULL,
                        UpdatedBy VARCHAR(100) NOT NULL
                    );");

                // MySQL doesn't support CREATE INDEX IF NOT EXISTS, so we check information_schema first
                migrationBuilder.Sql(@"
                    SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'Zones' AND index_name = 'IX_Zones_DisplayOrder');
                    SET @sqlstmt := IF(@exist > 0, 'SELECT 1', 'CREATE INDEX IX_Zones_DisplayOrder ON Zones(DisplayOrder)');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;
                ");

                migrationBuilder.Sql(@"
                    SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'Zones' AND index_name = 'IX_Zones_IsActive');
                    SET @sqlstmt := IF(@exist > 0, 'SELECT 1', 'CREATE INDEX IX_Zones_IsActive ON Zones(IsActive)');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;
                ");

                migrationBuilder.Sql(@"
                    CREATE TABLE IF NOT EXISTS `Tables` (
                        Id INT AUTO_INCREMENT PRIMARY KEY,
                        Number INT NOT NULL UNIQUE,
                        Name VARCHAR(100) NOT NULL,
                        Capacity INT NOT NULL,
                        PositionX DOUBLE NOT NULL,
                        PositionY DOUBLE NOT NULL,
                        Width DOUBLE NOT NULL DEFAULT 10,
                        Height DOUBLE NOT NULL DEFAULT 10,
                        Rotation INT NOT NULL DEFAULT 0,
                        Shape VARCHAR(20) NOT NULL DEFAULT 'Rectangle',
                        IsActive TINYINT(1) NOT NULL DEFAULT 1,
                        ZoneId INT,
                        CreatedAt DATETIME NOT NULL,
                        UpdatedAt DATETIME NOT NULL,
                        DeletedAt DATETIME,
                        CreatedBy VARCHAR(100) NOT NULL,
                        UpdatedBy VARCHAR(100) NOT NULL,
                        FOREIGN KEY (ZoneId) REFERENCES Zones(Id) ON DELETE SET NULL
                    );");

                migrationBuilder.Sql(@"
                    SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'Tables' AND index_name = 'IX_Tables_Number');
                    SET @sqlstmt := IF(@exist > 0, 'SELECT 1', 'CREATE UNIQUE INDEX IX_Tables_Number ON `Tables`(Number)');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;
                ");

                migrationBuilder.Sql(@"
                    SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'Tables' AND index_name = 'IX_Tables_ZoneId');
                    SET @sqlstmt := IF(@exist > 0, 'SELECT 1', 'CREATE INDEX IX_Tables_ZoneId ON `Tables`(ZoneId)');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;
                ");

                migrationBuilder.Sql(@"
                    SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'Tables' AND index_name = 'IX_Tables_IsActive');
                    SET @sqlstmt := IF(@exist > 0, 'SELECT 1', 'CREATE INDEX IX_Tables_IsActive ON `Tables`(IsActive)');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;
                ");
            }
            else if (provider?.Contains("SqlServer", StringComparison.OrdinalIgnoreCase) == true)
            {
                // SQL Server
                migrationBuilder.Sql(@"
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Zones')
                    CREATE TABLE Zones (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        Name NVARCHAR(50) NOT NULL,
                        Description NVARCHAR(200),
                        DisplayOrder INT NOT NULL,
                        IsActive BIT NOT NULL DEFAULT 1,
                        CreatedAt DATETIME2 NOT NULL,
                        UpdatedAt DATETIME2 NOT NULL,
                        CreatedBy NVARCHAR(100) NOT NULL,
                        UpdatedBy NVARCHAR(100) NOT NULL
                    );");

                migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Zones_DisplayOrder') CREATE INDEX IX_Zones_DisplayOrder ON Zones(DisplayOrder);");
                migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Zones_IsActive') CREATE INDEX IX_Zones_IsActive ON Zones(IsActive);");

                migrationBuilder.Sql(@"
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tables')
                    CREATE TABLE Tables (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        Number INT NOT NULL UNIQUE,
                        Name NVARCHAR(100) NOT NULL,
                        Capacity INT NOT NULL,
                        PositionX FLOAT NOT NULL,
                        PositionY FLOAT NOT NULL,
                        Width FLOAT NOT NULL DEFAULT 10,
                        Height FLOAT NOT NULL DEFAULT 10,
                        Rotation INT NOT NULL DEFAULT 0,
                        Shape NVARCHAR(20) NOT NULL DEFAULT 'Rectangle',
                        IsActive BIT NOT NULL DEFAULT 1,
                        ZoneId INT,
                        CreatedAt DATETIME2 NOT NULL,
                        UpdatedAt DATETIME2 NOT NULL,
                        DeletedAt DATETIME2,
                        CreatedBy NVARCHAR(100) NOT NULL,
                        UpdatedBy NVARCHAR(100) NOT NULL,
                        FOREIGN KEY (ZoneId) REFERENCES Zones(Id) ON DELETE SET NULL
                    );");

                migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tables_Number') CREATE UNIQUE INDEX IX_Tables_Number ON Tables(Number);");
                migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tables_ZoneId') CREATE INDEX IX_Tables_ZoneId ON Tables(ZoneId);");
                migrationBuilder.Sql("IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tables_IsActive') CREATE INDEX IX_Tables_IsActive ON Tables(IsActive);");
            }
            else if (provider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true ||
                     provider?.Contains("PostgreSQL", StringComparison.OrdinalIgnoreCase) == true)
            {
                // PostgreSQL
                migrationBuilder.Sql(@"
                    CREATE TABLE IF NOT EXISTS ""Zones"" (
                        ""Id"" SERIAL PRIMARY KEY,
                        ""Name"" VARCHAR(50) NOT NULL,
                        ""Description"" VARCHAR(200),
                        ""DisplayOrder"" INT NOT NULL,
                        ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE,
                        ""CreatedAt"" TIMESTAMP NOT NULL,
                        ""UpdatedAt"" TIMESTAMP NOT NULL,
                        ""CreatedBy"" VARCHAR(100) NOT NULL,
                        ""UpdatedBy"" VARCHAR(100) NOT NULL
                    );");

                migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Zones_DisplayOrder"" ON ""Zones""(""DisplayOrder"");");
                migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Zones_IsActive"" ON ""Zones""(""IsActive"");");

                migrationBuilder.Sql(@"
                    CREATE TABLE IF NOT EXISTS ""Tables"" (
                        ""Id"" SERIAL PRIMARY KEY,
                        ""Number"" INT NOT NULL UNIQUE,
                        ""Name"" VARCHAR(100) NOT NULL,
                        ""Capacity"" INT NOT NULL,
                        ""PositionX"" DOUBLE PRECISION NOT NULL,
                        ""PositionY"" DOUBLE PRECISION NOT NULL,
                        ""Width"" DOUBLE PRECISION NOT NULL DEFAULT 10,
                        ""Height"" DOUBLE PRECISION NOT NULL DEFAULT 10,
                        ""Rotation"" INT NOT NULL DEFAULT 0,
                        ""Shape"" VARCHAR(20) NOT NULL DEFAULT 'Rectangle',
                        ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE,
                        ""ZoneId"" INT,
                        ""CreatedAt"" TIMESTAMP NOT NULL,
                        ""UpdatedAt"" TIMESTAMP NOT NULL,
                        ""DeletedAt"" TIMESTAMP,
                        ""CreatedBy"" VARCHAR(100) NOT NULL,
                        ""UpdatedBy"" VARCHAR(100) NOT NULL,
                        FOREIGN KEY (""ZoneId"") REFERENCES ""Zones""(""Id"") ON DELETE SET NULL
                    );");

                migrationBuilder.Sql(@"CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Tables_Number"" ON ""Tables""(""Number"");");
                migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Tables_ZoneId"" ON ""Tables""(""ZoneId"");");
                migrationBuilder.Sql(@"CREATE INDEX IF NOT EXISTS ""IX_Tables_IsActive"" ON ""Tables""(""IsActive"");");
            }
            else
            {
                // SQLite and others
                migrationBuilder.Sql(@"
                    CREATE TABLE IF NOT EXISTS Zones (
                        Id INTEGER PRIMARY KEY AUTOINCREMENT,
                        Name TEXT NOT NULL,
                        Description TEXT,
                        DisplayOrder INTEGER NOT NULL,
                        IsActive INTEGER NOT NULL DEFAULT 1,
                        CreatedAt TEXT NOT NULL,
                        UpdatedAt TEXT NOT NULL,
                        CreatedBy TEXT NOT NULL,
                        UpdatedBy TEXT NOT NULL
                    );");

                migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS IX_Zones_DisplayOrder ON Zones(DisplayOrder);");
                migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS IX_Zones_IsActive ON Zones(IsActive);");

                migrationBuilder.Sql(@"
                    CREATE TABLE IF NOT EXISTS Tables (
                        Id INTEGER PRIMARY KEY AUTOINCREMENT,
                        Number INTEGER NOT NULL UNIQUE,
                        Name TEXT NOT NULL,
                        Capacity INTEGER NOT NULL,
                        PositionX REAL NOT NULL,
                        PositionY REAL NOT NULL,
                        Width REAL NOT NULL DEFAULT 10,
                        Height REAL NOT NULL DEFAULT 10,
                        Rotation INTEGER NOT NULL DEFAULT 0,
                        Shape TEXT NOT NULL DEFAULT 'Rectangle',
                        IsActive INTEGER NOT NULL DEFAULT 1,
                        ZoneId INTEGER,
                        CreatedAt TEXT NOT NULL,
                        UpdatedAt TEXT NOT NULL,
                        DeletedAt TEXT,
                        CreatedBy TEXT NOT NULL,
                        UpdatedBy TEXT NOT NULL,
                        FOREIGN KEY (ZoneId) REFERENCES Zones(Id) ON DELETE SET NULL
                    );");

                migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS IX_Tables_Number ON Tables(Number);");
                migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS IX_Tables_ZoneId ON Tables(ZoneId);");
                migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS IX_Tables_IsActive ON Tables(IsActive);");
            }

            // Check if we're using MySQL/MariaDB - handle duplicate column errors gracefully
            if (migrationBuilder.ActiveProvider?.Contains("MySql", StringComparison.OrdinalIgnoreCase) == true)
            {
                // MySQL: Check if columns exist before adding them (handles partial migration scenarios)
                migrationBuilder.Sql(@"
                    SET @dbname = DATABASE();
                    SET @tablename = 'Sales';

                    SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'TableId');
                    SET @sqlstmt = IF(@columnExists = 0,
                        'ALTER TABLE Sales ADD COLUMN TableId INT NULL',
                        'SELECT ''Column TableId already exists'' AS Info');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;

                    SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'TableNumber');
                    SET @sqlstmt = IF(@columnExists = 0,
                        'ALTER TABLE Sales ADD COLUMN TableNumber INT NULL',
                        'SELECT ''Column TableNumber already exists'' AS Info');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;

                    SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'GuestCount');
                    SET @sqlstmt = IF(@columnExists = 0,
                        'ALTER TABLE Sales ADD COLUMN GuestCount INT NULL',
                        'SELECT ''Column GuestCount already exists'' AS Info');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;

                    SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'Status');
                    SET @sqlstmt = IF(@columnExists = 0,
                        'ALTER TABLE Sales ADD COLUMN Status VARCHAR(20) NOT NULL DEFAULT ''Completed''',
                        'SELECT ''Column Status already exists'' AS Info');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;

                    SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'CompletedAt');
                    SET @sqlstmt = IF(@columnExists = 0,
                        'ALTER TABLE Sales ADD COLUMN CompletedAt DATETIME NULL',
                        'SELECT ''Column CompletedAt already exists'' AS Info');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;
                ");
            }
            else if (migrationBuilder.ActiveProvider?.Contains("SqlServer", StringComparison.OrdinalIgnoreCase) == true)
            {
                // SQL Server: Check if columns exist before adding them
                migrationBuilder.Sql(@"
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Sales') AND name = 'TableId')
                        ALTER TABLE Sales ADD TableId INT NULL;

                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Sales') AND name = 'TableNumber')
                        ALTER TABLE Sales ADD TableNumber INT NULL;

                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Sales') AND name = 'GuestCount')
                        ALTER TABLE Sales ADD GuestCount INT NULL;

                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Sales') AND name = 'Status')
                        ALTER TABLE Sales ADD Status NVARCHAR(20) NOT NULL DEFAULT 'Completed';

                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Sales') AND name = 'CompletedAt')
                        ALTER TABLE Sales ADD CompletedAt DATETIME2 NULL;
                ");
            }
            else if (migrationBuilder.ActiveProvider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true ||
                     migrationBuilder.ActiveProvider?.Contains("PostgreSQL", StringComparison.OrdinalIgnoreCase) == true)
            {
                // PostgreSQL: Check if columns exist before adding them
                migrationBuilder.Sql(@"
                    DO $$
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Sales' AND column_name='TableId') THEN
                            ALTER TABLE ""Sales"" ADD COLUMN ""TableId"" INTEGER NULL;
                        END IF;

                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Sales' AND column_name='TableNumber') THEN
                            ALTER TABLE ""Sales"" ADD COLUMN ""TableNumber"" INTEGER NULL;
                        END IF;

                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Sales' AND column_name='GuestCount') THEN
                            ALTER TABLE ""Sales"" ADD COLUMN ""GuestCount"" INTEGER NULL;
                        END IF;

                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Sales' AND column_name='Status') THEN
                            ALTER TABLE ""Sales"" ADD COLUMN ""Status"" VARCHAR(20) NOT NULL DEFAULT 'Completed';
                        END IF;

                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Sales' AND column_name='CompletedAt') THEN
                            ALTER TABLE ""Sales"" ADD COLUMN ""CompletedAt"" TIMESTAMP NULL;
                        END IF;
                    END $$;
                ");
            }
            else
            {
                // SQLite and other providers: Use standard AddColumn
                migrationBuilder.AddColumn<int>(
                    name: "TableId",
                    table: "Sales",
                    type: "INTEGER",
                    nullable: true);

                migrationBuilder.AddColumn<int>(
                    name: "TableNumber",
                    table: "Sales",
                    type: "INTEGER",
                    nullable: true);

                migrationBuilder.AddColumn<int>(
                    name: "GuestCount",
                    table: "Sales",
                    type: "INTEGER",
                    nullable: true);

                migrationBuilder.AddColumn<string>(
                    name: "Status",
                    table: "Sales",
                    type: "TEXT",
                    maxLength: 20,
                    nullable: false,
                    defaultValue: "Completed");

                migrationBuilder.AddColumn<DateTime>(
                    name: "CompletedAt",
                    table: "Sales",
                    type: "TEXT",
                    nullable: true);
            }

            // ============================================================
            // STEP 4: Create indexes and foreign key for Sales table
            // ============================================================
            migrationBuilder.CreateIndex(
                name: "IX_Sales_TableId",
                table: "Sales",
                column: "TableId");

            migrationBuilder.CreateIndex(
                name: "IX_Sales_Status",
                table: "Sales",
                column: "Status");

            migrationBuilder.AddForeignKey(
                name: "FK_Sales_Tables_TableId",
                table: "Sales",
                column: "TableId",
                principalTable: "Tables",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            var provider = migrationBuilder.ActiveProvider;

            // ============================================================
            // STEP 1: Drop FK constraint and indexes from Sales table FIRST
            // ============================================================
            // We must drop the FK constraint before dropping the Tables table

            if (provider?.Contains("MySql", StringComparison.OrdinalIgnoreCase) == true)
            {
                // MySQL: Drop FK constraint if it exists
                migrationBuilder.Sql(@"
                    SET @fkExists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                        WHERE CONSTRAINT_SCHEMA = DATABASE()
                        AND TABLE_NAME = 'Sales'
                        AND CONSTRAINT_NAME = 'FK_Sales_Tables_TableId'
                        AND CONSTRAINT_TYPE = 'FOREIGN KEY');
                    SET @sqlstmt := IF(@fkExists > 0,
                        'ALTER TABLE Sales DROP FOREIGN KEY FK_Sales_Tables_TableId',
                        'SELECT 1');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;
                ");

                // Drop indexes if they exist
                migrationBuilder.Sql(@"
                    SET @idxExists := (SELECT COUNT(*) FROM information_schema.statistics
                        WHERE table_schema = DATABASE() AND table_name = 'Sales' AND index_name = 'IX_Sales_TableId');
                    SET @sqlstmt := IF(@idxExists > 0, 'DROP INDEX IX_Sales_TableId ON Sales', 'SELECT 1');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;
                ");

                migrationBuilder.Sql(@"
                    SET @idxExists := (SELECT COUNT(*) FROM information_schema.statistics
                        WHERE table_schema = DATABASE() AND table_name = 'Sales' AND index_name = 'IX_Sales_Status');
                    SET @sqlstmt := IF(@idxExists > 0, 'DROP INDEX IX_Sales_Status ON Sales', 'SELECT 1');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;
                ");
            }
            else if (provider?.Contains("SqlServer", StringComparison.OrdinalIgnoreCase) == true)
            {
                // SQL Server: Drop FK constraint if it exists
                migrationBuilder.Sql(@"
                    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Sales_Tables_TableId')
                        ALTER TABLE Sales DROP CONSTRAINT FK_Sales_Tables_TableId;
                ");

                // Drop indexes if they exist
                migrationBuilder.Sql(@"
                    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Sales_TableId' AND object_id = OBJECT_ID('Sales'))
                        DROP INDEX IX_Sales_TableId ON Sales;
                ");

                migrationBuilder.Sql(@"
                    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Sales_Status' AND object_id = OBJECT_ID('Sales'))
                        DROP INDEX IX_Sales_Status ON Sales;
                ");
            }
            else if (provider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true ||
                     provider?.Contains("PostgreSQL", StringComparison.OrdinalIgnoreCase) == true)
            {
                // PostgreSQL: Drop FK constraint if it exists
                migrationBuilder.Sql(@"
                    DO $$
                    BEGIN
                        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Sales_Tables_TableId') THEN
                            ALTER TABLE ""Sales"" DROP CONSTRAINT ""FK_Sales_Tables_TableId"";
                        END IF;
                    END $$;
                ");

                // Drop indexes if they exist
                migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Sales_TableId\";");
                migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Sales_Status\";");
            }

            // ============================================================
            // STEP 2: Drop columns from Sales table
            // ============================================================

            // SQLite doesn't support DROP COLUMN or DROP FOREIGN KEY
            // We need to use the table rebuild pattern for SQLite
            if (provider?.Contains("Sqlite", StringComparison.OrdinalIgnoreCase) == true)
            {
                // SQLite: Check if columns exist before rebuilding table
                migrationBuilder.Sql(@"
                    -- Only rebuild table if TableId column exists
                    CREATE TEMPORARY TABLE _check_column AS
                        SELECT COUNT(*) as col_exists FROM pragma_table_info('Sales') WHERE name='TableId';

                    -- Store the result
                    CREATE TEMPORARY TABLE IF NOT EXISTS _rebuild_needed AS SELECT col_exists FROM _check_column;
                    DROP TABLE _check_column;
                ");

                // SQLite: Rebuild table without the table management columns (only if columns exist)
                migrationBuilder.Sql(@"
                    -- Check if rebuild is needed
                    PRAGMA foreign_keys = OFF;

                    DROP TABLE IF EXISTS Sales_new;

                    CREATE TABLE IF NOT EXISTS Sales_new (
                        Id TEXT PRIMARY KEY NOT NULL,
                        TransactionId TEXT NOT NULL,
                        InvoiceNumber TEXT NULL,
                        OrderNumber TEXT NULL,
                        InvoiceType INTEGER NOT NULL,
                        OrderType INTEGER NULL,
                        CustomerId TEXT NULL,
                        CashierId TEXT NOT NULL,
                        UserId TEXT NULL,
                        SaleDate TEXT NOT NULL,
                        Subtotal TEXT NOT NULL,
                        TaxAmount TEXT NOT NULL,
                        TotalDiscount TEXT NOT NULL,
                        Total TEXT NOT NULL,
                        AmountPaid TEXT NULL,
                        ChangeReturned TEXT NULL,
                        PaymentMethod INTEGER NOT NULL,
                        PaymentReference TEXT NULL,
                        Notes TEXT NULL,
                        IsVoided INTEGER NOT NULL DEFAULT 0,
                        VoidedAt TEXT NULL,
                        VoidedBy TEXT NULL,
                        VoidReason TEXT NULL,
                        CreatedAt TEXT NOT NULL,
                        FOREIGN KEY (CustomerId) REFERENCES Customers(Id) ON DELETE SET NULL
                    );

                    -- Copy data (only base columns that exist in both tables)
                    INSERT OR IGNORE INTO Sales_new (
                        Id, TransactionId, InvoiceNumber, OrderNumber, InvoiceType, OrderType,
                        CustomerId, CashierId, UserId, SaleDate, Subtotal, TaxAmount,
                        TotalDiscount, Total, AmountPaid, ChangeReturned, PaymentMethod,
                        PaymentReference, Notes, IsVoided, VoidedAt, VoidedBy, VoidReason, CreatedAt
                    )
                    SELECT
                        Id, TransactionId, InvoiceNumber, OrderNumber, InvoiceType, OrderType,
                        CustomerId, CashierId, UserId, SaleDate, Subtotal, TaxAmount,
                        TotalDiscount, Total, AmountPaid, ChangeReturned, PaymentMethod,
                        PaymentReference, Notes, IsVoided, VoidedAt, VoidedBy, VoidReason, CreatedAt
                    FROM Sales
                    WHERE (SELECT col_exists FROM _rebuild_needed) > 0;

                    -- Only drop and rename if we actually copied data
                    DROP TABLE IF EXISTS Sales;

                    ALTER TABLE Sales_new RENAME TO Sales;

                    CREATE UNIQUE INDEX IF NOT EXISTS IX_Sales_TransactionId ON Sales(TransactionId);
                    CREATE INDEX IF NOT EXISTS IX_Sales_InvoiceNumber ON Sales(InvoiceNumber);
                    CREATE INDEX IF NOT EXISTS IX_Sales_CustomerId ON Sales(CustomerId);

                    DROP TABLE IF EXISTS _rebuild_needed;

                    PRAGMA foreign_keys = ON;
                ");
            }
            else if (provider?.Contains("MySql", StringComparison.OrdinalIgnoreCase) == true)
            {
                // MySQL: Drop columns if they exist
                migrationBuilder.Sql(@"
                    SET @dbname = DATABASE();
                    SET @tablename = 'Sales';

                    -- Drop columns if they exist
                    SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'TableId');
                    SET @sqlstmt = IF(@columnExists > 0,
                        'ALTER TABLE Sales DROP COLUMN TableId',
                        'SELECT ''Column does not exist'' AS Info');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;

                    SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'TableNumber');
                    SET @sqlstmt = IF(@columnExists > 0,
                        'ALTER TABLE Sales DROP COLUMN TableNumber',
                        'SELECT ''Column does not exist'' AS Info');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;

                    SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'GuestCount');
                    SET @sqlstmt = IF(@columnExists > 0,
                        'ALTER TABLE Sales DROP COLUMN GuestCount',
                        'SELECT ''Column does not exist'' AS Info');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;

                    SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'Status');
                    SET @sqlstmt = IF(@columnExists > 0,
                        'ALTER TABLE Sales DROP COLUMN Status',
                        'SELECT ''Column does not exist'' AS Info');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;

                    SET @columnExists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'CompletedAt');
                    SET @sqlstmt = IF(@columnExists > 0,
                        'ALTER TABLE Sales DROP COLUMN CompletedAt',
                        'SELECT ''Column does not exist'' AS Info');
                    PREPARE stmt FROM @sqlstmt;
                    EXECUTE stmt;
                    DEALLOCATE PREPARE stmt;
                ");
            }
            else if (provider?.Contains("SqlServer", StringComparison.OrdinalIgnoreCase) == true)
            {
                // SQL Server: Drop default constraints before dropping columns
                migrationBuilder.Sql(@"
                    -- Drop default constraints before dropping columns
                    DECLARE @ConstraintName NVARCHAR(256);
                    DECLARE @Sql NVARCHAR(MAX);

                    -- Drop default constraint for Status column
                    SELECT @ConstraintName = dc.name
                    FROM sys.default_constraints dc
                    INNER JOIN sys.columns c ON dc.parent_column_id = c.column_id AND dc.parent_object_id = c.object_id
                    WHERE dc.parent_object_id = OBJECT_ID('Sales') AND c.name = 'Status';

                    IF @ConstraintName IS NOT NULL
                    BEGIN
                        SET @Sql = 'ALTER TABLE Sales DROP CONSTRAINT ' + QUOTENAME(@ConstraintName);
                        EXEC sp_executesql @Sql;
                    END

                    -- Now drop columns if they exist
                    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sales') AND name = 'TableId')
                        ALTER TABLE Sales DROP COLUMN TableId;

                    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sales') AND name = 'TableNumber')
                        ALTER TABLE Sales DROP COLUMN TableNumber;

                    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sales') AND name = 'GuestCount')
                        ALTER TABLE Sales DROP COLUMN GuestCount;

                    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sales') AND name = 'Status')
                        ALTER TABLE Sales DROP COLUMN Status;

                    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Sales') AND name = 'CompletedAt')
                        ALTER TABLE Sales DROP COLUMN CompletedAt;
                ");
            }
            else if (provider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true ||
                     provider?.Contains("PostgreSQL", StringComparison.OrdinalIgnoreCase) == true)
            {
                // PostgreSQL: Drop columns if they exist
                migrationBuilder.Sql(@"
                    DO $$
                    BEGIN
                        IF EXISTS (SELECT 1 FROM information_schema.columns
                                   WHERE table_name='Sales' AND column_name='TableId') THEN
                            ALTER TABLE ""Sales"" DROP COLUMN ""TableId"";
                        END IF;

                        IF EXISTS (SELECT 1 FROM information_schema.columns
                                   WHERE table_name='Sales' AND column_name='TableNumber') THEN
                            ALTER TABLE ""Sales"" DROP COLUMN ""TableNumber"";
                        END IF;

                        IF EXISTS (SELECT 1 FROM information_schema.columns
                                   WHERE table_name='Sales' AND column_name='GuestCount') THEN
                            ALTER TABLE ""Sales"" DROP COLUMN ""GuestCount"";
                        END IF;

                        IF EXISTS (SELECT 1 FROM information_schema.columns
                                   WHERE table_name='Sales' AND column_name='Status') THEN
                            ALTER TABLE ""Sales"" DROP COLUMN ""Status"";
                        END IF;

                        IF EXISTS (SELECT 1 FROM information_schema.columns
                                   WHERE table_name='Sales' AND column_name='CompletedAt') THEN
                            ALTER TABLE ""Sales"" DROP COLUMN ""CompletedAt"";
                        END IF;
                    END $$;
                ");
            }

            // ============================================================
            // STEP 3: Finally, drop Tables and Zones tables
            // ============================================================
            // Now that FK constraints and columns are removed, we can safely drop these tables

            if (provider?.Contains("MySql", StringComparison.OrdinalIgnoreCase) == true)
            {
                migrationBuilder.Sql("DROP TABLE IF EXISTS `Tables`;");
                migrationBuilder.Sql("DROP TABLE IF EXISTS `Zones`;");
            }
            else if (provider?.Contains("SqlServer", StringComparison.OrdinalIgnoreCase) == true)
            {
                migrationBuilder.Sql("IF OBJECT_ID(N'Tables', N'U') IS NOT NULL DROP TABLE Tables;");
                migrationBuilder.Sql("IF OBJECT_ID(N'Zones', N'U') IS NOT NULL DROP TABLE Zones;");
            }
            else if (provider?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true ||
                     provider?.Contains("PostgreSQL", StringComparison.OrdinalIgnoreCase) == true)
            {
                migrationBuilder.Sql("DROP TABLE IF EXISTS \"Tables\";");
                migrationBuilder.Sql("DROP TABLE IF EXISTS \"Zones\";");
            }
            else
            {
                // SQLite - already handled in table rebuild
                migrationBuilder.Sql("DROP TABLE IF EXISTS Tables;");
                migrationBuilder.Sql("DROP TABLE IF EXISTS Zones;");
            }
        }
    }
}
