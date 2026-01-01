/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ClubSpecialDatesView } from "@/components/admin/club/ClubSpecialDatesView";
import type { ClubDetail } from "@/types/club";

// Mock the UI components
jest.mock("@/components/ui", () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock SectionEditModal
jest.mock("@/components/admin/club/SectionEditModal", () => ({
  SectionEditModal: ({ 
    isOpen, 
    onClose, 
    title, 
    onSave, 
    children 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    onSave: () => void; 
    children: React.ReactNode;
  }) => (
    isOpen ? (
      <div data-testid="modal">
        <h1>{title}</h1>
        {children}
        <button onClick={onSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
  ),
}));

// Mock SpecialHoursField
jest.mock("@/components/admin/SpecialHoursField.client", () => ({
  SpecialHoursField: ({ onChange }: { onChange: (val: unknown) => void }) => (
    <div data-testid="special-hours-field">
      <button onClick={() => onChange([])}>Clear Hours</button>
    </div>
  ),
}));

const mockClub: ClubDetail = {
  id: "club-1",
  organizationId: "org-1",
  name: "Test Club",
  slug: "test-club",
  shortDescription: "A test club",
  longDescription: null,
  location: "123 Test St",
  city: "Test City",
  country: "Test Country",
  latitude: null,
  longitude: null,
  phone: null,
  email: null,
  website: null,
  socialLinks: null,
  contactInfo: null,
  openingHours: null,
  metadata: null,
  defaultCurrency: null,
  timezone: null,
  isPublic: true,
  status: "active",
  tags: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  courts: [],
  coaches: [],
  gallery: [],
  businessHours: [],
  specialHours: [
    {
      id: "special-1",
      clubId: "club-1",
      date: "2024-12-25T00:00:00.000Z",
      openTime: null,
      closeTime: null,
      isClosed: true,
      reason: "Christmas",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "special-2",
      clubId: "club-1",
      date: "2024-02-14T00:00:00.000Z",
      openTime: "10:00",
      closeTime: "18:00",
      isClosed: false,
      reason: "Valentine's Day",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ],
};

describe("ClubSpecialDatesView", () => {
  it("should render special dates list", () => {
    const mockUpdate = jest.fn();
    
    render(
      <ClubSpecialDatesView
        club={mockClub}
        onUpdate={mockUpdate}
      />
    );

    expect(screen.getByText("Special Dates")).toBeInTheDocument();
    expect(screen.getByText(/Dec 25/)).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByText("(Christmas)")).toBeInTheDocument();
    expect(screen.getByText(/Feb 14/)).toBeInTheDocument();
    expect(screen.getByText(/10:00 AM.*6:00 PM/)).toBeInTheDocument();
    expect(screen.getByText("(Valentine's Day)")).toBeInTheDocument();
  });

  it("should show empty state when no special dates", () => {
    const clubWithNoSpecialDates = { ...mockClub, specialHours: [] };
    const mockUpdate = jest.fn();
    
    render(
      <ClubSpecialDatesView
        club={clubWithNoSpecialDates}
        onUpdate={mockUpdate}
      />
    );

    expect(screen.getByText("No special dates set")).toBeInTheDocument();
  });

  it("should open modal when Edit button is clicked", () => {
    const mockUpdate = jest.fn();
    
    render(
      <ClubSpecialDatesView
        club={mockClub}
        onUpdate={mockUpdate}
      />
    );

    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByText("Edit Special Dates")).toBeInTheDocument();
  });

  it("should call onUpdate when saving changes", async () => {
    const mockUpdate = jest.fn().mockResolvedValue({});
    
    render(
      <ClubSpecialDatesView
        club={mockClub}
        onUpdate={mockUpdate}
      />
    );

    // Open modal
    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    // Save changes
    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        specialHours: expect.arrayContaining([
          expect.objectContaining({
            id: "special-1",
            date: "2024-12-25",
            isClosed: true,
            reason: "Christmas",
          }),
          expect.objectContaining({
            id: "special-2",
            date: "2024-02-14",
            isClosed: false,
            openTime: "10:00",
            closeTime: "18:00",
            reason: "Valentine's Day",
          }),
        ]),
      });
    });
  });

  it("should disable Edit button when disabled prop is true", () => {
    const mockUpdate = jest.fn();
    
    render(
      <ClubSpecialDatesView
        club={mockClub}
        onUpdate={mockUpdate}
        disabled={true}
      />
    );

    const editButton = screen.getByRole("button", { name: /edit/i });
    expect(editButton).toBeDisabled();
  });
});
