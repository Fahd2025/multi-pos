# Quick fix to remove the bad migration
# This uses the force-remove endpoint, not rollback

# Try HTTPS first, then fallback to HTTP
$BaseUrls = @(
    "https://localhost:7001",
    "http://localhost:5062",
    "http://localhost:5000"
)
$MigrationId = "20251217000000_UpdateDeliveryStatusEnum"
$BaseUrl = $null

# Disable SSL certificate validation for self-signed certificates
add-type @"
    using System.Net;
    using System.Security.Cryptography.X509Certificates;
    public class TrustAllCertsPolicy : ICertificatePolicy {
        public bool CheckValidationResult(
            ServicePoint sPoint, X509Certificate cert,
            WebRequest wRequest, int certProb) {
            return true;
        }
    }
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

Write-Host "=" -NoNewline
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Quick Fix: Remove Bad Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find the correct backend URL
Write-Host "[1/4] Finding backend..." -ForegroundColor Yellow
$loginBody = '{"username":"admin","password":"123","preferredLanguage":"en"}'

foreach ($url in $BaseUrls) {
    try {
        Write-Host "  Trying $url..." -ForegroundColor Gray
        $testResponse = Invoke-WebRequest -Uri "$url/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        $BaseUrl = $url
        Write-Host "  ✓ Backend found at $BaseUrl" -ForegroundColor Green
        break
    } catch {
        Write-Host "  ✗ Not available" -ForegroundColor DarkGray
    }
}

if (-not $BaseUrl) {
    Write-Host "  ✗ Backend not found! Make sure it's running." -ForegroundColor Red
    Write-Host ""
    Write-Host "Start the backend with: dotnet run" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Login
Write-Host "[2/4] Logging in..." -ForegroundColor Yellow

try {
    Write-Host "  URL: $BaseUrl/api/v1/auth/login" -ForegroundColor DarkGray
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/v1/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -UseBasicParsing

    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor DarkGray

    $tokenData = $response.Content | ConvertFrom-Json

    # Token is inside data object
    $token = $tokenData.data.accessToken

    if (-not $token) {
        Write-Host "  ✗ Login failed!" -ForegroundColor Red
        Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
        exit 1
    }

    Write-Host "  ✓ Login successful" -ForegroundColor Green
    Write-Host ""

    # Force remove migration
    Write-Host "[3/4] Removing migration from all branches..." -ForegroundColor Yellow

    $headers = @{
        "Authorization" = "Bearer $token"
    }

    $response = Invoke-WebRequest -Uri "$BaseUrl/api/v1/migrations/branches/force-remove-all/$MigrationId" `
        -Method DELETE `
        -Headers $headers `
        -UseBasicParsing

    $result = $response.Content | ConvertFrom-Json

    if ($result.success) {
        Write-Host "  ✓ Migration removed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Results:" -ForegroundColor Cyan
        Write-Host "    - Branches Processed: $($result.branchesProcessed)" -ForegroundColor White
        Write-Host "    - Succeeded: $($result.branchesSucceeded)" -ForegroundColor Green
        Write-Host "    - Failed: $($result.branchesFailed)" -ForegroundColor $(if ($result.branchesFailed -gt 0) { "Red" } else { "Gray" })

        if ($result.appliedMigrations) {
            Write-Host ""
            Write-Host "  Changes applied:" -ForegroundColor Cyan
            foreach ($change in $result.appliedMigrations) {
                Write-Host "    ✓ $change" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "  ✗ Failed: $($result.errorMessage)" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "[4/4] Verifying..." -ForegroundColor Yellow

    # Check status
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/v1/migrations/branches/status" `
        -Headers $headers `
        -UseBasicParsing

    $states = $response.Content | ConvertFrom-Json

    Write-Host "  Branch Status:" -ForegroundColor Cyan
    foreach ($state in $states) {
        $statusColor = switch ($state.status) {
            "Completed" { "Green" }
            "Failed" { "Red" }
            "InProgress" { "Yellow" }
            default { "Gray" }
        }

        Write-Host "    - $($state.branchCode): " -NoNewline -ForegroundColor White
        Write-Host $state.status -ForegroundColor $statusColor
        Write-Host "      Last Migration: $($state.lastMigrationApplied)" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " ✓ DONE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. The bad migration has been removed" -ForegroundColor White
    Write-Host "  2. Restart your backend to apply pending migrations" -ForegroundColor White
    Write-Host "  3. All branches should migrate successfully now" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "  ✗ Error occurred!" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red

    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "  Response: $responseBody" -ForegroundColor Gray
    }

    exit 1
}
