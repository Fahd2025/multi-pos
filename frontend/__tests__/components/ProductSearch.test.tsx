/**
 * Tests for ProductSearch Component
 * Testing product search functionality for sales transactions
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProductSearch from "@/components/branch/sales/ProductSearch";
import { ProductDto } from "@/types/api.types";

describe("ProductSearch Component", () => {
  const mockOnProductSelect = jest.fn();

  beforeEach(() => {
    mockOnProductSelect.mockClear();
  });

  it("should render search input", () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("should show no results when search query is empty", async () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Initially no results should be shown
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("should filter products by name when typing", async () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Type 'mouse' to search
    fireEvent.change(searchInput, { target: { value: "mouse" } });

    // Wait for filtering to occur
    await waitFor(() => {
      expect(screen.getByText(/wireless mouse/i)).toBeInTheDocument();
    });

    // Should not show keyboard since it doesn't match
    expect(screen.queryByText(/mechanical keyboard/i)).not.toBeInTheDocument();
  });

  it("should filter products by barcode", async () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Search by barcode
    fireEvent.change(searchInput, { target: { value: "123456789" } });

    await waitFor(() => {
      expect(screen.getByText(/wireless mouse/i)).toBeInTheDocument();
    });
  });

  it("should filter products by SKU", async () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Search by SKU
    fireEvent.change(searchInput, { target: { value: "SKU002" } });

    await waitFor(() => {
      expect(screen.getByText(/mechanical keyboard/i)).toBeInTheDocument();
    });
  });

  it("should call onProductSelect when a product is clicked", async () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Search for a product
    fireEvent.change(searchInput, { target: { value: "mouse" } });

    await waitFor(() => {
      expect(screen.getByText(/wireless mouse/i)).toBeInTheDocument();
    });

    // Click the product
    const productItem = screen.getByText(/wireless mouse/i);
    fireEvent.click(productItem);

    // Verify callback was called
    expect(mockOnProductSelect).toHaveBeenCalledTimes(1);
    expect(mockOnProductSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "1",
        nameEn: "Wireless Mouse",
      })
    );
  });

  it("should clear search results after selecting a product", async () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Search and select
    fireEvent.change(searchInput, { target: { value: "mouse" } });

    await waitFor(() => {
      expect(screen.getByText(/wireless mouse/i)).toBeInTheDocument();
    });

    const productItem = screen.getByText(/wireless mouse/i);
    fireEvent.click(productItem);

    // Search input should be cleared
    await waitFor(() => {
      expect(searchInput).toHaveValue("");
    });

    // Results should be hidden
    expect(screen.queryByText(/wireless mouse/i)).not.toBeInTheDocument();
  });

  it("should display product price and stock level", async () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);

    const searchInput = screen.getByPlaceholderText(/search/i);

    fireEvent.change(searchInput, { target: { value: "mouse" } });

    await waitFor(() => {
      // Should show price
      expect(screen.getByText(/29.99/)).toBeInTheDocument();

      // Should show stock level
      expect(screen.getByText(/50/)).toBeInTheDocument();
    });
  });

  it('should show "No results" message when no products match', async () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Search for non-existent product
    fireEvent.change(searchInput, { target: { value: "nonexistentproduct123" } });

    await waitFor(() => {
      expect(screen.getByText(/no products found/i)).toBeInTheDocument();
    });
  });

  it("should handle search with multiple matching products", async () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Search for 'USB' which should match 'USB Cable'
    fireEvent.change(searchInput, { target: { value: "usb" } });

    await waitFor(() => {
      expect(screen.getByText(/usb cable/i)).toBeInTheDocument();
    });
  });

  it("should be case-insensitive in search", async () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Search with different cases
    fireEvent.change(searchInput, { target: { value: "MOUSE" } });

    await waitFor(() => {
      expect(screen.getByText(/wireless mouse/i)).toBeInTheDocument();
    });
  });

  it("should handle rapid search input changes", async () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Rapidly change search
    fireEvent.change(searchInput, { target: { value: "k" } });
    fireEvent.change(searchInput, { target: { value: "ke" } });
    fireEvent.change(searchInput, { target: { value: "key" } });
    fireEvent.change(searchInput, { target: { value: "keyb" } });
    fireEvent.change(searchInput, { target: { value: "keyboard" } });

    await waitFor(() => {
      expect(screen.getByText(/mechanical keyboard/i)).toBeInTheDocument();
    });
  });

  it("should highlight low stock products", async () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Search for products
    fireEvent.change(searchInput, { target: { value: "mouse" } });

    await waitFor(() => {
      const productElement = screen.getByText(/wireless mouse/i).closest("div");

      // Check if stock level (50) is above threshold (10)
      // Should not have low stock warning
      expect(productElement).not.toHaveTextContent(/low stock/i);
    });
  });

  it("should display products with correct formatting", async () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);

    const searchInput = screen.getByPlaceholderText(/search/i);

    fireEvent.change(searchInput, { target: { value: "cable" } });

    await waitFor(() => {
      // Should display name
      expect(screen.getByText(/usb cable/i)).toBeInTheDocument();

      // Should display SKU
      expect(screen.getByText(/SKU003/i)).toBeInTheDocument();

      // Should display price
      expect(screen.getByText(/9.99/)).toBeInTheDocument();
    });
  });

  it("should close results when clicking outside", async () => {
    const { container } = render(
      <div>
        <ProductSearch onProductSelect={mockOnProductSelect} />
        <div data-testid="outside-element">Outside</div>
      </div>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Open results
    fireEvent.change(searchInput, { target: { value: "mouse" } });

    await waitFor(() => {
      expect(screen.getByText(/wireless mouse/i)).toBeInTheDocument();
    });

    // Click outside
    const outsideElement = screen.getByTestId("outside-element");
    fireEvent.click(outsideElement);

    // Results should be closed
    await waitFor(() => {
      expect(screen.queryByText(/wireless mouse/i)).not.toBeInTheDocument();
    });
  });

  it("should support keyboard navigation", async () => {
    render(<ProductSearch onProductSelect={mockOnProductSelect} />);

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Search for products
    fireEvent.change(searchInput, { target: { value: "e" } }); // Matches all products

    await waitFor(() => {
      expect(screen.getByText(/wireless mouse/i)).toBeInTheDocument();
    });

    // Simulate down arrow key
    fireEvent.keyDown(searchInput, { key: "ArrowDown", code: "ArrowDown" });

    // Simulate enter key to select
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });

    // Should select first product
    await waitFor(() => {
      expect(mockOnProductSelect).toHaveBeenCalled();
    });
  });
});
