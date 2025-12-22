-- Complete Fix for MySQL Migration History
-- This script checks existing columns and marks migrations as completed

USE MultiPoS_mysql;

-- Step 1: Check current state of Sales table
SELECT
    'Current Sales Table Columns:' as Info;
DESCRIBE Sales;

-- Step 2: Check current migration history
SELECT
    'Current Migration History:' as Info;
SELECT MigrationId, ProductVersion FROM __EFMigrationsHistory ORDER BY MigrationId;

-- Step 3: Check if table management columns exist
SELECT
    'Table Management Columns Status:' as Info,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'MultiPoS_mysql'
    AND TABLE_NAME = 'Sales'
    AND COLUMN_NAME IN ('TableId', 'TableNumber', 'GuestCount', 'Status', 'CompletedAt')
ORDER BY ORDINAL_POSITION;

-- Step 4: If the columns above are shown (5 rows), run these INSERT statements:

-- Mark UpdateDeliveryStatusEnum as completed (if needed)
INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
SELECT '20251217000000_UpdateDeliveryStatusEnum', '8.0.0'
WHERE NOT EXISTS (
    SELECT 1 FROM __EFMigrationsHistory
    WHERE MigrationId = '20251217000000_UpdateDeliveryStatusEnum'
);

-- Mark AddTableManagementColumns as completed (if columns exist)
INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
SELECT '20251221180927_AddTableManagementColumns', '8.0.0'
WHERE NOT EXISTS (
    SELECT 1 FROM __EFMigrationsHistory
    WHERE MigrationId = '20251221180927_AddTableManagementColumns'
)
AND EXISTS (
    -- Only insert if TableId column exists
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'MultiPoS_mysql'
        AND TABLE_NAME = 'Sales'
        AND COLUMN_NAME = 'TableId'
);

-- Step 5: Verify the fix
SELECT
    'Updated Migration History:' as Info;
SELECT MigrationId, ProductVersion FROM __EFMigrationsHistory ORDER BY MigrationId;

-- Step 6: Check branch migration state table
UPDATE BranchMigrationStates
SET
    Status = 0, -- Completed
    RetryCount = 0,
    LastMigrationApplied = '20251221180927_AddTableManagementColumns',
    ErrorDetails = NULL,
    UpdatedAt = UTC_TIMESTAMP(),
    LastAttemptAt = UTC_TIMESTAMP()
WHERE BranchId = (SELECT Id FROM Branches WHERE Code = 'mysql' LIMIT 1);

SELECT
    'Updated Branch Migration State:' as Info,
    b.Code as BranchCode,
    bms.Status,
    bms.LastMigrationApplied,
    bms.RetryCount,
    bms.ErrorDetails
FROM BranchMigrationStates bms
INNER JOIN Branches b ON b.Id = bms.BranchId
WHERE b.Code = 'mysql';
