# Migration UI - Visual Layout Guide

## 🎨 Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER SECTION                                                          │
│                                                                         │
│  Branch Migrations                      [Apply to All] [Undo All] ←──  │
│  Manage database migrations...                ↑             ↑          │
│                                               │             │          │
│                                     (Appears when    (Appears when     │
│                                      pending exist)  applied exist)    │
├─────────────────────────────────────────────────────────────────────────┤
│ STATISTICS CARDS                                                        │
│                                                                         │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │
│  │ Total  │  │Complete│  │Pending │  │ Failed │  │Progress│          │
│  │   6    │  │   5    │  │   1    │  │   0    │  │   0    │          │
│  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘          │
├─────────────────────────────────────────────────────────────────────────┤
│ FILTERS SECTION                                                         │
│                                                                         │
│  [Search branches...    ] [Status: All ▼] [↻ Refresh]                 │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ BRANCH CARDS                                                            │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐ ▼   │
│  │ B001 Branch  [B001]                                          │     │
│  │ ● Completed  🔒 Locked (if applicable)                       │     │
│  │                                                               │     │
│  │ Last Migration: 20251221180927_AddTableManagement...         │     │
│  │ Last Attempt: Dec 21, 2025, 06:30 PM                         │     │
│  │                                                               │     │
│  │ ▼ EXPANDED SECTION (click arrow to show/hide)                │     │
│  │ ┌──────────────────────────────────────────────────────────┐ │     │
│  │ │ [Apply Migrations (2)] [View History]                    │ │     │
│  │ │ [Pending Migrations (2)] [Validate Schema]               │ │     │
│  │ │ [Undo Last Migration] ← Red button, destructive action   │ │     │
│  │ └──────────────────────────────────────────────────────────┘ │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐ ▶   │
│  │ MySQL Branch  [mysql]                                         │     │
│  │ ● Failed                                                      │     │
│  │                                                               │     │
│  │ Last Migration: 20251217000000_UpdateDeliveryStatus...       │     │
│  │ Last Attempt: Dec 21, 2025, 06:25 PM                         │     │
│  │                                                               │     │
│  │ ⚠ Error Details:                                             │     │
│  │   Duplicate column name 'TableId'                            │     │
│  │                                                               │     │
│  │ (Collapsed - click ▶ to expand)                              │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Button Color Guide

### Global Buttons (Header)
| Button | Color | When Visible | Action |
|--------|-------|--------------|--------|
| **Apply to All Branches** | 🔵 Blue | At least 1 pending | Opens dialog to apply to all |
| **Undo All Branches** | 🔴 Red | At least 1 applied | Rollback all branches |

### Per-Branch Buttons (Expanded Card)
| Button | Color | When Visible | Action |
|--------|-------|--------------|--------|
| **Apply Migrations (X)** | 🔵 Blue | Pending exists & not locked | Apply to this branch |
| **View History** | ⚫ Gray | Always | Show applied/pending list |
| **Pending Migrations (X)** | 🟣 Purple | Pending exists | Show detailed pending list |
| **Validate Schema** | 🟢 Green | Always | Verify database integrity |
| **Undo Last Migration** | 🔴 Red | Applied exists & not locked | Rollback this branch |

---

## 🎬 Interaction Flow: Single Branch Rollback

```
User Action                        System Response
═══════════════                    ═══════════════════════════════════

1. Click expand arrow (▼)    →    Branch card expands showing buttons

2. Click "Undo Last Migration" →  Confirmation dialog appears:
                                   ┌────────────────────────────────┐
                                   │ Rollback Migration             │
                                   ├────────────────────────────────┤
                                   │ Are you sure you want to       │
                                   │ rollback the last migration    │
                                   │ for "B001"? This action        │
                                   │ cannot be undone.              │
                                   │                                │
                                   │   [Cancel]      [Rollback]     │
                                   └────────────────────────────────┘

3. Click "Rollback" button    →    Dialog shows spinner/loading
                                   Backend processes rollback
                                   Database migration reversed

4. Backend completes          →    Toast notification appears:
                                   ┌────────────────────────────────┐
                                   │ ✅ Rollback Successful         │
                                   │ Successfully rolled back       │
                                   │ migration for "B001"           │
                                   └────────────────────────────────┘

5. Auto-refresh triggered     →    Branch card updates:
                                   - "Last Migration" changes
                                   - Status may change
                                   - Button visibility may change
```

---

## 🎬 Interaction Flow: All Branches Rollback

```
User Action                        System Response
═══════════════                    ═══════════════════════════════════

1. Click "Undo All Branches"  →    Confirmation dialog appears:
   (in header)                     ┌────────────────────────────────┐
                                   │ Rollback All Branches          │
                                   ├────────────────────────────────┤
                                   │ Are you sure you want to       │
                                   │ rollback the last migration    │
                                   │ for ALL active branches?       │
                                   │ This action cannot be undone   │
                                   │ and will affect all branches   │
                                   │ simultaneously.                │
                                   │                                │
                                   │   [Cancel]   [Rollback All]    │
                                   └────────────────────────────────┘

2. Click "Rollback All"       →    Dialog shows spinner
                                   Backend processes ALL branches
                                   (B001, B002, B003, mssql, mysql,
                                    postgres)

3. Backend completes          →    Toast notification appears:
                                   ┌────────────────────────────────┐
                                   │ ✅ Rollback Successful         │
                                   │ Successfully rolled back       │
                                   │ migrations for all branches    │
                                   └────────────────────────────────┘

4. Auto-refresh triggered     →    ALL branch cards update:
                                   - Each "Last Migration" changes
                                   - Statistics cards update
                                   - Button visibility may change
```

