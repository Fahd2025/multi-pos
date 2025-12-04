import React, { useState } from "react";
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
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  return (
    <div className={styles.productGrid}>
      {products.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "var(--muted-foreground)",
            gridColumn: "1 / -1",
            marginTop: "2rem",
          }}
        >
          No products available
        </div>
      ) : (
        products.map((product) => {
          // Get product image URL
          const hasImage = product.images && product.images.length > 0;
          const isError = imageErrors[product.id];

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
              {hasImage && !isError ? (
                <img
                  src={buildProductImageUrl(
                    branchCode,
                    product.images[0].imagePath,
                    product.id,
                    "thumb"
                  )}
                  alt={product.nameEn}
                  className={styles.productImage}
                  onError={() => setImageErrors((prev) => ({ ...prev, [product.id]: true }))}
                />
              ) : (
                <div
                  className={styles.productImage}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "var(--muted)",
                    fontSize: "3rem",
                  }}
                >
                  📦
                </div>
              )}
              <div className={styles.productName}>{product.nameEn}</div>

              <div className={styles.productMeta}>
                <div className={styles.stockInfo}>
                  {product.stockLevel <= 0 && (
                    <span className={`${styles.stockBadge} ${styles.stockBadgeOutOfStock}`}>
                      Out of Stock
                    </span>
                  )}
                  {product.stockLevel > 0 && product.stockLevel <= product.minStockThreshold && (
                    <span className={`${styles.stockBadge} ${styles.stockBadgeLowStock}`}>
                      Low Stock
                    </span>
                  )}
                </div>
                <div className={styles.priceInfo}>
                  <span className={styles.productPrice}>${product.sellingPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
