"use client";

import { useTranslations } from "next-intl";
import { formatPrice } from "@/utils/price";
import type { WizardCourt } from "./types";

interface Step2CourtsProps {
  courts: WizardCourt[];
  selectedCourtId: string | null;
  onSelectCourt: (court: WizardCourt) => void;
  isLoading: boolean;
  error: string | null;
  selectedDate: string;
  selectedTime: string;
}

/**
 * Step 2: Court Selection for Timeline Booking
 * 
 * Displays available courts for the selected time slot from the weekly timeline.
 * Shows court details including name, type, surface, indoor/outdoor status, and price.
 */
export function Step2Courts({
  courts,
  selectedCourtId,
  onSelectCourt,
  isLoading,
  error,
  selectedDate,
  selectedTime,
}: Step2CourtsProps) {
  const t = useTranslations();

  if (isLoading) {
    return (
      <div className="rsp-wizard-step-content">
        <div className="rsp-wizard-loading" aria-busy="true" aria-live="polite">
          <div className="rsp-wizard-spinner" role="progressbar" />
          <span className="rsp-wizard-loading-text">{t("wizard.loadingCourts")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rsp-wizard-step-content">
        <div className="rsp-wizard-alert rsp-wizard-alert--error" role="alert">
          {error}
        </div>
      </div>
    );
  }

  const availableCourts = courts.filter((c) => c.available !== false);
  const unavailableCourts = courts.filter((c) => c.available === false);

  // Format the selected date/time for display
  const formatDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="rsp-wizard-step-content" role="group" aria-labelledby="step2-title">
      <h3 id="step2-title" className="sr-only">
        {t("wizard.step2Title")}
      </h3>

      {/* Show selected time slot info */}
      <div className="rsp-timeline-booking-slot-info">
        <span className="rsp-timeline-booking-slot-label">{t("timelineBooking.selectedSlot")}:</span>
        <span className="rsp-timeline-booking-slot-value">
          {formatDate(selectedDate)} • {selectedTime}
        </span>
      </div>

      {courts.length === 0 ? (
        <div className="rsp-wizard-alert rsp-wizard-alert--error" role="alert">
          {t("booking.quickBooking.noCourtsAvailable")}
          <p className="mt-1 text-xs opacity-70">
            {t("booking.quickBooking.tryAnotherTime")}
          </p>
        </div>
      ) : (
        <>
          <div className="rsp-wizard-courts-header">
            <span className="rsp-wizard-courts-title">
              {t("wizard.selectCourt")}
            </span>
            <span className="rsp-wizard-courts-count" aria-live="polite">
              {t("wizard.availableCount", { count: availableCourts.length })}
            </span>
          </div>

          <div
            className="rsp-wizard-courts-grid"
            role="listbox"
            aria-label={t("wizard.selectCourt")}
            aria-multiselectable="false"
          >
            {/* Available courts first */}
            {availableCourts.map((court) => (
              <CourtCard
                key={court.id}
                court={court}
                isSelected={selectedCourtId === court.id}
                onSelect={() => onSelectCourt(court)}
              />
            ))}

            {/* Unavailable courts */}
            {unavailableCourts.map((court) => (
              <CourtCard
                key={court.id}
                court={court}
                isSelected={false}
                onSelect={() => {}}
                disabled
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface CourtCardProps {
  court: WizardCourt;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function CourtCard({ court, isSelected, onSelect, disabled = false }: CourtCardProps) {
  const t = useTranslations();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={`rsp-wizard-court-card ${
        isSelected ? "rsp-wizard-court-card--selected" : ""
      } ${disabled ? "rsp-wizard-court-card--disabled" : ""}`}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={handleKeyDown}
    >
      <div className="rsp-wizard-court-card-header">
        <span className="rsp-wizard-court-card-name">{court.name}</span>
        <span className="rsp-wizard-court-card-check" aria-hidden="true">
          {isSelected && (
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
          )}
        </span>
      </div>

      <div className="rsp-wizard-court-badges">
        {court.type && (
          <span className="rsp-wizard-court-badge">{court.type}</span>
        )}
        {court.surface && (
          <span className="rsp-wizard-court-badge">{court.surface}</span>
        )}
        <span className={`rsp-wizard-court-badge ${court.indoor ? "rsp-wizard-court-badge--indoor" : ""}`}>
          {court.indoor ? t("common.indoor") : t("common.outdoor")}
        </span>
      </div>

      {disabled ? (
        <span className="rsp-wizard-court-card-unavailable">
          {court.unavailableReason || t("wizard.courtUnavailable")}
        </span>
      ) : (
        <span className="rsp-wizard-court-card-price">
          {court.priceCents !== undefined
            ? formatPrice(court.priceCents)
            : `${formatPrice(court.defaultPriceCents)} ${t("common.perHour")}`}
        </span>
      )}
    </div>
  );
}
