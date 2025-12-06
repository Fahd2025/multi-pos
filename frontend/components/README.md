# Generic Data Table Components

A comprehensive, reusable component library for handling data tables with modals in Next.js applications. These components are fully typed with TypeScript generics, making them work seamlessly with any data type while maintaining type safety.

## 🎯 Features

- **Type-Safe**: Full TypeScript support with generics
- **Flexible**: Works with any data type
- **Accessible**: ARIA attributes and keyboard navigation
- **Responsive**: Mobile-first design with Tailwind CSS v4
- **Performant**: Optimized with React hooks and memoization
- **Modular**: Clean component architecture with minimal code duplication

## 📦 Components

### 1. DataTable

A generic data table with pagination, sorting, filtering, and row selection.

**Features:**

- Customizable columns with render functions
- Client-side sorting
- Pagination with configurable page sizes
- Row selection (single or multiple)
- Custom row actions
- Loading and empty states
- Fully accessible

**Usage:**

```tsx
import { DataTable } from "@/components/data-table";
import { useDataTable } from "@/hooks/useDataTable";

const MyPage = () => {
  const { data, paginationConfig, sortConfig, handlePageChange, handleSort } = useDataTable(
    myData,
    { pageSize: 10 }
  );

  return (
    <DataTable
      data={data}
      columns={[
        { key: "name", label: "Name", sortable: true },
        { key: "price", label: "Price", render: (v) => `$${v}` },
      ]}
      actions={[{ label: "Edit", onClick: handleEdit, variant: "primary" }]}
      getRowKey={(row) => row.id}
      pagination
      paginationConfig={paginationConfig}
      onPageChange={handlePageChange}
      sortConfig={sortConfig}
      onSortChange={handleSort}
    />
  );
};
```

### 2. FeaturedDialog

A bottom sheet modal for creating and editing data with dynamic form generation.

**Features:**

- Dynamic form generation from field configuration
- Built-in validation with custom rules
- Support for multiple input types
- Conditional field rendering
- Automatic form state management
- Loading states

**Usage:**

```tsx
import { FeaturedDialog } from "@/components/modals";
import { useModal } from "@/hooks/useModal";

const MyPage = () => {
  const modal = useModal<Product>();

  const fields = [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "price", label: "Price", type: "number", required: true },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: [{ label: "Electronics", value: "electronics" }],
    },
  ];

  return (
    <FeaturedDialog
      isOpen={modal.isOpen}
      onClose={modal.close}
      title="Create Product"
      mode="create"
      fields={fields}
      onSubmit={handleSubmit}
    />
  );
};
```

### 3. FeaturedDialog

A modal dialog for displaying detailed information about a selected entry.

**Features:**

- Clean, card-based layout
- Customizable field rendering
- Optional action buttons
- Responsive design

**Usage:**

```tsx
import { FeaturedDialog } from "@/components/modals";
import { useModal } from "@/hooks/useModal";

const MyPage = () => {
  const dialog = useModal<Product>();

  return (
    <FeaturedDialog
      isOpen={dialog.isOpen}
      onClose={dialog.close}
      title="Product Details"
      data={dialog.data}
      fields={[
        { key: "name", label: "Name" },
        { key: "price", label: "Price", render: (v) => `$${v}` },
      ]}
      actions={[{ label: "Edit", onClick: handleEdit, variant: "primary" }]}
    />
  );
};
```

### 4. ConfirmationDialog

A modal dialog for confirming user actions.

**Features:**

- Visual variants (danger, warning, info, success)
- Custom messages and labels
- Async action support with loading states
- Keyboard shortcuts (Enter/Esc)

**Usage:**

```tsx
import { ConfirmationDialog } from "@/components/modals";
import { useConfirmation } from "@/hooks/useModal";

const MyPage = () => {
  const confirmation = useConfirmation();

  const handleDelete = (item) => {
    confirmation.ask(
      "Delete Item",
      `Are you sure you want to delete ${item.name}?`,
      async () => {
        await deleteItem(item.id);
      },
      "danger"
    );
  };

  return (
    <ConfirmationDialog
      isOpen={confirmation.isOpen}
      onClose={confirmation.cancel}
      title={confirmation.title}
      message={confirmation.message}
      variant={confirmation.variant}
      onConfirm={confirmation.confirm}
      isProcessing={confirmation.isProcessing}
    />
  );
};
```

## 🎣 Hooks

### useDataTable

Manages DataTable state including pagination, sorting, and filtering.

```tsx
const {
  data, // Processed data (filtered, sorted, paginated)
  paginationConfig, // Pagination configuration
  sortConfig, // Current sort configuration
  filters, // Current filters
  selectedRows, // Selected row keys
  handlePageChange, // Handle page change
  handlePageSizeChange, // Handle page size change
  handleSort, // Handle sort change
  handleFilter, // Handle filter change
  removeFilter, // Remove a filter
  resetFilters, // Reset all filters
  handleSelectionChange, // Handle selection change
  selectAll, // Select all rows
  deselectAll, // Deselect all rows
  isAllSelected, // Check if all rows are selected
} = useDataTable(rawData, options);
```

### useModal

