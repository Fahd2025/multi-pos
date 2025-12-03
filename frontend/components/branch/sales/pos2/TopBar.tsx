"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ShoppingCart, Loader2, CheckCircle, AlertCircle, Menu } from "lucide-react";
import styles from "./Pos2.module.css";
import { FloatingSearchPanel } from "./FloatingSearchPanel";
import { ProductDto } from "@/types/api.types";
import { useDebounce } from "@/hooks/useDebounce";
import inventoryService from "@/services/inventory.service";

interface TopBarProps {
  cartItemCount: number;
  onToggleCart: () => void;
  isCartVisible: boolean;
  onAddToCart: (product: ProductDto) => void;
  branchCode: string;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  cartItemCount,
  onToggleCart,
  isCartVisible,
  onAddToCart,
  branchCode,
  isSidebarCollapsed,
  onToggleSidebar,
}) => {
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

  // Play success beep sound
  const playSuccessBeep = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Silently fail if audio is not supported
      console.log("Audio not supported");
    }
  };

  // Play error beep sound
  const playErrorBeep = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 400; // Lower frequency for error
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (error) {
      console.log("Audio not supported");
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

  return (
    <>
      <div className={styles.topBar}>
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

        {/* Cart Toggle Button - visible on all screens */}
        <button className={styles.cartToggleBtn} onClick={onToggleCart} aria-label="Toggle shopping cart">
          <ShoppingCart size={24} />
          {cartItemCount > 0 && <span className={styles.cartBadge}>{cartItemCount}</span>}
        </button>
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
