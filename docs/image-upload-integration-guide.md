# Image Upload Integration Guide

**Date**: 2025-11-26
**Purpose**: Guide for integrating image upload functionality into entity forms
**Related Tasks**: T274-T279

## Overview

This guide explains how to add image upload functionality to entity forms (Products, Categories, Customers, Suppliers, Branches, Expenses) using the `ImageUpload` component and `imageService`.

## Prerequisites

- ✅ `ImageUpload` component (`frontend/components/shared/ImageUpload.tsx`)
- ✅ `OptimizedImage` component (`frontend/components/shared/OptimizedImage.tsx`)
- ✅ `imageService` (`frontend/services/image.service.ts`)
- ✅ Backend image endpoints (POST /upload, GET /serve, DELETE /delete)

## Integration Pattern

### 1. Import Required Dependencies

```tsx
import { ImageUpload } from "@/components/shared/ImageUpload";
import imageService from "@/services/image.service";
import { useAuth } from "@/hooks/useAuth"; // For getting branch info
```

### 2. Add State for Image Handling

```tsx
const [selectedImages, setSelectedImages] = useState<File[]>([]);
const [uploadingImages, setUploadingImages] = useState(false);
const { user } = useAuth(); // Get current user/branch
```

### 3. Modify Form Submission to Include Image Upload

```tsx
const handleSubmit = async (data: any) => {
  setIsSubmitting(true);

  try {
    // 1. Create/Update the entity first
    const entityResult = product
      ? await inventoryService.updateProduct(product.id, productData)
      : await inventoryService.createProduct(productData);

    // 2. Upload images if any selected
    if (selectedImages.length > 0 && user?.branchName) {
      setUploadingImages(true);
      await imageService.uploadMultipleImages(
        user.branchName,
        "Products", // Entity type
        entityResult.id,
        selectedImages
      );
    }

    onSuccess();
    onClose();
  } catch (error) {
    console.error("Error:", error);
  } finally {
    setIsSubmitting(false);
    setUploadingImages(false);
  }
};
```

### 4. Add ImageUpload Component to Form

There are two approaches:

#### Approach A: Add to Existing Modal (Recommended for Simple Cases)

```tsx
<FeaturedDialog
  {/* ... existing props ... */}
/>

{/* Add ImageUpload below the modal */}
{isOpen && (
  <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800  border-t p-4 z-50">
    <ImageUpload
      branchName={user?.branchName || ''}
      entityType="Products"
      entityId={product?.id}
      currentImages={product?.images || []}
      multiple={true}
      maxFiles={5}
      onUpload={setSelectedImages}
      label="Product Images"
    />
  </div>
)}
```

#### Approach B: Create Custom Form Component (Recommended for Complex Cases)

```tsx
// Create a new component that combines form and image upload
export function ProductFormWithImages({ ... }) {
  return (
    <div className="modal-container">
      {/* Form fields */}
      <div className="form-section">
        {/* Render form fields manually or use FeaturedDialog */}
      </div>

      {/* Image upload section */}
      <div className="image-section mt-4">
        <ImageUpload
          branchName={user?.branchName || ''}
          entityType="Products"
          entityId={product?.id}
          currentImages={product?.images || []}
          multiple={true}
          maxFiles={5}
          onUpload={setSelectedImages}
          label="Product Images"
        />
      </div>

      {/* Submit button */}
      <button onClick={handleSubmit}>
        {isSubmitting || uploadingImages ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}
```

## Entity-Specific Integration

### T274: Products (Multiple Images)

**Entity Type**: `Products`
**Multiple Images**: Yes
**Max Files**: 5
**Use Case**: Product catalog with multiple views

```tsx
<ImageUpload
  branchName={user?.branchName || ""}
  entityType="Products"
  entityId={product?.id}
  multiple={true}
  maxFiles={5}
  onUpload={setSelectedImages}
  label="Product Images"
/>
```

### T275: Categories (Single Image)

**Entity Type**: `Categories`
**Multiple Images**: No
**Max Files**: 1
**Use Case**: Category icon/banner

```tsx
<ImageUpload
  branchName={user?.branchName || ""}
  entityType="Categories"
  entityId={category?.id}
  multiple={false}
  maxFiles={1}
  onUpload={(files) => setSelectedImages(files)}
  label="Category Image"
/>
```

### T276: Customers (Logo)

**Entity Type**: `Customers`
**Multiple Images**: No
**Max Files**: 1
**Use Case**: Customer branch logo

```tsx
<ImageUpload
  branchName={user?.branchName || ""}
  entityType="Customers"
  entityId={customer?.id}
  multiple={false}
  maxFiles={1}
  onUpload={(files) => setSelectedImages(files)}
  label="Customer Logo"
/>
```

### T277: Suppliers (Logo)

**Entity Type**: `Suppliers`
**Multiple Images**: No
**Max Files**: 1
**Use Case**: Supplier branch logo

**Note**: Supplier form may need to be created first.

