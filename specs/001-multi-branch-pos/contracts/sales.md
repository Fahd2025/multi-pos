# Sales API Contracts

Base Path: `/api/v1/sales`

## POST /sales

Create a new sale transaction.

### Request

```http
POST /api/v1/sales
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "customerId": null,
  "invoiceType": 0,
  "lineItems": [
    {
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "quantity": 2,
      "unitPrice": 99.99,
      "discountType": 1,
      "discountValue": 10.00
    },
    {
      "productId": "4fb96g75-6828-5673-c4gd-3d074g77bgb7",
      "quantity": 1,
      "unitPrice": 149.99,
      "discountType": 0,
      "discountValue": 0
    }
  ],
  "paymentMethod": 0,
  "paymentReference": null,
  "notes": "Customer requested gift wrapping"
}
```

**Body Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customerId` | string (GUID) | No | Customer ID (null for anonymous sale) |
| `invoiceType` | integer | Yes | 0=Touch Invoice, 1=Standard Invoice |
| `lineItems` | array | Yes | Array of sale line items (min 1 item) |
| `lineItems[].productId` | string (GUID) | Yes | Product identifier |
| `lineItems[].quantity` | integer | Yes | Quantity sold (min 1) |
| `lineItems[].unitPrice` | decimal | Yes | Unit price at time of sale |
| `lineItems[].discountType` | integer | Yes | 0=None, 1=Percentage, 2=FixedAmount |
| `lineItems[].discountValue` | decimal | Yes | Discount value (0 if no discount) |
| `paymentMethod` | integer | Yes | 0=Cash, 1=Card, 2=DigitalWallet |
| `paymentReference` | string | No | Payment transaction reference |
| `notes` | string | No | Additional notes (max 1000 chars) |

### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "5fc96g86-7939-6784-d5he-4e185h88chi8",
    "transactionId": "TXN-20250121-000123",
    "invoiceNumber": "B001-INV-000123",
    "invoiceType": 1,
    "customerId": null,
    "customerName": null,
    "cashierId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "cashierName": "John Doe",
    "saleDate": "2025-01-21T10:30:00Z",
    "lineItems": [
      {
        "id": "6gd07h97-8a4a-7895-e6if-5f296i99dij9",
        "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "productName": "Wireless Mouse",
        "quantity": 2,
        "unitPrice": 99.99,
        "discountType": 1,
        "discountValue": 10.00,
        "discountedUnitPrice": 89.99,
        "lineTotal": 179.98
      },
      {
        "id": "7he18ia8-9b5b-8906-f7jg-6g3a7j0aejka",
        "productId": "4fb96g75-6828-5673-c4gd-3d074g77bgb7",
        "productName": "Keyboard",
        "quantity": 1,
        "unitPrice": 149.99,
        "discountType": 0,
        "discountValue": 0,
        "discountedUnitPrice": 149.99,
        "lineTotal": 149.99
      }
    ],
    "subtotal": 329.97,
    "taxAmount": 49.50,
    "totalDiscount": 20.00,
    "total": 359.47,
    "paymentMethod": 0,
    "paymentMethodName": "Cash",
    "paymentReference": null,
    "notes": "Customer requested gift wrapping",
    "isVoided": false,
    "createdAt": "2025-01-21T10:30:00Z"
  },
  "message": "Sale created successfully"
}
```

### Error Responses

**400 Bad Request - Validation Error**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "lineItems": ["At least one line item is required"],
        "lineItems[0].quantity": ["Quantity must be greater than 0"]
      }
    }
  }
}
```

**404 Not Found - Product Not Found**:
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID '3fa85f64...' does not exist"
  }
}
```

**409 Conflict - Insufficient Stock**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Product 'Wireless Mouse' has insufficient stock",
    "details": {
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "productName": "Wireless Mouse",
      "requestedQuantity": 5,
      "availableStock": 2
    }
  }
}
```

**Note**: Inventory conflicts during offline sync are handled differently (last-commit-wins with alerting).

---

## GET /sales

List sales transactions with filtering and pagination.

### Request

```http
GET /api/v1/sales?page=1&pageSize=20&dateFrom=2025-01-01&dateTo=2025-01-31&customerId=&cashierId=&invoiceType=&paymentMethod=&isVoided=false
Authorization: Bearer <access_token>
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `pageSize` | integer | No | Items per page (default: 20, max: 100) |
| `dateFrom` | date | No | Filter sales from date (ISO 8601) |
| `dateTo` | date | No | Filter sales to date (ISO 8601) |
| `customerId` | string (GUID) | No | Filter by customer |
| `cashierId` | string (GUID) | No | Filter by cashier |
| `invoiceType` | integer | No | Filter by invoice type (0 or 1) |
| `paymentMethod` | integer | No | Filter by payment method (0, 1, 2) |
| `isVoided` | boolean | No | Filter by voided status (default: false) |
| `search` | string | No | Search transaction ID or invoice number |

### Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "5fc96g86-7939-6784-d5he-4e185h88chi8",
      "transactionId": "TXN-20250121-000123",
      "invoiceNumber": "B001-INV-000123",
      "invoiceType": 1,
      "customerName": "Walk-in Customer",
      "cashierName": "John Doe",
      "saleDate": "2025-01-21T10:30:00Z",
      "total": 359.47,
      "paymentMethod": 0,
      "isVoided": false
    },
    {
      "id": "6gd07h97-8a4a-7895-e6if-5f296i99dij9",
      "transactionId": "TXN-20250121-000122",
      "invoiceNumber": null,
      "invoiceType": 0,
      "customerName": null,
      "cashierName": "Jane Smith",
      "saleDate": "2025-01-21T09:15:00Z",
      "total": 49.99,
      "paymentMethod": 1,
      "isVoided": false
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 2,
    "totalPages": 1
  }
}
```

---

## GET /sales/:id

Get detailed information for a specific sale.

### Request

```http
GET /api/v1/sales/5fc96g86-7939-6784-d5he-4e185h88chi8
Authorization: Bearer <access_token>
```

### Response (200 OK)

Same structure as POST /sales response (detailed sale object with line items).

### Error Responses

**404 Not Found**:
```json
{
  "success": false,
  "error": {
    "code": "SALE_NOT_FOUND",
    "message": "Sale with ID '5fc96g86...' does not exist"
  }
}
```

---

## POST /sales/:id/void

Void (cancel) a sale transaction.

### Request

```http
POST /api/v1/sales/5fc96g86-7939-6784-d5he-4e185h88chi8/void
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "reason": "Customer requested refund"
}
```

**Body Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | Yes | Reason for voiding sale (max 500 chars) |

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "5fc96g86-7939-6784-d5he-4e185h88chi8",
    "transactionId": "TXN-20250121-000123",
    "isVoided": true,
    "voidedAt": "2025-01-21T11:00:00Z",
    "voidedBy": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "voidReason": "Customer requested refund",
    "inventoryRestored": true
  },
  "message": "Sale voided successfully"
}
```

**Business Logic**:
- Inventory levels are restored (quantities added back to stock)
- Customer stats (TotalPurchases, VisitCount) are decremented
- Original sale record is preserved with `isVoided=true`
- Audit log entry created

### Error Responses

**400 Bad Request - Already Voided**:
```json
{
  "success": false,
  "error": {
    "code": "SALE_ALREADY_VOIDED",
    "message": "Sale has already been voided"
  }
}
```

**403 Forbidden - Insufficient Permissions**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Only managers can void sales"
  }
}
```

---

## GET /sales/:id/invoice

Get printable invoice (Touch or Standard format).

### Request

```http
GET /api/v1/sales/5fc96g86-7939-6784-d5he-4e185h88chi8/invoice?format=pdf
Authorization: Bearer <access_token>
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | string | No | Output format: "pdf", "html", "json" (default: "pdf") |

### Response (200 OK) - PDF Format

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Invoice-B001-INV-000123.pdf"

[PDF binary data]
```

### Response (200 OK) - HTML Format

```
Content-Type: text/html

<!DOCTYPE html>
<html>
<head>
  <title>Invoice B001-INV-000123</title>
  <!-- Invoice styles -->
</head>
<body>
  <!-- Touch Invoice or Standard Invoice template -->
