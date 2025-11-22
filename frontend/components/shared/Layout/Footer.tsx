/**
 * Footer Component
 * Page footer with copyright and links
 */

import React from 'react';

export interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-white border-t border-gray-200 mt-auto ${className}`}>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          {/* Left side - Copyright */}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500">
              © {currentYear} Multi-Branch POS System. All rights reserved.
            </p>
          </div>

          {/* Right side - Links */}
          <div className="mt-4 md:mt-0">
            <div className="flex justify-center md:justify-end space-x-6">
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Help
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Documentation
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Support
              </a>
            </div>
          </div>
        </div>

        {/* Version info */}
        <div className="mt-4 text-center md:text-left">
          <p className="text-xs text-gray-400">
            Version 1.0.0 | Build 2025.11.22
          </p>
        </div>
      </div>
    </footer>
  );
};
