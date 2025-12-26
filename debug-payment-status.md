# Debug Payment Status Issue

## Steps to Debug

### 1. Check Browser Console
Open browser DevTools (F12) and look for:
- Any red errors in the Console tab
- Failed API calls in the Network tab
- Look for calls to `/api/v1/sales/{id}/payment`

### 2. Check Database
Run this SQL query to verify if payment was saved:

```sql
SELECT 
  TransactionId,
  InvoiceNumber,
  TableNumber,
  Total,
  AmountPaid,
  ChangeReturned,
  PaymentMethod,
  Status,
  CreatedAt
FROM Sales
WHERE TableNumber IS NOT NULL
  AND Status = 'open'
ORDER BY CreatedAt DESC
LIMIT 5;
```

Expected if payment was saved:
- `AmountPaid` should equal `Total`
- `PaymentMethod` should be 1 (credit card)
- `Status` should still be 'open' (until table is cleared)

### 3. Check Table Status
```sql
SELECT
  Number,
  Name,
  Status,
  CurrentSaleId,
  CurrentGuestCount,
  OccupiedAt,
  UpdatedAt
FROM Tables
WHERE Status = 'occupied'
ORDER BY Number;
```

Expected after payment + auto-clear:
- Table should NOT appear in results (Status should be 'available')

### 4. Test Payment Flow Again

1. Create a new order on a different table
2. Open browser DevTools → Network tab
3. Complete payment with credit card
4. Watch for these API calls:
   - `PUT /api/v1/sales/{id}/payment` (should return 200)
   - `POST /api/v1/tables/{number}/clear` (should return 200)
   - `GET /api/v1/tables/status` (refresh tables)
5. Check if any call returns an error

### 5. Backend Logs

Check the backend console for any errors when processing payment.
Look for logs from `UpdateSalePaymentAsync` and `ClearTableAsync`.

## Possible Issues

1. **Payment saved, but table NOT cleared** → Auto-clear failed
2. **Payment NOT saved** → UpdateSalePayment API failed
3. **Payment saved, table cleared, but still shows unpaid** → Frontend refresh issue

