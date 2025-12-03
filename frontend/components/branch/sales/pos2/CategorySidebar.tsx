"use client";

import React, { useState, useEffect } from "react";
import {
  Utensils,
  Sandwich,
  Drumstick,
  CupSoda,
  Coffee,
  IceCream,
  LayoutGrid,
  Pizza,
  Salad,
  Cake,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import styles from "./Pos2.module.css";
import { CategoryDto } from "@/types/api.types";

interface CategorySidebarProps {
  categories: CategoryDto[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

// Map category codes to icons
const getCategoryIcon = (code: string) => {
  const iconMap: Record<string, any> = {
    burger: Sandwich,
    chicken: Drumstick,
    drink: CupSoda,
    coffee: Coffee,
    dessert: IceCream,
    pizza: Pizza,
    salad: Salad,
    cake: Cake,
    other: LayoutGrid,
  };

  return iconMap[code.toLowerCase()] || LayoutGrid;
};

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("pos_sidebar_collapsed");
    if (stored !== null) {
      setIsCollapsed(stored === "true");
    }
  }, []);

  // Toggle collapse and save to localStorage
  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("pos_sidebar_collapsed", newState.toString());
  };

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""}`}>
      {/* Toggle Button */}
      <button
        className={styles.sidebarToggle}
        onClick={handleToggleCollapse}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* "All Menu" category */}
      <div
        className={`${styles.menuItem} ${activeCategory === "all" ? styles.active : ""}`}
        onClick={() => onSelectCategory("all")}
        title="All Menu"
      >
        <Utensils className={styles.menuIcon} />
        {!isCollapsed && (
          <span style={{ fontSize: "0.75rem", textAlign: "center", lineHeight: 1.1 }}>
            All Menu
          </span>
        )}
      </div>

      {/* Real categories from backend */}
      {categories.map((cat) => {
        const Icon = getCategoryIcon(cat.code);
        return (
          <div
            key={cat.id}
            className={`${styles.menuItem} ${activeCategory === cat.id ? styles.active : ""}`}
            onClick={() => onSelectCategory(cat.id)}
            title={cat.nameEn}
          >
            <Icon className={styles.menuIcon} />
            {!isCollapsed && (
              <span style={{ fontSize: "0.75rem", textAlign: "center", lineHeight: 1.1 }}>
                {cat.nameEn}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