```tsx
<ImageUpload
  branchName={user?.branchName || ""}
  entityType="Suppliers"
  entityId={supplier?.id}
  multiple={false}
  maxFiles={1}
  onUpload={(files) => setSelectedImages(files)}
  label="Supplier Logo"
/>
```

### T278: Branches (Branch Logo)

**Entity Type**: `Branches`
**Multiple Images**: No
**Max Files**: 1
**Use Case**: Branch logo for head office management

```tsx
<ImageUpload
  branchName="HeadOffice" // Special case: head office branch
  entityType="Branches"
  entityId={branch?.id}
  multiple={false}
  maxFiles={1}
  onUpload={(files) => setSelectedImages(files)}
  label="Branch Logo"
/>
```

### T279: Expenses (Receipt Image)

**Entity Type**: `Expenses`
**Multiple Images**: Yes
**Max Files**: 3
**Use Case**: Receipt/invoice scans

```tsx
<ImageUpload
  branchName={user?.branchName || ""}
  entityType="Expenses"
  entityId={expense?.id}
  multiple={true}
  maxFiles={3}
  onUpload={setSelectedImages}
  label="Receipt Images"
/>
```

## Complete Example: ProductFormModal with Image Upload

See the example implementation in the ProductFormModal component that demonstrates:

1. ✅ State management for selected images
2. ✅ Image upload after entity creation
3. ✅ Display of existing images for edit mode
4. ✅ Multiple image support
5. ✅ Loading states during upload
6. ✅ Error handling

## Implementation Checklist

For each form integration:

- [ ] Import ImageUpload and imageService
- [ ] Add selectedImages state
- [ ] Get branch name from useAuth hook
- [ ] Modify handleSubmit to upload images after entity save
- [ ] Add ImageUpload component to UI
- [ ] Configure multiple/single image mode
- [ ] Set appropriate entity type
- [ ] Handle loading states
- [ ] Test upload workflow
- [ ] Test edit mode with existing images

## Testing

After integrating image upload:

1. **Create Mode**:

   - Create new entity without images → Should save successfully
   - Create new entity with images → Should upload images after save
   - Verify images appear on entity list/details

2. **Edit Mode**:

   - Edit entity without changing images → Should preserve existing images
   - Edit entity and add new images → Should add to existing
   - Edit entity and remove images → Should delete from server

3. **Validation**:
   - Try uploading non-image file → Should show error
   - Try uploading file > 10MB → Should show error
   - Try uploading more than max allowed → Should limit files

## API Integration

The imageService handles all API calls:

```tsx
// Upload single image
await imageService.uploadImage(branchName, entityType, entityId, file);

// Upload multiple images
await imageService.uploadMultipleImages(
  branchName,
  entityType,
  entityId,
  files
);

// Delete images
await imageService.deleteImages(branchName, entityType, entityId);

// Get image URL
const url = imageService.getImageUrl(
  branchName,
  entityType,
  entityId,
  "medium"
);
```

## File Structure

```
frontend/
├── components/
│   ├── shared/
│   │   ├── ImageUpload.tsx          ✅ Created
│   │   └── OptimizedImage.tsx       ✅ Created
│   ├── inventory/
│   │   ├── ProductFormModal.tsx     → Add image upload (T274)
│   │   └── CategoryFormModal.tsx    → Add image upload (T275)
│   ├── customers/
│   │   └── CustomerFormModal.tsx    → Add image upload (T276)
│   ├── suppliers/
│   │   └── SupplierFormModal.tsx    → Add image upload (T277) - Create first!
│   ├── head-office/
│   │   └── BranchFormModal.tsx      → Add image upload (T278)
│   └── expenses/
│       └── ExpenseFormModal.tsx     → Add image upload (T279)
└── services/
    └── image.service.ts              ✅ Created
```

## Notes

- **Entity Creation First**: Always create/update the entity before uploading images (need entity ID)
- **Branch Name**: Required for image path organization
- **Entity Type**: Must match backend directory structure
- **Loading States**: Show progress for both form submission and image upload
- **Error Handling**: Handle both entity save errors and image upload errors separately
- **Existing Images**: Display existing images in edit mode using OptimizedImage component

## Troubleshooting

### Images not uploading

- Check user has branchName in auth context
- Verify entity ID is available
- Check network tab for upload errors
- Ensure backend endpoint is accessible

### Images not displaying

- Verify image was uploaded successfully
- Check image URL is correct
- Ensure backend serves images correctly
- Check browser console for errors

### Form submission slow

- Images upload sequentially by default
- Consider showing progress indicator
- Consider uploading in background after modal closes

## Future Enhancements

1. **Drag & Drop Reordering**: Allow users to reorder product images
2. **Image Cropping**: Client-side crop tool before upload
3. **Progress Bars**: Show upload progress for each file
4. **Background Upload**: Upload images after closing modal
5. **Image Gallery**: Better preview/zoom for existing images
6. **Bulk Delete**: Delete multiple images at once
7. **Image Metadata**: Store and display image titles/descriptions
