/**
 * Customer Search Component
 * Autocomplete search for customer selection in sales
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import customerService from '@/services/customer.service';
import { CustomerDto } from '@/types/api.types';

interface CustomerSearchProps {
  onSelectCustomer: (customer: CustomerDto | null) => void;
  selectedCustomer?: CustomerDto | null;
  placeholder?: string;
}

export default function CustomerSearch({
  onSelectCustomer,
  selectedCustomer,
  placeholder = 'Search customer by name, code, email, or phone...',
}: CustomerSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const delaySearch = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await customerService.searchCustomers(searchTerm, 10);
        setSearchResults(results);
        setShowResults(true);
      } catch (err) {
        console.error('Error searching customers:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const handleSelectCustomer = (customer: CustomerDto) => {
    onSelectCustomer(customer);
    setSearchTerm('');
    setShowResults(false);
    setSearchResults([]);
  };

  const handleClearCustomer = () => {
    onSelectCustomer(null);
    setSearchTerm('');
    setShowResults(false);
    setSearchResults([]);
  };

  // If a customer is already selected, show their info
  if (selectedCustomer) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-600">Customer</p>
            <p className="font-medium text-lg">{selectedCustomer.nameEn}</p>
            <div className="text-sm text-gray-600 mt-1">
              <p>Code: {selectedCustomer.code}</p>
              {selectedCustomer.email && <p>Email: {selectedCustomer.email}</p>}
              {selectedCustomer.phone && <p>Phone: {selectedCustomer.phone}</p>}
            </div>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-green-600 font-medium">
                Total Purchases: ${selectedCustomer.totalPurchases.toFixed(2)}
              </span>
              <span className="text-blue-600 font-medium">
                Visits: {selectedCustomer.visitCount}
              </span>
              <span className="text-purple-600 font-medium">
                Points: {selectedCustomer.loyaltyPoints}
              </span>
            </div>
          </div>
          <button
            onClick={handleClearCustomer}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  // Otherwise, show search input
  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isSearching && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-64 overflow-y-auto">
          {searchResults.map((customer) => (
            <div
              key={customer.id}
              onClick={() => handleSelectCustomer(customer)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{customer.nameEn}</p>
                  <p className="text-sm text-gray-600">Code: {customer.code}</p>
                  {customer.email && (
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  )}
                </div>
                <div className="text-right text-sm">
                  <p className="text-green-600 font-medium">
                    ${customer.totalPurchases.toFixed(2)}
                  </p>
                  <p className="text-gray-500">{customer.visitCount} visits</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {showResults && searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg p-4 text-center text-gray-500">
          No customers found. Try a different search term.
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500 mt-1">
        Leave blank for anonymous sale, or search to link a customer
      </p>
    </div>
  );
}
