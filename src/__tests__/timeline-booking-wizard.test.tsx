/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { TimelineBookingWizard } from "@/components/TimelineBookingWizard";
import type { CourtAvailabilityStatus } from "@/types/court";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "timelineBooking.title": "Book Court",
      "timelineBooking.selectedSlot": "Selected time slot",
      "wizard.progress": "Booking progress",
      "wizard.steps.selectCourt": "Select Court",
      "wizard.steps.payment": "Payment",
      "wizard.step2Title": "Choose an available court",
      "wizard.step3Title": "Review and confirm payment",
      "wizard.loadingCourts": "Finding available courts...",
      "wizard.selectCourt": "Select a court",
      "wizard.availableCount": "{count} available",
      "wizard.courtUnavailable": "Not available at this time",
      "wizard.courtBooked": "Already booked",
      "wizard.courtPending": "Booking pending",
      "wizard.court": "Court",
      "wizard.total": "Total",
      "wizard.selectPaymentMethod": "Select payment method",
      "wizard.payWithCard": "Card",
      "wizard.applePay": "Apple Pay",
      "wizard.googlePay": "Google Pay",
      "wizard.confirmBooking": "Confirm Booking",
      "wizard.continue": "Continue",
      "wizard.bookingConfirmed": "Booking Confirmed!",
      "wizard.bookingConfirmedMessage": "Your court has been reserved successfully.",
      "common.date": "Date",
      "common.time": "Time",
      "common.duration": "Duration",
      "common.minutes": "minutes",
      "common.cancel": "Cancel",
      "common.back": "Back",
      "common.processing": "Processing...",
      "common.indoor": "Indoor",
      "common.outdoor": "Outdoor",
      "booking.quickBooking.noCourtsAvailable": "No courts available",
      "booking.quickBooking.tryAnotherTime": "Try another time",
      "booking.slotAlreadyBooked": "Slot already booked",
      "auth.errorOccurred": "An error occurred",
    };
    return translations[key] || key;
  },
}));

// Mock Modal component
jest.mock("@/components/ui", () => ({
  Modal: ({ isOpen, onClose, title, children }: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    children: React.ReactNode;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal" role="dialog" aria-label={title}>
        <button onClick={onClose} aria-label="Close">×</button>
        <h2>{title}</h2>
        {children}
      </div>
    );
  },
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("TimelineBookingWizard", () => {
  const mockCourts: CourtAvailabilityStatus[] = [
    {
      courtId: "court-1",
      courtName: "Court Alpha",
      courtType: "Padel",
      indoor: true,
      status: "available",
    },
    {
      courtId: "court-2",
      courtName: "Court Beta",
      courtType: "Padel",
      indoor: false,
      status: "booked",
    },
  ];

  const defaultProps = {
    clubId: "test-club-id",
    isOpen: true,
    onClose: jest.fn(),
    date: "2025-01-15",
    hour: 10,
    courts: mockCourts,
    onBookingComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it("renders the wizard when open", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        availableCourts: [
          {
            id: "court-1",
            name: "Court Alpha",
            slug: null,
            type: "Padel",
            surface: "Artificial grass",
            indoor: true,
            defaultPriceCents: 5000,
          }
        ] 
      }),
    });

    await act(async () => {
      render(<TimelineBookingWizard {...defaultProps} />);
    });
    
    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByText("Book Court")).toBeInTheDocument();
  });

  it("does not render when closed", async () => {
    await act(async () => {
      render(<TimelineBookingWizard {...defaultProps} isOpen={false} />);
    });
    
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("displays step indicators for steps 2 and 3 only", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        availableCourts: [
          {
            id: "court-1",
            name: "Court Alpha",
            slug: null,
            type: "Padel",
            surface: "Artificial grass",
            indoor: true,
            defaultPriceCents: 5000,
          }
        ] 
      }),
    });

    await act(async () => {
      render(<TimelineBookingWizard {...defaultProps} />);
    });
    
    // Should only show steps 2 and 3 (Select Court and Payment)
    expect(screen.getByText("Select Court")).toBeInTheDocument();
    expect(screen.getByText("Payment")).toBeInTheDocument();
    // Should NOT show Date & Time step
    expect(screen.queryByText("Date & Time")).not.toBeInTheDocument();
  });

  it("shows selected time slot information", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        availableCourts: [
          {
            id: "court-1",
            name: "Court Alpha",
            slug: null,
            type: "Padel",
            surface: "Artificial grass",
            indoor: true,
            defaultPriceCents: 5000,
          }
        ] 
      }),
    });

    await act(async () => {
      render(<TimelineBookingWizard {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText("Selected time slot:")).toBeInTheDocument();
      // Should show the time range (10:00 - 11:00 for 1 hour booking)
      expect(screen.getByText(/10:00 - 11:00/)).toBeInTheDocument();
    });
  });

  it("starts at step 2 (court selection)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        availableCourts: [
          {
            id: "court-1",
            name: "Court Alpha",
            slug: null,
            type: "Padel",
            surface: "Artificial grass",
            indoor: true,
            defaultPriceCents: 5000,
          }
        ] 
      }),
    });

    await act(async () => {
      render(<TimelineBookingWizard {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText("Select a court")).toBeInTheDocument();
    });
  });

  it("displays available courts from API", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        availableCourts: [
          {
            id: "court-1",
            name: "Court Alpha",
            slug: null,
            type: "Padel",
            surface: "Artificial grass",
            indoor: true,
            defaultPriceCents: 5000,
          },
          {
            id: "court-3",
            name: "Court Gamma",
            slug: null,
            type: "Tennis",
            surface: "Hard court",
            indoor: false,
            defaultPriceCents: 6000,
          }
        ] 
      }),
    });

    await act(async () => {
      render(<TimelineBookingWizard {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText("Court Alpha")).toBeInTheDocument();
      expect(screen.getByText("Court Gamma")).toBeInTheDocument();
    });
  });

  it("shows indoor badge for indoor courts", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        availableCourts: [
          {
            id: "court-1",
            name: "Court Alpha",
            slug: null,
            type: "Padel",
            surface: "Artificial grass",
            indoor: true,
            defaultPriceCents: 5000,
          }
        ] 
      }),
    });

    await act(async () => {
      render(<TimelineBookingWizard {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText("Indoor")).toBeInTheDocument();
    });
  });

  it("calls onClose when cancel is clicked on step 2", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        availableCourts: [
          {
            id: "court-1",
            name: "Court Alpha",
            slug: null,
            type: "Padel",
            surface: "Artificial grass",
            indoor: true,
            defaultPriceCents: 5000,
          }
        ] 
      }),
    });

    await act(async () => {
      render(<TimelineBookingWizard {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Cancel"));
    });

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("shows error message when no courts are available", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ availableCourts: [] }),
    });

    await act(async () => {
      render(<TimelineBookingWizard {...defaultProps} courts={[]} />);
    });

    await waitFor(() => {
      expect(screen.getByText("No courts available")).toBeInTheDocument();
    });
  });
});

