# SidebarDialog Component - Usage Examples

## Overview
A reusable sidebar dialog component that slides in from the right side of the screen. Perfect for detail views, forms, and other overlay content.

## Basic Usage

```tsx
import { SidebarDialog } from '@/components/shared';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Sidebar</button>

      <SidebarDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="My Sidebar"
      >
        <p>Your content goes here</p>
      </SidebarDialog>
    </>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | required | Whether the sidebar is open |
| `onClose` | `() => void` | required | Callback when the sidebar should close |
| `title` | `string` | required | Title displayed in the header |
| `subtitle` | `string` | optional | Optional subtitle or description |
| `children` | `ReactNode` | required | Content to display in the sidebar |
| `headerActions` | `ReactNode` | optional | Custom header actions (buttons, icons, etc.) |
| `showBackButton` | `boolean` | `false` | Show back button instead of close button |
| `width` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Width of the sidebar |
| `showCloseButton` | `boolean` | `true` | Whether to show the close button (X) |
| `footer` | `ReactNode` | optional | Optional footer content |
| `className` | `string` | optional | Custom CSS class for styling |
| `contentClassName` | `string` | optional | Custom CSS class for content area |

## Width Options

```tsx
// Small sidebar (max-width: 320px)
<SidebarDialog width="sm" {...props}>Content</SidebarDialog>

// Medium sidebar (max-width: 480px) - Default
<SidebarDialog width="md" {...props}>Content</SidebarDialog>

// Large sidebar (max-width: 640px)
<SidebarDialog width="lg" {...props}>Content</SidebarDialog>

// Extra large sidebar (max-width: 800px)
<SidebarDialog width="xl" {...props}>Content</SidebarDialog>

// Full width sidebar
<SidebarDialog width="full" {...props}>Content</SidebarDialog>
```

## Advanced Examples

### With Subtitle and Header Actions

```tsx
<SidebarDialog
  isOpen={isOpen}
  onClose={handleClose}
  title="User Profile"
  subtitle="Edit user information"
  headerActions={
    <>
      <button onClick={handleSave}>Save</button>
      <button onClick={handleDelete}>Delete</button>
    </>
  }
>
  <form>
    {/* Form fields */}
  </form>
</SidebarDialog>
```

### With Back Button

```tsx
<SidebarDialog
  isOpen={isOpen}
  onClose={handleClose}
  title="Order Details"
  showBackButton={true}
  width="lg"
>
  <div>
    {/* Order details content */}
  </div>
</SidebarDialog>
```

### With Footer Actions

```tsx
<SidebarDialog
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  footer={
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
      <button onClick={handleClose}>Cancel</button>
      <button onClick={handleConfirm}>Confirm</button>
    </div>
  }
>
  <p>Are you sure you want to proceed?</p>
</SidebarDialog>
```

### Complete Example - User Detail View

```tsx
import { SidebarDialog } from '@/components/shared';
import { User, Mail, Phone, Save } from 'lucide-react';

interface UserDetailSidebarProps {
  user: User | null;
  onClose: () => void;
  onSave: (user: User) => void;
}

export const UserDetailSidebar: React.FC<UserDetailSidebarProps> = ({
  user,
  onClose,
  onSave,
}) => {
  const [editedUser, setEditedUser] = useState(user);

  if (!user) return null;

  return (
    <SidebarDialog
      isOpen={!!user}
      onClose={onClose}
      title="User Details"
      subtitle={user.email}
      width="lg"
      showBackButton={true}
      headerActions={
        <button onClick={() => onSave(editedUser)}>
          <Save size={18} />
        </button>
      }
      footer={
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={() => onSave(editedUser)}>Save Changes</button>
        </div>
      }
    >
      {/* Profile Section */}
      <section>
        <h3>Profile Information</h3>
        <div className="field">
          <label>
            <User size={16} />
            Name
          </label>
          <input
            value={editedUser.name}
            onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
          />
        </div>
        <div className="field">
          <label>
            <Mail size={16} />
            Email
          </label>
          <input
            type="email"
            value={editedUser.email}
            onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
          />
        </div>
        <div className="field">
          <label>
            <Phone size={16} />
            Phone
          </label>
          <input
            type="tel"
            value={editedUser.phone}
            onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
          />
        </div>
      </section>
    </SidebarDialog>
  );
};
```

## Accessibility Features

- Automatically manages focus and prevents body scroll when open
- Supports ESC key to close (via backdrop click)
- ARIA attributes for screen readers (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`)
- Keyboard navigation support

## Responsive Behavior

- On mobile devices (< 768px), the sidebar automatically becomes full width
- Smooth animations and transitions
- Touch-friendly scrolling with momentum

## Styling

The component uses CSS modules for styling and supports:
- Light and dark mode (automatically adapts to system preferences)
- Custom CSS variables for theming
- Smooth animations and transitions
- Custom scrollbar styling

## Notes

- The component automatically prevents body scroll when open
- Clicking the backdrop closes the sidebar
- Only renders when `isOpen` is true for performance
- Supports nested scrollable content
