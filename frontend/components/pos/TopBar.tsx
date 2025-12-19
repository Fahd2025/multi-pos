"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Loader2,
  CheckCircle,
  AlertCircle,
  Menu,
  ArrowLeft,
  FileText,
  Clock,
  DollarSign,
  Table2,
  Truck,
  User,
  Calendar,
  MoreVertical,
  Printer,
} from "lucide-react";
import styles from "./Pos2.module.css";
import { FloatingSearchPanel } from "./FloatingSearchPanel";
import { ProductDto } from "@/types/api.types";
import { useDebounce } from "@/hooks/useDebounce";
import inventoryService from "@/services/inventory.service";
import { playErrorBeep, playSuccessBeep } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { SaleDto } from "@/types/api.types";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import invoiceTemplateService from "@/services/invoice-template.service";
import branchInfoService from "@/services/branch-info.service";
import { InvoiceSchema } from "@/types/invoice-template.types";
import { transformSaleToInvoiceData } from "@/lib/invoice-data-transformer";
import { useReactToPrint } from "react-to-print";

interface TopBarProps {
  cartItemCount: number;
  onToggleCart: () => void;
  isCartVisible: boolean;
  onAddToCart: (product: ProductDto) => void;
  branchCode: string;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  lastSale: SaleDto | null; // Last completed sale for reprinting
  onToast: (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message?: string
  ) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  cartItemCount,
  onToggleCart,
  isCartVisible,
  onAddToCart,
  branchCode,
  isSidebarCollapsed,
  onToggleSidebar,
  lastSale,
  onToast,
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchPanelVisible, setIsSearchPanelVisible] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [notFoundMessage, setNotFoundMessage] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastKeystrokeTime = useRef<number>(0);
  const inputStartTime = useRef<number>(0);
  const isBarcodeScan = useRef<boolean>(false);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const prevCartItemCount = useRef(cartItemCount);

  // New state for navigation menu and date/time
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [cashierName, setCashierName] = useState<string>("Cashier");

  // Button press feedback states
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [expandedButton, setExpandedButton] = useState<string | null>(null);
  const [expandedCashier, setExpandedCashier] = useState(false);

  // Invoice printing state (hidden)
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceSchema, setInvoiceSchema] = useState<InvoiceSchema | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  // Get cashier name on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCashierName(user.fullNameEn || user.username || "Cashier");
    }
  }, []);

  // Update date/time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Close menu if clicking outside of it
      if (!target.closest(`.${styles.mobileMenu}`) && !target.closest(`.${styles.mobileMenuBtn}`)) {
        setIsMenuOpen(false);
      }
    };

    const handleResize = () => {
      setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMenuOpen]);

  // Trigger cart animation when item count changes
  useEffect(() => {
    if (cartItemCount !== prevCartItemCount.current) {
      setIsCartAnimating(true);
      const timer = setTimeout(() => setIsCartAnimating(false), 500);
      prevCartItemCount.current = cartItemCount;
      return () => clearTimeout(timer);
    }
  }, [cartItemCount]);

  // Debounce search query (only for manual typing, not barcode scans)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      const trimmedQuery = debouncedSearchQuery.trim();

      // If search is empty, hide panel and clear results
      if (!trimmedQuery) {
        setSearchResults([]);
        setIsSearching(false);
        setIsSearchPanelVisible(false);
        return;
      }

      setIsSearching(true);

      try {
        const response = await inventoryService.getProducts({
          search: trimmedQuery,
          isActive: true,
          pageSize: 50,
        });

        setSearchResults(response.data);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const now = Date.now();

    // Track input timing to detect barcode scanner
    // Barcode scanners typically input very fast (< 50ms between characters)
    if (value.length === 1) {
      inputStartTime.current = now;
      isBarcodeScan.current = false;
    } else if (value.length > 1) {
      const timeSinceLastKeystroke = now - lastKeystrokeTime.current;
      // If input is very fast (< 50ms between keystrokes), likely a barcode scanner
      if (timeSinceLastKeystroke < 50) {
        isBarcodeScan.current = true;
      }
    }

    lastKeystrokeTime.current = now;
    setSearchQuery(value);

    // Show panel when user starts typing manually (not barcode scan)
    // Hide panel if search becomes empty
    const trimmedValue = value.trim();
    if (trimmedValue && !isBarcodeScan.current) {
      setIsSearchPanelVisible(true);
    } else if (!trimmedValue) {
      setIsSearchPanelVisible(false);
    }
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      setIsSearchPanelVisible(true);
    }
  };

  // Handle Enter key press (barcode scanner or manual search)
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    const trimmedQuery = searchQuery.trim();

    if (e.key === "Enter" && trimmedQuery) {
      e.preventDefault();

      // Close search panel if it's open
      setIsSearchPanelVisible(false);

      // Perform immediate search
      setIsSearching(true);

      try {
        const response = await inventoryService.getProducts({
          search: trimmedQuery,
          isActive: true,
          pageSize: 10,
        });

        const products = response.data;

        if (products.length === 1) {
          // Exactly one product found - add to cart automatically
          const product = products[0];

          // Check if product is in stock
          if (product.stockLevel > 0) {
            onAddToCart(product);

            // Show success feedback
            setScanSuccess(true);
            setTimeout(() => setScanSuccess(false), 2000);

            // Clear search
            setSearchQuery("");
            setSearchResults([]);

            // Play success beep (optional)
            playSuccessBeep();
          } else {
            // Product out of stock
            playErrorBeep();
            setNotFoundMessage(`Product "${product.nameEn}" is out of stock!`);
            setTimeout(() => setNotFoundMessage(null), 3000);
            setSearchQuery("");
          }
        } else if (products.length > 1) {
          // Multiple products found - show search panel for user to choose
          setSearchResults(products);
          setIsSearchPanelVisible(true);
        } else {
          // No products found
          playErrorBeep();
          setNotFoundMessage(`No product found with barcode: "${trimmedQuery}"`);
          setTimeout(() => setNotFoundMessage(null), 3000);
          setSearchQuery("");
        }
      } catch (error) {
        console.error("Barcode search error:", error);
        playErrorBeep();
        setNotFoundMessage("Error searching for product. Please try again.");
        setTimeout(() => setNotFoundMessage(null), 3000);
        setSearchQuery("");
      } finally {
        setIsSearching(false);
        isBarcodeScan.current = false;
      }
    }
  };

  // Handle product selection
  const handleSelectProduct = (product: ProductDto) => {
    onAddToCart(product);

    // Play success sound
    playSuccessBeep();

    // Show success feedback
    setScanSuccess(true);
    setTimeout(() => setScanSuccess(false), 1500);

    setIsSearchPanelVisible(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Close search panel
  const handleCloseSearch = () => {
    setIsSearchPanelVisible(false);
  };

  // Button press feedback
  const handleButtonPress = (buttonId: string, callback?: () => void) => {
    setActiveButton(buttonId);
    setExpandedButton(buttonId);
    playSuccessBeep();

    setTimeout(() => {
      setActiveButton(null);
      callback?.();
    }, 150);

    // Auto-hide label after 2.5 seconds
    setTimeout(() => {
      setExpandedButton(null);
    }, 2500);
  };

  // Handle cashier info click
  const handleCashierClick = () => {
    setExpandedCashier(true);

    // Auto-hide after 2.5 seconds
    setTimeout(() => {
      setExpandedCashier(false);
    }, 2500);
  };

  // Navigation button handlers
  const handleBack = () => {
    handleButtonPress("back", () => {
      window.history.back();
    });
  };

  const handleReturnInvoice = () => {
    handleButtonPress("return", () => {
      // TODO: Implement return invoice functionality
      console.log("Return Invoice clicked");
    });
  };

  const handlePendingInvoices = () => {
    handleButtonPress("pending", () => {
      // TODO: Implement pending invoices functionality
      console.log("Pending Invoices clicked");
    });
  };

  const handleCashDrawer = () => {
    handleButtonPress("cash-drawer", () => {
      // TODO: Implement cash drawer functionality
      console.log("Cash Drawer clicked");
    });
  };

  const handleTableManagement = () => {
    handleButtonPress("tables", () => {
      // TODO: Implement table management functionality
      console.log("Table Management clicked");
    });
  };

  const handleDeliveryManagement = () => {
    handleButtonPress("delivery", () => {
      router.push("/pos/delivery1");
    });
  };

  const handlePrintInvoice = () => {
    handleButtonPress("print", async () => {
      console.log("Print Invoice clicked");

      if (!lastSale) {
        onToast(
          "warning",
          "No invoice to print",
          "Complete a transaction first to print an invoice."
        );
        return;
      }

      try {
        // Load active template
        const template = await invoiceTemplateService.getActiveTemplate();
        if (!template) {
          onToast("warning", "No invoice template", "Please activate a template in Settings.");
          return;
        }

        // Parse schema
        const parsedSchema = JSON.parse(template.schema) as InvoiceSchema;

        // Load branch info
        const branchInfo = await branchInfoService.getBranchInfo();

        // Transform sale data to invoice data format
        const transformedData = transformSaleToInvoiceData(lastSale, branchInfo);

        // Set invoice data and trigger print
        setInvoiceSchema(parsedSchema);
        setInvoiceData(transformedData);

        // Trigger print after a short delay
        setTimeout(() => {
          if (invoiceRef.current) {
            handlePrint();
            onToast("success", "Printing invoice", `Reprinting invoice #${lastSale.invoiceNumber}`);
          }
        }, 300);
      } catch (error: any) {
        console.error("Failed to print invoice:", error);
        onToast(
          "error",
          "Print failed",
          error.message || "Failed to prepare invoice for printing."
        );
      }
    });
  };

  // Set up print handler using react-to-print
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${invoiceData?.invoiceNumber || "POS"}`,
  });

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Format date and time
  const formatDateTime = (date: Date) => {
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return `${dateStr} • ${timeStr}`;
  };

  return (
    <>
      {/* Hidden invoice for printing */}
      {invoiceSchema && invoiceData && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <InvoicePreview ref={invoiceRef} schema={invoiceSchema} data={invoiceData} />
        </div>
      )}

      <div className={styles.topBar}>
        {/* Row 1: Navigation Bar with Buttons and User Info */}
        <div className={styles.navBarRow}>
          <div className={styles.topBarHeader}>
            {/* Small Back Button - Icon Only */}
            {/* <button
              className={`${styles.backBtn} ${activeButton === "back" ? styles.btnActive : ""}`}
              onClick={handleBack}
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeft size={20} />
            </button> */}

            {/* Sidebar Toggle Button - visible when sidebar is collapsed */}
            {isSidebarCollapsed && (
              <button
                className={styles.sidebarToggleBtn}
                onClick={onToggleSidebar}
                aria-label="Show categories"
                title="Show categories"
              >
                <Menu size={24} />
              </button>
            )}

            {/* Search Bar - Fills remaining space */}
            <div className={styles.searchBar}>
              <Search className={styles.searchIcon} />
              {isSearching && <Loader2 className={styles.searchLoadingIcon} />}
              {scanSuccess && <CheckCircle className={styles.scanSuccessIcon} />}
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name, barcode, or SKU..."
                className={`${styles.searchInput} ${scanSuccess ? styles.scanSuccess : ""}`}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={handleSearchFocus}
              />
              {searchQuery && !isSearching && (
                <span className={styles.searchClearBtn} onClick={() => setSearchQuery("")}>
                  ×
                </span>
              )}
            </div>

            {/* Cart Toggle Button */}
            <button
              className={`${styles.cartToggleBtn} ${isCartAnimating ? styles.animateCart : ""}`}
              onClick={onToggleCart}
              aria-label="Toggle shopping cart"
            >
              <ShoppingCart size={24} />
              {cartItemCount > 0 && <span className={styles.cartBadge}>{cartItemCount}</span>}
            </button>

            {/* Main Action Buttons */}
            <div className={styles.mainActionButtons}>
              {/* <button
                className={`${styles.navBtn} ${styles.btnSecondary} ${
                  activeButton === "print" ? styles.btnActive : ""
                } ${expandedButton === "print" ? styles.btnExpanded : ""}`}
                onClick={handlePrintInvoice}
                aria-label="Print invoice"
                title="Print invoice"
              >
                <Printer size={20} />
                <span className={styles.btnLabel}>Print</span>
              </button> */}

              <button
                className={`${styles.navBtn} ${styles.btnDanger} ${
                  activeButton === "return" ? styles.btnActive : ""
                } ${expandedButton === "return" ? styles.btnExpanded : ""}`}
                onClick={handleReturnInvoice}
                aria-label="Return invoice"
                title="Return invoice"
              >
                <FileText size={20} />
                <span className={styles.btnLabel}>Return</span>
              </button>

              <button
                className={`${styles.navBtn} ${styles.btnInfo} ${
                  activeButton === "pending" ? styles.btnActive : ""
                } ${expandedButton === "pending" ? styles.btnExpanded : ""}`}
                onClick={handlePendingInvoices}
                aria-label="Pending invoices"
                title="Pending invoices"
              >
                <Clock size={20} />
                <span className={styles.btnLabel}>Pending</span>
              </button>
            </div>

            {/* Secondary Buttons */}
            <div className={styles.secondaryButtons}>
              <button
                className={`${styles.navBtn} ${styles.btnPrimary} ${
                  activeButton === "delivery" ? styles.btnActive : ""
                } ${expandedButton === "delivery" ? styles.btnExpanded : ""}`}
                onClick={handleDeliveryManagement}
                aria-label="Delivery management"
                title="Delivery management"
              >
                <Truck size={20} />
                <span className={styles.btnLabel}>Delivery</span>
              </button>

              <button
                className={`${styles.navBtn} ${styles.btnSecondary} ${
                  activeButton === "tables" ? styles.btnActive : ""
                } ${expandedButton === "tables" ? styles.btnExpanded : ""}`}
                onClick={handleTableManagement}
                aria-label="Table management"
                title="Table management"
              >
                <Table2 size={20} />
                <span className={styles.btnLabel}>Tables</span>
              </button>

              {/* <button
                className={`${styles.navBtn} ${styles.btnWarning} ${
                  activeButton === "cash-drawer" ? styles.btnActive : ""
                } ${expandedButton === "cash-drawer" ? styles.btnExpanded : ""}`}
                onClick={handleCashDrawer}
                aria-label="Open cash drawer"
                title="Open cash drawer"
              >
                <DollarSign size={20} />
                <span className={styles.btnLabel}>Cash Drawer</span>
              </button> */}
            </div>

            {/* Cashier Info */}
            {/* <div
              className={`${styles.cashierInfo} ${expandedCashier ? styles.cashierExpanded : ""}`}
              onClick={handleCashierClick}
            >
              <User size={20} className={styles.userIcon} />
              <span className={styles.cashierName}>{cashierName}</span>
            </div> */}

            {/* Mobile Menu Button */}
            <button
              className={`${styles.navBtn} ${styles.mobileMenuBtn} ${
                isMenuOpen ? styles.menuOpen : ""
              } ${expandedButton === "menu" ? styles.btnExpanded : ""}`}
              onClick={toggleMenu}
              aria-label="More options"
              title="More options"
            >
              <MoreVertical size={20} />
              {/* <span className={styles.btnLabel}>More</span> */}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMenuOpen && (
            <div className={styles.mobileMenu}>
              {/* <button
                className={`${styles.mobileMenuItem} ${styles.btnSecondary}`}
                onClick={handlePrintInvoice}
              >
                <Printer size={20} />
                <span>Print Invoice</span>
              </button> */}
              <button
                className={`${styles.mobileMenuItem} ${styles.btnDanger}`}
                onClick={handleReturnInvoice}
              >
                <FileText size={20} />
                <span>Return Invoice</span>
              </button>
              <button
                className={`${styles.mobileMenuItem} ${styles.btnInfo}`}
                onClick={handlePendingInvoices}
              >
                <Clock size={20} />
                <span>Pending Invoices</span>
              </button>

              <button
                className={`${styles.mobileMenuItem} ${styles.btnPrimary}`}
                onClick={() => router.push("/pos/delivery1")}
              >
                <Truck size={20} />
                <span>Delivery Management</span>
              </button>
              <button
                className={`${styles.mobileMenuItem} ${styles.btnSecondary}`}
                onClick={handleTableManagement}
              >
                <Table2 size={20} />
                <span>Table Management</span>
              </button>

              {/* <button
                className={`${styles.mobileMenuItem} ${styles.btnWarning}`}
                onClick={handleCashDrawer}
              >
                <DollarSign size={20} />
                <span>Cash Drawer</span>
              </button> */}
            </div>
          )}
        </div>
      </div>

      {/* Scan Success Notification */}
      {scanSuccess && (
        <div className={styles.scanSuccessNotification}>
          <CheckCircle size={20} />
          <span>Product added to cart!</span>
        </div>
      )}

      {/* Product Not Found Notification */}
      {notFoundMessage && (
        <div className={styles.notFoundNotification}>
          <AlertCircle size={20} />
          <span>{notFoundMessage}</span>
        </div>
      )}

      {/* Floating Search Panel */}
      <FloatingSearchPanel
        isVisible={isSearchPanelVisible}
        searchQuery={searchQuery}
        products={searchResults}
        isLoading={isSearching}
        onClose={handleCloseSearch}
        onSelectProduct={handleSelectProduct}
        branchCode={branchCode}
      />
    </>
  );
};
