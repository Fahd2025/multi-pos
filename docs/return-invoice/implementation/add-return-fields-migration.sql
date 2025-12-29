-- =========================================================
-- Return Invoice System - Database Migration Script
-- =========================================================
-- Version: 1.0
-- Date: 2025-12-29
-- Description: Adds return management fields to Sales and SaleLineItem tables
-- =========================================================

-- =========================================================
-- STEP 1: Add Return Fields to Sales Table
-- =========================================================

-- Add IsReturn flag
ALTER TABLE Sales
ADD IsReturn BIT NOT NULL DEFAULT 0;

-- Add ReturnDate
ALTER TABLE Sales
ADD ReturnDate DATETIME2 NULL;

-- Add ReturnReason
ALTER TABLE Sales
ADD ReturnReason NVARCHAR(100) NULL;

-- Add ReturnNotes
ALTER TABLE Sales
ADD ReturnNotes NVARCHAR(500) NULL;

-- Add OriginalSaleId (foreign key to Sales table - self-referencing)
ALTER TABLE Sales
ADD OriginalSaleId UNIQUEIDENTIFIER NULL;

-- Add ReturnApprovedBy (foreign key to User who approved the return)
ALTER TABLE Sales
ADD ReturnApprovedBy UNIQUEIDENTIFIER NULL;

-- =========================================================
-- STEP 2: Add Foreign Key Constraints
-- =========================================================

-- Add foreign key constraint for OriginalSaleId (self-referencing)
ALTER TABLE Sales
ADD CONSTRAINT FK_Sales_OriginalSale
    FOREIGN KEY (OriginalSaleId)
    REFERENCES Sales(Id)
    ON DELETE NO ACTION; -- Prevent cascade delete

-- =========================================================
-- STEP 3: Add Indexes for Performance
-- =========================================================

-- Index on IsReturn for filtering return invoices
CREATE NONCLUSTERED INDEX IX_Sales_IsReturn
ON Sales(IsReturn)
INCLUDE (ReturnDate, OriginalSaleId);

-- Index on OriginalSaleId for finding returns for a specific sale
CREATE NONCLUSTERED INDEX IX_Sales_OriginalSaleId
ON Sales(OriginalSaleId)
WHERE OriginalSaleId IS NOT NULL;

-- =========================================================
-- STEP 4: Update Sales Status Enum
-- =========================================================

-- Note: Status field already exists as NVARCHAR(20)
-- Supported values: 'open', 'completed', 'cancelled', 'returned', 'partially_returned'
-- No schema change needed, but update CHECK constraint if it exists

-- Drop existing CHECK constraint if it exists
IF EXISTS (
    SELECT * FROM sys.check_constraints
    WHERE name = 'CK_Sales_Status'
)
BEGIN
    ALTER TABLE Sales DROP CONSTRAINT CK_Sales_Status;
END

-- Add updated CHECK constraint
ALTER TABLE Sales
ADD CONSTRAINT CK_Sales_Status
CHECK (Status IN ('open', 'completed', 'cancelled', 'returned', 'partially_returned'));

-- =========================================================
-- STEP 5: Add Return Fields to SaleLineItem Table
-- =========================================================

-- Add ReturnQuantity field
ALTER TABLE SaleLineItem
ADD ReturnQuantity INT NOT NULL DEFAULT 0;

-- Add ItemStatus field
ALTER TABLE SaleLineItem
ADD ItemStatus NVARCHAR(50) NOT NULL DEFAULT 'ordered';

-- =========================================================
-- STEP 6: Add Constraints and Indexes for SaleLineItem
-- =========================================================

-- Add CHECK constraint for ReturnQuantity (cannot be negative)
ALTER TABLE SaleLineItem
ADD CONSTRAINT CK_SaleLineItem_ReturnQuantity
CHECK (ReturnQuantity >= 0);

-- Add CHECK constraint for ItemStatus
ALTER TABLE SaleLineItem
ADD CONSTRAINT CK_SaleLineItem_ItemStatus
CHECK (ItemStatus IN ('ordered', 'completed', 'returned', 'partially_returned'));

