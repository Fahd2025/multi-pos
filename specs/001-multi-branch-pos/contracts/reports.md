# Reports API Contract

**Feature**: Multi-Branch POS System
**Domain**: Reporting & Analytics
**Version**: v1

## Overview

The Reports API provides comprehensive reporting and analytics capabilities for sales, inventory, and financial data. Reports can be filtered by date range, branch, and other criteria, and exported in multiple formats (PDF, Excel, CSV).

## Base URL

```
/api/v1/reports
```

## Endpoints

### GET /api/v1/reports/sales

Generate a sales report with optional filters.

**Authorization**: Requires authentication. Branch Managers see their branch data, Head Office Admins see all branches.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | ISO 8601 DateTime | No | Report start date (default: 30 days ago) |
| `endDate` | ISO 8601 DateTime | No | Report end date (default: now) |
| `branchId` | GUID | No | Filter by branch (Head Office Admin only) |
| `cashierId` | GUID | No | Filter by cashier |
| `customerId` | GUID | No | Filter by customer |
| `paymentMethod` | String | No | Filter by payment method (Cash, Card, Both) |
| `groupBy` | String | No | Group results by: day, week, month (default: day) |

**Success Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "reportType": "sales",
    "generatedAt": "2025-11-28T10:30:00Z",
    "dateRange": {
      "startDate": "2025-10-01T00:00:00Z",
      "endDate": "2025-11-28T23:59:59Z"
    },
    "filters": {
      "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "branchName": "Branch 001",
      "paymentMethod": "Cash"
    },
    "summary": {
      "totalSales": 150,
      "totalRevenue": 45750.50,
      "totalTax": 6862.58,
      "totalDiscount": 2287.53,
      "averageSaleValue": 305.00,
      "topPaymentMethod": "Cash",
      "salesByPaymentMethod": {
        "Cash": {
          "count": 95,
          "amount": 29000.00
        },
        "Card": {
          "count": 50,
          "amount": 15250.50
        },
        "Both": {
          "count": 5,
          "amount": 1500.00
        }
      }
    },
    "timeSeriesData": [
      {
        "period": "2025-11-01",
        "salesCount": 25,
        "totalRevenue": 7625.00,
        "totalTax": 1143.75,
        "averageSaleValue": 305.00
      },
      {
        "period": "2025-11-02",
        "salesCount": 30,
        "totalRevenue": 9150.00,
        "totalTax": 1372.50,
        "averageSaleValue": 305.00
      }
    ],
    "topProducts": [
      {
        "productId": "abc123",
        "productName": "Product A",
        "quantitySold": 45,
        "totalRevenue": 4500.00
      },
      {
        "productId": "def456",
        "productName": "Product B",
        "quantitySold": 38,
        "totalRevenue": 3800.00
      }
    ],
    "topCustomers": [
      {
        "customerId": "cust001",
        "customerName": "John Doe",
        "purchaseCount": 12,
        "totalSpent": 3660.00
      }
    ]
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid date range or filter parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions (e.g., branch manager accessing another branch)

---

### GET /api/v1/reports/inventory

Generate an inventory report with stock levels, movements, and product performance.

**Authorization**: Requires authentication. Branch Managers see their branch data, Head Office Admins see all branches.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `branchId` | GUID | No | Filter by branch (Head Office Admin only) |
| `categoryId` | GUID | No | Filter by category |
| `lowStockOnly` | Boolean | No | Show only products below minimum stock threshold |
| `negativeStockOnly` | Boolean | No | Show only products with negative stock (discrepancies) |
| `includeMovements` | Boolean | No | Include stock movement details (default: false) |
| `startDate` | ISO 8601 DateTime | No | Movement start date (if includeMovements=true) |
| `endDate` | ISO 8601 DateTime | No | Movement end date (if includeMovements=true) |

