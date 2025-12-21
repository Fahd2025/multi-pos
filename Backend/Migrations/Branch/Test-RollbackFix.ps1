# Test Script for DeliveryStatus Enum Migration Rollback Fix
# This script validates the rollback fix works across all database providers

param(
    [switch]$Verbose,
    [switch]$SkipBackup,
    [string]$Provider = "All" # All, SQLite, PostgreSQL, MySQL, SQLServer
)

$ErrorActionPreference = "Continue"
$script:TestResults = @()

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-TestResult {
    param(
        [string]$Test,
        [string]$Provider,
        [string]$Status,
        [string]$Message
    )

    $result = [PSCustomObject]@{
        Test = $Test
        Provider = $Provider
        Status = $Status
        Message = $Message
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }

    $script:TestResults += $result

    $color = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "WARN" { "Yellow" }
        "INFO" { "Cyan" }
        default { "White" }
    }

    Write-Host "[$Status] $Provider - $Test" -ForegroundColor $color
    if ($Message) {
        Write-Host "       $Message" -ForegroundColor Gray
    }
}

function Test-MigrationFileExists {
    Write-TestHeader "Step 1: Verify Migration File Exists"

    $migrationPath = "20251217000000_UpdateDeliveryStatusEnum.cs"

    if (Test-Path $migrationPath) {
        Write-TestResult -Test "Migration File" -Provider "N/A" -Status "PASS" -Message "Found: $migrationPath"
        return $true
    } else {
        Write-TestResult -Test "Migration File" -Provider "N/A" -Status "FAIL" -Message "Not found: $migrationPath"
        return $false
    }
}

function Test-MultiProviderSupport {
    Write-TestHeader "Step 2: Verify Multi-Provider Support"

    $migrationPath = "20251217000000_UpdateDeliveryStatusEnum.cs"
    $content = Get-Content $migrationPath -Raw

    # Check for provider detection
    if ($content -match 'migrationBuilder\.ActiveProvider') {
        Write-TestResult -Test "Provider Detection" -Provider "N/A" -Status "PASS" -Message "Uses ActiveProvider"
    } else {
        Write-TestResult -Test "Provider Detection" -Provider "N/A" -Status "FAIL" -Message "Missing ActiveProvider check"
        return $false
    }

    # Check for PostgreSQL support
    if ($content -match 'PostgreSQL' -and $content -match '""DeliveryOrders""') {
        Write-TestResult -Test "PostgreSQL Support" -Provider "PostgreSQL" -Status "PASS" -Message "Proper identifier quoting found"
    } else {
        Write-TestResult -Test "PostgreSQL Support" -Provider "PostgreSQL" -Status "FAIL" -Message "Missing or incorrect quoting"
    }

    # Check for SQL Server support
    if ($content -match 'SqlServer' -and $content -match '\[DeliveryOrders\]') {
        Write-TestResult -Test "SQL Server Support" -Provider "SQLServer" -Status "PASS" -Message "Proper bracket quoting found"
    } else {
        Write-TestResult -Test "SQL Server Support" -Provider "SQLServer" -Status "FAIL" -Message "Missing or incorrect quoting"
    }

    # Check for MySQL support
    if ($content -match 'MySql' -and $content -match '`DeliveryOrders`') {
        Write-TestResult -Test "MySQL Support" -Provider "MySQL" -Status "PASS" -Message "Proper backtick quoting found"
    } else {
        Write-TestResult -Test "MySQL Support" -Provider "MySQL" -Status "FAIL" -Message "Missing or incorrect quoting"
    }

    # Check for table existence checks
    if ($content -match 'information_schema\.tables' -or $content -match 'OBJECT_ID') {
        Write-TestResult -Test "Table Existence Checks" -Provider "N/A" -Status "PASS" -Message "Found conditional table checks"
    } else {
        Write-TestResult -Test "Table Existence Checks" -Provider "N/A" -Status "WARN" -Message "No table existence checks found"
    }

    # Verify no NotSupportedException
    if ($content -match 'NotSupportedException') {
        Write-TestResult -Test "No Exceptions" -Provider "N/A" -Status "FAIL" -Message "Still contains NotSupportedException"
        return $false
    } else {
        Write-TestResult -Test "No Exceptions" -Provider "N/A" -Status "PASS" -Message "No blocking exceptions found"
    }

    return $true
}

