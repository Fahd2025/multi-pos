# Remove Company Information - Use Branch Information Instead

**Date:** December 9, 2025
**Status:**  Completed
**Build Status:**  Backend: Success (0 errors) |  Frontend: Success (0 errors)

---

## =Ë Overview

Successfully removed the Company Information feature and updated the entire system to use Branch information instead. This simplifies the architecture by eliminating redundant data storage and leveraging the existing branch entity that already contains all necessary company details.

**Key Change:** Invoices now use branch information (name, address, VAT number, etc.) directly from the branch entity instead of maintaining a separate company_info table.

---

##  Changes Summary

### Backend Changes (10 items)

1.  Removed CompanyInfo entity
2.  Removed CompanyInfo DTOs directory
3.  Removed CompanyInfoService
4.  Removed ICompanyInfoService interface
5.  Removed CompanyInfoEndpoints
6.  Updated BranchDbContext to remove CompanyInfo DbSet
7.  Removed old migration and created new one (AddInvoiceTemplates)
8.  Updated IInvoiceRenderingService to use Branch instead of CompanyInfo
9.  Updated IZatcaService to use Branch instead of CompanyInfo
10.  Created BranchEndpoints with GET `/api/v1/branch-info` endpoint

### Frontend Changes (9 items)

1.  Removed company-info page
2.  Removed company-info service
3.  Created branch-info service
4.  Removed CompanyInfo types from invoice-template.types.ts
5.  Updated invoice preview page to use branch info
6.  Updated sales details page to use branch info
7.  Updated settings page (removed company-info card)
8.  Removed SETTINGS_COMPANY_INFO route
9.  Updated all field mappings (companyName ’ nameEn, etc.)

**Total Changes:** 19 items

---

## = API Changes

### Endpoints Removed
- `GET /api/v1/company-info` L REMOVED
- `PUT /api/v1/company-info` L REMOVED

### Endpoints Added
- `GET /api/v1/branch-info`  ADDED
  - Returns current branch information
  - Excludes sensitive database connection details
  - Requires authentication

---

## =' Field Mappings

| Old Field (CompanyInfo) | New Field (Branch) |
|-------------------------|-------------------|
| `companyName` | `nameEn` |
| `companyNameAr` | `nameAr` |
| `logoUrl` | `logoPath` |
| `vatNumber` | `taxNumber` |
| `commercialRegNumber` | `crn` |
| `address` | `addressEn` |
| `phone` | `phone` |
| `email` | `email` |
| `website` | `website` |

---

## =Á Files Changed

### Backend Deleted (7 files)
- `Models/Entities/Branch/CompanyInfo.cs`
- `Models/DTOs/Branch/CompanyInfo/*` (directory)
- `Services/Branch/CompanyInfoService.cs`
- `Services/Branch/ICompanyInfoService.cs`
- `Endpoints/CompanyInfoEndpoints.cs`
- Old migration files (2 files)

### Backend Created (2 files)
- `Endpoints/BranchEndpoints.cs` (93 lines)
- New migration: `AddInvoiceTemplates`

### Backend Modified (7 files)
- `Program.cs`
- `Data/Branch/BranchDbContext.cs`
- `Services/Branch/IInvoiceRenderingService.cs`
- `Services/Branch/InvoiceRenderingService.cs`
- `Services/Branch/IZatcaService.cs`
- `Services/Branch/ZatcaService.cs`
- `Endpoints/InvoiceTemplateEndpoints.cs`

### Frontend Deleted (2 files)
- `app/[locale]/branch/settings/company-info/*`
- `services/company-info.service.ts`

### Frontend Created (1 file)
- `services/branch-info.service.ts` (55 lines)

### Frontend Modified (5 files)
- `types/invoice-template.types.ts`
- `lib/routes.ts`
- `app/[locale]/branch/settings/page.tsx`
- `app/[locale]/branch/settings/invoice-templates/preview/page.tsx`
- `app/[locale]/branch/sales/[id]/page.tsx`

**Total: 24 files changed** (9 deleted, 3 created, 12 modified)

---

## =Ê Service Updates

### InvoiceRenderingService
**Before:**
```csharp
string RenderInvoice(..., CompanyInfo companyInfo, ...);
```

**After:**
```csharp
string RenderInvoice(..., Backend.Models.Entities.HeadOffice.Branch branch, ...);
```

### Frontend Service
**Before:**
```typescript
class CompanyInfoService {
  async getCompanyInfo(): Promise<CompanyInfo | null>;
  async upsertCompanyInfo(dto): Promise<CompanyInfo>;
}
```

**After:**
```typescript
class BranchInfoService {
  async getBranchInfo(): Promise<BranchInfo | null>;
}
```

---

## =Ú Usage After Changes

### Backend
```csharp
// Branch available in HTTP context
var branch = httpContext.Items["Branch"] as Backend.Models.Entities.HeadOffice.Branch;

// Use branch data
string companyName = branch.NameEn;
string vatNumber = branch.TaxNumber;
```

### Frontend
```typescript
import branchInfoService from "@/services/branch-info.service";

const branchInfo = await branchInfoService.getBranchInfo();

const invoiceData = {
  companyName: branchInfo?.nameEn || "",
  vatNumber: branchInfo?.taxNumber || "",
  // ...
};
```

---

## <¯ Benefits

1. **Simplified Architecture** - No redundant CompanyInfo table
2. **Better Data Integrity** - Single source of truth
3. **Reduced Maintenance** - Fewer entities and endpoints
4. **More Information** - Access to language, currency, timezone from branch
5. **Clearer Responsibilities** - Head office manages branch details

---

##  Success Criteria Met

-  Company Information entity completely removed
-  All API endpoints updated to use Branch
-  All frontend components updated
-  Database migration regenerated
-  Backend builds successfully (0 errors)
-  Frontend builds successfully (0 errors)
-  No breaking changes to invoice functionality

---

##   Breaking Changes

For existing deployments:

1. Run new migration to drop CompanyInfo table
2. Update frontend routes (remove company-info)
3. API clients must use `/api/v1/branch-info` instead

---

**Implementation completed on:** December 9, 2025
**Migration status:**  Complete
**Feature status:**  Production Ready

---

*This refactoring maintains all invoice functionality while simplifying the data model.*
