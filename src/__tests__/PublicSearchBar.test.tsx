import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PublicSearchBar } from "@/components/PublicSearchBar";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "clubs.searchPlaceholder": "Search by name or address",
      "clubs.cityPlaceholder": "City",
      "common.search": "Search",
      "clubs.clearFilters": "Clear Filters",
    };
    return translations[key] || key;
  },
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock UI components
jest.mock("@/components/ui", () => ({
  Input: ({ value, onChange, placeholder, "aria-label": ariaLabel, className }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
    />
  ),
  Button: ({ children, disabled, type, onClick, className }: any) => (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  ),
}));

describe("PublicSearchBar - Search Button Validation", () => {
  describe("navigateOnSearch mode (landing page)", () => {
    it("disables search button when both inputs are empty", () => {
      render(<PublicSearchBar navigateOnSearch />);
      const searchButton = screen.getByRole("button", { name: "Search" });
      expect(searchButton).toBeDisabled();
    });

    it("disables search button when input has only 1 character in name field", () => {
      render(<PublicSearchBar navigateOnSearch />);
      const nameInput = screen.getByPlaceholderText("Search by name or address");
      const searchButton = screen.getByRole("button", { name: "Search" });

      fireEvent.change(nameInput, { target: { value: "A" } });
      expect(searchButton).toBeDisabled();
    });

    it("disables search button when input has only 1 character in city field", () => {
      render(<PublicSearchBar navigateOnSearch />);
      const cityInput = screen.getByPlaceholderText("City");
      const searchButton = screen.getByRole("button", { name: "Search" });

      fireEvent.change(cityInput, { target: { value: "L" } });
      expect(searchButton).toBeDisabled();
    });

    it("enables search button when name field has 2 or more characters", () => {
      render(<PublicSearchBar navigateOnSearch />);
      const nameInput = screen.getByPlaceholderText("Search by name or address");
      const searchButton = screen.getByRole("button", { name: "Search" });

      fireEvent.change(nameInput, { target: { value: "Ab" } });
      expect(searchButton).not.toBeDisabled();
    });

    it("enables search button when city field has 2 or more characters", () => {
      render(<PublicSearchBar navigateOnSearch />);
      const cityInput = screen.getByPlaceholderText("City");
      const searchButton = screen.getByRole("button", { name: "Search" });

      fireEvent.change(cityInput, { target: { value: "LA" } });
      expect(searchButton).not.toBeDisabled();
    });

    it("enables search button when name has 2+ chars even if city is empty", () => {
      render(<PublicSearchBar navigateOnSearch />);
      const nameInput = screen.getByPlaceholderText("Search by name or address");
      const searchButton = screen.getByRole("button", { name: "Search" });

      fireEvent.change(nameInput, { target: { value: "Club" } });
      expect(searchButton).not.toBeDisabled();
    });

    it("enables search button when city has 2+ chars even if name is empty", () => {
      render(<PublicSearchBar navigateOnSearch />);
      const cityInput = screen.getByPlaceholderText("City");
      const searchButton = screen.getByRole("button", { name: "Search" });

      fireEvent.change(cityInput, { target: { value: "New York" } });
      expect(searchButton).not.toBeDisabled();
    });

    it("enables search button when both fields have valid input", () => {
      render(<PublicSearchBar navigateOnSearch />);
      const nameInput = screen.getByPlaceholderText("Search by name or address");
      const cityInput = screen.getByPlaceholderText("City");
      const searchButton = screen.getByRole("button", { name: "Search" });

      fireEvent.change(nameInput, { target: { value: "Arena" } });
      fireEvent.change(cityInput, { target: { value: "NYC" } });
      expect(searchButton).not.toBeDisabled();
    });

    it("disables search button when input is whitespace only", () => {
      render(<PublicSearchBar navigateOnSearch />);
      const nameInput = screen.getByPlaceholderText("Search by name or address");
      const cityInput = screen.getByPlaceholderText("City");
      const searchButton = screen.getByRole("button", { name: "Search" });

      fireEvent.change(nameInput, { target: { value: "   " } });
      fireEvent.change(cityInput, { target: { value: "  " } });
      expect(searchButton).toBeDisabled();
    });

    it("enables search button after clearing input and re-entering valid text", () => {
      render(<PublicSearchBar navigateOnSearch />);
      const nameInput = screen.getByPlaceholderText("Search by name or address");
      const searchButton = screen.getByRole("button", { name: "Search" });

      // Initially disabled
      expect(searchButton).toBeDisabled();

      // Add valid input - should enable
      fireEvent.change(nameInput, { target: { value: "Test" } });
      expect(searchButton).not.toBeDisabled();

      // Clear input - should disable again
      fireEvent.change(nameInput, { target: { value: "" } });
      expect(searchButton).toBeDisabled();
    });

    it("prevents form submission when search button is disabled", () => {
      const mockPush = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({
        push: mockPush,
      });

      render(<PublicSearchBar navigateOnSearch />);
      const form = screen.getByRole("search");
      const nameInput = screen.getByPlaceholderText("Search by name or address");

      // Try to submit with empty input
      fireEvent.submit(form);
      expect(mockPush).not.toHaveBeenCalled();

      // Try to submit with only 1 character
      fireEvent.change(nameInput, { target: { value: "A" } });
      fireEvent.submit(form);
      expect(mockPush).not.toHaveBeenCalled();

      // Submit with valid input - should work
      fireEvent.change(nameInput, { target: { value: "Ab" } });
      fireEvent.submit(form);
      expect(mockPush).toHaveBeenCalledWith("/clubs?q=Ab");
    });
  });

  describe("onSearch mode (clubs page filtering)", () => {
    it("does not render search button in onSearch mode", () => {
      const mockOnSearch = jest.fn();
      render(<PublicSearchBar onSearch={mockOnSearch} />);
      
      // Search button should not be present
      expect(screen.queryByRole("button", { name: "Search" })).not.toBeInTheDocument();
    });
  });
});