---

## 📱 Status Badge Colors

| Status | Color | Badge Text | Meaning |
|--------|-------|------------|---------|
| ✅ Completed | 🟢 Green | Completed | All migrations applied |
| ⏳ Pending | 🟡 Yellow | Pending | Migrations waiting to apply |
| ❌ Failed | 🔴 Red | Failed | Migration error (< 3 retries) |
| ⚠️ Manual | 🟠 Orange | Manual Intervention | Failed after 3 retries |
| 🔄 InProgress | 🔵 Blue | In Progress | Currently migrating |

---

## 🔒 Lock State Indicators

When a branch is locked (during operation):

```
┌──────────────────────────────────────────────────┐
│ B001 Branch  [B001]                              │
│ ● Completed  🔒 Locked   ← Lock icon displayed   │
│                                                  │
│ Last Migration: 20251221180927...                │
│ Last Attempt: Dec 21, 2025, 06:30 PM             │
│                                                  │
│ ▼ EXPANDED SECTION                               │
│ ┌────────────────────────────────────────────┐   │
│ │ [Apply Migrations (2) - DISABLED]          │   │
│ │ [View History] [Validate Schema]           │   │
│ │ [Undo Last Migration - DISABLED]           │   │
│ │                                            │   │
│ │ Lock expires at: Dec 21, 2025, 06:40 PM   │   │
│ └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

**Note:** Disabled buttons appear grayed out and unclickable.

---

## 🎯 Quick Reference: Where to Find Rollback

### For a Single Branch:
1. **Navigate to:** `http://localhost:3000/head-office/migrations`
2. **Find the branch card** you want to rollback
3. **Click the expand arrow (▼)** on the right side
4. **Look for the red button:** "Undo Last Migration"
5. ⚠️ **If you don't see it:**
   - Branch has no applied migrations, OR
   - Branch is currently locked, OR
   - Card is not expanded

### For All Branches:
1. **Navigate to:** `http://localhost:3000/head-office/migrations`
2. **Look at the top-right corner** of the header section
3. **Find the red button:** "Undo All Branches"
4. ⚠️ **If you don't see it:**
   - No branches have any applied migrations yet

---

## 🔥 Common Questions

### Q: Can I rollback multiple migrations at once?
**A:** No, the UI only supports rolling back the **last** applied migration. To rollback multiple migrations, you need to click "Undo Last Migration" multiple times (once per migration).

### Q: Can I rollback to a specific migration?
**A:** Not through the UI. The UI only supports rolling back the most recent migration. For specific migration rollbacks, you would need to use backend scripts or EF Core commands.

### Q: What happens if rollback fails?
**A:**
- The branch status changes to "Failed"
- Error details are displayed on the branch card
- Toast notification shows the error
- The database remains in its previous state (rollback is transactional)

### Q: How long does rollback take?
**A:** Usually 2-10 seconds per branch, depending on:
- Database provider (SQLite is fastest)
- Migration complexity
- Network latency (for remote databases)

### Q: Can I cancel a rollback in progress?
**A:** No, once the rollback starts, it must complete. The operation is atomic and transactional.

---

## 📸 Screenshot Annotations (Conceptual)

```
===========================================
|  Branch Migrations          [Apply to All] [Undo All]  |
|  Manage database migrations...              ↑       ↑   |
|                                         Blue    Red    |
===========================================
|  [Total: 6] [Completed: 5] [Pending: 1] ...           |
===========================================
|  Search: [___________]  Status: [All ▼]  [Refresh]    |
===========================================
|                                                        |
|  ┌─ B001 Branch [B001] ──────────────────────┐  [▼]  |
|  │ ● Completed                                 │       |
|  │ Last Migration: 20251221180927_Add...      │       |
|  │ Last Attempt: Dec 21, 2025, 06:30 PM       │       |
|  │                                             │       |
|  │ ─── EXPANDED ────────────────────────────  │       |
|  │ [Apply Migrations (2)] Blue button         │       |
|  │ [View History] Gray button                 │       |
|  │ [Pending Migrations (2)] Purple button     │       |
|  │ [Validate Schema] Green button             │       |
|  │ [Undo Last Migration] ← Red button! THIS!  │       |
|  └─────────────────────────────────────────────┘       |
|                                                        |
===========================================
```

**Key Takeaway:** The red "Undo Last Migration" button is in the **expanded section** of each branch card.

---

**Created:** 2025-12-21
**Purpose:** Visual guide to help users locate and use rollback features
