/**
 * Test for SelectedUserCard component
 * 
 * Verifies the redesigned selected user block displays correctly with:
 * - User avatar with initials
 * - User name and email
 * - Change User button
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SelectedUserCard } from "@/components/admin/admin-wizard/SelectedUserCard";

// Mock next-intl
const mockTranslations: Record<string, string> = {
  noName: "No name",
  changeUser: "Change User",
};

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => mockTranslations[key] || key,
}));

// Mock UI components
jest.mock("@/components/ui", () => ({
  Button: ({ 
    children, 
    onClick, 
    disabled, 
    className, 
    "aria-label": ariaLabel 
  }: { 
    children: React.ReactNode; 
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    "aria-label"?: string;
  }) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  ),
}));

describe("SelectedUserCard", () => {
  const mockOnChangeUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render user name and email", () => {
    render(
      <SelectedUserCard
        name="John Doe"
        email="john.doe@example.com"
        onChangeUser={mockOnChangeUser}
      />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
  });

  it("should display user initials in avatar", () => {
    render(
      <SelectedUserCard
        name="John Doe"
        email="john.doe@example.com"
        onChangeUser={mockOnChangeUser}
      />
    );

    // Avatar should show initials "JD"
    const avatar = screen.getByText("JD");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass("im-selected-user-card-avatar");
  });

  it("should handle single-word names correctly for avatar", () => {
    render(
      <SelectedUserCard
        name="Madonna"
        email="madonna@example.com"
        onChangeUser={mockOnChangeUser}
      />
    );

    // Avatar should show first letter "M"
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("should handle empty name gracefully", () => {
    render(
      <SelectedUserCard
        name=""
        email="test@example.com"
        onChangeUser={mockOnChangeUser}
      />
    );

    // Should show fallback text
    expect(screen.getByText("No name")).toBeInTheDocument();
    // Avatar should show "?"
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("should call onChangeUser when Change User button is clicked", () => {
    render(
      <SelectedUserCard
        name="John Doe"
        email="john.doe@example.com"
        onChangeUser={mockOnChangeUser}
      />
    );

    const changeButton = screen.getByText("Change User");
    fireEvent.click(changeButton);

    expect(mockOnChangeUser).toHaveBeenCalledTimes(1);
  });

  it("should disable Change User button when disabled prop is true", () => {
    render(
      <SelectedUserCard
        name="John Doe"
        email="john.doe@example.com"
        onChangeUser={mockOnChangeUser}
        disabled={true}
      />
    );

    const changeButton = screen.getByText("Change User");
    expect(changeButton).toBeDisabled();
  });

  it("should have proper CSS classes for dark theme", () => {
    const { container } = render(
      <SelectedUserCard
        name="John Doe"
        email="john.doe@example.com"
        onChangeUser={mockOnChangeUser}
      />
    );

    // Check for im-* semantic classes
    expect(container.querySelector(".im-selected-user-card")).toBeInTheDocument();
    expect(container.querySelector(".im-selected-user-card-content")).toBeInTheDocument();
    expect(container.querySelector(".im-selected-user-card-avatar")).toBeInTheDocument();
    expect(container.querySelector(".im-selected-user-card-info")).toBeInTheDocument();
    expect(container.querySelector(".im-selected-user-card-name")).toBeInTheDocument();
    expect(container.querySelector(".im-selected-user-card-email")).toBeInTheDocument();
  });

  it("should handle names with multiple spaces correctly", () => {
    render(
      <SelectedUserCard
        name="John Michael Doe"
        email="john@example.com"
        onChangeUser={mockOnChangeUser}
      />
    );

    // Avatar should show first and last initials "JD"
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("should have accessible aria-label on Change User button", () => {
    render(
      <SelectedUserCard
        name="John Doe"
        email="john.doe@example.com"
        onChangeUser={mockOnChangeUser}
      />
    );

    const changeButton = screen.getByLabelText("Change User");
    expect(changeButton).toBeInTheDocument();
  });
});
