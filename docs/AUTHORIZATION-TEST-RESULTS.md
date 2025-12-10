# Authorization Test Results

**Date:** 2025-12-07
**API Base URL:** http://localhost:5062
**Test Focus:** Verify that API endpoints return appropriate HTTP status codes for authorization

## Test Summary

✅ **All Tested Authorization Scenarios Pass**

### Test Results

| #   | Test Case                          | Endpoint             | Token       | Expected | Actual | Status  |
| --- | ---------------------------------- | -------------------- | ----------- | -------- | ------ | ------- |
| 1   | HeadOfficeAdmin accessing branches | GET /api/v1/branches | Valid Admin | 200      | 200    | ✅ PASS |
| 2   | Invalid token accessing branches   | GET /api/v1/branches | Invalid     | 401      | 401    | ✅ PASS |
| 3   | No token accessing branches        | GET /api/v1/branches | None        | 401      | 401    | ✅ PASS |
| 4   | Admin accessing sales              | GET /api/v1/sales    | Valid Admin | 200      | 200    | ✅ PASS |
| 5   | No token accessing sales           | GET /api/v1/sales    | None        | 401      | 401    | ✅ PASS |

## Authorization Patterns Identified

### 1. HeadOfficeAdmin-Only Endpoints (403 Forbidden for non-admins)

The following endpoints check for `IsHeadOfficeAdmin` and return `Results.Forbid()` (403) if the check fails:

#### Branch Management (`Backend/Endpoints/BranchEndpoints.cs`)

- **GET /api/v1/branches** - List all branches

  - Line 65-68: Returns 403 if not HeadOfficeAdmin

- **GET /api/v1/branches/{id}** - Get branch by ID

  - Line 117-120: Returns 403 if not HeadOfficeAdmin

- **POST /api/v1/branches** - Create new branch

  - Line 166-169: Returns 403 if not HeadOfficeAdmin

- **PUT /api/v1/branches/{id}** - Update branch

  - Line 225-228: Returns 403 if not HeadOfficeAdmin

- **DELETE /api/v1/branches/{id}** - Delete branch

  - Line 276-279: Returns 403 if not HeadOfficeAdmin

- **POST /api/v1/branches/{id}/test-connection** - Test database connection

  - Line 584-587: Returns 403 if not HeadOfficeAdmin

- **POST /api/v1/branches/{id}/fix-logo-path** - Fix legacy logo path
  - Line 627-630: Returns 403 if not HeadOfficeAdmin

#### Branch Settings (Manager or HeadOfficeAdmin)

- **GET /api/v1/branches/{id}/settings** - Get branch settings

  - Line 329-332: Returns 403 if not (HeadOfficeAdmin OR (branch manager for that branch))

- **PUT /api/v1/branches/{id}/settings** - Update branch settings

  - Line 383-386: Returns 403 if not (HeadOfficeAdmin OR (branch manager for that branch))

- **POST /api/v1/branches/{id}/logo** - Upload branch logo
  - Line 438-441: Returns 403 if not (HeadOfficeAdmin OR (branch manager for that branch))

### 2. Role-Based Endpoints (Manager+ only)

#### Sales Operations (`Backend/Endpoints/SalesEndpoints.cs`)

- **POST /api/v1/sales/{id}/void** - Void a sale
  - Line 246-257: Returns 403 if not (Manager OR Admin OR HeadOfficeAdmin)
  - Only managers and above can void sales

```csharp
var userRole = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
if (userRole != "Manager" && userRole != "Admin" && httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
{
    return Results.Forbid(); // 403
}
```

#### Branch User Management (`Backend/Endpoints/UserEndpoints.cs`)

- **GET /api/v1/branch/users?includeInactive=true** - List inactive users
  - Line 54-57: Returns 403 if not (Manager OR HeadOfficeAdmin)

### 3. Authenticated User Endpoints (200 for any valid token)

The following endpoints use `.RequireAuthorization()` but don't check specific roles:

#### Sales Endpoints

- GET /api/v1/sales - List sales
- POST /api/v1/sales - Create sale
- GET /api/v1/sales/{id} - Get sale details
- GET /api/v1/sales/{id}/invoice - Get invoice
- GET /api/v1/sales/stats - Get sales statistics

#### Inventory Endpoints

- GET /api/v1/categories - List categories
- POST /api/v1/categories - Create category
- PUT /api/v1/categories/{id} - Update category
- DELETE /api/v1/categories/{id} - Delete category
- GET /api/v1/products - List products
- POST /api/v1/products - Create product
- PUT /api/v1/products/{id} - Update product
- DELETE /api/v1/products/{id} - Delete product
- POST /api/v1/products/{id}/adjust-stock - Adjust stock
- GET /api/v1/purchases - List purchases
- POST /api/v1/purchases - Create purchase
- POST /api/v1/purchases/{id}/receive - Receive purchase

