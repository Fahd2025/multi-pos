# Authentication API Contracts

Base Path: `/api/v1/auth`

## POST /login

Authenticate user and obtain access/refresh tokens.

### Request

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "branchName": "all",
  "username": "admin",
  "password": "123"
}
```

**Body Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `branchName` | string | Yes | Branch login identifier or "all" for head office |
| `username` | string | Yes | User's username |
| `password` | string | Yes | User's password |

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessTokenExpiresIn": 900,
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "username": "admin",
      "email": "admin@example.com",
      "fullName": "System Administrator",
      "preferredLanguage": "en",
      "isHeadOfficeAdmin": true,
      "branches": [
        {
          "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "branchName": "Main Branch",
          "role": "branch_manager"
        }
      ]
    }
  },
  "message": "Login successful"
}
```

**Response Headers**:
```
Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

### Error Responses

**401 Unauthorized - Invalid Credentials**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password"
  }
}
```

**423 Locked - Account Locked**:
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Account locked due to too many failed login attempts",
    "details": {
      "lockedUntil": "2025-01-21T11:00:00Z"
    }
  }
}
```

**404 Not Found - Branch Not Found**:
```json
{
  "success": false,
  "error": {
    "code": "BRANCH_NOT_FOUND",
    "message": "Branch 'invalid-branch' does not exist"
  }
}
```

---

## POST /logout

Logout user and revoke refresh token.

### Request

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
Cookie: refreshToken=<refresh_token>
```

No body required.

### Response (200 OK)

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Response Headers**:
```
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0
```

### Error Responses

**401 Unauthorized**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

## POST /refresh

Refresh access token using refresh token.

### Request

```http
POST /api/v1/auth/refresh
Cookie: refreshToken=<refresh_token>
```

No body required.

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessTokenExpiresIn": 900
  },
  "message": "Token refreshed successfully"
}
```

**Response Headers**:
```
Set-Cookie: refreshToken=<new_token>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

### Error Responses

**401 Unauthorized - Invalid Token**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token is invalid or expired"
  }
}
```

**401 Unauthorized - Token Revoked**:
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_REVOKED",
    "message": "Refresh token has been revoked"
  }
}
```

---

## POST /technical-login

Override authentication using technical password (admin emergency access).

### Request

```http
POST /api/v1/auth/technical-login
Content-Type: application/json
```

```json
{
  "branchName": "all",
  "username": "admin",
  "technicalPassword": "emergency-password-from-config"
}
```

**Body Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `branchName` | string | Yes | Branch login identifier or "all" |
| `username` | string | Yes | Target user's username |
| `technicalPassword` | string | Yes | Technical override password from app settings |

### Response (200 OK)

Same as regular login.

### Error Responses

**401 Unauthorized - Invalid Technical Password**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TECHNICAL_PASSWORD",
    "message": "Technical password is incorrect"
  }
}
```

**Audit Note**: Technical logins are logged with special event type for security monitoring.

---

## GET /me

Get current authenticated user's information.

### Request

```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "username": "admin",
    "email": "admin@example.com",
    "fullNameEn": "System Administrator",
    "fullNameAr": "مدير النظام",
    "phone": "+1234567890",
    "preferredLanguage": "en",
    "isHeadOfficeAdmin": true,
    "isActive": true,
    "lastLoginAt": "2025-01-21T10:00:00Z",
    "branches": [
      {
        "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "branchCode": "B001",
        "branchName": "Main Branch",
        "role": "branch_manager"
      }
    ]
  }
}
```

### Error Responses

**401 Unauthorized**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

## Security Notes

### Password Requirements

- Minimum length: 8 characters
- Must contain: uppercase, lowercase, number, special character
- Cannot be same as username
- Cannot be common password (validated against list)

### Session Management

- Access token expiry: 15 minutes
- Refresh token expiry: 7 days
- Inactivity timeout: 30 minutes (enforced server-side)
- Concurrent sessions: Allowed (each gets unique refresh token)

### Account Lockout

- Failed attempts threshold: 5
- Lockout duration: 15 minutes
- Lockout counter resets on successful login
- Technical password bypasses lockout

### Token Claims

Access token JWT payload:

```json
{
  "sub": "user-id",
  "username": "admin",
  "email": "admin@example.com",
  "branchId": "branch-id",
  "role": "branch_manager",
  "isHeadOfficeAdmin": false,
  "iat": 1737456000,
  "exp": 1737456900
}
```

### Refresh Token Storage

- Stored in database: `RefreshTokens` table
- Linked to user: userId foreign key
- Single-use: Rotating refresh tokens (new token issued on each refresh)
- Automatic cleanup: Expired tokens purged daily