**Success Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "reportType": "inventory",
    "generatedAt": "2025-11-28T10:30:00Z",
    "filters": {
      "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "branchName": "Branch 001",
      "lowStockOnly": false,
      "negativeStockOnly": false
    },
    "summary": {
      "totalProducts": 250,
      "totalCategories": 15,
      "totalStockValue": 125000.00,
      "lowStockCount": 12,
      "outOfStockCount": 3,
      "negativeStockCount": 2,
      "averageStockValue": 500.00
    },
    "products": [
      {
        "productId": "abc123",
        "sku": "PROD-001",
        "productName": "Product A",
        "categoryName": "Category 1",
        "currentStock": 45,
        "minStockThreshold": 10,
        "unitPrice": 100.00,
        "stockValue": 4500.00,
        "status": "In Stock",
        "lastRestockedAt": "2025-11-20T14:30:00Z"
      },
      {
        "productId": "def456",
        "sku": "PROD-002",
        "productName": "Product B",
        "categoryName": "Category 2",
        "currentStock": 5,
        "minStockThreshold": 10,
        "unitPrice": 75.00,
        "stockValue": 375.00,
        "status": "Low Stock",
        "lastRestockedAt": "2025-11-15T10:00:00Z"
      },
      {
        "productId": "ghi789",
        "sku": "PROD-003",
        "productName": "Product C",
        "categoryName": "Category 1",
        "currentStock": -2,
        "minStockThreshold": 15,
        "unitPrice": 50.00,
        "stockValue": -100.00,
        "status": "Negative Stock",
        "lastRestockedAt": "2025-11-10T08:00:00Z",
        "discrepancyFlag": true
      }
    ],
    "stockMovements": [
      {
        "date": "2025-11-28",
        "productId": "abc123",
        "productName": "Product A",
        "type": "Sale",
        "quantityChange": -5,
        "referenceId": "sale-12345",
        "notes": "Sold via POS"
      },
      {
        "date": "2025-11-27",
        "productId": "def456",
        "productName": "Product B",
        "type": "Purchase",
        "quantityChange": 20,
        "referenceId": "purchase-789",
        "notes": "Restocked from Supplier A"
      }
    ]
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid filter parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions

---

### GET /api/v1/reports/financial

Generate a financial report showing revenue, expenses, and profit.

**Authorization**: Requires authentication. Branch Managers see their branch data, Head Office Admins see all branches.

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | ISO 8601 DateTime | No | Report start date (default: current month start) |
| `endDate` | ISO 8601 DateTime | No | Report end date (default: now) |
| `branchId` | GUID | No | Filter by branch (Head Office Admin only) |
| `groupBy` | String | No | Group results by: day, week, month (default: month) |

**Success Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "reportType": "financial",
    "generatedAt": "2025-11-28T10:30:00Z",
    "dateRange": {
      "startDate": "2025-11-01T00:00:00Z",
      "endDate": "2025-11-28T23:59:59Z"
    },
    "filters": {
      "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "branchName": "Branch 001"
    },
    "summary": {
      "totalRevenue": 45750.50,
      "totalExpenses": 12500.00,
      "grossProfit": 33250.50,
      "profitMargin": 72.68,
      "netProfit": 33250.50,
      "taxCollected": 6862.58,
      "averageDailyRevenue": 1634.66
    },
    "revenueBreakdown": {
      "sales": 45750.50,
      "other": 0
    },
    "expenseBreakdown": [
      {
        "categoryName": "Rent",
        "totalAmount": 5000.00,
        "percentage": 40.00
      },
      {
        "categoryName": "Utilities",
        "totalAmount": 2500.00,
        "percentage": 20.00
      },
      {
        "categoryName": "Salaries",
        "totalAmount": 3000.00,
        "percentage": 24.00
      },
      {
        "categoryName": "Supplies",
        "totalAmount": 2000.00,
        "percentage": 16.00
      }
    ],
    "timeSeriesData": [
      {
        "period": "2025-11-01",
        "revenue": 7625.00,
        "expenses": 1000.00,
        "profit": 6625.00,
        "profitMargin": 86.88
      },
      {
        "period": "2025-11-02",
        "revenue": 9150.00,
        "expenses": 1500.00,
        "profit": 7650.00,
        "profitMargin": 83.61
      }
    ]
  }
}
```

**Error Responses**:

- `400 Bad Request`: Invalid date range or filter parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions

---

### POST /api/v1/reports/export

Export a report in PDF, Excel, or CSV format.

**Authorization**: Requires authentication. Branch Managers can export their branch reports, Head Office Admins can export any report.

**Request Body**:

```json
{
  "reportType": "sales",
  "format": "pdf",
  "startDate": "2025-10-01T00:00:00Z",
  "endDate": "2025-11-28T23:59:59Z",
  "filters": {
    "branchId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentMethod": "Cash"
  },
  "options": {
    "includeCharts": true,
    "includeDetails": true,
    "pageOrientation": "landscape"
  }
}
```

**Request Body Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reportType` | String | Yes | Report type: "sales", "inventory", "financial" |
| `format` | String | Yes | Export format: "pdf", "excel", "csv" |
| `startDate` | ISO 8601 DateTime | No | Report start date |
| `endDate` | ISO 8601 DateTime | No | Report end date |
| `filters` | Object | No | Report-specific filters (same as GET endpoints) |
| `options` | Object | No | Export options (format-specific) |

