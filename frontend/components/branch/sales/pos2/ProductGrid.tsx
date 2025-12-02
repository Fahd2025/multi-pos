import React from "react";
import styles from "./Pos2.module.css";
import { ProductDto } from "@/types/api.types";
import { buildProductImageUrl } from "@/lib/image-utils";

interface ProductGridProps {
  products: ProductDto[];
  onAddToCart: (product: ProductDto) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart }) => {
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

  // Fallback image for products without images
  const fallbackImage =
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60";

  return (
    <div className={styles.productGrid}>
      {products.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            gridColumn: "1 / -1",
            marginTop: "2rem",
          }}
        >
          No products available
        </div>
      ) : (
        products.map((product) => {
          // Get product image URL
          const imageUrl = product.images && product.images.length > 0
            ? buildProductImageUrl(branchCode, product.images[0].imagePath, product.id, "thumb")
            : fallbackImage;

          return (
            <div
              key={product.id}
              className={styles.productCard}
              onClick={() => onAddToCart(product)}
              style={{
                cursor: product.stockLevel > 0 ? "pointer" : "not-allowed",
                opacity: product.stockLevel > 0 ? 1 : 0.6,
              }}
            >
              <img
                src={imageUrl}
                alt={product.nameEn}
                className={styles.productImage}
                onError={(e) => {
                  // Fallback to default image if product image fails to load
                  (e.target as HTMLImageElement).src = fallbackImage;
                }}
              />
              <div className={styles.productName}>{product.nameEn}</div>
              <div className={styles.productPrice}>${product.sellingPrice.toFixed(2)}</div>
              {product.stockLevel <= 0 && (
                <div style={{ fontSize: "0.75rem", color: "red", marginTop: "0.25rem" }}>
                  Out of Stock
                </div>
              )}
              {product.stockLevel > 0 && product.stockLevel <= product.minStockThreshold && (
                <div style={{ fontSize: "0.75rem", color: "orange", marginTop: "0.25rem" }}>
                  Low Stock
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
