# Authorization Test Script
# Tests that endpoints return 403 Forbidden for unauthorized roles

$BaseUrl = "http://localhost:5062"
$testResults = @()

# ANSI color codes
$GREEN = "`e[32m"
$RED = "`e[31m"
$YELLOW = "`e[33m"
$BLUE = "`e[34m"
$RESET = "`e[0m"

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n$BLUE========================================$RESET" -NoNewline
    Write-Host "`n$BLUE$Message$RESET" -NoNewline
    Write-Host "`n$BLUE========================================$RESET"
}

function Write-Success {
    param([string]$Message)
    Write-Host "$GREEN✓ $Message$RESET"
}

function Write-Failure {
    param([string]$Message)
    Write-Host "$RED✗ $Message$RESET"
}

function Write-Info {
    param([string]$Message)
    Write-Host "$YELLOW→ $Message$RESET"
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Token,
        [int]$ExpectedStatus,
        [string]$Body = $null
    )

    try {
        $headers = @{
            "Authorization" = "Bearer $Token"
            "Content-Type" = "application/json"
        }

        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers
            SkipHttpErrorCheck = $true
        }

        if ($Body) {
            $params.Body = $Body
        }

        $response = Invoke-WebRequest @params
        $actualStatus = $response.StatusCode

        if ($actualStatus -eq $ExpectedStatus) {
            Write-Success "$Name - Expected: $ExpectedStatus, Got: $actualStatus"
            return @{
                Test = $Name
                Expected = $ExpectedStatus
                Actual = $actualStatus
                Passed = $true
            }
        } else {
            Write-Failure "$Name - Expected: $ExpectedStatus, Got: $actualStatus"
            return @{
                Test = $Name
                Expected = $ExpectedStatus
                Actual = $actualStatus
                Passed = $false
            }
        }
    } catch {
        Write-Failure "$Name - Error: $_"
        return @{
            Test = $Name
            Expected = $ExpectedStatus
            Actual = "Error"
            Passed = $false
            Error = $_.Exception.Message
        }
    }
}

