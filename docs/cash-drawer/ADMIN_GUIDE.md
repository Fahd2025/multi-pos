# Multi-POS System - Administrator Guide

**Version:** 1.0
**Last Updated:** 2025-12-30
**Audience:** Branch Managers, System Administrators, Head Office Admins

---

## Table of Contents

1. [System Administration](#system-administration)
2. [User Management](#user-management)
3. [Branch Configuration](#branch-configuration)
4. [Return Policy Configuration](#return-policy-configuration)
5. [Printer Configuration](#printer-configuration)
6. [Inventory Management](#inventory-management)
7. [Reports and Analytics](#reports-and-analytics)
8. [Security and Access Control](#security-and-access-control)
9. [System Monitoring](#system-monitoring)
10. [Backup and Recovery](#backup-and-recovery)

---

## System Administration

### Administrator Roles

| Role | Access Level | Capabilities |
|------|--------------|--------------|
| **HeadOfficeAdmin** | Global | Full system access, manage all branches, users, and settings |
| **Manager** | Branch | Manage branch users, configure branch settings, approve returns |
| **Cashier** | Branch | Process sales, handle returns, view reports |

### Accessing Admin Panel

1. Log in with Manager or Admin credentials
2. Navigate to **Branch → Settings** or **Admin** menu
3. Select the configuration area you need

---

## User Management

### Creating a New User

1. Navigate to **Admin → Users**
2. Click **"Add User"**
3. Enter user details:
   - **Username**: Unique identifier (lowercase, no spaces)
   - **Email**: For password resets and notifications
   - **Name (English & Arabic)**: Full name
   - **Role**: Select Cashier or Manager
   - **Phone**: Contact number
   - **Initial Password**: Temporary password
4. Check **"Require Password Change on First Login"**
5. Click **"Create User"**

**Password Policy:**
- Minimum 8 characters
- Must include: uppercase, lowercase, number
- Cannot reuse last 3 passwords
- Expires every 90 days (configurable)

### Assigning Users to Branches

**For Branch Managers:**
1. Navigate to **Branch → Users**
2. View only users assigned to your branch
3. Add existing users or create new ones

**For Head Office Admins:**
1. Navigate to **Admin → Branch Management**
2. Select branch
3. Click **"Manage Users"**
4. Assign/remove users from branch
5. Set branch-specific roles

### Resetting User Passwords

1. Go to **Users** page
2. Find the user
3. Click **"⋮" → Reset Password**
4. Choose:
   - **Generate Temporary Password**: System creates password
   - **Send Reset Email**: User receives reset link
5. Confirm action
6. Provide temporary password to user (if generated)

### Deactivating Users

**When employee leaves:**

1. Navigate to **Users** page
2. Find the user
3. Click **"⋮" → Deactivate**
4. Confirm deactivation
5. User cannot log in but data is preserved

**Reactivating:**
- Same process, click **"Activate"** instead

### Viewing User Activity

1. Go to **Admin → Audit Log**
2. Filter by:
   - User
   - Date range
   - Action type (Login, Sale, Return, etc.)
3. Export to CSV for analysis

**Tracked Activities:**
- Logins and logouts
- Sales transactions
- Returns processed
- Inventory adjustments
- Configuration changes

---

## Branch Configuration

### Creating a New Branch

**Head Office Admin only:**

1. Navigate to **Admin → Branches**
2. Click **"Add Branch"**
3. Enter branch details:
   - **Branch Code**: Unique 3-6 char code (e.g., NYC01)
   - **Name (English & Arabic)**
   - **Address**: Full address
   - **Phone Number**
   - **Email**
   - **Tax Rate**: Branch-specific tax rate (e.g., 8.5)
   - **Currency**: Default currency (USD, EUR, etc.)
   - **Time Zone**: Branch timezone
4. Configure database:
   - **Provider**: SQLite, SQL Server, PostgreSQL, MySQL
   - **Connection String**: Database connection details
5. Click **"Create Branch"**
6. System initializes branch database automatically

### Branch Settings

1. Navigate to **Branch → Settings**
2. Configure:
   - **Business Information**:
     - Business name, address, tax number
     - Contact information
   - **Tax Configuration**:
     - Tax rate (%)
     - Tax included in prices (yes/no)
   - **Invoice Settings**:
     - Invoice number prefix
     - Auto-generate invoice numbers
     - Default invoice type (Touch/Standard)
   - **Discount Permissions**:
     - Maximum discount % for cashiers
     - Require manager approval above threshold
   - **Offline Mode**:
     - Enable/disable offline sales
     - Auto-sync interval (minutes)

### Branch Hours

1. Go to **Branch → Settings → Hours**
2. Set operating hours for each day:
   - Monday through Sunday
   - Opening time and closing time
   - Mark days as "Closed"
3. Set holiday schedule
4. Save changes

---

## Return Policy Configuration

### Creating Return Policy

1. Navigate to **Branch → Settings → Return Policy**
2. Click **"Configure Policy"**
3. Set policy parameters:

**Return Window:**
- **Max Return Days**: Number of days to accept returns (e.g., 30)
- **Requires Receipt**: Yes/No
- **Requires Manager Approval**: Yes/No for all returns

**Acceptable Conditions:**
- ☑ New (unopened, original packaging)
- ☑ Opened (package opened, unused)
- ☐ Used (product has been used)

**Restocking Fee:**
- **Percentage**: 0-100% (e.g., 15% restocking fee)
- **Apply to All Returns**: Yes/No
- **Waive for Defective Items**: Yes/No

**Refund Methods:**
- ☑ Cash
- ☑ Card Refund
- ☑ Store Credit
- ☐ Check/Bank Transfer
- ☑ Exchange Only

**Additional Settings:**
- **Allow Partial Returns**: Yes/No
- **Exchange Allowed**: Yes/No
- **Require Product in Stock for Return**: Yes/No

4. Click **"Save Policy"**

### Policy Examples

**Strict Policy (Electronics Store):**
- Max return days: 14
- Requires receipt: Yes
- Manager approval: Yes
- Conditions: New only
- Restocking fee: 20%
- Refund methods: Store credit only

**Flexible Policy (Clothing Store):**
- Max return days: 90
- Requires receipt: No (if customer has account)
- Manager approval: No
- Conditions: New, Opened
- Restocking fee: 0%
- Refund methods: All methods

### Approving Returns

1. Navigate to **Branch → Returns**
2. View returns with status **Pending Approval**
3. Click return to view details:
   - Original sale information
   - Items being returned
   - Return reason and notes
   - Customer information
   - Policy compliance check
4. Review and decide:
   - **Approve**: Allow return to proceed
   - **Reject**: Deny return
5. Enter approval notes (especially if rejecting)
6. Click **"Submit Decision"**

**Approval Guidelines:**
- Verify return is within policy window
- Check item condition matches claim
- Verify receipt/proof of purchase
- Escalate unusual cases to head office

---

## Printer Configuration

### Setting Up a Receipt Printer

1. Navigate to **Branch → Settings → Printer**
2. Click **"Configure Printer"**
3. Enter printer details:

**Connection Settings:**
- **Printer Name**: Display name (e.g., "Main Register Printer")
- **Connection Type**: USB, Network, or Bluetooth
- **Printer Model**: Model name (optional)
- **Paper Width**: 58mm or 80mm

**Network Printer (Recommended):**
- **IP Address**: Printer's static IP (e.g., 192.168.1.100)
- **Port**: Typically 9100
- Test connection before saving

**USB Printer:**
- No additional settings needed
- Printer must be connected to POS terminal
- Client-side software may be required

**Receipt Template:**
- **Header Line 1**: Business name
- **Header Line 2**: Address line 1
- **Header Line 3**: Address line 2 or phone
- **Tax Number**: Tax registration number
- **Footer Line 1**: Thank you message
- **Footer Line 2**: Website or contact
- **Footer Line 3**: Return policy summary

**Print Options:**
- ☑ Print Logo: Include business logo (upload required)
- ☑ Print Barcode: Print transaction barcode
- ☐ Print QR Code: Print QR code for digital receipt
- ☑ Auto-Print: Automatically print after sale

4. Click **"Save Configuration"**
5. Click **"Test Print"** to verify

### Troubleshooting Printer Issues

**Network Printer Not Responding:**
1. Verify printer is powered on
2. Check network cable connection
3. Ping printer IP address:
   ```bash
   ping 192.168.1.100
   ```
4. Verify printer is on same network
5. Check firewall settings (port 9100 must be open)
6. Restart printer
7. Update printer firmware if needed

**USB Printer Not Found:**
1. Check USB cable connection
2. Verify printer driver installed
3. Check Windows Device Manager (if Windows)
4. Try different USB port
5. Restart POS terminal

**Print Quality Issues:**
1. Check paper alignment
2. Clean print head
3. Replace paper if damaged
4. Adjust print density settings on printer
5. Replace thermal paper roll

---

## Inventory Management

### Categories

**Creating Categories:**
1. Navigate to **Branch → Inventory → Categories**
2. Click **"Add Category"**
3. Enter:
   - **Code**: Unique category code (e.g., BEV-SOFT)
   - **Name (English & Arabic)**
   - **Description** (optional)
   - **Parent Category**: For subcategories
   - **Display Order**: Sort order in menus
4. Click **"Save"**

**Category Hierarchy:**
- Main Category → Subcategory → Sub-subcategory
- Example: Beverages → Soft Drinks → Cola

### Products

**Adding Products:**
1. Go to **Branch → Inventory → Products**
2. Click **"Add Product"**
3. Enter product information:
   - **SKU**: Stock Keeping Unit code
   - **Barcode**: Product barcode (scan or type)
   - **Name (English & Arabic)**
   - **Description**
   - **Category**: Select from dropdown
   - **Supplier**: Select supplier
   - **Selling Price**: Retail price
   - **Cost Price**: Purchase cost
   - **Unit**: Each, Box, Kg, Liter, etc.
   - **Min Stock Threshold**: Low stock alert level
   - **Initial Stock Level**: Starting quantity
4. Upload product images (optional)
5. Click **"Create Product"**

**Managing Stock Levels:**

**Manual Adjustment:**
1. Find product
2. Click **"Adjust Stock"**
3. Select adjustment type:
   - **Add**: Increase stock
   - **Remove**: Decrease stock
   - **Set**: Set exact amount
4. Enter quantity and reason
5. Confirm

**Via Purchase Orders:**
1. Navigate to **Inventory → Purchases**
2. Click **"Create Purchase"**
3. Select supplier
4. Add line items (products and quantities)
5. Enter cost prices
6. Save as **Pending**
7. When shipment arrives:
   - Click **"Receive Purchase"**
   - Verify quantities
   - Stock automatically updated

### Low Stock Alerts

1. Go to **Inventory → Low Stock**
2. View products below minimum threshold
3. Click product to:
   - Adjust stock level
   - Create purchase order
   - Update minimum threshold

---

## Reports and Analytics

### Sales Reports

**Daily Sales Report:**
1. Navigate to **Reports → Sales**
2. Select **"Daily Report"**
3. Choose date
4. View metrics:
   - Total sales
   - Transaction count
   - Average transaction value
   - Payment method breakdown
   - Hourly sales distribution
5. Export to PDF or Excel

**Sales by Product:**
1. Go to **Reports → Product Performance**
2. Select date range
3. View:
   - Top selling products
   - Revenue by product
   - Quantity sold
   - Profit margins
4. Sort by revenue, quantity, or profit

**Sales by Category:**
- Similar to product report
- Groups sales by category
- Shows category contribution to revenue

### Cash Drawer Reports

**Drawer History:**
1. Navigate to **Reports → Cash Drawer**
2. Select date range
3. View all drawer sessions:
   - Opening/closing times
   - Opening/closing balances
   - Expected cash
   - Actual cash counted
   - Variance (over/short)
   - Cashier name

**Variance Analysis:**
- Identify patterns in cash discrepancies
- Track by cashier
- Set acceptable variance thresholds
- Investigate large discrepancies

### Inventory Reports

**Stock Level Report:**
- Current stock for all products
- Value of inventory
- Products at or below minimum threshold

**Stock Movement Report:**
- Stock in (purchases)
- Stock out (sales)
- Stock adjustments
- Current balance

**Inventory Valuation:**
- Total inventory value at cost
- Total inventory value at selling price
- Potential profit

### Return Reports

1. Go to **Reports → Returns**
2. View:
   - Total returns by date range
   - Return reasons breakdown
   - Return rate (% of sales)
   - Refund methods used
   - Products most frequently returned

### Custom Reports

1. Navigate to **Reports → Custom**
2. Select:
   - Report type
   - Date range
   - Filters (category, product, cashier, etc.)
   - Group by (day, week, month, product, etc.)
3. Preview results
4. Export to PDF, Excel, or CSV

---

## Security and Access Control

### Role-Based Permissions

| Permission | Cashier | Manager | Admin |
|------------|---------|---------|-------|
| Process Sales | ✅ | ✅ | ✅ |
| Void Sales | ❌ | ✅ | ✅ |
| Process Returns | ✅ | ✅ | ✅ |
| Approve Returns | ❌ | ✅ | ✅ |
| Adjust Inventory | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ✅ (Branch) | ✅ (All) |
| Configure Settings | ❌ | ✅ (Branch) | ✅ (All) |
| View All Reports | ❌ | ✅ | ✅ |
| Manage Branches | ❌ | ❌ | ✅ |

### Password Management

**Enforcing Strong Passwords:**
1. Navigate to **Admin → Settings → Security**
2. Configure password policy:
   - Minimum length (8-16 characters)
   - Complexity requirements
   - Password expiration (30-180 days)
   - Password history (prevent reuse)
   - Failed login attempts lockout (3-10 attempts)
3. Save policy

**Two-Factor Authentication (2FA):**
1. Go to **Admin → Settings → Security**
2. Enable 2FA for roles:
   - ☑ Require for Managers
   - ☑ Require for Admins
   - ☐ Optional for Cashiers
3. Users set up 2FA on next login using authenticator app

### Audit Logging

**Viewing Audit Logs:**
1. Navigate to **Admin → Audit Log**
2. Filter by:
   - User
   - Action type
   - Date range
   - IP address
3. Export logs for compliance

**Logged Events:**
- User authentication (login/logout/failed attempts)
- Configuration changes
- Data modifications (sales, returns, inventory)
- Report access
- Permission changes

### Session Management

**Session Timeout:**
- Inactive sessions expire after 30 minutes (configurable)
- User must log in again
- Unsaved work may be lost

**Concurrent Sessions:**
- Users can have only ONE active session
- New login terminates previous session
- Prevents account sharing

---

## System Monitoring

### Health Dashboard

1. Navigate to **Admin → System Health**
2. Monitor:
   - **System Status**: Online/Offline
   - **Database Status**: Connected/Error
   - **API Response Time**: Average latency
   - **Active Users**: Current user count
   - **Pending Sync Queue**: Offline transactions waiting to sync
   - **Last Backup**: Timestamp of last backup

### Performance Metrics

**Key Indicators:**
- **Average Transaction Time**: Should be <5 seconds
- **Database Query Time**: Should be <100ms
- **API Response Time**: Should be <500ms
- **Error Rate**: Should be <0.1%

**Alerts:**
- High error rate
- Slow response times
- Database connection issues
- Disk space low
- Backup failures

### Database Status

1. Go to **Admin → Database**
2. View:
   - **Database Size**: Current size and growth trend
   - **Total Records**: Count by entity type
   - **Pending Migrations**: Database schema updates
   - **Orphaned Records**: Data cleanup needed
3. Actions:
   - Run migrations
   - Optimize database
   - Clean up old data
   - Export backup

---

## Backup and Recovery

### Automated Backups

**Configuring Backups:**
1. Navigate to **Admin → Settings → Backup**
2. Set backup schedule:
   - **Frequency**: Daily, Weekly, Monthly
   - **Time**: Off-peak hours (e.g., 2:00 AM)
   - **Retention**: Keep last 30 days (configurable)
3. Configure backup location:
   - Local disk
   - Network drive
   - Cloud storage (AWS S3, Azure Blob)
4. Enable backup notifications
5. Save configuration

**Backup Contents:**
- All sales data
- Customer information
- Inventory and products
- User accounts and settings
- Audit logs

### Manual Backup

1. Go to **Admin → Backup**
2. Click **"Create Backup Now"**
3. Enter backup description
4. Choose backup type:
   - **Full Backup**: All data
   - **Incremental**: Changes since last backup
5. Click **"Start Backup"**
6. Monitor progress
7. Download backup file when complete

### Restore from Backup

**⚠️ WARNING: This will overwrite current data**

1. Navigate to **Admin → Backup → Restore**
2. Select backup file:
   - Upload from computer, OR
   - Select from backup history
3. Review backup details:
   - Backup date
   - Data included
   - File size
4. Confirm restore
5. System performs restore
6. Verify data after restore

**Best Practices:**
- Always test restores on a separate system first
- Notify all users before restore
- System will be unavailable during restore
- Verify data integrity after restore

### Disaster Recovery

**In case of complete system failure:**

1. **Provision new server/infrastructure**
2. **Install application** (Backend + Frontend)
3. **Restore latest backup**:
   - Database restore
   - File storage restore
   - Configuration restore
4. **Verify functionality**:
   - Test logins
   - Test sales processing
   - Test reporting
5. **Resume operations**

**Recovery Time Objective (RTO):** 4 hours
**Recovery Point Objective (RPO):** 24 hours (last backup)

---

## Maintenance Tasks

### Daily Tasks
- ✅ Review sales reports
- ✅ Check cash drawer variances
- ✅ Review pending returns
- ✅ Monitor low stock alerts

### Weekly Tasks
- ✅ Review user activity logs
- ✅ Check system health metrics
- ✅ Verify backup completion
- ✅ Process inventory adjustments
- ✅ Generate weekly sales report

### Monthly Tasks
- ✅ User access review (remove inactive users)
- ✅ Inventory audit and reconciliation
- ✅ Performance optimization
- ✅ Review and update return policy
- ✅ Security audit
- ✅ Database cleanup (archive old data)

### Quarterly Tasks
- ✅ Full system backup and test restore
- ✅ Update user documentation
- ✅ Review and update pricing
- ✅ Supplier performance review
- ✅ System upgrade planning

---

## Troubleshooting

### Common Admin Issues

**Users Cannot Log In:**
1. Check if account is active
2. Verify password hasn't expired
3. Check for account lockout (too many failed attempts)
4. Reset password if needed

**Reports Not Generating:**
1. Check date range (ensure data exists)
2. Verify user has permission to view report
3. Check database connection
4. Try different browser
5. Clear browser cache

**Sync Queue Growing:**
1. Check network connectivity
2. Verify API is online
3. Review failed sync attempts
4. Manually trigger sync
5. Contact support if persistent

**Printer Configuration Not Saving:**
1. Verify all required fields completed
2. Test printer connection first
3. Check IP address format (network printer)
4. Try from different browser
5. Check user permissions

---

## Best Practices

### User Management
- ✅ Use strong, unique passwords
- ✅ Enable 2FA for all admin accounts
- ✅ Regularly review user access
- ✅ Remove access immediately when employees leave
- ✅ Use least privilege principle (grant minimum permissions needed)

### Data Management
- ✅ Daily backups before closing
- ✅ Test restore monthly
- ✅ Archive old data (older than 2 years)
- ✅ Regular database optimization
- ✅ Monitor disk space

### Security
- ✅ Keep software updated
- ✅ Use HTTPS only
- ✅ Review audit logs weekly
- ✅ Restrict admin access to trusted devices
- ✅ Use VPN for remote administration

### Performance
- ✅ Monitor system health daily
- ✅ Optimize database quarterly
- ✅ Clear old logs and temporary data
- ✅ Upgrade hardware when needed
- ✅ Use indexed searches

---

## Support and Contact

### Internal Support
- **Level 1**: Branch Manager
- **Level 2**: Head Office IT
- **Level 3**: System Administrator
- **Level 4**: Vendor Support

### Emergency Contacts
- **System Down**: IT Helpdesk - (555) 123-4567
- **Security Incident**: Security Team - (555) 123-4568
- **After Hours Support**: On-Call Admin - (555) 123-4569

### Documentation
- User Guide: `docs/USER_GUIDE.md`
- Operations Runbook: `docs/OPERATIONS.md`
- Deployment Guide: `docs/DEPLOYMENT_CHECKLIST.md`
- API Documentation: `/swagger` endpoint

---

**Document Version:** 1.0
**Last Updated:** 2025-12-30
**Next Review:** 2026-03-30

---

© 2025 Multi-POS System. All rights reserved.
