import React from "react";
import { Search, Users, LayoutPanelTop, Percent, Save } from "lucide-react";
import styles from "./Pos2.module.css";

export const TopBar: React.FC = () => {
  return (
    <div className={styles.topBar}>
      <div className={styles.searchBar}>
        <Search className={styles.searchIcon} />
        <input type="text" placeholder="Search Product..." className={styles.searchInput} />
      </div>

      {/* These might be better placed in the OrderPanel or TopBar depending on the exact layout. 
          The user description says "Top Bar (Search & Actions)" but also mentions "Action buttons... are well-placed for transactional flow".
          In the image description, "Customer, Tables, Discount, Save Bill" seem to be in the top right or near the order panel.
          Let's assume they are part of the main content top area or the order panel top area.
          Looking at standard POS layouts, they are often on the right side above the cart.
          The user description lists them under "Top Bar". 
          However, the "Order Details Panel" section mentions "Dine In vs Take Away".
          I will place them in the TopBar for now as requested.
      */}
    </div>
  );
};
