/**
 * Generic DataTable Types and Interfaces
 *
 * This file contains all TypeScript interfaces for the generic data table components.
 * These types enable type-safe, reusable components that work with any data structure.
 */

// Column definition for DataTable
export interface DataTableColumn<T> {
  /** Unique identifier for the column */
  key: keyof T | string;
  /** Display label for the column header */
  label: string;
  /** Optional custom render function for cell content */
  render?: (value: any, row: T) => React.ReactNode;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Optional CSS class for column cells */
  className?: string;
  /** Column width (e.g., '200px', '20%', 'auto') */
  width?: string;
}

// Action button for DataTable rows
export interface DataTableAction<T> {
  /** Label for the action button */
  label: string;
  /** Icon component or icon name */
  icon?: React.ReactNode;
  /** Callback when action is clicked */
  onClick: (row: T) => void;
  /** Optional color variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  /** Optional condition to show/hide action */
  condition?: (row: T) => boolean;
}

// Sorting configuration
export interface SortConfig<T> {
  /** Column key to sort by */
  key: keyof T | string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

// Filter configuration
export interface FilterConfig<T> {
  /** Column key to filter */
  key: keyof T | string;
  /** Filter value */
  value: any;
  /** Filter operator */
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt';
}

// Pagination configuration
export interface PaginationConfig {
  /** Current page number (0-indexed) */
  currentPage: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
}

// DataTable props
export interface DataTableProps<T> {
  /** Array of data to display */
  data: T[];
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Optional row actions */
  actions?: DataTableAction<T>[];
  /** Whether table is loading */
  loading?: boolean;
  /** Enable pagination */
  pagination?: boolean;
  /** Pagination configuration */
  paginationConfig?: PaginationConfig;
  /** Callback for page change */
  onPageChange?: (page: number) => void;
  /** Callback for page size change */
  onPageSizeChange?: (pageSize: number) => void;
  /** Enable sorting */
  sortable?: boolean;
  /** Current sort configuration */
  sortConfig?: SortConfig<T>;
  /** Callback for sort change */
  onSortChange?: (sortConfig: SortConfig<T>) => void;
  /** Enable filtering */
  filterable?: boolean;
  /** Current filters */
  filters?: FilterConfig<T>[];
  /** Callback for filter change */
  onFilterChange?: (filters: FilterConfig<T>[]) => void;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedRows?: Set<string | number>;
  /** Callback for selection change */
  onSelectionChange?: (selectedRows: Set<string | number>) => void;
  /** Function to get unique row key */
  getRowKey: (row: T) => string | number;
  /** Optional empty state message */
  emptyMessage?: string;
  /** Optional CSS class for table */
  className?: string;
}

// Modal types
export interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Optional size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Optional CSS class */
  className?: string;
}

// Modal Bottom Sheet props
export interface ModalBottomSheetProps<T = any> extends Omit<ModalProps, 'children'> {
  /** Form mode: create or edit */
  mode: 'create' | 'edit';
  /** Initial data for edit mode */
  initialData?: T;
  /** Form fields configuration */
  fields: FormField<T>[];
  /** Callback on form submit */
  onSubmit: (data: T) => Promise<void> | void;
  /** Whether form is submitting */
  isSubmitting?: boolean;
}

// Form field configuration
export interface FormField<T> {
  /** Field name (key in data object) */
  name: keyof T | string;
  /** Field label */
  label: string;
  /** Field type */
  type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'date' | 'datetime-local';
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required */
  required?: boolean;
  /** Validation rules */
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null; // Returns error message or null
  };
  /** Options for select fields */
  options?: Array<{ label: string; value: any }>;
  /** Optional default value */
  defaultValue?: any;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Conditional rendering */
  condition?: (formData: Partial<T>) => boolean;
}

// Featured Dialog props
export interface FeaturedDialogProps<T = any> {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback to close dialog */
  onClose: () => void;
  /** Dialog title */
  title: string;
  /** Data to display */
  data: T;
  /** Field definitions for displaying data */
  fields: DisplayField<T>[];
  /** Optional actions (e.g., Edit, Delete) */
  actions?: DialogAction<T>[];
  /** Optional size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Display field configuration
export interface DisplayField<T> {
  /** Field key */
  key: keyof T | string;
  /** Display label */
  label: string;
  /** Optional custom render function */
  render?: (value: any, data: T) => React.ReactNode;
  /** Optional CSS class */
  className?: string;
}

// Dialog action
export interface DialogAction<T> {
  /** Action label */
  label: string;
  /** Icon component */
  icon?: React.ReactNode;
  /** Callback when clicked */
  onClick: (data: T) => void;
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

// Confirmation Dialog props
export interface ConfirmationDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback to close dialog */
  onClose: () => void;
  /** Dialog title */
  title: string;
  /** Confirmation message */
  message: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Callback on confirm */
  onConfirm: () => Promise<void> | void;
  /** Whether action is processing */
  isProcessing?: boolean;
  /** Variant for styling */
  variant?: 'danger' | 'warning' | 'info' | 'success';
  /** Optional icon */
  icon?: React.ReactNode;
}
