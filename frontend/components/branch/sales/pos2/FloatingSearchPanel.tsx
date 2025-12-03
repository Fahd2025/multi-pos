"use client";

import React, { useState, useEffect } from "react";
import { X, Star, Package, TrendingUp } from "lucide-react";
import styles from "./FloatingSearchPanel.module.css";
import { ProductDto } from "@/types/api.types";
import { buildProductImageUrl } from "@/lib/image-utils";

interface FloatingSearchPanelProps {
  isVisible: boolean;
  searchQuery: string;
  products: ProductDto[];
  isLoading: boolean;
  onClose: () => void;
  onSelectProduct: (product: ProductDto) => void;
  branchCode: string;
}

interface PinnedProduct {
  id: string;
  timestamp: number;
}

export const FloatingSearchPanel: React.FC<FloatingSearchPanelProps> = ({
  isVisible,
  searchQuery,
  products,
  isLoading,
  onClose,
  onSelectProduct,
  branchCode,
}) => {
  const [pinnedProductIds, setPinnedProductIds] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Trim search query for display
  const trimmedSearchQuery = searchQuery.trim();

  // Load pinned products from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("pos_pinned_products");
    if (stored) {
      try {
        const pinned: PinnedProduct[] = JSON.parse(stored);
        setPinnedProductIds(new Set(pinned.map((p) => p.id)));
      } catch (e) {
        console.error("Error loading pinned products:", e);
      }
    }
  }, []);

  // Toggle pin status
  const togglePin = (productId: string) => {
    const stored = localStorage.getItem("pos_pinned_products");
    let pinned: PinnedProduct[] = stored ? JSON.parse(stored) : [];

    if (pinnedProductIds.has(productId)) {
      // Unpin
      pinned = pinned.filter((p) => p.id !== productId);
      setPinnedProductIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    } else {
      // Pin
      pinned.push({ id: productId, timestamp: Date.now() });
      setPinnedProductIds((prev) => new Set(prev).add(productId));
    }

    localStorage.setItem("pos_pinned_products", JSON.stringify(pinned));
  };

  // Separate pinned and unpinned products
  const pinnedProducts = products.filter((p) => pinnedProductIds.has(p.id));
  const unpinnedProducts = products.filter((p) => !pinnedProductIds.has(p.id));

  if (!isVisible) return null;

  const renderProductCard = (product: ProductDto, isPinned: boolean = false) => {
    const hasImage = product.images && product.images.length > 0;
    const isError = imageErrors[product.id];

    return (
      <div
        key={product.id}
        className={`${styles.productCard} ${isPinned ? styles.pinnedCard : ""}`}
        onClick={() => onSelectProduct(product)}
      >
        {/* Pin Button */}
        <button
          className={`${styles.pinButton} ${isPinned ? styles.pinned : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            togglePin(product.id);
          }}
          title={isPinned ? "Unpin product" : "Pin product"}
        >
          <Star size={16} fill={isPinned ? "currentColor" : "none"} />
        </button>

        {/* Product Image */}
        <div className={styles.productImage}>
          {hasImage && !isError ? (
            <img
              src={buildProductImageUrl(branchCode, product.images[0].imagePath, product.id, "thumb")}
              alt={product.nameEn}
              onError={() => setImageErrors((prev) => ({ ...prev, [product.id]: true }))}
            />
          ) : (
            <Package size={32} className={styles.placeholderIcon} />
          )}
        </div>

        {/* Product Details */}
        <div className={styles.productDetails}>
          <h4 className={styles.productName}>{product.nameEn}</h4>
          <p className={styles.productCategory}>{product.categoryNameEn || "Uncategorized"}</p>

          <div className={styles.productMeta}>
            <div className={styles.stockInfo}>
              <span
                className={`${styles.stockBadge} ${
                  product.stockLevel <= 0
                    ? styles.outOfStock
                    : product.stockLevel <= product.minStockThreshold
                    ? styles.lowStock
                    : styles.inStock
                }`}
              >
                {product.stockLevel <= 0
                  ? "Out of Stock"
                  : product.stockLevel <= product.minStockThreshold
                  ? `Low Stock: ${product.stockLevel}`
                  : `Stock: ${product.stockLevel}`}
              </span>
            </div>
            <div className={styles.priceInfo}>
              <span className={styles.price}>${product.sellingPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Floating Panel */}
      <div className={styles.floatingPanel}>
        {/* Header */}
        <div className={styles.panelHeader}>
          <div className={styles.headerContent}>
            <h3 className={styles.panelTitle}>
              {trimmedSearchQuery ? `Search: "${trimmedSearchQuery}"` : "Search Products"}
            </h3>
            {products.length > 0 && (
              <span className={styles.resultCount}>
                {products.length} result{products.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close search panel">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.panelContent}>
          {/* Loading State */}
          {isLoading && (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner} />
              <p>Searching products...</p>
            </div>
          )}

          {/* No Results State */}
          {!isLoading && trimmedSearchQuery && products.length === 0 && (
            <div className={styles.noResultsState}>
              <Package size={48} className={styles.noResultsIcon} />
              <h4>No products found</h4>
              <p>
                We couldn't find any products matching <strong>"{trimmedSearchQuery}"</strong>
              </p>
              <ul className={styles.suggestionsList}>
                <li>Check your spelling</li>
                <li>Try different search terms</li>
                <li>Use product barcode or SKU</li>
              </ul>
            </div>
          )}

          {/* Pinned Products Section */}
          {!isLoading && pinnedProducts.length > 0 && (
            <div className={styles.pinnedSection}>
              <div className={styles.sectionHeader}>
                <TrendingUp size={18} />
                <h4>Pinned Products</h4>
              </div>
              <div className={styles.productsGrid}>{pinnedProducts.map((p) => renderProductCard(p, true))}</div>
            </div>
          )}

          {/* Regular Search Results */}
          {!isLoading && unpinnedProducts.length > 0 && (
            <div className={styles.resultsSection}>
              {pinnedProducts.length > 0 && (
                <div className={styles.sectionHeader}>
                  <h4>Other Results</h4>
                </div>
              )}
              <div className={styles.productsGrid}>{unpinnedProducts.map((p) => renderProductCard(p, false))}</div>
            </div>
          )}

          {/* Empty State (no search query) */}
          {!isLoading && !trimmedSearchQuery && products.length === 0 && pinnedProducts.length === 0 && (
            <div className={styles.emptyState}>
              <Package size={48} className={styles.emptyIcon} />
              <h4>Start searching</h4>
              <p>Type a product name, barcode, or SKU to search</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
