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
    <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-5">
      {products.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center p-12 text-muted-foreground">
          <span className="text-4xl mb-4">📦</span>
          <p>No products available</p>
        </div>
      ) : (
        products.map((product) => {
          const isOutOfStock = product.stockLevel <= 0;
          const isLowStock =
            product.stockLevel > 0 && product.stockLevel < product.minStockThreshold;

          return (
            <button
              key={product.id}
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className={`
                group relative glass
                rounded-2xl
                p-3 sm:p-4 lg:p-5
                transition-all duration-200
                touch-manipulation
                min-h-[180px] sm:min-h-[200px] lg:min-h-[240px]
                text-left flex flex-col justify-between

                focus:outline-none focus:ring-4 focus:ring-primary/50 focus:ring-offset-2

                ${
                  isOutOfStock
                    ? "opacity-50 cursor-not-allowed bg-muted/50"
                    : "hover:border-primary/50 hover:shadow-lg active:scale-95 cursor-pointer hover:bg-white/50 dark:hover:bg-white/5"
                }
              `}
            >
              <div className="aspect-square bg-white dark:bg-gray-700/50 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative w-full">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={buildProductImageUrl(
                      branchCode,
                      product.images[0].imagePath,
                      product.id,
                      "thumb"
                    )}
                    alt={product.nameEn}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : (
                  <span className="text-4xl md:text-5xl">📦</span>
                )}

                {/* Fallback for error or no image (hidden by default if image exists) */}
                {product.images && product.images.length > 0 && (
                  <div className="hidden absolute inset-0 flex items-center justify-center bg-muted">
                    <span className="text-4xl">📦</span>
                  </div>
                )}

                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                    <span className="px-3 py-1.5 bg-destructive text-destructive-foreground text-sm font-bold rounded">
                      OUT OF STOCK
                    </span>
                  </div>
                )}

                {isLowStock && !isOutOfStock && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded shadow-sm">
                      LOW
                    </span>
                  </div>
                )}
              </div>

              <div className="w-full">
                <h4 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                  {product.nameEn}
                </h4>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-lg sm:text-xl font-bold text-primary">
                      ${product.sellingPrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Stock: {product.stockLevel}
                    </span>
                  </div>

                  {!isOutOfStock && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <span className="text-lg font-bold">+</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
};
