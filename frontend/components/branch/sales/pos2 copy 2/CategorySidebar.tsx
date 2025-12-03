import React from "react";
import { Utensils, Sandwich, Drumstick, CupSoda, Coffee, IceCream, LayoutGrid, Pizza, Salad, Cake } from "lucide-react";
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
  return (
    <div className={styles.sidebar}>
      {/* Logo Placeholder - matching the "ClaPos" or similar from image */}
      <div className={styles.logo}>
        <div
          style={{
            width: 24,
            height: 24,
            background: "var(--primary-color)",
            borderRadius: "4px",
            transform: "rotate(45deg)",
          }}
        ></div>
      </div>

      {/* "All Menu" category */}
      <div
        className={`${styles.menuItem} ${activeCategory === "all" ? styles.active : ""}`}
        onClick={() => onSelectCategory("all")}
      >
        <Utensils className={styles.menuIcon} />
        <span style={{ fontSize: "0.75rem", textAlign: "center", lineHeight: 1.1 }}>
          All Menu
        </span>
      </div>

      {/* Real categories from backend */}
      {categories.map((cat) => {
        const Icon = getCategoryIcon(cat.code);
        return (
          <div
            key={cat.id}
            className={`${styles.menuItem} ${activeCategory === cat.id ? styles.active : ""}`}
            onClick={() => onSelectCategory(cat.id)}
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
