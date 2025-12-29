# Design System Guide - Best Practices

**Version:** 1.0
**Date:** 2025-12-29
**Status:** Production Ready

---

## Table of Contents

1. [Introduction](#introduction)
2. [Color System](#color-system)
3. [Touch Optimization](#touch-optimization)
4. [Components](#components)
5. [Accessibility](#accessibility)
6. [Performance](#performance)
7. [Common Patterns](#common-patterns)
8. [Do's and Don'ts](#dos-and-donts)

---

## Introduction

This design system provides a comprehensive set of components, utilities, and patterns for building accessible, touch-friendly interfaces in the Multi-POS application. All components follow WCAG 2.1 Level AAA standards and are optimized for touch devices of all sizes.

### Key Principles

1. **Accessibility First** - All components meet WCAG 2.1 Level AA minimum, targeting AAA
2. **Touch Optimized** - Minimum 48px touch targets, clear spacing, haptic feedback
3. **Responsive** - Works seamlessly from 375px phones to 4K desktops
4. **Consistent** - Unified color system, iconography, and interaction patterns
5. **Performant** - GPU-accelerated animations, optimized bundles

---

## Color System

### Feature-Based Colors

The design system uses 9 feature-based color variants that automatically apply appropriate colors:

```typescript
type FeatureVariant =
  | "sales"      // Green - Revenue, transactions
  | "inventory"  // Blue - Products, stock
  | "customers"  // Purple - Customer management
  | "expenses"   // Red - Expenses, costs
  | "purchases"  // Orange - Purchase orders
  | "reports"    // Indigo - Analytics, reports
  | "users"      // Pink - User management
  | "settings"   // Gray - Configuration
  | "tables"     // Teal - Table management
  | "default";   // Primary blue
```

### Usage

```tsx
// Components automatically apply colors based on variant
<StatCard
  title="Today's Sales"
  value="$1,234"
  variant="sales"  // Applies green color scheme
/>

<ActionCard
  title="Manage Inventory"
  variant="inventory"  // Applies blue color scheme
  icon={Package}
/>

<Button variant="warning">  // Built-in variants
  Delete
</Button>
```

### Status Colors

```typescript
// Available status colors
success: green    // Positive actions, confirmations
warning: yellow   // Cautions, important notices
danger: red       // Errors, destructive actions
info: blue        // Information, tips
pending: yellow   // In-progress states
```

### Dark Mode

All colors automatically adapt to dark mode. Use CSS variables for consistency:

```css
/* Always use CSS variables, never hardcoded colors */
.my-element {
  background: var(--background);  /* ✅ Good */
  color: var(--foreground);        /* ✅ Good */

  /* background: #ffffff;  ❌ Bad - doesn't adapt to dark mode */
}
```

### Custom Colors

For feature-specific colors:

```css
.sales-highlight {
  color: rgb(var(--color-sales));  /* Supports alpha */
  background: rgb(var(--color-sales) / 0.1);  /* 10% opacity */
}
```

---

## Touch Optimization

### Touch Target Sizes

**WCAG 2.1 Level AAA requires 48px × 48px minimum**

```tsx
// ✅ Good - Meets AAA standard
<button className="touch-target">
  Click Me
</button>  // min-width: 48px, min-height: 48px

// ✅ Better - Larger for important actions
<button className="touch-target-lg">
  Checkout
</button>  // min-width: 56px, min-height: 56px

// ✅ Best - Phones get even larger targets
<Button touchOptimized size="lg">
  Add to Cart
</Button>  // 48px desktop, 56px phone
```

### Touch Spacing

Maintain minimum 8px spacing between adjacent touch targets:

```tsx
// ✅ Good - Uses spacing utilities
<div className="flex touch-spacing">
  <button>Button 1</button>
  <button>Button 2</button>
</div>  // gap: 0.5rem (8px)

// ✅ Better - More comfortable spacing
<div className="flex touch-spacing-md">
  <button>Button 1</button>
  <button>Button 2</button>
</div>  // gap: 0.75rem (12px)
```

### Haptic Feedback

Apply visual haptic feedback to interactive elements:

```tsx
// ✅ Standard feedback for most buttons
<button className="touch-feedback">
  Click Me
</button>

// ✅ Enhanced feedback for product cards
<div className="touch-feedback-pos touch-ripple-pos" onClick={...}>
  Product Card
</div>

// ✅ Strong feedback for critical actions
<button className="touch-feedback-strong touch-ripple-danger">
  Delete
</button>

// ✅ Subtle feedback for small controls
<button className="touch-feedback-subtle">
  +1
</button>
```

---

## Components

### StatCard

Display key metrics with automatic color theming.

```tsx
import { StatCard } from '@/components/shared';

// Basic usage
<StatCard
  title="Today's Sales"
  value="$1,234.56"
  icon={DollarSign}
  variant="sales"
/>

// With trend indicator
<StatCard
  title="Monthly Revenue"
  value="$45,678"
  trend="+12%"  // Auto-colors green for positive
  variant="sales"
/>

// With loading state
<StatCard
  title="Active Users"
  value={isLoading ? undefined : userCount}
  loading={isLoading}
  variant="users"
/>

// Clickable card
<StatCard
  title="Low Stock Items"
  value={lowStockCount}
  onClick={() => router.push('/inventory')}
  variant="inventory"
/>
```

### ActionCard

Quick action buttons with icon and description.

```tsx
import { ActionCard } from '@/components/shared';

// Basic usage
<ActionCard
  title="Manage Inventory"
  description="View and update stock"
  icon={Package}
  variant="inventory"
  href="/inventory"
/>

// With badge
<ActionCard
  title="Pending Orders"
  badge="5"
  icon={ShoppingCart}
  variant="sales"
  href="/orders"
/>

// Disabled state
<ActionCard
  title="Premium Feature"
  description="Upgrade to unlock"
  icon={Star}
  variant="default"
  disabled
/>
```

### Button

Touch-optimized button component.

```tsx
import { Button } from '@/components/shared';

// Variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="warning">Destructive Action</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Touch optimization (default: true)
<Button touchOptimized hapticFeedback>
  Touch-Friendly Button
</Button>

// Loading state
<Button loading disabled>
  Processing...
</Button>

// Icon button
<IconButton icon={Search} aria-label="Search" />
```

### Input

Enhanced input with touch optimization.

```tsx
import { Input } from '@/components/shared';

// Basic usage
<Input
  label="Product Name"
  placeholder="Enter product name"
  required
/>

// With clear button
<Input
  label="Search"
  clearButton
  leftIcon={<Search />}
/>

// Number input with steppers
<Input
  label="Quantity"
  type="number"
  stepperButtons
  min={1}
  max={100}
/>

// Touch optimized (default: true)
<Input
  label="Phone Number"
  type="tel"
  touchOptimized
/>
```

### NumberPad

Touch-optimized numeric input.

```tsx
import { NumberPad } from '@/components/shared';

function QuantityDialog() {
  const [quantity, setQuantity] = useState(1);

  return (
    <NumberPad
      value={quantity}
      onChange={setQuantity}
      max={product.stockLevel}
      onConfirm={() => addToCart(product, quantity)}
      onCancel={() => closeDialog()}
      variant="sales"
      label="Enter quantity"
      showDisplay
    />
  );
}
```

### Breadcrumbs

Navigation breadcrumb trail.

```tsx
import { Breadcrumbs } from '@/components/shared';
import { Home, Package, Tag } from 'lucide-react';

<Breadcrumbs
  items={[
    { label: 'Dashboard', href: '/branch', icon: Home },
    { label: 'Inventory', href: '/branch/inventory', icon: Package },
    { label: 'Categories', icon: Tag }  // Current page (no href)
  ]}
/>
```

---

## Accessibility

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible:

```tsx
// ✅ Good - Uses native button
<button onClick={...}>
  Click Me
</button>

// ❌ Bad - div not keyboard accessible
<div onClick={...}>
  Click Me
</div>

// ✅ Fixed - Add role and tabIndex
<div
  role="button"
  tabIndex={0}
  onClick={...}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Click Me
</div>
```

### ARIA Labels

Provide labels for screen readers:

```tsx
// ✅ Good - Clear label for icon-only button
<button aria-label="Search products">
  <Search />
</button>

// ✅ Good - Associate label with input
<label htmlFor="email">Email Address</label>
<input id="email" type="email" />

// ✅ Good - Describe error
<input
  aria-invalid={hasError}
  aria-describedby="email-error"
/>
{hasError && (
  <p id="email-error">Please enter a valid email</p>
)}
```

### Focus Management

Ensure visible focus indicators:

```tsx
// ✅ Automatic focus ring (applied globally)
<button>Click Me</button>  // Shows outline on focus

// ⚠️ Custom focus styles must maintain visibility
<button className="my-button focus:outline-none focus:ring-2 focus:ring-primary">
  Custom Focus
</button>
```

### Reduced Motion

Respect user's motion preferences:

```tsx
// ✅ Animations automatically disabled with prefers-reduced-motion
<div className="touch-ripple-pos">  // Ripple disabled for reduced motion users
  Content
</div>

// For custom animations, use media query:
@media (prefers-reduced-motion: reduce) {
  .my-animation {
    animation: none !important;
  }
}
```

---

## Performance

### Animation Performance

Use GPU-accelerated properties:

```css
/* ✅ Good - GPU accelerated */
.element {
  transform: scale(0.95);  /* ✅ */
  opacity: 0.5;             /* ✅ */
}

/* ❌ Bad - Triggers layout/paint */
.element {
  width: 95%;      /* ❌ */
  margin-left: 5%; /* ❌ */
  background: red; /* ❌ Triggers paint */
}
```

### Lazy Loading

Load components only when needed:

```tsx
// ✅ Good - Lazy load heavy components
import dynamic from 'next/dynamic';

const NumberPad = dynamic(() => import('@/components/shared/NumberPad'), {
  loading: () => <Skeleton />
});

// Use Suspense for React components
import { Suspense } from 'react';

<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

### Image Optimization

Always optimize images:

```tsx
// ✅ Good - Use Next.js Image component
import Image from 'next/image';

<Image
  src="/product.jpg"
  alt="Product name"
  width={200}
  height={200}
  loading="lazy"
/>

// ✅ Good - Use OptimizedImage wrapper
import { OptimizedImage } from '@/components/shared';

<OptimizedImage
  src="/product.jpg"
  alt="Product name"
  aspectRatio="1:1"
/>
```

---

## Common Patterns

### Dashboard Layout

```tsx
import { PageHeader, StatCard, ActionCard } from '@/components/shared';

function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your business"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Sales" value="$1,234" variant="sales" />
        <StatCard title="Orders" value="45" variant="inventory" />
        {/* More stats... */}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard title="New Sale" variant="sales" href="/pos" />
        {/* More actions... */}
      </div>
    </div>
  );
}
```

### Form Layout

```tsx
import { Input, Select, Button } from '@/components/shared';

function ProductForm() {
  return (
    <form className="space-y-4">
      <Input
        label="Product Name"
        required
        clearButton
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Price"
          type="number"
          stepperButtons
          min={0}
          step={0.01}
        />

        <Input
          label="Stock"
          type="number"
          stepperButtons
          min={0}
        />
      </div>

      <Select
        label="Category"
        options={categories}
      />

      <div className="flex gap-4 justify-end touch-spacing">
        <Button variant="secondary" type="button">
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Save Product
        </Button>
      </div>
    </form>
  );
}
```

### Touch-Optimized Product Grid

```tsx
function ProductGrid({ products, onSelect }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onSelect(product)}
          className="touch-feedback-pos touch-ripple-pos bg-card rounded-lg p-4 min-h-[160px] flex flex-col gap-3"
          aria-label={`Add ${product.name} to cart, ${formatPrice(product.price)}`}
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-32 object-contain"
          />
          <div className="text-left">
            <p className="font-semibold text-sm truncate">{product.name}</p>
            <p className="text-lg font-bold text-sales">{formatPrice(product.price)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
```

---

## Do's and Don'ts

### Touch Targets

✅ **DO:**
- Make all interactive elements ≥48px × 48px
- Use `touch-target` utility classes
- Provide 8px minimum spacing between targets
- Make entire cards clickable, not just small areas

❌ **DON'T:**
- Create buttons smaller than 44px
- Place interactive elements too close together
- Rely on precise clicking for critical actions
- Use tiny icon-only buttons without adequate padding

### Colors

✅ **DO:**
- Use feature variant props for automatic coloring
- Use CSS variables for theme adaptation
- Test contrast with WebAIM checker
- Provide sufficient contrast in dark mode

❌ **DON'T:**
- Hardcode color values
- Rely on color alone to convey information
- Use low-contrast color combinations
- Forget to test dark mode

### Accessibility

✅ **DO:**
- Use semantic HTML elements
- Provide ARIA labels for icon-only buttons
- Ensure keyboard navigation works
- Test with screen readers
- Respect prefers-reduced-motion

❌ **DON'T:**
- Use `<div>` for buttons
- Forget alt text on images
- Create keyboard traps
- Use auto-playing animations
- Rely solely on mouse/touch interaction

### Performance

✅ **DO:**
- Use GPU-accelerated properties (transform, opacity)
- Lazy load heavy components
- Optimize images
- Monitor bundle size
- Use React.memo for expensive renders

❌ **DON'T:**
- Animate width/height/margin
- Load all components upfront
- Use unoptimized images
- Create unnecessary re-renders
- Block the main thread

### Responsive Design

✅ **DO:**
- Test on actual devices
- Use mobile-first approach
- Provide appropriate touch targets at all breakpoints
- Test both portrait and landscape orientations

❌ **DON'T:**
- Design only for desktop
- Assume all phones are the same size
- Create horizontal scrolling
- Break functionality on small screens

---

## Quick Reference

### Utility Class Cheat Sheet

```css
/* Touch Targets */
.touch-target      /* 48px × 48px (AAA) */
.touch-target-sm   /* 44px × 44px (AA) */
.touch-target-lg   /* 56px × 56px */

/* Touch Spacing */
.touch-spacing     /* 8px gap */
.touch-spacing-md  /* 12px gap */
.touch-spacing-lg  /* 16px gap */

/* Touch Feedback */
.touch-feedback          /* Standard scale */
.touch-feedback-pos      /* POS cards */
.touch-feedback-strong   /* Critical actions */
.touch-feedback-subtle   /* Small controls */

/* Ripple Effects */
.touch-ripple-pos      /* Green ripple */
.touch-ripple-success  /* Success ripple */
.touch-ripple-danger   /* Danger ripple */

/* Animations */
.touch-bounce  /* Bounce animation */
.touch-pulse   /* Pulse animation */
```

### Component Import Reference

```tsx
// Shared Components
import {
  StatCard,
  ActionCard,
  Button,
  IconButton,
  Input,
  Select,
  NumberPad,
  Breadcrumbs,
  PageHeader,
  LoadingSpinner,
  ErrorAlert,
} from '@/components/shared';

// Icons (Lucide React)
import {
  DollarSign,
  Package,
  Users,
  TrendingUp,
  ShoppingCart,
  BarChart3,
} from 'lucide-react';
```

---

## Support & Resources

### Documentation
- [Accessibility Audit Report](./2025-12-29-accessibility-audit-report.md)
- [Testing Checklist](./2025-12-29-testing-checklist.md)
- [Phase Implementation Summaries](./README.md)

### Tools
- **Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **axe DevTools:** Browser extension for accessibility testing
- **Lighthouse:** Built into Chrome DevTools

### Standards
- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Practices:** https://www.w3.org/WAI/ARIA/apg/

---

## Changelog

### Version 1.0 (2025-12-29)
- Initial release
- 9 feature-based color variants
- Touch optimization (48px targets)
- 8 shared components
- Comprehensive accessibility support
- Dark mode support
- Reduced motion support

---

**Maintained by:** Development Team
**Last Updated:** 2025-12-29
**Status:** Production Ready ✅
