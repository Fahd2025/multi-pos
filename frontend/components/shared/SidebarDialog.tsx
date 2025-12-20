/**
 * SidebarDialog Component
 * A reusable sidebar dialog that slides in from the right
 * Can be used for detail views, forms, and other overlay content
 */

import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import styles from './SidebarDialog.module.css';

export interface SidebarDialogProps {
  /** Whether the sidebar is open */
  isOpen: boolean;
  /** Callback when the sidebar should close */
  onClose: () => void;
  /** Title displayed in the header */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Optional badge/tag to display next to the title */
  titleBadge?: React.ReactNode;
  /** Content to display in the sidebar */
  children: React.ReactNode;
  /** Optional custom header actions (buttons, icons, etc.) */
  headerActions?: React.ReactNode;
  /** Show back button instead of close button in header */
  showBackButton?: boolean;
  /** Custom width for the sidebar (default: varies by screen size) */
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether to show the close button (X) in the header */
  showCloseButton?: boolean;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Optional CSS class for custom styling */
  className?: string;
  /** Optional CSS class for content area */
  contentClassName?: string;
}

export const SidebarDialog: React.FC<SidebarDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  titleBadge,
  children,
  headerActions,
  showBackButton = false,
  width = 'md',
  showCloseButton = true,
  footer,
  className = '',
  contentClassName = '',
}) => {
  // Prevent rendering if not open
  if (!isOpen) return null;

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent body scroll when sidebar is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div
      className={styles.sidebarOverlay}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sidebar-title"
    >
      <div className={`${styles.sidebarDialog} ${styles[`width-${width}`]} ${className}`}>
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <div className={styles.headerLeft}>
            {showBackButton && (
              <button
                className={styles.backBtn}
                onClick={onClose}
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className={styles.headerTitleGroup}>
              <div className={styles.titleRow}>
                <h2 id="sidebar-title" className={styles.title}>{title}</h2>
                {titleBadge && <div className={styles.titleBadge}>{titleBadge}</div>}
              </div>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          </div>

          <div className={styles.headerActions}>
            {headerActions}
            {showCloseButton && (
              <button
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={`${styles.sidebarContent} ${contentClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={styles.sidebarFooter}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarDialog;