**Success Response** (200 OK):

Returns the file directly with appropriate Content-Type and Content-Disposition headers.

**Response Headers**:

```
Content-Type: application/pdf (or application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, or text/csv)
Content-Disposition: attachment; filename="sales-report-2025-11-28.pdf"
```

**Error Responses**:

- `400 Bad Request`: Invalid report type, format, or parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Export generation failed

**Supported Export Formats**:

1. **PDF**: Full-featured report with charts, tables, and styling
   - Options: `includeCharts` (bool), `includeDetails` (bool), `pageOrientation` ("portrait" or "landscape")

2. **Excel**: Structured data with multiple sheets for summary and details
   - Options: `includeCharts` (bool), `sheetNames` (array of strings)

3. **CSV**: Simple comma-separated values format
   - Options: `delimiter` (string, default: ","), `includeHeaders` (bool, default: true)

---

## Data Models

### ReportSummary

```typescript
interface ReportSummary {
  totalSales: number;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  averageSaleValue: number;
  topPaymentMethod: string;
  salesByPaymentMethod: Record<string, { count: number; amount: number }>;
}
```

### InventorySummary

```typescript
interface InventorySummary {
  totalProducts: number;
  totalCategories: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  negativeStockCount: number;
  averageStockValue: number;
}
```

### FinancialSummary

```typescript
interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  profitMargin: number;
  netProfit: number;
  taxCollected: number;
  averageDailyRevenue: number;
}
```

---

## Business Rules

1. **Date Range Validation**:
   - If no dates provided, default to last 30 days for sales reports, current month for financial reports
   - End date must be after start date
   - Maximum date range: 1 year

2. **Permission Rules**:
   - Cashiers: No access to reports
   - Branch Managers: Access to their branch reports only
   - Head Office Admins: Access to all branch reports and consolidated reports

3. **Data Aggregation**:
   - `groupBy=day`: Daily aggregation
   - `groupBy=week`: Weekly aggregation (Monday as week start)
   - `groupBy=month`: Monthly aggregation

4. **Export Limitations**:
   - PDF exports limited to 1000 rows
   - Excel exports limited to 10,000 rows
   - CSV exports limited to 50,000 rows
   - Large exports are queued and sent via email (future enhancement)

5. **Performance**:
   - Reports are cached for 5 minutes per unique filter combination
   - Real-time data refreshes on cache expiry
   - Background jobs generate large reports asynchronously (future enhancement)

---

## Testing

### Test Scenarios

1. **Sales Report Generation**:
   - Generate report with date range filter
   - Generate report with payment method filter
   - Generate report grouped by day, week, month
   - Verify top products and customers are accurate

2. **Inventory Report Generation**:
   - Generate full inventory report
   - Filter by low stock only
   - Filter by negative stock only
   - Verify stock movements are included when requested

3. **Financial Report Generation**:
   - Generate monthly financial report
   - Verify revenue, expenses, and profit calculations
   - Verify expense breakdown by category

4. **Report Export**:
   - Export each report type as PDF
   - Export each report type as Excel
   - Export each report type as CSV
   - Verify file downloads correctly with proper filename

5. **Authorization**:
   - Verify Branch Manager can only access their branch reports
   - Verify Head Office Admin can access all branch reports
   - Verify Cashier cannot access reports (403 Forbidden)

---

## Notes

- All monetary amounts are in the branch's configured currency
- All dates and times are in UTC (ISO 8601 format)
- Reports include branch timezone information for display purposes
- Multi-branch consolidated reports aggregate data across all branches (Head Office Admin only)
- Future enhancements: Scheduled report generation, email delivery, custom report templates
