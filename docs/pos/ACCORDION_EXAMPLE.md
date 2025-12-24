# Accordion Design Implementation for TransactionDialogV2

This document shows how to implement the accordion/collapsible design for the right column.

## Key Changes Made:

1. **Added CSS Classes** in `Pos2.module.css`:
   - `.collapsibleSection` - Main container with border and rounded corners
   - `.collapsibleHeader` - Clickable header with hover effects
   - `.collapsibleTitle` - Title with icon
   - `.collapsibleBadge` - Optional badge for status indicators
   - `.collapsibleContent` - Expandable content area
   - `.collapsibleDivider` - Divider between sections
   - `.secondaryBtn`, `.primaryBtn`, `.dangerBtn`, `.successBtn` - Improved button styles

2. **State Management**:
   - Changed from `showCustomerSearch` to `customerSectionExpanded`
   - Changed from `showTableSelector` to `tableSectionExpanded`
   - These control the accordion expand/collapse state

## Example Accordion Structure:

```tsx
{/* Customer Accordion Section */}
<div className={styles.collapsibleSection}>
  {/* Accordion Header - Always visible */}
  <div
    className={`${styles.collapsibleHeader} ${customerSectionExpanded ? styles.active : ''}`}
    onClick={() => setCustomerSectionExpanded(!customerSectionExpanded)}
  >
    <div className={styles.collapsibleTitle}>
      <Users size={18} />
      <span>Customer Details</span>
      {customer.name && (
        <span className={styles.collapsibleBadge}>
          {customer.name}
        </span>
      )}
    </div>
    {customerSectionExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
  </div>

  {/* Accordion Content - Expands/Collapses */}
  <div className={`${styles.collapsibleContent} ${customerSectionExpanded ? styles.expanded : ''}`}>
    {/* Search Input */}
    <div style={{ position: "relative", marginBottom: "12px" }}>
      <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
      <input
        type="text"
        placeholder="Search customers..."
        className={styles.formInput}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ paddingLeft: "40px" }}
      />
    </div>

    {/* Action Buttons */}
    <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
      <button className={styles.primaryBtn} style={{ flex: 1 }}>
        <UserPlus size={16} />
        <span>New Customer</span>
      </button>
      {customer.name && (
        <button className={styles.dangerBtn}>
          <X size={14} />
          <span>Clear</span>
        </button>
      )}
    </div>

    <div className={styles.collapsibleDivider} />

    {/* Customer List or Form */}
    {searchResults.length > 0 && (
      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
        {/* Customer items */}
      </div>
    )}
  </div>
</div>
```

## Styling Features:

### Collapsible Section:
- Border: `1px solid var(--border-color)`
- Hover effect: Blue border and subtle shadow
- Smooth transitions

### Collapsible Header:
- Clickable with pointer cursor
- Background changes on hover
- Active state when expanded (blue background tint)
- Flex layout with space-between
- Border-bottom appears when expanded

### Collapsible Content:
- Smooth max-height animation
- Hidden when collapsed (max-height: 0)
- Visible when expanded (max-height: 800px)
- Padding animates with content

### Buttons:
- **Primary**: Blue background, white text
- **Secondary**: Gray background, bordered
- **Danger**: Red border, transparent background
- **Success**: Green background, white text
- All have hover effects and scale animation on click

## Benefits:

1. **Better Organization**: Each section is clearly defined with borders
2. **Space Efficient**: Sections collapse when not in use
3. **Visual Hierarchy**: Headers are always visible
4. **Improved UX**: Smooth animations and clear interaction cues
5. **Touch Friendly**: Large click targets
6. **Responsive**: Works on all screen sizes
7. **Accessible**: Clear visual states and keyboard navigation

## Next Steps:

To fully implement this design:

1. Wrap each major section (Customer, Table) in `.collapsibleSection`
2. Add the header with chevron icon
3. Wrap content in `.collapsibleContent` with conditional `.expanded` class
4. Use the new button classes for all action buttons
5. Add dividers between logical groups
6. Add status badges to show selected items in the header
