param(
    [Parameter(Mandatory=$true)]
    [string]$MigrationTimestamp,

    [Parameter(Mandatory=$false)]
    [string]$MigrationName = ""
)

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Multi-Provider Migration Cleanup Script" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Construct filenames
if ($MigrationName -ne "") {
    $migrationFile = "${MigrationTimestamp}_${MigrationName}.cs"
    $designerFile = "${MigrationTimestamp}_${MigrationName}.Designer.cs"
} else {
    # Try to find files with the timestamp
    $migrationFile = Get-ChildItem -Filter "${MigrationTimestamp}_*.cs" | Where-Object { $_.Name -notlike "*.Designer.cs" } | Select-Object -First 1 -ExpandProperty Name
    $designerFile = Get-ChildItem -Filter "${MigrationTimestamp}_*.Designer.cs" | Select-Object -First 1 -ExpandProperty Name

    if (-not $migrationFile) {
        Write-Host "❌ Migration file not found with timestamp: $MigrationTimestamp" -ForegroundColor Red
        Write-Host "   Please provide -MigrationName parameter" -ForegroundColor Yellow
        exit 1
    }
}

# Check if files exist
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $designerFile)) {
    Write-Host "❌ Designer file not found: $designerFile" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Processing files:" -ForegroundColor Yellow
Write-Host "   Migration: $migrationFile" -ForegroundColor Gray
Write-Host "   Designer:  $designerFile" -ForegroundColor Gray
Write-Host ""

# Step 1: Remove HasColumnType from Designer file
Write-Host "🔧 Step 1: Removing .HasColumnType() from Designer file..." -ForegroundColor Yellow
$designerContent = Get-Content $designerFile -Raw
$originalDesignerLength = $designerContent.Length

# Count occurrences before removal
$hasColumnTypeCount = ([regex]::Matches($designerContent, '\.HasColumnType\(')).Count

if ($hasColumnTypeCount -eq 0) {
    Write-Host "   ℹ️  No .HasColumnType() calls found in Designer file" -ForegroundColor Cyan
} else {
    $designerContent = $designerContent -replace '\s*\.HasColumnType\([^)]+\)', ''
    Set-Content $designerFile -Value $designerContent -NoNewline

    $removedDesigner = $originalDesignerLength - $designerContent.Length
    Write-Host "   ✅ Removed $hasColumnTypeCount .HasColumnType() calls ($removedDesigner characters)" -ForegroundColor Green
}

# Step 2: Check for explicit types in Migration file
Write-Host ""
Write-Host "🔍 Step 2: Checking Migration file for explicit types..." -ForegroundColor Yellow
$migrationContent = Get-Content $migrationFile -Raw
$typeCount = ([regex]::Matches($migrationContent, 'type:\s*"')).Count

if ($typeCount -gt 0) {
    Write-Host "   ⚠️  Found $typeCount explicit type specifications in migration file" -ForegroundColor Yellow
    Write-Host "   ⚠️  MANUAL CLEANUP REQUIRED:" -ForegroundColor Red
    Write-Host "      - Open: $migrationFile" -ForegroundColor Gray
    Write-Host "      - Remove all 'type: \"...\"' from Column definitions" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Example:" -ForegroundColor Cyan
    Write-Host "      Before: table.Column<Guid>(type: \"TEXT\", nullable: false)" -ForegroundColor Gray
    Write-Host "      After:  table.Column<Guid>(nullable: false)" -ForegroundColor Gray
} else {
    Write-Host "   ✅ No explicit type specifications found in migration file" -ForegroundColor Green
}

# Step 3: Build project
Write-Host ""
Write-Host "🔨 Step 3: Building project..." -ForegroundColor Yellow
Push-Location "../.."
$buildOutput = dotnet build 2>&1
$buildExitCode = $LASTEXITCODE
Pop-Location

if ($buildExitCode -eq 0) {
    Write-Host "   ✅ Build succeeded" -ForegroundColor Green
} else {
    Write-Host "   ❌ Build failed - check for syntax errors" -ForegroundColor Red
    Write-Host "   Run 'dotnet build' for details" -ForegroundColor Gray
}

# Step 4: Final verification
Write-Host ""
Write-Host "🔍 Step 4: Final Verification..." -ForegroundColor Yellow

# Verify Designer file
$designerVerify = ([regex]::Matches((Get-Content $designerFile -Raw), '\.HasColumnType\(')).Count
if ($designerVerify -eq 0) {
    Write-Host "   ✅ Designer file clean (0 .HasColumnType() calls)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Designer file still has $designerVerify .HasColumnType() calls" -ForegroundColor Red
}

# Verify Migration file
$migrationVerify = ([regex]::Matches((Get-Content $migrationFile -Raw), 'type:\s*"')).Count
if ($migrationVerify -eq 0) {
    Write-Host "   ✅ Migration file clean (0 explicit type: specs)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Migration file still has $migrationVerify explicit type: specs - MANUAL FIX NEEDED" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
if ($designerVerify -eq 0 -and $migrationVerify -eq 0 -and $buildExitCode -eq 0) {
    Write-Host "✅ CLEANUP COMPLETE - Migration ready for all providers!" -ForegroundColor Green
} elseif ($migrationVerify -gt 0) {
    Write-Host "⚠️  MANUAL CLEANUP REQUIRED - See instructions above" -ForegroundColor Yellow
} else {
    Write-Host "❌ CLEANUP FAILED - Check errors above" -ForegroundColor Red
}
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($designerVerify -eq 0 -and $migrationVerify -eq 0) {
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Start backend: cd ../.. && dotnet run" -ForegroundColor Gray
    Write-Host "  2. Navigate to: http://localhost:3000/head-office/migrations" -ForegroundColor Gray
    Write-Host "  3. Test on B001 (SQLite) first" -ForegroundColor Gray
    Write-Host "  4. Then apply to all branches" -ForegroundColor Gray
    Write-Host ""
}