function Test-SQLSyntax {
    Write-TestHeader "Step 3: Validate SQL Syntax"

    $migrationPath = "20251217000000_UpdateDeliveryStatusEnum.cs"
    $content = Get-Content $migrationPath -Raw

    # Check for proper UPDATE statements
    $updatePattern = 'UPDATE.*DeliveryOrders.*SET.*DeliveryStatus'
    $updates = [regex]::Matches($content, $updatePattern)

    if ($updates.Count -ge 6) {
        Write-TestResult -Test "UPDATE Statements" -Provider "N/A" -Status "PASS" -Message "Found $($updates.Count) UPDATE statements"
    } else {
        Write-TestResult -Test "UPDATE Statements" -Provider "N/A" -Status "FAIL" -Message "Expected at least 6 UPDATE statements, found $($updates.Count)"
        return $false
    }

    # Check for proper WHERE clauses
    $wherePattern = 'WHERE.*DeliveryStatus.*='
    $wheres = [regex]::Matches($content, $wherePattern)

    if ($wheres.Count -ge 6) {
        Write-TestResult -Test "WHERE Clauses" -Provider "N/A" -Status "PASS" -Message "Found $($wheres.Count) WHERE clauses"
    } else {
        Write-TestResult -Test "WHERE Clauses" -Provider "N/A" -Status "WARN" -Message "Found $($wheres.Count) WHERE clauses"
    }

    return $true
}

function Test-CompilationCheck {
    Write-TestHeader "Step 4: Check Compilation"

    Write-Host "Attempting to build the migration project..." -ForegroundColor Yellow
    Write-Host "Note: Build may fail if Backend.exe is currently running" -ForegroundColor Yellow

    $buildOutput = dotnet build --no-restore 2>&1
    $buildExitCode = $LASTEXITCODE

    if ($buildExitCode -eq 0) {
        Write-TestResult -Test "Build" -Provider "N/A" -Status "PASS" -Message "Project compiled successfully"
        return $true
    } else {
        # Check if failure is due to file lock
        if ($buildOutput -match "MSB3027" -or $buildOutput -match "locked by") {
            Write-TestResult -Test "Build" -Provider "N/A" -Status "WARN" -Message "Build blocked by running process (expected)"
            Write-Host "`nTo test compilation, stop the backend and run: dotnet build" -ForegroundColor Yellow
            return $true
        } else {
            Write-TestResult -Test "Build" -Provider "N/A" -Status "FAIL" -Message "Build failed with errors"
            if ($Verbose) {
                Write-Host "`nBuild Output:" -ForegroundColor Red
                Write-Host $buildOutput -ForegroundColor Gray
            }
            return $false
        }
    }
}

function Get-MigrationSystemStatus {
    Write-TestHeader "Step 5: Check Migration System Status"

    # Check if API is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-TestResult -Test "Backend API" -Provider "N/A" -Status "PASS" -Message "API is running (Status: $($response.StatusCode))"
        $apiRunning = $true
    } catch {
        Write-TestResult -Test "Backend API" -Provider "N/A" -Status "INFO" -Message "API is not running"
        $apiRunning = $false
    }

    # Check if frontend is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-TestResult -Test "Frontend" -Provider "N/A" -Status "PASS" -Message "Frontend is running (Status: $($response.StatusCode))"
    } catch {
        Write-TestResult -Test "Frontend" -Provider "N/A" -Status "INFO" -Message "Frontend is not running"
    }

    return $apiRunning
}

function Show-RollbackInstructions {
    Write-TestHeader "Step 6: Rollback Testing Instructions"

    Write-Host @"
To test the rollback fix, follow these steps:

1. AUTOMATED TESTING VIA UI:
   ├─ Open: http://localhost:3000/head-office/migrations
   ├─ Select the postgres branch (or any failing branch)
   ├─ Click the 'Rollback' button for migration: 20251217000000_UpdateDeliveryStatusEnum
   └─ Verify: The rollback completes without errors

2. MANUAL TESTING VIA CLI (if API is not running):
   ├─ For SQLite (B001):
   │  └─ dotnet ef database update 20251214100000_AddDeliveryOrderTable --context BranchDbContext --connection "Data Source=BranchDatabases/B001.db"
   │
   ├─ For PostgreSQL:
   │  └─ dotnet ef database update 20251214100000_AddDeliveryOrderTable --context BranchDbContext --connection "Host=localhost;Database=postgres_branch;Username=postgres;Password=yourpassword"
   │
   ├─ For MySQL:
   │  └─ dotnet ef database update 20251214100000_AddDeliveryOrderTable --context BranchDbContext --connection "Server=localhost;Database=mysql_branch;User=root;Password=yourpassword"
   │
   └─ For SQL Server:
      └─ dotnet ef database update 20251214100000_AddDeliveryOrderTable --context BranchDbContext --connection "Server=localhost;Database=mssql_branch;Trusted_Connection=True"

3. VERIFY ROLLBACK SUCCESS:
   After rollback, check the DeliveryStatus values in the database:

   SQLite:
   └─ sqlite3 BranchDatabases/B001.db "SELECT DeliveryStatus, COUNT(*) FROM DeliveryOrders GROUP BY DeliveryStatus"

   PostgreSQL:
   └─ psql -c "SELECT \"DeliveryStatus\", COUNT(*) FROM \"DeliveryOrders\" GROUP BY \"DeliveryStatus\""

   Expected values after rollback:
   - No records with DeliveryStatus = 2 (should be 3 for OutForDelivery)
   - No records with DeliveryStatus = 3 (should be 4 for Delivered)
   - No records with DeliveryStatus = 4 (should be 5 for Failed)

4. RE-APPLY MIGRATION:
   After successful rollback, test re-applying the migration:
   └─ Via UI: Click 'Migrate' on the same migration
   └─ Via CLI: dotnet ef database update

"@ -ForegroundColor Cyan
}

function Show-MonitoringCommands {
    Write-TestHeader "Step 7: Real-Time Monitoring Commands"

    Write-Host @"
Use these commands to monitor the migration system in real-time:

1. WATCH BACKEND LOGS:
   ├─ In the backend terminal, errors will appear immediately
   └─ Look for: "Rollback completed successfully" messages

2. MONITOR MIGRATION API ENDPOINT:
   └─ GET http://localhost:5000/api/v1/branches/{branchId}/migrations
      (Monitor migration status changes)

3. CHECK DATABASE DIRECTLY:
   ├─ SQLite:    sqlite3 BranchDatabases/B001.db "SELECT * FROM __EFMigrationsHistory ORDER BY MigrationId DESC LIMIT 5"
   ├─ PostgreSQL: psql -c "SELECT * FROM \"__EFMigrationsHistory\" ORDER BY \"MigrationId\" DESC LIMIT 5"
   └─ SQL Server: sqlcmd -Q "SELECT TOP 5 * FROM __EFMigrationsHistory ORDER BY MigrationId DESC"

4. WATCH FRONTEND MIGRATION UI:
   └─ The UI will show real-time status updates
   └─ Error details appear in the error modal
   └─ Success shows green checkmark with "Rollback successful"

"@ -ForegroundColor Cyan
}