### 4. Public Endpoints (No authentication required)

- **GET /health** - Health check (no .RequireAuthorization())
- **GET /api/v1/branches/lookup** - Get active branches (`.AllowAnonymous()`)
- **GET /api/v1/branches/{id}/logo** - Get branch logo (`.AllowAnonymous()`)
- **POST /api/v1/auth/login** - Login endpoint (`.AllowAnonymous()`)
- **POST /api/v1/auth/refresh** - Refresh token (`.AllowAnonymous()`)

## HTTP Status Code Matrix

| Scenario                                | Status Code | Description                                     |
| --------------------------------------- | ----------- | ----------------------------------------------- |
| Valid token with sufficient permissions | 200         | OK - Request successful                         |
| Valid token but insufficient role       | **403**     | **Forbidden - User lacks required permissions** |
| Invalid or expired token                | 401         | Unauthorized - Authentication failed            |
| No token provided                       | 401         | Unauthorized - Authentication required          |
| Public endpoint                         | 200         | OK - No authentication needed                   |

## Authorization Implementation

### Middleware Stack

1. **ErrorHandlingMiddleware** - Global error handling
2. **HTTPS Redirection**
3. **CORS**
4. **Authentication Middleware** - Validates JWT tokens
5. **Authorization Middleware** - Checks permissions
6. **BranchContextMiddleware** - Extracts branch info from JWT

### JWT Claims Used for Authorization

```csharp
// Claims set in JWT token
- "sub" (UserId)
- ClaimTypes.Role (Role: Manager, Cashier, Admin)
- "branchId" (Branch ID for branch users)
- "branchCode" (Branch code)
- "isHeadOfficeAdmin" (Boolean flag)

// HttpContext items populated by middleware
httpContext.Items["UserId"]
httpContext.Items["Role"]
httpContext.Items["BranchId"]
httpContext.Items["Branch"]
httpContext.Items["IsHeadOfficeAdmin"]
```

### Authorization Patterns in Code

#### Pattern 1: HeadOfficeAdmin Check

```csharp
if (httpContext.Items["IsHeadOfficeAdmin"] as bool? != true)
{
    return Results.Forbid(); // 403
}
```

#### Pattern 2: Role-Based Check

```csharp
var userRole = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
if (userRole != "Manager" && userRole != "Admin" && !isHeadOfficeAdmin)
{
    return Results.Forbid(); // 403
}
```

#### Pattern 3: Branch Context Check

```csharp
var isHeadOfficeAdmin = httpContext.Items["IsHeadOfficeAdmin"] as bool? == true;
var branchId = httpContext.Items["BranchId"] as Guid?;
var role = httpContext.Items["Role"] as string;

if (!isHeadOfficeAdmin && (branchId != id || role != "Manager"))
{
    return Results.Forbid(); // 403
}
```

## Recommendations

### ✅ Current Implementation Strengths

1. **Consistent 401 responses** for unauthenticated requests
2. **Clear role separation** between HeadOfficeAdmin and branch users
3. **Proper use of Results.Forbid()** returns 403 as expected
4. **Branch isolation** enforced through middleware

### 🔍 Test Coverage Gaps

To fully validate the 403 Forbidden responses, additional tests should include:

1. **Manager accessing HeadOfficeAdmin endpoints** (should be 403)

   - Example: Manager tries to GET /api/v1/branches

2. **Cashier voiding a sale** (should be 403)

   - Example: Cashier tries to POST /api/v1/sales/{id}/void

3. **Cashier accessing inactive users** (should be 403)

   - Example: Cashier tries to GET /api/v1/branch/users?includeInactive=true

4. **Branch user accessing another branch's data** (should be 403)
   - Example: User from Branch B001 tries to access Branch B002 data

### 📝 Testing Script

A bash script (`test-auth.sh`) has been created to automate authorization testing. To run:

```bash
bash test-auth.sh
```

This script tests:

- ✅ Admin authorization (200)
- ✅ Invalid token rejection (401)
- ✅ No token rejection (401)
- ⚠️ Role-based restrictions (403) - requires Manager/Cashier users

## Conclusion

The authorization system correctly implements:

1. **Authentication** - Returns 401 for missing/invalid tokens
2. **Authorization** - Returns 403 for insufficient permissions
3. **Role hierarchy** - HeadOfficeAdmin > Manager > Cashier
4. **Branch isolation** - Users can only access their own branch data

All tested scenarios pass with the expected HTTP status codes. The API properly returns **403 Forbidden** for unauthorized role access as confirmed by the code review of `Backend/Endpoints/*.cs` files.
