#!/bin/bash

# Authorization Test Script
# Tests that endpoints return 403 Forbidden for unauthorized roles

BASE_URL="http://localhost:5062"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Starting Authorization Tests${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to get auth token
get_token() {
    local username=$1
    local password=$2
    local branch_code=${3:-B001}

    local response=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${username}\",\"password\":\"${password}\",\"branchCode\":\"${branch_code}\"}")

    echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4
}

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local token=$4
    local expected_status=$5
    local body=$6

    if [ -z "$token" ]; then
        # Test without auth
        status=$(curl -s -o /dev/null -w "%{http_code}" -X "${method}" "${url}")
    elif [ -z "$body" ]; then
        # Test with auth, no body
        status=$(curl -s -o /dev/null -w "%{http_code}" -X "${method}" "${url}" \
            -H "Authorization: Bearer ${token}")
    else
        # Test with auth and body
        status=$(curl -s -o /dev/null -w "%{http_code}" -X "${method}" "${url}" \
            -H "Authorization: Bearer ${token}" \
            -H "Content-Type: application/json" \
            -d "${body}")
    fi

    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ ${name} - Expected: ${expected_status}, Got: ${status}${NC}"
        return 0
    else
        echo -e "${RED}✗ ${name} - Expected: ${expected_status}, Got: ${status}${NC}"
        return 1
    fi
}

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# ============================================
# Authenticate users
# ============================================

echo -e "${YELLOW}→ Authenticating users...${NC}"

ADMIN_TOKEN=$(get_token "admin" "123" "B001")
if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}✓ Admin authenticated${NC}"
else
    echo -e "${RED}✗ Admin authentication failed${NC}"
    exit 1
fi

MANAGER_TOKEN=$(get_token "manager" "123" "B001")
if [ -n "$MANAGER_TOKEN" ]; then
    echo -e "${GREEN}✓ Manager authenticated${NC}"
else
    echo -e "${YELLOW}→ Manager user not found (will skip manager tests)${NC}"
fi

CASHIER_TOKEN=$(get_token "cashier" "123" "B001")
if [ -n "$CASHIER_TOKEN" ]; then
    echo -e "${GREEN}✓ Cashier authenticated${NC}"
else
    echo -e "${YELLOW}→ Cashier user not found (will skip cashier tests)${NC}"
fi

# ============================================
# Test 1: Branch Endpoints (HeadOfficeAdmin only)
# ============================================

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test 1: Branch Endpoints (HeadOfficeAdmin only)${NC}"
echo -e "${BLUE}========================================${NC}"

# Test Admin can access branch endpoints (should be 200)
echo -e "${YELLOW}→ Testing Admin accessing branch endpoints (should be 200)...${NC}"
test_endpoint "Admin GET /api/v1/branches" "GET" "${BASE_URL}/api/v1/branches" "$ADMIN_TOKEN" 200
TOTAL_TESTS=$((TOTAL_TESTS + 1))
[ $? -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1)) || FAILED_TESTS=$((FAILED_TESTS + 1))

# Test Manager cannot access branch endpoints (should be 403)
if [ -n "$MANAGER_TOKEN" ]; then
    echo -e "${YELLOW}→ Testing Manager accessing branch endpoints (should be 403)...${NC}"
    test_endpoint "Manager GET /api/v1/branches" "GET" "${BASE_URL}/api/v1/branches" "$MANAGER_TOKEN" 403
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    [ $? -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1)) || FAILED_TESTS=$((FAILED_TESTS + 1))

    test_endpoint "Manager POST /api/v1/branches" "POST" "${BASE_URL}/api/v1/branches" "$MANAGER_TOKEN" 403 \
        '{"code":"TEST","nameEn":"Test","nameAr":"تجريبي","addressEn":"Test","addressAr":"تجريبي","phone":"123","dbProvider":"Sqlite","dbConnectionString":"test.db"}'
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    [ $? -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1)) || FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test Cashier cannot access branch endpoints (should be 403)
if [ -n "$CASHIER_TOKEN" ]; then
    echo -e "${YELLOW}→ Testing Cashier accessing branch endpoints (should be 403)...${NC}"
    test_endpoint "Cashier GET /api/v1/branches" "GET" "${BASE_URL}/api/v1/branches" "$CASHIER_TOKEN" 403
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    [ $? -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1)) || FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# ============================================
# Test 2: Sale Void Endpoint (Manager+ only)
# ============================================

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test 2: Sale Void Endpoint (Manager or Admin only)${NC}"
echo -e "${BLUE}========================================${NC}"

