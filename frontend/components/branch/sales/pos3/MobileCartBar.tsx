/**
 * Mobile Cart Bottom Bar Component
 * Sticky bottom bar showing cart summary for mobile devices
 */

'use client';

import { SaleLineItem } from '../SaleLineItemsList';
import { DiscountType } from '@/types/enums';

interface MobileCartBarProps {
  items: SaleLineItem[];
  onClick: () => void;
}

export default function MobileCartBar({ items, onClick }: MobileCartBarProps) {
  const calculateLineTotal = (item: SaleLineItem): number => {
    let discountedPrice = item.unitPrice;

    if (item.discountType === DiscountType.Percentage) {
      discountedPrice = item.unitPrice * (1 - item.discountValue / 100);
    } else if (item.discountType === DiscountType.FixedAmount) {
      discountedPrice = item.unitPrice - item.discountValue;
    }

    return discountedPrice * item.quantity;
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
    const tax = subtotal * 0.15; // 15% tax
    return subtotal + tax;
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = calculateTotal();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden mobile-safe-bottom">
      <button
        onClick={onClick}
        className="
          w-full
          bg-gradient-to-r from-blue-600 to-blue-700
          hover:from-blue-700 hover:to-blue-800
          active:from-blue-800 active:to-blue-900
          text-white
          px-4 py-4
          shadow-2xl
          flex items-center justify-between
          touch-manipulation
          active:scale-98
          transition-all duration-200
          min-h-[68px]
        "
        aria-label={`View cart with ${itemCount} items, total ${total.toFixed(2)} dollars`}
      >
        {/* Left: Cart Icon + Item Count */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="
              absolute -top-2 -right-2
              bg-red-500
              text-white text-xs font-bold
              rounded-full
              min-w-[22px] h-[22px]
              flex items-center justify-center
              px-1
              shadow-md
            ">
              {itemCount}
            </span>
          </div>
          <div className="text-left">
            <p className="font-bold text-base">View Cart</p>
            <p className="text-xs opacity-90">
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Right: Total */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs opacity-90">Total</p>
            <p className="text-2xl font-bold">
              ${total.toFixed(2)}
            </p>
          </div>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </button>
    </div>
  );
}
