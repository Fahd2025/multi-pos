# Branch User Synchronization & Authentication Refactoring

**Date:** 2025-12-13
**Status:** Implemented

## Overview

This document details the refactoring of the authentication and user management system to prioritize `BranchUser` logic and remove dependencies on the deprecated `UserAssignment` table. The goal was to establish a robust, synched user management system where the Head Office acts as the primary source of truth, while Branch databases maintain local copies for offline resilience.

## Core Architecture

### 1. User Management (Source of Truth)

- **Head Office Database (`BranchUser` table):** This is the master record for all branch-specific users. All creates/updates start here.
- **Branch Database (`User` table):** A local copy of the user data exists in each branch database. This allows the POS to function offline.

**⚠️ Critical Inconsistency (2025-12-13):**
The `BranchUserService` was recently reverted to write **only** to the Branch Database (`User` table). However, `AuthService` authenticates against the Head Office Database (`BranchUser` table).

- **Impact:** New users created via the API are not written to Head Office, so they cannot log in.
- **Remediation Required:** Restore the dual-write logic in `BranchUserService` and update `UserEndpoints` dependencies.

### 2. Dual-Write Strategy (Temporarily Disabled)

_Previously implemented, now disabled:_ When a user is created or updated via the `BranchUserService` (Branch Context):

1.  **Write to Head Office:** The operation is first executed against `HeadOfficeDbContext.BranchUsers`.
2.  **Write to Branch:** Immediately following success in Head Office, the change is written to the local `BranchDbContext.Users`.
    - _Note:_ If the branch write fails, the operation bubbles up an exception (and in a production scenario, might trigger a rollback or queueing mechanism, though currently implementation implies consistency via the background sync).

### 3. Background Synchronization

A new background service, `BranchUserSyncService`, runs periodically (default: 1 hour) to reconcile differences.

- **Direction:** Head Office -> Branch (One-way sync).
- **Logic:**
  - Fetches all active branches.
  - For each branch, compares `BranchUser` (Head Office) vs `User` (Branch).
  - Creates missing users in the Branch DB.
  - Updates modified users (checking fields like Email, Role, Active Status, PasswordHash).

## Key Components Implementation

### Authentication (`AuthService.cs`)

- **Login Flow:**
  1.  Checks if `BranchCode` is present in request.
  2.  If yes, authenticates against `HeadOffice.BranchUser`.
  3.  If successful, generates JWT with branch claims.
  4.  **Admin Feature:** If a Head Office Admin logs into a branch, `SyncAdminToBranchAsync` is called to ensure their user record exists locally in the branch DB before the token is issued. This prevents foreign key errors during transactions.

### Branch User Service (`Services/Branch/Users/UserService.cs`)

- Refactored to inject `HeadOfficeDbContext` and `IHttpContextAccessor`.
- `GetUsers`: Queries Head Office `BranchUsers` directly.
- `Create/Update`: Implements the dual-write logic described above.

### Legacy User Service (`Services/HeadOffice/Users/UserService.cs`)

- Removed all `UserAssignment` logic.
- `AssignBranchAsync` and `RemoveBranchAssignmentAsync` now throw `NotSupportedException`.

### Endpoints (`UserEndpoints.cs`)

- Updated dependency injection to manually instantiate `UserService` with the required `HeadOfficeDbContext` and `IHttpContextAccessor`.

## File Manifest

| File Path                                              | Description                                               |
| ------------------------------------------------------ | --------------------------------------------------------- |
| `Backend/Services/HeadOffice/Auth/AuthService.cs`      | Refactored login logic, added admin sync.                 |
| `Backend/Services/Branch/Users/BranchUserService.cs`   | Implemented dual-write logic.                             |
| `Backend/Services/Background/BranchUserSyncService.cs` | **New File.** Handles background reconciliation.          |
| `Backend/Services/HeadOffice/Users/UserService.cs`     | Deprecated legacy assignment logic.                       |
| `Backend/Endpoints/UserEndpoints.cs`                   | Fixed DI construction for branch user service.            |
| `Backend/Program.cs`                                   | Registered `BranchUserSyncService` and DI configurations. |

## Future Considerations

- **Transactions:** Currently, the dual-write is not in a distributed transaction. The background sync covers failures, but an outbox pattern could be more robust.
- **Webhooks:** Updates from Head Office Dashboard (if built) would need to trigger branch updates, potentially via SignalR or API calls to the branch.