# Create a test sale first
if [ -n "$CASHIER_TOKEN" ]; then
    echo -e "${YELLOW}→ Creating a test sale...${NC}"
    SALE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/sales" \
        -H "Authorization: Bearer ${CASHIER_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"customerId":null,"invoiceType":0,"paymentMethod":0,"lineItems":[{"productId":"00000000-0000-0000-0000-000000000001","quantity":1,"unitPrice":10.00,"discountType":0,"discountValue":0}],"notes":"Test sale"}')

    SALE_ID=$(echo "$SALE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -n "$SALE_ID" ]; then
        echo -e "${GREEN}✓ Test sale created: ${SALE_ID}${NC}"

        # Try to void with cashier (should be 403)
        echo -e "${YELLOW}→ Testing Cashier voiding sale (should be 403)...${NC}"
        test_endpoint "Cashier POST /api/v1/sales/{id}/void" "POST" "${BASE_URL}/api/v1/sales/${SALE_ID}/void" "$CASHIER_TOKEN" 403 \
            '{"reason":"Unauthorized void attempt"}'
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        [ $? -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1)) || FAILED_TESTS=$((FAILED_TESTS + 1))

        # Try to void with manager (should be 200)
        if [ -n "$MANAGER_TOKEN" ]; then
            echo -e "${YELLOW}→ Testing Manager voiding sale (should be 200)...${NC}"
            test_endpoint "Manager POST /api/v1/sales/{id}/void" "POST" "${BASE_URL}/api/v1/sales/${SALE_ID}/void" "$MANAGER_TOKEN" 200 \
                '{"reason":"Manager authorized void"}'
            TOTAL_TESTS=$((TOTAL_TESTS + 1))
            [ $? -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1)) || FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "${YELLOW}→ Could not create test sale, skipping void tests${NC}"
    fi
fi

# ============================================
# Test 3: General Endpoints (Any authenticated user)
# ============================================

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test 3: General Endpoints (Any authenticated user)${NC}"
echo -e "${BLUE}========================================${NC}"

if [ -n "$CASHIER_TOKEN" ]; then
    echo -e "${YELLOW}→ Testing Cashier accessing general endpoints (should be 200)...${NC}"
    test_endpoint "Cashier GET /api/v1/sales" "GET" "${BASE_URL}/api/v1/sales" "$CASHIER_TOKEN" 200
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    [ $? -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1)) || FAILED_TESTS=$((FAILED_TESTS + 1))

    test_endpoint "Cashier GET /api/v1/products" "GET" "${BASE_URL}/api/v1/products" "$CASHIER_TOKEN" 200
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    [ $? -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1)) || FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# ============================================
# Test 4: No Token (Should be 401 Unauthorized)
# ============================================

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test 4: Endpoints without authentication (should be 401)${NC}"
echo -e "${BLUE}========================================${NC}"

test_endpoint "No token GET /api/v1/sales" "GET" "${BASE_URL}/api/v1/sales" "" 401
TOTAL_TESTS=$((TOTAL_TESTS + 1))
[ $? -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1)) || FAILED_TESTS=$((FAILED_TESTS + 1))

test_endpoint "No token GET /api/v1/branches" "GET" "${BASE_URL}/api/v1/branches" "" 401
TOTAL_TESTS=$((TOTAL_TESTS + 1))
[ $? -eq 0 ] && PASSED_TESTS=$((PASSED_TESTS + 1)) || FAILED_TESTS=$((FAILED_TESTS + 1))

# ============================================
# Summary
# ============================================

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"

echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}✓ Passed: $PASSED_TESTS${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}✗ Failed: $FAILED_TESTS${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi
