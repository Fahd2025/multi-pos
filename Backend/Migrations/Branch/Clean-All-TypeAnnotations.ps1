# Remove ALL type annotations from migration, designer, and snapshot files
# This script removes .HasColumnType("...") calls while preserving fluent API chains

Write-Host "Cleaning all migration files..." -ForegroundColor Cyan

$files = @(
    (Get-ChildItem -Filter "*_Initial.cs" | Where-Object { $_.Name -notlike "*.Designer.cs" } | Select-Object -First 1),
    (Get-ChildItem -Filter "*_Initial.Designer.cs" | Select-Object -First 1),
    "BranchDbContextModelSnapshot.cs"
)

foreach ($fileName in $files) {
    if ($fileName -and (Test-Path $fileName)) {
        Write-Host "Processing: $fileName" -ForegroundColor Yellow

        $content = Get-Content $fileName -Raw

        # Remove type: "TEXT", or type: "INTEGER", from migration Up/Down methods
        $content = $content -replace 'type:\s*"[^"]*",\s*', ''
        $content = $content -replace ',\s*type:\s*"[^"]*"', ''

        # Remove .HasColumnType("...") from fluent API chains (Designer/Snapshot)
        # This regex removes the entire method call including its argument
        $content = $content -replace '\.HasColumnType\("[^"]*"\)\s*', ''

        Set-Content $fileName -Value $content -NoNewline

        Write-Host "✓ Cleaned $fileName" -ForegroundColor Green
    }
}

Write-Host "`nAll migration files cleaned successfully!" -ForegroundColor Green
Write-Host "Now run: dotnet clean && dotnet build" -ForegroundColor Cyan