-- Add index on ItemStatus for filtering
CREATE NONCLUSTERED INDEX IX_SaleLineItem_ItemStatus
ON SaleLineItem(ItemStatus);

-- =========================================================
-- STEP 7: Data Migration (if needed)
-- =========================================================

-- Update existing sales to have default IsReturn = 0 (already set by DEFAULT)
-- Update existing line items to have default ReturnQuantity = 0 and ItemStatus = 'ordered'
-- (Already set by DEFAULT values)

-- =========================================================
-- VERIFICATION QUERIES
-- =========================================================

-- Verify Sales table schema
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Sales'
    AND COLUMN_NAME IN ('IsReturn', 'ReturnDate', 'ReturnReason', 'ReturnNotes', 'OriginalSaleId', 'ReturnApprovedBy')
ORDER BY ORDINAL_POSITION;

-- Verify SaleLineItem table schema
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'SaleLineItem'
    AND COLUMN_NAME IN ('ReturnQuantity', 'ItemStatus')
ORDER BY ORDINAL_POSITION;

-- Verify foreign keys
SELECT
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTableName,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ReferencedColumnName
FROM sys.foreign_keys AS fk
INNER JOIN sys.foreign_key_columns AS fkc
    ON fk.object_id = fkc.constraint_object_id
WHERE fk.name = 'FK_Sales_OriginalSale';

-- Verify indexes
SELECT
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_unique AS IsUnique,
    OBJECT_NAME(i.object_id) AS TableName,
    COL_NAME(ic.object_id, ic.column_id) AS ColumnName
FROM sys.indexes AS i
INNER JOIN sys.index_columns AS ic
    ON i.object_id = ic.object_id AND i.index_id = ic.index_id
WHERE i.name IN ('IX_Sales_IsReturn', 'IX_Sales_OriginalSaleId', 'IX_SaleLineItem_ItemStatus')
ORDER BY i.name, ic.key_ordinal;

-- =========================================================
-- ROLLBACK SCRIPT (if needed)
-- =========================================================

/*
-- WARNING: This will remove all return-related data!
-- Only run this if you need to completely rollback the migration

-- Drop indexes
DROP INDEX IF EXISTS IX_SaleLineItem_ItemStatus ON SaleLineItem;
DROP INDEX IF EXISTS IX_Sales_OriginalSaleId ON Sales;
DROP INDEX IF EXISTS IX_Sales_IsReturn ON Sales;

-- Drop constraints
ALTER TABLE SaleLineItem DROP CONSTRAINT IF EXISTS CK_SaleLineItem_ItemStatus;
ALTER TABLE SaleLineItem DROP CONSTRAINT IF EXISTS CK_SaleLineItem_ReturnQuantity;
ALTER TABLE Sales DROP CONSTRAINT IF EXISTS CK_Sales_Status;
ALTER TABLE Sales DROP CONSTRAINT IF EXISTS FK_Sales_OriginalSale;

-- Drop columns from SaleLineItem
ALTER TABLE SaleLineItem DROP COLUMN IF EXISTS ItemStatus;
ALTER TABLE SaleLineItem DROP COLUMN IF EXISTS ReturnQuantity;

-- Drop columns from Sales
ALTER TABLE Sales DROP COLUMN IF EXISTS ReturnApprovedBy;
ALTER TABLE Sales DROP COLUMN IF EXISTS OriginalSaleId;
ALTER TABLE Sales DROP COLUMN IF EXISTS ReturnNotes;
ALTER TABLE Sales DROP COLUMN IF EXISTS ReturnReason;
ALTER TABLE Sales DROP COLUMN IF EXISTS ReturnDate;
ALTER TABLE Sales DROP COLUMN IF EXISTS IsReturn;

-- Recreate original Status constraint (if it had one)
ALTER TABLE Sales
ADD CONSTRAINT CK_Sales_Status
CHECK (Status IN ('open', 'completed', 'cancelled'));
*/

-- =========================================================
-- END OF MIGRATION SCRIPT
-- =========================================================
