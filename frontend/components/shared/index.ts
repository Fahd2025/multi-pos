/**
 * Shared Components Index
 *
 * Central export file for all shared/generic components.
 * Import components from here for consistency:
 *
 * @example
 * import { StatCard, ActionCard, PageHeader } from '@/components/shared';
 */

// Layout & Navigation Components
export { ThemeSwitcher, ThemeSwitcherCompact } from "./ThemeSwitcher";
export { default as SyncStatusIndicator } from "./SyncStatusIndicator";
export { default as OptimizedImage } from "./OptimizedImage";
export { default as ImageUpload } from "./ImageUpload";

// Feedback & Display Components
export { ApiErrorAlert, InlineApiError, EmptyState } from "./ApiErrorAlert";
export { LoadingSpinner } from "./LoadingSpinner";
export { ErrorAlert, SuccessAlert } from "./ErrorAlert";
export { StatusBadge, getStockStatusVariant } from "./StatusBadge";

// Custom Generic Components
export { StatCard } from "./StatCard";
export type { StatCardProps } from "./StatCard";
export { ActionCard } from "./ActionCard";
export type { ActionCardProps } from "./ActionCard";
export { PageHeader } from "./PageHeader";
export type { PageHeaderProps } from "./PageHeader";
export { InfoBanner } from "./InfoBanner";
export type { InfoBannerProps } from "./InfoBanner";
export { Icon } from "./Icon";
export type { IconProps, IconName } from "./Icon";

// Form Components (previously in Form folder)
export { Input } from "./Input";
export { Select } from "./Select";
export { Checkbox } from "./Checkbox";

// UI Components (previously in ui folder)
export { Button, IconButton } from "./Button";
export type { ButtonProps, IconButtonProps } from "./Button";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "./card";
export {
  Dialog as UIDialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./RadixDialog";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./table";
export { Badge } from "./badge";
export { Avatar } from "./avatar";
export { Label } from "./label";
export { Textarea } from "./textarea";
export { Separator } from "./separator";
export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "./sheet";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./dropdown-menu";
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";
export { Accordion } from "./accordion";
export { ImageCarousel } from "./image-carousel";
export { MultiImageUpload } from "./multi-image-upload";
export { Spinner } from "./spinner";
export { Toaster } from "./sonner";
export { Barcode } from "./barcode";
export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from "./form";

// Modal Components (previously in modals folder)
export { FeaturedDialog } from "./FeaturedDialog";
export { ConfirmationDialog } from "./ConfirmationDialog";

// Data Table Components (previously in data-table folder)
export { DataTable } from "./DataTable";
export { ExpansionTile } from "./ExpansionTile";
export type { ExpansionTileProps, ExpansionTileDetail, ExpansionTileAction } from "./ExpansionTile";