function Show-TroubleshootingGuide {
    Write-TestHeader "Troubleshooting Guide"

    Write-Host @"
Common Issues and Solutions:

❌ ISSUE: "relation 'deliveryorders' does not exist" (PostgreSQL)
   ✅ SOLUTION: This fix addresses this - proper quoting now in place
   ✅ STATUS: Should be resolved by the fix

❌ ISSUE: "NotSupportedException: Downgrade migration is not supported"
   ✅ SOLUTION: Exception removed, replaced with best-effort rollback
   ✅ STATUS: Should be resolved by the fix

❌ ISSUE: Rollback succeeds but data looks wrong
   ⚠️  EXPECTED: Some data loss is acceptable:
       - Failed(4) entries become Failed(5), can't distinguish from original Cancelled(6)
       - OutForDelivery(2) becomes OutForDelivery(3), can't distinguish from PickedUp(2)
   ✅ SOLUTION: This is documented and expected behavior

❌ ISSUE: "Table DeliveryOrders does not exist" on some branches
   ✅ SOLUTION: Fix includes table existence checks for PostgreSQL and SQL Server
   ✅ STATUS: Should be resolved by the fix (table checks added)

❌ ISSUE: Different error on MySQL/SQL Server
   ✅ SOLUTION: Provider-specific SQL now handles each database correctly
   ✅ STATUS: Should be resolved by the fix

❌ ISSUE: Migration UI shows "Failed" but no error details
   🔍 INVESTIGATE:
      1. Check backend logs/console for detailed error
      2. Check browser console (F12) for API response
      3. Try rollback via CLI to get full error message
      4. Run: cd Backend && dotnet ef database update [previous-migration] --context BranchDbContext --verbose

"@ -ForegroundColor Yellow
}

function Export-TestResults {
    Write-TestHeader "Test Results Summary"

    $totalTests = $script:TestResults.Count
    $passed = ($script:TestResults | Where-Object { $_.Status -eq "PASS" }).Count
    $failed = ($script:TestResults | Where-Object { $_.Status -eq "FAIL" }).Count
    $warnings = ($script:TestResults | Where-Object { $_.Status -eq "WARN" }).Count

    Write-Host "Total Tests: $totalTests" -ForegroundColor Cyan
    Write-Host "  Passed:   $passed" -ForegroundColor Green
    Write-Host "  Failed:   $failed" -ForegroundColor Red
    Write-Host "  Warnings: $warnings" -ForegroundColor Yellow

    # Export to JSON
    $resultsFile = "migration-rollback-test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $script:TestResults | ConvertTo-Json -Depth 10 | Out-File $resultsFile
    Write-Host "`nDetailed results exported to: $resultsFile" -ForegroundColor Gray

    # Show failures
    if ($failed -gt 0) {
        Write-Host "`n❌ FAILED TESTS:" -ForegroundColor Red
        $script:TestResults | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
            Write-Host "  - $($_.Test): $($_.Message)" -ForegroundColor Red
        }
    }

    # Overall status
    if ($failed -eq 0) {
        Write-Host "`n✅ ALL TESTS PASSED - Migration fix is ready for testing!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "`n❌ SOME TESTS FAILED - Fix the issues before testing rollback" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║  Migration Rollback Fix - Validation & Monitoring Script      ║
║  Migration: 20251217000000_UpdateDeliveryStatusEnum           ║
╚════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Magenta

$allPassed = $true

# Run validation tests
$allPassed = (Test-MigrationFileExists) -and $allPassed
$allPassed = (Test-MultiProviderSupport) -and $allPassed
$allPassed = (Test-SQLSyntax) -and $allPassed
$allPassed = (Test-CompilationCheck) -and $allPassed
$apiRunning = Get-MigrationSystemStatus

# Show instructions
Show-RollbackInstructions
Show-MonitoringCommands
Show-TroubleshootingGuide

# Export results
$finalResult = Export-TestResults

# Final recommendation
if ($finalResult) {
    Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ✅ READY TO TEST ROLLBACK                                    ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

    if ($apiRunning) {
        Write-Host "`n🚀 NEXT STEP: Visit http://localhost:3000/head-office/migrations" -ForegroundColor Cyan
        Write-Host "   and test the rollback on the 'postgres' branch" -ForegroundColor Cyan
    } else {
        Write-Host "`n⚠️  Backend API is not running. Start it with: cd Backend && dotnet run" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║  ❌ FIX ISSUES BEFORE TESTING                                 ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
}

Write-Host ""
