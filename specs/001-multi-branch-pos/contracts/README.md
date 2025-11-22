# API Contracts: Multi-Branch POS System

**Feature**: Multi-Branch POS System
**Date**: 2025-01-21
**Phase**: 1 - Design & Contracts

## Overview

This directory contains OpenAPI 3.0 specifications for all backend API endpoints. The API is organized into logical groups based on business domains.

## Base URL

```
Development: https://localhost:5001/api
Production: https://[domain]/api
```

## Authentication

All endpoints (except `/auth/login` and `/auth/register`) require JWT authentication:

```http
Authorization: Bearer <access_token>
```

**Token Lifecycle**:
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry (HttpOnly cookie)
- Session timeout: 30 minutes inactivity

## API Versioning

Current version: `v1`

All endpoints are prefixed with `/api/v1/` (e.g., `/api/v1/sales`)

## Standard Response Formats

### Success Response (2xx)

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

### Error Response (4xx, 5xx)

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* optional additional context */ }
  }
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [/* array of items */],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE (no response body) |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but lacking permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource conflict (e.g., duplicate SKU) |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Server-side error |

## API Endpoint Groups

### 1. Authentication (`/api/v1/auth`)

- [POST /login](./auth.md#post-login) - User login
- [POST /logout](./auth.md#post-logout) - User logout
- [POST /refresh](./auth.md#post-refresh) - Refresh access token
- [POST /technical-login](./auth.md#post-technical-login) - Technical password override
- [GET /me](./auth.md#get-me) - Get current user info

### 2. Branches (`/api/v1/branches`)

- [GET /branches](./branches.md#get-branches) - List all branches
- [GET /branches/:id](./branches.md#get-branch) - Get branch details
- [POST /branches](./branches.md#post-branch) - Create new branch
- [PUT /branches/:id](./branches.md#put-branch) - Update branch
- [DELETE /branches/:id](./branches.md#delete-branch) - Delete branch
- [GET /branches/:id/settings](./branches.md#get-branch-settings) - Get branch settings
- [PUT /branches/:id/settings](./branches.md#put-branch-settings) - Update branch settings
- [POST /branches/:id/test-connection](./branches.md#post-test-connection) - Test database connection

### 3. Users (`/api/v1/users`)

- [GET /users](./users.md#get-users) - List users
- [GET /users/:id](./users.md#get-user) - Get user details
- [POST /users](./users.md#post-user) - Create user
- [PUT /users/:id](./users.md#put-user) - Update user
- [DELETE /users/:id](./users.md#delete-user) - Delete user
- [POST /users/:id/assign-branch](./users.md#post-assign-branch) - Assign user to branch
- [DELETE /users/:id/branches/:branchId](./users.md#delete-user-branch) - Remove branch assignment
- [GET /users/:id/activity](./users.md#get-user-activity) - Get user activity log (last 100)

### 4. Sales (`/api/v1/sales`)

- [GET /sales](./sales.md#get-sales) - List sales
- [GET /sales/:id](./sales.md#get-sale) - Get sale details
- [POST /sales](./sales.md#post-sale) - Create sale
- [POST /sales/:id/void](./sales.md#post-void-sale) - Void sale
- [GET /sales/:id/invoice](./sales.md#get-invoice) - Get printable invoice
- [GET /sales/stats](./sales.md#get-sales-stats) - Get sales statistics

### 5. Products (`/api/v1/products`)

- [GET /products](./products.md#get-products) - List products
- [GET /products/:id](./products.md#get-product) - Get product details
- [POST /products](./products.md#post-product) - Create product
- [PUT /products/:id](./products.md#put-product) - Update product
- [DELETE /products/:id](./products.md#delete-product) - Delete product
- [POST /products/:id/images](./products.md#post-product-image) - Upload product image
- [DELETE /products/:id/images/:imageId](./products.md#delete-product-image) - Delete product image
- [POST /products/:id/adjust-stock](./products.md#post-adjust-stock) - Adjust inventory

### 6. Categories (`/api/v1/categories`)

- [GET /categories](./categories.md#get-categories) - List categories
- [GET /categories/:id](./categories.md#get-category) - Get category details
- [POST /categories](./categories.md#post-category) - Create category
- [PUT /categories/:id](./categories.md#put-category) - Update category
- [DELETE /categories/:id](./categories.md#delete-category) - Delete category

### 7. Customers (`/api/v1/customers`)

- [GET /customers](./customers.md#get-customers) - List customers
- [GET /customers/:id](./customers.md#get-customer) - Get customer details
- [POST /customers](./customers.md#post-customer) - Create customer
- [PUT /customers/:id](./customers.md#put-customer) - Update customer
- [DELETE /customers/:id](./customers.md#delete-customer) - Delete customer
- [GET /customers/:id/history](./customers.md#get-customer-history) - Get purchase history

### 8. Suppliers (`/api/v1/suppliers`)

- [GET /suppliers](./suppliers.md#get-suppliers) - List suppliers
- [GET /suppliers/:id](./suppliers.md#get-supplier) - Get supplier details
- [POST /suppliers](./suppliers.md#post-supplier) - Create supplier
- [PUT /suppliers/:id](./suppliers.md#put-supplier) - Update supplier
- [DELETE /suppliers/:id](./suppliers.md#delete-supplier) - Delete supplier

### 9. Purchases (`/api/v1/purchases`)

- [GET /purchases](./purchases.md#get-purchases) - List purchases
- [GET /purchases/:id](./purchases.md#get-purchase) - Get purchase details
- [POST /purchases](./purchases.md#post-purchase) - Create purchase
- [PUT /purchases/:id](./purchases.md#put-purchase) - Update purchase
- [POST /purchases/:id/receive](./purchases.md#post-receive-purchase) - Mark purchase as received

### 10. Expenses (`/api/v1/expenses`)

- [GET /expenses](./expenses.md#get-expenses) - List expenses
- [GET /expenses/:id](./expenses.md#get-expense) - Get expense details
- [POST /expenses](./expenses.md#post-expense) - Create expense
- [PUT /expenses/:id](./expenses.md#put-expense) - Update expense
- [DELETE /expenses/:id](./expenses.md#delete-expense) - Delete expense
- [POST /expenses/:id/approve](./expenses.md#post-approve-expense) - Approve expense

### 11. Sync (`/api/v1/sync`)

- [POST /sync/transaction](./sync.md#post-sync-transaction) - Sync offline transaction
- [POST /sync/batch](./sync.md#post-sync-batch) - Batch sync multiple transactions
- [GET /sync/status](./sync.md#get-sync-status) - Get sync status

### 12. Reports (`/api/v1/reports`)

- [GET /reports/sales](./reports.md#get-sales-report) - Sales report
- [GET /reports/inventory](./reports.md#get-inventory-report) - Inventory report
- [GET /reports/financial](./reports.md#get-financial-report) - Financial report
- [POST /reports/export](./reports.md#post-export-report) - Export report (PDF/Excel/CSV)

### 13. Images (`/api/v1/images`)

- [POST /images/upload](./images.md#post-upload-image) - Upload image
- [GET /images/:branchName/:entityType/:entityId/:size](./images.md#get-image) - Get image
- [DELETE /images/:id](./images.md#delete-image) - Delete image

### 14. Audit (`/api/v1/audit`)

- [GET /audit/logs](./audit.md#get-audit-logs) - Get audit logs
- [GET /audit/logs/:id](./audit.md#get-audit-log) - Get audit log details
- [GET /audit/user/:userId](./audit.md#get-user-audit) - Get user audit trail

## Role-Based Access Control (RBAC)

### Roles

| Role | Code | Permissions |
|------|------|-------------|
| Head Office Admin | `head_office_admin` | Full system access, cross-branch operations |
| Branch Manager | `branch_manager` | Full branch access, reports, settings |
| Cashier | `cashier` | Sales, customer lookup, basic inventory view |

### Endpoint Permissions

| Endpoint | Head Office Admin | Branch Manager | Cashier |
|----------|-------------------|----------------|---------|
| Auth endpoints | ✅ | ✅ | ✅ |
| Branch management | ✅ | ❌ | ❌ |
| User management (head office) | ✅ | ❌ | ❌ |
| User management (branch) | ✅ | ✅ | ❌ |
| Sales (create) | ✅ | ✅ | ✅ |
| Sales (void) | ✅ | ✅ | ❌ |
| Products (read) | ✅ | ✅ | ✅ |
| Products (write) | ✅ | ✅ | ❌ |
| Customers (read) | ✅ | ✅ | ✅ |
| Customers (write) | ✅ | ✅ | ❌ |
| Purchases | ✅ | ✅ | ❌ |
| Expenses | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ❌ |
| Audit logs | ✅ | ✅ (own branch) | ❌ |

## Request Validation

All POST/PUT endpoints validate:
- Required fields presence
- Data type correctness
- Format validation (email, phone, etc.)
- Business rule validation (e.g., price > 0)
- Range checks (e.g., discount 0-100%)

Validation errors return `400 Bad Request` with details:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "email": ["Email must be a valid email address"],
        "price": ["Price must be greater than 0"]
      }
    }
  }
}
```

## Rate Limiting

- Public endpoints: 60 requests/minute per IP
- Authenticated endpoints: 300 requests/minute per user
- File uploads: 10 requests/minute per user
- Sync endpoints: 100 requests/minute per branch

Exceeded limits return `429 Too Many Requests`.

## CORS Configuration

Production CORS settings:
- Allowed Origins: Frontend domain (whitelisted)
- Allowed Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Allowed Headers: Content-Type, Authorization
- Credentials: true (for cookies)

## Health Check

```http
GET /health
```

Returns system health status:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-21T10:00:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "fileSystem": "healthy"
  }
}
```

## OpenAPI Specification Files

Each endpoint group has a dedicated OpenAPI 3.0 YAML file:

- [auth.md](./auth.md) - Authentication endpoints
- [branches.md](./branches.md) - Branch management
- [users.md](./users.md) - User management
- [sales.md](./sales.md) - Sales operations
- [products.md](./products.md) - Product/inventory management
- [categories.md](./categories.md) - Category management
- [customers.md](./customers.md) - Customer management
- [suppliers.md](./suppliers.md) - Supplier management
- [purchases.md](./purchases.md) - Purchase orders
- [expenses.md](./expenses.md) - Expense tracking
- [sync.md](./sync.md) - Offline synchronization
- [reports.md](./reports.md) - Reporting
- [images.md](./images.md) - Image management
- [audit.md](./audit.md) - Audit logging

---

## Testing Contracts

Use these tools to test API contracts:

1. **Swagger UI**: Available at `/swagger` when running backend in development
2. **Postman Collection**: Import OpenAPI specs into Postman
3. **Integration Tests**: Backend.IntegrationTests project validates all contracts
4. **Mock Service Worker (MSW)**: Frontend uses MSW to mock API during development

---

## Contract-First Development Workflow

1. **Define Contract**: Create/update OpenAPI spec in this directory
2. **Review**: Team reviews contract before implementation
3. **Mock Backend**: Frontend uses MSW with contract for parallel development
4. **Implement Backend**: Backend implements endpoint per contract
5. **Integration Test**: Test backend against contract
6. **Frontend Integration**: Connect frontend to real backend
7. **End-to-End Test**: Test full user flow

---

**Next Steps**: Review individual contract files for detailed endpoint specifications.
