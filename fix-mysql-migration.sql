-- Fix MySQL Migration Status
-- This script marks the AddTableManagementColumns migration as completed for MySQL
-- Run this script directly on the MultiPoS_mysql database

-- First, check if the columns exist
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM
    INFORMATION_SCHEMA.COLUMNS
WHERE
    TABLE_SCHEMA = 'MultiPoS_mysql'
    AND TABLE_NAME = 'Sales'
    AND COLUMN_NAME IN ('TableId', 'TableNumber', 'GuestCount', 'Status', 'CompletedAt');

-- If all 5 columns are returned above, run these commands:

-- Insert the migration record into __EFMigrationsHistory
INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20251221180927_AddTableManagementColumns', '8.0.0')
ON DUPLICATE KEY UPDATE ProductVersion = '8.0.0';

-- Verify the migration was added
SELECT * FROM `__EFMigrationsHistory` WHERE MigrationId = '20251221180927_AddTableManagementColumns';