describe("TimelineBookingWizard - Step 3 Payment", () => {
  const mockCourts: CourtAvailabilityStatus[] = [
    {
      courtId: "court-1",
      courtName: "Court Alpha",
      courtType: "Padel",
      indoor: true,
      status: "available",
    },
  ];

  const defaultProps = {
    clubId: "test-club-id",
    isOpen: true,
    onClose: jest.fn(),
    date: "2025-01-15",
    hour: 10,
    courts: mockCourts,
    onBookingComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it("navigates to step 3 when court is selected and continue is clicked", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        availableCourts: [
          {
            id: "court-1",
            name: "Court Alpha",
            slug: null,
            type: "Padel",
            surface: "Artificial grass",
            indoor: true,
            defaultPriceCents: 5000,
          }
        ] 
      }),
    });

    await act(async () => {
      render(<TimelineBookingWizard {...defaultProps} />);
    });

    // Wait for courts to load
    await waitFor(() => {
      expect(screen.getByText("Court Alpha")).toBeInTheDocument();
    });

    // Select a court
    await act(async () => {
      fireEvent.click(screen.getByText("Court Alpha"));
    });

    // Click continue
    await act(async () => {
      fireEvent.click(screen.getByText("Continue"));
    });

    // Should now be on step 3 - look for payment method buttons (Card, Apple Pay, Google Pay)
    await waitFor(() => {
      expect(screen.getByText("Card")).toBeInTheDocument();
      expect(screen.getByText("Total")).toBeInTheDocument();
    });
  });

  it("can navigate back from step 3 to step 2", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        availableCourts: [
          {
            id: "court-1",
            name: "Court Alpha",
            slug: null,
            type: "Padel",
            surface: "Artificial grass",
            indoor: true,
            defaultPriceCents: 5000,
          }
        ] 
      }),
    });

    await act(async () => {
      render(<TimelineBookingWizard {...defaultProps} />);
    });

    // Wait for courts to load and select one
    await waitFor(() => {
      expect(screen.getByText("Court Alpha")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Court Alpha"));
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Continue"));
    });

    // On step 3 - look for payment method buttons
    await waitFor(() => {
      expect(screen.getByText("Card")).toBeInTheDocument();
    });

    // Click back
    await act(async () => {
      fireEvent.click(screen.getByText("Back"));
    });

    // Should be back on step 2
    await waitFor(() => {
      expect(screen.getByText("Select a court")).toBeInTheDocument();
    });
  });
});