</body>
</html>
```

### Response (200 OK) - JSON Format

```json
{
  "success": true,
  "data": {
    "invoiceType": 1,
    "invoiceNumber": "B001-INV-000123",
    "transactionId": "TXN-20250121-000123",
    "branch": {
      "name": "Main Branch",
      "address": "123 Main St, City, Country",
      "phone": "+1234567890",
      "email": "branch@example.com",
      "crn": "CR-123456",
      "taxNumber": "TAX-123456",
      "logoUrl": "/api/images/branches/main/logo.jpg"
    },
    "customer": {
      "name": "John Customer",
      "email": "customer@example.com",
      "phone": "+0987654321",
      "address": "456 Customer St, City, Country"
    },
    "cashier": {
      "name": "Jane Cashier"
    },
    "date": "2025-01-21T10:30:00Z",
    "lineItems": [
      {
        "productName": "Wireless Mouse",
        "quantity": 2,
        "unitPrice": 99.99,
        "discount": "10% off",
        "lineTotal": 179.98
      }
    ],
    "subtotal": 329.97,
    "taxRate": 15.00,
    "taxAmount": 49.50,
    "totalDiscount": 20.00,
    "total": 359.47,
    "paymentMethod": "Cash",
    "notes": "Thank you for your business!"
  }
}
```

---

## GET /sales/stats

Get sales statistics for dashboard/reports.

### Request

```http
GET /api/v1/sales/stats?dateFrom=2025-01-01&dateTo=2025-01-31&branchId=
Authorization: Bearer <access_token>
```

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateFrom` | date | Yes | Start date for statistics (ISO 8601) |
| `dateTo` | date | Yes | End date for statistics (ISO 8601) |
| `branchId` | string (GUID) | No | Filter by branch (head office admins only) |

### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2025-01-01",
      "to": "2025-01-31"
    },
    "totalSales": 125000.00,
    "totalTransactions": 450,
    "averageTransactionValue": 277.78,
    "totalTax": 18750.00,
    "totalDiscounts": 5000.00,
    "salesByPaymentMethod": {
      "cash": 50000.00,
      "card": 60000.00,
      "digitalWallet": 15000.00
    },
    "salesByInvoiceType": {
      "touch": 40000.00,
      "standard": 85000.00
    },
    "topProducts": [
      {
        "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "productName": "Wireless Mouse",
        "quantitySold": 150,
        "totalRevenue": 13498.50
      },
      {
        "productId": "4fb96g75-6828-5673-c4gd-3d074g77bgb7",
        "productName": "Keyboard",
        "quantitySold": 120,
        "totalRevenue": 17998.80
      }
    ],
    "topCashiers": [
      {
        "cashierId": "5fc96g86-7939-6784-d5he-4e185h88chi8",
        "cashierName": "John Doe",
        "totalSales": 45000.00,
        "transactionCount": 150
      }
    ],
    "salesTrend": [
      { "date": "2025-01-01", "sales": 4000.00, "transactions": 15 },
      { "date": "2025-01-02", "sales": 4500.00, "transactions": 18 },
      { "date": "2025-01-03", "sales": 3800.00, "transactions": 14 }
      // ... more daily data
    ]
  }
}
```

---

## Offline Sync Considerations

When sales are created offline and synced later:

1. **Conflict Resolution**: Last-commit-wins strategy
   - Sale is accepted even if inventory went negative
   - Product flagged with `HasInventoryDiscrepancy=true`
   - Manager receives alert to review

2. **Timestamp Preservation**: `saleDate` uses client timestamp (not sync time)

3. **Sequential Numbering**:
   - Touch invoices: `transactionId` generated client-side
   - Standard invoices: `invoiceNumber` generated server-side during sync
   - Gap analysis for invoice numbers performed daily

4. **Sync Endpoint**: Use `/api/v1/sync/transaction` for offline sales

---

## Business Rules

### Invoice Type Selection

- **Touch Invoice**: Default for anonymous sales (customerId=null)
- **Standard Invoice**: Suggested when customer linked, required for B2B

### Discount Validation

- Percentage discounts: 0-100% range
- Fixed amount discounts: Cannot exceed unit price
- Manager approval required for >20% discounts (future enhancement)

### Stock Handling

- Online mode: Check stock availability before creating sale
- Offline mode: Allow negative stock with alert
- Voiding restores inventory immediately

### Customer Stats Update

- `TotalPurchases` += sale total
- `VisitCount` += 1
- `LastVisitAt` = saleDate
- Changes reversed when sale voided

---

## Permissions

| Action | Cashier | Manager | Head Office Admin |
|--------|---------|---------|-------------------|
| Create sale | ✅ | ✅ | ✅ |
| View sales (own) | ✅ | ✅ | ✅ |
| View sales (all) | ❌ | ✅ | ✅ |
| Void sale | ❌ | ✅ | ✅ |
| View statistics | ❌ | ✅ | ✅ |
| Download invoices | ✅ | ✅ | ✅ |
