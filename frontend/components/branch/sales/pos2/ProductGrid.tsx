import React from "react";
import styles from "./Pos2.module.css";

// Mock Data
const products = [
  {
    id: 1,
    name: "Deluxe Crispy Burger",
    price: 6.99,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: 2,
    name: "Classic Crispy Chicken",
    price: 4.75,
    image:
      "https://images.unsplash.com/photo-1615557960916-5f4791effe9d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: 3,
    name: "Special Crispy Burger",
    price: 5.75,
    image:
      "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: 4,
    name: "Special Burger",
    price: 6.49,
    image:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: 5,
    name: "Spicy Chicken Burger",
    price: 5.49,
    image:
      "https://images.unsplash.com/photo-1603064750589-395905f6f436?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: 6,
    name: "Cheeseburger",
    price: 5.2,
    image:
      "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: 7,
    name: "Combo Drumstick",
    price: 8.99,
    image:
      "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: 8,
    name: "Double Cheeseburger",
    price: 7.25,
    image:
      "https://images.unsplash.com/photo-1534790566855-4cb788d389ec?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: 9,
    name: "Coca Cola",
    price: 3.0,
    image:
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: 10,
    name: "Classic Cheeseburger",
    price: 4.99,
    image:
      "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: 11,
    name: "3 Cheese Wings",
    price: 3.49,
    image:
      "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: 12,
    name: "Sprite",
    price: 3.0,
    image:
      "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
];

interface ProductGridProps {
  onAddToCart: (product: any) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ onAddToCart }) => {
  return (
    <div className={styles.productGrid}>
      {products.map((product) => (
        <div key={product.id} className={styles.productCard} onClick={() => onAddToCart(product)}>
          <img src={product.image} alt={product.name} className={styles.productImage} />
          <div className={styles.productName}>{product.name}</div>
          <div className={styles.productPrice}>${product.price.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
};
