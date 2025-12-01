import React from "react";
import { Utensils, Sandwich, Drumstick, CupSoda, Coffee, IceCream, LayoutGrid } from "lucide-react";
import styles from "./Pos2.module.css";

interface CategorySidebarProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

const categories = [
  { id: "all", label: "All Menu", icon: Utensils },
  { id: "burger", label: "Burger", icon: Sandwich },
  { id: "chicken", label: "Fried Chicken", icon: Drumstick },
  { id: "drink", label: "Drink", icon: CupSoda },
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "dessert", label: "Dessert", icon: IceCream },
  { id: "other", label: "Other Menu", icon: LayoutGrid },
];

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
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

      {categories.map((cat) => (
        <div
          key={cat.id}
          className={`${styles.menuItem} ${activeCategory === cat.id ? styles.active : ""}`}
          onClick={() => onSelectCategory(cat.id)}
        >
          <cat.icon className={styles.menuIcon} />
          <span style={{ fontSize: "0.75rem", textAlign: "center", lineHeight: 1.1 }}>
            {cat.label}
          </span>
        </div>
      ))}
    </div>
  );
};
