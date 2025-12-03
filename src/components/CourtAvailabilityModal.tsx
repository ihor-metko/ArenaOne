"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Modal, Button, Select } from "@/components/ui";
import type { CourtAvailabilityStatus } from "@/types/court";
import { BOOKING_DURATION_OPTIONS } from "@/types/court";
import "./CourtAvailabilityModal.css";

interface CourtAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  date: string;
  hour: number;
  minute?: number; // Support 30-minute slots (0 or 30)
  courts: CourtAvailabilityStatus[];
  onSelectCourt?: (courtId: string, date: string, startTime: string, endTime: string) => void;
}

// Format time for display
function formatTime(hour: number, minute: number = 0): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

// Calculate end time given start and duration in minutes
function calculateEndTime(hour: number, minute: number, durationMinutes: number): string {
  const totalMinutes = hour * 60 + minute + durationMinutes;
  const endHour = Math.floor(totalMinutes / 60) % 24;
  const endMinute = totalMinutes % 60;
  return formatTime(endHour, endMinute);
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

interface AvailableCourt {
  id: string;
  name: string;
  slug: string | null;
  type: string | null;
  surface: string | null;
  indoor: boolean;
  defaultPriceCents: number;
}

export function CourtAvailabilityModal({
  isOpen,
  onClose,
  clubId,
  date,
  hour,
  minute = 0,
  courts,
  onSelectCourt,
}: CourtAvailabilityModalProps) {
  const t = useTranslations();
  const [duration, setDuration] = useState<number>(60); // Default 60 min
  const [availableCourts, setAvailableCourts] = useState<AvailableCourt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alternativeTimes, setAlternativeTimes] = useState<string[]>([]);

  // Calculate alternative time slots
  const calculateAlternatives = useCallback(() => {
    const alternatives: string[] = [];
    const currentTime = hour * 60 + minute;
    const businessStart = 8 * 60; // 08:00
    const businessEnd = 22 * 60; // 22:00

    // Try 30 minutes earlier
    const earlier = currentTime - 30;
    if (earlier >= businessStart && earlier + duration <= businessEnd) {
      const h = Math.floor(earlier / 60);
      const m = earlier % 60;
      alternatives.push(formatTime(h, m));
    }

    // Try 30 minutes later
    const later = currentTime + 30;
    if (later >= businessStart && later + duration <= businessEnd) {
      const h = Math.floor(later / 60);
      const m = later % 60;
      alternatives.push(formatTime(h, m));
    }

    // Try 60 minutes earlier
    const muchEarlier = currentTime - 60;
    if (muchEarlier >= businessStart && muchEarlier + duration <= businessEnd) {
      const h = Math.floor(muchEarlier / 60);
      const m = muchEarlier % 60;
      if (!alternatives.includes(formatTime(h, m))) {
        alternatives.push(formatTime(h, m));
      }
    }

    // Try 60 minutes later
    const muchLater = currentTime + 60;
    if (muchLater >= businessStart && muchLater + duration <= businessEnd) {
      const h = Math.floor(muchLater / 60);
      const m = muchLater % 60;
      if (!alternatives.includes(formatTime(h, m))) {
        alternatives.push(formatTime(h, m));
      }
    }

    setAlternativeTimes(alternatives.slice(0, 3)); // Max 3 alternatives
  }, [hour, minute, duration]);

  // Fetch available courts for the selected duration
  const fetchAvailableCourts = useCallback(async () => {
    if (!isOpen || !clubId) return;

    setIsLoading(true);
    setError(null);

    try {
      const startTime = formatTime(hour, minute);
      const response = await fetch(
        `/api/clubs/${clubId}/available-courts?date=${date}&start=${startTime}&duration=${duration}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch available courts");
      }

      const data = await response.json();
      setAvailableCourts(data.availableCourts || []);

      // If no courts available, calculate alternative times
      if (data.availableCourts?.length === 0) {
        calculateAlternatives();
      } else {
        setAlternativeTimes([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setAvailableCourts([]);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, clubId, date, hour, minute, duration, calculateAlternatives]);

  // Fetch available courts when modal opens or duration changes
  useEffect(() => {
    if (isOpen) {
      fetchAvailableCourts();
    }
  }, [isOpen, fetchAvailableCourts]);

  // Get status label
  const getStatusLabel = (status: "available" | "booked" | "partial" | "pending"): string => {
    switch (status) {
      case "available":
        return t("common.available");
      case "partial":
        return t("court.partiallyBooked");
      case "booked":
        return t("common.booked");
      case "pending":
        return t("court.pending");
    }
  };

  const handleSelectCourt = (courtId: string) => {
    if (onSelectCourt) {
      const startTime = formatTime(hour, minute);
      const endTime = calculateEndTime(hour, minute, duration);
      onSelectCourt(courtId, date, startTime, endTime);
    }
  };

  const handleDurationChange = (value: string) => {
    setDuration(parseInt(value, 10));
  };

  const startTime = formatTime(hour, minute);
  const endTime = calculateEndTime(hour, minute, duration);

  const sortedCourts = [...courts].sort((a, b) => {
    // Sort by status: available first, then partial, then pending, then booked
    const statusOrder: Record<string, number> = { available: 0, partial: 1, pending: 2, booked: 3 };
    return (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("court.availability")}
    >
      <div className="tm-court-availability-modal">
        <div className="tm-court-availability-header">
          <p className="tm-court-availability-title">
            {formatDate(date)}
          </p>
          <p className="tm-court-availability-subtitle">
            {startTime} - {endTime}
          </p>
        </div>

        {/* Duration selector */}
        <div className="tm-court-duration-selector">
          <Select
            id="duration-select"
            label={t("common.duration")}
            options={BOOKING_DURATION_OPTIONS.map((mins) => ({
              value: String(mins),
              label: `${mins} ${t("common.minutes")}`,
            }))}
            value={String(duration)}
            onChange={handleDurationChange}
            disabled={isLoading}
          />
        </div>

        {isLoading ? (
          <div className="tm-court-availability-loading">
            <span>{t("common.loading")}</span>
          </div>
        ) : error ? (
          <div className="tm-court-availability-error">
            <p>{error}</p>
            <Button variant="outline" onClick={fetchAvailableCourts}>
              {t("common.error")}
            </Button>
          </div>
        ) : courts.length === 0 ? (
          <div className="tm-court-availability-empty">
            <p className="tm-court-availability-empty-text">
              {t("court.noCourtsFound")}
            </p>
          </div>
        ) : (
          <div className="tm-court-availability-list" role="list">
            {sortedCourts.map((court) => {
              // Check if this court is available for the selected duration
              const isAvailableForDuration = availableCourts.some(c => c.id === court.courtId);
              const effectiveStatus = isAvailableForDuration ? "available" : court.status;

              return (
                <div
                  key={court.courtId}
                  className={`tm-court-availability-item tm-court-availability-item--${effectiveStatus}`}
                  role="listitem"
                >
                  <div className="tm-court-info">
                    <div className="tm-court-name">{court.courtName}</div>
                    <div className="tm-court-meta">
                      {court.courtType && (
                        <span className="tm-court-badge">{court.courtType}</span>
                      )}
                      <span
                        className={`tm-court-badge ${
                          court.indoor
                            ? "tm-court-badge--indoor"
                            : "tm-court-badge--outdoor"
                        }`}
                      >
                        {court.indoor ? t("common.indoor") : t("common.outdoor")}
                      </span>
                    </div>
                  </div>
                  <div className="tm-court-status">
                    <span
                      className={`tm-court-status-badge tm-court-status-badge--${effectiveStatus}`}
                    >
                      {getStatusLabel(effectiveStatus)}
                    </span>
                    {isAvailableForDuration && onSelectCourt && (
                      <Button
                        className="tm-court-book-btn"
                        onClick={() => handleSelectCourt(court.courtId)}
                        aria-label={`${t("booking.book")} ${court.courtName}`}
                      >
                        {t("booking.book")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Show alternatives when no courts are available */}
        {!isLoading && availableCourts.length === 0 && courts.length > 0 && (
          <div className="tm-court-alternatives">
            <p className="text-sm text-center mt-4 opacity-70">
              {t("court.noAvailableForDuration", { duration })}
            </p>
            {alternativeTimes.length > 0 && (
              <div className="tm-court-alternatives-list">
                <p className="text-sm font-medium mt-2">
                  {t("court.tryAlternativeTimes")}
                </p>
                <div className="tm-court-alternatives-times">
                  {alternativeTimes.map((time) => (
                    <span key={time} className="tm-court-alternative-time">
                      {time}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
