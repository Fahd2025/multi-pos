# Remove type annotations ONLY from the migration file Up() and Down() methods
# Leave Designer and Snapshot files untouched

$migrationFile = Get-ChildItem -Filter "*_Initial.cs" | Where-Object { $_.Name -notlike "*.Designer.cs" } | Select-Object -First 1

if ($migrationFile) {
    Write-Host "Processing: $($migrationFile.Name)" -ForegroundColor Cyan

    $content = Get-Content $migrationFile.FullName -Raw

    # Remove type: "TEXT", or type: "INTEGER", etc.
    $content = $content -replace 'type:\s*"[^"]*",\s*', ''

    # Remove , type: "TEXT" or , type: "INTEGER" at end of parameter list
    $content = $content -replace ',\s*type:\s*"[^"]*"', ''

    Set-Content $migrationFile.FullName -Value $content -NoNewline

    Write-Host "✓ Removed type annotations from $($migrationFile.Name)" -ForegroundColor Green
    Write-Host "✓ Designer and Snapshot files left unchanged" -ForegroundColor Green
} else {
    Write-Host "✗ No migration file found" -ForegroundColor Red
}
