"use client";

import React, { useState, useEffect } from "react";
import styles from "./Pos2.module.css";
import { CategorySidebar } from "./CategorySidebar";
import { TopBar } from "./TopBar";
import { ProductGrid } from "./ProductGrid";
import { OrderPanel } from "./OrderPanel";
import { ToastProvider } from "../../../../hooks/useToast";
import inventoryService from "@/services/inventory.service";
import { CategoryDto, ProductDto } from "@/types/api.types";
import { playErrorBeep, playSuccessBeep } from "@/lib/utils";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";

interface CartItem extends ProductDto {
  quantity: number;
}

export default function PosLayout() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, isError, executeWithErrorHandling } = useApiError();
  const [isCartVisible, setIsCartVisible] = useState(true); // Default true for desktop
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  // Fetch categories and products on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const result = await executeWithErrorHandling(async () => {
      // Fetch categories and products in parallel
      const [categoriesData, productsResponse] = await Promise.all([
        inventoryService.getCategories(),
        inventoryService.getProducts({ isActive: true, pageSize: 1000 }),
      ]);

      return { categoriesData, productsResponse };
    });

    if (result) {
      setCategories(result.categoriesData);
      setProducts(result.productsResponse.data);
    }

    setLoading(false);
  };

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

  // Filter products by category
  const filteredProducts =
    activeCategory === "all" ? products : products.filter((p) => p.categoryId === activeCategory);

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
          <ApiErrorAlert error={error} onRetry={fetchData} />
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className={styles.container}>
        {/* Desktop Sidebar - shown on left side on large screens */}
        <div className={styles.desktopSidebarWrapper}>
          <CategorySidebar
            categories={categories}
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
          />

          {/* Mobile Categories Bar - shown between nav and search on mobile */}
          <div className={styles.mobileCategoriesWrapper}>
            <CategorySidebar
              categories={categories}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={handleToggleSidebar}
            />
          </div>

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
          />
        </div>
      </div>
    </ToastProvider>
  );
}
