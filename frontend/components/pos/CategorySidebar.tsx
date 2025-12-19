"use client";

import React from "react";
import {
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
  Menu,
} from "lucide-react";
import styles from "./Pos2.module.css";
import { CategoryDto } from "@/types/api.types";

interface CategorySidebarProps {
  categories: CategoryDto[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
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
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""}`}>
      {/* Toggle Button - inside sidebar */}
      {!isCollapsed && (
        <button
          className={styles.sidebarToggle}
          onClick={onToggleCollapse}
          aria-label="Hide sidebar"
          title="Hide sidebar"
        >
          <Menu size={32} />
        </button>
      )}

      {/* "All Menu" category */}
      <div
        className={`${styles.menuItem} ${activeCategory === "all" ? styles.active : ""}`}
        onClick={() => onSelectCategory("all")}
        title="All Menu"
      >
        <LayoutGrid className={styles.menuIcon} />
        <span style={{ fontSize: "0.75rem", textAlign: "center", lineHeight: 1.1 }}>All Menu</span>
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
            <span style={{ fontSize: "0.75rem", textAlign: "center", lineHeight: 1.1 }}>
              {cat.nameEn}
            </span>
          </div>
        );
      })}
    </div>
  );
};
