# Database Migration Required

## UserActivityLog Schema Update

The UserActivityLog entity has been updated to support the audit requirements for Phase 8 (User Management).

### Changes Made:
- Renamed `ActivityType` → `Action`
- Renamed `Description` → `Details` (now nullable)
- Added `EntityType` (required, max 100 chars)
- Added `EntityId` (nullable Guid)
- Added `UserAgent` (nullable, max 500 chars)

### Migration Command:
```bash
cd Backend
dotnet ef migrations add UpdateUserActivityLogForPhase8 --context HeadOfficeDbContext
dotnet ef database update --context HeadOfficeDbContext
```

### SQL Changes (if manual migration needed):
```sql
-- For SQLite
ALTER TABLE UserActivityLogs RENAME COLUMN ActivityType TO Action;
ALTER TABLE UserActivityLogs RENAME COLUMN Description TO Details;
ALTER TABLE UserActivityLogs ADD COLUMN EntityType TEXT NOT NULL DEFAULT '';
ALTER TABLE UserActivityLogs ADD COLUMN EntityId TEXT NULL;
ALTER TABLE UserActivityLogs ADD COLUMN UserAgent TEXT NULL;
```

**Note**: This migration should be run before deploying Phase 8 changes.
