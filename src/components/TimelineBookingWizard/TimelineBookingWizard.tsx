"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui";
import { Step2Courts } from "./Step2Courts";
import { Step3Payment } from "./Step3Payment";
import {
  TimelineBookingWizardProps,
  TimelineWizardState,
  WizardCourt,
  PaymentMethod,
  TIMELINE_WIZARD_STEPS,
  DEFAULT_DURATION_MINUTES,
  formatHourToTime,
  calculateEndTime,
} from "./types";
// Reuse QuickBookingWizard CSS since we share the same styling
import "@/components/QuickBookingWizard/QuickBookingWizard.css";
import "./TimelineBookingWizard.css";

// Constants for price calculations
const MINUTES_PER_HOUR = 60;

/**
 * TimelineBookingWizard - Booking wizard for weekly availability timeline
 * 
 * This wizard is used when a user clicks on a time slot in the weekly availability
 * timeline. It starts at Step 2 (court selection) since the date and time are
 * pre-selected from the timeline slot.
 * 
 * Features:
 * - Shows available courts for the selected time slot
 * - Displays court details (name, type, surface, indoor/outdoor, price)
 * - Allows court selection and proceeds to payment
 * - Updates availability in real-time to prevent double booking
 * - Supports dark/light theme
 * - Fully accessible with keyboard navigation and screen reader support
 */
