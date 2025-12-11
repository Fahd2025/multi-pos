# Remove ALL type annotations from ALL migration, designer, and snapshot files
# This script removes .HasColumnType("...") calls and type: annotations
# Usage: Run this script after generating any new migration

Write-Host "Cleaning all migration files..." -ForegroundColor Cyan
Write-Host ""

# Get all migration files (excluding backups)
$migrationFiles = Get-ChildItem -Filter "*_*.cs" | Where-Object {
    $_.Name -notlike "*.Designer.cs" -and
    $_.Name -notlike "*Backup*"
}

$designerFiles = Get-ChildItem -Filter "*_*.Designer.cs" | Where-Object {
    $_.Name -notlike "*Backup*"
}

$snapshotFile = "BranchDbContextModelSnapshot.cs"

# Combine all files to process
$allFiles = @()
$allFiles += $migrationFiles
$allFiles += $designerFiles
if (Test-Path $snapshotFile) {
    $allFiles += Get-Item $snapshotFile
}

$cleanedCount = 0

foreach ($file in $allFiles) {
    if ($file -and (Test-Path $file)) {
        Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow

        $content = Get-Content $file.FullName -Raw

        # Count type annotations before cleaning
        $typeCount = ([regex]::Matches($content, 'type:\s*"[^"]*"')).Count
        $hasColumnTypeCount = ([regex]::Matches($content, '\.HasColumnType\("[^"]*"\)')).Count

        if ($typeCount -eq 0 -and $hasColumnTypeCount -eq 0) {
            Write-Host "  → Already clean (no type annotations found)" -ForegroundColor Gray
            continue
        }

        # Remove type: "TEXT", or type: "INTEGER", from migration Up/Down methods
        $content = $content -replace 'type:\s*"[^"]*",\s*', ''
        $content = $content -replace ',\s*type:\s*"[^"]*"', ''

        # Remove .HasColumnType("...") from fluent API chains (Designer/Snapshot)
        $content = $content -replace '\.HasColumnType\("[^"]*"\)\s*', ''

        Set-Content $file.FullName -Value $content -NoNewline

        Write-Host "  ✓ Removed $typeCount type: annotations and $hasColumnTypeCount HasColumnType() calls" -ForegroundColor Green
        $cleanedCount++
    }
}

Write-Host ""
if ($cleanedCount -gt 0) {
    Write-Host "Successfully cleaned $cleanedCount file(s)!" -ForegroundColor Green
    Write-Host "Now run: dotnet build" -ForegroundColor Cyan
} else {
    Write-Host "All files are already clean!" -ForegroundColor Green
}
