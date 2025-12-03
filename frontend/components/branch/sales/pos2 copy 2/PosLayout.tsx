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
        <TopBar />
        <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} />
      </div>

      <OrderPanel
        cart={cart}
        onRemoveItem={handleRemoveItem}
        onClearAll={handleClearAll}
        onUpdateQuantity={handleUpdateQuantity}
      />
    </div>
  );
}
