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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // SQLite doesn't support DROP COLUMN natively
            // We need to use the table rebuild pattern for SQLite
            if (migrationBuilder.IsSqlite())
            {
                // SQLite: Rebuild table without the table management columns
                migrationBuilder.Sql(@"
                    PRAGMA foreign_keys = OFF;

                    CREATE TABLE Sales_new (
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

                    INSERT INTO Sales_new (
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
                    FROM Sales;

                    DROP TABLE Sales;

                    ALTER TABLE Sales_new RENAME TO Sales;

                    CREATE UNIQUE INDEX IX_Sales_TransactionId ON Sales(TransactionId);
                    CREATE INDEX IX_Sales_InvoiceNumber ON Sales(InvoiceNumber);
                    CREATE INDEX IX_Sales_CustomerId ON Sales(CustomerId);

                    PRAGMA foreign_keys = ON;
                ");
            }
            else
            {
                // SQL Server, MySQL, PostgreSQL: Use normal DROP COLUMN
                migrationBuilder.DropColumn(
                    name: "TableId",
                    table: "Sales");

                migrationBuilder.DropColumn(
                    name: "TableNumber",
                    table: "Sales");

                migrationBuilder.DropColumn(
                    name: "GuestCount",
                    table: "Sales");

                migrationBuilder.DropColumn(
                    name: "Status",
                    table: "Sales");

                migrationBuilder.DropColumn(
                    name: "CompletedAt",
                    table: "Sales");
            }
        }
    }
}