Manages modal state and operations.

```tsx
const modal = useModal<DataType>();

modal.open(data, "edit"); // Open modal with data
modal.close(); // Close modal
modal.setData(data); // Update modal data
modal.setMode("create"); // Update modal mode

// Access state
modal.isOpen; // boolean
modal.data; // DataType | null
modal.mode; // 'create' | 'edit' | 'view' | 'delete' | 'custom'
```

### useConfirmation

Specialized hook for confirmation dialogs.

```tsx
const confirmation = useConfirmation();

confirmation.ask(
  "Delete Item",
  "Are you sure?",
  async () => {
    /* action */
  },
  "danger"
);

confirmation.confirm(); // Confirm and execute
confirmation.cancel(); // Cancel and close

// Access state
confirmation.isOpen; // boolean
confirmation.title; // string
confirmation.message; // string
confirmation.variant; // 'danger' | 'warning' | 'info' | 'success'
confirmation.isProcessing; // boolean
```

## 📝 TypeScript Types

All types are defined in `@/types/data-table.types.ts`:

- `DataTableColumn<T>` - Column definition
- `DataTableAction<T>` - Row action definition
- `DataTableProps<T>` - DataTable props
- `SortConfig<T>` - Sorting configuration
- `FilterConfig<T>` - Filter configuration
- `PaginationConfig` - Pagination configuration
- `FeaturedDialogProps<T>` - Modal props
- `FormField<T>` - Form field configuration
- `FeaturedDialogProps<T>` - Dialog props
- `DisplayField<T>` - Display field configuration
- `ConfirmationDialogProps` - Confirmation dialog props

## 🎨 Styling

All components use Tailwind CSS v4 for styling. The design follows these principles:

- **Consistent**: Uses a cohesive color palette
- **Responsive**: Mobile-first approach
- **Accessible**: Proper contrast ratios and focus states
- **Modern**: Clean, professional appearance

### Customization

You can customize the appearance by:

1. Passing className props to components
2. Modifying Tailwind classes directly
3. Using custom render functions in columns and fields

## ♿ Accessibility

All components follow accessibility best practices:

- **ARIA Attributes**: Proper roles, labels, and descriptions
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Clear focus indicators
- **Screen Readers**: Semantic HTML and ARIA labels
- **Color Contrast**: WCAG 2.1 compliant

### Keyboard Shortcuts

- **DataTable**: Arrow keys for navigation, Space for selection
- **Modals**: Esc to close, Tab for focus management
- **Confirmation**: Enter to confirm, Esc to cancel

## 📱 Responsive Design

Components adapt to different screen sizes:

- **Mobile**: Bottom sheets slide up, tables scroll horizontally
- **Tablet**: Optimized layouts with adjusted spacing
- **Desktop**: Full-featured layouts with hover states

## 🚀 Performance

Components are optimized for performance:

- **Memoization**: Uses `useMemo` and `useCallback`
- **Lazy Rendering**: Only renders visible rows
- **Event Throttling**: Debounced filter and search operations
- **Minimal Re-renders**: Optimized state management

## 📚 Examples

See the complete working example at:

- `app/[locale]/examples/data-table-demo/page.tsx`

This example demonstrates:

- Full CRUD operations
- All component integrations
- Custom rendering
- Validation
- State management
- Best practices

## 🔧 Configuration

### DataTable Options

```tsx
interface UseDataTableOptions<T> {
  pageSize?: number; // Initial page size (default: 10)
  sortable?: boolean; // Enable client-side sorting (default: true)
  filterable?: boolean; // Enable client-side filtering (default: true)
  pagination?: boolean; // Enable pagination (default: true)
  initialSort?: SortConfig<T>; // Initial sort configuration
}
```

### Modal Sizes

Available sizes for modals and dialogs:

- `sm`: 28rem (max-w-md)
- `md`: 42rem (max-w-2xl)
- `lg`: 56rem (max-w-4xl)
- `xl`: 72rem (max-w-6xl)
- `full`: 100% (max-w-full)

## 🎯 Best Practices

1. **Type Safety**: Always provide proper TypeScript types
2. **Key Functions**: Always provide unique `getRowKey` function
3. **Validation**: Use built-in validation for forms
4. **Loading States**: Show loading indicators during async operations
5. **Error Handling**: Handle errors gracefully with user feedback
6. **Accessibility**: Test with keyboard and screen readers
7. **Performance**: Use pagination for large datasets

## 🐛 Troubleshooting

### Common Issues

**Table not sorting:**

- Ensure `sortable` prop is true
- Check if columns have `sortable: false`
- Verify `onSortChange` handler is provided

**Form validation not working:**

- Check field validation rules
- Ensure `required` fields are marked
- Verify custom validation functions return proper error messages

**Modal not closing:**

- Check if `onClose` handler is provided
- Ensure no errors in form submission
- Verify `isSubmitting` state is managed correctly

## 📄 License

This component library is part of the multi-pos project.

## 🤝 Contributing

When adding new features:

1. Maintain TypeScript type safety
2. Add proper documentation
3. Include usage examples
4. Follow accessibility guidelines
5. Test on multiple screen sizes
