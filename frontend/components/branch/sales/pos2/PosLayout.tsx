"use client";

import React, { useState, useEffect } from "react";
import styles from "./Pos2.module.css";
import { CategorySidebar } from "./CategorySidebar";
import { TopBar } from "./TopBar";
import { ProductGrid } from "./ProductGrid";
import { OrderPanel } from "./OrderPanel";
import inventoryService from "@/services/inventory.service";
import { CategoryDto, ProductDto } from "@/types/api.types";

interface CartItem extends ProductDto {
  quantity: number;
}

export default function PosLayout() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartVisible, setIsCartVisible] = useState(true); // Default true for desktop

  // Set initial cart visibility based on screen size (only once on mount)
  useEffect(() => {
    // On mobile (<= 768px), hide cart by default
    // On desktop, show cart by default
    const isMobile = window.innerWidth <= 768;
    setIsCartVisible(!isMobile);
  }, []);

  // Fetch categories and products on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories and products in parallel
        const [categoriesData, productsResponse] = await Promise.all([
          inventoryService.getCategories(),
          inventoryService.getProducts({ isActive: true, pageSize: 1000 }),
        ]);

        setCategories(categoriesData);
        setProducts(productsResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  // Play success beep sound
  const playSuccessBeep = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log("Audio not supported");
    }
  };

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
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setCart([]);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(id);
      return;
    }

    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  // Filter products by category
  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.categoryId === activeCategory);

  // Calculate cart item count
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Toggle cart visibility
  const handleToggleCart = () => {
    setIsCartVisible(!isCartVisible);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <div style={{ color: "red" }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <CategorySidebar
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      <div className={styles.mainContent}>
        <TopBar
          cartItemCount={cartItemCount}
          onToggleCart={handleToggleCart}
          isCartVisible={isCartVisible}
          onAddToCart={handleAddToCart}
          branchCode={branchCode}
        />
        <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} />
      </div>

      {/* Backdrop overlay for mobile */}
      {isCartVisible && (
        <div
          className={styles.cartBackdrop}
          onClick={handleToggleCart}
        />
      )}

      {/* Order Panel with conditional visibility class */}
      <div className={`${styles.orderPanel} ${isCartVisible ? styles.cartVisible : ''}`}>
        <OrderPanel
          cart={cart}
          onRemoveItem={handleRemoveItem}
          onClearAll={handleClearAll}
          onUpdateQuantity={handleUpdateQuantity}
          onClose={handleToggleCart}
        />
      </div>
    </div>
  );
}