function Get-AuthToken {
    param(
        [string]$Username,
        [string]$Password,
        [string]$BranchCode = "B001"
    )

    try {
        $loginBody = @{
            username = $Username
            password = $Password
            branchCode = $BranchCode
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$BaseUrl/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"

        if ($response.success -and $response.data.accessToken) {
            return $response.data.accessToken
        } else {
            Write-Warning "Failed to get token for $Username"
            return $null
        }
    } catch {
        Write-Warning "Login error for ${Username}: $_"
        return $null
    }
}

# ============================================
# Main Test Execution
# ============================================

Write-TestHeader "Starting Authorization Tests"

# Get tokens for different users
Write-Info "Authenticating users..."

# Admin user (HeadOfficeAdmin)
$adminToken = Get-AuthToken -Username "admin" -Password "123" -BranchCode "B001"
if ($adminToken) {
    Write-Success "Admin authenticated"
} else {
    Write-Failure "Admin authentication failed"
}

# Try to get Manager and Cashier tokens
# Note: We'll need to create these users if they don't exist
$managerToken = Get-AuthToken -Username "manager" -Password "123" -BranchCode "B001"
$cashierToken = Get-AuthToken -Username "cashier" -Password "123" -BranchCode "B001"

if ($managerToken) {
    Write-Success "Manager authenticated"
} else {
    Write-Info "Manager user not found (will skip manager tests)"
}

if ($cashierToken) {
    Write-Success "Cashier authenticated"
} else {
    Write-Info "Cashier user not found (will skip cashier tests)"
}

# ============================================
# Test 1: Branch Endpoints (HeadOfficeAdmin only)
# ============================================

Write-TestHeader "Test 1: Branch Endpoints (HeadOfficeAdmin only)"

if ($managerToken) {
    Write-Info "Testing Manager accessing branch endpoints (should be 403)..."
    $testResults += Test-Endpoint `
        -Name "Manager GET /api/v1/branches" `
        -Method "GET" `
        -Url "$BaseUrl/api/v1/branches" `
        -Token $managerToken `
        -ExpectedStatus 403

    $testResults += Test-Endpoint `
        -Name "Manager POST /api/v1/branches" `
        -Method "POST" `
        -Url "$BaseUrl/api/v1/branches" `
        -Token $managerToken `
        -ExpectedStatus 403 `
        -Body '{"code":"TEST","nameEn":"Test Branch","nameAr":"فرع تجريبي","addressEn":"Test Address","addressAr":"عنوان تجريبي","phone":"1234567890","dbProvider":"Sqlite","dbConnectionString":"Data Source=test.db"}'
}

if ($cashierToken) {
    Write-Info "Testing Cashier accessing branch endpoints (should be 403)..."
    $testResults += Test-Endpoint `
        -Name "Cashier GET /api/v1/branches" `
        -Method "GET" `
        -Url "$BaseUrl/api/v1/branches" `
        -Token $cashierToken `
        -ExpectedStatus 403

    $testResults += Test-Endpoint `
        -Name "Cashier DELETE /api/v1/branches/{id}" `
        -Method "DELETE" `
        -Url "$BaseUrl/api/v1/branches/1a1ffefa-b2ce-49de-bc89-583e13b59ff7" `
        -Token $cashierToken `
        -ExpectedStatus 403
}

if ($adminToken) {
    Write-Info "Testing Admin accessing branch endpoints (should be 200/201)..."
    $testResults += Test-Endpoint `
        -Name "Admin GET /api/v1/branches" `
        -Method "GET" `
        -Url "$BaseUrl/api/v1/branches" `
        -Token $adminToken `
        -ExpectedStatus 200
}

# ============================================
# Test 2: Sale Void Endpoint (Manager+ only)
# ============================================

Write-TestHeader "Test 2: Sale Void Endpoint (Manager or Admin only)"

# First, create a sale to void
if ($cashierToken) {
    Write-Info "Creating a test sale with cashier..."
    $saleBody = @{
        customerId = $null
        invoiceType = 0
        paymentMethod = 0
        lineItems = @(
            @{
                productId = "00000000-0000-0000-0000-000000000001"
                quantity = 1
                unitPrice = 10.00
                discountType = 0
                discountValue = 0
            }
        )
        notes = "Test sale for void authorization"
    } | ConvertTo-Json

    try {
        $createResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/sales" -Method Post -Body $saleBody -ContentType "application/json" -Headers @{"Authorization" = "Bearer $cashierToken"}
        $saleId = $createResponse.data.id
        Write-Success "Test sale created: $saleId"

        # Try to void with cashier (should be 403)
        Write-Info "Testing Cashier voiding sale (should be 403)..."
        $voidBody = '{"reason":"Unauthorized void attempt"}'
        $testResults += Test-Endpoint `
            -Name "Cashier POST /api/v1/sales/{id}/void" `
            -Method "POST" `
            -Url "$BaseUrl/api/v1/sales/$saleId/void" `
            -Token $cashierToken `
            -ExpectedStatus 403 `
            -Body $voidBody

        # Try to void with manager (should be 200)
        if ($managerToken) {
            Write-Info "Testing Manager voiding sale (should be 200)..."
            $testResults += Test-Endpoint `
                -Name "Manager POST /api/v1/sales/{id}/void" `
                -Method "POST" `
                -Url "$BaseUrl/api/v1/sales/$saleId/void" `
                -Token $managerToken `
                -ExpectedStatus 200 `
                -Body '{"reason":"Manager authorized void"}'
        }
    } catch {
        Write-Warning "Failed to create test sale: $_"
    }
}

# ============================================
# Test 3: General Endpoints (Any authenticated user)
# ============================================

Write-TestHeader "Test 3: General Endpoints (Any authenticated user)"

if ($cashierToken) {
    Write-Info "Testing Cashier accessing general sales endpoints (should be 200)..."
    $testResults += Test-Endpoint `
        -Name "Cashier GET /api/v1/sales" `
        -Method "GET" `
        -Url "$BaseUrl/api/v1/sales" `
        -Token $cashierToken `
        -ExpectedStatus 200

    $testResults += Test-Endpoint `
        -Name "Cashier GET /api/v1/products" `
        -Method "GET" `
        -Url "$BaseUrl/api/v1/products" `
        -Token $cashierToken `
        -ExpectedStatus 200
}

# ============================================
# Test 4: No Token (Should be 401 Unauthorized)
# ============================================

Write-TestHeader "Test 4: Endpoints without authentication (should be 401)"

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/v1/sales" -Method Get -SkipHttpErrorCheck
    $actualStatus = $response.StatusCode

    if ($actualStatus -eq 401) {
        Write-Success "No token GET /api/v1/sales - Expected: 401, Got: $actualStatus"
        $testResults += @{
            Test = "No token GET /api/v1/sales"
            Expected = 401
            Actual = $actualStatus
            Passed = $true
        }
    } else {
        Write-Failure "No token GET /api/v1/sales - Expected: 401, Got: $actualStatus"
        $testResults += @{
            Test = "No token GET /api/v1/sales"
            Expected = 401
            Actual = $actualStatus
            Passed = $false
        }
    }
} catch {
    Write-Failure "No token test error: $_"
}

# ============================================
# Summary
# ============================================

Write-TestHeader "Test Summary"

$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Passed -eq $true }).Count
$failedTests = $totalTests - $passedTests

Write-Host "`nTotal Tests: $totalTests"
Write-Success "Passed: $passedTests"
if ($failedTests -gt 0) {
    Write-Failure "Failed: $failedTests"
}

if ($failedTests -gt 0) {
    Write-Host "`n${RED}Failed Tests:$RESET"
    $testResults | Where-Object { $_.Passed -eq $false } | ForEach-Object {
        Write-Host "  - $($_.Test): Expected $($_.Expected), Got $($_.Actual)"
        if ($_.Error) {
            Write-Host "    Error: $($_.Error)"
        }
    }
}

# Export results to JSON
$testResults | ConvertTo-Json -Depth 3 | Out-File "authorization-test-results.json"
Write-Info "Detailed results saved to: authorization-test-results.json"

# Exit with appropriate code
if ($failedTests -gt 0) {
    exit 1
} else {
    Write-Host "`n$GREEN All tests passed!$RESET"
    exit 0
}
