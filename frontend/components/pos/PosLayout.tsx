"use client";

import React, { useState, useEffect } from "react";
import styles from "./Pos2.module.css";
import { CategorySidebar } from "./CategorySidebar";
import { TopBar } from "./TopBar";
import {ProductGrid} from "./ProductGrid";
import { OrderPanel } from "./OrderPanel";
import { useToast } from "@/hooks/useToast";
import { ProductDto, SaleDto } from "@/types/api.types";
import { playErrorBeep, playSuccessBeep } from "@/lib/utils";
import { useCategories, useProducts } from "@/hooks/useInventory";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";

interface CartItem extends ProductDto {
  quantity: number;
}

function PosLayoutContent() {
  const toast = useToast();
  const [activeCategory, setActiveCategory] = useState<string /*| null*/>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartVisible, setIsCartVisible] = useState(true); // Default true for desktop
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [lastSale, setLastSale] = useState<SaleDto | null>(null); // Track last completed sale

  // Use SWR hooks for data fetching
  const { categories, isLoading: loadingCategories, error: categoriesError } = useCategories();
  const { products, isLoading: loadingProducts, error: productsError } = useProducts({
    isActive: true,
    pageSize: 1000
  });

  const loading = loadingCategories || loadingProducts;
  const error = categoriesError || productsError;
  const isError = !!error;

  // Set initial cart visibility and sidebar state based on screen size (only once on mount)
  useEffect(() => {
    // On mobile (<= 768px), hide cart by default
    // On desktop, show cart by default
    const isMobile = window.innerWidth <= 768;
    setIsCartVisible(!isMobile);

    // Load sidebar collapsed state from localStorage
    const stored = localStorage.getItem("pos_sidebar_collapsed");
    if (stored !== null) {
      setIsSidebarCollapsed(stored === "true");
    } else {
      // Default: collapsed on mobile, expanded on desktop
      setIsSidebarCollapsed(isMobile);
    }
  }, []);

  // Get branch code from localStorage
  const getBranchCode = () => {
    if (typeof window !== "undefined") {
      const branch = localStorage.getItem("branch");
      if (branch) {
        try {
          return JSON.parse(branch).branchCode;
        } catch (e) {
          console.error("Error parsing branch:", e);
        }
      }
    }
    return "default";
  };

  const branchCode = getBranchCode();

  const handleAddToCart = (product: ProductDto) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    // Play success sound when adding to cart
    playSuccessBeep();
  };

  const handleRemoveItem = (id: string) => {
    playErrorBeep();
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    playErrorBeep();
    setCart([]);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    playSuccessBeep();
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  // Filter products by category with fallback for undefined
  const productsData = products ?? [];
  const categoriesData = categories ?? [];
  const filteredProducts =
    activeCategory === "all" ? productsData : productsData.filter((p) => p.categoryId === activeCategory);

  // Calculate cart item count
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Toggle cart visibility
  const handleToggleCart = () => {
    setIsCartVisible(!isCartVisible);
  };

  // Toggle sidebar visibility
  const handleToggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("pos_sidebar_collapsed", newState.toString());
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.container}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            padding: "2rem",
          }}
        >
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load POS data</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Toast handler for TopBar
  const handleToast = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message?: string
  ) => {
    toast[type](title, message);
  };

  return (
    <div className={styles.container}>
      {/* Desktop Sidebar - shown on left side on large screens */}
      {/* <div className={styles.desktopSidebarWrapper}>
        <CategorySidebar
          selectedCategoryId={activeCategory}
          onCategorySelect={setActiveCategory}
          isHorizontal={false}
        />
      </div> */}

      {/* Desktop Sidebar - shown on left side on large screens */}
      <div className={styles.desktopSidebarWrapper}>
        <CategorySidebar
          categories={categoriesData}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      </div>

      <div className={styles.mainContent}>
        <TopBar
          cartItemCount={cartItemCount}
          onToggleCart={handleToggleCart}
          isCartVisible={isCartVisible}
          onAddToCart={handleAddToCart}
          branchCode={branchCode}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
          lastSale={lastSale}
          onToast={handleToast}
        />

        {/* Mobile Categories Bar - shown between nav and search on mobile */}
        {/* <div className={styles.mobileCategoriesWrapper}>
          <CategorySidebar
            selectedCategoryId={activeCategory}
            onCategorySelect={setActiveCategory}
            isHorizontal={false}
          />
        </div> */}

                {/* Mobile Categories Bar - shown between nav and search on mobile */}
          <div className={styles.mobileCategoriesWrapper}>
            <CategorySidebar
              categories={categoriesData}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={handleToggleSidebar}
            />
          </div>

        {/* <ProductGrid
          selectedCategoryId={activeCategory}
          searchQuery=""
          onProductSelect={handleAddToCart}
        /> */}

          <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} />
      </div>

      {/* Backdrop overlay for mobile */}
      {isCartVisible && <div className={styles.cartBackdrop} onClick={handleToggleCart} />}

      {/* Order Panel with conditional visibility class */}
      <div className={`${styles.orderPanel} ${isCartVisible ? styles.cartVisible : ""}`}>
        <OrderPanel
          cart={cart}
          onRemoveItem={handleRemoveItem}
          onClearAll={handleClearAll}
          onUpdateQuantity={handleUpdateQuantity}
          onClose={handleToggleCart}
          onTransactionComplete={(sale) => setLastSale(sale)}
        />
      </div>
    </div>
  );
}

export default function PosLayout() {
  return <PosLayoutContent />;
}
