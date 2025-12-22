-- Create Zones table if it doesn't exist
CREATE TABLE IF NOT EXISTS Zones (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL CHECK(length(Name) <= 50),
    Description TEXT CHECK(Description IS NULL OR length(Description) <= 200),
    DisplayOrder INTEGER NOT NULL,
    IsActive INTEGER NOT NULL DEFAULT 1,
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL,
    CreatedBy TEXT NOT NULL CHECK(length(CreatedBy) <= 100),
    UpdatedBy TEXT NOT NULL CHECK(length(UpdatedBy) <= 100)
);

CREATE INDEX IF NOT EXISTS IX_Zones_DisplayOrder ON Zones(DisplayOrder);
CREATE INDEX IF NOT EXISTS IX_Zones_IsActive ON Zones(IsActive);

-- Create Tables table if it doesn't exist
CREATE TABLE IF NOT EXISTS Tables (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Number INTEGER NOT NULL UNIQUE,
    Name TEXT NOT NULL CHECK(length(Name) <= 100),
    Capacity INTEGER NOT NULL,
    PositionX REAL NOT NULL,
    PositionY REAL NOT NULL,
    Width REAL NOT NULL DEFAULT 10,
    Height REAL NOT NULL DEFAULT 10,
    Rotation INTEGER NOT NULL DEFAULT 0,
    Shape TEXT NOT NULL DEFAULT 'Rectangle' CHECK(length(Shape) <= 20),
    IsActive INTEGER NOT NULL DEFAULT 1,
    ZoneId INTEGER,
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL,
    DeletedAt TEXT,
    CreatedBy TEXT NOT NULL CHECK(length(CreatedBy) <= 100),
    UpdatedBy TEXT NOT NULL CHECK(length(UpdatedBy) <= 100),
    FOREIGN KEY (ZoneId) REFERENCES Zones(Id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS IX_Tables_Number ON Tables(Number);
CREATE INDEX IF NOT EXISTS IX_Tables_ZoneId ON Tables(ZoneId);
CREATE INDEX IF NOT EXISTS IX_Tables_IsActive ON Tables(IsActive);

-- Add columns to Sales table if they don't exist
-- SQLite doesn't have a nice way to check if a column exists, so we'll use a workaround
PRAGMA foreign_keys = OFF;

-- We need to check if the columns exist first
-- If TableId column doesn't exist, we'll get an error, which we can catch in code
-- For now, let's try to add them one by one

-- Note: These ALTER TABLE commands will fail if the columns already exist
-- That's okay - the migration system should handle this

-- Add TableId column
ALTER TABLE Sales ADD COLUMN TableId INTEGER;

-- Add TableNumber column
ALTER TABLE Sales ADD COLUMN TableNumber INTEGER;

-- Add GuestCount column
ALTER TABLE Sales ADD COLUMN GuestCount INTEGER;

-- Add Status column
ALTER TABLE Sales ADD COLUMN Status TEXT NOT NULL DEFAULT 'Completed';

-- Add CompletedAt column
ALTER TABLE Sales ADD COLUMN CompletedAt TEXT;

-- Create indexes on Sales
CREATE INDEX IF NOT EXISTS IX_Sales_TableId ON Sales(TableId);
CREATE INDEX IF NOT EXISTS IX_Sales_Status ON Sales(Status);

PRAGMA foreign_keys = ON;