export function TimelineBookingWizard({
  clubId,
  isOpen,
  onClose,
  date,
  hour,
  courts: initialCourts,
  onBookingComplete,
}: TimelineBookingWizardProps) {
  const t = useTranslations();
  
  // Calculate start and end times
  const startTime = formatHourToTime(hour);
  const endTime = calculateEndTime(hour, DEFAULT_DURATION_MINUTES);

  // Initial state
  const getInitialState = useCallback((): TimelineWizardState => ({
    currentStep: 2,
    selectedCourtId: null,
    selectedCourt: null,
    paymentMethod: null,
    availableCourts: [],
    isLoadingCourts: true,
    courtsError: null,
    isSubmitting: false,
    submitError: null,
    isComplete: false,
    bookingId: null,
  }), []);

  const [state, setState] = useState<TimelineWizardState>(getInitialState);

  // Reset state when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setState(getInitialState());
      // Fetch court details with prices when modal opens
      fetchCourtsWithPrices();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, date, hour, getInitialState]);

  // Fetch available courts with price information
  const fetchCourtsWithPrices = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoadingCourts: true,
      courtsError: null,
    }));

    try {
      // Filter only available courts from the timeline data
      const availableCourtIds = initialCourts
        .filter((c) => c.status === "available")
        .map((c) => c.courtId);

      if (availableCourtIds.length === 0) {
        setState((prev) => ({
          ...prev,
          availableCourts: [],
          isLoadingCourts: false,
        }));
        return;
      }

      // Fetch detailed court information for available courts
      const params = new URLSearchParams({
        date,
        start: startTime,
        duration: DEFAULT_DURATION_MINUTES.toString(),
      });

      const response = await fetch(`/api/clubs/${clubId}/available-courts?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        setState((prev) => ({
          ...prev,
          isLoadingCourts: false,
          courtsError: errorData.error || t("auth.errorOccurred"),
        }));
        return;
      }

      const data = await response.json();
      const detailedCourts: WizardCourt[] = data.availableCourts || [];

      // Fetch price timeline for each court to get resolved prices
      const courtsWithPrices = await Promise.all(
        detailedCourts.map(async (court) => {
          try {
            const priceResponse = await fetch(
              `/api/courts/${court.id}/price-timeline?date=${date}`
            );
            if (priceResponse.ok) {
              const priceData = await priceResponse.json();
              const segment = priceData.timeline.find(
                (seg: { start: string; end: string; priceCents: number }) =>
                  startTime >= seg.start && startTime < seg.end
              );
              const priceCents = segment
                ? Math.round((segment.priceCents / MINUTES_PER_HOUR) * DEFAULT_DURATION_MINUTES)
                : Math.round((court.defaultPriceCents / MINUTES_PER_HOUR) * DEFAULT_DURATION_MINUTES);
              return { ...court, priceCents, available: true };
            }
          } catch {
            // Ignore price fetch errors
          }
          return {
            ...court,
            priceCents: Math.round((court.defaultPriceCents / MINUTES_PER_HOUR) * DEFAULT_DURATION_MINUTES),
            available: true,
          };
        })
      );

      // Also include unavailable courts from initial data for display
      const unavailableCourts: WizardCourt[] = initialCourts
        .filter((c) => c.status !== "available")
        .map((c) => ({
          id: c.courtId,
          name: c.courtName,
          slug: null,
          type: c.courtType,
          surface: null,
          indoor: c.indoor,
          defaultPriceCents: 0,
          available: false,
          unavailableReason: c.status === "booked" 
            ? t("wizard.courtBooked") 
            : c.status === "pending" 
              ? t("wizard.courtPending") 
              : t("wizard.courtUnavailable"),
        }));

      setState((prev) => ({
        ...prev,
        availableCourts: [...courtsWithPrices, ...unavailableCourts],
        isLoadingCourts: false,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        isLoadingCourts: false,
        courtsError: t("auth.errorOccurred"),
      }));
    }
  }, [clubId, date, startTime, initialCourts, t]);

  // Handle court selection
  const handleSelectCourt = useCallback((court: WizardCourt) => {
    setState((prev) => ({
      ...prev,
      selectedCourtId: court.id,
      selectedCourt: court,
    }));
  }, []);

  // Handle payment method selection
  const handleSelectPaymentMethod = useCallback((method: PaymentMethod) => {
    setState((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
  }, []);

  // Submit booking
  const handleSubmit = useCallback(async () => {
    if (!state.selectedCourt || !state.paymentMethod) {
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true, submitError: null }));

    try {
      const startDateTime = `${date}T${startTime}:00.000Z`;
      const endDateTime = `${date}T${endTime}:00.000Z`;

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courtId: state.selectedCourt.id,
          startTime: startDateTime,
          endTime: endDateTime,
          userId: "current-user", // Will be resolved by the API from session
        }),
      });

      const responseData = await response.json();

      if (response.status === 409) {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          submitError: t("booking.slotAlreadyBooked"),
        }));
        return;
      }

      if (!response.ok) {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          submitError: responseData.error || t("auth.errorOccurred"),
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        isComplete: true,
        bookingId: responseData.bookingId,
      }));

      // Notify parent after short delay
      setTimeout(() => {
        onBookingComplete?.(
          responseData.bookingId,
          state.selectedCourt!.id,
          date,
          startTime,
          endTime
        );
        onClose();
      }, 2000);
    } catch {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        submitError: t("auth.errorOccurred"),
      }));
    }
  }, [state.selectedCourt, state.paymentMethod, date, startTime, endTime, t, onBookingComplete, onClose]);

  // Navigate to next step
  const handleNext = useCallback(async () => {
    if (state.currentStep === 2) {
      setState((prev) => ({ ...prev, currentStep: 3 }));
    } else if (state.currentStep === 3) {
      await handleSubmit();
    }
  }, [state.currentStep, handleSubmit]);

  // Navigate to previous step
  const handleBack = useCallback(() => {
    if (state.currentStep === 2) {
      // Go back to court availability modal (close this wizard)
      onClose();
    } else {
      setState((prev) => ({
        ...prev,
        currentStep: 2,
        submitError: null,
      }));
    }
  }, [state.currentStep, onClose]);

  // Computed values
  const canProceed = useMemo(() => {
    switch (state.currentStep) {
      case 2:
        return !!state.selectedCourtId;
      case 3:
        return !!state.paymentMethod && !state.isSubmitting;
      default:
        return false;
    }
  }, [state]);

  const totalPrice = useMemo(() => {
    if (state.selectedCourt?.priceCents !== undefined) {
      return state.selectedCourt.priceCents;
    }
    if (state.selectedCourt) {
      return Math.round(
        (state.selectedCourt.defaultPriceCents / MINUTES_PER_HOUR) * DEFAULT_DURATION_MINUTES
      );
    }
    return 0;
  }, [state.selectedCourt]);

  const handleClose = () => {
    if (!state.isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("timelineBooking.title")}
    >
      <div className="rsp-wizard-modal">
        {/* Step Indicator - Modified for timeline booking (steps 2 and 3 only) */}
        <nav className="rsp-wizard-steps rsp-timeline-wizard-steps" aria-label={t("wizard.progress")}>
          {TIMELINE_WIZARD_STEPS.map((step, index) => {
            const isActive = state.currentStep === step.id;
            const isCompleted = state.currentStep > step.id;

            return (
              <div
                key={step.id}
                className={`rsp-wizard-step ${
                  isActive ? "rsp-wizard-step--active" : ""
                } ${isCompleted ? "rsp-wizard-step--completed" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                <div className="rsp-wizard-step-circle" aria-hidden="true">
                  {isCompleted ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="rsp-wizard-step-label">
                  {t(`wizard.steps.${step.label}`)}
                </span>
              </div>
            );
          })}
        </nav>

        {/* Step Content */}
        <div className="rsp-wizard-content">
          {state.currentStep === 2 && (
            <Step2Courts
              courts={state.availableCourts}
              selectedCourtId={state.selectedCourtId}
              onSelectCourt={handleSelectCourt}
              isLoading={state.isLoadingCourts}
              error={state.courtsError}
              selectedDate={date}
              selectedTime={`${startTime} - ${endTime}`}
            />
          )}

          {state.currentStep === 3 && (
            <Step3Payment
              date={date}
              startTime={startTime}
              endTime={endTime}
              court={state.selectedCourt}
              totalPrice={totalPrice}
              selectedPaymentMethod={state.paymentMethod}
              onSelectPaymentMethod={handleSelectPaymentMethod}
              isSubmitting={state.isSubmitting}
              submitError={state.submitError}
              isComplete={state.isComplete}
              bookingId={state.bookingId}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        {!state.isComplete && (
          <div className="rsp-wizard-nav">
            <button
              type="button"
              className="rsp-wizard-nav-btn rsp-wizard-nav-btn--back"
              onClick={handleBack}
              disabled={state.isSubmitting}
            >
              {state.currentStep === 2 ? (
                t("common.cancel")
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                  {t("common.back")}
                </>
              )}
            </button>

            <button
              type="button"
              className="rsp-wizard-nav-btn rsp-wizard-nav-btn--next"
              onClick={handleNext}
              disabled={!canProceed}
              aria-busy={state.isSubmitting}
            >
              {state.isSubmitting ? (
                <>
                  <span className="rsp-wizard-spinner" aria-hidden="true" />
                  {t("common.processing")}
                </>
              ) : state.currentStep === 3 ? (
                t("wizard.confirmBooking")
              ) : (
                <>
                  {t("wizard.continue")}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
