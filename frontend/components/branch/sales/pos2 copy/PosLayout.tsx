"use client";

import React, { useState } from "react";
import styles from "./Pos2.module.css";
import { CategorySidebar } from "./CategorySidebar";
import { TopBar } from "./TopBar";
import { ProductGrid } from "./ProductGrid";
import { OrderPanel } from "./OrderPanel";

export default function PosLayout() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<any[]>([]);

  const handleAddToCart = (product: any) => {
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

  const handleRemoveItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setCart([]);
  };

  return (
    <div className={styles.container}>
      <CategorySidebar activeCategory={activeCategory} onSelectCategory={setActiveCategory} />

      <div className={styles.mainContent}>
        <TopBar />
        <ProductGrid onAddToCart={handleAddToCart} />
      </div>

      <OrderPanel cart={cart} onRemoveItem={handleRemoveItem} onClearAll={handleClearAll} />
    </div>
  );
}
