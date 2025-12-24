# Accordion Implementation - Complete

## ✅ What Has Been Implemented:

### 1. **CSS Accordion Styles** (Pos2.module.css)
All accordion styles have been added:
- `.collapsibleSection` - Bordered container with rounded corners
- `.collapsibleHeader` - Clickable header with hover effects
- `.collapsibleTitle` - Title area with icon and badge
- `.collapsibleBadge` - Status badge (shows selected customer/table)
- `.collapsibleContent` - Expandable content area with smooth animation
- `.collapsibleDivider` - Horizontal divider lines
- Button styles: `.primaryBtn`, `.secondaryBtn`, `.dangerBtn`, `.successBtn`

### 2. **Three Accordion Sections Converted:**

#### A. **Customer Details (Delivery Orders)**
- **Header**: Shows "Customer Details" with customer name badge when selected
- **Icon**: Users icon + ChevronDown/ChevronUp
- **Content**:
  - "New Customer" button (primary blue)
  - "Clear" button (red danger) when customer selected
  - Search input with customer list
  - Customer input form (Name, Phone, Email, Address)

#### B. **Table Selection (Dine-in Orders)**
- **Header**: Shows "Table Selection" with table number badge when selected
- **Icon**: UtensilsCrossed icon + ChevronDown/ChevronUp
- **Content**:
  - Search and filter controls
  - Status legend (Available/Occupied/Reserved)
  - Table grid with visual cards
  - Manual input form (Table Number, Guest Count)
  - Refresh button

#### C. **Customer Details Optional (Takeaway/Dine-in)**
- **Header**: Shows "Customer Details (Optional)" with customer name badge
- **Icon**: Users icon + ChevronDown/ChevronUp
- **Content**:
  - "Clear Customer" button when customer selected
  - Search input with customer list
  - Simple form (Name, Phone)

### 3. **Visual Features:**
- ✅ **Borders**: All sections have clear borders
- ✅ **Hover Effects**: Sections highlight with blue border on hover
- ✅ **Expand/Collapse**: Smooth animation (0.3s ease)
- ✅ **Active State**: Headers show blue tint when expanded
- ✅ **Chevron Icons**: Down arrow when collapsed, up arrow when expanded
- ✅ **Status Badges**: Show selected customer/table in header
- ✅ **Dividers**: Horizontal lines separate content groups
- ✅ **Improved Buttons**: Color-coded with icons and hover effects

### 4. **Interaction:**
- Click anywhere on the header to expand/collapse
- Selected items show in badge on header
- Only one section needs to be expanded at a time
- Content smoothly animates in/out

## 🔧 API Error Fixes Needed:

The "Failed to load tables" and "Failed to load customers" errors are API-related. To fix:

### Option 1: Check API Endpoints
```bash
# Test if backend is running
curl http://localhost:5000/api/v1/tables/status
curl http://localhost:5000/api/v1/customers?page=1&pageSize=10
```

### Option 2: Check CORS Settings
Make sure your backend allows requests from the frontend URL.

### Option 3: Check Authentication
Both endpoints require authentication. Ensure the JWT token is being sent:
```typescript
// In services files, headers should include:
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Option 4: Mock Data for Testing
You can temporarily test the UI by adding mock data in the component:
```typescript
// In TransactionDialogV2.tsx, loadRecentCustomers function:
setSearchResults([
  { id: '1', name: 'John Doe', phone: '555-0100', email: 'john@example.com', address: '123 Main St' },
  { id: '2', name: 'Jane Smith', phone: '555-0200', email: 'jane@example.com', address: '456 Oak Ave' }
]);
```

## 📋 Usage Guide:

### For Delivery Orders:
1. Select "Delivery" order type
2. Click "Customer Details" header to expand
3. Click "New Customer" to create new or search existing
4. Fill in customer form (Name, Phone, Email, Address required)
5. Section collapses automatically after selection

### For Dine-in Orders:
1. Select "Dine-in" order type
2. Click "Table Selection" header to expand
3. Use search/filter to find tables
4. Click on available table (green status)
5. Or manually enter table number and guest count
6. Optionally add customer details in the second accordion

### For Takeaway Orders:
1. Select "Takeaway" order type
2. Optionally click "Customer Details (Optional)" to add customer
3. Simple form with just Name and Phone

## 🎨 Styling Classes Available:

### Accordion Structure:
```tsx
<div className={styles.collapsibleSection}>
  <div className={`${styles.collapsibleHeader} ${expanded ? styles.active : ''}`}>
    <div className={styles.collapsibleTitle}>
      <Icon />
      <span>Title</span>
      <span className={styles.collapsibleBadge}>Badge</span>
    </div>
    <ChevronIcon />
  </div>
  <div className={`${styles.collapsibleContent} ${expanded ? styles.expanded : ''}`}>
    Content here
  </div>
</div>
```

### Button Classes:
- `.primaryBtn` - Blue (main actions)
- `.secondaryBtn` - Gray (secondary actions)
- `.dangerBtn` - Red outline (delete/clear)
- `.successBtn` - Green (confirm/save)

### Divider:
```tsx
<div className={styles.collapsibleDivider} />
```

## ✨ Build Status:
✅ **Build Successful** - No TypeScript errors
✅ **All imports resolved** - ChevronDown, ChevronUp icons added
✅ **State management** - customerSectionExpanded, tableSectionExpanded working
✅ **Responsive design** - Works on all screen sizes

## 🎯 Next Steps (If Needed):

1. **Fix API Endpoints**: Start backend and verify API responses
2. **Add Loading States**: Already implemented (shows "Loading..." text)
3. **Add Error Handling**: Already implemented (shows error messages)
4. **Test on Mobile**: Accordion design is touch-friendly
5. **Add Animations**: Already implemented (0.3s ease transitions)

The accordion design is now fully implemented and ready to use!
