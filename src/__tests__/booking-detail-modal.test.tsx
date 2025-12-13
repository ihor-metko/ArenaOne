/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BookingDetailModal } from "@/components/club-operations/BookingDetailModal";
import type { OperationsBooking } from "@/types/booking";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "operations.playerDetails": "Player Details",
      "operations.bookingInfo": "Booking Details",
      "operations.paymentInfo": "Payment Information",
      "operations.bookingDate": "Date",
      "operations.bookingTime": "Time",
      "operations.court": "Court",
      "operations.sportType": "Sport Type",
      "operations.coach": "Coach",
      "operations.paymentStatus": "Payment Status",
      "operations.createdAt": "Created At",
      "operations.cancelBooking": "Cancel Booking",
      "operations.cancelling": "Cancelling...",
      "operations.confirmCancel": "Are you sure you want to cancel this booking?",
      "common.name": "Name",
      "common.email": "Email",
      "common.duration": "Duration",
      "common.minutes": "minutes",
      "common.price": "Price",
      "common.close": "Close",
    };
    return translations[key] || key;
  },
}));

// Mock the booking store
const mockCancelBooking = jest.fn();
jest.mock("@/stores/useBookingStore", () => ({
  useBookingStore: (selector: any) => {
    const store = {
      cancelBooking: mockCancelBooking,
    };
    return selector ? selector(store) : store;
  },
}));

// Mock toast
jest.mock("@/lib/toast", () => ({
  showToast: jest.fn(),
}));

// Mock UI components
jest.mock("@/components/ui", () => ({
  Modal: ({ isOpen, children, onClose }: any) =>
    isOpen ? (
      <div data-testid="modal">
        <button data-testid="modal-close" onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    ) : null,
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button
      data-testid={`button-${variant || "primary"}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
  Badge: ({ children, variant }: any) => (
    <span data-testid={`badge-${variant}`}>{children}</span>
  ),
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}));

// Mock formatPrice
jest.mock("@/utils/price", () => ({
  formatPrice: (cents: number) => `$${(cents / 100).toFixed(2)}`,
}));

describe("BookingDetailModal", () => {
  const mockBooking: OperationsBooking = {
    id: "booking-123",
    userId: "user-123",
    userName: "John Doe",
    userEmail: "john.doe@example.com",
    courtId: "court-123",
    courtName: "Court 1",
    start: "2024-01-15T10:00:00Z",
    end: "2024-01-15T11:00:00Z",
    status: "paid",
    price: 5000, // $50.00
    sportType: "PADEL",
    coachId: "coach-123",
    coachName: "Coach Smith",
    createdAt: "2024-01-14T12:00:00Z",
  };

  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders null when booking is null", () => {
    const { container } = render(
      <BookingDetailModal
        isOpen={true}
        onClose={mockOnClose}
        booking={null}
        onSuccess={mockOnSuccess}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders the modal with booking details", () => {
    render(
      <BookingDetailModal
        isOpen={true}
        onClose={mockOnClose}
        booking={mockBooking}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getAllByText("Court 1").length).toBeGreaterThan(0);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
    expect(screen.getByText("Coach Smith")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
  });

  it("displays the correct status badge", () => {
    render(
      <BookingDetailModal
        isOpen={true}
        onClose={mockOnClose}
        booking={mockBooking}
        onSuccess={mockOnSuccess}
      />
    );

    const badge = screen.getAllByTestId("badge-success");
    expect(badge.length).toBeGreaterThan(0);
  });

  it("displays cancel button for non-cancelled bookings", () => {
    render(
      <BookingDetailModal
        isOpen={true}
        onClose={mockOnClose}
        booking={mockBooking}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText("Cancel Booking")).toBeInTheDocument();
  });

  it("does not display cancel button for cancelled bookings", () => {
    const cancelledBooking = { ...mockBooking, status: "cancelled" as const };

    render(
      <BookingDetailModal
        isOpen={true}
        onClose={mockOnClose}
        booking={cancelledBooking}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText("Cancel Booking")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(
      <BookingDetailModal
        isOpen={true}
        onClose={mockOnClose}
        booking={mockBooking}
        onSuccess={mockOnSuccess}
      />
    );

    const closeButton = screen.getByTestId("button-outline");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("handles cancellation with confirmation", async () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    mockCancelBooking.mockResolvedValue(undefined);

    render(
      <BookingDetailModal
        isOpen={true}
        onClose={mockOnClose}
        booking={mockBooking}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByTestId("button-danger");
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to cancel this booking?"
      );
      expect(mockCancelBooking).toHaveBeenCalledWith("booking-123");
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it("does not cancel when user rejects confirmation", () => {
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => false);

    render(
      <BookingDetailModal
        isOpen={true}
        onClose={mockOnClose}
        booking={mockBooking}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByTestId("button-danger");
    fireEvent.click(cancelButton);

    expect(mockCancelBooking).not.toHaveBeenCalled();

    window.confirm = originalConfirm;
  });

  it("renders booking without coach", () => {
    const bookingWithoutCoach = { ...mockBooking, coachName: null, coachId: null };

    render(
      <BookingDetailModal
        isOpen={true}
        onClose={mockOnClose}
        booking={bookingWithoutCoach}
        onSuccess={mockOnSuccess}
      />
    );

    // Coach section should not be rendered
    expect(screen.queryByText("Coach Smith")).not.toBeInTheDocument();
  });

  it("displays section headers correctly", () => {
    render(
      <BookingDetailModal
        isOpen={true}
        onClose={mockOnClose}
        booking={mockBooking}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText("Player Details")).toBeInTheDocument();
    expect(screen.getByText("Booking Details")).toBeInTheDocument();
    expect(screen.getByText("Payment Information")).toBeInTheDocument();
  });

  it("formats duration correctly", () => {
    render(
      <BookingDetailModal
        isOpen={true}
        onClose={mockOnClose}
        booking={mockBooking}
        onSuccess={mockOnSuccess}
      />
    );

    // 10:00 to 11:00 = 60 minutes
    expect(screen.getByText(/60/)).toBeInTheDocument();
    expect(screen.getByText(/minutes/)).toBeInTheDocument();
  });

  it("uses Card components for sections", () => {
    render(
      <BookingDetailModal
        isOpen={true}
        onClose={mockOnClose}
        booking={mockBooking}
        onSuccess={mockOnSuccess}
      />
    );

    const cards = screen.getAllByTestId("card");
    // Should have 3 cards: Player Details, Booking Details, Payment Info
    expect(cards.length).toBe(3);
  });
});
