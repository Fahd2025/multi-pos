# Multi-POS System - User Guide

**Version:** 1.0
**Last Updated:** 2025-12-30
**Audience:** Cashiers, Sales Staff, Branch Users

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Cash Drawer Management](#cash-drawer-management)
3. [Processing Sales](#processing-sales)
4. [Handling Returns](#handling-returns)
5. [Using the Barcode Scanner](#using-the-barcode-scanner)
6. [Printing Receipts](#printing-receipts)
7. [Customer Management](#customer-management)
8. [Table Management (Dine-In)](#table-management)
9. [Delivery Orders](#delivery-orders)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Logging In

1. Open the POS application in your web browser
2. Enter your **username** and **password**
3. Click **"Login"**
4. You will be directed to your branch dashboard

**First Time Login:**
- Username: Provided by your manager
- Default Password: Change immediately after first login

### Understanding Your Dashboard

After logging in, you'll see:
- **Sales Summary**: Today's sales total and transaction count
- **Cash Drawer Status**: Open/Closed indicator
- **Pending Orders**: Orders awaiting completion
- **Low Stock Alerts**: Products running low on inventory

---

## Cash Drawer Management

### Opening the Cash Drawer

**Required:** Must be done at the start of each shift

1. Navigate to **Branch → Cash Drawer**
2. Click **"Open Drawer"**
3. Count the starting cash in the drawer
4. Enter the **Opening Balance** (e.g., $200.00)
5. Click **"Confirm"**

**Important:**
- Only ONE drawer can be open per branch at a time
- You cannot process cash sales if the drawer is closed
- The opening balance should match your actual cash count

### During the Shift

The system automatically tracks:
- ✅ All cash sales (added to expected cash)
- ✅ Petty cash withdrawals (removed from expected cash)
- ✅ Deposits (added to expected cash)
- ✅ Cash refunds for returns (removed from expected cash)

**Adding Petty Cash Transaction:**

1. Go to **Cash Drawer** page
2. Click **"Add Transaction"**
3. Select type:
   - **Withdrawal**: Taking cash out (e.g., for office supplies)
   - **Deposit**: Adding cash in (e.g., from another register)
4. Enter **Amount** and **Reason**
5. Click **"Submit"**

### Closing the Cash Drawer

**Required:** Must be done at the end of each shift

1. Navigate to **Branch → Cash Drawer**
2. Click **"Close Drawer"**
3. Count the actual cash in the drawer
4. Enter denominations:
   - **Bills**: $100, $50, $20, $10, $5, $1
   - **Coins**: $1.00, $0.50, $0.25, $0.10, $0.05, $0.01
5. System auto-calculates the total
6. Review the **Variance** (difference between expected and actual)
   - **Green**: Exact match (no variance)
   - **Yellow**: Small variance (within $5)
   - **Red**: Large variance (over $5) - Manager approval required
7. Click **"Close Drawer"**

**Reconciliation Report:**
- Shows opening balance, all transactions, and closing balance
- Print or export to PDF for your records
- Manager will review variances over threshold

---

## Processing Sales

### Standard Sale (Touch Mode)

1. Navigate to **POS** page
2. Search for products:
   - **Search Bar**: Type product name or SKU
   - **Barcode Scanner**: Scan product barcode
   - **Category Browse**: Click category → select product
3. Click product to add to cart
4. Adjust quantity if needed (use +/- buttons)
5. Apply discounts (if authorized):
   - **Line Item Discount**: Click discount icon on item
   - **Invoice Discount**: Click "Apply Discount" button
6. Select **Payment Method**:
   - Cash
   - Card
   - Digital Wallet
   - Bank Transfer
   - **Multiple** (for split payments)
7. For **Cash Payment**:
   - Enter amount received
   - System calculates change
8. Click **"Complete Sale"**
9. Receipt prints automatically (if auto-print enabled)

### Split Payment Sale

**Example:** Customer pays $50 cash + $30 card

1. Add products to cart as normal
2. Click **"Split Payment"**
3. For each payment:
   - Select payment method
   - Enter amount
   - Enter reference (for card/digital payments)
   - Click **"Add Payment"**
4. Continue until total is fully paid
5. Click **"Complete Sale"**

**Validation:**
- ✅ Total payments must equal sale total
- ✅ All payment amounts must be positive
- ❌ Cannot proceed if payments don't match total

### Invoice Sale (Standard Mode)

1. Select **"Standard Invoice"** mode
2. Add products to cart
3. Optional: Select **Customer** from dropdown
4. Optional: Add **Notes** for the sale
5. Complete payment as usual
6. System generates invoice number (e.g., INV-0001)
7. Receipt shows invoice number

### Dine-In Orders (Table Service)

1. Navigate to **POS → Tables**
2. Click on available table
3. Enter **Guest Count**
4. Add products to order
5. Optional: Add order to kitchen queue
6. Choose payment timing:
   - **Pay Now**: Complete payment immediately
   - **Pay Later**: Save as pending order
7. When ready to close:
   - Select table → Click "Complete Order"
   - Process payment
   - Table status changes to "Available"

### Takeout Orders

1. Select **Order Type**: Takeout
2. Add products to cart
3. Optional: Enter customer phone number
4. Process payment
5. Print receipt with order number
6. Hand order to customer

### Delivery Orders

1. Select **Order Type**: Delivery
2. Add products to cart
3. Enter delivery information:
   - Customer name and phone
   - Delivery address
   - Special instructions
4. Process payment or mark as "Pay on Delivery"
5. Assign to driver (if integrated)
6. Track delivery status

---

## Handling Returns

### Processing a Return

**Requirements:**
- Original receipt or invoice number
- Product in acceptable condition
- Within return window (check branch policy)

**Steps:**

1. Navigate to **Branch → Returns**
2. Click **"Create Return"**
3. Enter original sale details:
   - Invoice number, OR
   - Transaction ID, OR
   - Customer phone number
4. System displays original sale
5. Select items to return:
   - Check the item
   - Enter quantity to return
   - Select condition (New, Opened, Used)
6. Select **Return Reason**:
   - Defective/Damaged
   - Wrong Item
   - Customer Changed Mind
   - Quality Issue
   - Expired
   - Other
7. Add notes (optional)
8. Click **"Submit Return Request"**

**What Happens Next:**
- Return status: **Pending Approval**
- Manager reviews and approves/rejects
- You'll be notified when approved
- Process refund once approved

### Processing an Approved Return

1. Go to **Returns** page
2. Find return with status **Approved**
3. Click **"Process Refund"**
4. Select **Refund Method**:
   - **Cash**: Refund from cash drawer
   - **Card**: Process card refund
   - **Store Credit**: Issue credit note
5. Verify refund amount
6. Click **"Complete Refund"**
7. If cash refund: Give customer the cash
8. If store credit: Print credit note for customer
9. Return status changes to **Completed**

**Store Credit Notes:**
- Valid for future purchases
- Can be used like cash at checkout
- Check expiry date on credit note

### Exchange Processing

**Example:** Customer returns Item A, wants Item B instead

1. Process return as usual (steps above)
2. After refund approved, create new sale:
   - Add new item(s) to cart
   - Apply store credit if issued
   - Collect any additional payment needed
3. Complete both transactions

---

## Using the Barcode Scanner

### USB Barcode Scanner (Keyboard Wedge)

**Setup:**
1. Connect scanner to USB port
2. Scanner acts like a keyboard
3. No additional software needed

**Usage:**
1. Click in product search box (or anywhere in POS)
2. Scan product barcode
3. Product automatically added to cart
4. Scan next product

**Tips:**
- Scanner types barcode then presses "Enter"
- Works in any text field (search, quantity, etc.)
- Some scanners have continuous scan mode

### Camera Barcode Scanner (Mobile/Tablet)

1. Click **"Scan Barcode"** button in POS
2. Allow camera access (first time only)
3. Point camera at barcode
4. Hold steady until detected
5. Product automatically added
6. Camera closes after scan

**Supported Formats:**
- EAN-13 (most common retail)
- UPC-A/UPC-E
- Code-128
- Code-39

**Troubleshooting:**
- ❌ **Won't Scan**: Ensure barcode is clean and not damaged
- ❌ **Wrong Product**: Verify barcode matches product
- ❌ **Not Found**: Product may not be in system - use manual search

---

## Printing Receipts

### Auto-Print (Default)

If enabled, receipts print automatically after sale completion.

### Manual Print

1. Complete sale
2. Click **"Print Receipt"** button
3. Receipt sends to configured printer

### Reprint Receipt

1. Navigate to **Branch → Sales**
2. Find the sale (search by transaction ID or date)
3. Click **"View Details"**
4. Click **"Print Receipt"**

### Receipt Contents

Standard receipt shows:
- **Header**: Business name, address, tax number
- **Transaction Info**: Date, transaction ID, invoice number
- **Customer**: Name (if provided)
- **Line Items**: Products, quantities, prices, discounts
- **Totals**: Subtotal, discounts, tax, total
- **Payments**: Payment methods and amounts
- **Barcode**: Transaction ID barcode
- **Footer**: Thank you message

### Printer Issues

**Receipt Won't Print:**
1. Check printer power and paper
2. Verify USB/network connection
3. Try **Test Print** from printer settings
4. Contact manager if issue persists

**Partial Print:**
- Check paper roll (may be ending)
- Replace paper if low
- Reprint receipt

---

## Customer Management

### Adding a New Customer

1. Navigate to **Branch → Customers**
2. Click **"Add Customer"**
3. Enter required information:
   - Name (English)
   - Name (Arabic) - optional
   - Phone Number
   - Email - optional
   - Address - optional
4. Click **"Save"**

### Finding a Customer

1. In POS, click **"Select Customer"**
2. Search by:
   - Name
   - Phone number
   - Customer ID
3. Click customer to select

### Customer Benefits

When a customer is linked to a sale:
- ✅ Easier returns processing
- ✅ Purchase history tracking
- ✅ Loyalty points (if enabled)
- ✅ Personalized receipts

---

## Table Management

### Viewing Table Status

1. Navigate to **POS → Tables**
2. View color-coded tables:
   - **Green**: Available
   - **Red**: Occupied
   - **Yellow**: Reserved

### Opening a Table

1. Click available table
2. Enter **Guest Count**
3. Start adding items
4. Order saved to table

### Adding Items to Table

1. Select occupied table
2. Add more items to order
3. Items automatically added to existing order
4. Kitchen receives updated order

### Transferring Orders

**Example:** Customers move from Table 5 to Table 10

1. Navigate to **Tables** page
2. Click **"Transfer Order"**
3. Select **Source Table** (Table 5)
4. Select **Destination Table** (Table 10)
5. Click **"Transfer"**
6. Order moves to new table
7. Source table becomes available

### Closing a Table

1. Select occupied table
2. Click **"Complete Order"**
3. Review order items and total
4. Process payment
5. Table automatically becomes available

---

## Delivery Orders

### Creating Delivery Order

1. Select **Order Type**: Delivery
2. Add products to cart
3. Click **"Add Delivery Info"**
4. Enter:
   - Customer name
   - Customer phone
   - Delivery address
   - Pickup address (if different)
   - Special instructions
   - Estimated delivery time
   - Priority (Normal, High, Urgent)
5. Process payment or select "Pay on Delivery"
6. Click **"Create Order"**

### Tracking Deliveries

1. Navigate to **Branch → Delivery Orders**
2. View order status:
   - **Pending**: Awaiting driver assignment
   - **Assigned**: Driver assigned
   - **Out for Delivery**: Driver en route
   - **Delivered**: Completed
   - **Cancelled**: Order cancelled
3. Click order to view details or update status

---

## Troubleshooting

### Common Issues

#### Cannot Process Sale - Drawer Closed
**Solution:** Open cash drawer first (Branch → Cash Drawer → Open Drawer)

#### Product Not Found
**Solutions:**
- Check spelling in search
- Try scanning barcode instead
- Browse by category
- Contact manager if product is missing from system

#### Receipt Won't Print
**Solutions:**
1. Check printer power and paper
2. Verify connection (USB cable or network)
3. Run test print from settings
4. Restart printer
5. Contact manager or IT support

#### Split Payment Not Adding Up
**Solution:**
- Check that sum of payments = sale total
- System prevents completion if mismatch
- Review payment amounts and correct

#### Customer Return Rejected
**Reasons:**
- Outside return window
- Product condition not acceptable
- No receipt/proof of purchase
- Restricted item
**Action:** Explain policy to customer, escalate to manager if needed

#### System Running Slow
**Solutions:**
- Close unused browser tabs
- Clear browser cache
- Restart browser
- Contact IT support if persistent

#### Forgot Password
**Solution:**
- Contact manager for password reset
- Manager can reset via user management

### Emergency Procedures

#### Power Outage During Sale
1. Wait for power to restore
2. Check if sale was completed (check transaction log)
3. If incomplete, re-create sale when power returns
4. Offline mode may have saved pending transactions

#### Network Connection Lost
1. System should queue transactions for offline mode
2. Complete sale normally
3. Sales sync automatically when connection restored
4. Check sync status in settings

#### Printer Failure During Rush Hour
1. Continue processing sales
2. Note transaction IDs that need receipts
3. Reprint receipts when printer is fixed
4. Use backup printer if available

---

## Best Practices

### Start of Shift
- ✅ Log in with your credentials
- ✅ Open cash drawer with accurate count
- ✅ Test printer (print test receipt)
- ✅ Check scanner functionality
- ✅ Review any pending orders

### During Shift
- ✅ Process each customer professionally
- ✅ Double-check quantities and prices
- ✅ Apply discounts only with authorization
- ✅ Keep workspace clean and organized
- ✅ Ask for customer information when appropriate

### End of Shift
- ✅ Complete all pending sales
- ✅ Close cash drawer with accurate count
- ✅ Print reconciliation report
- ✅ Report any discrepancies to manager
- ✅ Log out securely

### Customer Service
- ✅ Greet every customer
- ✅ Explain return policies when asked
- ✅ Offer receipt (some customers decline)
- ✅ Thank customers for their business
- ✅ Handle complaints professionally, escalate to manager when needed

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F1` | Open help |
| `F2` | Focus search bar |
| `F9` | Open cash drawer |
| `F12` | Complete sale |
| `Ctrl + K` | Clear cart |
| `Ctrl + D` | Apply discount |
| `Ctrl + P` | Print receipt |
| `Esc` | Close dialog |

---

## Getting Help

### In-App Help
- Click **?** icon in top-right corner
- Access tooltips by hovering over icons
- Watch tutorial videos (if available)

### Contact Support
- **Manager**: For daily operational issues
- **IT Support**: For technical problems
- **Admin**: For account/permission issues

### Training Resources
- User manual (this document)
- Video tutorials
- Manager-led training sessions
- Peer shadowing for new staff

---

## Appendix

### Payment Method Codes

| Code | Method |
|------|--------|
| 0 | Cash |
| 1 | Card (Credit/Debit) |
| 2 | Digital Wallet (Apple Pay, Google Pay) |
| 3 | Bank Transfer |
| 4 | Multiple (Split Payment) |

### Order Type Codes

| Code | Type |
|------|------|
| 0 | Takeout |
| 1 | Dine-In |
| 2 | Delivery |

### Return Reasons

- Defective/Damaged
- Wrong Item
- Customer Changed Mind
- Quality Issue
- Expired Product
- Other (with notes)

### Product Condition Codes

- **New**: Unopened, original packaging
- **Opened**: Package opened, product unused
- **Used**: Product has been used

---

**Document Version:** 1.0
**Last Updated:** 2025-12-30
**Feedback:** Report issues or suggestions to your manager

---

© 2025 Multi-POS System. All rights reserved.
